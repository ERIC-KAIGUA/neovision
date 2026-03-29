/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineReceiptRefund,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi2";
import { LuPackageCheck, LuTruck, LuBox, LuCircleDot, LuCircleCheck } from "react-icons/lu";
import { type Order, type OrderStatus, ORDER_STATUS_META } from "../types/order";
import { CATEGORY_LABELS } from "../types/adminTypes";

// ── Status timeline config ────────────────────────────────────────────────────
const TIMELINE_STEPS: {
  status: OrderStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    status:      "pending",
    label:       "Order Placed",
    description: "Payment confirmed. Your order is in our queue.",
    icon:        <HiOutlineClock size={18} />,
  },
  {
    status:      "processing",
    label:       "Processing",
    description: "Our team is preparing and sourcing your items.",
    icon:        <LuBox size={18} />,
  },
  {
    status:      "completed",
    label:       "Ready",
    description: "Your order is packed and ready for dispatch.",
    icon:        <LuPackageCheck size={18} />,
  },
  {
    status:      "dispatched",
    label:       "Dispatched",
    description: "Your order is on its way to you.",
    icon:        <LuTruck size={18} />,
  },
  {
    status:      "delivered",
    label:       "Delivered",
    description: "Your order has been delivered. Enjoy!",
    icon:        <HiOutlineCheckCircle size={18} />,
  },
];

const STATUS_ORDER: OrderStatus[] = [
  "pending", "processing", "completed", "dispatched", "delivered",
];

