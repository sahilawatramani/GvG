import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { fetchMetrics, fetchConfusionMatrices, type MetricsResponse, type ConfusionMatricesResponse } from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Target, TrendingUp, Award, Download, AlertCircle } from "lucide-react";
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
          <span className="font-mono font-medium text-white">
            {typeof entry.value === "number" ? (entry.value * 100).toFixed(2) + "%" : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  fpr: number;
  fnr: number;
}

const ZERO_METRICS: ModelMetrics = { accuracy: 0, precision: 0, recall: 0, f1: 0, roc_auc: 0, fpr: 0, fnr: 0 };

function extractMetrics(metrics: MetricsResponse | null, stage: string): ModelMetrics {
  if (!metrics) return ZERO_METRICS;
  const entry = metrics.summary?.find(m => m.split === "test_tabular" && m.stage === stage);
  if (!entry) return ZERO_METRICS;
  return {
    accuracy: entry.accuracy ?? 0,
    precision: entry.precision ?? 0,
    recall: entry.recall ?? 0,
    f1: entry.f1 ?? 0,
    roc_auc: entry.roc_auc ?? 0,
    fpr: entry.false_positive_rate ?? 0,
    fnr: entry.false_negative_rate ?? 0,
  };
}

export function Analytics() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [confMatrices, setConfMatrices] = useState<ConfusionMatricesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchMetrics().catch(() => null),
      fetchConfusionMatrices().catch(() => null),
    ]).then(([m, c]) => {
      if (!mounted) return;
      setMetrics(m as MetricsResponse | null);
      setConfMatrices(c as ConfusionMatricesResponse | null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const baseline = extractMetrics(metrics, "baseline");
  const robust = extractMetrics(metrics, "robust");

  const comparisonData = [
    { metric: "Accuracy", baseline: baseline.accuracy, robust: robust.accuracy },
    { metric: "Precision", baseline: baseline.precision, robust: robust.precision },
    { metric: "Recall", baseline: baseline.recall, robust: robust.recall },
    { metric: "F1 Score", baseline: baseline.f1, robust: robust.f1 },
    { metric: "ROC-AUC", baseline: baseline.roc_auc, robust: robust.roc_auc },
  ];

  const radarData = comparisonData.map((d) => ({
    metric: d.metric,
    Baseline: +(d.baseline * 100).toFixed(1),
    Robust: +(d.robust * 100).toFixed(1),
  }));

  // Find radar domain min
  const allRadarValues = radarData.flatMap(d => [d.Baseline, d.Robust]).filter(v => v > 0);
  const radarMin = allRadarValues.length > 0 ? Math.floor(Math.min(...allRadarValues) / 10) * 10 : 0;

  const renderConfusionMatrix = (key: string, title: string, accentColor: string) => {
    const matrix = confMatrices?.[key];
    if (!matrix) return (
      <div className="text-xs text-[#475569] py-8 text-center">No confusion matrix data for {title}</div>
    );

    return (
      <div>
        <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
          {title}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-[9px] text-[#475569] border border-[rgba(14,165,233,0.08)]">Actual ↓ / Pred →</th>
                {matrix.cols.map((name) => (
                  <th key={name} className="p-2 text-[9px] font-mono text-[#64748b] border border-[rgba(14,165,233,0.08)]">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.values.map((row, i) => (
                <tr key={i}>
                  <td className="p-2 text-[9px] font-mono text-[#64748b] border border-[rgba(14,165,233,0.08)]">{matrix.rows[i]}</td>
                  {row.map((val, j) => {
                    const isCorrect = i === j;
                    const maxVal = Math.max(...row);
                    const intensity = maxVal > 0 ? val / maxVal : 0;
                    return (
                      <td
                        key={j}
                        className="p-2 text-center text-[10px] font-mono border border-[rgba(14,165,233,0.08)]"
                        style={{
                          backgroundColor: isCorrect
                            ? `rgba(16, 185, 129, ${intensity * 0.25})`
                            : val > 0 ? `rgba(239, 68, 68, ${Math.min(intensity * 0.12, 0.12)})` : "transparent",
                        }}
                      >
                        <span className={isCorrect ? "text-[#10b981] font-bold" : "text-[#94a3b8]"}>
                          {val.toLocaleString()}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Collect all available confusion matrix keys for display
  const baselineMatrixKeys = Object.keys(confMatrices || {}).filter(k => k.startsWith("baseline_"));
  const robustMatrixKeys = Object.keys(confMatrices || {}).filter(k => k.startsWith("robust_"));

  const exportReport = () => {
    const rows = [
      "Metric,Baseline,Robust,Delta",
      ...["accuracy", "precision", "recall", "f1", "roc_auc", "fpr", "fnr"].map(key => {
        const bv = baseline[key as keyof ModelMetrics];
        const rv = robust[key as keyof ModelMetrics];
        const delta = bv > 0 ? (((rv - bv) / bv) * 100).toFixed(2) + "%" : "N/A";
        return `${key},${(bv * 100).toFixed(2)}%,${(rv * 100).toFixed(2)}%,${delta}`;
      }),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gvg_metrics_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
            ANALYTICS
          </h1>
          <p className="text-sm text-[#64748b]">Comprehensive comparison of baseline and robust model performance</p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={exportReport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] hover:from-[#38bdf8] hover:to-[#60a5fa] transition-all shadow-lg shadow-[#0ea5e9]/20 text-sm font-medium text-white"
        >
          <Download className="h-4 w-4" />
          Export Report
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#475569]">Loading metrics...</div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <AnimatedMetricCard label="Baseline Accuracy" value={baseline.accuracy * 100} suffix="%" decimals={2} icon={Target} color="cyan" delay={0.1} />
            <AnimatedMetricCard label="Robust Accuracy" value={robust.accuracy * 100} suffix="%" decimals={2} icon={Target} color="green" trend={robust.accuracy > baseline.accuracy ? { value: parseFloat((((robust.accuracy - baseline.accuracy) / (baseline.accuracy || 1)) * 100).toFixed(2)), direction: "up" } : undefined} delay={0.15} />
            <AnimatedMetricCard label="Baseline F1" value={baseline.f1 * 100} suffix="%" decimals={2} icon={TrendingUp} color="cyan" delay={0.2} />
            <AnimatedMetricCard label="Robust F1" value={robust.f1 * 100} suffix="%" decimals={2} icon={TrendingUp} color="green" delay={0.25} />
            <AnimatedMetricCard
              label="ROC-AUC Δ"
              value={robust.roc_auc > 0 && baseline.roc_auc > 0 ? parseFloat((((robust.roc_auc - baseline.roc_auc) / baseline.roc_auc) * 100).toFixed(2)) : 0}
              prefix="+"
              suffix="%"
              decimals={2}
              icon={Award}
              color="purple"
              delay={0.3}
            />
          </div>

          {/* Radar + Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard delay={0.4} glowColor="purple">
              <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Performance Radar</h2>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="rgba(30,41,59,0.6)" />
                  <PolarAngleAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis stroke="#475569" tick={{ fontSize: 10 }} domain={[radarMin, 100]} />
                  <Radar name="Baseline" dataKey="Baseline" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Robust" dataKey="Robust" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard delay={0.5} glowColor="cyan">
              <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Metric Comparison</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                  <XAxis dataKey="metric" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" domain={[0, 1.0]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="baseline" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Baseline IDS" fillOpacity={0.8} />
                  <Bar dataKey="robust" fill="#10b981" radius={[6, 6, 0, 0]} name="Robust IDS" fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          {/* Error Rates */}
          <GlassCard delay={0.6} glowColor="red">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">
              Error Rate Analysis <span className="text-xs font-normal text-[#64748b]">(Lower is Better)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Baseline FPR", value: baseline.fpr, color: "#ef4444" },
                { title: "Robust FPR", value: robust.fpr, color: "#10b981" },
                { title: "Baseline FNR", value: baseline.fnr, color: "#ef4444" },
                { title: "Robust FNR", value: robust.fnr, color: "#10b981" },
              ].map((er) => (
                <div key={er.title} className="p-4 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
                  <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">{er.title}</p>
                  <p className="text-2xl font-mono font-bold" style={{ color: er.color }}>{(er.value * 100).toFixed(2)}%</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[#1e293b]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(er.value * 100 * 2, 100)}%` }}
                      transition={{ duration: 1.5, delay: 0.7 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: er.color, maxWidth: "100%", boxShadow: `0 0 8px ${er.color}40` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Confusion Matrices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard delay={0.8} glowColor="cyan">
              {baselineMatrixKeys.length > 0 ? (
                <div className="space-y-6">
                  {baselineMatrixKeys.map(key => (
                    <div key={key}>
                      {renderConfusionMatrix(key, key.replace(/_/g, " ").replace("baseline ", "Baseline — "), "#3b82f6")}
                    </div>
                  ))}
                </div>
              ) : renderConfusionMatrix("baseline_test_tabular", "Baseline IDS", "#3b82f6")}
            </GlassCard>
            <GlassCard delay={0.9} glowColor="green">
              {robustMatrixKeys.length > 0 ? (
                <div className="space-y-6">
                  {robustMatrixKeys.map(key => (
                    <div key={key}>
                      {renderConfusionMatrix(key, key.replace(/_/g, " ").replace("robust ", "Robust — "), "#10b981")}
                    </div>
                  ))}
                </div>
              ) : renderConfusionMatrix("robust_test_tabular", "Robust IDS", "#10b981")}
            </GlassCard>
          </div>

          {/* Detailed Summary Table */}
          <GlassCard delay={1.0} glowColor="purple">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Full Metrics Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(14,165,233,0.08)]">
                    {["Metric", "Baseline", "Robust", "Δ Change"].map((h, i) => (
                      <th key={h} className={`${i === 0 ? "text-left" : "text-right"} p-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Accuracy", key: "accuracy" },
                    { name: "Precision", key: "precision" },
                    { name: "Recall", key: "recall" },
                    { name: "F1 Score", key: "f1" },
                    { name: "ROC-AUC", key: "roc_auc" },
                    { name: "FPR", key: "fpr" },
                    { name: "FNR", key: "fnr" },
                  ].map((metric) => {
                    const bv = baseline[metric.key as keyof ModelMetrics];
                    const rv = robust[metric.key as keyof ModelMetrics];
                    const change = bv > 0 ? ((rv - bv) / bv) * 100 : 0;
                    const isGood = metric.key === "fpr" || metric.key === "fnr" ? change < 0 : change > 0;
                    return (
                      <tr key={metric.key} className="border-b border-[rgba(14,165,233,0.05)] hover:bg-[#131a2e]/50 transition-colors">
                        <td className="p-3 text-sm text-[#e2e8f0]">{metric.name}</td>
                        <td className="text-right p-3 font-mono text-sm text-[#94a3b8]">{(bv * 100).toFixed(2)}%</td>
                        <td className="text-right p-3 font-mono text-sm text-[#e2e8f0]">{(rv * 100).toFixed(2)}%</td>
                        <td className={`text-right p-3 font-mono text-sm font-bold ${change === 0 ? "text-[#475569]" : isGood ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                          {change === 0 ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* All Splits Overview */}
          {metrics && metrics.summary && metrics.summary.length > 0 && (
            <GlassCard delay={1.1} glowColor="cyan">
              <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">All Evaluation Splits</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(14,165,233,0.08)]">
                      {["Split", "Stage", "Accuracy", "Precision", "Recall", "F1", "ROC-AUC"].map((h, i) => (
                        <th key={h} className={`${i < 2 ? "text-left" : "text-right"} p-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.summary.map((row, idx) => (
                      <tr key={idx} className="border-b border-[rgba(14,165,233,0.05)] hover:bg-[#131a2e]/50 transition-colors">
                        <td className="p-3 text-xs font-mono text-[#94a3b8]">{row.split}</td>
                        <td className="p-3">
                          <span className={`text-xs font-medium ${row.stage === "robust" ? "text-[#10b981]" : "text-[#3b82f6]"}`}>
                            {row.stage}
                          </span>
                        </td>
                        <td className="text-right p-3 font-mono text-xs text-[#e2e8f0]">{row.accuracy != null ? (row.accuracy * 100).toFixed(2) + "%" : "—"}</td>
                        <td className="text-right p-3 font-mono text-xs text-[#e2e8f0]">{row.precision != null ? (row.precision * 100).toFixed(2) + "%" : "—"}</td>
                        <td className="text-right p-3 font-mono text-xs text-[#e2e8f0]">{row.recall != null ? (row.recall * 100).toFixed(2) + "%" : "—"}</td>
                        <td className="text-right p-3 font-mono text-xs text-[#e2e8f0]">{row.f1 != null ? (row.f1 * 100).toFixed(2) + "%" : "—"}</td>
                        <td className="text-right p-3 font-mono text-xs text-[#e2e8f0]">{row.roc_auc != null ? (row.roc_auc * 100).toFixed(2) + "%" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
