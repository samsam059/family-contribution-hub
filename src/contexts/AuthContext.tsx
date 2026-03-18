import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "entry" | null;

interface AuthContextType {
  role: Role;
  userId: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: "admin" | "entry") => Promise<boolean>;
  logout: () => void;
}

const SESSION_KEY = "fl_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface StoredSession {
  role: "admin" | "entry";
  userId: string;
  expiresAt: number;
}

function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(role: "admin" | "entry", userId: string) {
  const session: StoredSession = {
    role,
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(loadSession);

  // Periodically check session expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const current = loadSession();
      if (!current && session) {
        setSession(null);
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [session]);

  const login = useCallback(async (username: string, password: string, targetRole: "admin" | "entry") => {
    const { data, error } = await supabase
      .from("users")
      .select("id, role")
      .eq("username", username)
      .eq("password", password)
      .eq("role", targetRole)
      .maybeSingle();

    if (error || !data) return false;

    // Verify role matches server-side data
    if (data.role !== targetRole) return false;

    saveSession(targetRole, data.id);
    setSession({ role: targetRole, userId: data.id, expiresAt: Date.now() + SESSION_TTL_MS });
    return true;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role: session?.role ?? null,
        userId: session?.userId ?? null,
        isAuthenticated: !!session,
        login,
        logout,
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
