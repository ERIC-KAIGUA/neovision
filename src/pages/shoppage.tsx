import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { HiOutlineShoppingCart } from "react-icons/hi2";
import { type Category, type Product, CATEGORIES, isOutOfStock } from "../types/adminTypes";

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden bg-gray-100 animate-pulse">
    <div className="h-64 bg-gray-100" />
    <div className="p-4 space-y-2">
      <div className="h-3 bg-gray-200 rounded-full w-1/2" />
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-3 bg-gray-200 rounded-full w-1/3" />
      <div className="h-9 bg-gray-200 rounded-xl mt-3" />
    </div>
  </div>
);

export const ShopPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Category>("frames");
  const [loading, setLoading] = useState(false);

  // Local cache — only fetch each category once per session
  const [cache, setCache] = useState<Partial<Record<Category, Product[]>>>({});

  const fetchCategory = useCallback(
    async (cat: Category) => {
      if (cache[cat]) return; // already fetched
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "menuItems", cat, "products"));
        const products = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, "id">),
          category: cat,
        }));
        setCache((prev) => ({ ...prev, [cat]: products }));
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    },
    [cache]
  );

  // Fetch on first render and on tab switch
  const handleTabSwitch = (cat: Category) => {
    setActiveTab(cat);
    fetchCategory(cat);
  };

  // Trigger initial fetch
  useState(() => { fetchCategory("frames"); });

  const currentProducts = cache[activeTab] ?? [];

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.category}/${product.id}`);
  };

  return (
    <div className="bg-white min-h-screen">
      <Header />

      {/* ── Hero banner ── */}
      <div className="pt-28 pb-10 px-6 md:px-10 max-w-7xl mx-auto">
        <p className="font-tertiary text-xs tracking-widest text-gray-400 uppercase mb-2">
          The Collection
        </p>
        <h1 className="font-secondary text-5xl md:text-6xl text-black leading-tight">
          Shop <span className="font-secondary italic text-accent">Neo<span className="text-black">Vision</span></span>
        </h1>
        <p className="font-body text-gray-500 mt-3 text-lg max-w-md">
          Premium frames, contact lenses and sunglasses — crafted for those who see life as a statement.
        </p>
      </div>

      {/* ── Category tabs ── */}
      <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex gap-0">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabSwitch(key)}
              className={`relative px-6 py-4 font-body text-sm transition-all ${
                activeTab === key
                  ? "text-black font-semibold"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {label}
              {activeTab === key && (
                <motion.div
                  layoutId="shopTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {/* Product count badge */}
              {cache[key] && (
                <span className="ml-1.5 font-tertiary text-[10px] text-gray-400">
                  {cache[key]!.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product grid ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </motion.div>
          ) : currentProducts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-28 text-center"
            >
              <p className="font-secondary text-3xl text-gray-300 mb-2">No products yet</p>
              <p className="font-body text-gray-400 text-sm">
                Check back soon — new {CATEGORIES.find((c) => c.key === activeTab)?.label.toLowerCase()} are on the way.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {currentProducts.map((product, i) => {
                const outOfStock = isOutOfStock(product);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    onClick={() => handleProductClick(product)}
                    className="group cursor-pointer rounded-2xl overflow-hidden border shadow-xl bg-gray-400 border-dashed  border-gray-200  hover:border-gray-700 hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative h-64 bg-gray-50 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            outOfStock ? "opacity-50 grayscale" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-body text-sm">
                          No image
                        </div>
                      )}

                      {/* Out of stock overlay */}
                      {outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-black/70 text-white font-tertiary text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full">
                            Out of Stock
                          </span>
                        </div>
                      )}

                      {/* Color dots on image */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="absolute bottom-3 left-3 flex gap-1">
                          {product.colors.slice(0, 5).map((c) => (
                            <span
                              key={c.hex}
                              title={c.name}
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                          {product.colors.length > 5 && (
                            <span className="w-4 h-4 rounded-full bg-black/60 border-2 border-white flex items-center justify-center">
                              <span className="text-white text-[8px] font-bold">+{product.colors.length - 5}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="font-tertiary text-[10px] tracking-widest text-gray-400 uppercase mb-1">
                        {CATEGORIES.find((c) => c.key === product.category)?.label}
                      </p>
                      <p className="font-body font-semibold text-black text-sm truncate mb-0.5">
                        {product.name}
                      </p>
                      <p className="font-secondary text-lg text-black mb-3">
                        Ksh {product.price.toLocaleString()}
                      </p>

                      {/* Add to cart button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // don't navigate on button click
                          handleProductClick(product); // go to product page for now
                        }}
                        disabled={outOfStock}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black text-white font-body text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <HiOutlineShoppingCart size={15} />
                        {outOfStock ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
};