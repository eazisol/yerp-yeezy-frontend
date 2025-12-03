import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye, TrendingUp } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const vendors = [
  {
    id: 1,
    name: "Guangzhou Manufacturing Co.",
    country: "China",
    contact: "Wang Li",
    email: "wang@gzmfg.com",
    phone: "+86 20 1234 5678",
    activePOs: 3,
    totalValue: "$124,500",
    leadTime: "30-45 days",
    performance: 94,
    status: "active",
  },
  {
    id: 2,
    name: "Shanghai Textiles Ltd.",
    country: "China",
    contact: "Chen Wei",
    email: "chen@shtextiles.com",
    phone: "+86 21 9876 5432",
    activePOs: 2,
    totalValue: "$89,200",
    leadTime: "25-35 days",
    performance: 89,
    status: "active",
  },
  {
    id: 3,
    name: "US Footwear Supplies",
    country: "USA",
    contact: "John Smith",
    email: "john@usfootwear.com",
    phone: "+1 555 123 4567",
    activePOs: 4,
    totalValue: "$156,800",
    leadTime: "15-20 days",
    performance: 97,
    status: "active",
  },
  {
    id: 4,
    name: "Beijing Materials Group",
    country: "China",
    contact: "Liu Yan",
    email: "liu@bjmaterials.com",
    phone: "+86 10 5555 6666",
    activePOs: 1,
    totalValue: "$45,600",
    leadTime: "35-50 days",
    performance: 82,
    status: "active",
  },
];

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { canRead, canModify, canDelete } = usePermissions();

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 95) return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Excellent</Badge>;
    if (performance >= 85) return <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">Good</Badge>;
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">Fair</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground mt-1">Manage vendor relationships and performance</p>
        </div>
        {canModify("VENDORS") && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Committed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91%</div>
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
                placeholder="Search by vendor name or country..."
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

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor List ({filteredVendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Active POs</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{vendor.country}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{vendor.contact}</div>
                      <div className="text-xs text-muted-foreground">{vendor.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{vendor.activePOs}</TableCell>
                  <TableCell className="text-right font-medium">{vendor.totalValue}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{vendor.leadTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vendor.performance}%</span>
                      {getPerformanceBadge(vendor.performance)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canRead("VENDORS") && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/vendors/${vendor.id}`)}>
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
