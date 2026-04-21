import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { RoleSwitcher } from "./RoleSwitcher";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/", label: "Operations" },
  { to: "/audit", label: "Audit" },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-zinc-100 relative">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-40" />

      <header className="relative z-10 border-b border-zinc-800/80 bg-slate-950/80 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-amber-400 flex items-center justify-center text-slate-950 font-mono font-bold text-sm">
                N
              </div>
              <span className="font-mono font-bold text-amber-400 tracking-tight">NexusOps</span>
              <span className="hidden sm:inline text-[10px] text-zinc-500 font-mono uppercase tracking-wider border-l border-zinc-700 pl-3 ml-1">
                Corridor Operations
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => {
                const active = location.pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`text-xs px-3 py-1.5 rounded-md transition font-medium ${
                      active
                        ? "bg-zinc-800 text-amber-400"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
              role
            </span>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
              {role}
            </span>
            <RoleSwitcher />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1600px] mx-auto p-6">{children}</main>
    </div>
  );
}
