import type {
  AnalyticsSummaryResponse,
  BalancesResponse,
  TransactionListResponse,
  Transaction,
  WebhookEvent,
} from "@/types/transaction";

const PREFIX = "/api";

function buildTransactionsQuery(params: {
  page: number;
  limit: number;
  sortField: "timestamp" | "amount";
  sortDir: "asc" | "desc";
  currency?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit));
  sp.set("sortField", params.sortField);
  sp.set("sortDir", params.sortDir);
  if (params.currency && params.currency !== "all") sp.set("currency", params.currency);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  return `${PREFIX}/transactions?${sp.toString()}`;
}

export async function fetchTransactionPage(
  params: Parameters<typeof buildTransactionsQuery>[0],
  signal?: AbortSignal
): Promise<TransactionListResponse> {
  const url = buildTransactionsQuery(params);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`transactions ${res.status}`);
  return res.json() as Promise<TransactionListResponse>;
}

/** Large slice for corridor volume / KPI charts */
export async function fetchTransactionChartSlice(
  limit = 1000,
  signal?: AbortSignal
): Promise<Transaction[]> {
  const res = await fetch(
    `${PREFIX}/transactions?page=1&limit=${limit}&sortField=timestamp&sortDir=desc`,
    { signal }
  );
  if (!res.ok) throw new Error(`chart slice ${res.status}`);
  const body = (await res.json()) as TransactionListResponse;
  return body.items;
}

export interface PostPaymentInput {
  amount: number;
  currency: string;
  corridor_id: string;
  category?: string;
}

export interface PostPaymentResult {
  transaction: Transaction;
  receivedAt: string;
}

export async function postPayment(
  body: PostPaymentInput,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<PostPaymentResult> {
  const res = await fetch(`${PREFIX}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
    signal,
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json?.error as string) || `payment ${res.status}`);
  return json as PostPaymentResult;
}

export async function fetchBalances(signal?: AbortSignal): Promise<BalancesResponse> {
  const res = await fetch(`${PREFIX}/ledger/balances`, { signal });
  if (!res.ok) throw new Error(`balances ${res.status}`);
  return res.json() as Promise<BalancesResponse>;
}

export async function fetchAnalyticsSummary(signal?: AbortSignal): Promise<AnalyticsSummaryResponse> {
  const res = await fetch(`${PREFIX}/analytics/summary`, { signal });
  if (!res.ok) throw new Error(`analytics ${res.status}`);
  return res.json() as Promise<AnalyticsSummaryResponse>;
}

export async function fetchWebhookLog(signal?: AbortSignal): Promise<{ events: WebhookEvent[] }> {
  const res = await fetch(`${PREFIX}/webhooks/log`, { signal });
  if (!res.ok) throw new Error(`webhooks ${res.status}`);
  return res.json() as Promise<{ events: WebhookEvent[] }>;
}

export async function pingApi(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${PREFIX}/health`, { signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