const formatDate = (ts?: { seconds: number }) => {
  if (!ts) return null;
  return new Date(ts.seconds * 1000).toLocaleString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatDateShort = (ts?: { seconds: number }) => {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

// ✅ AFTER — guard check separated, state batched via single object update
useEffect(() => {
  if (!user || !orderId) {
    setNotFound(true);
    return;
  }

  const unsub = onSnapshot(
    doc(db, "orders", orderId),
    (snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = { id: snap.id, ...(snap.data() as Omit<Order, "id">) };
      if (data.customerId !== user.uid) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setOrder(data);
      setLoading(false);
    },
    (err) => {
      console.error(err);
      setNotFound(true);
      setLoading(false);
    }
  );

  return () => unsub();
}, [orderId, user?.uid]); // ← use user.uid not user object — prevents re-running when user object reference changes

  const currentStepIndex = order
    ? STATUS_ORDER.indexOf(order.status)
    : -1;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <Header />
        <div className="pt-28 max-w-2xl mx-auto px-6 py-10 animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-100 rounded-full" />
          <div className="h-4 w-32 bg-gray-100 rounded-full" />
          <div className="h-64 bg-gray-100 rounded-2xl mt-6" />
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (notFound || !order) {
    return (
      <div className="bg-white min-h-screen">
        <Header />
        <div className="pt-28 flex flex-col items-center justify-center py-28 text-center px-6">
          <p className="font-secondary text-4xl text-gray-200 mb-4">Order not found</p>
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-body text-sm hover:bg-gray-800 transition-all"
          >
            <HiOutlineArrowLeft size={16} />
            Back to orders
          </button>
        </div>
      </div>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const isDelivered = order.status === "delivered";

  return (
    <div className="bg-white min-h-screen">
      <Header />

      <div className="pt-28 max-w-2xl mx-auto px-6 md:px-10 pb-16">

        {/* Back */}
        <div className="py-5">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-black font-body text-sm transition-colors group"
          >
            <HiOutlineArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            My Orders
          </button>
        </div>

        {/* Order header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-1">
                Order Tracking
              </p>
              <h1 className="font-secondary text-3xl text-black">
                #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="font-body text-sm text-gray-400 mt-0.5">
                Placed on {formatDateShort(order.createdAt)}
              </p>
            </div>
            <span className={`mt-1 px-3 py-1.5 rounded-full border text-xs font-tertiary tracking-wide ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          </div>
        </motion.div>

        {/* ── Timeline ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <p className="font-tertiary text-[10px] tracking-widest text-gray-500 uppercase">
              Order Status
            </p>
          </div>

          <div className="px-6 py-5">
            {TIMELINE_STEPS.map((step, i) => {
              const stepIndex    = STATUS_ORDER.indexOf(step.status);
              const isDone       = stepIndex < currentStepIndex;
              const isCurrent    = stepIndex === currentStepIndex;
              const isFuture     = stepIndex > currentStepIndex;
              const isLast       = i === TIMELINE_STEPS.length - 1;

              return (
                <div key={step.status} className="flex gap-4">
                  {/* Icon + line */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={isCurrent ? { scale: 0.8 } : {}}
                      animate={isCurrent ? { scale: [0.8, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        isDone
                          ? "bg-black border-black text-white"
                          : isCurrent
                          ? "bg-black border-black text-white shadow-lg shadow-black/20"
                          : "bg-white border-gray-200 text-gray-300"
                      }`}
                    >
                      {isDone ? <LuCircleCheck size={16} /> : isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                          <LuCircleDot size={16} />
                        </motion.div>
                      ) : step.icon}
                    </motion.div>

                    {/* Connecting line */}
                    {!isLast && (
                      <div className="w-0.5 flex-1 my-1 min-h-[28px]">
                        <motion.div
                          className="w-full bg-black rounded-full"
                          initial={{ height: 0 }}
                          animate={{ height: isDone ? "100%" : "0%" }}
                          transition={{ duration: 0.5, delay: 0.2 * i }}
                          style={{ height: isDone ? "100%" : "0%" }}
                        />
                        <div
                          className="w-full bg-gray-100 rounded-full"
                          style={{ height: isDone ? "0%" : "100%", marginTop: isDone ? 0 : undefined }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-6 flex-1 ${isLast ? "pb-2" : ""}`}>
                    <div className="flex items-center justify-between">
                      <p className={`font-body text-sm font-semibold ${
                        isFuture ? "text-gray-300" : "text-black"
                      }`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="flex items-center gap-1.5 font-tertiary text-[10px] text-black tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                          Current
                        </span>
                      )}
                      {isDone && (
                        <span className="font-tertiary text-[10px] text-gray-400">
                          {/* Show updatedAt timestamp only on the last completed step */}
                          {stepIndex === currentStepIndex - 1
                            ? formatDate(order.updatedAt)
                            : null}
                        </span>
                      )}
                    </div>
                    <p className={`font-body text-xs mt-0.5 leading-relaxed ${
                      isFuture ? "text-gray-300" : "text-gray-500"
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivered celebration banner */}
          {isDelivered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-5 mb-5 px-4 py-3 rounded-xl bg-black text-white text-center"
            >
              <p className="font-secondary text-lg">Thank you for your order! 🎉</p>
              <p className="font-body text-xs text-gray-400 mt-1">
                We hope you love your NeoVision eyewear.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* ── Order details ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-4 rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <p className="font-tertiary text-[10px] tracking-widest text-gray-500 uppercase">
              Items Ordered
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item, idx) => (
              <div key={`${item.itemId}-${idx}`} className="flex items-center gap-3 px-6 py-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-100" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-black truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-tertiary text-[10px] text-gray-400">
                      {CATEGORY_LABELS[item.category]} × {item.quantity}
                    </p>
                    {item.selectedColor && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-gray-200"
                        style={{ backgroundColor: item.selectedColor.hex }}
                        title={item.selectedColor.name}
                      />
                    )}
                    {item.selectedSize && (
                      <span className="font-tertiary text-[10px] text-gray-400">{item.selectedSize}</span>
                    )}
                  </div>
                </div>
                <p className="font-body text-sm font-semibold text-black flex-shrink-0">
                  Ksh {item.subtotal.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
            <p className="font-body text-sm text-gray-500">Total paid</p>
            <p className="font-secondary text-xl text-black">Ksh {order.total.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* ── Delivery + payment info ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Delivery */}
          <div className="rounded-2xl border border-gray-100 p-5">
            <p className="font-tertiary text-[10px] tracking-widest text-gray-500 uppercase mb-3">
              Delivery Details
            </p>
            <div className="space-y-2">
              <p className="font-body text-sm font-semibold text-black">
                {order.delivery.customerName}
              </p>
              <div className="flex items-center gap-1.5">
                <HiOutlinePhone size={12} className="text-gray-400 flex-shrink-0" />
                <p className="font-body text-xs text-gray-500">{order.delivery.customerPhone}</p>
              </div>
              <div className="flex items-start gap-1.5">
                <HiOutlineMapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="font-body text-xs text-gray-500">{order.delivery.deliveryAddress}</p>
              </div>
              {order.delivery.deliveryNotes && (
                <p className="font-body text-xs text-gray-400 italic">
                  "{order.delivery.deliveryNotes}"
                </p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-gray-100 p-5">
            <p className="font-tertiary text-[10px] tracking-widest text-gray-500 uppercase mb-3">
              Payment
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#4CAF50] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-[9px] font-body">M-PESA</span>
                </div>
                <p className="font-body text-sm text-black">M-Pesa</p>
              </div>
              {order.mpesaReceiptNo && (
                <div className="flex items-center gap-1.5">
                  <HiOutlineReceiptRefund size={12} className="text-gray-400" />
                  <p className="font-body text-xs text-gray-500">
                    Receipt: <span className="font-semibold text-black">{order.mpesaReceiptNo}</span>
                  </p>
                </div>
              )}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-tertiary ${
                order.paymentStatus === "completed"
                  ? "bg-green-50 border-green-200 text-green-600"
                  : order.paymentStatus === "failed"
                  ? "bg-red-50 border-red-200 text-red-500"
                  : "bg-amber-50 border-amber-200 text-amber-600"
              }`}>
                {order.paymentStatus === "completed" ? "Payment confirmed" :
                 order.paymentStatus === "failed" ? "Payment failed" : "Awaiting payment"}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};