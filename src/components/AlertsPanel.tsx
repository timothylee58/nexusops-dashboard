import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { useTransactionsContext } from "@/context/TransactionsContext";
import { relativeTime, formatAmount } from "@/lib/format";

export function AlertsPanel() {
  const { transactions } = useTransactionsContext();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const anomalies = useMemo(
    () => transactions.filter((t) => t.anomaly_flag && !dismissed.has(t.id)),
    [transactions, dismissed]
  );

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 shadow-xl flex flex-col">
      <div className="p-5 border-b border-zinc-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Anomaly Alerts</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Compliance review required</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
          {anomalies.length}
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto scrollbar-thin p-3">
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="w-10 h-10 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">No anomalies detected</p>
            <p className="text-[10px] text-zinc-600 mt-1 font-mono uppercase tracking-wider">
              All corridors nominal
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {anomalies.map((tx) => (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mb-2 rounded-lg bg-red-900/20 border border-red-500/40 border-l-4 border-l-red-500 overflow-hidden"
              >
                <div className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            {tx.corridor_id}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">{tx.currency}</span>
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {tx.status}
                          </span>
                        </div>
                        <div className="text-base font-mono font-semibold text-red-300 mt-1">
                          {formatAmount(tx.amount)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {relativeTime(tx.timestamp)} · {tx.id}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setDismissed((prev) => {
                          const n = new Set(prev);
                          n.add(tx.id);
                          return n;
                        })
                      }
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition shrink-0"
                    >
                      Cleared
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
