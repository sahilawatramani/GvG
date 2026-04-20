import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";

interface AnimatedMetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  color?: "cyan" | "green" | "red" | "purple" | "orange";
  delay?: number;
  sparkline?: number[];
}

const colorConfig = {
  cyan: {
    icon: "text-[#0ea5e9]",
    iconBg: "from-[#0ea5e9]/20 to-[#0ea5e9]/5",
    glow: "shadow-[0_0_20px_rgba(14,165,233,0.15)]",
    border: "border-[rgba(14,165,233,0.2)]",
    hoverBorder: "hover:border-[rgba(14,165,233,0.4)]",
    sparkColor: "#0ea5e9",
    gradient: "from-[#0ea5e9]/10 to-transparent",
  },
  green: {
    icon: "text-[#10b981]",
    iconBg: "from-[#10b981]/20 to-[#10b981]/5",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    border: "border-[rgba(16,185,129,0.2)]",
    hoverBorder: "hover:border-[rgba(16,185,129,0.4)]",
    sparkColor: "#10b981",
    gradient: "from-[#10b981]/10 to-transparent",
  },
  red: {
    icon: "text-[#ef4444]",
    iconBg: "from-[#ef4444]/20 to-[#ef4444]/5",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    border: "border-[rgba(239,68,68,0.2)]",
    hoverBorder: "hover:border-[rgba(239,68,68,0.4)]",
    sparkColor: "#ef4444",
    gradient: "from-[#ef4444]/10 to-transparent",
  },
  purple: {
    icon: "text-[#8b5cf6]",
    iconBg: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    border: "border-[rgba(139,92,246,0.2)]",
    hoverBorder: "hover:border-[rgba(139,92,246,0.4)]",
    sparkColor: "#8b5cf6",
    gradient: "from-[#8b5cf6]/10 to-transparent",
  },
  orange: {
    icon: "text-[#f97316]",
    iconBg: "from-[#f97316]/20 to-[#f97316]/5",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.15)]",
    border: "border-[rgba(249,115,22,0.2)]",
    hoverBorder: "hover:border-[rgba(249,115,22,0.4)]",
    sparkColor: "#f97316",
    gradient: "from-[#f97316]/10 to-transparent",
  },
};

function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const width = 120;
  const height = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      width={width}
      height={height}
      className="absolute bottom-2 right-2 opacity-30"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AnimatedMetricCard({
  label,
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  icon: Icon,
  trend,
  color = "cyan",
  delay = 0,
  sparkline,
}: AnimatedMetricCardProps) {
  const config = colorConfig[color];
  const motionValue = useMotionValue(0);
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 2,
      delay: delay + 0.3,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => {
        if (displayRef.current) {
          displayRef.current.textContent = `${prefix}${latest.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [value, delay, decimals, prefix, suffix]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-[#0f1629]/90 via-[#131a2e]/70 to-[#0f1629]/90
        backdrop-blur-xl ${config.border} ${config.hoverBorder}
        transition-all duration-400 ease-out
        hover:translate-y-[-3px] hover:${config.glow}
        p-5 group cursor-default
      `}
    >
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0ea5e9]/20 to-transparent" />

      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-3">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span
              ref={displayRef}
              className={`text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono`}
            >
              {prefix}0{suffix}
            </span>
          </div>
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 1.5 }}
              className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                trend.direction === "up" ? "text-[#10b981]" : "text-[#ef4444]"
              }`}
            >
              <span>{trend.direction === "up" ? "▲" : "▼"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
          className={`
            flex h-12 w-12 items-center justify-center rounded-xl
            bg-gradient-to-br ${config.iconBg}
            ${config.icon}
          `}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      </div>

      {sparkline && <SparklineChart data={sparkline} color={config.sparkColor} />}
    </motion.div>
  );
}
