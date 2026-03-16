import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "entry" | null;

interface AuthContextType {
  role: Role;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: "admin" | "entry") => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    return (sessionStorage.getItem("role") as Role) || null;
  });

  const login = useCallback(async (username: string, password: string, targetRole: "admin" | "entry") => {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("username", username)
      .eq("password", password)
      .eq("role", targetRole)
      .maybeSingle();

    if (error || !data) return false;

    setRole(targetRole);
    sessionStorage.setItem("role", targetRole);
    return true;
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    sessionStorage.removeItem("role");
  }, []);

  return (
    <AuthContext.Provider value={{ role, isAuthenticated: !!role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
