import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { DashboardLayout } from "@/components/DashboardLayout.tsx";
import { Protected } from "@/components/Protected.tsx";
import { fetchAnalyticsSummary } from "@/lib/api.ts";

const PIE_PALETTE = ["#34d399", "#38bdf8", "#fbbf24", "#a78bfa", "#fb7185", "#fcd34d"];

export default function Analytics() {
  const { data } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: ({ signal }) => fetchAnalyticsSummary(signal),
    staleTime: 45_000,
  });

  const pieData = Object.entries(data?.byCategory ?? {}).map(([name, value]) => ({
    name,
    value,
  }));

  const areaData = data?.spendArea ?? [];

  const totalPie = pieData.reduce((a, x) => a + x.value, 0) || 1;

  return (
    <DashboardLayout>
      <h1 className="sr-only">Analytics · Spend and corridor insights</h1>
      <div className="space-y-4">
        <div className="rounded-xl bg-card border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">Spend breakdown</h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Settled volume by category · mock ledger</p>
        </div>
        <Protected allowedRoles={["admin", "analyst"]}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <figure className="rounded-xl border border-border bg-card p-5 min-h-[360px] shadow-sm ring-1 ring-border/40">
              <figcaption className="text-sm font-semibold mb-4">
                Categories (share of {totalPie.toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </figcaption>
              <div className="h-[280px]" role="presentation">
                {pieData.length === 0 ? (
                  <p className="text-muted-foreground text-sm font-mono p-16 text-center">
                    Enable mock API to load analytics aggregates.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="55%" outerRadius={100} label>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => val.toFixed(2)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </figure>
            <figure className="rounded-xl border border-border bg-card p-5 min-h-[360px] shadow-sm ring-1 ring-border/40">
              <figcaption className="text-sm font-semibold mb-4">
                Corridor spend trajectory (mock)
              </figcaption>
              <div className="h-[280px]" role="presentation">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="spFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 6" opacity={0.25} stroke="hsl(var(--muted-foreground))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip formatter={(val: number) => val?.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#spFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </figure>
          </div>
        </Protected>
      </div>
    </DashboardLayout>
  );
}
