import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "admin" | "analyst" | "viewer";

export interface User {
  name: string;
  email: string;
}

const USERS: Record<Role, User> = {
  admin: { name: "Alex Chen", email: "alex@nexuspay.io" },
  analyst: { name: "Priya Nair", email: "priya@nexuspay.io" },
  viewer: { name: "Sam Wong", email: "sam@nexuspay.io" },
};

interface AuthCtx {
  role: Role;
  user: User;
  setRole: (r: Role) => void;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

const COOKIE = "nexusops_role";

function readCookie(): Role | null {
  const m = document.cookie.match(/(?:^|;\s*)nexusops_role=([^;]+)/);
  if (!m) return null;
  const v = m[1] as Role;
  return v === "admin" || v === "analyst" || v === "viewer" ? v : null;
}

function writeCookie(role: Role) {
  document.cookie = `${COOKIE}=${role}; path=/; max-age=2592000; samesite=lax`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => readCookie() ?? "admin");

  useEffect(() => {
    writeCookie(role);
  }, [role]);

  const setRole = (r: Role) => setRoleState(r);

  return (
    <AuthContext.Provider value={{ role, user: USERS[role], setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
