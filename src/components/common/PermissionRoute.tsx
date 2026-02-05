import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionRouteProps {
  menuCode: string;
  children: React.ReactNode;
}

// Permission-based route guard: redirects to dashboard if user has no access
export default function PermissionRoute({ menuCode, children }: PermissionRouteProps) {
  const { canAccess } = usePermissions();

  if (!canAccess(menuCode)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

