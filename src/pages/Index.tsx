import { useState } from "react";
import { FileText } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardFeed } from "@/components/DashboardFeed";
import { CorridorKPIChart } from "@/components/CorridorKPIChart";
import { AlertsPanel } from "@/components/AlertsPanel";
import { Protected } from "@/components/Protected";
import { KPIStrip } from "@/components/KPIStrip";
import { RoleActivityLog } from "@/components/RoleActivityLog";
import { CorridorHealthWidget } from "@/components/CorridorHealthWidget";
import { ReportModal } from "@/components/ReportModal";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user, role, hasAccess } = useAuth();
  const firstName = user.name.split(" ")[0];
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <DashboardLayout>
      <h1 className="sr-only">NexusOps Payment Corridor Operations Dashboard</h1>

      {/* Welcome strip */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 p-5 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            Welcome back, <span className="text-amber-400">{firstName}</span>
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {user.department} · last login {user.lastLogin}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-mono">
            Corridor coverage
          </span>
          <span className="text-emerald-400 font-mono font-bold">5/5 active</span>
          {hasAccess(["admin", "analyst"]) && (
            <button
              onClick={() => setReportOpen(true)}
              className="ml-2 inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition rounded-lg px-4 py-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="mb-4">
        <KPIStrip />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <DashboardFeed />
          {/* Chart visible to admin + analyst */}
          <Protected allowedRoles={["admin", "analyst"]}>
            <CorridorKPIChart />
          </Protected>
        </div>
        <div className="md:col-span-2 lg:col-span-1 flex flex-col gap-4">
          <Protected allowedRoles={["admin", "analyst"]}>
            <CorridorHealthWidget />
          </Protected>
          <AlertsPanel />
          {/* Audit summary admin only */}
          <Protected allowedRoles={["admin"]}>
            <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-100">Audit Summary</h3>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                  24h
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Allowed", value: "1,204", color: "text-emerald-400" },
                  { label: "Denied", value: "47", color: "text-red-400" },
                  { label: "Denial Rate", value: "3.76%", color: "text-amber-400" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-md bg-zinc-950/40 border border-zinc-800 p-3 flex flex-col items-center"
                  >
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">
                      {label}
                    </span>
                    <span className={`text-base font-mono font-bold mt-1 ${color}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Protected>
          {/* Role activity admin only */}
          <Protected allowedRoles={["admin"]}>
            <RoleActivityLog />
          </Protected>
        </div>
      </div>

      <p className="sr-only">Current role: {role}</p>
    </DashboardLayout>
  );
};

export default Index;
