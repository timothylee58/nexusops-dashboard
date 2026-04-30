import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useTransactionsContext } from "@/context/TransactionsContext";
import { compactNumber } from "@/lib/format";
import { Sparkline } from "./Sparkline";

const MAX_POINTS = 20;

function pushSeries(ref: React.MutableRefObject<number[]>, value: number) {
  const next = [...ref.current, value];
  if (next.length > MAX_POINTS) next.shift();
  ref.current = next;
  return next;
}

export function KPIStrip() {
  const { stats, transactions } = useTransactionsContext();

  const volRef = useRef<number[]>([]);
  const anomRef = useRef<number[]>([]);
  const failRef = useRef<number[]>([]);
  const corrRef = useRef<number[]>([]);
  const lastIdRef = useRef<string | null>(null);

  // Track per-tick series — only push when newest tx changes
  const newest = transactions[0];
  if (newest && newest.id !== lastIdRef.current) {
    lastIdRef.current = newest.id;
    pushSeries(volRef, stats.totalVolume);
    pushSeries(anomRef, stats.total ? (stats.anomalyCount / stats.total) * 100 : 0);
    pushSeries(failRef, stats.total ? (stats.failedCount / stats.total) * 100 : 0);
    pushSeries(corrRef, 5);
  }

  // Force re-render not needed — parent re-renders on new tx; refs read on each render

  const items = [
    {
      key: "total",
      label: "Total",
      value: stats.total,
      icon: TrendingUp,
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/5",
      series: volRef.current,
      sparkColor: "#fbbf24",
    },
    {
      key: "settled",
      label: "Settled",
      value: stats.settledCount,
      icon: CheckCircle2,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      series: failRef.current.map((v) => 100 - v),
      sparkColor: "#34d399",
    },
    {
      key: "failed",
      label: "Failed",
      value: stats.failedCount,
      icon: XCircle,
      color: "text-red-400",
      border: "border-red-500/30",
      bg: "bg-red-500/5",
      series: failRef.current,
      sparkColor: "#fbbf24",
    },
    {
      key: "anomalies",
      label: "Anomalies",
      value: stats.anomalyCount,
      icon: AlertTriangle,
      color: "text-red-400",
      border: "border-red-500/30",
      bg: "bg-red-500/5",
      pulse: true,
      series: anomRef.current,
      sparkColor: "#fbbf24",
    },
  ];

  // Suppress unused effect warning placeholder
  useEffect(() => {}, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ key, label, value, icon: Icon, color, border, bg, pulse, series, sparkColor }) => (
        <div
          key={key}
          className={`relative overflow-hidden rounded-xl border ${border} ${bg} p-4 flex items-center gap-3 ring-1 ring-zinc-700/20`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-zinc-950/40 ${color} ${pulse && value > 0 ? "animate-pulse" : ""}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
              {label}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={value}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                className={`text-xl font-mono font-bold ${color}`}
              >
                {compactNumber(value)}
              </motion.div>
            </AnimatePresence>
          </div>
          <Sparkline values={series} color={sparkColor} gradientId={`spark-${key}`} />
        </div>
      ))}
    </div>
  );
}
