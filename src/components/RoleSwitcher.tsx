import { useAuth, Role } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Shield, BarChart2, Eye } from "lucide-react";

const ROLES: {
  role: Role;
  label: string;
  icon: React.ReactNode;
  color: string;
  shortcut: string;
}[] = [
  { role: "admin", label: "Admin", icon: <Shield className="w-3 h-3" />, color: "text-red-400", shortcut: "⌃1" },
  { role: "analyst", label: "Analyst", icon: <BarChart2 className="w-3 h-3" />, color: "text-sky-400", shortcut: "⌃2" },
  { role: "viewer", label: "Viewer", icon: <Eye className="w-3 h-3" />, color: "text-zinc-400", shortcut: "⌃3" },
];

export function RoleSwitcher() {
  const { role, setRole, isTransitioning } = useAuth();

  return (
    <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-700/50 rounded-full p-1 ring-1 ring-zinc-700/30">
      {ROLES.map(({ role: r, label, icon, color, shortcut }) => {
        const isActive = role === r;
        return (
          <motion.button
            key={r}
            onClick={() => setRole(r)}
            disabled={isTransitioning}
            title={`Switch to ${label} (${shortcut})`}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive ? "text-slate-950" : `${color} hover:text-zinc-100`
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.span
                layoutId="role-pill-active"
                className="absolute inset-0 rounded-full bg-amber-400"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {icon}
              {label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
