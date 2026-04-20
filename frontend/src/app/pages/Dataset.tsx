import { motion } from "motion/react";
import { datasetStats } from "../lib/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Database, Layers, Filter, Hash } from "lucide-react";
import { AnimatedMetricCard } from "../components/AnimatedMetricCard";
import { GlassCard } from "../components/GlassCard";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="glass-card rounded-xl p-3 border border-[rgba(14,165,233,0.2)] shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color || payload[0].color }} />
        <span className="text-sm font-medium text-white">{data.name}</span>
      </div>
      <p className="text-xs font-mono text-[#94a3b8]">
        {(data.count || data.value || 0).toLocaleString()} {data.percentage ? `(${data.percentage}%)` : ""}
      </p>
    </div>
  );
};

export function Dataset() {
  const splitData = [
    { name: "Train", value: datasetStats.splits.train, color: "#0ea5e9" },
    { name: "Validation", value: datasetStats.splits.validation, color: "#8b5cf6" },
    { name: "Test", value: datasetStats.splits.test, color: "#10b981" },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
          DATASET
        </h1>
        <p className="text-sm text-[#64748b]">CICIDS2017 dataset statistics and exploration</p>
      </motion.div>

      {/* Dataset Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedMetricCard label="Total Rows" value={datasetStats.totalRows} icon={Database} color="cyan" delay={0.1} />
        <AnimatedMetricCard label="Cleaned Rows" value={datasetStats.cleanedRows} icon={Filter} color="green" delay={0.2} />
        <AnimatedMetricCard label="Features" value={datasetStats.features} icon={Layers} color="purple" delay={0.3} />
        <AnimatedMetricCard label="Sequence Length" value={datasetStats.sequenceLength} icon={Hash} color="orange" delay={0.4} />
      </div>

      {/* Class Distribution + Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Class Distribution */}
        <GlassCard delay={0.5} glowColor="purple">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Class Distribution</h2>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={datasetStats.classes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  stroke="none"
                  paddingAngle={2}
                >
                  {datasetStats.classes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 w-full lg:w-auto">
              {datasetStats.classes.map((cls) => (
                <div key={cls.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color }} />
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-xs font-mono text-[#e2e8f0]">{cls.name}</span>
                  </div>
                  <span className="text-xs font-mono text-[#64748b]">{cls.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Train/Val/Test Split */}
        <GlassCard delay={0.6} glowColor="cyan">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Data Splits</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={splitData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
              >
                {splitData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {splitData.map((split) => (
              <div key={split.name} className="text-center p-3 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
                <div className="h-2 w-2 rounded-full mx-auto mb-2" style={{ backgroundColor: split.color }} />
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider">{split.name}</p>
                <p className="text-sm font-mono font-bold" style={{ color: split.color }}>
                  {split.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Feature Categories */}
      <GlassCard delay={0.7} glowColor="green">
        <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Feature Categories</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={datasetStats.featureCategories} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis type="number" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} width={100} />
            <Tooltip content={({ active, payload }: any) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="glass-card rounded-xl p-3 border border-[rgba(14,165,233,0.2)] shadow-xl">
                  <p className="text-sm font-medium text-white">{payload[0].payload.name}</p>
                  <p className="text-xs font-mono text-[#94a3b8]">{payload[0].value} features</p>
                </div>
              );
            }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} fillOpacity={0.8}>
              {datasetStats.featureCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}
