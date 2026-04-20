import { motion } from "motion/react";
import { pipelineStages } from "../lib/mockData";
import { GlowingBadge } from "../components/GlowingBadge";
import { GlassCard } from "../components/GlassCard";
import { ArrowRight, CheckCircle2, Zap, Shield, Database, BarChart3, Upload, Cpu } from "lucide-react";

const stageIcons = [Database, Cpu, Zap, Shield, BarChart3, Upload];
const stageColors = ["#0ea5e9", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b"];

export function Pipeline() {
  return (
    <div className="p-4 lg:p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
          PIPELINE
        </h1>
        <p className="text-sm text-[#64748b]">
          End-to-end workflow from data preprocessing to adversarial defense evaluation
        </p>
      </motion.div>

      {/* ============================================
          DESKTOP PIPELINE FLOW
          ============================================ */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Animated connection line */}
          <div className="absolute top-[88px] left-[8%] right-[8%] h-[2px]">
            <div className="h-full bg-gradient-to-r from-[#0ea5e9] via-[#8b5cf6] to-[#10b981] opacity-30" />
            <motion.div
              className="absolute top-0 h-full bg-gradient-to-r from-[#0ea5e9] via-[#8b5cf6] to-[#10b981]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            />
          </div>

          <div className="grid grid-cols-6 gap-4">
            {pipelineStages.map((stage, index) => {
              const Icon = stageIcons[index];
              const color = stageColors[index];
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  {/* Node dot on the line */}
                  <div className="flex justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.2, type: "spring" }}
                      className="relative z-20 flex h-12 w-12 items-center justify-center rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                        border: `2px solid ${color}50`,
                        boxShadow: `0 0 20px ${color}20`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                      {/* Animated ping on complete stages */}
                      {stage.status === "complete" && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Stage Card */}
                  <div
                    className="rounded-2xl p-5 bg-gradient-to-br from-[#0f1629]/90 via-[#131a2e]/70 to-[#0f1629]/90 backdrop-blur-xl transition-all duration-400 hover:translate-y-[-3px]"
                    style={{
                      border: `1px solid ${color}15`,
                      boxShadow: `0 0 0 0 ${color}00`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${color}40`;
                      e.currentTarget.style.boxShadow = `0 0 25px ${color}12`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${color}15`;
                      e.currentTarget.style.boxShadow = `0 0 0 0 ${color}00`;
                    }}
                  >
                    <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent to-transparent" style={{ background: `linear-gradient(to right, transparent, ${color}30, transparent)` }} />

                    <div className="mb-3">
                      <GlowingBadge status={stage.status as any} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">{stage.name}</h3>
                    <p className="text-xs text-[#64748b] mb-3">{stage.description}</p>
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-[#475569]">
                        Duration: <span className="text-[#94a3b8]">{stage.duration}</span>
                      </p>
                      <p className="text-[10px] font-mono text-[#475569]">
                        Outputs: <span className="text-[#94a3b8]">{stage.outputs.length}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================
          MOBILE PIPELINE FLOW
          ============================================ */}
      <div className="lg:hidden space-y-3">
        {pipelineStages.map((stage, index) => {
          const Icon = stageIcons[index];
          const color = stageColors[index];
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                      border: `2px solid ${color}40`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <div
                      className="flex-1 w-px my-2"
                      style={{ background: `linear-gradient(to bottom, ${color}40, ${stageColors[index + 1]}40)`, minHeight: "40px" }}
                    />
                  )}
                </div>
                <GlassCard className="flex-1 !p-4" delay={index * 0.1} glowColor="cyan">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#e2e8f0]">{stage.name}</h3>
                      <p className="text-xs text-[#64748b] mt-0.5">{stage.description}</p>
                    </div>
                    <GlowingBadge status={stage.status as any} />
                  </div>
                  <p className="text-[10px] font-mono text-[#475569] mt-2">
                    Duration: <span className="text-[#94a3b8]">{stage.duration}</span>
                  </p>
                </GlassCard>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ============================================
          STAGE OUTPUTS
          ============================================ */}
      <GlassCard delay={1.2} glowColor="green">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Stage Outputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pipelineStages.map((stage, si) =>
            stage.outputs.map((output, idx) => (
              <motion.div
                key={`${stage.id}-${idx}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + (si * 2 + idx) * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)] hover:border-[rgba(14,165,233,0.15)] transition-all duration-300"
              >
                <CheckCircle2 className="h-4 w-4 text-[#10b981] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-[#e2e8f0] truncate">{output}</p>
                  <p className="text-[10px] text-[#64748b]">{stage.name}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </GlassCard>

      {/* ============================================
          ATTACKER vs DEFENDER
          ============================================ */}
      <GlassCard delay={1.5} glowColor="purple">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6 text-center">
          Attacker vs Defender Dynamics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attacker Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#ef4444]/20 to-[#f97316]/10 border border-[#ef4444]/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-[#ef4444]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#ef4444]">Attacker (cGAN)</h3>
                <p className="text-xs text-[#64748b]">Generates adversarial samples</p>
              </div>
            </div>
            {[
              { label: "Round 1-3: Learning baseline weaknesses", progress: 45 },
              { label: "Round 4-6: Increasing stealth", progress: 70 },
              { label: "Round 7-8: Maximum evasion", progress: 85 },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#0a0e1a]/50 border border-[#ef4444]/10">
                <p className="text-sm text-[#e2e8f0] mb-3">{item.label}</p>
                <div className="h-2 rounded-full bg-[#1e293b] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 1.5, delay: 1.8 + i * 0.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#ef4444] to-[#f97316]"
                    style={{ boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Defender Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#10b981]/20 to-[#059669]/10 border border-[#10b981]/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#10b981]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#10b981]">Defender (Robust IDS)</h3>
                <p className="text-xs text-[#64748b]">Learns to detect adversarial attacks</p>
              </div>
            </div>
            {[
              { label: "Baseline performance", progress: 95 },
              { label: "Adversarial retraining", progress: 89 },
              { label: "Final robust model", progress: 97 },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#0a0e1a]/50 border border-[#10b981]/10">
                <p className="text-sm text-[#e2e8f0] mb-3">{item.label}</p>
                <div className="h-2 rounded-full bg-[#1e293b] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 1.5, delay: 1.8 + i * 0.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#059669]"
                    style={{ boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback loop indicator */}
        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-[rgba(14,165,233,0.08)]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#ef4444]/30 to-transparent" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#131a2e] border border-[rgba(14,165,233,0.1)]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
            <span className="text-xs font-medium text-[#94a3b8]">Iterative Feedback Loop</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#10b981]/30 to-transparent" />
        </div>
      </GlassCard>
    </div>
  );
}
