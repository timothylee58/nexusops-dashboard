/** Cross-border corridor + ISO 4217 (subset) aligned with mock API */

export type Corridor = "MY-SG" | "SG-HK" | "HK-JP" | "MY-JP" | "SG-JP";
export type Currency = "MYR" | "SGD" | "USD" | "HKD" | "JPY";
export type TxStatus = "pending" | "settled" | "failed";

export interface Transaction {
  id: string;
  referenceId: string;
  timestamp: string;
  corridor_id: Corridor;
  currency: Currency;
  amount: number;
  status: TxStatus;
  anomaly_flag: boolean;
  category: string;
  createdAt: string;
  settledAt: string | null;
}

export interface TransactionPageStats {
  settledCount: number;
  pendingCount: number;
  failedCount: number;
  anomalyCount: number;
  totalVolume: number;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  stats: TransactionPageStats;
}

export interface BalancesResponse {
  balances: Partial<Record<Currency, number>> & Record<string, number>;
}

export interface AnalyticsSummaryResponse {
  byCategory: Record<string, number>;
  spendArea: { date: string; amount: number }[];
  totals: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  at: string;
}
