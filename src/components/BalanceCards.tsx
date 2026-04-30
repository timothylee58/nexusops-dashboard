import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";

import { fetchBalances } from "@/lib/api.ts";
import { useTransactionsContext } from "@/context/TransactionsContext";
import { cn } from "@/lib/utils";
import type { Currency } from "@/types/transaction.ts";

const OFFLINE_PREVIEW: Partial<Record<Currency, number>> = {
  MYR: 128_421.52,
  SGD: 241_893.09,
  USD: 512_090.41,
};

function AnimatedAmount({ value }: { value: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.4, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="tabular-nums"
    >
      {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </motion.span>
  );
}

export function BalanceCards() {
  const { mode } = useTransactionsContext();
  const { data } = useQuery({
    queryKey: ["ledger", "balances"],
    queryFn: ({ signal }) => fetchBalances(signal),
    staleTime: 25_000,
    enabled: mode === "api",
  });

  const rows: Partial<Record<Currency, number>> =
    mode === "api"
      ? (data?.balances as Partial<Record<Currency, number>>) ?? OFFLINE_PREVIEW
      : OFFLINE_PREVIEW;

  const display: Currency[] = ["MYR", "SGD", "USD", "HKD", "JPY"];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {display.map((ccy) => {
        const amt = rows[ccy] ?? (ccy === "HKD" ? 88_212.4 : ccy === "JPY" ? 12_840_210.77 : 0);
        return (
          <article
            key={ccy}
            className={cn(
              "rounded-xl border border-border bg-card/80 backdrop-blur p-4 shadow-sm ring-1 ring-border/40",
              ccy === "USD" ? "border-primary/35 ring-primary/25" : ""
            )}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Settlement balance
            </span>
            <div className="mt-2 text-lg font-mono font-bold text-foreground">
              <AnimatedAmount value={amt} />{" "}
              <span className="text-sm text-primary">{ccy}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
