import { motion } from "motion/react";
import { useState, useRef, useCallback } from "react";
import { CheckCircle2, AlertCircle, Download, FileUp, Shield, Cpu, Timer, Loader2, XCircle, FileText } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { GlowingBadge } from "../components/GlowingBadge";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { parseCSV, predictTraffic, readFileAsText, type PredictResponse } from "../lib/api";

interface DisplayResult {
  id: number;
  label: string;
  confidence: number;
  class: "benign" | "attack";
}

const requiredColumns = [
  "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
  "Flow Bytes/s", "Flow Packets/s", "Fwd Packet Length Mean",
  "Bwd Packet Length Mean", "Flow IAT Mean", "Fwd IAT Mean",
  "Bwd IAT Mean", "Protocol", "Destination Port",
];

function mapPredictions(response: PredictResponse): DisplayResult[] {
  return response.tabular_predictions.map((pred) => ({
    id: pred.row + 1,
    label: pred.predicted_binary_label === 0 ? "BENIGN" : "ATTACK",
    confidence: pred.predicted_binary_label === 0
      ? 1 - pred.attack_probability
      : pred.attack_probability,
    class: pred.predicted_binary_label === 0 ? "benign" : "attack",
  }));
}

function computeDistribution(results: DisplayResult[]) {
  const benign = results.filter((r) => r.class === "benign").length;
  const attack = results.filter((r) => r.class === "attack").length;
  return [
    { name: "BENIGN", value: benign, color: "#10b981" },
    { name: "ATTACK", value: attack, color: "#ef4444" },
  ].filter((d) => d.value > 0);
}

