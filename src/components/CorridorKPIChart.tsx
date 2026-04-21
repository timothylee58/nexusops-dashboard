import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTransactions, Corridor } from "@/hooks/useTransactions";
import { compactNumber } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CORRIDOR_COLORS: Record<Corridor, string> = {
  "MY-SG": "#fbbf24",
  "SG-HK": "#38bdf8",
  "HK-JP": "#34d399",
  "MY-JP": "#a78bfa",
  "SG-JP": "#fb7185",
};

export function CorridorKPIChart() {
  const { transactions } = useTransactions();

  const { labels, datasets } = useMemo(() => {
    // group by minute (HH:mm) and corridor
    const minuteMap: Record<string, Record<Corridor, number>> = {};
    const allMinutes = new Set<string>();

    for (const tx of transactions) {
      const d = new Date(tx.timestamp);
      const key = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      allMinutes.add(key);
      if (!minuteMap[key]) {
        minuteMap[key] = { "MY-SG": 0, "SG-HK": 0, "HK-JP": 0, "MY-JP": 0, "SG-JP": 0 };
      }
      minuteMap[key][tx.corridor_id] += tx.amount;
    }

    const sortedLabels = Array.from(allMinutes).sort().slice(-10);
    const corridors: Corridor[] = ["MY-SG", "SG-HK", "HK-JP", "MY-JP", "SG-JP"];

    const ds = corridors.map((c) => ({
      label: c,
      data: sortedLabels.map((m) => minuteMap[m]?.[c] ?? 0),
      borderColor: CORRIDOR_COLORS[c],
      backgroundColor: CORRIDOR_COLORS[c],
      tension: 0.4,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
    }));

    return { labels: sortedLabels, datasets: ds };
  }, [transactions]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            color: "#d4d4d8",
            font: { family: "JetBrains Mono, monospace", size: 11 },
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: "#27272a",
          borderColor: "#52525b",
          borderWidth: 1,
          titleColor: "#fafafa",
          bodyColor: "#d4d4d8",
          titleFont: { family: "JetBrains Mono, monospace" },
          bodyFont: { family: "JetBrains Mono, monospace" },
          padding: 10,
          callbacks: {
            label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
              ` ${ctx.dataset.label}: ${compactNumber(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(63,63,70,0.5)" },
          ticks: {
            color: "#71717a",
            font: { family: "JetBrains Mono, monospace", size: 10 },
            maxRotation: 0,
          },
        },
        y: {
          grid: { color: "rgba(63,63,70,0.5)" },
          ticks: {
            color: "#71717a",
            font: { family: "JetBrains Mono, monospace", size: 10 },
            callback: (v: string | number) => compactNumber(Number(v)),
          },
        },
      },
    }),
    []
  );

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 shadow-xl p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Corridor Volume (Live)</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Grouped by minute · All corridors</p>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          last {labels.length} min
        </div>
      </div>
      <div className="h-[300px] mt-4">
        <Line data={{ labels, datasets }} options={options} />
      </div>
    </div>
  );
}
