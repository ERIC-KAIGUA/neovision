import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { motion } from "framer-motion";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { useCart } from "../context/CartContext";
import {
  HiOutlineShoppingCart,
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineXCircle,
  HiOutlineTruck,
} from "react-icons/hi2";
import { RiLoopRightFill } from "react-icons/ri";
import {
  type Product,
  type Category,
  type FrameSize,
  STATIC_BRANCHES,
  CATEGORY_LABELS,
} from "../types/adminTypes";

// ── Delivery details — constant across all product pages ─────────────────────
const DeliverySection = () => (
  <div className="mt-10 pt-8 border-t border-gray-100">
    <div className="flex items-center gap-2 mb-5">
      <HiOutlineTruck size={18} className="text-black" />
      <p className="font-tertiary text-xs tracking-widest text-gray-500 uppercase">
        Delivery Information
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Delivery timeline */}
      <div className="rounded-2xl bg-gray-50 p-5">
        <p className="font-body font-semibold text-black text-sm mb-3">Delivery Timeline</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 flex-shrink-0" />
            <div>
              <p className="font-body text-sm text-black">Nairobi & Kiambu</p>
              <p className="font-tertiary text-[11px] text-gray-500">2 – 4 business days</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
            <div>
              <p className="font-body text-sm text-gray-600">Other regions</p>
              <p className="font-tertiary text-[11px] text-gray-400">Contact us for delivery estimates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order types */}
      <div className="rounded-2xl bg-gray-50 p-5">
        <p className="font-body font-semibold text-black text-sm mb-3">What We Deliver</p>
        <div className="space-y-2">
          {[
            "Frames only",
            "Frames with lenses fitted",
            "Contact lenses",
            "Sunglasses",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <HiOutlineCheckCircle size={14} className="text-black flex-shrink-0" />
              <p className="font-body text-sm text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Returns note */}
    <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-black text-white">
      <RiLoopRightFill size={14} className="flex-shrink-0" />
      <p className="font-body text-xs">
        60-day hassle-free returns — no questions asked, fully prepaid.
      </p>
    </div>
  </div>
);

// ── Branch availability badge ─────────────────────────────────────────────────
const BranchBadge = ({
  name,
  qty,
  threshold,
}: {
  name: string;
  qty: number;
  threshold: number;
}) => {
  const out = qty === 0;
  const low = !out && qty <= threshold;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <HiOutlineMapPin size={14} className="text-gray-400 flex-shrink-0" />
        <p className="font-body text-sm text-gray-700">{name}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {out ? (
          <>
            <HiOutlineXCircle size={14} className="text-red-400" />
            <span className="font-tertiary text-[11px] text-red-400 tracking-wide">Out of stock</span>
          </>
        ) : low ? (
          <>
            <HiOutlineExclamationCircle size={14} className="text-amber-500" />
            <span className="font-tertiary text-[11px] text-amber-500 tracking-wide">
              Low stock — {qty} left
            </span>
          </>
        ) : (
          <>
            <HiOutlineCheckCircle size={14} className="text-green-600" />
            <span className="font-tertiary text-[11px] text-green-600 tracking-wide">
              Available — {qty} in stock
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const ProductPage = () => {
  const { category, id } = useParams<{ category: Category; id: string }>();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Selections
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<FrameSize | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!product) return;
    const colorObj = product.colors?.find((c) => c.hex === selectedColor) ?? null;
    addToCart({
      itemId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      quantity,
      selectedColor: colorObj,
      selectedSize: selectedSize,
    });
  };

  useEffect(() => {
    const fetch = async () => {
      if (!category || !id) { setNotFound(true); setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "menuItems", category, "products", id));
        if (!snap.exists()) { setNotFound(true); return; }
        const data = { id: snap.id, ...(snap.data() as Omit<Product, "id">), category };
        setProduct(data);
        // Pre-select first color and size if available
        if (data.colors?.length) setSelectedColor(data.colors[0].hex);
        if (data.sizes?.length) setSelectedSize(data.sizes[0]);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category, id]);

  // ── Stock helpers ─────────────────────────────────────────────────────────
  const stock = product?.stock ?? {};
  const threshold = product?.lowStockThreshold ?? 5;
  const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
  const globallyOutOfStock = totalStock === 0;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <Header />
        <div className="pt-28 max-w-6xl mx-auto px-6 md:px-10 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-100 rounded-3xl" />
            <div className="space-y-4 pt-4">
              <div className="h-3 bg-gray-100 rounded-full w-24" />
              <div className="h-8 bg-gray-100 rounded-full w-3/4" />
              <div className="h-6 bg-gray-100 rounded-full w-1/3" />
              <div className="h-20 bg-gray-100 rounded-2xl mt-6" />
              <div className="h-12 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <div className="bg-white min-h-screen">
        <Header />
        <div className="pt-28 flex flex-col items-center justify-center py-28 text-center">
          <p className="font-secondary text-4xl text-gray-200 mb-4">Product not found</p>
          <button
            onClick={() => navigate("/shoppage")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-body text-sm hover:bg-gray-800 transition-all"
          >
            <HiOutlineArrowLeft size={16} />
            Back to shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Header />

      <div className="pt-28 max-w-6xl mx-auto px-6 md:px-10">

        {/* ── Breadcrumb ── */}
        <div className="py-5 flex items-center gap-2">
          <button
            onClick={() => navigate("/shoppage")}
            className="flex items-center gap-1.5 text-white bg-black px-6 py-3  font-display rounded-xs text-sm transition-colors group"
          >
            <HiOutlineArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Shop
          </button>
          <span className="text-gray-200">/</span>
          <span className="font-body text-sm text-gray-400">
            {CATEGORY_LABELS[product.category]}
          </span>
          <span className="text-gray-200">/</span>
          <span className="font-body text-sm text-black truncate max-w-[180px]">
            {product.name}
          </span>
        </div>

        {/* ── Main layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-8">

          {/* LEFT — Image */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="sticky top-28 aspect-square rounded-3xl overflow-hidden bg-gray-50">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={`w-full h-full object-cover shadow-lg ${globallyOutOfStock ? "opacity-50 grayscale" : ""}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 font-body">
                  No image
                </div>
              )}

              {globallyOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-black/70 text-white font-tertiary text-xs tracking-widest uppercase px-4 py-2 rounded-full">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT — Details */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="py-4"
          >
            {/* Category label */}
            <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-2">
              {CATEGORY_LABELS[product.category]}
            </p>

            {/* Name */}
            <h1 className="font-secondary text-4xl text-black leading-tight mb-3">
              {product.name}
            </h1>

            {/* Price */}
            <p className="font-secondary text-2xl text-black mb-6">
              Ksh {product.price.toLocaleString()}
            </p>

            {/* ── Colors ── */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5">
                <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-3">
                  Color —{" "}
                  <span className="text-black normal-case tracking-normal font-body text-xs">
                    {product.colors.find((c) => c.hex === selectedColor)?.name ?? ""}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(color.hex)}
                      title={color.name}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                        selectedColor === color.hex
                          ? "border-black scale-110 shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Sizes ── */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-3">
                  Size
                </p>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2 rounded-xl border font-body text-sm transition-all ${
                        selectedSize === size
                          ? "bg-black text-white border-black font-semibold"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Branch availability ── */}
            <div className="mb-5">
              <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-3">
                Available In Stores
              </p>
              <div className="p-3 rounded-2xl border border-gray-500 overflow-hidden divide-y divide-gray-100">
                {STATIC_BRANCHES.map((branch) => (
                  <BranchBadge
                    key={branch.id}
                    name={branch.name}
                    qty={stock[branch.id] ?? 0}
                    threshold={threshold}
                  />
                ))}
              </div>
            </div>

            {/* ── Quantity ── */}
            <div className="mb-6">
              <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-3">
                Quantity
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-600 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-all font-body text-lg"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-body text-sm font-semibold text-black">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-all font-body text-lg"
                  >
                    +
                  </button>
                </div>
                <p className="font-body text-sm text-gray-400">
                  Total:{" "}
                  <span className="text-black font-semibold">
                    Ksh {(product.price * quantity).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>

            {/* ── Add to cart ── */}
            <button
              onClick={handleAddToCart}
              disabled={globallyOutOfStock}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-body font-semibold text-base hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HiOutlineShoppingCart size={18} />
              {globallyOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>

            {/* ── Description ── */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-3">
                Description
              </p>
              <p className="font-body text-gray-600 leading-relaxed text-sm">
                {product.description}
              </p>
            </div>

            {/* ── Delivery details ── */}
            <DeliverySection />
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};