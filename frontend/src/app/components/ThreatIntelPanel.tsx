import { motion } from "motion/react";
import { Shield, Zap, TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import type { EvasionResponse } from "../lib/api";

interface ThreatIntelPanelProps {
  data: EvasionResponse;
  onClose: () => void;
}

export function ThreatIntelPanel({ data, onClose }: ThreatIntelPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050814]/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0e1a] border border-[#0ea5e9]/20 shadow-[0_0_50px_rgba(14,165,233,0.1)] p-6 lg:p-8"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#f59e0b]/20 border border-[#f59e0b]/30">
              <Zap className="h-6 w-6 text-[#f59e0b]" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider text-white text-glow-orange">
                GAN ADVERSARIAL FORECASTING
              </h2>
              <p className="text-xs text-[#64748b] mt-1">
                Simulating attacker evasion patterns using the Attacker GAN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#ef4444]/10 text-[#ef4444] text-xs font-bold hover:bg-[#ef4444]/20 transition-colors"
          >
            CLOSE
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Shifts */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#0ea5e9]" />
              Morphological Feature Shifts
            </h3>
            <p className="text-xs text-[#64748b]">
              The top features the GAN altered to try and evade the IDS.
            </p>
            
            <div className="space-y-3 mt-4">
              {data.top_shifts.map((shift, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={shift.feature}
                  className="p-3 rounded-xl bg-[#131a2e]/50 border border-[rgba(14,165,233,0.1)] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#e2e8f0]">
                      {shift.feature}
                    </span>
                    {shift.shift === "increased" ? (
                      <div className="flex items-center gap-1 text-[#ef4444] text-[10px] font-bold uppercase">
                        <TrendingUp className="h-3 w-3" /> Increased
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[#10b981] text-[10px] font-bold uppercase">
                        <TrendingDown className="h-3 w-3" /> Decreased
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b]">
                    <div className="flex flex-col">
                      <span>Original Vector</span>
                      <span className="text-[#94a3b8]">{shift.original.toFixed(4)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span>Morphed Evasion</span>
                      <span className="text-[#e2e8f0]">{shift.morphed.toFixed(4)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Counter Measures */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#10b981]" />
              IDS Recommended Counter-Measures
            </h3>
            <p className="text-xs text-[#64748b]">
              Based on the forecasted evasion path, apply these defenses.
            </p>

            <div className="space-y-3 mt-4">
              {data.counter_measures.map((measure, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-[#10b981]/10 to-transparent border-l-2 border-[#10b981]"
                >
                  <Target className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-[#e2e8f0] leading-relaxed">
                    {measure}
                  </p>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 p-4 rounded-xl border border-dashed border-[#f59e0b]/50 bg-[#f59e0b]/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Shield className="h-24 w-24 text-[#f59e0b]" />
              </div>
              <h4 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider mb-2">
                Deployment Strategy
              </h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed relative z-10">
                The GAN simulates evasion by pushing these features toward benign distributions. Rate-limiting or deploying specific DPI signatures on these top shifted features will cut off the attacker's primary evasion vector.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
