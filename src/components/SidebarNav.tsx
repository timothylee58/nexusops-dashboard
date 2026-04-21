import { useAuth, Role } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Shield,
  BarChart2,
  FileText,
  AlertTriangle,
  Settings,
  Lock,
} from "lucide-react";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "analyst", "viewer"] },
  { href: "/analytics", label: "Analytics", icon: BarChart2, roles: ["admin", "analyst"] },
  { href: "/admin", label: "Admin Panel", icon: Shield, roles: ["admin"] },
  { href: "/audit", label: "Audit Logs", icon: FileText, roles: ["admin"] },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle, roles: ["admin", "analyst"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function SidebarNav() {
  const { hasAccess } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="flex flex-col gap-1 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 pb-2">
        Navigation
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon, roles }) => {
        const accessible = hasAccess(roles);
        const isActive = pathname === href;
        const content = (
          <div
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
              !accessible
                ? "text-zinc-600 cursor-not-allowed"
                : isActive
                ? "bg-zinc-800 text-amber-400"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
            }`}
            title={!accessible ? `Requires [${roles.join(" | ")}] access` : undefined}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="font-medium">{label}</span>
            {!accessible && <Lock className="w-3 h-3 ml-auto text-red-400/70" />}
            {isActive && accessible && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-amber-400"
              />
            )}
          </div>
        );
        return accessible ? (
          <Link key={href} to={href}>
            {content}
          </Link>
        ) : (
          <div key={href}>{content}</div>
        );
      })}
    </nav>
  );
}
