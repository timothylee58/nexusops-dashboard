import { useAuth, Role } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Shield, BarChart2, Eye } from "lucide-react";

const ROLE_META: Record<Role, { icon: React.ReactNode; color: string; label: string }> = {
  admin: { icon: <Shield className="w-4 h-4" />, color: "text-red-400 border-red-500/40 bg-red-500/10", label: "Admin" },
  analyst: { icon: <BarChart2 className="w-4 h-4" />, color: "text-sky-400 border-sky-500/40 bg-sky-500/10", label: "Analyst" },
  viewer: { icon: <Eye className="w-4 h-4" />, color: "text-zinc-300 border-zinc-600/40 bg-zinc-700/30", label: "Viewer" },
};

export function RoleToast() {
  const { role } = useAuth();
  const [visible, setVisible] = useState(false);
  const [shownRole, setShownRole] = useState<Role>(role);
  const [isFirst, setIsFirst] = useState(true);

  useEffect(() => {
    if (isFirst) {
      setIsFirst(false);
      setShownRole(role);
      return;
    }
    setShownRole(role);
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 2500);
    return () => window.clearTimeout(t);
  }, [role]);

  const meta = ROLE_META[shownRole];

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur shadow-2xl bg-zinc-900/95 ${meta.color}`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950/40">
              {meta.icon}
            </div>
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                Role switched
              </div>
              <div className="text-sm font-medium">{meta.label}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
