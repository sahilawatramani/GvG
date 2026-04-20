import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { Shield, AlertTriangle, Info, Zap, Eye, Lock } from "lucide-react";

interface FeedEvent {
  id: number;
  timestamp: string;
  message: string;
  severity: "info" | "warning" | "critical" | "success";
  source: string;
}

const severityConfig = {
  info: {
    color: "text-[#0ea5e9]",
    bg: "bg-[#0ea5e9]/10",
    border: "border-[#0ea5e9]/20",
    icon: Info,
    dot: "bg-[#0ea5e9]",
  },
  warning: {
    color: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    border: "border-[#f59e0b]/20",
    icon: AlertTriangle,
    dot: "bg-[#f59e0b]",
  },
  critical: {
    color: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    border: "border-[#ef4444]/20",
    icon: Zap,
    dot: "bg-[#ef4444]",
  },
  success: {
    color: "text-[#10b981]",
    bg: "bg-[#10b981]/10",
    border: "border-[#10b981]/20",
    icon: Shield,
    dot: "bg-[#10b981]",
  },
};

const eventTemplates: Omit<FeedEvent, "id" | "timestamp">[] = [
  { message: "Adversarial sample detected and quarantined", severity: "success", source: "Robust IDS" },
  { message: "cGAN generator attempted evasion — blocked", severity: "warning", source: "Defense Layer" },
  { message: "New attack pattern identified in traffic flow", severity: "critical", source: "Threat Intel" },
  { message: "Model checkpoint saved: robust_ids_v2.h5", severity: "info", source: "Training" },
  { message: "Baseline IDS accuracy holding at 95.42%", severity: "info", source: "Monitor" },
  { message: "DDoS signature match — 99.2% confidence", severity: "critical", source: "Classifier" },
  { message: "Adversarial retraining cycle completed", severity: "success", source: "Pipeline" },
  { message: "Port scan detected from obfuscated source", severity: "warning", source: "Network" },
  { message: "Feature extraction pipeline healthy", severity: "success", source: "Preprocessor" },
  { message: "GAN discriminator loss converging: 0.352", severity: "info", source: "cGAN" },
  { message: "Stealth attack blocked — perturbation > threshold", severity: "success", source: "Robust IDS" },
  { message: "Infiltration attempt: low confidence score", severity: "warning", source: "Classifier" },
  { message: "Real-time scoring latency: 12ms avg", severity: "info", source: "API" },
  { message: "Anomalous traffic spike on port 443", severity: "critical", source: "Network" },
  { message: "Robust model outperforming baseline by +1.45%", severity: "success", source: "Evaluator" },
];

function formatTime(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0];
}

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const counterRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with a few events
  useEffect(() => {
    const initial: FeedEvent[] = [];
    for (let i = 0; i < 5; i++) {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      initial.push({
        ...template,
        id: counterRef.current++,
        timestamp: formatTime(),
      });
    }
    setEvents(initial);
  }, []);

  // Add new events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const newEvent: FeedEvent = {
        ...template,
        id: counterRef.current++,
        timestamp: formatTime(),
      };

      setEvents((prev) => {
        const updated = [newEvent, ...prev];
        return updated.slice(0, 15); // Keep last 15
      });
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <div className="h-2 w-2 rounded-full bg-[#10b981]" />
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
        </div>
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
          Live Threat Feed
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto max-h-[350px] pr-1"
        style={{ scrollbarWidth: "thin" }}
      >
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const config = severityConfig[event.severity];
            const Icon = config.icon;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={`
                  flex items-start gap-3 p-3 rounded-xl
                  ${config.bg} border ${config.border}
                  transition-colors duration-300
                `}
              >
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e2e8f0] leading-snug">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[#64748b]">
                      {event.timestamp}
                    </span>
                    <span className="text-[10px] text-[#64748b]">•</span>
                    <span className={`text-[10px] font-medium ${config.color}`}>
                      {event.source}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
