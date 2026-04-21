import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  role: "admin" | "analyst" | "viewer";
  path: string;
  outcome: "ALLOWED" | "DENIED";
  ip: string;
}

// Mock API: simulates `/api/audit-logs` route
async function fetchAuditLogs(): Promise<AuditLog[]> {
  const roles: AuditLog["role"][] = ["admin", "analyst", "viewer"];
  const paths = ["/admin", "/analyst", "/audit", "/dashboard", "/settings"];
  const now = Date.now();
  return Array.from({ length: 20 }, (_, i) => {
    const role = roles[Math.floor(Math.random() * 3)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    let outcome: AuditLog["outcome"] = "ALLOWED";
    if ((path === "/admin" || path === "/audit") && role !== "admin") outcome = "DENIED";
    if (path === "/analyst" && role === "viewer") outcome = "DENIED";
    return {
      id: `log_${i.toString().padStart(4, "0")}`,
      timestamp: new Date(now - i * 60_000 * (Math.random() * 5 + 1)).toISOString(),
      role,
      path,
      outcome,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    };
  });
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs().then((d) => {
      setLogs(d);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(() => {
    return [...logs].sort((a, b) => {
      const da = new Date(a.timestamp).getTime();
      const db = new Date(b.timestamp).getTime();
      return sortDesc ? db - da : da - db;
    });
  }, [logs, sortDesc]);

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 shadow-xl">
      <div className="p-5 border-b border-zinc-700/50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Audit Log</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Access control events · admin only</p>
        </div>
        <div className="text-xs text-zinc-500 font-mono">Showing {sorted.length} entries</div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-950/40">
              <th className="text-left px-4 py-2.5">
                <button
                  onClick={() => setSortDesc((s) => !s)}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition"
                >
                  Timestamp <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-zinc-500">Role</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-zinc-500">Path</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-zinc-500">Outcome</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-zinc-500">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                  Loading audit entries…
                </td>
              </tr>
            ) : (
              sorted.map((log, i) => (
                <tr
                  key={log.id}
                  className={`border-b border-zinc-800/60 ${i % 2 ? "bg-zinc-800/30" : ""}`}
                >
                  <td className="px-4 py-2.5 text-zinc-200 font-mono text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-300 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 font-mono">
                      {log.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-300 font-mono text-xs">{log.path}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        log.outcome === "ALLOWED"
                          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
                          : "bg-red-400/10 text-red-400 border-red-400/30"
                      }`}
                    >
                      {log.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-200 font-mono text-xs">{log.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
