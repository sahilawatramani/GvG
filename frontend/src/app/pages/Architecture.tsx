import { motion } from "motion/react";
import { Shield, Zap, ArrowRight, ArrowDown, Network, Layers, GitBranch, Cpu, Binary, Brain, Database, BarChart3 } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

// Animated data flow component
function DataFlowLine({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex justify-center py-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="relative"
      >
        <ArrowDown className="h-6 w-6 text-[#0ea5e9]/40" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
        </motion.div>
      </motion.div>
    </div>
  );
}

export function Architecture() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
          ARCHITECTURE
        </h1>
        <p className="text-sm text-[#64748b]">Understanding the GAN-vs-GAN adversarial training framework</p>
      </motion.div>

      {/* Concept Overview */}
      <GlassCard delay={0.1} glowColor="purple">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-4 text-center">The GAN-vs-GAN Paradigm</h2>
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Traditional intrusion detection systems fail against adversarial attacks. Our GvG framework creates a
            continuous adversarial game between a <span className="text-[#ef4444] font-semibold">GAN-based attacker</span> and a{" "}
            <span className="text-[#10b981] font-semibold">Transformer-LSTM defender</span>, forcing the IDS to become robust through
            iterative adversarial retraining.
          </p>

          {/* Visual: Attacker vs Defender */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="flex items-center gap-3"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#ef4444]/20 to-[#f97316]/10 border border-[#ef4444]/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <Zap className="h-7 w-7 text-[#ef4444]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#ef4444]">Attacker</p>
                <p className="text-xs text-[#64748b]">cGAN Generator</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ x: [0, 5, 0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-gradient-to-r from-[#ef4444] to-[#64748b]" />
                <div className="px-3 py-1.5 rounded-full bg-[#131a2e] border border-[rgba(14,165,233,0.1)]">
                  <span className="text-[10px] font-mono text-[#0ea5e9]">ADVERSARIAL GAME</span>
                </div>
                <div className="h-px w-8 bg-gradient-to-r from-[#64748b] to-[#10b981]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="flex items-center gap-3"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#10b981]/20 to-[#059669]/10 border border-[#10b981]/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Shield className="h-7 w-7 text-[#10b981]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#10b981]">Defender</p>
                <p className="text-xs text-[#64748b]">Transformer-LSTM IDS</p>
              </div>
            </motion.div>
          </div>
        </div>
      </GlassCard>

      {/* System Architecture Flow */}
      <GlassCard delay={0.2} glowColor="cyan">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-8 text-center">System Architecture</h2>
        <div className="space-y-2 max-w-2xl mx-auto">

          {/* Step 1: Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-5 rounded-2xl border border-[#0ea5e9]/15 bg-[#0ea5e9]/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#0ea5e9]/15 border border-[#0ea5e9]/20 flex items-center justify-center">
                <Database className="h-5 w-5 text-[#0ea5e9]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0ea5e9]">1. Data Preprocessing</h3>
                <p className="text-[10px] text-[#64748b]">CICIDS2017 Dataset</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#94a3b8]">
              <span>• 2.8M network flow records</span>
              <span>• 78 features per sample</span>
              <span>• 5 attack classes + benign</span>
              <span>• Window-based sequencing (T=10)</span>
            </div>
          </motion.div>

          <DataFlowLine delay={0.4} />

          {/* Step 2: Baseline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="p-5 rounded-2xl border border-[#10b981]/15 bg-[#10b981]/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-[#10b981]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#10b981]">2. Baseline IDS Training</h3>
                <p className="text-[10px] text-[#64748b]">Transformer-LSTM Architecture</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#94a3b8]">
              <span>• Multi-head attention (4 heads)</span>
              <span>• Bidirectional LSTM (256 units)</span>
              <span>• Trained on clean data</span>
              <span>• Baseline accuracy: 95.42%</span>
            </div>
          </motion.div>

          <DataFlowLine delay={0.6} />

          {/* Step 3: Adversarial Loop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="relative"
          >
            <div className="absolute -left-3 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-[#ef4444]/30 via-[#8b5cf6]/30 to-[#10b981]/30" />
            <div className="p-5 rounded-2xl border border-[#8b5cf6]/15 bg-[#8b5cf6]/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/20 flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-[#8b5cf6]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#8b5cf6]">3. Adversarial Training Loop (8 Rounds)</h3>
                  <p className="text-[10px] text-[#64748b]">GAN-vs-IDS Minimax Game</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-[#ef4444]" />
                    <span className="text-xs font-semibold text-[#ef4444]">cGAN Attacker</span>
                  </div>
                  <ul className="text-[11px] text-[#94a3b8] space-y-1">
                    <li>• Generator: Creates adversarial samples</li>
                    <li>• Discriminator: Ensures realism</li>
                    <li>• Objective: Fool current IDS</li>
                    <li>• Constraint: Min perturbation</li>
                  </ul>
                  <div className="mt-3 px-3 py-2 rounded-lg bg-[#0a0e1a]/60">
                    <span className="text-[10px] font-mono text-[#ef4444]">Final fooling: 84.56%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#10b981]/5 border border-[#10b981]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-[#10b981]" />
                    <span className="text-xs font-semibold text-[#10b981]">Robust IDS</span>
                  </div>
                  <ul className="text-[11px] text-[#94a3b8] space-y-1">
                    <li>• Same Transformer-LSTM arch</li>
                    <li>• Retrained on clean + adversarial</li>
                    <li>• Learns robust boundaries</li>
                    <li>• Adapts to evasion strategies</li>
                  </ul>
                  <div className="mt-3 px-3 py-2 rounded-lg bg-[#0a0e1a]/60">
                    <span className="text-[10px] font-mono text-[#10b981]">Robust accuracy: 96.87%</span>
                  </div>
                </div>
              </div>

              {/* Feedback indicator */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[rgba(139,92,246,0.1)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
                <span className="text-[10px] text-[#64748b]">Iterative feedback loop between attacker and defender</span>
              </div>
            </div>
          </motion.div>

          <DataFlowLine delay={0.8} />

          {/* Step 4: Evaluation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            className="p-5 rounded-2xl border border-[#f59e0b]/15 bg-[#f59e0b]/5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f59e0b]">4. Evaluation & Deployment</h3>
                <p className="text-[10px] text-[#64748b]">Final Model & Metrics</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#94a3b8]">
              <span>• Confusion matrix analysis</span>
              <span>• ROC-AUC, precision, recall, F1</span>
              <span>• False positive/negative rates</span>
              <span>• Custom CSV scoring endpoint</span>
            </div>
          </motion.div>
        </div>
      </GlassCard>

      {/* Technical Components */}
      <GlassCard delay={0.3} glowColor="green">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">Technical Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-[#10b981] mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Baseline & Robust IDS
            </h3>
            <div className="space-y-2">
              {[
                { name: "Input Layer", desc: "Sequence of 10 timesteps × 78 features" },
                { name: "Transformer Block", desc: "Multi-head self-attention (4 heads, 128-dim)" },
                { name: "LSTM Layer", desc: "2-layer bidirectional LSTM (256 units)" },
                { name: "Output Layer", desc: "Softmax over 5 attack classes + benign" },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-3 rounded-xl bg-[#0a0e1a]/50 border border-[#10b981]/08 hover:border-[#10b981]/20 transition-all"
                >
                  <p className="text-xs font-semibold text-[#e2e8f0] mb-0.5">{item.name}</p>
                  <p className="text-[11px] text-[#64748b]">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#ef4444] mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Conditional GAN Attacker
            </h3>
            <div className="space-y-2">
              {[
                { name: "Generator", desc: "Noise + class label → adversarial sample" },
                { name: "Discriminator", desc: "Real vs fake + class verification" },
                { name: "Loss Function", desc: "Fooling loss + realism loss + L2 constraint" },
                { name: "Training Strategy", desc: "8 rounds with increasing difficulty" },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-3 rounded-xl bg-[#0a0e1a]/50 border border-[#ef4444]/08 hover:border-[#ef4444]/20 transition-all"
                >
                  <p className="text-xs font-semibold text-[#e2e8f0] mb-0.5">{item.name}</p>
                  <p className="text-[11px] text-[#64748b]">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Key Innovations */}
      <GlassCard delay={0.4} glowColor="purple">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">Key Innovations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: GitBranch, title: "Adversarial Loop", desc: "Iterative attacker-defender game forces continuous improvement of both components", color: "#0ea5e9" },
            { icon: Shield, title: "Robust Learning", desc: "Retraining on adversarial samples creates resilient decision boundaries", color: "#10b981" },
            { icon: Zap, title: "Realistic Attacks", desc: "cGAN produces stealthy, class-conditional adversarial network traffic", color: "#ef4444" },
          ].map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -3, scale: 1.02 }}
              className="p-5 rounded-xl bg-[#0a0e1a]/50 transition-all duration-300"
              style={{ border: `1px solid ${item.color}15` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${item.color}40`;
                e.currentTarget.style.boxShadow = `0 0 25px ${item.color}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${item.color}15`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}05)`, border: `1px solid ${item.color}20` }}>
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                </div>
                <h3 className="text-sm font-semibold text-[#e2e8f0]">{item.title}</h3>
              </div>
              <p className="text-xs text-[#64748b] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Research Context */}
      <GlassCard delay={0.5} glowColor="cyan">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Research Context</h2>
        <p className="text-sm text-[#94a3b8] leading-relaxed">
          This work extends adversarial machine learning to the network intrusion detection domain. By framing
          security as a competitive game between attacker and defender, we achieve higher robustness than standard
          training or simple data augmentation approaches. The GvG framework is applicable to any classification
          task where adversarial robustness is critical.
        </p>
      </GlassCard>
    </div>
  );
}
