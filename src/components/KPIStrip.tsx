import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { compactNumber } from "@/lib/format";

export function KPIStrip() {
  const { stats } = useTransactions();
  const items = [
    { label: "Total", value: stats.total, icon: TrendingUp, color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5" },
    { label: "Completed", value: stats.completedCount, icon: CheckCircle2, color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
    { label: "Failed", value: stats.failedCount, icon: XCircle, color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/5" },
    { label: "Anomalies", value: stats.anomalyCount, icon: AlertTriangle, color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/5", pulse: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon, color, border, bg, pulse }) => (
        <div
          key={label}
          className={`rounded-xl border ${border} ${bg} p-4 flex items-center gap-3 ring-1 ring-zinc-700/20`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-zinc-950/40 ${color} ${pulse && value > 0 ? "animate-pulse" : ""}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
              {label}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={value}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                className={`text-xl font-mono font-bold ${color}`}
              >
                {compactNumber(value)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
