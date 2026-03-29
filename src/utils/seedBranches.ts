import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { STATIC_BRANCHES } from "../types/adminTypes";

/**
 * Checks if the two NeoVision branches exist in Firestore.
 * If not, seeds them. Safe to call on every admin mount — it's a no-op
 * if branches already exist.
 */
export const seedBranches = async (): Promise<void> => {
  try {
    await Promise.all(
      STATIC_BRANCHES.map(async (branch) => {
        const ref = doc(db, "branches", branch.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            name: branch.name,
            location: branch.location,
            isActive: branch.isActive,
            createdAt: serverTimestamp(),
          });
          console.info(`[seedBranches] Created branch: ${branch.name}`);
        }
      })
    );
  } catch (err) {
    // Non-fatal — dashboard still loads, just log the error
    console.error("[seedBranches] Failed to seed branches:", err);
  }
};