import { useAuth, Role } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, ShieldAlert, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface ProtectedProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function Protected({ allowedRoles, children, fallback }: ProtectedProps) {
  const { role, user, hasAccess, isTransitioning } = useAuth();
  const allowed = hasAccess(allowedRoles);

  return (
    <AnimatePresence mode="wait">
      {isTransitioning ? (
        <motion.div
          key="transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 p-10 flex flex-col items-center justify-center gap-3 min-h-[200px]"
        >
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Verifying access…
          </span>
        </motion.div>
      ) : allowed ? (
        <motion.div
          key={`allowed-${role}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="denied"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {fallback ?? (
            <div className="rounded-xl bg-zinc-900 border border-red-500/20 ring-1 ring-zinc-700/30 shadow-xl p-8 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  Access Restricted
                </h3>
                <p className="text-sm text-zinc-400 mt-2">
                  This section requires{" "}
                  <span className="text-amber-400 font-mono">
                    [{allowedRoles.join(" | ")}]
                  </span>{" "}
                  role
                </p>
                <p className="text-xs text-zinc-500 mt-2 font-mono">
                  Current: <span className="text-zinc-300">{role}</span> ·{" "}
                  <span className="text-zinc-300">{user.name}</span>
                </p>
              </div>
              <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
                Switch roles using the selector in the nav bar
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
