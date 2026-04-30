import { useMemo } from "react";
import { useTransactionsContext } from "@/context/TransactionsContext";
import type { Corridor, Transaction } from "@/types/transaction";

const CORRIDORS: Corridor[] = ["MY-SG", "SG-HK", "HK-JP", "MY-JP", "SG-JP"];
const CURRENCY_SYMBOL: Record<string, string> = {
  MYR: "RM",
  SGD: "S$",
  USD: "$",
  HKD: "HK$",
  JPY: "¥",
};

function statusGlyph(s: Transaction["status"]) {
  if (s === "settled") return { ch: "✓", cls: "text-emerald-400" };
  if (s === "failed") return { ch: "✗", cls: "text-red-400" };
  return { ch: "⚠", cls: "text-amber-400" };
}

export function LiveTicker() {
  const { transactions } = useTransactionsContext();

  const items = useMemo(() => {
    const latest: Partial<Record<Corridor, Transaction>> = {};
    for (const tx of transactions) {
      if (!latest[tx.corridor_id]) latest[tx.corridor_id] = tx;
    }
    return CORRIDORS.map((c) => latest[c]).filter((t): t is Transaction => !!t);
  }, [transactions]);

  return (
    <div className="w-full bg-zinc-800/50 border-b border-zinc-700/30 h-8 overflow-hidden flex items-stretch sticky top-0 z-30">
      <div className="sticky left-0 bg-zinc-800 px-3 border-r border-zinc-700 flex items-center">
        <span className="text-amber-400 font-mono text-xs font-bold tracking-wider flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
          </span>
          LIVE
        </span>
      </div>
      <div className="flex-1 overflow-hidden flex items-center">
        <div className="ticker-track whitespace-nowrap font-mono text-xs text-zinc-300">
          {items.length > 0 &&
            [...items, ...items].map((tx, i) => {
              const g = statusGlyph(tx.status);
              return (
                <span key={`${tx.id}-${i}`} className="inline-flex items-center gap-1 mr-6">
                  <span className="text-zinc-400">{tx.corridor_id}</span>
                  <span className="text-zinc-200">
                    {CURRENCY_SYMBOL[tx.currency]}
                    {Math.round(tx.amount).toLocaleString()}
                  </span>
                  <span className={`${g.cls} font-bold`}>{g.ch}</span>
                  <span className="text-zinc-700 ml-4">·</span>
                </span>
              );
            })}
        </div>
      </div>
    </div>
  );
}
