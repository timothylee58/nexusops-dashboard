import { Role, useAuth } from "@/context/AuthContext";

const ROLES: Role[] = ["admin", "analyst", "viewer"];

export function RoleSwitcher() {
  const { role, setRole, user } = useAuth();
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-1 bg-zinc-900/60 border border-zinc-700/50 rounded-full p-1">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`text-xs font-medium px-3 py-1 rounded-full transition ${
              role === r
                ? "bg-amber-400 text-slate-950"
                : "bg-transparent text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-xs font-mono font-bold">
          {initials}
        </div>
        <div className="hidden md:block leading-tight">
          <div className="text-xs text-zinc-200">{user.name}</div>
          <div className="text-[10px] text-zinc-500 font-mono">{user.email}</div>
        </div>
      </div>
    </div>
  );
}
