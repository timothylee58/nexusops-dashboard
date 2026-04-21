import { createContext, useContext, ReactNode } from "react";
import { useTransactions } from "@/hooks/useTransactions";

type Ctx = ReturnType<typeof useTransactions>;
const TransactionsContext = createContext<Ctx | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const value = useTransactions();
  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactionsContext() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactionsContext must be used within TransactionsProvider");
  return ctx;
}
