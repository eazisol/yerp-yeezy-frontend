import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Missing variant SKUs page with server-side pagination
export default function MissingVariantSkus() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["missing-variant-skus", page, pageSize],
    queryFn: () => dashboardService.getMissingVariantSkus(page, pageSize),
  });

  const items = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const hasPreviousPage = data?.hasPreviousPage || false;
  const hasNextPage = data?.hasNextPage || false;

  // Format ISO date to short string
  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString("en-US");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Missing Variant SKUs</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            SKUs used in orders without a matching variant in the system
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Missing SKUs: <span className="font-medium text-foreground">{totalCount}</span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading missing variant SKUs...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No missing variant SKUs found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Latest Order</TableHead>
                  <TableHead>Latest Order Date</TableHead>
                  <TableHead className="text-right">Total Uses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={`${item.sku}-${index}`}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.productName || "—"}</TableCell>
                    <TableCell>{item.latestOrderNumber || "—"}</TableCell>
                    <TableCell>{formatDate(item.latestOrderDate)}</TableCell>
                    <TableCell className="text-right">{item.totalUses}</TableCell>
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
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} SKUs
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
