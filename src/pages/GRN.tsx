import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye, FileText } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const grnRecords = [
  {
    id: "GRN-2024-245",
    poId: "PO-2024-127",
    vendor: "Guangzhou Manufacturing Co.",
    warehouse: "China",
    items: 5,
    receivedQty: 500,
    status: "completed",
    receivedBy: "Wang Li",
    date: "2025-11-18",
    hasAttachment: true,
  },
  {
    id: "GRN-2024-246",
    poId: "PO-2024-128",
    vendor: "Shanghai Textiles Ltd.",
    warehouse: "China",
    items: 3,
    receivedQty: 250,
    status: "partial",
    receivedBy: "Chen Wei",
    date: "2025-11-20",
    hasAttachment: true,
  },
  {
    id: "GRN-2024-247",
    poId: "PO-2024-129",
    vendor: "US Footwear Supplies",
    warehouse: "US",
    items: 4,
    receivedQty: 180,
    status: "pending",
    receivedBy: "John Smith",
    date: "2025-11-22",
    hasAttachment: false,
  },
];

export default function GRN() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { canRead, canModify } = usePermissions();

  const filteredGRN = grnRecords.filter(
    (grn) =>
      grn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.poId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
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
    switch (status) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Goods Received Notes</h1>
          <p className="text-muted-foreground mt-1">Track warehouse receipts and verify deliveries</p>
        </div>
        {canModify("GRN") && (
          <Button>
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
            <div className="text-2xl font-bold">247</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,450</div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN ID</TableHead>
                <TableHead>PO ID</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Qty Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGRN.map((grn) => (
                <TableRow key={grn.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium">{grn.id}</TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0 text-primary">
                      {grn.poId}
                    </Button>
                  </TableCell>
                  <TableCell>{grn.vendor}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{grn.warehouse}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{grn.items}</TableCell>
                  <TableCell className="text-right font-medium">{grn.receivedQty}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(grn.status)} className={getStatusColor(grn.status)}>
                      {grn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{grn.receivedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{grn.date}</TableCell>
                  <TableCell className="text-right">
                    {canRead("GRN") && (
                      <div className="flex items-center justify-end gap-2">
                        {grn.hasAttachment && (
                          <Button variant="ghost" size="sm" title="View attachment">
                            <FileText className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/grn/${grn.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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
