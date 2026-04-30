import { useMemo, useRef, memo, useState, type KeyboardEvent } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence } from "framer-motion";
import { CalendarIcon, ArrowDownWideNarrow, ArrowUpNarrowWide, Download } from "lucide-react";
import { format } from "date-fns";

import type { Transaction, TxStatus } from "@/types/transaction";
import { useTransactionsContext } from "@/context/TransactionsContext";
import { relativeTime, formatAmount, compactNumber } from "@/lib/format";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";

const ROW_HEIGHT = 76;

const statusColorDot: Record<TxStatus, string> = {
  settled: "bg-emerald-400",
  failed: "bg-red-400",
  pending: "bg-amber-400",
};

const statusBadgeCls: Record<TxStatus, string> = {
  settled: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
  failed: "bg-red-400/10 text-red-400 border-red-400/30",
  pending: "bg-amber-400/10 text-amber-400 border-amber-400/30",
};

function StatChip({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex-1 min-w-0 bg-zinc-950/50 dark:bg-card/60 border border-zinc-700/50 rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-mono font-semibold mt-0.5 ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

const TxRow = memo(function TxRow({
  tx,
  style,
  onOpen,
}: {
  tx: Transaction;
  style: React.CSSProperties;
  onOpen: (t: Transaction) => void;
}) {
  const anomaly = tx.anomaly_flag;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(tx);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      style={style}
      onClick={() => onOpen(tx)}
      onKeyDown={onKeyDown}
      aria-label={`Transaction ${tx.referenceId}, ${tx.amount} ${tx.currency}, ${tx.status}`}
      className={`absolute left-0 right-0 top-0 grid grid-cols-[minmax(0,1.2fr)_0.85fr_0.65fr_minmax(0,0.9fr)_auto_minmax(0,0.8fr)] gap-3 items-center px-3 border-b border-zinc-800/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
        anomaly ? "bg-destructive/5" : ""
      }`}
    >
      <span className="font-mono text-xs text-muted-foreground truncate">{tx.referenceId}</span>
      <span className="font-mono text-[10px] text-muted-foreground truncate">{tx.corridor_id}</span>
      <Badge variant="outline" className="justify-center font-mono text-[10px] w-fit">
        {tx.currency}
      </Badge>
      <span className="font-mono font-semibold text-primary text-sm">{formatAmount(tx.amount)}</span>
      <div className="flex items-center gap-1 justify-end shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusColorDot[tx.status]}`} aria-hidden />
        <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${statusBadgeCls[tx.status]}`}>
          {tx.status}
        </span>
        {anomaly && (
          <span className="text-[10px] text-destructive font-bold ml-1" title="Flagged anomaly">
            !
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground font-mono text-right">{relativeTime(tx.timestamp)}</span>
    </div>
  );
});

function downloadCsv(rows: Transaction[], filename: string) {
  const header = ["referenceId", "id", "corridor", "currency", "amount", "status", "timestamp", "category"];
  const lines = [
    header.join(","),
    ...rows.map((t) =>
      [
        `"${t.referenceId}"`,
        t.id,
        t.corridor_id,
        t.currency,
        String(t.amount),
        t.status,
        t.timestamp,
        `"${t.category}"`,
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardFeed() {
  const {
    pageRows,
    isConnected,
    stats,
    filters,
    setFilter,
    pagination,
    isFeedLoading,
    liveTxId,
  } = useTransactionsContext();
  const [selected, setSelected] = useState<Transaction | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const liveMsg = useMemo(() => {
    if (!liveTxId || pageRows.every((t) => t.id !== liveTxId)) return "";
    const hit = pageRows.find((t) => t.id === liveTxId);
    return hit ? `New transaction ${hit.referenceId} added.` : "";
  }, [liveTxId, pageRows]);

  const virtualizer = useVirtualizer({
    count: pageRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    getItemKey: (index) => pageRows[index]?.id ?? index,
  });

  function toggleSort(column: "timestamp" | "amount") {
    if (filters.sortField === column) {
      setFilter("sortDir", filters.sortDir === "asc" ? "desc" : "asc");
    } else {
      setFilter("sortField", column);
      setFilter("sortDir", "desc");
    }
  }

  return (
    <div className="rounded-xl bg-card border border-border shadow-xl ring-1 ring-border/30">
      <div className="p-5 border-b border-border flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Transaction feed</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cross-border corridor stream · Paginated · Virtualized
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="font-mono text-xs"
              onClick={() =>
                downloadCsv(pageRows, `nexus-export-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
              }
            >
              <Download className="w-4 h-4 mr-2" aria-hidden />
              CSV
            </Button>
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2" aria-hidden>
                {isConnected && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-400" : "bg-destructive"}`}
                />
              </span>
              <span className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
                {isConnected ? "Stream" : "Offline"}
              </span>
            </div>
            <div className="text-xs font-mono text-primary">{pagination.total} total</div>
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {liveMsg}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Input
            value={filters.q}
            onChange={(e) => setFilter("q", e.target.value)}
            placeholder="Search reference or id…"
            className="h-9 font-mono text-xs w-[200px]"
            aria-label="Search transactions by reference id"
          />
          <Select value={filters.currency} onValueChange={(v) => setFilter("currency", v)}>
            <SelectTrigger className="h-9 w-[120px]" aria-label="Filter by currency">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All FX</SelectItem>
              <SelectItem value="MYR">MYR</SelectItem>
              <SelectItem value="SGD">SGD</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="HKD">HKD</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger className="h-9 w-[132px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 font-mono text-[10px]">
                <CalendarIcon className="w-3.5 h-3.5" aria-hidden />
                {filters.from ? format(new Date(filters.from), "MMM d") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.from ? new Date(filters.from) : undefined}
                onSelect={(d) => setFilter("from", d ? format(d, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 font-mono text-[10px]">
                <CalendarIcon className="w-3.5 h-3.5" aria-hidden />
                {filters.to ? format(new Date(filters.to), "MMM d") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.to ? new Date(filters.to) : undefined}
                onSelect={(d) => setFilter("to", d ? format(d, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select value={String(pagination.limit)} onValueChange={(v) => pagination.setLimit(Number(v))}>
            <SelectTrigger className="h-9 w-[100px]" aria-label="Rows per page">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 / pg</SelectItem>
              <SelectItem value="100">100 / pg</SelectItem>
              <SelectItem value="250">250 / pg</SelectItem>
              <SelectItem value="500">500 / pg</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <StatChip label="Filtered" value={stats.total} />
          <StatChip label="Settled" value={stats.settledCount} accent="text-emerald-400" />
          <StatChip label="Pending" value={stats.pendingCount} accent="text-amber-400" />
          <StatChip label="Failed" value={stats.failedCount} accent="text-red-400" />
          <StatChip label="Anomalies" value={stats.anomalyCount} accent="text-destructive" />
          <StatChip label="Volume" value={compactNumber(stats.totalVolume)} />
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border bg-muted/30 grid grid-cols-[minmax(0,1.2fr)_0.85fr_0.65fr_minmax(0,0.9fr)_auto_minmax(0,0.8fr)] gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <div className="pl-3">Reference</div>
        <span>Corridor</span>
        <span>Currency</span>
        <button
          type="button"
          className="flex items-center gap-1 text-left underline-offset-2 hover:underline"
          onClick={() => toggleSort("amount")}
        >
          Amount
          {filters.sortField === "amount" ? (
            filters.sortDir === "asc" ? (
              <ArrowUpNarrowWide className="w-3 h-3" aria-hidden />
            ) : (
              <ArrowDownWideNarrow className="w-3 h-3" aria-hidden />
            )
          ) : null}
        </button>
        <div className="text-right">Status</div>
        <button
          type="button"
          className="text-right underline-offset-2 hover:underline flex justify-end gap-1"
          onClick={() => toggleSort("timestamp")}
        >
          Time
          {filters.sortField === "timestamp" ? (
            filters.sortDir === "asc" ? (
              <ArrowUpNarrowWide className="w-3 h-3 shrink-0" aria-hidden />
            ) : (
              <ArrowDownWideNarrow className="w-3 h-3 shrink-0" aria-hidden />
            )
          ) : null}
        </button>
      </div>

      <div
        ref={parentRef}
        className="h-[560px] overflow-auto scrollbar-thin"
        role="region"
        aria-label="Transactions list"
      >
        {isFeedLoading && pageRows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm font-mono">Loading corridor data…</div>
        ) : pageRows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm font-mono">No matching transactions.</div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            <AnimatePresence initial={false}>
              {virtualizer.getVirtualItems().map((vi) => {
                const tx = pageRows[vi.index];
                if (!tx) return null;
                return (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    style={{
                      height: ROW_HEIGHT,
                      transform: `translateY(${vi.start}px)`,
                      position: "absolute",
                    }}
                    onOpen={setSelected}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border text-xs font-mono text-muted-foreground">
        <span>
          Page {pagination.page} / {pagination.pages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => pagination.setPage(pagination.page - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={pagination.page >= pagination.pages}
            onClick={() => pagination.setPage(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <TransactionDetailModal tx={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
