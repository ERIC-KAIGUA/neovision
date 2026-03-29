import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "./header";
import { Footer } from "./footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
} from "react-icons/hi2";
import { CATEGORY_LABELS } from "../types/adminTypes";
import {
  type CheckoutFormData,
  type OrderItem,
  EMPTY_CHECKOUT_FORM,
} from "../types/order";
import { pickFulfillingBranch, decrementStockTransaction } from "../utils/stockHelpers";
import { getDocs } from "firebase/firestore";

// ── Form field component ──────────────────────────────────────────────────────
const Field = ({
  label,
  hint,
  icon,
  error,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="font-tertiary text-[10px] tracking-widest text-black uppercase block mb-1.5">
      {label}
    </label>
    <div className={`relative ${icon ? "flex items-center" : ""}`}>
      {icon && (
        <span className="absolute left-3 text-gray-300 pointer-events-none">
          {icon}
        </span>
      )}
      {children}
    </div>
    {hint && !error && (
      <p className="font-body text-xs text-gray-400 mt-1">{hint}</p>
    )}
    {error && (
      <p className="font-body text-xs text-red-500 mt-1">{error}</p>
    )}
  </div>
);

const INPUT_CLS = (hasIcon: boolean, hasError: boolean) =>
  `w-full border rounded-xl font-body text-sm text-black placeholder-gray-300 focus:outline-none transition-all py-3 pr-4 ${
    hasIcon ? "pl-9" : "pl-4"
  } ${
    hasError
      ? "border-red-300 focus:border-red-400 bg-red-50/30"
      : "border-gray-500 shadow-sm focus:border-black bg-white"
  }`;

// ── Payment status overlay ────────────────────────────────────────────────────
const PaymentOverlay = ({
  status,
  orderId,
  total,
  onRetry,
}: {
  status: "waiting" | "completed" | "failed";
  orderId: string;
  total: number;
  onRetry: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="max-w-sm w-full text-center"
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {status === "waiting" && (
          <>
            <div className="w-20 h-20 rounded-full border-4 border-gray-00 border-t-black animate-spin mx-auto mb-6" />
            <h2 className="font-secondary text-2xl text-black mb-2">
              Waiting for Payment
            </h2>
            <p className="font-body text-gray-500 text-sm mb-2">
              An M-Pesa prompt has been sent to your phone.
            </p>
            <p className="font-body text-gray-400 text-sm">
              Enter your PIN to complete payment of{" "}
              <span className="text-black font-semibold">
                Ksh {total.toLocaleString()}
              </span>
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 w-fit mx-auto">
              <HiOutlineClock size={14} className="text-gray-400" />
              <p className="font-tertiary text-[11px] text-gray-500 tracking-wide">
                This prompt expires in 60 seconds
              </p>
            </div>
          </>
        )}

        {status === "completed" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6"
            >
              <HiOutlineCheckCircle size={40} className="text-green-500" />
            </motion.div>
            <h2 className="font-secondary text-3xl text-black mb-2">
              Order Placed!
            </h2>
            <p className="font-body text-gray-500 text-sm mb-1">
              Payment confirmed. Your order is now in our queue.
            </p>
            <p className="font-tertiary text-[10px] text-gray-400 tracking-widest uppercase mb-8">
              Order ID: {orderId.slice(0, 8).toUpperCase()}
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="w-full py-3.5 rounded-2xl bg-black text-white font-body font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              Continue Shopping
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-6"
            >
              <HiOutlineXCircle size={40} className="text-red-400" />
            </motion.div>
            <h2 className="font-secondary text-3xl text-black mb-2">
              Payment Failed
            </h2>
            <p className="font-body text-gray-500 text-sm mb-8">
              The M-Pesa prompt was cancelled or timed out. Your order has not been placed.
            </p>
            <button
              onClick={onRetry}
              className="w-full py-3.5 rounded-2xl bg-black text-white font-body font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all mb-3"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-body text-sm hover:border-gray-400 transition-all"
            >
              Back to Cart
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ── Main checkout page ────────────────────────────────────────────────────────
export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState<CheckoutFormData>(EMPTY_CHECKOUT_FORM);
  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  // Payment state
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "completed" | "failed" | null>(null);

  // Redirect if cart is empty or not signed in
  useEffect(() => {
    if (cartItems.length === 0) navigate("/shoppage");
    if (!user) navigate("/cart");
  }, [cartItems, user, navigate]);

  // Real-time listener — watches order doc for payment confirmation from callback
  useEffect(() => {
    if (!pendingOrderId) return;

    const unsub = onSnapshot(
      doc(db, "orders", pendingOrderId),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (data.paymentStatus === "completed") {
          setPaymentStatus("completed");
          clearCart();
          toast.success("Payment confirmed! Order placed.");
        } else if (data.paymentStatus === "failed") {
          setPaymentStatus("failed");
          toast.error("Payment failed. Please try again.");
        }
      }
    );

    return () => unsub();
  }, [pendingOrderId, clearCart]);

  // ── Form field update ──────────────────────────────────────────────────────
  const update = (field: keyof CheckoutFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Partial<CheckoutFormData> = {};
    if (!form.customerName.trim())
      newErrors.customerName = "Full name is required";
    if (!form.customerPhone.trim())
      newErrors.customerPhone = "Phone number is required";
    else if (!/^(07|01|2547|2541|\+2547|\+2541)\d{7,8}$/.test(form.customerPhone.replace(/\s/g, "")))
      newErrors.customerPhone = "Enter a valid Safaricom number (e.g. 0712 345 678)";
    if (!form.deliveryAddress.trim())
      newErrors.deliveryAddress = "Delivery address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit — create order + trigger STK push ───────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validate() || !user) return;
    setSubmitting(true);

    const toastId = toast.loading("Placing your order…");

    try {
      // 1. Fetch stock data for all cart items to pick best branch
      const stockMap: Record<string, Record<string, number>> = {};
      await Promise.all(
        cartItems.map(async (item) => {
          const snap = await getDocs(
            collection(db, "menuItems", item.category, "products")
          );
          snap.docs.forEach((d) => {
            if (d.id === item.itemId) {
              stockMap[item.itemId] = d.data()?.stock ?? {};
            }
          });
        })
      );

      // 2. Pick fulfilling branch
      const fulfillingBranch = pickFulfillingBranch(cartItems, stockMap);

      // 3. Build order items snapshot
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        itemId:        item.itemId,
        name:          item.name,
        price:         item.price,
        imageUrl:      item.imageUrl,
        category:      item.category,
        quantity:      item.quantity,
        selectedColor: item.selectedColor,
        selectedSize:  item.selectedSize,
        subtotal:      item.price * item.quantity,
      }));

      // 4. Write order to Firestore with paymentStatus: "pending"
      const orderRef = await addDoc(collection(db, "orders"), {
        customerId:        user.uid,
        customerEmail:     user.email ?? "",
        delivery: {
          customerName:    form.customerName.trim(),
          customerPhone:   form.customerPhone.trim(),
          deliveryAddress: form.deliveryAddress.trim(),
          deliveryNotes:   form.deliveryNotes.trim(),
        },
        items:             orderItems,
        fulfillingBranch,
        paymentMethod:     "mpesa",
        paymentStatus:     "pending",
        mpesaReceiptNo:    null,
        checkoutRequestId: null,
        total:             cartTotal,
        status:            "pending",
        createdAt:         serverTimestamp(),
        updatedAt:         serverTimestamp(),
      });

      // 5. Decrement stock atomically
      await decrementStockTransaction(db, cartItems, fulfillingBranch.branchId);

      // 6. Trigger STK push via Firebase Function
      const functions = getFunctions(undefined, "europe-west3");
      const initiateSTKPush = httpsCallable(functions, "initiateSTKPush");
      await initiateSTKPush({
        phone:    form.customerPhone.trim(),
        amount:   cartTotal,
        orderId:  orderRef.id,
      });

      setPendingOrderId(orderRef.id);
      setPaymentStatus("waiting");
      toast.dismiss(toastId);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong. Please try again.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setPendingOrderId(null);
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="bg-white min-h-screen">
      <Header />

      {/* Payment overlay */}
      <AnimatePresence>
        {paymentStatus && pendingOrderId && (
          <PaymentOverlay
            status={paymentStatus}
            orderId={pendingOrderId}
            total={cartTotal}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>

      <div className="pt-28 max-w-5xl mx-auto px-6 md:px-10 pb-16">

        {/* Page header */}
        <div className="py-8">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center gap-1.5 bg-black text-white px-6 py-3 font-display rounded-xs text-sm transition-colors group mb-4"
          >
            <HiOutlineArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to cart
          </button>
          <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-2">
            Almost there
          </p>
          <h1 className="font-secondary text-5xl text-black">Checkout</h1>
          <p className="font-body text-gray-400 mt-1">Fill in your delivery details to place your order.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT — Form ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery details card */}
            <div className="rounded-2xl border border-gray-700 shadow-lg p-6">
              <p className="font-secondary text-xl text-black mb-5">Delivery Details</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Full Name"
                  icon={<HiOutlineUser size={15} />}
                  error={errors.customerName}
                >
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => update("customerName", e.target.value)}
                    placeholder="John Kamau"
                    className={INPUT_CLS(true, !!errors.customerName)}
                  />
                </Field>

                <Field
                  label="M-Pesa Phone Number"
                  hint="The number that will receive the STK push"
                  icon={<HiOutlinePhone size={15} />}
                  error={errors.customerPhone}
                >
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => update("customerPhone", e.target.value)}
                    placeholder="0712 345 678"
                    className={INPUT_CLS(true, !!errors.customerPhone)}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field
                  label="Delivery Address"
                  hint="Estate, street, building name"
                  icon={<HiOutlineMapPin size={15} />}
                  error={errors.deliveryAddress}
                >
                  <input
                    type="text"
                    value={form.deliveryAddress}
                    onChange={(e) => update("deliveryAddress", e.target.value)}
                    placeholder="e.g. Westlands, Ring Road, ABC Apartments"
                    className={INPUT_CLS(true, !!errors.deliveryAddress)}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field
                  label="Delivery Notes"
                  hint="Gate number, landmark, or any helpful instructions"
                  icon={<HiOutlineChatBubbleBottomCenterText size={15} />}
                >
                  <textarea
                    value={form.deliveryNotes}
                    onChange={(e) => update("deliveryNotes", e.target.value)}
                    placeholder="e.g. Blue gate, next to Equity Bank"
                    rows={3}
                    className={`${INPUT_CLS(true, false)} resize-none`}
                  />
                </Field>
              </div>
            </div>

            {/* Payment method card */}
            <div className="rounded-2xl border border-gray-100 p-6">
              <p className="font-secondary text-xl text-black mb-4">Payment Method</p>

              {/* M-Pesa option — only option for now */}
              <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-black bg-black/2">
                <div className="w-12 h-12 rounded-xl bg-[#4CAF50] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs font-body">M-PESA</span>
                </div>
                <div className="flex-1">
                  <p className="font-body font-semibold text-black text-sm">M-Pesa (STK Push)</p>
                  <p className="font-body text-gray-500 text-xs">You'll receive a payment prompt on your phone</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>

              <p className="font-body text-xs text-gray-400 mt-3 leading-relaxed">
                After clicking "Pay", enter your M-Pesa PIN on the prompt sent to your phone to complete payment.
              </p>
            </div>
          </div>

          {/* ── RIGHT — Order summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-2xl border border-gray-700 shadow-lg overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-700">
                <p className="font-secondary text-lg text-black">Order Summary</p>
              </div>

              {/* Items */}
              <div className="px-5 py-3 space-y-3 max-h-72 overflow-y-auto">
                {cartItems.map((item) => {
                  const key = `${item.itemId}-${item.selectedColor?.hex ?? "none"}-${item.selectedSize ?? "none"}`;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-xs font-semibold text-black truncate">{item.name}</p>
                        <p className="font-tertiary text-[10px] text-gray-400">
                          {CATEGORY_LABELS[item.category]} × {item.quantity}
                        </p>
                        {/* Color + size */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.selectedColor && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-200"
                              style={{ backgroundColor: item.selectedColor.hex }}
                              title={item.selectedColor.name}
                            />
                          )}
                          {item.selectedSize && (
                            <span className="font-tertiary text-[9px] text-gray-400">{item.selectedSize}</span>
                          )}
                        </div>
                      </div>
                      <p className="font-body text-xs text-black flex-shrink-0 font-semibold">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-dashed border-gray-700 space-y-2">
                <div className="flex justify-between">
                  <p className="font-body text-sm text-gray-500">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</p>
                  <p className="font-body text-sm text-black">Ksh {cartTotal.toLocaleString()}</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-body text-sm text-gray-500">Delivery</p>
                  <p className="font-body text-xs text-gray-400 italic">Calculated on delivery</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-dashed border-gray-700">
                  <p className="font-body font-semibold text-black">Total</p>
                  <p className="font-secondary text-xl text-black">Ksh {cartTotal.toLocaleString()}</p>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-body font-semibold text-sm hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    `Pay Ksh ${cartTotal.toLocaleString()} with M-Pesa`
                  )}
                </button>
                <p className="font-body text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
                  By placing this order you agree to our delivery terms. Payment is processed securely via M-Pesa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};