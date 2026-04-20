import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface ThreatLevelIndicatorProps {
  level: number; // 0-100
  label?: string;
  size?: number;
}

export function ThreatLevelIndicator({
  level,
  label = "Threat Level",
  size = 180,
}: ThreatLevelIndicatorProps) {
  const [animatedLevel, setAnimatedLevel] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedLevel / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedLevel(level), 500);
    return () => clearTimeout(timer);
  }, [level]);

  const getColor = (l: number) => {
    if (l < 30) return { stroke: "#10b981", glow: "rgba(16, 185, 129, 0.3)", label: "LOW", textColor: "#10b981" };
    if (l < 60) return { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)", label: "MODERATE", textColor: "#f59e0b" };
    if (l < 80) return { stroke: "#f97316", glow: "rgba(249, 115, 22, 0.3)", label: "HIGH", textColor: "#f97316" };
    return { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.3)", label: "CRITICAL", textColor: "#ef4444" };
  };

  const colorInfo = getColor(level);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center gap-3"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
        {label}
      </p>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(30, 41, 59, 0.6)"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorInfo.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease",
              filter: `drop-shadow(0 0 8px ${colorInfo.glow})`,
            }}
          />
          {/* Glow ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorInfo.stroke}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            opacity={0.15}
            style={{
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold font-mono"
            style={{ color: colorInfo.textColor }}
          >
            {animatedLevel}
          </span>
          <span
            className="text-xs font-bold tracking-widest mt-1"
            style={{ color: colorInfo.textColor }}
          >
            {colorInfo.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
