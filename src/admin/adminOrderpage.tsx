import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineReceiptRefund,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi2";
import {
  type Order,
  type OrderStatus,
  ORDER_STATUS_META,
} from "../types/order";
import { CATEGORY_LABELS } from "../types/adminTypes";

// ── Next valid status map ──────────────────────────────────────────────────────
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:    "processing",
  processing: "completed",
  completed:  "dispatched",
  dispatched: "delivered",
};

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:    "Mark as Processing",
  processing: "Mark as Completed",
  completed:  "Mark as Dispatched",
  dispatched: "Mark as Delivered",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (ts?: { seconds: number }) => {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ── Order row ─────────────────────────────────────────────────────────────────
const OrderRow = ({ order }: { order: Order }) => {
  const [expanded,  setExpanded]  = useState(false);
  const [updating,  setUpdating]  = useState(false);

  const meta       = ORDER_STATUS_META[order.status];
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel  = NEXT_STATUS_LABEL[order.status];

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status:    nextStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Order moved to ${ORDER_STATUS_META[nextStatus].label}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      className="rounded-2xl border border-white/5 bg-[#111111] overflow-hidden"
    >
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/3 transition-all"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Item thumbnails */}
        <div className="flex items-center -space-x-2 flex-shrink-0">
          {order.items.slice(0, 3).map((item, i) => (
            <div
              key={`${item.itemId}-${i}`}
              className="w-9 h-9 rounded-xl overflow-hidden border-2 border-[#111111] bg-white/10 flex-shrink-0"
            >
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-white/5" />
              }
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="w-9 h-9 rounded-xl border-2 border-[#111111] bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="font-body text-[10px] text-gray-500">+{order.items.length - 3}</span>
            </div>
          )}
        </div>

        {/* Customer + order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-body text-sm font-semibold text-white truncate">
              {order.delivery.customerName}
            </p>
            <p className="font-tertiary text-[10px] text-gray-600">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <p className="font-body text-xs text-gray-500 truncate mt-0.5">
            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(" · ")}
          </p>
          <p className="font-tertiary text-[10px] text-gray-600 mt-0.5">
            {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Status + total */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="font-secondary text-base text-white hidden sm:block">
            Ksh {order.total.toLocaleString()}
          </p>
          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-tertiary tracking-wide hidden md:inline-flex ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          {expanded
            ? <HiOutlineChevronUp size={16} className="text-gray-600" />
            : <HiOutlineChevronDown size={16} className="text-gray-600" />
          }
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-5 py-5 space-y-5">

              {/* Items list */}
              <div>
                <p className="font-tertiary text-[10px] text-gray-600 tracking-widest uppercase mb-3">
                  Items
                </p>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={`${item.itemId}-${i}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-white truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-tertiary text-[10px] text-gray-600">
                            {CATEGORY_LABELS[item.category]} × {item.quantity}
                          </p>
                          {item.selectedColor && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/10"
                              style={{ backgroundColor: item.selectedColor.hex }}
                              title={item.selectedColor.name}
                            />
                          )}
                          {item.selectedSize && (
                            <span className="font-tertiary text-[10px] text-gray-600">{item.selectedSize}</span>
                          )}
                        </div>
                      </div>
                      <p className="font-body text-sm text-white flex-shrink-0">
                        Ksh {item.subtotal.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
                  <p className="font-body text-sm text-gray-500">Total</p>
                  <p className="font-secondary text-lg text-white">Ksh {order.total.toLocaleString()}</p>
                </div>
              </div>

              {/* Delivery + payment grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/3 rounded-xl p-4 space-y-2">
                  <p className="font-tertiary text-[10px] text-gray-600 tracking-widest uppercase mb-2">
                    Delivery
                  </p>
                  <p className="font-body text-sm text-white">{order.delivery.customerName}</p>
                  <div className="flex items-center gap-1.5">
                    <HiOutlinePhone size={12} className="text-gray-600" />
                    <p className="font-body text-xs text-gray-400">{order.delivery.customerPhone}</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <HiOutlineMapPin size={12} className="text-gray-600 mt-0.5 flex-shrink-0" />
                    <p className="font-body text-xs text-gray-400">{order.delivery.deliveryAddress}</p>
                  </div>
                  {order.delivery.deliveryNotes && (
                    <p className="font-body text-xs text-gray-600 italic">"{order.delivery.deliveryNotes}"</p>
                  )}
                  {order.fulfillingBranch && (
                    <p className="font-tertiary text-[10px] text-[rgb(128,255,0)] mt-1">
                      Branch: {order.fulfillingBranch.branchName}
                    </p>
                  )}
                </div>

                <div className="bg-white/3 rounded-xl p-4 space-y-2">
                  <p className="font-tertiary text-[10px] text-gray-600 tracking-widest uppercase mb-2">
                    Payment
                  </p>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-tertiary ${
                    order.paymentStatus === "completed"
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : order.paymentStatus === "failed"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                    {order.paymentStatus === "completed" ? "Payment confirmed"
                     : order.paymentStatus === "failed" ? "Payment failed"
                     : "Awaiting payment"}
                  </div>
                  {order.mpesaReceiptNo && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <HiOutlineReceiptRefund size={12} className="text-gray-600" />
                      <p className="font-body text-xs text-gray-400">
                        Receipt: <span className="text-white font-semibold">{order.mpesaReceiptNo}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status advance button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-tertiary tracking-wide ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                  {nextStatus && (
                    <span className="text-gray-600 text-xs">→</span>
                  )}
                  {nextStatus && (
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-tertiary tracking-wide opacity-40 ${ORDER_STATUS_META[nextStatus].bg} ${ORDER_STATUS_META[nextStatus].color}`}>
                      {ORDER_STATUS_META[nextStatus].label}
                    </span>
                  )}
                </div>

                {nextStatus && nextLabel && (
                  <button
                    onClick={handleAdvanceStatus}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(128,255,0)] text-black font-body text-xs font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <div className="h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    ) : null}
                    {nextLabel}
                  </button>
                )}

                {!nextStatus && (
                  <span className="font-tertiary text-[10px] text-gray-600 tracking-wide">
                    Order complete
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main admin orders page ─────────────────────────────────────────────────────
export const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener — all orders newest first
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Group counts for summary pills
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white font-body text-sm transition-colors group"
          >
            <HiOutlineArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Dashboard
          </button>
          <span className="text-white/10">/</span>
          <p className="font-secondary text-xl text-white">Orders</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgb(128,255,0)]/10 border border-[rgb(128,255,0)]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[rgb(128,255,0)] animate-pulse" />
            <span className="font-tertiary text-[10px] text-[rgb(128,255,0)] tracking-widest uppercase">Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Summary pills */}
        {!loading && orders.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <span className="font-tertiary text-[10px] text-gray-400 tracking-wide">
                Total: <span className="text-white font-semibold">{orders.length}</span>
              </span>
            </div>
            {(["pending", "processing", "completed", "dispatched", "delivered"] as OrderStatus[])
              .filter((s) => counts[s])
              .map((s) => {
                const m = ORDER_STATUS_META[s];
                return (
                  <div key={s} className={`px-3 py-1.5 rounded-xl border text-[10px] font-tertiary tracking-wide ${m.bg} ${m.color}`}>
                    {m.label}: {counts[s]}
                  </div>
                );
              })}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <p className="font-secondary text-2xl text-gray-600 mb-2">No orders yet</p>
            <p className="font-body text-sm text-gray-700">Orders will appear here once customers start purchasing.</p>
          </div>
        )}

        {/* Orders list */}
        {!loading && orders.length > 0 && (
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.04 } },
            }}
          >
            {orders.map((order) => (
              <motion.div
                key={order.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
                }}
              >
                <OrderRow order={order} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};