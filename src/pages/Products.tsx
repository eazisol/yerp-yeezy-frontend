import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const products = [
  {
    id: 1,
    sku: "YZY-SLIDE-BN-42",
    name: "Yeezy Slide Bone",
    origin: "CN",
    cnStock: 142,
    usStock: 0,
    price: "$90",
    status: "active",
    updated: "2025-01-12",
  },
  {
    id: 2,
    sku: "YZY-350-CW-40",
    name: "Yeezy 350 Cloud White",
    origin: "US",
    cnStock: 0,
    usStock: 284,
    price: "$230",
    status: "active",
    updated: "2025-01-11",
  },
  {
    id: 3,
    sku: "YZY-700-WR-43",
    name: "Yeezy 700 Wave Runner",
    origin: "CN",
    cnStock: 89,
    usStock: 0,
    price: "$300",
    status: "active",
    updated: "2025-01-10",
  },
  {
    id: 4,
    sku: "YZY-FOAM-MXT-39",
    name: "Yeezy Foam Runner MXT",
    origin: "US",
    cnStock: 0,
    usStock: 167,
    price: "$80",
    status: "active",
    updated: "2025-01-12",
  },
  {
    id: 5,
    sku: "YZY-450-CLD-41",
    name: "Yeezy 450 Cloud White",
    origin: "CN",
    cnStock: 203,
    usStock: 0,
    price: "$200",
    status: "active",
    updated: "2025-01-09",
  },
];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate total stock
  const getTotalStock = (cnStock: number, usStock: number) => {
    return cnStock + usStock;
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog from Swell</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
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

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const totalStock = getTotalStock(product.cnStock, product.usStock);
                return (
                  <TableRow key={product.id} className="cursor-pointer hover:bg-secondary/50">
                    {/* Product Column - Combined SKU + Name */}
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.sku}</div>
                      </div>
                    </TableCell>
                    
                    {/* Status Column */}
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        <div 
                          className={`h-2 w-2 rounded-full ${
                            product.status === "active" 
                              ? "bg-green-600" 
                              : "bg-gray-500"
                          }`}
                        />
                        <span className="capitalize">{product.status}</span>
                      </div>
                    </TableCell>
                    
                    {/* Updated Column */}
                    <TableCell className="text-muted-foreground">
                      {formatDate(product.updated)}
                    </TableCell>
                    
                    {/* Stock Column */}
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          totalStock > 0
                            ? totalStock < 50
                              ? "text-warning"
                              : "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {totalStock}
                      </span>
                    </TableCell>
                    
                    {/* Price Column */}
                    <TableCell className="text-right font-medium">{product.price}</TableCell>
                    
                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
