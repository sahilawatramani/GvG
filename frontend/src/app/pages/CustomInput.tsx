import { motion } from "motion/react";
import { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Download, X, FileUp } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { GlowingBadge } from "../components/GlowingBadge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PredictionResult {
  id: number;
  label: string;
  confidence: number;
  class: string;
}

const mockResults: PredictionResult[] = [
  { id: 1, label: "BENIGN", confidence: 0.9823, class: "benign" },
  { id: 2, label: "DoS", confidence: 0.8934, class: "attack" },
  { id: 3, label: "BENIGN", confidence: 0.9567, class: "benign" },
  { id: 4, label: "PortScan", confidence: 0.7823, class: "attack" },
  { id: 5, label: "BENIGN", confidence: 0.9912, class: "benign" },
  { id: 6, label: "DDoS", confidence: 0.8456, class: "attack" },
  { id: 7, label: "BENIGN", confidence: 0.9234, class: "benign" },
  { id: 8, label: "BENIGN", confidence: 0.9789, class: "benign" },
  { id: 9, label: "Infiltration", confidence: 0.6234, class: "attack" },
  { id: 10, label: "BENIGN", confidence: 0.9678, class: "benign" },
];

const distributionData = [
  { name: "BENIGN", value: 6, color: "#10b981" },
  { name: "DoS", value: 1, color: "#ef4444" },
  { name: "PortScan", value: 1, color: "#f59e0b" },
  { name: "DDoS", value: 1, color: "#8b5cf6" },
  { name: "Infiltration", value: 1, color: "#ec4899" },
];

const requiredColumns = [
  "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
  "Flow Bytes/s", "Flow Packets/s", "Fwd Packet Length Mean",
  "Bwd Packet Length Mean", "Flow IAT Mean", "Fwd IAT Mean",
  "Bwd IAT Mean", "Protocol", "Destination Port",
];

export function CustomInput() {
  const [hasResults, setHasResults] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
          CUSTOM INPUT
        </h1>
        <p className="text-sm text-[#64748b]">Upload CSV files and get real-time predictions from the robust IDS model</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard delay={0.1} glowColor="cyan">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Upload Network Traffic</h2>

            {/* Drop Zone */}
            <motion.div
              onClick={() => setHasResults(true)}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); setHasResults(true); }}
              className={`
                relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer
                transition-all duration-300 group
                ${isDragging
                  ? "border-[#0ea5e9] bg-[#0ea5e9]/5 shadow-[0_0_30px_rgba(14,165,233,0.1)]"
                  : "border-[rgba(14,165,233,0.15)] hover:border-[rgba(14,165,233,0.3)] hover:bg-[#0ea5e9]/3"
                }
              `}
            >
              <motion.div
                animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0ea5e9]/15 to-[#3b82f6]/10 border border-[#0ea5e9]/15 flex items-center justify-center mb-4"
              >
                <FileUp className="h-8 w-8 text-[#0ea5e9]" />
              </motion.div>
              <p className="text-sm font-medium text-[#e2e8f0] mb-1">
                Drag & drop your CSV file here
              </p>
              <p className="text-xs text-[#64748b] mb-4">or click to browse</p>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9]/10 to-[#3b82f6]/10 border border-[#0ea5e9]/15">
                <span className="text-xs font-medium text-[#0ea5e9]">Supported: .csv files up to 50MB</span>
              </div>
            </motion.div>
          </GlassCard>

          {/* Results */}
          {hasResults && (
            <GlassCard delay={0.2} glowColor="green">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-[#e2e8f0]">Prediction Results</h2>
                  <GlowingBadge status="complete" label="10 samples" />
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/15 text-xs text-[#0ea5e9] hover:bg-[#0ea5e9]/20 transition-colors">
                  <Download className="h-3 w-3" />
                  Export
                </button>
              </div>

              {/* Distribution Chart */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 p-4 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={3}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-shrink-0">
                  {distributionData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-[#94a3b8]">{d.name}</span>
                      <span className="text-xs font-mono text-[#64748b]">({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(14,165,233,0.08)]">
                      {["#", "Prediction", "Confidence", "Status"].map((h) => (
                        <th key={h} className="text-left p-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockResults.map((result, index) => (
                      <motion.tr
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.04 }}
                        className="border-b border-[rgba(14,165,233,0.05)] hover:bg-[#131a2e]/50 transition-colors"
                      >
                        <td className="p-3 text-xs font-mono text-[#475569]">{result.id}</td>
                        <td className="p-3">
                          <span className={`text-sm font-mono font-medium ${result.class === "benign" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                            {result.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[#1e293b] max-w-[80px]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${result.confidence * 100}%`,
                                  backgroundColor: result.confidence > 0.9 ? "#10b981" : result.confidence > 0.7 ? "#f59e0b" : "#ef4444",
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono text-[#94a3b8]">
                              {(result.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          {result.class === "benign" ? (
                            <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-[#ef4444]" />
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Schema Guide */}
        <div className="space-y-4">
          <GlassCard delay={0.3} glowColor="purple">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">CSV Schema</h2>
            <p className="text-xs text-[#64748b] mb-4">
              Your CSV file should contain the following columns from the CICIDS2017 dataset:
            </p>
            <div className="space-y-1.5">
              {requiredColumns.map((col, i) => (
                <motion.div
                  key={col}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.03 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
                  <span className="text-xs font-mono text-[#94a3b8]">{col}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <GlassCard delay={0.5} glowColor="green">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-3">Scoring Info</h2>
            <div className="space-y-3 text-xs text-[#64748b]">
              <p>• Model: Robust IDS (adversarially trained)</p>
              <p>• Architecture: Transformer-LSTM</p>
              <p>• Latency: ~12ms per sample</p>
              <p>• Max batch size: 10,000 rows</p>
              <p>• Output: Class label + confidence score</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
