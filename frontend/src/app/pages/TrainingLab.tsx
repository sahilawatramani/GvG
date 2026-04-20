import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { fetchTrainingHistory, fetchGenerator, fetchManifest, type TrainingHistoryResponse, type GeneratorResponse, type ManifestResponse } from "../lib/api";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from "recharts";
import { TrendingUp, Clock, Zap, Target, Shield, Eye, Crosshair, FlaskConical } from "lucide-react";
import { AnimatedMetricCard } from "../components/AnimatedMetricCard";
import { GlassCard } from "../components/GlassCard";

type Tab = "training" | "adversarial";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-[rgba(14,165,233,0.2)] shadow-xl">
      <p className="text-xs font-mono text-[#94a3b8] mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#64748b]">{entry.name}:</span>
          <span className="font-mono font-medium text-white">
            {typeof entry.value === "number" ? entry.value.toFixed(4) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function TrainingLab() {
  const [activeTab, setActiveTab] = useState<Tab>("training");
  const [history, setHistory] = useState<TrainingHistoryResponse>({});
  const [generator, setGenerator] = useState<GeneratorResponse>({});
  const [manifest, setManifest] = useState<ManifestResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchTrainingHistory().catch(() => ({})),
      fetchGenerator().catch(() => ({})),
      fetchManifest().catch(() => null),
    ]).then(([h, g, m]) => {
      if (!mounted) return;
      setHistory(h as TrainingHistoryResponse);
      setGenerator(g as GeneratorResponse);
      setManifest(m as ManifestResponse | null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const baselineEpochs = history.baseline || [];
  const robustEpochs = history.robust || [];
  const genFeedback = generator.feedback || generator.state?.feedback_history || [];
  const genState = generator.state;

  const baselineFinalLoss = baselineEpochs.length > 0 ? baselineEpochs[baselineEpochs.length - 1].tabular_train_loss : 0;
  const robustFinalLoss = robustEpochs.length > 0 ? robustEpochs[robustEpochs.length - 1].tabular_train_loss : 0;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
            TRAINING LAB
          </h1>
          <p className="text-sm text-[#64748b]">Model training, adversarial attack generation, and defense evaluation</p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-1 p-1 rounded-xl bg-[#0f1629] border border-[rgba(14,165,233,0.1)]"
        >
          {[
            { id: "training" as Tab, label: "Model Training", icon: TrendingUp },
            { id: "adversarial" as Tab, label: "Adversarial Analysis", icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-[#0ea5e9]/15 text-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.1)]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* ============================================
          MODEL TRAINING TAB
          ============================================ */}
      {activeTab === "training" && (
        <motion.div
          key="training"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Training Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatedMetricCard label="Baseline Final Loss" value={baselineFinalLoss} decimals={4} icon={Target} color="cyan" delay={0.1} />
            <AnimatedMetricCard label="Robust Final Loss" value={robustFinalLoss} decimals={4} icon={Shield} color="green" trend={robustFinalLoss < baselineFinalLoss ? { value: parseFloat((((baselineFinalLoss - robustFinalLoss) / (baselineFinalLoss || 1)) * 100).toFixed(1)), direction: "down" } : undefined} delay={0.2} />
            <AnimatedMetricCard label="Generator Rounds" value={genFeedback.length} icon={Zap} color="red" delay={0.3} />
            <AnimatedMetricCard label="Training Epochs" value={manifest?.ids_epochs ?? baselineEpochs.length} icon={Clock} color="purple" delay={0.4} />
          </div>

          {/* Baseline + Robust Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Baseline IDS */}
            <GlassCard delay={0.5} glowColor="cyan">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#3b82f6]/15 border border-[#3b82f6]/20 flex items-center justify-center">
                  <Target className="h-4 w-4 text-[#3b82f6]" />
                </div>
                <h2 className="text-base font-semibold text-[#e2e8f0]">Baseline IDS — Loss Curves</h2>
              </div>
              {baselineEpochs.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={baselineEpochs}>
                      <defs>
                        <linearGradient id="gradTabB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradSeqB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                      <XAxis dataKey="epoch" stroke="#475569" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="tabular_train_loss" stroke="#3b82f6" strokeWidth={2} fill="url(#gradTabB)" name="Tabular Train" dot={{ fill: "#3b82f6", r: 2, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="tabular_validation_loss" stroke="#10b981" strokeWidth={2} fill="url(#gradSeqB)" name="Tabular Val" dot={{ fill: "#10b981", r: 2, strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="sequence_train_loss" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Seq Train" opacity={0.6} />
                      <Line type="monotone" dataKey="sequence_validation_loss" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Seq Val" opacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2.5 rounded-lg bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
                      <p className="text-[9px] text-[#64748b] uppercase tracking-wider">Final Tabular Loss</p>
                      <p className="text-base font-mono font-bold text-[#3b82f6]">{baselineFinalLoss.toFixed(4)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
                      <p className="text-[9px] text-[#64748b] uppercase tracking-wider">Epochs</p>
                      <p className="text-base font-mono font-bold text-[#10b981]">{baselineEpochs.length}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-[#475569] text-xs">
                  {loading ? "Loading..." : "No training data available"}
                </div>
              )}
            </GlassCard>

            {/* Robust IDS */}
            <GlassCard delay={0.6} glowColor="green">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-[#10b981]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#e2e8f0]">Robust IDS — Loss Curves</h2>
                  <p className="text-[10px] text-[#10b981]">Adversarially Retrained</p>
                </div>
              </div>
              {robustEpochs.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={robustEpochs}>
                      <defs>
                        <linearGradient id="gradTabR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradSeqR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                      <XAxis dataKey="epoch" stroke="#475569" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="tabular_train_loss" stroke="#3b82f6" strokeWidth={2} fill="url(#gradTabR)" name="Tabular Train" dot={{ fill: "#3b82f6", r: 2, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="tabular_validation_loss" stroke="#10b981" strokeWidth={2} fill="url(#gradSeqR)" name="Tabular Val" dot={{ fill: "#10b981", r: 2, strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="sequence_train_loss" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Seq Train" opacity={0.6} />
                      <Line type="monotone" dataKey="sequence_validation_loss" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Seq Val" opacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2.5 rounded-lg bg-[#0a0e1a]/50 border border-[rgba(10,185,129,0.08)]">
                      <p className="text-[9px] text-[#64748b] uppercase tracking-wider">Final Tabular Loss</p>
                      <p className="text-base font-mono font-bold text-[#10b981]">{robustFinalLoss.toFixed(4)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0a0e1a]/50 border border-[rgba(10,185,129,0.08)]">
                      <p className="text-[9px] text-[#64748b] uppercase tracking-wider">Epochs</p>
                      <p className="text-base font-mono font-bold text-[#10b981]">{robustEpochs.length}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-[#475569] text-xs">
                  {loading ? "Loading..." : "No training data available"}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Model Checkpoints */}
          <GlassCard delay={0.8} glowColor="purple">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Model Checkpoints</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Target, name: "Baseline IDS", checkpoint: "baseline_ids.pt", metric: `Loss: ${baselineFinalLoss.toFixed(4)}`, color: "#0ea5e9" },
                { icon: Zap, name: "cGAN Generator", checkpoint: "attacker_cgan.pt", metric: `${genFeedback.length} rounds`, color: "#ef4444" },
                { icon: Shield, name: "Robust IDS", checkpoint: "robust_ids.pt", metric: `Loss: ${robustFinalLoss.toFixed(4)}`, color: "#10b981" },
              ].map((model) => (
                <motion.div
                  key={model.name}
                  whileHover={{ y: -3 }}
                  className="p-5 rounded-xl bg-[#0a0e1a]/50 transition-all duration-300"
                  style={{ border: `1px solid ${model.color}15` }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${model.color}40`; e.currentTarget.style.boxShadow = `0 0 20px ${model.color}10`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${model.color}15`; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${model.color}20, ${model.color}05)`, border: `1px solid ${model.color}20` }}>
                      <model.icon className="h-5 w-5" style={{ color: model.color }} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#e2e8f0]">{model.name}</h3>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-[#64748b]">Checkpoint</span><span className="font-mono text-[#94a3b8]">{model.checkpoint}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748b]">Performance</span><span className="font-mono" style={{ color: model.color }}>{model.metric}</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ============================================
          ADVERSARIAL ANALYSIS TAB
          ============================================ */}
      {activeTab === "adversarial" && (
        <motion.div
          key="adversarial"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Adversarial Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatedMetricCard label="Adversarial Rounds" value={genFeedback.length} icon={Zap} color="red" delay={0.1} />
            <AnimatedMetricCard label="GAN Epochs" value={genState?.epochs ?? manifest?.gan_epochs ?? 0} icon={Eye} color="orange" delay={0.2} />
            <AnimatedMetricCard label="Latent Dim" value={genState?.latent_dim ?? manifest?.latent_dim ?? 0} icon={Crosshair} color="cyan" delay={0.3} />
            <AnimatedMetricCard label="Stealth Weight" value={genState?.stealth_weight ?? 0} decimals={2} icon={Shield} color="green" delay={0.4} />
          </div>

          {/* Generator Feedback Over Rounds */}
          {genFeedback.length > 0 && (
            <GlassCard delay={0.5} glowColor="red">
              <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">Generator Feedback Per Round</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={genFeedback} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                  <XAxis dataKey="round_id" stroke="#475569" tick={{ fontSize: 11 }} label={{ value: "Round", position: "insideBottom", offset: -5, fontSize: 10, fill: "#475569" }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                  <Tooltip content={({ active, payload, label }: any) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="glass-card rounded-xl p-3 border border-[rgba(14,165,233,0.2)] shadow-xl">
                        <p className="text-xs font-mono text-[#94a3b8] mb-2">Round {label}</p>
                        {payload.map((entry: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[#64748b]">{entry.name}:</span>
                            <span className="font-mono font-medium text-white">{typeof entry.value === "number" ? entry.value.toFixed(4) : entry.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }} />
                  <Bar dataKey="detection_rate" fill="#10b981" radius={[6, 6, 0, 0]} name="Detection Rate" fillOpacity={0.8} />
                  <Bar dataKey="generator_loss" fill="#ef4444" radius={[6, 6, 0, 0]} name="Generator Loss" fillOpacity={0.8} />
                  <Bar dataKey="stealth_weight" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Stealth Weight" fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Round Breakdown Table */}
          {genFeedback.length > 0 && (
            <GlassCard delay={0.7} glowColor="purple">
              <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Round-by-Round Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(14,165,233,0.08)]">
                      {["Round", "Detection Rate", "Stealth Weight", "Generator Loss"].map((h) => (
                        <th key={h} className={`${h === "Round" ? "text-left" : "text-right"} p-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {genFeedback.map((round, index) => (
                      <motion.tr
                        key={round.round_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.05 }}
                        className="border-b border-[rgba(14,165,233,0.05)] hover:bg-[#131a2e]/50 transition-colors"
                      >
                        <td className="p-3">
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-[10px] font-mono font-bold" style={{ background: `rgba(239,68,68,0.15)`, border: `1px solid rgba(239,68,68,0.3)`, color: "#ef4444" }}>
                            {round.round_id}
                          </span>
                        </td>
                        <td className="text-right p-3"><span className="font-mono text-sm text-[#10b981]">{(round.detection_rate * 100).toFixed(1)}%</span></td>
                        <td className="text-right p-3"><span className="font-mono text-sm text-[#f59e0b]">{round.stealth_weight.toFixed(2)}</span></td>
                        <td className="text-right p-3"><span className="font-mono text-sm text-[#ef4444]">{round.generator_loss.toFixed(4)}</span></td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* Generator Config */}
          {genState && (
            <GlassCard delay={0.8} glowColor="orange">
              <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Generator Configuration</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Latent Dim", value: genState.latent_dim.toString(), color: "#ef4444" },
                  { label: "Epochs", value: genState.epochs.toString(), color: "#f59e0b" },
                  { label: "Learning Rate", value: genState.learning_rate.toFixed(4), color: "#3b82f6" },
                  { label: "Final Stealth Weight", value: genState.stealth_weight.toFixed(2), color: "#10b981" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="p-4 rounded-xl bg-[#0a0e1a]/50 text-center"
                    style={{ border: `1px solid ${item.color}15` }}
                  >
                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">{item.label}</p>
                    <p className="text-xl font-mono font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

          {genFeedback.length === 0 && !loading && (
            <GlassCard delay={0.5} glowColor="red">
              <div className="flex items-center justify-center py-12 text-[#475569] text-sm">
                No adversarial data available. Make sure the backend is running.
              </div>
            </GlassCard>
          )}
        </motion.div>
      )}
    </div>
  );
}
