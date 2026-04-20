import { motion } from "motion/react";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glowColor?: "cyan" | "green" | "red" | "purple" | "orange";
  noPadding?: boolean;
}

const glowColors = {
  cyan: "hover:shadow-[0_0_30px_rgba(14,165,233,0.12)] hover:border-[rgba(14,165,233,0.3)]",
  green: "hover:shadow-[0_0_30px_rgba(16,185,129,0.12)] hover:border-[rgba(16,185,129,0.3)]",
  red: "hover:shadow-[0_0_30px_rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.3)]",
  purple: "hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] hover:border-[rgba(139,92,246,0.3)]",
  orange: "hover:shadow-[0_0_30px_rgba(249,115,22,0.12)] hover:border-[rgba(249,115,22,0.3)]",
};

export function GlassCard({
  children,
  className = "",
  delay = 0,
  hover = true,
  glowColor = "cyan",
  noPadding = false,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-[#0f1629]/90 via-[#131a2e]/70 to-[#0f1629]/90
        backdrop-blur-xl
        border border-[rgba(14,165,233,0.1)]
        ${hover ? `transition-all duration-400 ease-out hover:translate-y-[-2px] ${glowColors[glowColor]}` : ""}
        ${noPadding ? "" : "p-6"}
        ${className}
      `}
    >
      {/* Subtle top-edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0ea5e9]/20 to-transparent" />
      {children}
    </motion.div>
  );
}
