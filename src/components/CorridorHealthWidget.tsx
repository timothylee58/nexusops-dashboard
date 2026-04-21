import { useMemo } from "react";
import { useTransactionsContext } from "@/context/TransactionsContext";
import { Corridor } from "@/hooks/useTransactions";

const CORRIDORS: Corridor[] = ["MY-SG", "SG-HK", "HK-JP", "MY-JP", "SG-JP"];

type Health = "healthy" | "warning" | "degraded";

const COLOR: Record<Health, { dot: string; bar: string; label: string }> = {
  healthy: { dot: "bg-emerald-400", bar: "bg-emerald-400", label: "Healthy" },
  warning: { dot: "bg-amber-400", bar: "bg-amber-400", label: "Warning" },
  degraded: { dot: "bg-red-400", bar: "bg-red-400", label: "Degraded" },
};

export function CorridorHealthWidget() {
  const { transactions } = useTransactionsContext();

  const rows = useMemo(() => {
    const recent = transactions.slice(0, 30);
    const counts = Object.fromEntries(CORRIDORS.map((c) => [c, 0])) as Record<Corridor, number>;
    const failed = Object.fromEntries(CORRIDORS.map((c) => [c, 0])) as Record<Corridor, number>;
    const anom = Object.fromEntries(CORRIDORS.map((c) => [c, 0])) as Record<Corridor, number>;
    for (const tx of recent) {
      counts[tx.corridor_id]++;
      if (tx.status === "failed") failed[tx.corridor_id]++;
      if (tx.anomaly_flag) anom[tx.corridor_id]++;
    }
    const max = Math.max(1, ...CORRIDORS.map((c) => counts[c]));
    return CORRIDORS.map((c) => {
      const n = counts[c];
      const failedRate = n ? failed[c] / n : 0;
      const anomRate = n ? anom[c] / n : 0;
      let status: Health = "healthy";
      if (failedRate > 0.2) status = "degraded";
      else if (anomRate > 0.15) status = "warning";
      return { corridor: c, count: n, pct: (n / max) * 100, status };
    });
  }, [transactions]);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-700/50 ring-1 ring-zinc-700/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Corridor Health</h3>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
      </div>
      <div className="flex flex-col">
        {rows.map(({ corridor, count, pct, status }) => {
          const c = COLOR[status];
          return (
            <div key={corridor} className="flex justify-between items-center py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} title={c.label} />
                <span className="text-sm text-zinc-300 font-mono">{corridor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.bar} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-zinc-500 text-xs font-mono w-6 text-right">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
