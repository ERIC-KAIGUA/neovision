import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseSharp } from "react-icons/io5";
import { HiOutlinePhoto, HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { convertToWebp } from "../utils/convertToWebp";
import toast from "react-hot-toast";
import {
  type Category,
  type Product,
  type ProductColor,
  type FrameSize,
  CATEGORIES,
  CATEGORY_LABELS,
  PRESET_COLORS,
  FRAME_SIZES,
  STATIC_BRANCHES,
} from "../types/adminTypes";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editProduct?: Product | null;
  defaultCategory?: Category;
}

const INPUT_CLS =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-body text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[rgb(128,255,0)]/50 transition-all";

const LABEL_CLS =
  "font-tertiary text-[10px] tracking-widest text-gray-500 uppercase block mb-2";

/** Returns true if hex colour is light (so dark text sits on it) */
const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
};

export const AddProductModal = ({
  isOpen,
  onClose,
  onSuccess,
  editProduct,
  defaultCategory = "frames",
}: AddProductModalProps) => {

  // ── Core fields ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);

  // ── Image ────────────────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [convertingImage, setConvertingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Colors (frames + sunglasses) ─────────────────────────────────────────────
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([]);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#000000");
  const [showCustomColor, setShowCustomColor] = useState(false);

  // ── Sizes (frames only) ───────────────────────────────────────────────────────
  const [selectedSizes, setSelectedSizes] = useState<FrameSize[]>([]);

  // ── Stock per branch ──────────────────────────────────────────────────────────
  const initStock = () =>
    Object.fromEntries(STATIC_BRANCHES.map((b) => [b.id, "0"]));
  const [stock, setStock] = useState<Record<string, string>>(initStock);

  // ── Low stock threshold ───────────────────────────────────────────────────────
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  // ── UI ────────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showColors = category === "frames" || category === "sunglasses";
  const showSizes = category === "frames";

  // ── Pre-fill when editing ─────────────────────────────────────────────────────
  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name);
      setPrice(String(editProduct.price));
      setDescription(editProduct.description);
      setCategory(editProduct.category);
      setImagePreview(editProduct.imageUrl);
      setSelectedColors(editProduct.colors ?? []);
      setSelectedSizes(editProduct.sizes ?? []);
      setLowStockThreshold(String(editProduct.lowStockThreshold ?? 5));
      const existing = editProduct.stock ?? {};
      setStock(
        Object.fromEntries(
          STATIC_BRANCHES.map((b) => [b.id, String(existing[b.id] ?? 0)])
        )
      );
    } else {
      resetForm();
      setCategory(defaultCategory);
    }
    setError(null);
  }, [editProduct, defaultCategory, isOpen]);

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setCategory(defaultCategory);
    setImageFile(null);
    setImagePreview(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setStock(initStock());
    setLowStockThreshold("5");
    setCustomColorName("");
    setCustomColorHex("#000000");
    setShowCustomColor(false);
    setError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  // ── Image ────────────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file."); return; }
    setError(null);
    setConvertingImage(true);
    const toastId = toast.loading("Converting image to WebP…");
    try {
      const originalUrl = URL.createObjectURL(file);
      setImagePreview(originalUrl);
      const webpBlob = await convertToWebp(file);
      const webpFile = new File([webpBlob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
      setImageFile(webpFile);
      URL.revokeObjectURL(originalUrl);
      setImagePreview(URL.createObjectURL(webpBlob));
      toast.success("Image ready", { id: toastId });
    } catch {
      setError("Image conversion failed. Please try another file.");
      toast.error("Image conversion failed", { id: toastId });
    } finally {
      setConvertingImage(false);
    }
  };

  // ── Colors ───────────────────────────────────────────────────────────────────
  const togglePresetColor = (color: ProductColor) =>
    setSelectedColors((prev) =>
      prev.some((c) => c.hex === color.hex)
        ? prev.filter((c) => c.hex !== color.hex)
        : [...prev, color]
    );

  const addCustomColor = () => {
    if (!customColorName.trim()) return;
    if (selectedColors.some((c) => c.name.toLowerCase() === customColorName.trim().toLowerCase())) return;
    setSelectedColors((prev) => [...prev, { name: customColorName.trim(), hex: customColorHex }]);
    setCustomColorName("");
    setCustomColorHex("#000000");
    setShowCustomColor(false);
  };

  const removeColor = (hex: string) =>
    setSelectedColors((prev) => prev.filter((c) => c.hex !== hex));

  // ── Sizes ────────────────────────────────────────────────────────────────────
  const toggleSize = (size: FrameSize) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );

  // ── Stock stepper ─────────────────────────────────────────────────────────────
  const stepStock = (branchId: string, delta: number) =>
    setStock((prev) => ({
      ...prev,
      [branchId]: String(Math.max(0, Number(prev[branchId]) + delta)),
    }));

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim() || !price || !description.trim()) {
      setError("Please fill in name, price and description."); return;
    }
    if (!editProduct && !imageFile) {
      setError("Please select a product image."); return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      setError("Please enter a valid price."); return;
    }
    setLoading(true);
    setError(null);
    try {
      let imageUrl = editProduct?.imageUrl ?? "";
      if (imageFile) {
        const storageRef = ref(storage, `products/${category}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const stockNumbers: Record<string, number> = Object.fromEntries(
        Object.entries(stock).map(([id, val]) => [id, Number(val) || 0])
      );

      const productData: Record<string, unknown> = {
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        imageUrl,
        category,
        stock: stockNumbers,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        updatedAt: serverTimestamp(),
      };
      if (showColors) productData.colors = selectedColors;
      if (showSizes) productData.sizes = selectedSizes;

      if (editProduct) {
        await updateDoc(doc(db, "menuItems", category, "products", editProduct.id), productData);
        toast.success("Product updated successfully");
      } else {
        await addDoc(collection(db, "menuItems", category, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast.success("Product added successfully");
      }
      onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div
              className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent line */}
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[rgb(128,255,0)] to-transparent" />

              {/* Sticky header */}
              <div className="sticky top-0 z-10 bg-[#0e0e0e] px-7 pt-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-tertiary text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                      Product Management
                    </p>
                    <h2 className="font-secondary text-2xl text-white">
                      {editProduct ? "Edit Product" : "Add New Product"}
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                  >
                    <IoCloseSharp size={18} />
                  </button>
                </div>
              </div>

              <div className="px-7 py-5 space-y-5">

                {/* Category */}
                <div>
                  <label className={LABEL_CLS}>Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(({ key }) => (
                      <button
                        key={key}
                        onClick={() => setCategory(key)}
                        className={`py-2 rounded-xl text-xs font-body transition-all border ${
                          category === key
                            ? "bg-[rgb(128,255,0)] text-black border-[rgb(128,255,0)] font-semibold"
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                        }`}
                      >
                        {CATEGORY_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label className={LABEL_CLS}>Product Image</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative cursor-pointer group rounded-2xl border border-dashed border-white/15 hover:border-[rgb(128,255,0)]/50 transition-all overflow-hidden bg-white/3 flex items-center justify-center h-36"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <p className="font-body text-white text-sm">Change image</p>
                        </div>
                        {convertingImage && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                            <div className="h-6 w-6 rounded-full border-2 border-[rgb(128,255,0)] border-t-transparent animate-spin" />
                            <p className="font-body text-xs text-gray-300">Converting to WebP…</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-600 group-hover:text-gray-400 transition-all">
                        <HiOutlinePhoto size={28} />
                        <p className="font-body text-xs">Click to upload image</p>
                        <p className="font-tertiary text-[10px] text-gray-700">Converted to WebP automatically</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                {/* Name */}
                <div>
                  <label className={LABEL_CLS}>Product Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Noir Classic Frame" className={INPUT_CLS} />
                </div>

                {/* Price */}
                <div>
                  <label className={LABEL_CLS}>Price (Ksh)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 4500" min="0" className={INPUT_CLS} />
                </div>

                {/* Description */}
                <div>
                  <label className={LABEL_CLS}>Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the product..." rows={3}
                    className={`${INPUT_CLS} resize-none`} />
                </div>

                {/* Colors */}
                {showColors && (
                  <div>
                    <label className={LABEL_CLS}>Available Colors</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {PRESET_COLORS.map((color) => {
                        const active = selectedColors.some((c) => c.hex === color.hex);
                        return (
                          <button
                            key={color.hex}
                            onClick={() => togglePresetColor(color)}
                            title={color.name}
                            className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                              active
                                ? "border-[rgb(128,255,0)] scale-110 shadow-lg shadow-[rgb(128,255,0)]/20"
                                : "border-white/10 hover:border-white/30"
                            }`}
                            style={{ backgroundColor: color.hex }}
                          >
                            {active && (
                              <span className="text-[10px] font-bold" style={{ color: isLightColor(color.hex) ? "#000" : "#fff" }}>
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setShowCustomColor((v) => !v)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-white/20 hover:border-[rgb(128,255,0)]/50 text-gray-500 hover:text-[rgb(128,255,0)] transition-all"
                        title="Add custom color"
                      >
                        <HiOutlinePlus size={14} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showCustomColor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3"
                        >
                          <div className="flex gap-2">
                            <input type="text" value={customColorName}
                              onChange={(e) => setCustomColorName(e.target.value)}
                              placeholder="e.g. Ocean Blue" className={`${INPUT_CLS} flex-1`} />
                            <input type="color" value={customColorHex}
                              onChange={(e) => setCustomColorHex(e.target.value)}
                              className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
                            <button onClick={addCustomColor} disabled={!customColorName.trim()}
                              className="px-4 rounded-xl bg-[rgb(128,255,0)] text-black font-body text-sm font-semibold disabled:opacity-40 hover:brightness-110 transition-all">
                              Add
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selectedColors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedColors.map((c) => (
                          <div key={c.hex} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-body text-gray-300">
                            <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                            {c.name}
                            <button onClick={() => removeColor(c.hex)} className="ml-1 text-gray-600 hover:text-red-400 transition-colors">
                              <HiOutlineXMark size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sizes */}
                {showSizes && (
                  <div>
                    <label className={LABEL_CLS}>Frame Sizes</label>
                    <div className="flex gap-2">
                      {FRAME_SIZES.map((size) => (
                        <button key={size} onClick={() => toggleSize(size)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-body border transition-all ${
                            selectedSizes.includes(size)
                              ? "bg-[rgb(128,255,0)] text-black border-[rgb(128,255,0)] font-semibold"
                              : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                          }`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock per branch */}
                <div>
                  <label className={LABEL_CLS}>Stock per Branch</label>
                  <div className="space-y-2">
                    {STATIC_BRANCHES.map((branch) => (
                      <div key={branch.id} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-white truncate">{branch.name}</p>
                          <p className="font-tertiary text-[10px] text-gray-600">{branch.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => stepStock(branch.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-lg transition-all">
                            −
                          </button>
                          <input type="number" min="0" value={stock[branch.id]}
                            onChange={(e) => setStock((prev) => ({ ...prev, [branch.id]: e.target.value }))}
                            className="w-14 text-center bg-white/5 border border-white/10 rounded-lg py-1.5 font-body text-sm text-white focus:outline-none focus:border-[rgb(128,255,0)]/50 transition-all" />
                          <button onClick={() => stepStock(branch.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-lg transition-all">
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low stock threshold */}
                <div>
                  <label className={LABEL_CLS}>Low Stock Alert Threshold</label>
                  <p className="font-body text-xs text-gray-600 mb-2">
                    Warn when any branch stock falls to or below this number.
                  </p>
                  <div className="flex items-center gap-3">
                    <input type="number" min="1" value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-24 text-center bg-white/5 border border-white/10 rounded-xl py-2.5 font-body text-sm text-white focus:outline-none focus:border-[rgb(128,255,0)]/50 transition-all" />
                    <p className="font-body text-sm text-gray-500">units</p>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="font-body text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || convertingImage}
                  className="w-full py-3 mb-2 rounded-xl bg-[rgb(128,255,0)] text-black font-body font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      {editProduct ? "Saving…" : "Adding product…"}
                    </>
                  ) : (
                    editProduct ? "Save Changes" : "Add Product"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};