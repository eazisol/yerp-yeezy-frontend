import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Stock alerts list page with server-side pagination and SKU filter
export default function StockAlerts() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [skuFilter, setSkuFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["stock-alerts", page, pageSize, skuFilter],
    queryFn: () => dashboardService.getStockAlerts(page, pageSize, skuFilter || undefined),
  });

  const items = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const hasPreviousPage = data?.hasPreviousPage || false;
  const hasNextPage = data?.hasNextPage || false;

  // Handle SKU filter updates
  const handleSkuChange = (value: string) => {
    setSkuFilter(value);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Stock Alerts</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Low and critical stock items with server-side paging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by SKU..."
            value={skuFilter}
            onChange={(event) => handleSkuChange(event.target.value)}
            className="w-64"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkuChange("")}
            disabled={!skuFilter}
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading stock alerts...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No stock alerts found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Variant SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={`${item.sku}-${item.variantSku || "product"}-${item.warehouse}-${index}`}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.variantSku || "—"}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.variantName || "—"}</TableCell>
                    <TableCell className="text-right">{item.currentStock}</TableCell>
                    <TableCell>{item.warehouse}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "critical" ? "destructive" : "secondary"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={!hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-center text-sm text-muted-foreground mt-2">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} alerts
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
