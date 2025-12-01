import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock product data (replace with real data fetch)
  const product = {
    id,
    sku: "YZY-SLIDE-BN-42",
    name: "Yeezy Slide Bone",
    category: "Slides",
    origin: "CN",
    stockCN: 145,
    stockUS: 89,
    price: "$89.99",
    reorderLevel: 50,
    status: "active",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="text-muted-foreground mt-1">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium text-foreground">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Origin</span>
              <Badge variant="outline">{product.origin}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium text-foreground">{product.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="default">{product.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">China (CN)</span>
              <span className="font-medium text-foreground">{product.stockCN} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">United States (US)</span>
              <span className="font-medium text-foreground">{product.stockUS} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Stock</span>
              <span className="font-medium text-foreground">{product.stockCN + product.stockUS} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reorder Level</span>
              <span className="font-medium text-foreground">{product.reorderLevel} units</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
