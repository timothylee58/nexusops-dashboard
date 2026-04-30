import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { useTransactionsContext } from "@/context/TransactionsContext";
import type { Transaction } from "@/types/transaction.ts";

function latencyMs(tx: Transaction): number | null {
  if (tx.status !== "settled" || !tx.settledAt) return null;
  const dt = new Date(tx.settledAt).getTime() - new Date(tx.createdAt).getTime();
  if (!Number.isFinite(dt)) return null;
  return Math.min(Math.max(dt, 80), 300_000);
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const clamped = Math.min(100, Math.max(0, p));
  const idx = Math.round((clamped / 100) * (sorted.length - 1));
  return sorted[idx];
}

export function SettlementLatencyPanel() {
  const { chartTransactions } = useTransactionsContext();

  const hist = useMemo(() => {
    const raw = chartTransactions.map(latencyMs).filter((v): v is number => v != null);
    raw.sort((a, b) => a - b);
    const buckets = ["0–2s", "2–5s", "5–30s", "30s+"];
    const counts = [0, 0, 0, 0];
    for (const v of raw) {
      const s = v / 1000;
      if (s < 2) counts[0]++;
      else if (s < 5) counts[1]++;
      else if (s < 30) counts[2]++;
      else counts[3]++;
    }
    const histogram = buckets.map((name, i) => ({ bucket: name, count: counts[i] }));
    const median = percentile(raw, 50);
    const p95 = percentile(raw, 95);
    return { histogram, median, p95, samples: raw.length };
  }, [chartTransactions]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-border/40">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Settlement latency</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">Pending → settled (mock timestamps)</p>
        </div>
        <dl className="flex gap-4 text-xs font-mono">
          <div>
            <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">Median</dt>
            <dd className="text-primary font-semibold">
              {hist.median ? `${(hist.median / 1000).toFixed(2)}s` : "–"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">P95</dt>
            <dd className="text-emerald-500 font-semibold">
              {hist.p95 ? `${(hist.p95 / 1000).toFixed(2)}s` : "–"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">Samples</dt>
            <dd className="text-foreground">{hist.samples}</dd>
          </div>
        </dl>
      </div>
      <div className="h-[180px]" role="presentation">
        {hist.samples === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-16 font-mono">No settled timelines yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hist.histogram}>
              <CartesianGrid strokeDasharray="4 5" opacity={0.35} stroke="hsl(var(--muted-foreground))" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} width={36} />
              <Tooltip cursor={{ opacity: 0.12 }} />
              <Bar dataKey="count" name="Transactions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="sr-only">
        Histogram of settlement delays for settled payments in seconds, grouped into buckets zero to two,
        two to five, five to thirty, and over thirty seconds.
      </p>
    </div>
  );
}
