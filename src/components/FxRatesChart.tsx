import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useFxTrend } from "@/hooks/useFxTrend";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const stroke = {
  MYR: "#34d399",
  SGD: "#38bdf8",
  USD: "#fbbf24",
} as const;

export function FxRatesChart() {
  const { data, isPending, isError, dataUpdatedAt, error } = useFxTrend();
  const lastSync = dataUpdatedAt ? format(new Date(dataUpdatedAt), "HH:mm:ss") : "–";

  if (isPending && !data) {
    return (
      <div className="rounded-xl border bg-card border-border shadow-xl p-5 space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  const series = data ?? [];

  return (
    <figure className="rounded-xl bg-card border border-border ring-1 ring-border/30 shadow-xl p-5">
      <figcaption className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Cross-border FX (ECB reference)</h2>
          <p className="sr-only">
            Interactive line chart of MYR SGD USD against EUR closing rates from Frankfurter free API over
            roughly the last twenty one days.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ECB daily fix · EUR base · Lines: MYR, SGD, USD per 1 EUR
          </p>
          {isError && (
            <p className="text-xs text-destructive mt-1 font-mono" role="alert">
              {(error as Error)?.message ?? "Unable to refresh FX"}
            </p>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono tabular-nums">
          synced {lastSync}
        </span>
      </figcaption>
      <div className="h-[280px] w-full" role="presentation">
        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm font-mono">
            No FX data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(parseISO(v as string), "MMM d")}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "JetBrains Mono" }}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "JetBrains Mono" }}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                }}
                labelFormatter={(v) => format(parseISO(String(v)), "yyyy-MM-dd")}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dot={false} name="MYR" dataKey="MYR" stroke={stroke.MYR} strokeWidth={2} isAnimationActive={false} />
              <Line type="monotone" dot={false} name="SGD" dataKey="SGD" stroke={stroke.SGD} strokeWidth={2} isAnimationActive={false} />
              <Line type="monotone" dot={false} name="USD" dataKey="USD" stroke={stroke.USD} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </figure>
  );
}
