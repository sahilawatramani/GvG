import { motion } from "motion/react";
import { useState } from "react";
import { artifacts } from "../lib/mockData";
import { GlassCard } from "../components/GlassCard";
import { Search, Download, FileText, Image, Box, BarChart3, Filter, HardDrive } from "lucide-react";

const typeConfig: Record<string, { icon: any; color: string }> = {
  visualization: { icon: Image, color: "#8b5cf6" },
  model: { icon: Box, color: "#0ea5e9" },
  data: { icon: BarChart3, color: "#10b981" },
  report: { icon: FileText, color: "#f59e0b" },
};

const categories = ["All", "EDA", "Baseline IDS", "cGAN Attacker", "Robust IDS", "Adversarial", "Metrics"];

export function Artifacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = artifacts.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalSize = "402 MB";
  const modelCount = artifacts.filter((a) => a.type === "model").length;
  const vizCount = artifacts.filter((a) => a.type === "visualization").length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl tracking-wider text-white text-glow-cyan mb-2">
          ARTIFACTS
        </h1>
        <p className="text-sm text-[#64748b]">Browse and download models, visualizations, and reports</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Artifacts", value: artifacts.length, color: "#0ea5e9", icon: HardDrive },
          { label: "Storage Used", value: totalSize, color: "#8b5cf6", icon: HardDrive },
          { label: "Models", value: modelCount, color: "#10b981", icon: Box },
          { label: "Visualizations", value: vizCount, color: "#f59e0b", icon: Image },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-[#0f1629]/90 via-[#131a2e]/70 to-[#0f1629]/90 backdrop-blur-xl border border-[rgba(14,165,233,0.1)] text-center"
          >
            <stat.icon className="h-5 w-5 mx-auto mb-2" style={{ color: stat.color }} />
            <p className="text-lg font-mono font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <GlassCard delay={0.3} glowColor="cyan" noPadding>
        <div className="p-4 border-b border-[rgba(14,165,233,0.08)]">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
              <input
                type="text"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0e1a]/50 border border-[rgba(14,165,233,0.1)] text-sm text-[#e2e8f0] placeholder-[#475569] focus:border-[#0ea5e9]/30 focus:outline-none transition-colors"
              />
            </div>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200
                    ${selectedCategory === cat
                      ? "bg-[#0ea5e9]/15 text-[#0ea5e9] border border-[#0ea5e9]/30"
                      : "bg-[#0a0e1a]/50 text-[#64748b] border border-[rgba(14,165,233,0.05)] hover:text-[#94a3b8] hover:border-[rgba(14,165,233,0.15)]"
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Artifacts List */}
        <div className="p-4">
          <div className="space-y-2">
            {filtered.map((artifact, index) => {
              const config = typeConfig[artifact.type] || typeConfig.report;
              const Icon = config.icon;
              return (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0e1a]/30 border border-[rgba(14,165,233,0.05)] hover:border-[rgba(14,165,233,0.15)] hover:bg-[#131a2e]/30 transition-all duration-200 group"
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${config.color}20, ${config.color}05)`,
                      border: `1px solid ${config.color}20`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-[#e2e8f0] truncate">{artifact.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#64748b]">{artifact.category}</span>
                      <span className="text-[10px] text-[#334155]">•</span>
                      <span className="text-[10px] text-[#64748b]">{artifact.size}</span>
                      <span className="text-[10px] text-[#334155]">•</span>
                      <span className="text-[10px] text-[#64748b]">
                        {new Date(artifact.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/10 text-xs text-[#0ea5e9] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#0ea5e9]/20"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[#475569]">
                <Search className="h-8 w-8 mb-3 opacity-50" />
                <p className="text-sm">No artifacts found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
