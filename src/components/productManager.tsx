import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { AddProductModal } from "./addProductModal";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineExclamationTriangle } from "react-icons/hi2";
import {
  type Category,
  type Product,
  CATEGORIES,
  STATIC_BRANCHES,
  isLowStock,
  isOutOfStock,
} from "../types/adminTypes";

interface ProductManagerProps {
  /** If set, product cards only show stock for this branch */
  activeBranchId?: string | null;
}

export const ProductManager = ({ activeBranchId }: ProductManagerProps) => {
  const [activeTab, setActiveTab] = useState<Category>("frames");
  const [products, setProducts] = useState<Record<Category, Product[]>>({
    frames: [],
    contactLenses: [],
    sunglasses: [],
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const results: Record<Category, Product[]> = {
        frames: [],
        contactLenses: [],
        sunglasses: [],
      };
      await Promise.all(
        CATEGORIES.map(async ({ key }) => {
          const snap = await getDocs(collection(db, "menuItems", key, "products"));
          results[key] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Product, "id">),
            category: key,
          }));
        })
      );
      setProducts(results);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Low stock across all categories ──────────────────────────────────────────
  const allProducts = [
    ...products.frames,
    ...products.contactLenses,
    ...products.sunglasses,
  ];

  const lowStockAlerts = allProducts.filter((p) =>
    activeBranchId
      ? isLowStock(p, activeBranchId)
      : isLowStock(p)
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      await deleteDoc(doc(db, "menuItems", product.category, "products", product.id));
      toast(`"${product.name}" deleted`, { icon: "🗑️" });
      await fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (product: Product) => { setEditProduct(product); setModalOpen(true); };
  const handleAddNew = () => { setEditProduct(null); setModalOpen(true); };

  const currentProducts = products[activeTab];

  // ── Stock badge for a single product ─────────────────────────────────────────
  const StockBadge = ({ product }: { product: Product }) => {
    const branches = activeBranchId
      ? STATIC_BRANCHES.filter((b) => b.id === activeBranchId)
      : STATIC_BRANCHES;

    return (
      <div className="flex flex-col gap-1">
        {branches.map((branch) => {
          const qty = product.stock?.[branch.id] ?? 0;
          const threshold = product.lowStockThreshold ?? 5;
          const out = qty === 0;
          const low = !out && qty <= threshold;

          return (
            <div key={branch.id} className="flex items-center justify-between gap-2">
              <span className="font-tertiary text-[9px] text-gray-600 tracking-wide truncate max-w-[80px]">
                {branch.name.replace("NeoVision ", "")}
              </span>
              <span
                className={`font-body text-xs font-semibold px-2 py-0.5 rounded-full ${
                  out
                    ? "bg-red-500/15 text-red-400"
                    : low
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-[rgb(128,255,0)]/10 text-[rgb(128,255,0)]"
                }`}
              >
                {out ? "Out" : `${qty} left`}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-10">

      {/* ── Low stock alert panel ── */}
      <AnimatePresence>
        {!loading && lowStockAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineExclamationTriangle size={16} className="text-amber-400 flex-shrink-0" />
              <p className="font-tertiary text-[10px] tracking-widest text-amber-400 uppercase">
                Low Stock Alerts — {lowStockAlerts.length} product{lowStockAlerts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockAlerts.map((p) => {
                const out = isOutOfStock(p, activeBranchId ?? undefined);
                return (
                  <button
                    key={p.id}
                    onClick={() => { setActiveTab(p.category); handleEdit(p); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-body transition-all hover:brightness-125 ${
                      out
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] opacity-60">
                      {out ? "Out of stock" : `≤${p.lowStockThreshold}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-tertiary text-[10px] tracking-widest text-gray-500 uppercase mb-1">Inventory</p>
          <h2 className="font-secondary text-2xl text-white">Products</h2>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgb(128,255,0)] text-black font-body font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <HiOutlinePlus size={16} />
          Add Product
        </button>
      </div>

      {/* ── Category tabs ── */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6 w-fit">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative px-5 py-2 rounded-xl text-sm font-body transition-all ${
              activeTab === key ? "text-black font-semibold" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {activeTab === key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[rgb(128,255,0)] rounded-xl"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{label}</span>
            {products[key].length > 0 && (
              <span className={`relative z-10 ml-2 text-[10px] font-tertiary ${activeTab === key ? "text-black/60" : "text-gray-600"}`}>
                {products[key].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : currentProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <HiOutlinePlus size={24} className="text-gray-600" />
          </div>
          <p className="font-secondary text-lg text-gray-500 mb-1">No products yet</p>
          <p className="font-body text-sm text-gray-700">
            Add your first {CATEGORIES.find((c) => c.key === activeTab)?.label.toLowerCase()} product
          </p>
          <button
            onClick={handleAddNew}
            className="mt-4 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-body text-sm transition-all"
          >
            Add product
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentProducts.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="group relative rounded-2xl bg-[#111111] border border-white/5 overflow-hidden hover:border-white/10 transition-all"
              >
                {/* Image */}
                <div className="relative h-44 bg-white/3 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 font-body text-sm">
                      No image
                    </div>
                  )}

                  {/* Out of stock ribbon */}
                  {isOutOfStock(product, activeBranchId ?? undefined) && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-500/80 text-white text-[10px] font-tertiary tracking-wide">
                      Out of stock
                    </div>
                  )}

                  {/* Action overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                      title="Edit"
                    >
                      <HiOutlinePencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === product.id ? (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                      ) : (
                        <HiOutlineTrash size={15} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <p className="font-body text-sm font-semibold text-white truncate">{product.name}</p>
                    <p className="font-body text-xs text-gray-500 line-clamp-1 leading-relaxed mt-0.5">
                      {product.description}
                    </p>
                  </div>

                  {/* Color dots */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {product.colors.slice(0, 6).map((c) => (
                        <span
                          key={c.hex}
                          title={c.name}
                          className="w-3.5 h-3.5 rounded-full border border-white/15 flex-shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      {product.colors.length > 6 && (
                        <span className="font-tertiary text-[10px] text-gray-600 ml-1">
                          +{product.colors.length - 6}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Size chips */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="flex gap-1">
                      {product.sizes.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded-md bg-white/5 text-gray-500 font-tertiary text-[10px] tracking-wide">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <p className="font-secondary text-[rgb(128,255,0)] text-lg">
                    Ksh {product.price.toLocaleString()}
                  </p>

                  {/* Stock per branch */}
                  <div className="pt-2 border-t border-white/5">
                    <StockBadge product={product} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Modal */}
      <AddProductModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        onSuccess={fetchProducts}
        editProduct={editProduct}
        defaultCategory={activeTab}
      />
    </div>
  );
};