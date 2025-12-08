import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  ClipboardCheck,
  Warehouse,
  Users,
  UserCog,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { menuService, Menu as MenuType } from "@/services/menus";
import { hasAnyPermission, isAdmin } from "@/utils/permissions";
import { authService, ChangePasswordRequest } from "@/services/auth";
import { useMutation } from "@tanstack/react-query";

// Icon mapping for dynamic menu icons
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  ClipboardCheck,
  Warehouse,
  Users,
  UserCog,
  Shield,
  Settings,
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    newPassword: "",
    currentPassword: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setShowChangePasswordDialog(false);
      setPasswordData({ newPassword: "", currentPassword: "" });
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.currentPassword) {
      toast({
        title: "Error",
        description: "Current password is required",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  // Fetch menus from API
  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoadingMenus(true);
        const fetchedMenus = await menuService.getMenus();
        setMenus(fetchedMenus);
      } catch (error) {
        console.error("Failed to load menus:", error);
        // Set empty array on error instead of showing error toast
        setMenus([]);
        // Only show toast if user is logged in
        if (user) {
          toast({
            title: "Error",
            description: "Failed to load navigation menus",
            variant: "destructive",
          });
        }
      } finally {
        setLoadingMenus(false);
      }
    };

    if (user) {
      loadMenus();
    } else {
      // If no user, set loading to false and empty menus
      setLoadingMenus(false);
      setMenus([]);
    }
  }, [user, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen w-full bg-muted/30 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 lg:translate-x-0 lg:static lg:h-screen",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6 flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                YZ
              </div>
              <span className="font-semibold text-foreground">Yeezy Global</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
            {loadingMenus ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Loading menus...</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {menus
                  .filter((menu) => {
                    // Filter menus based on user permissions
                    if (!user) return false;

                    // Admin can see all menus
                    if (isAdmin(user.roles)) return true;

                    // Check if user has any permission for this menu
                    // Add null check for permissions
                    if (!user.permissions || user.permissions.length === 0) return false;

                    return hasAnyPermission(user.permissions, menu.code || "");
                  })
                  .map((menu) => {
                    const isActive = location.pathname === menu.route;
                    const IconComponent = menu.icon
                      ? iconMap[menu.icon] || Menu
                      : Menu;

                    return (
                      <li key={menu.id}>
                        <Link
                          to={menu.route || "#"}
                          className={cn(
                            "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <IconComponent className="h-5 w-5" />
                          <span>{menu.name}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            )}
          </nav>

          {/* User section - Fixed at bottom */}
          <div className="border-t p-4 space-y-3 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.roles?.[0] || "User"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate("/change-password")}
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen w-full overflow-hidden">
        {/* Top bar - Fixed */}
        <header className="flex h-16 items-center border-b bg-card px-6 flex-shrink-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Page content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password. Make sure it's at least 6 characters long.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current Password *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword || ""}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChangePasswordDialog(false);
                  setPasswordData({ newPassword: "", currentPassword: "" });
                  setConfirmPassword("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
