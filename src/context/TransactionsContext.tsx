import { createContext, useContext, ReactNode, useMemo } from "react";
import {
  type FeedFilters,
  type UseDashboardTransactionsResult,
  useDashboardTransactions,
} from "@/hooks/useDashboardTransactions";
import type { Transaction } from "@/types/transaction";

export type { FeedFilters };

export interface FeedStatsSummary {
  total: number;
  settledCount: number;
  pendingCount: number;
  failedCount: number;
  anomalyCount: number;
  totalVolume: number;
}

export interface TransactionsCtxValue
  extends Omit<UseDashboardTransactionsResult, "stats"> {
  /** Dense rolling window for sparklines, corridor charts, alerts */
  transactions: Transaction[];
  stats: FeedStatsSummary;
}

const TransactionsContext = createContext<TransactionsCtxValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const dash = useDashboardTransactions();
  const stats = useMemo(
    (): FeedStatsSummary => ({
      total: dash.stats.filteredTotal,
      settledCount: dash.stats.settledCount,
      pendingCount: dash.stats.pendingCount,
      failedCount: dash.stats.failedCount,
      anomalyCount: dash.stats.anomalyCount,
      totalVolume: dash.stats.totalVolume,
    }),
    [dash.stats]
  );

  const value = useMemo(
    (): TransactionsCtxValue => ({
      ...dash,
      transactions: dash.chartTransactions,
      stats,
    }),
    [dash, stats]
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactionsContext() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactionsContext must be used within TransactionsProvider");
  return ctx;
}
