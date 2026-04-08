import * as admin from "firebase-admin";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";


admin.initializeApp();
const db = admin.firestore();

const REGION = "europe-west3";

const DARAJA_BASE = "https://sandbox.safaricom.co.ke";


const CONSUMER_KEY    = defineSecret("MPESA_CONSUMER_KEY");
const CONSUMER_SECRET = defineSecret("MPESA_CONSUMER_SECRET");
const SHORTCODE       = defineSecret("MPESA_SHORTCODE");
const PASSKEY         = defineSecret("MPESA_PASSKEY");


const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0"))   return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  return digits; // already clean
};


const getAccessToken = async (
  consumerKey: string,
  consumerSecret: string
): Promise<string> => {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const { data } = await axios.get(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      timeout: 10_000,
    }
  );

  return data.access_token as string;
};


const buildPassword = (
  shortcode: string,
  passkey: string
): { password: string; timestamp: string } => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14); // "20240315143022"

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  return { password, timestamp };
};


export const initiateSTKPush = onCall(
  {
    region:  REGION,
    secrets: [CONSUMER_KEY, CONSUMER_SECRET, SHORTCODE, PASSKEY],

  },
  async (request) => {
    // Enforce authentication — only signed-in users can place orders
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in to place an order.");
    }

    const { phone, amount, orderId } = request.data as {
      phone:   string;
      amount:  number;
      orderId: string;
    };

    // Basic input validation
    if (!phone || !amount || !orderId) {
      throw new HttpsError(
        "invalid-argument",
        "phone, amount and orderId are all required."
      );
    }
    if (amount <= 0) {
      throw new HttpsError("invalid-argument", "amount must be greater than 0.");
    }

    const shortcode = SHORTCODE.value();

    try {
      // Step 1 — get access token
      const accessToken = await getAccessToken(
        CONSUMER_KEY.value(),
        CONSUMER_SECRET.value()
      );

      // Step 2 — build password + timestamp
      const { password, timestamp } = buildPassword(shortcode, PASSKEY.value());

      // Step 3 — send STK push request to Daraja sandbox
      const { data } = await axios.post(
        `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: shortcode,
          Password:          password,
          Timestamp:         timestamp,
          TransactionType:   "CustomerPayBillOnline",
          Amount:            Math.ceil(amount), // Daraja requires a whole number
          PartyA:            formatPhone(phone),
          PartyB:            shortcode,
          PhoneNumber:       formatPhone(phone),
          CallBackURL:       `https://${REGION}-neovision-22326.cloudfunctions.net/mpesaCallback`,
          AccountReference:  `NeoVision-${orderId.slice(0, 8).toUpperCase()}`,
          TransactionDesc:   "NeoVision Eyewear Order",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 15_000,
        }
      );

      // Step 4 — persist CheckoutRequestID on the order for callback matching
      await db.collection("orders").doc(orderId).update({
        checkoutRequestId: data.CheckoutRequestID,
        updatedAt:         admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success:           true,
        checkoutRequestId: data.CheckoutRequestID as string,
      };

    } catch (error: unknown) {
      console.error("[initiateSTKPush] Error:", error);

     
      const darajaMessage =
        (error as { response?: { data?: { errorMessage?: string } } })
          ?.response?.data?.errorMessage;

      throw new HttpsError(
        "internal",
        darajaMessage ?? "Failed to initiate M-Pesa payment. Please try again."
      );
    }
  }
);

export const mpesaCallback = onRequest(
  {
    region:  REGION,
    secrets: [], 
  },
  async (req, res) => {
    // Safaricom always sends POST
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const stkCallback = req.body?.Body?.stkCallback;

      if (!stkCallback) {
        console.error("[mpesaCallback] Missing stkCallback in body:", req.body);
        res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });
        return;
      }

      const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;

      
      const snapshot = await db
        .collection("orders")
        .where("checkoutRequestId", "==", CheckoutRequestID)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.error("[mpesaCallback] No order found for CheckoutRequestID:", CheckoutRequestID);
        res.status(404).json({ ResultCode: 1, ResultDesc: "Order not found" });
        return;
      }

      const orderRef = snapshot.docs[0].ref;

      if (ResultCode === 0) {
        
        const metaItems: { Name: string; Value: unknown }[] =
          CallbackMetadata?.Item ?? [];

        const receiptNo = metaItems.find(
          (item) => item.Name === "MpesaReceiptNumber"
        )?.Value as string | null ?? null;

        const amount = metaItems.find(
          (item) => item.Name === "Amount"
        )?.Value as number | null ?? null;

        console.info(
          `[mpesaCallback] Payment confirmed — Order: ${orderRef.id}, Receipt: ${receiptNo}, Amount: ${amount}`
        );

        await orderRef.update({
          paymentStatus:  "completed",
          mpesaReceiptNo: receiptNo,
          status:         "pending", 
          updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
        });

      } else {
       
        console.warn(
          `[mpesaCallback] Payment failed — CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`
        );

        await orderRef.update({
          paymentStatus: "failed",
          updatedAt:     admin.firestore.FieldValue.serverTimestamp(),
        });
      }

     
      res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    } catch (error) {
      console.error("[mpesaCallback] Unexpected error:", error);
     
      res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }
  }
);
