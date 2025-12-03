// Custom hook for checking user permissions

import { useAuth } from "@/contexts/AuthContext";
import {
  hasReadPermission,
  hasModifyPermission,
  hasDeletePermission,
  hasAnyPermission,
  isAdmin,
} from "@/utils/permissions";

export function usePermissions() {
  const { user } = useAuth();

  const permissions = user?.permissions || [];
  const roles = user?.roles || [];

  // Check permissions for a specific menu
  const canRead = (menuCode: string) => {
    if (isAdmin(roles)) return true;
    return hasReadPermission(permissions, menuCode);
  };

  const canModify = (menuCode: string) => {
    if (isAdmin(roles)) return true;
    return hasModifyPermission(permissions, menuCode);
  };

  const canDelete = (menuCode: string) => {
    if (isAdmin(roles)) return true;
    return hasDeletePermission(permissions, menuCode);
  };

  const canAccess = (menuCode: string) => {
    if (isAdmin(roles)) return true;
    return hasAnyPermission(permissions, menuCode);
  };

  return {
    canRead,
    canModify,
    canDelete,
    canAccess,
    isAdmin: isAdmin(roles),
    permissions,
    roles,
  };
}

