export type Category = "frames" | "contactLenses" | "sunglasses";

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "frames", label: "Frames" },
  { key: "contactLenses", label: "Contact Lenses" },
  { key: "sunglasses", label: "Sunglasses" },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  frames: "Frames",
  contactLenses: "Contact Lenses",
  sunglasses: "Sunglasses",
};



export interface Branch {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export const BRANCH_IDS = {
  NAIROBI: "branch_nairobi_cbd",
  KIKUYU: "branch_kikuyu",
} as const;

export const STATIC_BRANCHES: Branch[] = [
  {
    id: BRANCH_IDS.NAIROBI,
    name: "LuminaVision Nairobi CBD",
    location: "Nairobi CBD",
    isActive: true,
  },
  {
    id: BRANCH_IDS.KIKUYU,
    name: "LuminaVision Kikuyu",
    location: "Kikuyu",
    isActive: true,
  },
];

export interface ProductColor {
  name: string;
  hex: string;
}

export const PRESET_COLORS: ProductColor[] = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Brown", hex: "#7b4f2e" },
  { name: "Tortoise", hex: "#8b5e3c" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Gold", hex: "#c9a84c" },
  { name: "Rose Gold", hex: "#b76e79" },
  { name: "Clear", hex: "#e8f4f8" },
  { name: "Red", hex: "#c0392b" },
];

// ─── Sizes ────────────────────────────────────────────────────────────────────

export type FrameSize = "Small" | "Medium" | "Large";
export const FRAME_SIZES: FrameSize[] = ["Small", "Medium", "Large"];

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: Category;
  // colors — frames & sunglasses only
  colors?: ProductColor[];
  // sizes — frames only
  sizes?: FrameSize[];
  // stock per branch: { branch_nairobi_cbd: 12, branch_kikuyu: 4 }
  stock: Record<string, number>;
  // low stock alert threshold — admin configured per product
  lowStockThreshold: number;
}

// ─── Low stock helper ─────────────────────────────────────────────────────────

export const isLowStock = (product: Product, branchId?: string): boolean => {
    const stock = product.stock ?? {};
    if (branchId) {
        return (stock[branchId] ?? 0) <=(product.lowStockThreshold ?? 5);
    }
    const values = Object.values(stock);
    if(values.length === 0) return false;
    return values.some((qty) => qty <= (product.lowStockThreshold ?? 5))
};

export const isOutOfStock = (product: Product, branchId?: string): boolean => {
  const stock = product.stock ?? {};
  if (branchId) return (stock[branchId] ?? 0) === 0;
  const values = Object.values(stock);
  if (values.length === 0) return true;
  return values.every((qty) => qty === 0);
};