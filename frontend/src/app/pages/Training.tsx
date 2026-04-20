import { motion } from "motion/react";
import { trainingHistory } from "../lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { TrendingUp, Clock, Zap, Target, Shield } from "lucide-react";
import { AnimatedMetricCard } from "../components/AnimatedMetricCard";
import { GlassCard } from "../components/GlassCard";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-[rgba(14,165,233,0.2)] shadow-xl">
      <p className="text-xs font-mono text-[#94a3b8] mb-2">Epoch {label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#64748b]">{entry.name}:</span>
          <span className="font-mono font-medium text-white">
            {entry.value < 1 ? (entry.value * 100).toFixed(2) + "%" : entry.value.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function Training() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
          TRAINING MONITOR
        </h1>
        <p className="text-sm text-[#64748b]">Model training history and performance tracking</p>
      </motion.div>

      {/* Training Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedMetricCard label="Baseline Epochs" value={10} icon={Target} color="cyan" delay={0.1} />
        <AnimatedMetricCard label="Robust Epochs" value={10} icon={Shield} color="green" delay={0.2} />
        <AnimatedMetricCard label="Generator Rounds" value={8} icon={Zap} color="red" delay={0.3} />
        <AnimatedMetricCard label="Total Training Time" value={154} suffix="m" icon={Clock} color="purple" delay={0.4} />
      </div>

      {/* Baseline IDS Training */}
      <GlassCard delay={0.5} glowColor="cyan">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-[#e2e8f0]">Baseline IDS Training</h2>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
              <span className="text-[#64748b]">Training</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              <span className="text-[#64748b]">Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" style={{ opacity: 0.5 }} />
              <span className="text-[#64748b]">Loss</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trainingHistory.baseline}>
            <defs>
              <linearGradient id="gradAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradValAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="epoch" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" domain={[0, 1]} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} fill="url(#gradAcc)" name="Train Accuracy" dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="val_accuracy" stroke="#10b981" strokeWidth={2} fill="url(#gradValAcc)" name="Val Accuracy" dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Loss" opacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Final Accuracy", value: `${(trainingHistory.baseline[9].accuracy * 100).toFixed(2)}%`, color: "#3b82f6" },
            { label: "Val Accuracy", value: `${(trainingHistory.baseline[9].val_accuracy * 100).toFixed(2)}%`, color: "#10b981" },
            { label: "Final Loss", value: trainingHistory.baseline[9].loss.toFixed(4), color: "#ef4444" },
            { label: "Val Loss", value: trainingHistory.baseline[9].val_loss.toFixed(4), color: "#f59e0b" },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-lg font-mono font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Robust IDS Training */}
      <GlassCard delay={0.6} glowColor="green">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-[#e2e8f0]">
            Robust IDS Training <span className="text-xs text-[#10b981] font-normal">(Adversarial Retraining)</span>
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trainingHistory.robust}>
            <defs>
              <linearGradient id="gradAccR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradValAccR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="epoch" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" domain={[0, 1]} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} fill="url(#gradAccR)" name="Train Accuracy" dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="val_accuracy" stroke="#10b981" strokeWidth={2} fill="url(#gradValAccR)" name="Val Accuracy" dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Loss" opacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Final Accuracy", value: `${(trainingHistory.robust[9].accuracy * 100).toFixed(2)}%`, color: "#3b82f6" },
            { label: "Val Accuracy", value: `${(trainingHistory.robust[9].val_accuracy * 100).toFixed(2)}%`, color: "#10b981" },
            { label: "Final Loss", value: trainingHistory.robust[9].loss.toFixed(4), color: "#ef4444" },
            { label: "Val Loss", value: trainingHistory.robust[9].val_loss.toFixed(4), color: "#f59e0b" },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-lg font-mono font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Generator Training */}
      <GlassCard delay={0.7} glowColor="red">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">cGAN Generator Progress</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trainingHistory.generator}>
            <defs>
              <linearGradient id="gradFool" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradStealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="round" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" domain={[0, 1]} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="fooling_rate" stroke="#ef4444" strokeWidth={2} fill="url(#gradFool)" name="Fooling Rate" dot={{ fill: "#ef4444", r: 4, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="stealth_score" stroke="#f59e0b" strokeWidth={2} fill="url(#gradStealth)" name="Stealth Score" dot={{ fill: "#f59e0b", r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="loss" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Generator Loss" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {[
            { label: "Final Fooling Rate", value: `${(trainingHistory.generator[7].fooling_rate * 100).toFixed(2)}%`, color: "#ef4444" },
            { label: "Final Stealth Score", value: `${(trainingHistory.generator[7].stealth_score * 100).toFixed(2)}%`, color: "#f59e0b" },
            { label: "Final Loss", value: trainingHistory.generator[7].loss.toFixed(4), color: "#64748b" },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(239,68,68,0.08)]">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-lg font-mono font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Model Checkpoints */}
      <GlassCard delay={0.8} glowColor="purple">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Model Checkpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Target, name: "Baseline IDS", checkpoint: "epoch_10.h5", size: "143 MB", metric: "Accuracy: 95.42%", color: "#0ea5e9" },
            { icon: Zap, name: "cGAN Generator", checkpoint: "round_8.h5", size: "87 MB", metric: "Fooling Rate: 84.56%", color: "#ef4444" },
            { icon: Shield, name: "Robust IDS", checkpoint: "epoch_10.h5", size: "148 MB", metric: "Accuracy: 96.87%", color: "#10b981" },
          ].map((model) => (
            <motion.div
              key={model.name}
              whileHover={{ y: -3, scale: 1.01 }}
              className="p-5 rounded-xl bg-[#0a0e1a]/50 transition-all duration-300"
              style={{ border: `1px solid ${model.color}15` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${model.color}40`;
                e.currentTarget.style.boxShadow = `0 0 20px ${model.color}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${model.color}15`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${model.color}20, ${model.color}05)`, border: `1px solid ${model.color}20` }}>
                  <model.icon className="h-5 w-5" style={{ color: model.color }} />
                </div>
                <h3 className="text-sm font-semibold text-[#e2e8f0]">{model.name}</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-[#64748b]">Checkpoint</span><span className="font-mono text-[#94a3b8]">{model.checkpoint}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Size</span><span className="font-mono text-[#94a3b8]">{model.size}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Performance</span><span className="font-mono" style={{ color: model.color }}>{model.metric}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
