import { motion } from "motion/react";
import { metricsData } from "../lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Target, TrendingUp, AlertCircle, Download, Award } from "lucide-react";
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

export function Metrics() {
  const comparisonData = [
    { metric: "Accuracy", baseline: metricsData.baseline.accuracy, robust: metricsData.robust.accuracy },
    { metric: "Precision", baseline: metricsData.baseline.precision, robust: metricsData.robust.precision },
    { metric: "Recall", baseline: metricsData.baseline.recall, robust: metricsData.robust.recall },
    { metric: "F1 Score", baseline: metricsData.baseline.f1, robust: metricsData.robust.f1 },
    { metric: "ROC-AUC", baseline: metricsData.baseline.roc_auc, robust: metricsData.robust.roc_auc },
  ];

  const radarData = comparisonData.map((d) => ({
    metric: d.metric,
    Baseline: +(d.baseline * 100).toFixed(1),
    Robust: +(d.robust * 100).toFixed(1),
  }));

  const errorRates = [
    { metric: "FPR", baseline: metricsData.baseline.fpr, robust: metricsData.robust.fpr },
    { metric: "FNR", baseline: metricsData.baseline.fnr, robust: metricsData.robust.fnr },
  ];

  const renderConfusionMatrix = (matrix: number[][], title: string, accentColor: string) => {
    return (
      <div>
        <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-[10px] text-[#475569] border border-[rgba(14,165,233,0.08)]" />
                {metricsData.classNames.map((name) => (
                  <th key={name} className="p-2 text-[10px] font-mono text-[#64748b] border border-[rgba(14,165,233,0.08)]">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <td className="p-2 text-[10px] font-mono text-[#64748b] border border-[rgba(14,165,233,0.08)]">
                    {metricsData.classNames[i]}
                  </td>
                  {row.map((val, j) => {
                    const isCorrect = i === j;
                    const maxVal = Math.max(...row);
                    const intensity = val / maxVal;
                    return (
                      <td
                        key={j}
                        className="p-2 text-center text-xs font-mono border border-[rgba(14,165,233,0.08)] relative"
                        style={{
                          backgroundColor: isCorrect
                            ? `rgba(16, 185, 129, ${intensity * 0.25})`
                            : `rgba(239, 68, 68, ${Math.min(intensity * 0.15, 0.15)})`,
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

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
            METRICS
          </h1>
          <p className="text-sm text-[#64748b]">Comprehensive evaluation of baseline and robust IDS models</p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] hover:from-[#38bdf8] hover:to-[#60a5fa] transition-all shadow-lg shadow-[#0ea5e9]/20 text-sm font-medium text-white"
        >
          <Download className="h-4 w-4" />
          Download Report
        </motion.button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <AnimatedMetricCard label="Baseline Accuracy" value={metricsData.baseline.accuracy * 100} suffix="%" decimals={2} icon={Target} color="cyan" delay={0.1} />
        <AnimatedMetricCard label="Robust Accuracy" value={metricsData.robust.accuracy * 100} suffix="%" decimals={2} icon={Target} color="green" trend={{ value: 1.45, direction: "up" }} delay={0.2} />
        <AnimatedMetricCard label="Baseline F1" value={metricsData.baseline.f1 * 100} suffix="%" decimals={2} icon={TrendingUp} color="cyan" delay={0.3} />
        <AnimatedMetricCard label="Robust F1" value={metricsData.robust.f1 * 100} suffix="%" decimals={2} icon={TrendingUp} color="green" delay={0.4} />
        <AnimatedMetricCard
          label="Improvement"
          value={+((( metricsData.robust.accuracy - metricsData.baseline.accuracy) / metricsData.baseline.accuracy) * 100).toFixed(2)}
          prefix="+"
          suffix="%"
          decimals={2}
          icon={Award}
          color="purple"
          delay={0.5}
        />
      </div>

      {/* Radar + Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <GlassCard delay={0.6} glowColor="purple">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Performance Radar</h2>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(30,41,59,0.6)" />
              <PolarAngleAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis stroke="#475569" tick={{ fontSize: 10 }} domain={[90, 100]} />
              <Radar name="Baseline" dataKey="Baseline" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Robust" dataKey="Robust" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Bar Chart */}
        <GlassCard delay={0.7} glowColor="cyan">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Performance Comparison</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
              <XAxis dataKey="metric" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" domain={[0.9, 1.0]} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="baseline" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Baseline IDS" fillOpacity={0.8} />
              <Bar dataKey="robust" fill="#10b981" radius={[6, 6, 0, 0]} name="Robust IDS" fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Error Rates */}
      <GlassCard delay={0.8} glowColor="red">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">Error Rates <span className="text-xs font-normal text-[#64748b]">(Lower is Better)</span></h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={errorRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                <XAxis dataKey="metric" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" domain={[0, 0.06]} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="baseline" fill="#ef4444" radius={[6, 6, 0, 0]} name="Baseline" fillOpacity={0.7} />
                <Bar dataKey="robust" fill="#10b981" radius={[6, 6, 0, 0]} name="Robust" fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "False Positive Rate (FPR)", baseVal: metricsData.baseline.fpr, robustVal: metricsData.robust.fpr },
              { title: "False Negative Rate (FNR)", baseVal: metricsData.baseline.fnr, robustVal: metricsData.robust.fnr },
            ].map((er) => (
              <div key={er.title} className="p-4 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
                <h3 className="text-xs font-semibold text-[#94a3b8] mb-3">{er.title}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#64748b]">Baseline</span>
                    <span className="font-mono text-sm text-[#ef4444]">{(er.baseVal * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#64748b]">Robust</span>
                    <span className="font-mono text-sm text-[#10b981]">{(er.robustVal * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[rgba(14,165,233,0.08)]">
                    <span className="text-xs text-[#94a3b8]">Reduction</span>
                    <span className="font-mono text-sm text-[#10b981]">
                      {(((er.baseVal - er.robustVal) / er.baseVal) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Confusion Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard delay={0.9} glowColor="cyan">
          {renderConfusionMatrix(metricsData.baseline.confusion_matrix, "Baseline IDS Confusion Matrix", "#3b82f6")}
        </GlassCard>
        <GlassCard delay={1.0} glowColor="green">
          {renderConfusionMatrix(metricsData.robust.confusion_matrix, "Robust IDS Confusion Matrix", "#10b981")}
        </GlassCard>
      </div>

      {/* Detailed Table */}
      <GlassCard delay={1.1} glowColor="purple">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-6">Detailed Metrics Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(14,165,233,0.08)]">
                {["Metric", "Baseline IDS", "Robust IDS", "Δ Change"].map((h, i) => (
                  <th key={h} className={`${i === 0 ? "text-left" : "text-right"} p-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]`}>
                    {h}
                  </th>
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
                { name: "False Positive Rate", key: "fpr" },
                { name: "False Negative Rate", key: "fnr" },
              ].map((metric) => {
                const baselineVal = metricsData.baseline[metric.key as keyof typeof metricsData.baseline] as number;
                const robustVal = metricsData.robust[metric.key as keyof typeof metricsData.robust] as number;
                const change = ((robustVal - baselineVal) / baselineVal) * 100;
                const isImprovement = metric.key === "fpr" || metric.key === "fnr" ? change < 0 : change > 0;

                return (
                  <motion.tr
                    key={metric.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="border-b border-[rgba(14,165,233,0.05)] hover:bg-[#131a2e]/50 transition-colors duration-200"
                  >
                    <td className="p-3 text-sm text-[#e2e8f0]">{metric.name}</td>
                    <td className="text-right p-3 font-mono text-sm text-[#94a3b8]">{(baselineVal * 100).toFixed(2)}%</td>
                    <td className="text-right p-3 font-mono text-sm text-[#e2e8f0]">{(robustVal * 100).toFixed(2)}%</td>
                    <td className={`text-right p-3 font-mono text-sm font-bold ${isImprovement ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      {change > 0 ? "+" : ""}{change.toFixed(2)}%
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
