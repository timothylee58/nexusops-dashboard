import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { relativeTime, formatAmount, compactNumber } from "@/lib/format";

const statusColor: Record<Transaction["status"], string> = {
  completed: "bg-emerald-400",
  failed: "bg-red-400",
  pending: "bg-amber-400",
};

const statusBadge: Record<Transaction["status"], string> = {
  completed: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30",
  failed: "bg-red-400/10 text-red-400 border border-red-400/30",
  pending: "bg-amber-400/10 text-amber-400 border border-amber-400/30",
};

function StatChip({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex-1 min-w-0 bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`text-sm font-mono font-semibold mt-0.5 ${accent ?? "text-zinc-100"}`}>{value}</div>
    </div>
  );
}

export function DashboardFeed() {
  const { transactions, isConnected, stats } = useTransactions();

  const items = useMemo(() => transactions.slice(0, 30), [transactions]);

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 shadow-xl">
      <div className="p-5 border-b border-zinc-700/50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Live Transaction Feed</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Real-time corridor activity stream</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
              </span>
              <span className="text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>
            <div className="text-xs font-mono text-amber-400">{stats.total} tx</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <StatChip label="Total" value={stats.total} />
          <StatChip label="Completed" value={stats.completedCount} accent="text-emerald-400" />
          <StatChip label="Failed" value={stats.failedCount} accent="text-red-400" />
          <StatChip label="Anomalies" value={stats.anomalyCount} accent="text-amber-400" />
        </div>
        <div className="mt-2 text-[10px] text-zinc-500 font-mono">
          Volume: <span className="text-zinc-300">{compactNumber(stats.totalVolume)}</span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto scrollbar-thin p-3 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((tx) => {
            const anomaly = tx.anomaly_flag;
            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`relative flex gap-3 rounded-lg border overflow-hidden ${
                  anomaly
                    ? "bg-red-900/20 border-red-500/50 border-l-4 border-l-red-500"
                    : "bg-zinc-950/40 border-zinc-700/40"
                }`}
              >
                {!anomaly && <div className={`w-1 ${statusColor[tx.status]}`} />}
                <div className="flex-1 min-w-0 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-zinc-300 truncate">{tx.id}</span>
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">{relativeTime(tx.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/70 text-zinc-300 font-mono">
                      {tx.corridor_id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                      {tx.currency}
                    </span>
                    {anomaly && (
                      <span className="text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/40 animate-pulse">
                        ⚠ ANOMALY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-mono font-semibold text-amber-400">
                      {formatAmount(tx.amount)}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-0.5 rounded-full ${statusBadge[tx.status]}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
