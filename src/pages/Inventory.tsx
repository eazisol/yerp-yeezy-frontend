import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, TrendingDown, AlertTriangle, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/hooks/usePermissions";

const inventory = [
  {
    id: 1,
    sku: "YZY-SLIDE-BN-42",
    name: "Yeezy Slide Bone",
    warehouse: "China",
    available: 142,
    reserved: 28,
    inTransit: 0,
    weeksOnHand: 8.2,
    reorderPoint: 50,
    status: "healthy",
  },
  {
    id: 2,
    sku: "YZY-350-CW-40",
    name: "Yeezy 350 Cloud White",
    warehouse: "US",
    available: 28,
    reserved: 15,
    inTransit: 100,
    weeksOnHand: 2.1,
    reorderPoint: 80,
    status: "critical",
  },
  {
    id: 3,
    sku: "YZY-700-WR-43",
    name: "Yeezy 700 Wave Runner",
    warehouse: "China",
    available: 89,
    reserved: 12,
    inTransit: 0,
    weeksOnHand: 5.4,
    reorderPoint: 60,
    status: "low",
  },
  {
    id: 4,
    sku: "YZY-FOAM-MXT-39",
    name: "Yeezy Foam Runner MXT",
    warehouse: "US",
    available: 167,
    reserved: 43,
    inTransit: 0,
    weeksOnHand: 6.8,
    reorderPoint: 70,
    status: "healthy",
  },
  {
    id: 5,
    sku: "YZY-450-CLD-41",
    name: "Yeezy 450 Cloud White",
    warehouse: "China",
    available: 203,
    reserved: 56,
    inTransit: 150,
    weeksOnHand: 9.5,
    reorderPoint: 90,
    status: "healthy",
  },
];

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const { canRead, canModify } = usePermissions();

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "low":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">Low</Badge>;
      case "healthy":
        return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Healthy</Badge>;
      default:
        return null;
    }
  };

  const criticalItems = inventory.filter(item => item.status === "critical").length;
  const lowItems = inventory.filter(item => item.status === "low").length;
  const totalValue = "$1,245,890";
  const totalItems = inventory.reduce((sum, item) => sum + item.available, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
        </div>
        {canRead("INVENTORY") && (
          <Button variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue}</div>
            <p className="text-xs text-muted-foreground mt-1">estimated</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{lowItems}</div>
            <p className="text-xs text-yellow-600 mt-1">items need reorder</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{criticalItems}</div>
            <p className="text-xs text-red-600 mt-1">urgent action required</p>
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
                placeholder="Search by SKU or product name..."
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

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory List ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">In Transit</TableHead>
                <TableHead className="text-right">Weeks on Hand</TableHead>
                <TableHead className="text-right">Reorder Point</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium font-mono text-sm">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.warehouse}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span
                      className={
                        item.status === "critical"
                          ? "text-destructive"
                          : item.status === "low"
                          ? "text-warning"
                          : ""
                      }
                    >
                      {item.available}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.reserved}</TableCell>
                  <TableCell className="text-right">
                    {item.inTransit > 0 ? (
                      <span className="text-primary">{item.inTransit}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.weeksOnHand.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.reorderPoint}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
