import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const orders = [
  {
    id: "#ORD-1284",
    customer: "John Smith",
    email: "john@example.com",
    items: 3,
    value: "$489",
    route: "CN",
    status: "shipped",
    tracking: "YX123456789CN",
    date: "2025-11-25",
  },
  {
    id: "#ORD-1283",
    customer: "Emma Wilson",
    email: "emma@example.com",
    items: 2,
    value: "$712",
    route: "US",
    status: "processing",
    tracking: "33D987654321",
    date: "2025-11-25",
  },
  {
    id: "#ORD-1282",
    customer: "Michael Brown",
    email: "michael@example.com",
    items: 1,
    value: "$298",
    route: "Mixed",
    status: "shipped",
    tracking: "Multiple",
    date: "2025-11-24",
  },
  {
    id: "#ORD-1281",
    customer: "Sarah Davis",
    email: "sarah@example.com",
    items: 4,
    value: "$1,024",
    route: "CN",
    status: "pending",
    tracking: "-",
    date: "2025-11-24",
  },
  {
    id: "#ORD-1280",
    customer: "Robert Johnson",
    email: "robert@example.com",
    items: 2,
    value: "$560",
    route: "US",
    status: "shipped",
    tracking: "33D111222333",
    date: "2025-11-23",
  },
];

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "shipped":
        return "default";
      case "processing":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRouteColor = (route: string) => {
    switch (route) {
      case "CN":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "US":
        return "bg-green-100 text-green-700 border-green-200";
      case "Mixed":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Auto-imported orders from Swell with routing status
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CN Routed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">642</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              US Routed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">587</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mixed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">55</div>
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
                placeholder="Search by order ID or customer..."
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order List ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer}</div>
                      <div className="text-xs text-muted-foreground">{order.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="text-right font-medium">{order.value}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRouteColor(order.route)}>
                      {order.route}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{order.tracking}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{order.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
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