export function LiveDemo() {
  const [results, setResults] = useState<DisplayResult[]>([]);
  const [distribution, setDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sequenceInfo, setSequenceInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasResults = results.length > 0;

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setResults([]);
    setDistribution([]);
    setSequenceInfo(null);
    setFileName(file.name);
    setLoading(true);

    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);

      const response = await predictTraffic(rows);
      const mapped = mapPredictions(response);

      setResults(mapped);
      setDistribution(computeDistribution(mapped));

      if (response.sequence_predictions && response.sequence_predictions.length > 0) {
        const seqAttacks = response.sequence_predictions.filter((s) => s.predicted_binary_label === 1).length;
        setSequenceInfo(`${response.sequence_predictions.length} sequence windows analyzed, ${seqAttacks} flagged as attack`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-uploaded
    e.target.value = "";
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const exportResults = useCallback(() => {
    if (results.length === 0) return;
    const header = "Row,Prediction,Confidence,Status\n";
    const rows = results.map((r) => `${r.id},${r.label},${(r.confidence * 100).toFixed(2)}%,${r.class}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gvg_predictions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
          LIVE DEMO
        </h1>
        <p className="text-sm text-[#64748b]">Upload network traffic CSV files and get real-time predictions from the robust IDS model</p>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Shield, label: "Model", value: "Robust IDS", desc: "Adversarially trained", color: "#10b981" },
          { icon: Cpu, label: "Backend", value: "FastAPI", desc: "POST /predict", color: "#0ea5e9" },
          { icon: Timer, label: "Scoring", value: "Real-time", desc: "Live predictions", color: "#8b5cf6" },
        ].map((info, i) => (
          <motion.div
            key={info.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#0f1629]/90 via-[#131a2e]/70 to-[#0f1629]/90 backdrop-blur-xl border border-[rgba(14,165,233,0.1)]"
          >
            <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${info.color}20, ${info.color}05)`, border: `1px solid ${info.color}20` }}>
              <info.icon className="h-5 w-5" style={{ color: info.color }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{info.value}</p>
              <p className="text-[10px] text-[#64748b]">{info.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload Zone */}
          <GlassCard delay={0.3} glowColor="cyan">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Upload Network Traffic</h2>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            <motion.div
              onClick={() => !loading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group
                ${loading ? "pointer-events-none opacity-60" : ""}
                ${isDragging
                  ? "border-[#0ea5e9] bg-[#0ea5e9]/5 shadow-[0_0_30px_rgba(14,165,233,0.1)]"
                  : "border-[rgba(14,165,233,0.15)] hover:border-[rgba(14,165,233,0.3)] hover:bg-[#0ea5e9]/3"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="h-10 w-10 text-[#0ea5e9] animate-spin mb-4" />
                  <p className="text-sm font-medium text-[#e2e8f0] mb-1">Analyzing {fileName}...</p>
                  <p className="text-xs text-[#64748b]">Sending to backend for prediction</p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0ea5e9]/15 to-[#3b82f6]/10 border border-[#0ea5e9]/15 flex items-center justify-center mb-4"
                  >
                    <FileUp className="h-8 w-8 text-[#0ea5e9]" />
                  </motion.div>
                  <p className="text-sm font-medium text-[#e2e8f0] mb-1">Drag & drop your CSV file here</p>
                  <p className="text-xs text-[#64748b] mb-4">or click to browse</p>
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9]/10 to-[#3b82f6]/10 border border-[#0ea5e9]/15">
                    <span className="text-xs font-medium text-[#0ea5e9]">Supported: .csv files with CICIDS2017 features</span>
                  </div>
                </>
              )}
            </motion.div>

            {/* File name badge */}
            {fileName && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.08)]"
              >
                <FileText className="h-3.5 w-3.5 text-[#0ea5e9]" />
                <span className="text-xs font-mono text-[#94a3b8]">{fileName}</span>
              </motion.div>
            )}
          </GlassCard>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-[#ef4444]/5 border border-[#ef4444]/20"
            >
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#ef4444] mb-1">Prediction Failed</p>
                  <p className="text-xs text-[#94a3b8]">{error}</p>
                  <p className="text-[10px] text-[#64748b] mt-2">
                    Make sure the backend is running: <span className="font-mono text-[#0ea5e9]">python app.py</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {hasResults && (
            <GlassCard delay={0.1} glowColor="green">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-[#e2e8f0]">Prediction Results</h2>
                  <GlowingBadge status="complete" label={`${results.length} samples`} />
                </div>
                <button
                  onClick={exportResults}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/15 text-xs text-[#0ea5e9] hover:bg-[#0ea5e9]/20 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Export
                </button>
              </div>

              {/* Summary Strip */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 p-4 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]">
                <div className="w-20 h-20 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribution} cx="50%" cy="50%" innerRadius={25} outerRadius={38} dataKey="value" stroke="none" paddingAngle={3}>
                        {distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3">
                  {distribution.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131a2e]/60">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] font-mono text-[#94a3b8]">{d.name}</span>
                      <span className="text-[10px] font-mono text-[#475569]">({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sequence info */}
              {sequenceInfo && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-[#8b5cf6]/5 border border-[#8b5cf6]/10">
                  <span className="text-[10px] text-[#8b5cf6] font-mono">⧫ Sequence: {sequenceInfo}</span>
                </div>
              )}

              {/* Results Table */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#0f1629]">
                    <tr className="border-b border-[rgba(14,165,233,0.08)]">
                      {["#", "Prediction", "Confidence", "Status"].map((h) => (
                        <th key={h} className="text-left p-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <motion.tr
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(0.2 + index * 0.02, 1) }}
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
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${result.confidence * 100}%` }}
                                transition={{ duration: 0.8, delay: Math.min(0.3 + index * 0.02, 1) }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: result.confidence > 0.9 ? "#10b981" : result.confidence > 0.7 ? "#f59e0b" : "#ef4444" }}
                              />
                            </div>
                            <span className="text-xs font-mono text-[#94a3b8]">{(result.confidence * 100).toFixed(1)}%</span>
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

        {/* Sidebar */}
        <div className="space-y-4">
          <GlassCard delay={0.4} glowColor="purple">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">CSV Schema</h2>
            <p className="text-xs text-[#64748b] mb-4">
              Your CSV should contain these columns from the CICIDS2017 feature space:
            </p>
            <div className="space-y-1">
              {requiredColumns.map((col, i) => (
                <motion.div
                  key={col}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.03 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.05)]"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
                  <span className="text-[10px] font-mono text-[#94a3b8]">{col}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-[10px] text-[#475569] mt-3 leading-relaxed">
              Missing columns will be filled with 0.0 by the backend automatically.
            </p>
          </GlassCard>

          <GlassCard delay={0.6} glowColor="green">
            <h2 className="text-base font-semibold text-[#e2e8f0] mb-3">How It Works</h2>
            <div className="space-y-3">
              {[
                { step: "1", desc: "Upload a CSV with network traffic features" },
                { step: "2", desc: "Frontend parses and sends rows to the backend" },
                { step: "3", desc: "Robust IDS classifies each flow as BENIGN or ATTACK" },
                { step: "4", desc: "View predictions with confidence scores & export" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0ea5e9]/15 text-[10px] font-mono font-bold text-[#0ea5e9] flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
