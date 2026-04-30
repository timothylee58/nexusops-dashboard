import { Suspense, lazy, useEffect, useState } from "react";
import { FileText, Send } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardFeed } from "@/components/DashboardFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { Protected } from "@/components/Protected";
import { KPIStrip } from "@/components/KPIStrip";
import { RoleActivityLog } from "@/components/RoleActivityLog";
import { CorridorHealthWidget } from "@/components/CorridorHealthWidget";
import { ReportModal } from "@/components/ReportModal";
import { BalanceCards } from "@/components/BalanceCards";
import { OperationalHealthStrip } from "@/components/OperationalHealthStrip";
import { WebhookLogPanel } from "@/components/WebhookLogPanel";
import { SendPaymentDialog } from "@/components/SendPaymentDialog";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button.tsx";

const FxRatesChart = lazy(async () => {
  const m = await import("@/components/FxRatesChart");
  return { default: m.FxRatesChart };
});
const CorridorKPIChart = lazy(async () => {
  const m = await import("@/components/CorridorKPIChart");
  return { default: m.CorridorKPIChart };
});
const SettlementLatencyPanel = lazy(async () => {
  const m = await import("@/components/SettlementLatencyPanel");
  return { default: m.SettlementLatencyPanel };
});

function ChartFallback() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-xs font-mono text-muted-foreground animate-pulse">
      Loading visualization…
    </div>
  );
}

const Index = () => {
  const { user, role, hasAccess } = useAuth();
  const firstName = user.name.split(" ")[0];
  const [reportOpen, setReportOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  useEffect(() => {
    const onOpenSend = () => setSendOpen(true);
    window.addEventListener("nexus-open-send", onOpenSend);
    return () => window.removeEventListener("nexus-open-send", onOpenSend);
  }, []);

  return (
    <DashboardLayout>
      <h1 className="sr-only">NexusOps Payment Corridor Operations Dashboard</h1>

      <div className="mb-4">
        <OperationalHealthStrip />
      </div>

      <div className="mb-4">
        <BalanceCards />
      </div>

      <div className="rounded-xl bg-card border border-border ring-1 ring-border/40 p-5 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Welcome back, <span className="text-primary">{firstName}</span>
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {user.department} · last login {user.lastLogin}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-mono">
            Corridor coverage
          </span>
          <span className="text-emerald-500 font-mono font-bold">5/5 active</span>
          {hasAccess(["admin", "analyst", "viewer"]) && (
            <Button
              variant="default"
              size="sm"
              className="ml-2 gap-2 font-mono text-xs"
              type="button"
              onClick={() => setSendOpen(true)}
            >
              <Send className="w-4 h-4 shrink-0" aria-hidden />
              Send payment
            </Button>
          )}
          {hasAccess(["admin", "analyst"]) && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2 gap-2 font-mono text-xs bg-sky-500/10 border-sky-500/35 text-sky-400 hover:bg-sky-500/20"
              type="button"
              onClick={() => setReportOpen(true)}
            >
              <FileText className="w-4 h-4 shrink-0" aria-hidden />
              Generate Report
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <KPIStrip />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <DashboardFeed />
          <Protected allowedRoles={["admin", "analyst"]}>
            <Suspense fallback={<ChartFallback />}>
              <FxRatesChart />
            </Suspense>
          </Protected>
          <Protected allowedRoles={["admin", "analyst"]}>
            <Suspense fallback={<ChartFallback />}>
              <CorridorKPIChart />
            </Suspense>
          </Protected>
          <Protected allowedRoles={["admin", "analyst"]}>
            <Suspense fallback={<ChartFallback />}>
              <SettlementLatencyPanel />
            </Suspense>
          </Protected>
        </div>
        <div className="md:col-span-2 lg:col-span-1 flex flex-col gap-4">
          <Protected allowedRoles={["admin", "analyst"]}>
            <CorridorHealthWidget />
          </Protected>
          <Protected allowedRoles={["admin", "analyst"]}>
            <WebhookLogPanel />
          </Protected>
          <AlertsPanel />
          <Protected allowedRoles={["admin"]}>
            <div className="rounded-xl bg-card border border-border ring-1 ring-border/40 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Audit Summary</h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                  24h
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Allowed", value: "1,204", color: "text-emerald-400" },
                  { label: "Denied", value: "47", color: "text-red-400" },
                  { label: "Denial Rate", value: "3.76%", color: "text-amber-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-md bg-muted/40 border border-border p-3 flex flex-col items-center">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                      {label}
                    </span>
                    <span className={`text-base font-mono font-bold mt-1 ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Protected>
          <Protected allowedRoles={["admin"]}>
            <RoleActivityLog />
          </Protected>
        </div>
      </div>

      <p className="sr-only">Current role: {role}</p>
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
      <SendPaymentDialog open={sendOpen} onClose={() => setSendOpen(false)} />
    </DashboardLayout>
  );
};

export default Index;
