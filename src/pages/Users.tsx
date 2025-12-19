import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus, Eye, Edit, Trash2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePermissions } from "@/hooks/usePermissions";
import { userService, User, CreateUserRequest, UpdateUserRequest } from "@/services/users";
import { roleService, Role } from "@/services/roles";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: "",
    password: "",
    fullName: "",
    roleIds: [], // Backend expects array, but we'll send single role
    isPOApprover: false,
  });
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isActiveStatus, setIsActiveStatus] = useState<boolean>(true);

  const { canRead, canModify, canDelete } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users with pagination
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", page, pageSize, searchTerm, isActiveFilter],
    queryFn: () => userService.getUsers(page, pageSize, searchTerm || undefined, isActiveFilter),
  });

  // Fetch roles for form
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => roleService.getRoles(),
  });
  // Ensure roles is always an array
  const roles = Array.isArray(rolesData) ? rolesData : [];

  const users = usersData?.data || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = usersData?.totalPages || 1;
  const hasNextPage = usersData?.hasNextPage || false;
  const hasPreviousPage = usersData?.hasPreviousPage || false;

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get role color
  const getRoleColor = (roleCode: string) => {
    const roleColors: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
      WAREHOUSE_INCHARGE: "bg-green-100 text-green-700 border-green-200",
      PROCUREMENT: "bg-blue-100 text-blue-700 border-blue-200",
      LOGISTICS: "bg-yellow-100 text-yellow-700 border-yellow-200",
      FINANCE: "bg-orange-100 text-orange-700 border-orange-200",
      EXECUTIVE: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return roleColors[roleCode] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // Get role label
  const getRoleLabel = (roleCode: string) => {
    const role = roles.find((r) => r.code === roleCode);
    return role?.name || roleCode;
  };

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => userService.createUser(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowUserForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowUserForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowDeleteDialog(false);
      setDeleteUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
      roleIds: [],
      isPOApprover: false,
    });
    setSelectedRoleId(null);
    setIsActiveStatus(true);
    setSelectedUser(null);
    setIsEditMode(false);
  };

  // Handle add user
  const handleAddUser = () => {
    resetForm();
    setIsEditMode(false);
    setShowUserForm(true);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsActiveStatus(user.isActive);
    const availableRoles = Array.isArray(roles) ? roles : [];
    // Get first role if user has roles
    const firstRole = user.roles && user.roles.length > 0
      ? availableRoles.find((r) => user.roles?.includes(r.code))
      : null;
    const roleId = firstRole?.id || null;
    setSelectedRoleId(roleId);
    setFormData({
      email: user.email,
      password: "", // Don't pre-fill password
      fullName: user.fullName || "",
      roleIds: roleId !== null ? [roleId] : [],
      isPOApprover: user.isPOApprover || false,
    });
    setIsEditMode(true);
    setShowUserForm(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId: number) => {
    setDeleteUserId(userId);
    setShowDeleteDialog(true);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && selectedUser) {
      const updateData: UpdateUserRequest = {
        email: formData.email !== selectedUser.email ? formData.email : undefined,
        password: formData.password || undefined,
        fullName: formData.fullName || undefined,
        isActive: isActiveStatus !== selectedUser.isActive ? isActiveStatus : undefined,
        roleIds: formData.roleIds,
        isPOApprover: formData.isPOApprover !== selectedUser.isPOApprover ? formData.isPOApprover : undefined,
      };
      // Remove undefined fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof UpdateUserRequest] === undefined) {
          delete updateData[key as keyof UpdateUserRequest];
        }
      });
      updateMutation.mutate({ id: selectedUser.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle single role selection from dropdown
  const handleRoleChange = (roleId: string) => {
    const id = roleId === "none" ? null : parseInt(roleId);
    setSelectedRoleId(id);
    setFormData((prev) => ({
      ...prev,
      roleIds: id !== null ? [id] : [],
    }));
  };

  // Calculate stats
  const activeUsersCount = users.filter((u) => u.isActive).length;
  const inactiveUsersCount = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          {canModify("USER_MANAGEMENT") && (
            <>
              <Button variant="outline" asChild>
                <Link to="/roles">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Roles
                </Link>
              </Button>
              <Button onClick={handleAddUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactive Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveUsersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(roles) ? roles.length : 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
              />
            </div>
            <Select
              value={isActiveFilter === undefined ? "all" : isActiveFilter ? "active" : "inactive"}
              onValueChange={(value) => {
                setIsActiveFilter(
                  value === "all" ? undefined : value === "active"
                );
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User List ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-secondary/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                              {(user.fullName || user.email)
                          .split(" ")
                          .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                      </div>
                            <span className="font-medium">
                              {user.fullName || user.email}
                            </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((roleCode) => (
                                <Badge
                                  key={roleCode}
                                  variant="outline"
                                  className={getRoleColor(roleCode)}
                                >
                                  {getRoleLabel(roleCode)}
                    </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdDate)}
                  </TableCell>
                  <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                            className={
                              user.isActive
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canModify("USER_MANAGEMENT") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                          <Edit className="h-4 w-4" />
                        </Button>
                                {canDelete("USER_MANAGEMENT") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </>
                      )}
                       {/* {canRead("USER_MANAGEMENT") && (
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )} */}
                    </div>
                  </TableCell>
                </TableRow>
                    ))
                  )}
            </TableBody>
          </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center gap-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            !hasPreviousPage
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((pageNum) => {
                          // Show first, last, current, and adjacent pages
                          return (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            Math.abs(pageNum - page) <= 1
                          );
                        })
                        .map((pageNum, idx, arr) => {
                          // Add ellipsis if there's a gap
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && pageNum - prevPage > 1;
                          return (
                            <div key={pageNum} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => setPage(pageNum)}
                                  isActive={page === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            </div>
                          );
                        })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className={
                            !hasNextPage
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-center text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} users
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update user information and roles."
                : "Create a new user account. The user will be able to log in with the provided email and password."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Password {isEditMode ? "(leave empty to keep current)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isEditMode ? "Enter new password" : "Enter password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!isEditMode}
                  minLength={6}
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                {Array.isArray(roles) && roles.length > 0 ? (
                  <Select
                    value={selectedRoleId?.toString() || "none"}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">No roles available</p>
                )}
              </div>
              {isEditMode && selectedUser && (
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={isActiveStatus ? "active" : "inactive"}
                    onValueChange={(value) => {
                      setIsActiveStatus(value === "active");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPOApprover"
                  checked={formData.isPOApprover || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPOApprover: checked === true })
                  }
                />
                <Label
                  htmlFor="isPOApprover"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Can Approve Purchase Orders
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUserForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditMode
                  ? "Update User"
                  : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will soft delete the user and mark them as inactive.
              The user will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteUserId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteUserId) {
                  deleteMutation.mutate(deleteUserId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
