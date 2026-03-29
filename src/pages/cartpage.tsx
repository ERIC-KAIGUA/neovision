import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import {
  HiOutlineTrash,
  HiOutlineShoppingBag,
  HiOutlineArrowLeft,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { CATEGORY_LABELS } from "../types/adminTypes";

export const CartPage = () => {
  const { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity } = useCart();
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (err) {
        console.error("Sign in failed:", err);
      }
      return;
    }
    navigate("/checkout");
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
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
            <p className="font-secondary text-4xl text-black mb-2">Your cart is empty</p>
            <p className="font-body text-gray-400 mb-8 max-w-xs mx-auto">
              You haven't added anything yet. Browse our collection and find your perfect pair.
            </p>
            <button
              onClick={() => navigate("/shoppage")}
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

      <div className="pt-28 max-w-5xl mx-auto px-6 md:px-10 pb-16">

        {/* ── Page header ── */}
        <div className="py-8">
          <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-2">
            Your Selection
          </p>
          <h1 className="font-secondary text-5xl text-black">
            Cart{" "}
            <span className="font-secondary italic text-gray-500">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Cart items list ── */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item, i) => {
                const variantKey = `${item.itemId}-${item.selectedColor?.hex ?? "none"}-${item.selectedSize ?? "none"}`;

                return (
                  <motion.div
                    key={variantKey}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.97 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="flex gap-4 p-4 rounded-2xl shadow-lg border border-dashed border-black hover:border-gray-700 transition-all"
                  >
                    {/* Image */}
                    <div
                      className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/product/${item.category}/${item.itemId}`)}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover border-black hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-body">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-0.5">
                            {CATEGORY_LABELS[item.category]}
                          </p>
                          <p
                            className="font-body font-semibold text-black text-sm truncate cursor-pointer hover:underline"
                            onClick={() => navigate(`/product/${item.category}/${item.itemId}`)}
                          >
                            {item.name}
                          </p>
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={() =>
                            removeFromCart(
                              item.itemId,
                              item.selectedColor?.hex ?? null,
                              item.selectedSize ?? null
                            )
                          }
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-50 transition-all"
                          title="Remove item"
                        >
                          <HiOutlineTrash size={15} />
                        </button>
                      </div>

                      {/* Color + size chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {item.selectedColor && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
                            <span
                              className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                              style={{ backgroundColor: item.selectedColor.hex }}
                            />
                            <span className="font-body text-[11px] text-gray-500">
                              {item.selectedColor.name}
                            </span>
                          </div>
                        )}
                        {item.selectedSize && (
                          <div className="px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
                            <span className="font-body text-[11px] text-gray-500">
                              {item.selectedSize}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quantity + subtotal row */}
                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity stepper */}
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.itemId,
                                item.selectedColor?.hex ?? null,
                                item.selectedSize ?? null,
                                item.quantity - 1
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-300 text-black hover:text-black hover:bg-gray-500 transition-all font-body"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-body text-sm font-semibold text-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.itemId,
                                item.selectedColor?.hex ?? null,
                                item.selectedSize ?? null,
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-300 text-black hover:text-black hover:bg-gray-500 transition-all font-body"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal */}
                        <p className="font-secondary text-base text-black">
                          Ksh {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ── Order summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-2xl border border-gray-100 p-6 space-y-4">
              <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase">
                Order Summary
              </p>

              {/* Line items summary */}
              <div className="space-y-2 py-3 border-y border-gray-100">
                {cartItems.map((item) => {
                  const variantKey = `${item.itemId}-${item.selectedColor?.hex ?? "none"}-${item.selectedSize ?? "none"}`;
                  return (
                    <div key={variantKey} className="flex items-center justify-between gap-2">
                      <p className="font-body text-xs text-gray-500 truncate flex-1">
                        {item.name}
                        <span className="text-gray-300 ml-1">×{item.quantity}</span>
                      </p>
                      <p className="font-body text-xs text-black flex-shrink-0">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-gray-500">Total</p>
                <p className="font-secondary text-xl text-black">
                  Ksh {cartTotal.toLocaleString()}
                </p>
              </div>

              {/* Delivery note */}
              <p className="font-body text-xs text-gray-400 leading-relaxed">
                Delivery within Nairobi & Kiambu takes 2–4 business days.
              </p>

              {/* ── Action buttons ── */}
              <div className="space-y-2 pt-2">

                {/* Checkout */}
                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black text-white font-body font-semibold text-sm hover:bg-gray-800 active:scale-[0.98] transition-all"
                >
                  {!user && <HiOutlineLockClosed size={14} />}
                  {user ? "Proceed to Checkout" : "Sign In to Checkout"}
                </button>

                {/* Add more items */}
                <button
                  onClick={() => navigate("/shoppage")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-gray-600 font-body text-sm hover:border-gray-400 hover:text-black active:scale-[0.98] transition-all"
                >
                  <HiOutlineArrowLeft size={14} />
                  Add More Items
                </button>
              </div>

              {/* Sign in nudge for guests */}
              {!user && (
                <p className="font-body text-[11px] text-gray-400 text-center leading-relaxed">
                  You'll need to sign in before placing your order.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};