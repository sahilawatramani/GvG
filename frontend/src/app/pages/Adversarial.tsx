import { motion } from "motion/react";
import { adversarialAnalysis } from "../lib/mockData";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { Shield, Zap, TrendingUp, AlertTriangle, Crosshair, Eye } from "lucide-react";
import { AnimatedMetricCard } from "../components/AnimatedMetricCard";
import { GlassCard } from "../components/GlassCard";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-[rgba(14,165,233,0.2)] shadow-xl">
      <p className="text-xs font-mono text-[#94a3b8] mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#64748b]">{entry.name}:</span>
          <span className="font-mono font-medium text-white">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};

export function Adversarial() {
  const detectionComparison = adversarialAnalysis.rounds.map((round) => ({
    round: `R${round.round}`,
    baseline: +((round.detected_baseline / round.generated) * 100).toFixed(1),
    robust: +((round.detected_robust / round.generated) * 100).toFixed(1),
    fooling_rate: +(round.fooling_rate * 100).toFixed(1),
  }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
          ADVERSARIAL LAB
        </h1>
        <p className="text-sm text-[#64748b]">Generated attack samples and detection performance comparison</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedMetricCard
          label="Generated Samples"
          value={adversarialAnalysis.generatedSamples}
          icon={Zap}
          color="red"
          delay={0.1}
        />
        <AnimatedMetricCard
          label="Stealthy Samples"
          value={adversarialAnalysis.stealthySamples}
          icon={Eye}
          color="orange"
          delay={0.2}
        />
        <AnimatedMetricCard
          label="Detected by Baseline"
          value={adversarialAnalysis.detectedByBaseline}
          icon={Crosshair}
          color="cyan"
          delay={0.3}
        />
        <AnimatedMetricCard
          label="Detected by Robust"
          value={adversarialAnalysis.detectedByRobust}
          icon={Shield}
          color="green"
          trend={{ value: 196.1, direction: "up" }}
          delay={0.4}
        />
      </div>

      {/* Detection Rate Comparison */}
      <GlassCard delay={0.5} glowColor="cyan">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">
          Detection Rate: Baseline vs Robust IDS
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={detectionComparison} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="round" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
            />
            <Bar dataKey="baseline" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Baseline IDS %" fillOpacity={0.8}>
            </Bar>
            <Bar dataKey="robust" fill="#10b981" radius={[6, 6, 0, 0]} name="Robust IDS %" fillOpacity={0.8}>
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          {[
            {
              label: "Baseline Avg Detection",
              value: `${((adversarialAnalysis.detectedByBaseline / adversarialAnalysis.generatedSamples) * 100).toFixed(2)}%`,
              color: "#3b82f6",
            },
            {
              label: "Robust Avg Detection",
              value: `${((adversarialAnalysis.detectedByRobust / adversarialAnalysis.generatedSamples) * 100).toFixed(2)}%`,
              color: "#10b981",
            },
            {
              label: "Improvement",
              value: `+${(((adversarialAnalysis.detectedByRobust - adversarialAnalysis.detectedByBaseline) / adversarialAnalysis.detectedByBaseline) * 100).toFixed(1)}%`,
              color: "#10b981",
            },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-xl font-mono font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Fooling Rate Progression */}
      <GlassCard delay={0.6} glowColor="red">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">Attacker Fooling Rate Progression</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={adversarialAnalysis.rounds}>
            <defs>
              <linearGradient id="gradFoolRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="round" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" domain={[0, 1]} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (!active || !payload) return null;
                return (
                  <div className="glass-card rounded-xl p-3 border border-[rgba(239,68,68,0.2)] shadow-xl">
                    <p className="text-xs font-mono text-[#94a3b8] mb-1">Round {label}</p>
                    <p className="text-sm font-mono font-bold text-[#ef4444]">
                      {(payload[0]?.value * 100).toFixed(2)}%
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="fooling_rate"
              stroke="#ef4444"
              strokeWidth={3}
              fill="url(#gradFoolRate)"
              name="Fooling Rate"
              dot={{ fill: "#ef4444", r: 5, strokeWidth: 2, stroke: "#0a0e1a" }}
              activeDot={{ r: 7, stroke: "#ef4444", strokeWidth: 2, fill: "#0a0e1a" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-[#64748b] mt-4 leading-relaxed">
          The attacker's ability to evade the baseline IDS increased from <span className="text-[#ef4444] font-mono">23%</span> to{" "}
          <span className="text-[#ef4444] font-mono">85%</span> over 8 rounds, demonstrating the adversarial learning capability of the cGAN.
        </p>
      </GlassCard>

      {/* Round-by-Round Breakdown */}
      <GlassCard delay={0.7} glowColor="purple">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">Round-by-Round Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(14,165,233,0.08)]">
                {["Round", "Generated", "Baseline Detected", "Robust Detected", "Fooling Rate"].map((h) => (
                  <th key={h} className={`${h === "Round" ? "text-left" : "text-right"} p-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adversarialAnalysis.rounds.map((round, index) => (
                <motion.tr
                  key={round.round}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="border-b border-[rgba(14,165,233,0.05)] hover:bg-[#131a2e]/50 transition-colors duration-200"
                >
                  <td className="p-3">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-mono font-bold"
                      style={{
                        background: `linear-gradient(135deg, rgba(239,68,68,${0.1 + round.fooling_rate * 0.2}), rgba(249,115,22,${0.05 + round.fooling_rate * 0.1}))`,
                        border: `1px solid rgba(239,68,68,${0.2 + round.fooling_rate * 0.3})`,
                        color: "#ef4444",
                      }}
                    >
                      {round.round}
                    </span>
                  </td>
                  <td className="text-right p-3 font-mono text-sm text-[#e2e8f0]">{round.generated.toLocaleString()}</td>
                  <td className="text-right p-3">
                    <span className="font-mono text-sm text-[#3b82f6]">{round.detected_baseline.toLocaleString()}</span>
                    <span className="text-[10px] text-[#475569] ml-2">
                      ({((round.detected_baseline / round.generated) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="text-right p-3">
                    <span className="font-mono text-sm text-[#10b981]">{round.detected_robust.toLocaleString()}</span>
                    <span className="text-[10px] text-[#475569] ml-2">
                      ({((round.detected_robust / round.generated) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="text-right p-3">
                    <span className="font-mono text-sm text-[#ef4444]">{(round.fooling_rate * 100).toFixed(1)}%</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Perturbation Analysis */}
      <GlassCard delay={0.8} glowColor="orange">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">Perturbation Characteristics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Avg Perturbation", value: adversarialAnalysis.avgPerturbationMagnitude.toFixed(4), sub: "L2 norm", color: "#ef4444" },
            { label: "Stealth Success", value: `${((adversarialAnalysis.stealthySamples / adversarialAnalysis.generatedSamples) * 100).toFixed(1)}%`, sub: "Low perturbation", color: "#f59e0b" },
            { label: "Feature Targeting", value: "24", sub: "Features modified", color: "#3b82f6" },
            { label: "Robust Resilience", value: "81.6%", sub: "Detection rate", color: "#10b981" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className="p-5 rounded-xl bg-[#0a0e1a]/50 text-center"
              style={{ border: `1px solid ${item.color}15` }}
            >
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">{item.label}</p>
              <p className="text-2xl font-mono font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[10px] text-[#475569]">{item.sub}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
