import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "../components/userAvatar";
import { StatsCard } from "../components/statsCard";
import { ProductManager } from "../components/productManager";
import { seedBranches } from "../utils/seedBranches";
import { useOrderStats } from "../hooks/Useorderstats";
import {
  HiOutlineSquares2X2,
  HiOutlineEye,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineMapPin,
  HiOutlineArrowPath,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import { LuPackageCheck, LuClock, LuBanknote, LuShoppingBag } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { STATIC_BRANCHES } from "../types/adminTypes";

type AdminPage = "dashboard" | "eyeExams";

const NAV_ITEMS: { key: AdminPage | "orders"; label: string; icon: React.ReactNode; route?: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: <HiOutlineSquares2X2 size={18} /> },
  { key: "orders",    label: "Orders",    icon: <HiOutlineClipboardDocumentList size={18} />, route: "/admin/orders" },
  { key: "eyeExams",  label: "Eye Exams", icon: <HiOutlineEye size={18} /> },
];

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState<AdminPage>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // null = "All Branches", otherwise a branch id
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  // ── Order stats ───────────────────────────────────────────────────────────
  const {
    pendingCount,
    todayItemCount,
    totalRevenue,
    completedCount,
    revenueLoading,
    statsLoading,
    lastRefreshed,
    refresh,
  } = useOrderStats(activeBranchId);

  // Seed branches on first mount
  useEffect(() => { seedBranches(); }, []);

  const handleLogout = async () => {
    if (window.confirm("Log out of admin?")) {
      await logout();
      navigate("/");
    }
  };

  const activeBranchLabel =
    activeBranchId
      ? STATIC_BRANCHES.find((b) => b.id === activeBranchId)?.name ?? "Branch"
      : "All Branches";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* ── SIDEBAR ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-64
          bg-[#0d0d0d] border-r border-white/5 flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:static lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5">
          <p className="font-body text-2xl">
            <span className="text-[rgb(128,255,0)]">Neo</span>
            <span className="text-white">Vision</span>
          </p>
          <p className="font-tertiary text-[10px] tracking-widest text-gray-600 uppercase mt-0.5">
            Admin Console
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon, route }) => (
            <button
              key={key}
              onClick={() => {
                if (route) { navigate(route); return; }
                setActivePage(key as AdminPage);
                setSidebarOpen(false);
              }}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body transition-all ${
                activePage === key
                  ? "bg-[rgb(128,255,0)]/10 text-[rgb(128,255,0)]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {activePage === key && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[rgb(128,255,0)] rounded-full"
                />
              )}
              {icon}
              {label}
            </button>
          ))}

          {/* Branch filter in sidebar */}
          <div className="pt-5 pb-1">
            <p className="font-tertiary text-[10px] tracking-widest text-gray-600 uppercase px-4 mb-2">
              Branch Filter
            </p>
            <button
              onClick={() => setActiveBranchId(null)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body transition-all ${
                activeBranchId === null
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <HiOutlineMapPin size={16} />
              All Branches
            </button>
            {STATIC_BRANCHES.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setActiveBranchId(branch.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body transition-all mt-0.5 ${
                  activeBranchId === branch.id
                    ? "bg-[rgb(128,255,0)]/10 text-[rgb(128,255,0)]"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                <span className="truncate text-left">{branch.name.replace("NeoVision ", "")}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="px-4 py-5 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar size="10" />
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-white truncate">{user?.displayName || "Admin"}</p>
              <p className="font-tertiary text-[10px] text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 font-body text-sm transition-all"
          >
            <HiOutlineArrowRightOnRectangle size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <button
            className="lg:hidden text-gray-400 hover:text-white transition-colors mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <HiOutlineBars3 size={22} />
          </button>

          <div className="hidden lg:block">
            <p className="font-tertiary text-[10px] tracking-widest text-gray-600 uppercase">
              {activePage === "dashboard" ? "Overview" : "Eye Examinations"}
            </p>
            <h1 className="font-secondary text-xl text-white">
              {activePage === "dashboard" ? "Dashboard" : "Appointments"}
            </h1>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Active branch pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <HiOutlineMapPin size={13} className="text-gray-500" />
              <span className="font-tertiary text-[10px] text-gray-400 tracking-wide">
                {activeBranchLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgb(128,255,0)]/10 border border-[rgb(128,255,0)]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[rgb(128,255,0)] animate-pulse" />
              <span className="font-tertiary text-[10px] text-[rgb(128,255,0)] tracking-widest uppercase">Live</span>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 px-6 py-8 overflow-y-auto">
          <AnimatePresence mode="wait">

            {activePage === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Mobile title */}
                <div className="lg:hidden mb-6">
                  <p className="font-tertiary text-[10px] tracking-widest text-gray-600 uppercase mb-1">Overview</p>
                  <h1 className="font-secondary text-2xl text-white">Dashboard</h1>
                </div>

                {/* Branch context banner */}
                {activeBranchId && (
                  <div className="mb-5 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(128,255,0)]/5 border border-[rgb(128,255,0)]/15 w-fit">
                    <HiOutlineMapPin size={14} className="text-[rgb(128,255,0)]" />
                    <p className="font-body text-sm text-[rgb(128,255,0)]">
                      Viewing: {STATIC_BRANCHES.find((b) => b.id === activeBranchId)?.name}
                    </p>
                    <button
                      onClick={() => setActiveBranchId(null)}
                      className="ml-2 text-[rgb(128,255,0)]/50 hover:text-[rgb(128,255,0)] font-body text-xs transition-colors"
                    >
                      Clear ×
                    </button>
                  </div>
                )}

                {/* Stats header row */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-tertiary text-[10px] tracking-widest text-gray-600 uppercase">
                      Overview
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {lastRefreshed && (
                      <p className="font-tertiary text-[10px] text-gray-600 hidden sm:block">
                        Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    <button
                      onClick={refresh}
                      disabled={revenueLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all disabled:opacity-40 text-xs font-body"
                      title="Refresh revenue & completed stats"
                    >
                      <HiOutlineArrowPath
                        size={13}
                        className={revenueLoading ? "animate-spin" : ""}
                      />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatsCard
                    label="Total Revenue"
                    value={`Ksh ${totalRevenue.toLocaleString()}`}
                    icon={<LuBanknote size={18} />}
                    sub={activeBranchId ? activeBranchLabel : "All branches · paid orders"}
                    loading={revenueLoading}
                  />
                  <StatsCard
                    label="Pending Orders"
                    value={pendingCount}
                    icon={<LuClock size={18} />}
                    sub="Awaiting fulfillment"
                    loading={statsLoading}
                    live
                  />
                  <StatsCard
                    label="Completed Orders"
                    value={completedCount}
                    icon={<LuPackageCheck size={18} />}
                    sub="Completed · dispatched · delivered"
                    loading={revenueLoading}
                  />
                  <StatsCard
                    label="Items Ordered Today"
                    value={todayItemCount}
                    icon={<LuShoppingBag size={18} />}
                    sub="Total units across today's orders"
                    loading={statsLoading}
                    live
                  />
                </div>

                {/* Product manager — receives active branch for stock filtering */}
                <ProductManager activeBranchId={activeBranchId} />
              </motion.div>
            )}

            {activePage === "eyeExams" && (
              <motion.div
                key="eyeExams"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center py-28 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
                  <HiOutlineEye size={28} className="text-gray-600" />
                </div>
                <p className="font-tertiary text-[10px] tracking-widest text-gray-600 uppercase mb-3">
                  Coming Soon
                </p>
                <h2 className="font-secondary text-3xl text-white mb-2">Eye Exam Bookings</h2>
                <p className="font-body text-gray-600 max-w-sm">
                  Appointment management for computerized eye examinations will live here.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};