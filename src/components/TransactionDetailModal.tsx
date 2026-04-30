import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { useAuth } from "@/context/AuthContext";
import { formatAmount } from "@/lib/format";

const CORRIDOR_DOT: Record<string, string> = {
  "MY-SG": "bg-amber-400",
  "SG-HK": "bg-sky-400",
  "HK-JP": "bg-emerald-400",
  "MY-JP": "bg-violet-400",
  "SG-JP": "bg-rose-400",
};

const CURRENCY_SYMBOL: Record<string, string> = {
  MYR: "RM",
  SGD: "S$",
  USD: "$",
  HKD: "HK$",
  JPY: "¥",
};

const STATUS_BADGE: Record<string, string> = {
  settled: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30",
  failed: "bg-red-400/10 text-red-400 border border-red-400/30",
  pending: "bg-amber-400/10 text-amber-400 border border-amber-400/30",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 gap-4 border-b border-zinc-800/60 last:border-b-0">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-zinc-200 font-mono text-right break-all">{children}</span>
    </div>
  );
}

export function TransactionDetailModal({
  tx,
  onClose,
}: {
  tx: Transaction | null;
  onClose: () => void;
}) {
  const { role } = useAuth();
  const [copied, setCopied] = useState(false);

  // Stable per-tx mock processing time
  const processingMs = useMemo(() => {
    if (!tx) return 0;
    let h = 0;
    for (let i = 0; i < tx.id.length; i++) h = (h * 31 + tx.id.charCodeAt(i)) >>> 0;
    return 120 + (h % 2281);
  }, [tx]);

  useEffect(() => {
    if (!tx) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tx, onClose]);

  const handleCopy = () => {
    if (!tx) return;
    navigator.clipboard.writeText(tx.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      {tx && (
        <motion.div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-zinc-900 rounded-2xl border border-zinc-700/50 shadow-2xl w-full max-w-md mt-24 p-6"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-100 font-semibold tracking-tight">Transaction Detail</h2>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-b border-zinc-800 my-4" />

            <div>
              <Row label="Reference">{tx.referenceId}</Row>
              <Row label="Transaction ID">{tx.id}</Row>
              <Row label="Timestamp">{new Date(tx.timestamp).toLocaleString()}</Row>
              <Row label="Corridor">
                <span className="inline-flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${CORRIDOR_DOT[tx.corridor_id]}`} />
                  {tx.corridor_id}
                </span>
              </Row>
              <Row label="Category">{tx.category}</Row>
              <Row label="Currency">{tx.currency}</Row>
              <Row label="Amount">
                {CURRENCY_SYMBOL[tx.currency]} {formatAmount(tx.amount)}
              </Row>
              <Row label="Status">
                <span
                  className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[tx.status]}`}
                >
                  {tx.status}
                </span>
              </Row>
              <Row label="Anomaly Flag">
                {tx.anomaly_flag ? (
                  <span className="text-red-400">Yes — Under Review</span>
                ) : (
                  <span className="text-zinc-500">No</span>
                )}
              </Row>
              <Row label="Processing Time">{processingMs}ms</Row>
              <Row label="Fee Estimate">
                {CURRENCY_SYMBOL[tx.currency]} {formatAmount(tx.amount * 0.005)}
              </Row>
              <Row label="Net Amount">
                {CURRENCY_SYMBOL[tx.currency]} {formatAmount(tx.amount * 0.995)}
              </Row>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              {role === "admin" && (
                <>
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition">
                    Mark Resolved
                  </button>
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition">
                    Flag Anomaly
                  </button>
                </>
              )}
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition ml-auto"
              >
                {copied ? "Copied ✓" : "Copy ID"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
