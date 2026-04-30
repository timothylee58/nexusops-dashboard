import { useQuery } from "@tanstack/react-query";

export interface FxTrendPoint {
  date: string;
  MYR: number;
  SGD: number;
  USD: number;
}

async function fetchEcbTriple(): Promise<FxTrendPoint[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 21);
  const s = start.toISOString().slice(0, 10);
  const e = end.toISOString().slice(0, 10);
  const url = `https://api.frankfurter.app/${s}..${e}?from=EUR&to=MYR,SGD,USD`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fx ${res.status}`);
  const json = (await res.json()) as {
    rates?: Record<string, { MYR: number; SGD: number; USD: number }>;
  };
  const rates = json.rates ?? {};
  return Object.keys(rates)
    .sort()
    .map((d) => ({
      date: d,
      MYR: rates[d]?.MYR ?? 0,
      SGD: rates[d]?.SGD ?? 0,
      USD: rates[d]?.USD ?? 0,
    }));
}

export function useFxTrend() {
  return useQuery({
    queryKey: ["fx", "ecb", "eur-trip"],
    queryFn: fetchEcbTriple,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 2,
    meta: {
      fxSourceUrl: "https://www.frankfurter.app",
    },
  });
}
