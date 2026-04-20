import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Shield, Activity, AlertTriangle, Target, Zap, ArrowRight, Crosshair, Cpu, Database, Layers, Hash, Filter } from "lucide-react";
import { AnimatedMetricCard } from "../components/AnimatedMetricCard";
import { GlowingBadge } from "../components/GlowingBadge";
import { GlassCard } from "../components/GlassCard";
import { ThreatLevelIndicator } from "../components/ThreatLevelIndicator";
import { LiveFeed } from "../components/LiveFeed";
import { systemStatus, pipelineStages as defaultPipelineStages } from "../lib/mockData";
import { checkHealth, fetchMetrics, fetchManifest, fetchEda, fetchTrainingHistory, type MetricsResponse, type ManifestResponse, type EdaResponse } from "../lib/api";
import { Link } from "react-router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Color palette for label distribution
const CLASS_COLORS = [
  "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899",
  "#0ea5e9", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  "#e879f9", "#22d3ee", "#fb923c", "#a78bfa", "#fbbf24",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-[rgba(14,165,233,0.2)] shadow-xl">
      <p className="text-xs font-mono text-[#94a3b8] mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#94a3b8]">{entry.name}:</span>
          <span className="font-mono font-medium text-white">
            {entry.value < 2 ? entry.value.toFixed(4) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function Dashboard() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [manifest, setManifest] = useState<ManifestResponse | null>(null);
  const [eda, setEda] = useState<EdaResponse | null>(null);
  const [lossData, setLossData] = useState<{ epoch: number; baseline: number; robust: number }[]>([]);

  useEffect(() => {
    let mounted = true;
    checkHealth()
      .then(() => { if (mounted) setBackendOnline(true); })
      .catch(() => { if (mounted) setBackendOnline(false); });

    fetchMetrics()
      .then((data) => { if (mounted) setMetrics(data); })
      .catch(() => {});

    fetchManifest()
      .then((data) => { if (mounted) setManifest(data); })
      .catch(() => {});

    fetchEda()
      .then((data) => { if (mounted) setEda(data); })
      .catch(() => {});

    fetchTrainingHistory()
      .then((data) => {
        if (!mounted) return;
        const baseline = data.baseline || [];
        const robust = data.robust || [];
        const maxLen = Math.max(baseline.length, robust.length);
        const combined = [];
        for (let i = 0; i < maxLen; i++) {
          combined.push({
            epoch: i + 1,
            baseline: baseline[i]?.tabular_validation_loss ?? 0,
            robust: robust[i]?.tabular_validation_loss ?? 0,
          });
        }
        setLossData(combined);
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

  // Extract key metrics from API data
  const baselineTest = metrics?.summary?.find(m => m.split === "test_tabular" && m.stage === "baseline");
  const robustTest = metrics?.summary?.find(m => m.split === "test_tabular" && m.stage === "robust");
  const robustAdv = metrics?.summary?.find(m => m.split === "test_adversarial_tabular" && m.stage === "robust");

  const baselineAccuracy = baselineTest?.accuracy ?? 0;
  const robustAccuracy = robustTest?.accuracy ?? 0;
  const advDetectionRate = robustAdv?.accuracy ?? 0;
  const totalSamples = manifest ? manifest.train_rows + manifest.validation_rows + manifest.test_rows : 0;

  // Build class distribution for pie chart
  const classData = (eda?.label_distribution || []).map((entry, i) => ({
    name: entry.label,
    count: entry.count,
    percentage: 0, // calculated below
    color: CLASS_COLORS[i % CLASS_COLORS.length],
  }));
  const totalCount = classData.reduce((sum, c) => sum + c.count, 0);
  classData.forEach(c => { c.percentage = totalCount > 0 ? parseFloat(((c.count / totalCount) * 100).toFixed(1)) : 0; });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 lg:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1629] via-[#0a1628] to-[#0f1629] rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9]/5 via-transparent to-[#8b5cf6]/5 rounded-2xl" />
        <div className="absolute inset-0 rounded-2xl border border-[rgba(14,165,233,0.1)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0ea5e9]/50 to-transparent" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] shadow-lg shadow-[#0ea5e9]/25 animate-float"
              >
                <Shield className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan"
                >
                  COMMAND CENTER
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-[#64748b] mt-1"
                >
                  GAN-vs-GAN Adversarial Training for Intrusion Detection Systems
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2"
            >
              <GlowingBadge status={systemStatus.preprocessing as any} label="Preprocessed" />
              <GlowingBadge status={systemStatus.baselineIDS as any} label="Baseline IDS" />
              <GlowingBadge status={systemStatus.cGANAttacker as any} label="Attacker GAN" />
              <GlowingBadge status={systemStatus.robustIDS as any} label="Robust IDS" />
              <GlowingBadge
                status={backendOnline === null ? "running" : backendOnline ? "complete" : "error"}
                label={backendOnline === null ? "Checking API..." : backendOnline ? "API Online" : "API Offline"}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ============================================
          KEY METRICS
          ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatedMetricCard label="Baseline Accuracy" value={baselineAccuracy * 100} suffix="%" decimals={2} icon={Target} color="cyan" delay={0.1} />
        <AnimatedMetricCard label="Robust Accuracy" value={robustAccuracy * 100} suffix="%" decimals={2} icon={Shield} color="green" trend={robustAccuracy > baselineAccuracy ? { value: parseFloat((((robustAccuracy - baselineAccuracy) / (baselineAccuracy || 1)) * 100).toFixed(2)), direction: "up" } : undefined} delay={0.2} />
        <AnimatedMetricCard label="Adversarial Detection" value={advDetectionRate * 100} suffix="%" decimals={2} icon={Crosshair} color="purple" delay={0.3} />
        <AnimatedMetricCard label="Total Samples" value={totalSamples} decimals={0} icon={Cpu} color="cyan" delay={0.4} />
        <AnimatedMetricCard label="Features" value={manifest?.feature_count ?? 0} decimals={0} icon={Layers} color="red" delay={0.5} />
        <AnimatedMetricCard label="Attack Classes" value={manifest ? manifest.label_names.length - 1 : 0} decimals={0} icon={AlertTriangle} color="orange" delay={0.6} />
      </div>

      {/* ============================================
          THREAT GAUGE + CHART + LIVE FEED
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard delay={0.7} className="lg:col-span-3 flex items-center justify-center" glowColor="red">
          <ThreatLevelIndicator level={systemStatus.threatLevel} />
        </GlassCard>

        <GlassCard delay={0.8} className="lg:col-span-5" glowColor="cyan">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Validation Loss (Lower = Better)</h2>
          {lossData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={lossData}>
                <defs>
                  <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRobust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                <XAxis dataKey="epoch" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="baseline" stroke="#3b82f6" strokeWidth={2} fill="url(#gradBaseline)" name="Baseline Loss" dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 2, fill: "#0a0e1a" }} />
                <Area type="monotone" dataKey="robust" stroke="#10b981" strokeWidth={2} fill="url(#gradRobust)" name="Robust Loss" dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: "#0a0e1a" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-[#475569] text-xs">
              {backendOnline === false ? "Backend offline — no training data" : "Loading..."}
            </div>
          )}
        </GlassCard>

        <GlassCard delay={0.9} className="lg:col-span-4" glowColor="green">
          <LiveFeed />
        </GlassCard>
      </div>

      {/* ============================================
          DATASET OVERVIEW + PIPELINE STATUS
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dataset Overview */}
        <GlassCard delay={1.0} glowColor="purple">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Dataset Overview — CICIDS2017</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Total Rows", value: totalCount > 0 ? totalCount.toLocaleString() : "-", icon: Database, color: "#0ea5e9" },
              { label: "Features", value: manifest?.feature_count?.toString() ?? "-", icon: Layers, color: "#8b5cf6" },
              { label: "Seq Length", value: "10", icon: Hash, color: "#f59e0b" },
              { label: "Labels", value: manifest?.label_names?.length?.toString() ?? "-", icon: Filter, color: "#10b981" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
                <stat.icon className="h-4 w-4 flex-shrink-0" style={{ color: stat.color }} />
                <div>
                  <p className="text-xs font-bold font-mono text-white">{stat.value}</p>
                  <p className="text-[10px] text-[#64748b]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Mini class distribution */}
          {classData.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={classData} cx="50%" cy="50%" innerRadius={22} outerRadius={38} dataKey="count" stroke="none" paddingAngle={2}>
                      {classData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 flex-1 max-h-[96px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {classData.slice(0, 8).map((cls) => (
                  <div key={cls.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cls.color }} />
                      <span className="text-[10px] font-mono text-[#94a3b8] truncate max-w-[120px]">{cls.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748b]">{cls.percentage}%</span>
                  </div>
                ))}
                {classData.length > 8 && (
                  <span className="text-[9px] text-[#475569]">+{classData.length - 8} more</span>
                )}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Pipeline Status */}
        <GlassCard delay={1.1} glowColor="cyan">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Pipeline Status</h2>
          <div className="space-y-2">
            {defaultPipelineStages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + index * 0.08 }}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)] hover:border-[rgba(14,165,233,0.15)] transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#0ea5e9]/20 to-[#3b82f6]/10 text-[10px] font-mono text-[#0ea5e9] font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e2e8f0]">{stage.name}</p>
                    <p className="text-[10px] text-[#64748b]">{stage.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#475569]">{stage.duration}</span>
                  <GlowingBadge status={stage.status as any} />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ============================================
          QUICK ACTIONS
          ============================================ */}
      <GlassCard delay={1.3} glowColor="purple">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: "/architecture", label: "System Architecture", desc: "GAN-vs-GAN design", color: "#3b82f6" },
            { to: "/training-lab", label: "Training Lab", desc: "Models & adversarial", color: "#ef4444" },
            { to: "/analytics", label: "Analytics", desc: "Metrics & evaluation", color: "#10b981" },
            { to: "/live-demo", label: "Live Demo", desc: "Try it yourself", color: "#8b5cf6" },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group relative flex items-center justify-between p-4 rounded-xl bg-[#0a0e1a]/50 border transition-all duration-300 overflow-hidden"
              style={{ borderColor: `${action.color}20` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${action.color}60`;
                e.currentTarget.style.boxShadow = `0 0 20px ${action.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${action.color}20`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                <p className="text-sm font-medium text-[#e2e8f0] group-hover:text-white transition-colors">{action.label}</p>
                <p className="text-xs text-[#64748b]">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#475569] group-hover:translate-x-1 transition-all duration-300" style={{ color: action.color }} />
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
