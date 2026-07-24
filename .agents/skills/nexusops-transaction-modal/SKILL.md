---
name: nexusops-transaction-modal
description: Use when creating, editing, or wiring up a click-through transaction detail modal in the NexusOps dashboard. Triggers on "transaction detail modal", "transaction modal", "click through modal", "admin actions modal", or "copy transaction ID".
---

# NexusOps Transaction Detail Modal

## When to use

Implementing a click-through detail modal for any transaction row in the NexusOps dashboard. The modal opens from a list or feed, shows transaction metadata, provides admin actions, and lets the user copy the transaction ID.

## Overview

A transaction detail modal is a centered overlay with these parts:

1. Backdrop with blur and fade animation.
2. Modal card with fixed max width, rounded corners, and dark zinc surface.
3. Header with title and close button.
4. Detail rows: Reference ID, Transaction ID, Timestamp, Corridor, Category, Currency, Amount, Status, Anomaly flag, Processing time, Fee, Net amount.
5. Action footer with admin-only buttons and a copy-ID button.
6. Escape key and backdrop-click close handlers.

## Design tokens

Follow the NexusOps dark industrial palette:

- **Backdrop:** `bg-slate-950/80 backdrop-blur-sm`
- **Modal surface:** `bg-zinc-900 border border-zinc-700/50`
- **Title:** `text-zinc-100 font-semibold tracking-tight`
- **Labels:** `text-xs text-zinc-500 uppercase tracking-wider`
- **Values:** `text-sm text-zinc-200 font-mono`
- **Divider:** `border-zinc-800` or `border-zinc-800/60`
- **Status settled:** `bg-emerald-400/10 text-emerald-400 border-emerald-400/30`
- **Status failed:** `bg-red-400/10 text-red-400 border-red-400/30`
- **Status pending:** `bg-amber-400/10 text-amber-400 border-amber-400/30`
- **Primary admin actions:** `bg-emerald-500/10 border-emerald-500/30 text-emerald-400` and `bg-red-500/10 border-red-500/30 text-red-400`
- **Copy button:** `bg-zinc-800 text-zinc-300 hover:bg-zinc-700`

## Component file

Create `src/components/TransactionDetailModal.tsx` with this structure:

```tsx
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { useAuth } from "@/context/AuthContext";
import { formatAmount } from "@/lib/format";

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
              <Row label="Corridor">{tx.corridor_id}</Row>
              <Row label="Category">{tx.category}</Row>
              <Row label="Currency">{tx.currency}</Row>
              <Row label="Amount">{formatAmount(tx.amount)} {tx.currency}</Row>
              <Row label="Status">
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[tx.status]}`}>
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
              <Row label="Fee Estimate">{formatAmount(tx.amount * 0.005)}</Row>
              <Row label="Net Amount">{formatAmount(tx.amount * 0.995)}</Row>
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
```

## Wiring the modal

1. In the parent component that owns the transaction list, store the selected transaction:

```tsx
const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
```

2. Make each transaction row clickable and keyboard accessible:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={() => setSelectedTx(tx)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedTx(tx);
    }
  }}
  aria-label={`Transaction ${tx.referenceId}, ${tx.amount} ${tx.currency}, ${tx.status}`}
>
  {/* row content */}
</div>
```

3. Render the modal at the bottom of the parent component, passing `selectedTx` and a close handler:

```tsx
<TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
```

## Admin actions

- Admin-only buttons rely on `useAuth().role === "admin"`.
- `Mark Resolved` and `Flag Anomaly` are rendered only for admins.
- In a real backend, these actions would call an API mutation. For mock implementations, they may update local state or fire a toast.

## Copy ID button

- Clicking `Copy ID` writes `tx.id` to `navigator.clipboard`.
- Button label changes to `Copied ✓` for 1.5 seconds, then reverts.
- The button sits on the right side of the footer (`ml-auto`) and is visible to all roles.

## Processing time

Compute a deterministic pseudo-random processing time from the transaction ID so the value appears stable across re-renders:

```ts
let h = 0;
for (let i = 0; i < tx.id.length; i++) h = (h * 31 + tx.id.charCodeAt(i)) >>> 0;
const processingMs = 120 + (h % 2281);
```

## Validation

- The modal opens when a transaction row is clicked or activated via Enter/Space.
- Pressing Escape or clicking the backdrop closes the modal.
- Admin action buttons appear only for the `admin` role.
- The Copy ID button writes the transaction ID to the clipboard and shows a transient copied state.
- The modal renders without layout shift and respects the existing dark theme tokens.
