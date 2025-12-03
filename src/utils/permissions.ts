// Permission utility functions

import { Permission } from "@/services/permissions";

// Check if user has read permission for a menu
export function hasReadPermission(
  permissions: Permission[] | undefined,
  menuCode: string
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.some(
    (p) => p.menuCode === menuCode && p.read === true
  );
}

// Check if user has modify permission for a menu
export function hasModifyPermission(
  permissions: Permission[] | undefined,
  menuCode: string
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.some(
    (p) => p.menuCode === menuCode && p.modify === true
  );
}

// Check if user has delete permission for a menu
export function hasDeletePermission(
  permissions: Permission[] | undefined,
  menuCode: string
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.some(
    (p) => p.menuCode === menuCode && p.delete === true
  );
}

// Check if user has any permission for a menu
export function hasAnyPermission(
  permissions: Permission[] | undefined,
  menuCode: string
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.some(
    (p) =>
      p.menuCode === menuCode &&
      (p.read === true || p.modify === true || p.delete === true)
  );
}

// Check if user has admin role
export function isAdmin(roles: string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.includes("ADMIN");
}

