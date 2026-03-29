import { createContext, useContext, useEffect, useState } from "react";
import { type CartItem } from "../types/cart";
import toast from "react-hot-toast";

const STORAGE_KEY = "neovision_cart";

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string, selectedColorHex?: string | null, selectedSize?: string | null) => void;
  updateQuantity: (itemId: string, selectedColorHex: string | null, selectedSize: string | null, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};

/** Two cart entries are the same variant if they share itemId + color + size */
const isSameVariant = (a: CartItem, b: CartItem) =>
  a.itemId === b.itemId &&
  (a.selectedColor?.hex ?? null) === (b.selectedColor?.hex ?? null) &&
  (a.selectedSize ?? null) === (b.selectedSize ?? null);

const loadFromStorage = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.warn("Could not persist cart to localStorage");
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadFromStorage);

  // Sync to localStorage on every change
  useEffect(() => { saveToStorage(cartItems); }, [cartItems]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (incoming: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => isSameVariant(item, incoming));
      if (existing) {
         toast.success(`${incoming.name} quantity updated`, { id: "cart-add" });
        // Same variant — just increment quantity
        return prev.map((item) =>
          isSameVariant(item, incoming)
            ? { ...item, quantity: item.quantity + incoming.quantity }
            : item
        );
      }
      toast.success(`${incoming.name} added to cart`, { id: "cart-add" });
      return [...prev, incoming];
    });
  };

    const removeFromCart = (
    itemId: string,
    selectedColorHex?: string | null,
    selectedSize?: string | null
  ) => {
    setCartItems((prev) => {
      const item = prev.find(
        (i) =>
          i.itemId === itemId &&
          (i.selectedColor?.hex ?? null) === (selectedColorHex ?? null) &&
          (i.selectedSize ?? null) === (selectedSize ?? null)
      );
      if (item) toast(`${item.name} removed from cart`, { id: "cart-remove" });
      return prev.filter(
        (i) =>
          !(
            i.itemId === itemId &&
            (i.selectedColor?.hex ?? null) === (selectedColorHex ?? null) &&
            (i.selectedSize ?? null) === (selectedSize ?? null)
          )
      );
    });
  };

  const updateQuantity = (
    itemId: string,
    selectedColorHex: string | null,
    selectedSize: string | null,
    quantity: number
  ) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId &&
        (item.selectedColor?.hex ?? null) === selectedColorHex &&
        (item.selectedSize ?? null) === selectedSize
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{ cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};