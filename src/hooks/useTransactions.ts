import { useEffect, useRef, useState, useMemo } from "react";
import { nanoid } from "nanoid";

export type Corridor = "MY-SG" | "SG-HK" | "HK-JP" | "MY-JP" | "SG-JP";
export type Currency = "MYR" | "SGD" | "HKD" | "JPY";
export type TxStatus = "pending" | "completed" | "failed";

export interface Transaction {
  id: string;
  timestamp: string;
  corridor_id: Corridor;
  currency: Currency;
  amount: number;
  status: TxStatus;
  anomaly_flag: boolean;
}

const CORRIDORS: Corridor[] = ["MY-SG", "SG-HK", "HK-JP", "MY-JP", "SG-JP"];
const CURRENCIES: Currency[] = ["MYR", "SGD", "HKD", "JPY"];
const STATUSES: TxStatus[] = ["pending", "completed", "failed"];
const STATUS_WEIGHTS = [0.18, 0.72, 0.10];

function pickWeighted<T>(items: T[], weights: number[]): T {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

function generateTx(): Transaction {
  return {
    id: nanoid(12),
    timestamp: new Date().toISOString(),
    corridor_id: CORRIDORS[Math.floor(Math.random() * CORRIDORS.length)],
    currency: CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)],
    amount: Math.round((Math.random() * 49900 + 100) * 100) / 100,
    status: pickWeighted(STATUSES, STATUS_WEIGHTS),
    anomaly_flag: Math.random() < 0.08,
  };
}

const MAX_BUFFER = 50;

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    Array.from({ length: 8 }, generateTx).map((t, i) => ({
      ...t,
      timestamp: new Date(Date.now() - i * 4000).toISOString(),
    }))
  );
  const [isConnected, setIsConnected] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setTransactions((prev) => {
        const next = [generateTx(), ...prev];
        return next.slice(0, MAX_BUFFER);
      });
      const delay = 500 + Math.random() * 700;
      timerRef.current = window.setTimeout(tick, delay);
    };
    timerRef.current = window.setTimeout(tick, 800);
    return () => {
      mounted = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const stats = useMemo(() => {
    let completedCount = 0,
      failedCount = 0,
      anomalyCount = 0,
      totalVolume = 0;
    for (const t of transactions) {
      if (t.status === "completed") completedCount++;
      else if (t.status === "failed") failedCount++;
      if (t.anomaly_flag) anomalyCount++;
      totalVolume += t.amount;
    }
    return {
      total: transactions.length,
      completedCount,
      failedCount,
      anomalyCount,
      totalVolume,
    };
  }, [transactions]);

  return { transactions, isConnected, stats, setIsConnected };
}
