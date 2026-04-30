import { useQuery } from "@tanstack/react-query";

import { fetchWebhookLog } from "@/lib/api.ts";
import { useTransactionsContext } from "@/context/TransactionsContext";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { format } from "date-fns";

export function WebhookLogPanel() {
  const { mode } = useTransactionsContext();
  const { data } = useQuery({
    queryKey: ["webhooks", "log"],
    queryFn: ({ signal }) => fetchWebhookLog(signal),
    refetchInterval: 3000,
    enabled: mode === "api",
  });

  const events = data?.events ?? [];

  if (mode !== "api") {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground font-mono">
        Webhook log requires mock API · run <code className="text-primary">npm run dev:all</code>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/40 overflow-hidden flex flex-col max-h-[340px]">
      <header className="px-4 py-3 border-b border-border flex justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">Gateway webhooks · mock rail</span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">live-ish</span>
      </header>
      <ScrollArea className="h-[280px]" role="region" aria-label="Webhook delivery log">
        <ul className="divide-y divide-border text-xs font-mono">
          {events.length === 0 ? (
            <li className="p-4 text-muted-foreground">Waiting for SSE activity…</li>
          ) : (
            events.map((ev) => (
              <li key={ev.id} className="px-4 py-2.5 space-y-0.5 hover:bg-accent/40">
                <div className="flex justify-between gap-2">
                  <span className="text-primary font-semibold truncate">{ev.type}</span>
                  <time className="text-muted-foreground shrink-0" dateTime={ev.at}>
                    {format(new Date(ev.at), "HH:mm:ss.SSS")}
                  </time>
                </div>
                <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
                  {JSON.stringify(ev.payload)}
                </pre>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
