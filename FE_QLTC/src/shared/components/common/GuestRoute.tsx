import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROUTES } from "@/shared/constants/routes";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
