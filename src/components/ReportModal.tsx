import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTransactionsContext } from "@/context/TransactionsContext";
import type { Corridor } from "@/types/transaction";
import { compactNumber, formatAmount } from "@/lib/format";

const CORRIDORS: Corridor[] = ["MY-SG", "SG-HK", "HK-JP", "MY-JP", "SG-JP"];

export function ReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { transactions, stats } = useTransactionsContext();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const corridorBreakdown = useMemo(() => {
    return CORRIDORS.map((c) => {
      const txs = transactions.filter((t) => t.corridor_id === c);
      const vol = txs.reduce((s, t) => s + t.amount, 0);
      const failed = txs.filter((t) => t.status === "failed").length;
      const anom = txs.filter((t) => t.anomaly_flag).length;
      return { corridor: c, count: txs.length, vol, failed, anom };
    });
  }, [transactions]);

  const denialRate = stats.total ? ((stats.failedCount / stats.total) * 100).toFixed(2) : "0.00";
  const anomalyRate = stats.total ? ((stats.anomalyCount / stats.total) * 100).toFixed(2) : "0.00";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-zinc-900 rounded-2xl border border-zinc-700/50 shadow-2xl w-full max-w-2xl mt-12 max-h-[80vh] overflow-y-auto scrollbar-thin"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h2 className="text-zinc-100 font-semibold tracking-tight">Corridor Intelligence Report</h2>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <header className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl font-semibold text-zinc-100">NexusOps Corridor Intelligence Report</h1>
                <p className="text-xs text-zinc-500 font-mono mt-2">
                  Generated: {new Date().toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 font-mono">
                  Analyst: <span className="text-zinc-300">{user.name}</span> · {user.email}
                </p>
              </header>

              <section>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                  Executive Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { l: "Total Tx", v: stats.total, c: "text-zinc-100" },
                    { l: "Volume", v: compactNumber(stats.totalVolume), c: "text-amber-400" },
                    { l: "Denial Rate", v: `${denialRate}%`, c: "text-red-400" },
                    { l: "Anomaly Rate", v: `${anomalyRate}%`, c: "text-amber-400" },
                  ].map((m) => (
                    <div key={m.l} className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">{m.l}</div>
                      <div className={`text-lg font-mono font-bold mt-1 ${m.c}`}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                  Corridor Breakdown
                </h3>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="text-left py-2">Corridor</th>
                      <th className="text-right py-2">Tx</th>
                      <th className="text-right py-2">Volume</th>
                      <th className="text-right py-2">Failed</th>
                      <th className="text-right py-2">Anom</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corridorBreakdown.map((r) => (
                      <tr key={r.corridor} className="border-b border-zinc-800/50">
                        <td className="py-2 text-zinc-200">{r.corridor}</td>
                        <td className="py-2 text-right text-zinc-300">{r.count}</td>
                        <td className="py-2 text-right text-amber-400">{formatAmount(r.vol)}</td>
                        <td className="py-2 text-right text-red-400">{r.failed}</td>
                        <td className="py-2 text-right text-red-400">{r.anom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  Recommendations
                </h3>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>Review corridors with denial rate &gt; 20% for compliance gaps.</li>
                  <li>Escalate anomalies in {corridorBreakdown.sort((a, b) => b.anom - a.anom)[0]?.corridor ?? "N/A"} for manual inspection.</li>
                  <li>Maintain current routing for healthy corridors.</li>
                </ul>
              </section>

              <footer className="text-[10px] text-zinc-600 font-mono pt-4 border-t border-zinc-800">
                Confidential — NexusOps internal use only
              </footer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
