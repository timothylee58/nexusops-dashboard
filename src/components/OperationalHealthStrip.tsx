import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { pingApi } from "@/lib/api.ts";
import { useFxTrend } from "@/hooks/useFxTrend.ts";

async function rtPing(): Promise<number> {
  const t0 = performance.now();
  const ok = await pingApi();
  if (!ok) return -1;
  return Math.round(performance.now() - t0);
}

export function OperationalHealthStrip() {
  const { dataUpdatedAt, isError, isPending, isFetched } = useFxTrend();
  const fxAge = Date.now() - dataUpdatedAt;
  const staleFx = isFetched && !isPending && dataUpdatedAt > 0 && fxAge > 120_000;

  const { data: latency } = useQuery({
    queryKey: ["health", "latency"],
    queryFn: rtPing,
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  const [budget, setBudget] = useState(() => ({
    burns: Math.min(97, Math.round(94 + Math.random() * 2)),
  }));

  useEffect(() => {
    const id = window.setInterval(
      () => setBudget({ burns: Math.min(97, Math.round(92 + Math.random() * 4)) }),
      45000
    );
    return () => clearInterval(id);
  }, []);

  const fxDetail = isPending
    ? "loading…"
    : isError
      ? "error"
      : !isFetched
        ? "…"
        : `fresh · ${format(new Date(dataUpdatedAt || Date.now()), "HH:mm:ss")}`;

  const fxOk = isPending || (!isError && !staleFx);

  const latDetail = latency === undefined ? "…" : latency < 0 ? "offline" : `${latency}ms`;
  const latOk = latency !== undefined && latency >= 0 && latency < 1200;

  const chips = [
    { label: "Mock gateway", ok: latOk, detail: latDetail },
    { label: "FX ECB feed", ok: fxOk, detail: fxDetail },
    {
      label: "Error budget 7d",
      ok: budget.burns < 95,
      detail: `${budget.burns}% consumed`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
      {chips.map((c) => (
        <div
          key={c.label}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-card/70 ${
            c.ok ? "border-emerald-500/35 text-emerald-600 dark:text-emerald-400" : "border-destructive/35 text-destructive"
          }`}
        >
          <span>{c.label}</span>
          <span className="opacity-80 normal-case">·</span>
          <span className="normal-case text-foreground">{c.detail}</span>
        </div>
      ))}
    </div>
  );
}
