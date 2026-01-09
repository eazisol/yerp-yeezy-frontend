import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye, Loader2, Pencil } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPurchaseOrders, PurchaseOrder } from "@/services/purchaseOrders";
import { useToast } from "@/hooks/use-toast";

export default function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pendingApproval: 0,
    inProgress: 0,
    totalValue: 0,
  });
  const navigate = useNavigate();
  const { canRead, canModify } = usePermissions();
  const { toast } = useToast();

  // Fetch purchase orders
  useEffect(() => {
    const fetchPOs = async () => {
      try {
        setLoading(true);
        const response = await getPurchaseOrders(page, pageSize);
        setPurchaseOrders(response.data);
        setTotalCount(response.totalCount);

        // Calculate stats
        const pendingApproval = response.data.filter(
          (po) => po.approvalStatus === "Pending" || po.status === "PendingApproval"
        ).length;
        const inProgress = response.data.filter(
          (po) =>
            po.status === "VendorAccepted" ||
            po.status === "PartiallyReceived" ||
            po.status === "Released"
        ).length;
        const totalValue = response.data.reduce((sum, po) => sum + po.totalValue, 0);

        setStats({
          total: response.totalCount,
          pendingApproval,
          inProgress,
          totalValue,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load purchase orders",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPOs();
  }, [page, pageSize, toast]);

  const filteredPOs = purchaseOrders.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.vendorName && po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "fullyreceived":
        return "default";
      case "partial":
      case "partiallyreceived":
        return "secondary";
      case "approved":
        return "outline";
      case "pending":
      case "pendingapproval":
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "fullyreceived":
        return "bg-green-100 text-green-700 border-green-200";
      case "partial":
      case "partiallyreceived":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "approved":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
      case "pendingapproval":
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Create and manage purchase orders</p>
        </div>
        {canModify("PURCHASE_ORDERS") && (
          <Button onClick={() => navigate("/purchase-orders/new")}>
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
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApproval}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
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
          {filteredPOs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => (
                  <TableRow
                    key={po.purchaseOrderId}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate(`/purchase-orders/${po.purchaseOrderId}`)}
                  >
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.vendorName || "N/A"}</TableCell>
                    <TableCell>{po.lineItems?.length || 0} items</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(po.totalValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {po.receivedValue > 0 ? (
                        <span
                          className={
                            po.receivedValue === po.totalValue
                              ? "text-green-600"
                              : "text-yellow-600"
                          }
                        >
                          {formatCurrency(po.receivedValue)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {formatCurrency(0)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(po.status)}
                        className={getStatusColor(po.status)}
                      >
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {po.approvals && po.approvals.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-xs">
                            {po.approvals.filter(a => a.status === "Approved").length}/{po.approvals.length} Approved
                          </Badge>
                          {po.approvals.some(a => a.status === "Rejected") && (
                            <Badge variant="destructive" className="text-xs">
                              {po.approvals.filter(a => a.status === "Rejected").length} Rejected
                            </Badge>
                          )}
                        </div>
                      ) : po.status === "PendingApproval" ? (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(po.createdDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {po.expectedDeliveryDate
                        ? formatDate(po.expectedDeliveryDate)
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {canRead("PURCHASE_ORDERS") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/purchase-orders/${po.purchaseOrderId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {canModify("PURCHASE_ORDERS") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/purchase-orders/${po.purchaseOrderId}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
