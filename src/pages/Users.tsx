import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye, Edit, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/hooks/usePermissions";

const users = [
  {
    id: 1,
    name: "Douglas Stein",
    email: "douglas@yeezyglobal.com",
    role: "admin",
    department: "Management",
    status: "active",
    lastActive: "2025-11-28",
  },
  {
    id: 2,
    name: "Wang Li",
    email: "wang@yeezyglobal.com",
    role: "warehouse",
    department: "Warehouse CN",
    status: "active",
    lastActive: "2025-11-28",
  },
  {
    id: 3,
    name: "Sarah Johnson",
    email: "sarah@yeezyglobal.com",
    role: "procurement",
    department: "Procurement",
    status: "active",
    lastActive: "2025-11-27",
  },
  {
    id: 4,
    name: "Michael Chen",
    email: "michael@yeezyglobal.com",
    role: "logistics",
    department: "Logistics",
    status: "active",
    lastActive: "2025-11-28",
  },
  {
    id: 5,
    name: "Emily Davis",
    email: "emily@yeezyglobal.com",
    role: "finance",
    department: "Finance",
    status: "active",
    lastActive: "2025-11-26",
  },
  {
    id: 6,
    name: "John Smith",
    email: "john@yeezyglobal.com",
    role: "warehouse",
    department: "Warehouse US",
    status: "active",
    lastActive: "2025-11-28",
  },
];

const roles = [
  { value: "admin", label: "Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "procurement", label: "Procurement", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "warehouse", label: "Warehouse", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "logistics", label: "Logistics", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "finance", label: "Finance", color: "bg-orange-100 text-orange-700 border-orange-200" },
];

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const { canRead, canModify, canDelete } = usePermissions();

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    return roles.find((r) => r.value === role)?.color || "";
  };

  const getRoleLabel = (role: string) => {
    return roles.find((r) => r.value === role)?.label || role;
  };

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
              <Button>
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
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.lastActive === "2025-11-28").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User List ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{user.department}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
                  <TableCell>
                    <Badge variant="default">active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canModify("USER_MANAGEMENT") && (
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canRead("USER_MANAGEMENT") && (
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
