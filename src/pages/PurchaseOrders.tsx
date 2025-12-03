import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const purchaseOrders = [
  {
    id: "PO-2024-127",
    vendor: "Guangzhou Manufacturing Co.",
    items: 5,
    totalValue: "$45,890",
    receivedValue: "$45,890",
    status: "completed",
    createdDate: "2025-10-15",
    dueDate: "2025-11-15",
  },
  {
    id: "PO-2024-128",
    vendor: "Shanghai Textiles Ltd.",
    items: 3,
    totalValue: "$28,450",
    receivedValue: "$14,225",
    status: "partial",
    createdDate: "2025-11-01",
    dueDate: "2025-12-01",
  },
  {
    id: "PO-2024-129",
    vendor: "US Footwear Supplies",
    items: 4,
    totalValue: "$62,300",
    receivedValue: "$0",
    status: "pending",
    createdDate: "2025-11-20",
    dueDate: "2025-12-20",
  },
  {
    id: "PO-2024-130",
    vendor: "Guangzhou Manufacturing Co.",
    items: 2,
    totalValue: "$18,900",
    receivedValue: "$0",
    status: "approved",
    createdDate: "2025-11-22",
    dueDate: "2025-12-22",
  },
];

export default function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { canRead, canModify } = usePermissions();

  const filteredPOs = purchaseOrders.filter(
    (po) =>
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "partial":
        return "secondary";
      case "approved":
        return "outline";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "partial":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "approved":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Create and manage purchase orders</p>
        </div>
        {canModify("PURCHASE_ORDERS") && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">130</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
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
                placeholder="Search by PO ID or vendor..."
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

      {/* PO Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order List ({filteredPOs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO ID</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOs.map((po) => (
                <TableRow key={po.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium">{po.id}</TableCell>
                  <TableCell>{po.vendor}</TableCell>
                  <TableCell>{po.items} items</TableCell>
                  <TableCell className="text-right font-medium">{po.totalValue}</TableCell>
                  <TableCell className="text-right">
                    {po.status === "completed" ? (
                      <span className="text-success">{po.receivedValue}</span>
                    ) : po.status === "partial" ? (
                      <span className="text-warning">{po.receivedValue}</span>
                    ) : (
                      <span className="text-muted-foreground">{po.receivedValue}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(po.status)} className={getStatusColor(po.status)}>
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{po.createdDate}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{po.dueDate}</TableCell>
                  <TableCell className="text-right">
                    {canRead("PURCHASE_ORDERS") && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
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
