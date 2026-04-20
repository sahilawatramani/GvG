import { motion } from "motion/react";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#0ea5e9]/20 to-[#3b82f6]/10 border border-[#0ea5e9]/20 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(14,165,233,0.15)]">
            <Shield className="h-12 w-12 text-[#0ea5e9]" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-2xl border border-[#0ea5e9]/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-5xl font-display font-bold text-white text-glow-cyan mb-4"
      >
        404
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-[#64748b] mb-8 max-w-md"
      >
        The sector you're looking for doesn't exist in this command center. <br />
        It may have been moved or the coordinates are incorrect.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] hover:from-[#38bdf8] hover:to-[#60a5fa] text-white text-sm font-medium transition-all shadow-lg shadow-[#0ea5e9]/20 hover:shadow-[#0ea5e9]/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Command Center
        </Link>
      </motion.div>
    </div>
  );
}
