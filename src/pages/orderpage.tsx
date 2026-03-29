import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import {
  HiOutlineShoppingBag,
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlineReceiptRefund,
} from "react-icons/hi2";
import { type Order, ORDER_STATUS_META } from "../types/order";
import { CATEGORY_LABELS } from "../types/adminTypes";

const formatDate = (ts?: { seconds: number }) => {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect guests
  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  // Real-time listener — customer's own orders newest first
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("customerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }))
      );
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!loading && orders.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <Header />
        <div className="pt-28 flex flex-col items-center justify-center py-32 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6">
              <HiOutlineShoppingBag size={32} className="text-gray-300" />
            </div>
            <p className="font-secondary text-4xl text-black mb-2">No orders yet</p>
            <p className="font-body text-gray-400 mb-8 max-w-xs mx-auto">
              You haven't placed any orders. Browse the collection and find your perfect pair.
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-black text-white font-body font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all mx-auto"
            >
              <HiOutlineShoppingBag size={16} />
              Browse Collection
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Header />

      <div className="pt-28 max-w-3xl mx-auto px-6 md:px-10 pb-16">

        {/* Page header */}
        <div className="py-8">
          <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-2">
            Your Account
          </p>
          <h1 className="font-secondary text-5xl text-black">My Orders</h1>
          <p className="font-body text-gray-400 mt-1 text-sm">
            {loading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-gray-50 animate-pulse" />
            ))}
          </div>
        )}

        {/* Order cards */}
        <AnimatePresence>
          <div className="space-y-4">
            {orders.map((order, i) => {
              const meta = ORDER_STATUS_META[order.status];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group cursor-pointer rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-black/5 transition-all duration-300 overflow-hidden"
                >
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <p className="font-tertiary text-[10px] text-gray-400 tracking-widest uppercase">
                        Order
                      </p>
                      <p className="font-body text-xs font-semibold text-black">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="font-body text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-tertiary tracking-wide ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                      <HiOutlineArrowRight
                        size={14}
                        className="text-gray-300 group-hover:text-black group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">

                      {/* Item images + names */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {order.items.slice(0, 4).map((item, idx) => (
                            <div
                              key={`${item.itemId}-${idx}`}
                              className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100"
                            >
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-100" />
                              )}
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <span className="font-body text-xs text-gray-400">+{order.items.length - 4}</span>
                            </div>
                          )}
                        </div>

                        {/* Item names */}
                        <p className="font-body text-sm text-black truncate">
                          {order.items.map((i) => i.name).join(", ")}
                        </p>
                        <p className="font-tertiary text-[10px] text-gray-400 mt-0.5">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                          {" · "}
                          {order.items.map((i) => CATEGORY_LABELS[i.category]).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                        </p>
                      </div>

                      {/* Right side meta */}
                      <div className="flex-shrink-0 text-right space-y-1.5">
                        <p className="font-secondary text-lg text-black">
                          Ksh {order.total.toLocaleString()}
                        </p>
                        {order.mpesaReceiptNo && (
                          <div className="flex items-center gap-1 justify-end">
                            <HiOutlineReceiptRefund size={11} className="text-gray-400" />
                            <p className="font-tertiary text-[10px] text-gray-400">{order.mpesaReceiptNo}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 justify-end">
                          <HiOutlineMapPin size={11} className="text-gray-400" />
                          <p className="font-tertiary text-[10px] text-gray-400 max-w-[140px] truncate">
                            {order.delivery.deliveryAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
};