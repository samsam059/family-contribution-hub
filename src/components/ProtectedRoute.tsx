import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "admin" | "entry";
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { role, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login/${allowedRole}`} state={{ from: location }} replace />;
  }

  // Strict role enforcement — entry users cannot access admin routes
  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
