import { ReactNode } from "react";
import { NavBar } from "./NavBar";
import { SidebarNav } from "./SidebarNav";
import { RoleToast } from "./RoleToast";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-zinc-100 relative">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-40" />
      <NavBar />
      <div className="relative z-10 max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <aside className="hidden lg:block">
          <SidebarNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
      <RoleToast />
    </div>
  );
}
