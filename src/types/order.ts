import { type Category, type ProductColor, type FrameSize } from "./adminTypes";

// ─── Order Status ─────────────────────────────────────────────────────────────
// Full lifecycle: placed → payment confirmed → admin processes → ships → done

export type OrderStatus =
  | "pending"     // Order placed, awaiting payment confirmation by admin
  | "processing"  // Payment confirmed, order being prepared/sourced
  | "completed"   // Order is packed and ready
  | "dispatched"  // Order handed to delivery
  | "delivered";  // Customer has received the order

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentMethod = "mpesa";

export type PaymentStatus =
  | "pending"    // STK push sent, customer hasn't entered PIN yet
  | "completed"  // M-Pesa payment confirmed via Daraja callback
  | "failed";    // STK push timed out or customer cancelled

// ─── Order Item ───────────────────────────────────────────────────────────────
// Snapshot of cart item at time of order — frozen so price/name changes
// on the product don't affect historical orders

export interface OrderItem {
  itemId:        string;
  name:          string;
  price:         number;         // Price per unit at time of order (Ksh)
  imageUrl:      string;
  category:      Category;
  quantity:      number;
  selectedColor: ProductColor | null;
  selectedSize:  FrameSize | null;
  subtotal:      number;         // price × quantity, pre-computed for admin display
}

// ─── Delivery Details ─────────────────────────────────────────────────────────

export interface DeliveryDetails {
  customerName:    string;
  customerPhone:   string;  // Format sent to Daraja: 2547XXXXXXXX
  deliveryAddress: string;
  deliveryNotes:   string;  // Gate number, landmark, etc.
}

// ─── Fulfilling Branch ────────────────────────────────────────────────────────
// The branch whose stock is decremented for this order.
// Auto-selected at order creation time (highest combined stock).

export interface FulfillingBranch {
  branchId:   string;
  branchName: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
// Stored at: orders/{orderId}

export interface Order {
  id:               string;
  customerId:       string;         // Firebase Auth UID
  customerEmail:    string;
  delivery:         DeliveryDetails;
  items:            OrderItem[];
  fulfillingBranch: FulfillingBranch;
  paymentMethod:    PaymentMethod;
  paymentStatus:    PaymentStatus;
  mpesaReceiptNo:   string | null;  // Filled by Daraja callback
  checkoutRequestId: string | null; // Daraja CheckoutRequestID for polling
  total:            number;
  status:           OrderStatus;
  createdAt?:       { seconds: number; nanoseconds: number };
  updatedAt?:       { seconds: number; nanoseconds: number };
}

// ─── Checkout Form ────────────────────────────────────────────────────────────

export interface CheckoutFormData {
  customerName:    string;
  customerPhone:   string;
  deliveryAddress: string;
  deliveryNotes:   string;
}

export const EMPTY_CHECKOUT_FORM: CheckoutFormData = {
  customerName:    "",
  customerPhone:   "",
  deliveryAddress: "",
  deliveryNotes:   "",
};

// ─── Order Status Meta ────────────────────────────────────────────────────────
// Labels and colours for displaying status badges in admin + customer views

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending:    { label: "Pending",    color: "text-amber-600",  bg: "bg-amber-50 border-amber-200"  },
  processing: { label: "Processing", color: "text-blue-600",   bg: "bg-blue-50 border-blue-200"    },
  completed:  { label: "Completed",  color: "text-green-600",  bg: "bg-green-50 border-green-200"  },
  dispatched: { label: "Dispatched", color: "text-purple-600", bg: "bg-purple-50 border-purple-200"},
  delivered:  { label: "Delivered",  color: "text-gray-600",   bg: "bg-gray-50 border-gray-200"    },
};