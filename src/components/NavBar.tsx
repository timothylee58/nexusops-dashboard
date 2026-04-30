import { useAuth, Role } from "@/context/AuthContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Settings, ChevronDown, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

const ROLE_BADGE_STYLES: Record<Role, string> = {
  admin: "bg-red-500/15 text-red-400 border-red-500/30",
  analyst: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  viewer: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
};

export function NavBar() {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="relative z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-400 flex items-center justify-center text-slate-950 font-mono font-bold">
            N
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-mono font-bold text-amber-400 tracking-tight">
              NexusOps
            </span>
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
              v1.0.0 · Corridor Ops
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-3 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">
              LIVE
            </span>
          </div>
        </div>

        {/* Center role switcher */}
        <div className="order-3 lg:order-2 w-full lg:w-auto flex justify-center">
          <RoleSwitcher />
        </div>

        {/* Right user info */}
        <div className="order-2 lg:order-3 flex items-center gap-2 flex-wrap justify-end">
          {mounted && (
            <button
              type="button"
              aria-label={`Switch theme (current ${theme ?? resolvedTheme ?? "system"})`}
              onClick={toggleTheme}
              className="w-9 h-9 rounded-md border border-border bg-card hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            >
              {resolvedTheme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          )}
          <span className="hidden md:inline-block text-[10px] font-mono text-muted-foreground px-2 py-1 rounded-md border border-border bg-card/70">
            ⌘ K
          </span>
          <button
            type="button"
            className="hidden sm:flex w-9 h-9 rounded-md hover:bg-accent border border-transparent items-center justify-center text-muted-foreground hover:text-foreground transition relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" aria-hidden />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden />
          </button>
          <button
            type="button"
            className="hidden sm:flex w-9 h-9 rounded-md hover:bg-accent border border-transparent items-center justify-center text-muted-foreground hover:text-foreground transition"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" aria-hidden />
          </button>
          <div className="hidden sm:block w-px h-6 bg-border" />
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={user.email}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-xs font-mono font-bold"
                >
                  {user.avatarInitials}
                </motion.div>
              </AnimatePresence>
              <div className="hidden md:flex flex-col items-start leading-tight">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={user.name}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                    className="text-xs text-zinc-100"
                  >
                    {user.name}
                  </motion.span>
                </AnimatePresence>
                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${ROLE_BADGE_STYLES[role]}`}
                >
                  {role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 hidden md:block" />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 rounded-xl bg-zinc-900 border border-zinc-700/60 ring-1 ring-zinc-700/30 shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-zinc-800">
                    <div className="text-sm font-medium text-zinc-100">{user.name}</div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">{user.email}</div>
                    <div className="text-[10px] text-zinc-500 mt-1.5 uppercase tracking-wider">
                      {user.department}
                    </div>
                  </div>
                  <div className="p-4 space-y-2 border-b border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 uppercase tracking-wider text-[10px]">
                        Last login
                      </span>
                      <span className="text-zinc-300 font-mono">{user.lastLogin}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 uppercase tracking-wider text-[10px]">
                        Access level
                      </span>
                      <span
                        className={`font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded border ${ROLE_BADGE_STYLES[role]}`}
                      >
                        {role}
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full text-left text-xs text-zinc-300 hover:bg-zinc-800 rounded-md px-3 py-2 transition">
                      View Profile
                    </button>
                    <button className="w-full text-left text-xs text-red-400 hover:bg-red-500/10 rounded-md px-3 py-2 transition">
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
