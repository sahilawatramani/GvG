import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  color?: "blue" | "green" | "ember" | "steel";
  delay?: number;
}

export function MetricCard({ label, value, icon: Icon, trend, color = "blue", delay = 0 }: MetricCardProps) {
  const colorClasses = {
    blue: "from-[#3b82f6]/20 to-[#0ea5e9]/10 border-[#3b82f6]/30",
    green: "from-[#10b981]/20 to-[#059669]/10 border-[#10b981]/30",
    ember: "from-[#ef4444]/20 to-[#f97316]/10 border-[#ef4444]/30",
    steel: "from-[#6b7280]/20 to-[#4a5568]/10 border-[#6b7280]/30",
  };

  const iconColors = {
    blue: "text-[#3b82f6]",
    green: "text-[#10b981]",
    ember: "text-[#ef4444]",
    steel: "text-[#9ca3af]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-6`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[#9ca3af] mb-2">{label}</p>
          <p className="text-3xl tracking-tight mb-1">{value}</p>
          {trend && (
            <p className={`text-sm ${trend.direction === "up" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
              {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`rounded-lg bg-[#1a1d24] p-3 ${iconColors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}
