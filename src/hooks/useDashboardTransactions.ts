import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { nanoid } from "nanoid";

import { fetchTransactionChartSlice, fetchTransactionPage, pingApi } from "@/lib/api.ts";
import { isOfflineFeed } from "@/lib/env.ts";
import type {
  Currency,
  Corridor,
  Transaction,
  TransactionPageStats,
} from "@/types/transaction.ts";
import type { TxStatus } from "@/types/transaction.ts";

const FEED_QUERY_KEY_BASE = ["transactions", "feed"] as const;
const CHART_QUERY_KEY_BASE = ["transactions", "charts"] as const;

export const ROW_LIMIT_DEFAULT = 100;
export const ROW_LIMIT_OPTIONS = [50, 100, 250, 500];

function randomRef() {
  return `REF-${nanoid(8).toUpperCase()}-${nanoid(4).toUpperCase()}`;
}

const CORRIDORS: Corridor[] = ["MY-SG", "SG-HK", "HK-JP", "MY-JP", "SG-JP"];
const CURRENCIES: Currency[] = ["MYR", "SGD", "USD", "HKD", "JPY"];
const STATUSES: TxStatus[] = ["pending", "settled", "failed"];
const CATEGORIES = ["Payroll", "Vendor", "Treasury", "FX hedge", "Remittance"];
const STATUS_WEIGHTS = [0.12, 0.78, 0.1] as const;

function pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i] ?? 0;
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

function generateOfflineTx(): Transaction {
  const status = pickWeighted(STATUSES, STATUS_WEIGHTS);
  const createdMs = Date.now() - Math.random() * 7 * 86400000;
  let settledAt: string | null = null;
  if (status === "settled") {
    settledAt = new Date(createdMs + Math.random() * 120000 + 400).toISOString();
  }
  return {
    id: nanoid(12),
    referenceId: randomRef(),
    timestamp: new Date(createdMs).toISOString(),
    corridor_id: CORRIDORS[Math.floor(Math.random() * CORRIDORS.length)],
    currency: CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)],
    amount: Math.round((Math.random() * 49900 + 100) * 100) / 100,
    status,
    anomaly_flag: Math.random() < 0.07,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    createdAt: new Date(createdMs).toISOString(),
    settledAt,
  };
}

function parseNum(v: string | null, fallback: number) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function emptyStats(): TransactionPageStats {
  return {
    settledCount: 0,
    pendingCount: 0,
    failedCount: 0,
    anomalyCount: 0,
    totalVolume: 0,
  };
}

function aggregateStats(rows: Transaction[]): TransactionPageStats {
  const s = emptyStats();
  for (const t of rows) {
    s.totalVolume += t.amount;
    if (t.anomaly_flag) s.anomalyCount++;
    if (t.status === "settled") s.settledCount++;
    else if (t.status === "pending") s.pendingCount++;
    else if (t.status === "failed") s.failedCount++;
  }
  return s;
}

export interface UseDashboardTransactionsResult {
  mode: "api" | "offline";
  isConnected: boolean;
  pageRows: Transaction[];
  chartTransactions: Transaction[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
    setPage: (p: number) => void;
    setLimit: (n: number) => void;
  };
  stats: TransactionPageStats & { filteredTotal: number };
  filters: FeedFilters;
  setFilter: (key: keyof FeedFilters, value: string) => void;
  isFeedLoading: boolean;
  isChartLoading: boolean;
  liveTxId: string | null;
}

export interface FeedFilters {
  currency: string;
  status: string;
  from: string;
  to: string;
  q: string;
  sortField: "timestamp" | "amount";
  sortDir: "asc" | "desc";
}

