import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye, FileText, Loader2, Pencil } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getGRNs, GRN } from "@/services/grn";
import { useToast } from "@/hooks/use-toast";

export default function GRN() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pendingVerification: 0,
    thisMonth: 0,
    totalItemsReceived: 0,
  });
  const navigate = useNavigate();
  const { canRead, canModify } = usePermissions();
  const { toast } = useToast();

  // Fetch GRNs
  useEffect(() => {
    const fetchGRNs = async () => {
      try {
        setLoading(true);
        const response = await getGRNs(page, pageSize);
        setGRNs(response.data);
        setTotalCount(response.totalCount);

        // Calculate stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthGRNs = response.data.filter(
          (grn) => new Date(grn.createdDate) >= startOfMonth
        );
        const totalItemsReceived = response.data.reduce(
          (sum, grn) => sum + grn.lineItems.reduce((itemSum, item) => itemSum + item.receivedQuantity, 0),
          0
        );

        setStats({
          total: response.totalCount,
          pendingVerification: response.data.filter((grn) => grn.status === "Pending").length,
          thisMonth: thisMonthGRNs.length,
          totalItemsReceived,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load GRNs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGRNs();
  }, [page, pageSize, toast]);

  const filteredGRN = grns.filter(
    (grn) =>
      grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grn.poNumber && grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "default";
      case "partial":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "partial":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
          <h1 className="text-3xl font-bold text-foreground">Goods Received Notes</h1>
          <p className="text-muted-foreground mt-1">Track warehouse receipts and verify deliveries</p>
        </div>
        {canModify("GRN") && (
          <Button onClick={() => navigate("/grn/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create GRN
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total GRNs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerification}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItemsReceived.toLocaleString()}</div>
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
                placeholder="Search by GRN or PO ID..."
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

      {/* GRN Table */}
      <Card>
        <CardHeader>
          <CardTitle>GRN Records ({filteredGRN.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGRN.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No GRNs found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN ID</TableHead>
                  <TableHead>PO ID</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Qty Received</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGRN.map((grn) => (
                  <TableRow
                    key={grn.grnId}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate(`/grn/${grn.grnId}`)}
                  >
                    <TableCell className="font-medium">{grn.grnNumber}</TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/purchase-orders/${grn.purchaseOrderId}`);
                        }}
                      >
                        {grn.poNumber || `PO-${grn.purchaseOrderId}`}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{grn.warehouseName || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{grn.lineItems.length}</TableCell>
                    <TableCell className="text-right font-medium">
                      {grn.lineItems.reduce((sum, item) => sum + item.receivedQuantity, 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(grn.totalReceivedValue)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(grn.status || "")}
                        className={getStatusColor(grn.status || "")}
                      >
                        {grn.status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{grn.receivedBy || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(grn.receivedDate)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {canRead("GRN") && (
                        <div className="flex items-center justify-end gap-2">
                          {(grn.attachmentPath || (grn.attachments && grn.attachments.length > 0)) && (
                            <Button variant="ghost" size="sm" title="View attachments">
                              <FileText className="h-4 w-4 text-primary" />
                              {grn.attachments && grn.attachments.length > 0 && (
                                <span className="ml-1 text-xs">({grn.attachments.length})</span>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/grn/${grn.grnId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canModify("GRN") && grn.status === "Pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/grn/${grn.grnId}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
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
