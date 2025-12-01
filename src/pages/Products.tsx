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
  },
];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

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
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead className="text-right">CN Stock</TableHead>
                <TableHead className="text-right">US Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <Badge variant={product.origin === "CN" ? "secondary" : "outline"}>
                      {product.origin}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.cnStock > 0
                          ? product.cnStock < 50
                            ? "text-warning"
                            : "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {product.cnStock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.usStock > 0
                          ? product.usStock < 50
                            ? "text-warning"
                            : "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {product.usStock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{product.price}</TableCell>
                  <TableCell>
                    <Badge variant="default">{product.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
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