export function useDashboardTransactions(): UseDashboardTransactionsResult {
  const offlineMode = isOfflineFeed;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseNum(searchParams.get("page"), 1));
  const limit = Math.min(
    offlineMode ? 1200 : 1200,
    Math.max(50, parseNum(searchParams.get("limit"), ROW_LIMIT_DEFAULT))
  );
  const currency = searchParams.get("currency") || "all";
  const status = searchParams.get("status") || "all";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const q = searchParams.get("q") || "";
  const sortField = searchParams.get("sortField") === "amount" ? "amount" : "timestamp";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const params = useMemo(
    () => ({
      page,
      limit,
      sortField,
      sortDir,
      currency,
      status,
      from,
      to,
      q,
    }),
    [page, limit, sortField, sortDir, currency, status, from, to, q]
  );

  const filters: FeedFilters = useMemo(
    () => ({ currency, status, from, to, q, sortField, sortDir }),
    [currency, status, from, to, q, sortField, sortDir]
  );

  const [offlineBuffer, setOfflineBuffer] = useState<Transaction[]>(() =>
    offlineMode ? Array.from({ length: 280 }, () => generateOfflineTx()) : []
  );
  const [isConnected, setIsConnected] = useState(true);
  const [liveTxId, setLiveTxId] = useState<string | null>(null);
  const invalidateRef = useRef<number | null>(null);

  const scheduleInvalidate = useCallback(() => {
    if (invalidateRef.current) return;
    invalidateRef.current = window.setTimeout(() => {
      invalidateRef.current = null;
      void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY_BASE });
      void queryClient.invalidateQueries({ queryKey: CHART_QUERY_KEY_BASE });
    }, 450);
  }, [queryClient]);

  useEffect(() => {
    if (!offlineMode) return;
    const timerRef = { current: null as number | null };
    const tick = () => {
      const tx = generateOfflineTx();
      tx.timestamp = new Date().toISOString();
      tx.status = "pending";
      tx.settledAt = null;
      setLiveTxId(tx.id);
      setOfflineBuffer((prev) => [tx, ...prev].slice(0, 650));
      timerRef.current = window.setTimeout(tick, 700 + Math.random() * 900);
    };
    timerRef.current = window.setTimeout(tick, 1200);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [offlineMode]);

  const fuse = useMemo(
    () =>
      new Fuse(offlineBuffer, {
        keys: ["referenceId", "id"],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [offlineBuffer]
  );

  const offlineFiltered = useMemo(() => {
    let rows = offlineBuffer.slice();
    if (currency !== "all") rows = rows.filter((t) => t.currency === currency);
    if (status !== "all") rows = rows.filter((t) => t.status === status);
    if (from) {
      const f = new Date(from).getTime();
      rows = rows.filter((t) => new Date(t.timestamp).getTime() >= f);
    }
    if (to) {
      const tmax = new Date(to).getTime();
      rows = rows.filter((t) => new Date(t.timestamp).getTime() <= tmax);
    }
    if (q.trim()) {
      const hits = fuse.search(q.trim());
      rows = hits.map((h) => h.item);
    }
    rows.sort((a, b) => {
      const va = sortField === "amount" ? a.amount : new Date(a.timestamp).getTime();
      const vb = sortField === "amount" ? b.amount : new Date(b.timestamp).getTime();
      return sortDir === "asc" ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });
    return rows;
  }, [offlineBuffer, currency, status, from, to, q, sortField, sortDir, fuse]);

  const feedQuery = useQuery({
    enabled: !offlineMode,
    queryKey: [...FEED_QUERY_KEY_BASE, params],
    queryFn: ({ signal }) => fetchTransactionPage(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: 1,
  });

  const chartQuery = useQuery({
    enabled: !offlineMode,
    queryKey: [...CHART_QUERY_KEY_BASE],
    queryFn: ({ signal }) => fetchTransactionChartSlice(1000, signal),
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (offlineMode) return;
    let mounted = true;
    pingApi().then((ok) => {
      if (mounted) setIsConnected(ok);
    });
    return () => {
      mounted = false;
    };
  }, [offlineMode, feedQuery.dataUpdatedAt]);

  useEffect(() => {
    if (offlineMode) return;
    const es = new EventSource("/api/transactions/stream");
    es.addEventListener("transaction", (ev) => {
      try {
        const tx = JSON.parse((ev as MessageEvent).data as string) as Transaction;
        setLiveTxId(tx.id);
        scheduleInvalidate();
      } catch {
        /* noop */
      }
    });
    es.addEventListener("transaction_update", () => {
      scheduleInvalidate();
    });
    es.onerror = () => setIsConnected(false);
    return () => es.close();
  }, [offlineMode, scheduleInvalidate]);

  const setFilter = useCallback(
    (key: keyof FeedFilters, value: string) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (!value || value === "all") {
            if (key === "sortField") n.set("sortField", "timestamp");
            else if (key === "sortDir") n.set("sortDir", "desc");
            else n.delete(key);
          } else {
            n.set(key, value);
          }
          if (key !== "page") n.set("page", "1");
          return n;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (p: number) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("page", String(Math.max(1, p)));
          return n;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setLimit = useCallback(
    (n: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("limit", String(n));
          next.set("page", "1");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  if (offlineMode) {
    const statsMerged = aggregateStats(offlineFiltered);
    const offlinePages = Math.max(1, Math.ceil(offlineFiltered.length / limit));
    const offlineSafePage = Math.min(page, offlinePages);
    const start = (offlineSafePage - 1) * limit;
    const pageRowsLocal = offlineFiltered.slice(start, start + limit);

    return {
      mode: "offline",
      isConnected,
      pageRows: pageRowsLocal,
      chartTransactions: offlineFiltered.slice(0, 800),
      pagination: {
        page: offlineSafePage,
        pages: offlinePages,
        total: offlineFiltered.length,
        limit,
        setPage,
        setLimit,
      },
      stats: { ...statsMerged, filteredTotal: offlineFiltered.length },
      filters,
      setFilter,
      isFeedLoading: false,
      isChartLoading: false,
      liveTxId,
    };
  }

  const data = feedQuery.data;
  const pageRows = data?.items ?? [];
  const statsBase = data?.stats ?? emptyStats();
  const stats = {
    ...statsBase,
    filteredTotal: data?.total ?? 0,
  };

  return {
    mode: "api",
    isConnected,
    pageRows,
    chartTransactions: chartQuery.data ?? [],
    pagination: {
      page: data?.page ?? page,
      pages: data?.pages ?? 1,
      total: data?.total ?? 0,
      limit: data?.limit ?? limit,
      setPage,
      setLimit,
    },
    stats,
    filters,
    setFilter,
    isFeedLoading: feedQuery.isLoading,
    isChartLoading: chartQuery.isLoading,
    liveTxId,
  };
}
