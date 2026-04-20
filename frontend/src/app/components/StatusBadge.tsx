import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

type Status = "complete" | "ready" | "running" | "error" | "pending";

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const configs = {
    complete: {
      icon: CheckCircle2,
      color: "text-[#10b981] bg-[#10b981]/10",
      text: label || "Complete",
    },
    ready: {
      icon: CheckCircle2,
      color: "text-[#0ea5e9] bg-[#0ea5e9]/10",
      text: label || "Ready",
    },
    running: {
      icon: Loader2,
      color: "text-[#f59e0b] bg-[#f59e0b]/10",
      text: label || "Running",
    },
    error: {
      icon: AlertCircle,
      color: "text-[#ef4444] bg-[#ef4444]/10",
      text: label || "Error",
    },
    pending: {
      icon: Clock,
      color: "text-[#6b7280] bg-[#6b7280]/10",
      text: label || "Pending",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.color}`}>
      <Icon className={`h-3.5 w-3.5 ${status === "running" ? "animate-spin" : ""}`} />
      <span className="text-sm">{config.text}</span>
    </div>
  );
}
