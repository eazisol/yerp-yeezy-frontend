// Role Permissions management page

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, CheckCircle2, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleService, Role } from "@/services/roles";
import { menuService, Menu as MenuType } from "@/services/menus";
import { permissionService, Permission, PermissionRequest } from "@/services/permissions";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function RolePermissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const roleId = id ? parseInt(id) : 0;

  // Permission state for each menu
  const [permissions, setPermissions] = useState<
    Record<number, { read: boolean; modify: boolean; delete: boolean }>
  >({});

  // Fetch role
  const { data: role, isLoading: loadingRole } = useQuery({
    queryKey: ["role", roleId],
    queryFn: () => roleService.getRoleById(roleId),
    enabled: !!roleId,
  });

  // Fetch menus
  const { data: menus = [], isLoading: loadingMenus } = useQuery({
    queryKey: ["menus"],
    queryFn: () => menuService.getMenus(),
  });

  // Fetch existing permissions for this role
  const { data: existingPermissions = [], isLoading: loadingPermissions, refetch: refetchPermissions } = useQuery({
    queryKey: ["permissions", "role", roleId],
    queryFn: () => permissionService.getRolePermissions(roleId),
    enabled: !!roleId,
  });

  // Update permissions state when existingPermissions or menus data changes
  useEffect(() => {
    if (!loadingPermissions && !loadingMenus && menus.length > 0) {
      const perms: Record<number, { read: boolean; modify: boolean; delete: boolean }> = {};
      
      // First, initialize all menus with false permissions
      menus.forEach((menu) => {
        perms[menu.id] = {
          read: false,
          modify: false,
          delete: false,
        };
      });
      
      // Then, update with existing permissions if any
      if (existingPermissions && existingPermissions.length > 0) {
        existingPermissions.forEach((perm) => {
          if (perms[perm.menuId]) {
            perms[perm.menuId] = {
              read: perm.read,
              modify: perm.modify,
              delete: perm.delete,
            };
          }
        });
      }
      
      setPermissions(perms);
    }
  }, [existingPermissions, menus, loadingPermissions, loadingMenus]);

  // Save permissions mutation
  const saveMutation = useMutation({
    mutationFn: async (requests: PermissionRequest[]) => {
      const promises = requests.map((req) =>
        permissionService.createOrUpdatePermission(req)
      );
      await Promise.all(promises);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
      // Invalidate and refetch permissions
      await queryClient.invalidateQueries({ queryKey: ["permissions", "role", roleId] });
      await queryClient.invalidateQueries({ queryKey: ["permissions"] });
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      // Refetch permissions to update the UI
      await refetchPermissions();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Handle permission change
  const handlePermissionChange = (
    menuId: number,
    type: "read" | "modify" | "delete",
    checked: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [type]: checked,
      },
    }));
  };

  // Save all permissions
  const handleSave = () => {
    const requests: PermissionRequest[] = menus.map((menu) => ({
      menuId: menu.id,
      roleId: roleId,
      read: permissions[menu.id]?.read || false,
      modify: permissions[menu.id]?.modify || false,
      delete: permissions[menu.id]?.delete || false,
    }));

    saveMutation.mutate(requests);
  };

  const isLoading = loadingRole || loadingMenus || loadingPermissions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/roles")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Manage Permissions
            </h1>
            <p className="text-muted-foreground mt-1">
              {role ? `Configure permissions for ${role.name}` : "Loading..."}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading || saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Permissions
        </Button>
      </div>

      {/* Role Info */}
      {role && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-xl font-bold">{role.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-semibold">{role.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {role.description || "No description"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {role.code}
                  </Badge>
                  <Badge variant={role.isActive ? "default" : "secondary"}>
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading permissions...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu</TableHead>
                  <TableHead className="text-center">Read</TableHead>
                  <TableHead className="text-center">Modify</TableHead>
                  <TableHead className="text-center">Delete</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No menus found
                    </TableCell>
                  </TableRow>
                ) : (
                  menus.map((menu) => {
                    const menuPerms = permissions[menu.id] || {
                      read: false,
                      modify: false,
                      delete: false,
                    };
                    const hasAnyPermission =
                      menuPerms.read || menuPerms.modify || menuPerms.delete;

                    return (
                      <TableRow key={menu.id} className="hover:bg-secondary/50">
                        <TableCell>
                          <div className="font-medium">{menu.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {menu.code}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={menuPerms.read}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                menu.id,
                                "read",
                                checked as boolean
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={menuPerms.modify}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                menu.id,
                                "modify",
                                checked as boolean
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={menuPerms.delete}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                menu.id,
                                "delete",
                                checked as boolean
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {hasAnyPermission ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

