import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

export type Role = "admin" | "analyst" | "viewer";

export interface User {
  name: string;
  email: string;
  avatarInitials: string;
  department: string;
  lastLogin: string;
}

const MOCK_USERS: Record<Role, User> = {
  admin: {
    name: "Alex Chen",
    email: "alex@nexuspay.io",
    avatarInitials: "AC",
    department: "Platform Engineering",
    lastLogin: "2 minutes ago",
  },
  analyst: {
    name: "Priya Nair",
    email: "priya@nexuspay.io",
    avatarInitials: "PN",
    department: "Risk & Compliance",
    lastLogin: "14 minutes ago",
  },
  viewer: {
    name: "Sam Wong",
    email: "sam@nexuspay.io",
    avatarInitials: "SW",
    department: "Operations",
    lastLogin: "1 hour ago",
  },
};

export interface RoleHistoryEntry {
  role: Role;
  user: string;
  timestamp: string;
}

interface AuthContextValue {
  role: Role;
  user: User;
  setRole: (role: Role) => void;
  hasAccess: (allowedRoles: Role[]) => boolean;
  isTransitioning: boolean;
  roleHistory: RoleHistoryEntry[];
}

const AuthContext = createContext<AuthContextValue | null>(null);
const COOKIE = "nexusops_role";

function readCookie(): Role | null {
  const m = document.cookie.match(/(?:^|;\s*)nexusops_role=([^;]+)/);
  if (!m) return null;
  const v = m[1] as Role;
  return v === "admin" || v === "analyst" || v === "viewer" ? v : null;
}

function writeCookie(role: Role) {
  document.cookie = `${COOKIE}=${role}; path=/; max-age=86400; samesite=lax`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => readCookie() ?? "admin");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [roleHistory, setRoleHistory] = useState<RoleHistoryEntry[]>([]);
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    writeCookie(role);
  }, [role]);

  const setRole = useCallback((newRole: Role) => {
    setIsTransitioning(true);
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      setRoleState((prev) => {
        if (prev !== newRole) {
          setRoleHistory((h) =>
            [
              {
                role: newRole,
                user: MOCK_USERS[newRole].name,
                timestamp: new Date().toISOString(),
              },
              ...h,
            ].slice(0, 10),
          );
        }
        return newRole;
      });
      writeCookie(newRole);
      setIsTransitioning(false);
    }, 300);
  }, []);

  const hasAccess = useCallback(
    (allowedRoles: Role[]) => allowedRoles.includes(role),
    [role],
  );

  // Keyboard shortcuts: Ctrl+1/2/3
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "1") {
        e.preventDefault();
        setRole("admin");
      } else if (e.key === "2") {
        e.preventDefault();
        setRole("analyst");
      } else if (e.key === "3") {
        e.preventDefault();
        setRole("viewer");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setRole]);

  return (
    <AuthContext.Provider
      value={{
        role,
        user: MOCK_USERS[role],
        setRole,
        hasAccess,
        isTransitioning,
        roleHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
