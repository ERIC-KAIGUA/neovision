import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export interface OrderStats {
 
  pendingCount:    number;   
  todayItemCount:  number;   
  totalRevenue:    number;  
  completedCount:  number;  
  revenueLoading:  boolean;
  statsLoading:    boolean; 
  lastRefreshed:   Date | null;

  
  refresh: () => void;       
}


const startOfToday = (): Timestamp => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
};

export const useOrderStats = (branchId?: string | null): OrderStats => {
  
  const [pendingCount,   setPendingCount]   = useState(0);
  const [todayItemCount, setTodayItemCount] = useState(0);
  const [statsLoading,   setStatsLoading]   = useState(true);
  const [totalRevenue,    setTotalRevenue]    = useState(0);
  const [completedCount,  setCompletedCount]  = useState(0);
  const [revenueLoading,  setRevenueLoading]  = useState(true);
  const [lastRefreshed,   setLastRefreshed]   = useState<Date | null>(null);

  const ordersRef = collection(db, "orders");

  
  const withBranch = (baseQuery: ReturnType<typeof query>) =>
    branchId
      ? query(baseQuery, where("fulfillingBranch.branchId", "==", branchId))
      : baseQuery;

  // ── REAL-TIME 1: Pending orders ───────────────────────────────────────────
  useEffect(() => {
    const q = withBranch(
      query(ordersRef, where("status", "==", "pending"))
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendingCount(snap.size);
      setStatsLoading(false);
    });

    return () => unsub();
  }, [branchId]);

 
  useEffect(() => {
    const q = withBranch(
      query(ordersRef, where("createdAt", ">=", startOfToday()))
    );

     const unsub = onSnapshot(q, (snap) => {
      let total = 0;
      snap.docs.forEach((doc) => {
        const data = doc.data() as { items?: { quantity: number }[] };
        const items = data.items ?? [];
        items.forEach((item) => {
          total += item.quantity ?? 0;
        });
      });
      setTodayItemCount(total);
    });
 
    return () => unsub();
  }, [branchId]);

  
  const fetchRevenueStats = useCallback(async () => {
    setRevenueLoading(true);
    try {
      // Revenue — only count completed payments
      const revenueQuery = withBranch(
        query(ordersRef, where("paymentStatus", "==", "completed"))
      );
      const revenueSnap = await getDocs(revenueQuery);
      const revenue = revenueSnap.docs.reduce(
        (sum, doc) => sum + ((doc.data() as {total?:number}).total ?? 0),
        0
      );
      setTotalRevenue(revenue);

     
      const completedQuery = withBranch(
        query(ordersRef, where("status", "in", ["completed", "dispatched", "delivered"]))
      );
      const completedSnap = await getDocs(completedQuery);
      setCompletedCount(completedSnap.size);

      setLastRefreshed(new Date());
    } catch (err) {
      console.error("[useOrderStats] Failed to fetch revenue stats:", err);
    } finally {
      setRevenueLoading(false);
    }
  }, [branchId]);

  // Fetch on mount and when branch changes
  useEffect(() => {
    fetchRevenueStats();
  }, [fetchRevenueStats]);

  return {
    pendingCount,
    todayItemCount,
    totalRevenue,
    completedCount,
    revenueLoading,
    statsLoading,
    lastRefreshed,
    refresh: fetchRevenueStats,
  };
};