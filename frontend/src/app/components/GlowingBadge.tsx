import { motion } from "motion/react";

interface GlowingBadgeProps {
  status: "complete" | "running" | "ready" | "pending" | "error";
  label?: string;
}

const statusConfig = {
  complete: {
    bg: "bg-[#10b981]/15",
    text: "text-[#10b981]",
    border: "border-[#10b981]/30",
    dot: "bg-[#10b981]",
    glow: "shadow-[0_0_8px_rgba(16,185,129,0.3)]",
    label: "Complete",
  },
  running: {
    bg: "bg-[#0ea5e9]/15",
    text: "text-[#0ea5e9]",
    border: "border-[#0ea5e9]/30",
    dot: "bg-[#0ea5e9]",
    glow: "shadow-[0_0_8px_rgba(14,165,233,0.3)]",
    label: "Running",
  },
  ready: {
    bg: "bg-[#8b5cf6]/15",
    text: "text-[#8b5cf6]",
    border: "border-[#8b5cf6]/30",
    dot: "bg-[#8b5cf6]",
    glow: "shadow-[0_0_8px_rgba(139,92,246,0.3)]",
    label: "Ready",
  },
  pending: {
    bg: "bg-[#f59e0b]/15",
    text: "text-[#f59e0b]",
    border: "border-[#f59e0b]/30",
    dot: "bg-[#f59e0b]",
    glow: "shadow-[0_0_8px_rgba(245,158,11,0.3)]",
    label: "Pending",
  },
  error: {
    bg: "bg-[#ef4444]/15",
    text: "text-[#ef4444]",
    border: "border-[#ef4444]/30",
    dot: "bg-[#ef4444]",
    glow: "shadow-[0_0_8px_rgba(239,68,68,0.3)]",
    label: "Error",
  },
};

export function GlowingBadge({ status, label }: GlowingBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const isAnimated = status === "running";

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        text-xs font-semibold tracking-wide
        ${config.bg} ${config.text} border ${config.border}
        ${config.glow}
      `}
    >
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full ${config.dot} ${isAnimated ? "animate-ping opacity-75" : ""}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`} />
      </span>
      {label || config.label}
    </motion.span>
  );
}
