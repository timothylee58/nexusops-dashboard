import { Lock } from "lucide-react";
import { ReactNode } from "react";
import { Role, useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

interface Props {
  allowedRoles: Role[];
  children: ReactNode;
}

export function Protected({ allowedRoles, children }: Props) {
  const { role } = useAuth();
  if (allowedRoles.includes(role)) return <>{children}</>;

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 ring-1 ring-zinc-700/30 shadow-xl p-10 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
        <Lock className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Access Denied</h3>
        <p className="text-sm text-zinc-400 mt-1">
          You need <span className="text-amber-400 font-mono">{allowedRoles.join(" / ")}</span> access.
        </p>
        <p className="text-xs text-zinc-500 mt-2 font-mono">
          Current role: <span className="text-zinc-300">{role}</span>
        </p>
      </div>
      <Link
        to="/"
        className="text-xs px-4 py-2 rounded-full bg-amber-400 text-slate-950 font-medium hover:bg-amber-300 transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
