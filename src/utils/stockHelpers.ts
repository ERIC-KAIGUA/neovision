import {
  runTransaction,
  doc,
  type Firestore,
} from "firebase/firestore";
import { type CartItem } from "../types/cart";
import { type FulfillingBranch } from "../types/order";
import { STATIC_BRANCHES } from "../types/adminTypes";

/**
 * Picks the branch with the highest TOTAL stock across all items in the cart.
 * Falls back to Nairobi CBD if stock data is missing everywhere.
 */
export const pickFulfillingBranch = (
  cartItems: CartItem[],
  stockMap: Record<string, Record<string, number>>
  // stockMap shape: { [itemId]: { [branchId]: qty } }
): FulfillingBranch => {
  const branchTotals: Record<string, number> = {};

  for (const branch of STATIC_BRANCHES) {
    branchTotals[branch.id] = cartItems.reduce((sum, item) => {
      return sum + (stockMap[item.itemId]?.[branch.id] ?? 0);
    }, 0);
  }

  // Pick branch with highest combined stock
  const bestBranchId = Object.entries(branchTotals).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] ?? STATIC_BRANCHES[0].id;

  const branch = STATIC_BRANCHES.find((b) => b.id === bestBranchId)!;

  return {
    branchId: branch.id,
    branchName: branch.name,
  };
};

/**
 * Atomically decrements stock for all ordered items at the fulfilling branch.
 * Uses a Firestore transaction so concurrent orders cannot oversell.
 *
 * If the fulfilling branch has insufficient stock for an item,
 * it falls back to decrementing from the other branch for that item.
 * Stock never goes below 0.
 */
export const decrementStockTransaction = async (
  db: Firestore,
  cartItems: CartItem[],
  fulfillingBranchId: string
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    for (const item of cartItems) {
      const productRef = doc(
        db,
        "menuItems",
        item.category,
        "products",
        item.itemId
      );

      const snapshot = await transaction.get(productRef);
      if (!snapshot.exists()) continue;

      const currentStock: Record<string, number> =
        snapshot.data()?.stock ?? {};

      const primaryQty = currentStock[fulfillingBranchId] ?? 0;
      const newStock = { ...currentStock };

      if (primaryQty >= item.quantity) {
        // Enough stock at primary branch — decrement there
        newStock[fulfillingBranchId] = Math.max(
          0,
          primaryQty - item.quantity
        );
      } else {
        // Not enough at primary — use what's available then pull rest from other branch
        newStock[fulfillingBranchId] = 0;
        const remaining = item.quantity - primaryQty;

        // Find another branch that has stock
        const fallbackBranch = STATIC_BRANCHES.find(
          (b) => b.id !== fulfillingBranchId && (currentStock[b.id] ?? 0) > 0
        );

        if (fallbackBranch) {
          newStock[fallbackBranch.id] = Math.max(
            0,
            (currentStock[fallbackBranch.id] ?? 0) - remaining
          );
        }
      }

      transaction.update(productRef, { stock: newStock });
    }
  });
};