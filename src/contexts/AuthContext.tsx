import React, { createContext, useContext, useState, useCallback } from "react";

type Role = "admin" | "entry" | null;

interface AuthContextType {
  role: Role;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: "admin" | "entry") => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CREDENTIALS = {
  admin: { username: "admin", password: "admin" },
  entry: { username: "entry", password: "entry" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    return (sessionStorage.getItem("role") as Role) || null;
  });

  const login = useCallback((username: string, password: string, targetRole: "admin" | "entry") => {
    const creds = CREDENTIALS[targetRole];
    if (username === creds.username && password === creds.password) {
      setRole(targetRole);
      sessionStorage.setItem("role", targetRole);
      return true;
    }
    return false;
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
