import { useAuth } from "@/context/AuthContext";
import { Clock, History } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { relativeTime } from "@/lib/format";

export function RoleActivityLog() {
  const { roleHistory } = useAuth();
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Role Activity</h3>
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {roleHistory.length}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2 overflow-hidden"
          >
            {roleHistory.length === 0 && (
              <li className="text-xs text-zinc-500 font-mono py-3 text-center">
                No role switches yet
              </li>
            )}
            {roleHistory.slice(0, 5).map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-md bg-zinc-950/40 border border-zinc-800"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span className="text-zinc-300 truncate">{h.user}</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30 shrink-0">
                    {h.role}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                  {relativeTime(h.timestamp)}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
