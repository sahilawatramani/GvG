import { Outlet, NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Network,
  FlaskConical,
  BarChart3,
  Crosshair,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "sonner";
import { ParticleBackground } from "../components/ParticleBackground";
import { checkHealth } from "../lib/api";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/architecture", label: "Architecture", icon: Network },
  { path: "/training-lab", label: "Training Lab", icon: FlaskConical },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/live-demo", label: "Live Demo", icon: Crosshair },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="font-mono text-sm text-[#0ea5e9] tabular-nums">
      {time.toLocaleTimeString("en-US", { hour12: false })}
    </span>
  );
}

export function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Poll backend health every 30 seconds
  useEffect(() => {
    let mounted = true;
    const poll = () => {
      checkHealth()
        .then(() => { if (mounted) setBackendOnline(true); })
        .catch(() => { if (mounted) setBackendOnline(false); });
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="dark min-h-screen bg-[#0a0e1a] text-foreground relative overflow-x-hidden">
      {/* 3D Particle Background */}
      <ParticleBackground />

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(15, 22, 41, 0.9)",
            border: "1px solid rgba(14, 165, 233, 0.2)",
            backdropFilter: "blur(20px)",
          },
        }}
      />

      {/* ============================================
          DESKTOP SIDEBAR
          ============================================ */}
      <aside
        className={`
          hidden lg:flex flex-col fixed top-0 left-0 h-screen z-50
          glass-sidebar transition-all duration-300 ease-out
          ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 p-4 h-16 border-b border-[rgba(14,165,233,0.08)]">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] shadow-lg shadow-[#0ea5e9]/20"
          >
            <Shield className="h-5 w-5 text-white" />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-sm font-display font-bold tracking-wider text-white leading-tight">
                  GvG DEFENSE
                </h1>
                <p className="text-[10px] text-[#64748b] tracking-wide">
                  COMMAND CENTER
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-6 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-[#0ea5e9]/10 text-[#0ea5e9]"
                    : "text-[#64748b] hover:text-[#94a3b8] hover:bg-[#131a2e]"
                } ${sidebarCollapsed ? "justify-center" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full bg-[#0ea5e9] shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${isActive ? "drop-shadow-[0_0_6px_rgba(14,165,233,0.5)]" : ""}`} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-1.5 rounded-lg bg-[#131a2e] border border-[rgba(14,165,233,0.15)] text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[rgba(14,165,233,0.08)]">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full p-2 rounded-xl text-[#64748b] hover:text-[#94a3b8] hover:bg-[#131a2e] transition-all duration-300"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <div className="flex items-center gap-2 w-full">
                <ChevronLeft className="h-5 w-5" />
                <span className="text-xs">Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ============================================
          MOBILE HEADER
          ============================================ */}
      <header className="lg:hidden sticky top-0 z-50 glass border-b border-[rgba(14,165,233,0.1)]">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-sm font-display font-bold tracking-wider text-white">
              GvG DEFENSE
            </h1>
          </div>
          <button
            className="p-2 rounded-xl hover:bg-[#131a2e] text-[#94a3b8] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[rgba(14,165,233,0.08)] bg-[#0a0e1a]/95 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-1 p-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-[#0ea5e9]/10 text-[#0ea5e9]"
                          : "text-[#64748b] hover:bg-[#131a2e] hover:text-[#94a3b8]"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================
          TOP BAR (Desktop)
          ============================================ */}
      <header
        className={`
          hidden lg:flex sticky top-0 z-40 items-center justify-between h-14 px-6
          glass border-b border-[rgba(14,165,233,0.08)]
          transition-all duration-300
          ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}
        `}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={`h-2 w-2 rounded-full ${backendOnline === null ? 'bg-[#f59e0b]' : backendOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
              {backendOnline && <div className="absolute inset-0 h-2 w-2 rounded-full bg-[#10b981] animate-ping opacity-50" />}
            </div>
            <span className={`text-xs font-medium uppercase tracking-wider ${backendOnline === null ? 'text-[#f59e0b]' : backendOnline ? 'text-[#94a3b8]' : 'text-[#ef4444]'}`}>
              {backendOnline === null ? 'Checking...' : backendOnline ? 'Backend Online' : 'Backend Offline'}
            </span>
          </div>
          <div className="h-4 w-px bg-[#1e293b]" />
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#0ea5e9]" />
            <span className="text-xs text-[#64748b]">
              GvG IDS API · <span className="font-mono text-[#e2e8f0]">:8000</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131a2e] border border-[rgba(14,165,233,0.08)]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
            <span className="text-xs font-medium text-[#f59e0b]">THREAT: MODERATE</span>
          </div>
          <div className="h-4 w-px bg-[#1e293b]" />
          <LiveClock />
        </div>
      </header>

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <main
        className="relative z-10 min-h-[calc(100vh-3.5rem)] transition-all duration-300"
        style={{
          marginLeft: typeof window !== "undefined" && window.innerWidth >= 1024
            ? sidebarCollapsed ? "72px" : "220px"
            : "0px",
        }}
      >
        <Outlet />
      </main>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer
        className="relative z-10 border-t border-[rgba(14,165,233,0.08)] glass transition-all duration-300"
        style={{
          marginLeft: typeof window !== "undefined" && window.innerWidth >= 1024
            ? sidebarCollapsed ? "72px" : "220px"
            : "0px",
        }}
      >
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <Shield className="h-3.5 w-3.5 text-[#0ea5e9]" />
              <span className="font-display tracking-wider">GvG Defense Platform</span>
              <span className="text-[#334155]">|</span>
              <span>© 2026</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#475569]">
              <span>CICIDS2017</span>
              <span className="text-[#1e293b]">•</span>
              <span>Adversarial ML</span>
              <span className="text-[#1e293b]">•</span>
              <span>Research Grade</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
