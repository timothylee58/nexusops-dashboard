/**
 * Mock payment corridor API — in-memory store, SSE stream, idempotent POST /payments
 */
import express from "express";
import cors from "cors";

const PORT = Number(process.env.MOCK_API_PORT || 3001);
const corsOrigins =
  process.env.MOCK_API_CORS?.split(",").filter(Boolean) || [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];

const CORRIDORS = ["MY-SG", "SG-HK", "HK-JP", "MY-JP", "SG-JP"];
const CURRENCIES = ["MYR", "SGD", "USD", "HKD", "JPY"];
const CATEGORIES = ["Payroll", "Vendor", "Treasury", "FX hedge", "Remittance"];
const STATUSES = ["pending", "settled", "failed"];
/** @type {readonly [number, number, number]} */
const STATUS_WEIGHTS = [0.12, 0.78, 0.1];

function pickWeighted() {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < STATUSES.length; i++) {
    acc += STATUS_WEIGHTS[i];
    if (r <= acc) return STATUSES[i];
  }
  return "settled";
}

function randomRef() {
  const a = Math.random().toString(36).slice(2, 8).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REF-${a}-${b}`;
}

function iso(ms) {
  return new Date(ms).toISOString();
}

/** @typedef {{ id: string, referenceId: string, timestamp: string, corridor_id: string, currency: string, amount: number, status: string, anomaly_flag: boolean, category: string, createdAt: string, settledAt: string | null }} Tx */

/** @returns {Tx} */
function makeTx(nowMs, offsetDays = 0) {
  const status = pickWeighted();
  const createdMs = nowMs - offsetDays * 86400000 - Math.random() * 7 * 86400000 - Math.random() * 3600000;
  let settledAt = null;
  if (status === "settled") {
    settledAt = iso(createdMs + Math.random() * 120000 + 500); // 0.5–120s latency mock
  }
  return {
    id: crypto.randomUUID().slice(0, 12),
    referenceId: randomRef(),
    timestamp: iso(Math.max(createdMs, Date.now() - 30 * 86400000)),
    corridor_id: CORRIDORS[Math.floor(Math.random() * CORRIDORS.length)],
    currency: CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)],
    amount: Math.round((Math.random() * 49900 + 100) * 100) / 100,
    status,
    anomaly_flag: Math.random() < 0.06,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    createdAt: iso(createdMs),
    settledAt,
  };
}

/** @type {Tx[]} */
let transactions = [];
/** @type {Map<string, { response: unknown, fingerprint: string }>} */
const idempotencyStore = new Map();
/** @type {express.Response[]} */
let sseClients = [];

/** @type {{ id: string, type: string, payload: Record<string, unknown>, at: string }[]} */
const webhookLog = [];

function broadcastSse(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(payload);
    } catch {
      /* noop */
    }
  });
}

function pushWebhook(type, payload) {
  const ev = {
    id: crypto.randomUUID().slice(0, 16),
    type,
    payload,
    at: new Date().toISOString(),
  };
  webhookLog.unshift(ev);
  if (webhookLog.length > 200) webhookLog.pop();
  broadcastSse("webhook", ev);
}

function seedStore() {
  const now = Date.now();
  transactions = [];
  for (let i = 0; i < 620; i++) {
    transactions.push(makeTx(now, Math.floor(Math.random() * 14)));
  }
  transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

seedStore();

/** @returns {Tx[]} */
function filterTx(all, { currency, status, from, to, q }) {
  let out = all.slice();
  if (currency && currency !== "all") out = out.filter((t) => t.currency === currency);
  if (status && status !== "all") out = out.filter((t) => t.status === status);
  if (from) {
    const f = new Date(from).getTime();
    out = out.filter((t) => new Date(t.timestamp).getTime() >= f);
  }
  if (to) {
    const tBound = new Date(to).getTime();
    out = out.filter((t) => new Date(t.timestamp).getTime() <= tBound);
  }
  if (q && q.trim()) {
    const qq = q.trim().toLowerCase();
    out = out.filter(
      (t) =>
        t.referenceId.toLowerCase().includes(qq) ||
        t.id.toLowerCase().includes(qq)
    );
  }
  return out;
}

/** @returns {Record<string, number>} */
function computeBalances(list) {
  const bal = { MYR: 0, SGD: 0, USD: 0, HKD: 0, JPY: 0 };
  for (const t of list) {
    if (t.status !== "settled") continue;
    if (bal[t.currency] === undefined) bal[t.currency] = 0;
    bal[t.currency] += t.amount;
  }
  const baseUsd = {
    MYR: 100000,
    SGD: 250000,
    USD: 500000,
    HKD: 80000,
    JPY: 12000000,
  };
  for (const k of Object.keys(baseUsd)) {
    bal[k] = Math.round(((baseUsd[k] || 0) + (bal[k] || 0)) * 100) / 100;
  }
  return bal;
}

const app = express();
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, txs: transactions.length });
});

/** Aggregated analytics for charts */
app.get("/api/analytics/summary", (_req, res) => {
  const settled = transactions.filter((t) => t.status === "settled");
  /** @type {Record<string, number>} */
  const byCategory = {};
  for (const t of settled) {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  }
  const daily = {};
  const lastDays = 14;
  for (let i = 0; i < lastDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    daily[d.toISOString().slice(0, 10)] = 0;
  }
  for (const t of settled) {
    const key = new Date(t.timestamp).toISOString().slice(0, 10);
    if (key in daily) daily[key] += t.amount;
  }
  const daysSorted = Object.keys(daily).sort();
  const areaSeries = daysSorted.map((d) => ({ date: d, amount: Math.round(daily[d] * 100) / 100 }));
  res.json({
    byCategory,
    spendArea: areaSeries,
    totals: settled.reduce((a, t) => a + t.amount, 0),
  });
});

app.get("/api/ledger/balances", (_req, res) => {
  res.json({ balances: computeBalances(transactions) });
});

app.get("/api/webhooks/log", (_req, res) => {
  res.json({ events: webhookLog.slice(0, 80) });
});

app.get("/api/transactions", (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(1200, Math.max(1, parseInt(String(req.query.limit || "50"), 10) || 50));
  const currency = req.query.currency;
  const status = req.query.status;
  const from = req.query.from;
  const to = req.query.to;
  const q = req.query.q;
  const sortField = (req.query.sortField || "timestamp") === "amount" ? "amount" : "timestamp";
  const sortDir = (req.query.sortDir || "desc") === "asc" ? "asc" : "desc";

  let filtered = filterTx(transactions, { currency, status, from, to, q });
  filtered.sort((a, b) => {
    const va = sortField === "amount" ? a.amount : new Date(a.timestamp).getTime();
    const vb = sortField === "amount" ? b.amount : new Date(b.timestamp).getTime();
    return sortDir === "asc" ? Number(va) - Number(vb) : Number(vb) - Number(va);
  });

  let settledCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let anomalyCount = 0;
  let totalVolume = 0;
  for (const t of filtered) {
    totalVolume += t.amount;
    if (t.anomaly_flag) anomalyCount++;
    if (t.status === "settled") settledCount++;
    else if (t.status === "pending") pendingCount++;
    else if (t.status === "failed") failedCount++;
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  res.json({
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    stats: {
      settledCount,
      pendingCount,
      failedCount,
      anomalyCount,
      totalVolume,
    },
  });
});

app.get("/api/transactions/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(": connected\n\n");
  sseClients.push(res);

  /** @returns {Tx} */
  const inject = () => {
    const tx = makeTx(Date.now(), 0);
    tx.timestamp = new Date().toISOString();
    tx.status = "pending";
    tx.settledAt = null;
    transactions.unshift(tx);
    if (transactions.length > 1500) transactions.pop();
    broadcastSse("transaction", tx);
    pushWebhook("payment_intent.processing", { referenceId: tx.referenceId, id: tx.id });
    setTimeout(() => {
      if (Math.random() < 0.15) return;
      const idx = transactions.findIndex((x) => x.id === tx.id);
      if (idx >= 0) {
        if (transactions[idx].status === "pending") {
          transactions[idx] = {
            ...transactions[idx],
            status: Math.random() < 0.07 ? "failed" : "settled",
            settledAt:
              Math.random() < 0.93
                ? new Date(Date.now() + Math.random() * 400 + 80).toISOString()
                : null,
          };
          broadcastSse("transaction_update", transactions[idx]);
          pushWebhook("payout.completed", { id: transactions[idx].id, status: transactions[idx].status });
        }
      }
    }, Math.random() * 800 + 200);
    return tx;
  };

  const heartbeat = setInterval(() => res.write(": hb\n\n"), 25000);
  const injector = setInterval(inject, 1400 + Math.random() * 1200);

  req.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(injector);
    sseClients = sseClients.filter((x) => x !== res);
  });
});

/** Idempotent POST /payments — no artificial delay */

app.post("/api/payments", (req, res) => {
  const keyHeader = req.headers["idempotency-key"] || req.headers["Idempotency-Key"];
  const idempotencyKey = typeof keyHeader === "string" ? keyHeader : Array.isArray(keyHeader) ? keyHeader[0] : "";
  const body =
    typeof req.body === "object" && req.body
      ? req.body
      : {};
  const amount = Number(body.amount);
  const currency = String(body.currency || "").toUpperCase();
  const corridor_id = String(body.corridor_id || "");
  const category = String(body.category || "Remittance");

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "invalid amount" });
    return;
  }
  if (!CURRENCIES.includes(currency)) {
    res.status(400).json({ error: "invalid currency" });
    return;
  }
  if (!CORRIDORS.includes(corridor_id)) {
    res.status(400).json({ error: "invalid corridor" });
    return;
  }
  if (!idempotencyKey || idempotencyKey.length < 8) {
    res.status(400).json({ error: "missing Idempotency-Key header" });
    return;
  }

  const fingerprint = JSON.stringify({
    amount: Math.round(amount * 100) / 100,
    currency,
    corridor_id,
    category,
  });
  const existing = idempotencyStore.get(idempotencyKey);
  if (existing) {
    if (existing.fingerprint !== fingerprint) {
      res.status(409).json({ error: "idempotency key reused with different body" });
      return;
    }
    res.status(200).json(existing.response);
    return;
  }

  const now = Date.now();
  const settled = Math.random() < 0.92;
  const tx = /** @type {Tx} */ ({
    id: crypto.randomUUID().slice(0, 12),
    referenceId: randomRef(),
    timestamp: iso(now),
    corridor_id,
    currency,
    amount: Math.round(amount * 100) / 100,
    status: settled ? "settled" : Math.random() < 0.5 ? "pending" : "failed",
    anomaly_flag: false,
    category,
    createdAt: iso(now),
    settledAt:
      settled ? iso(now + Math.round(Math.random() * 180 + 20)) : null,
  });

  transactions.unshift(tx);
  if (transactions.length > 1500) transactions.pop();

  const payload = {
    transaction: tx,
    receivedAt: iso(now),
  };
  idempotencyStore.set(idempotencyKey, { response: payload, fingerprint });

  broadcastSse("transaction", tx);
  pushWebhook("payment_intent.created", { referenceId: tx.referenceId, amount: tx.amount });

  res.status(201).json(payload);
});

app.listen(PORT, () => {
  console.info(`mock-api listening on ${PORT}`);
});
