import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { reportsService, ReportFilter, OrderProjectionRow } from "@/services/reports";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";

// Today as YYYY-MM-DD for default From/To date
function getTodayYMD(): string {
  return new Date().toISOString().slice(0, 10);
}

// Date range preset: 30, 60, 90, 120 days or Custom
type DateRangePreset = "30" | "60" | "90" | "120" | "Custom";

function getFromToForPreset(preset: DateRangePreset): { from: string; to: string } {
  const to = getTodayYMD();
  if (preset === "Custom") return { from: to, to };
  const n = parseInt(preset, 10);
  const d = new Date();
  d.setDate(d.getDate() - n);
  const from = d.toISOString().slice(0, 10);
  return { from, to };
}

// Sort key type for column sorting
type SortKey =
  | "item"
  | "totalSold"
  | "totalInventory"
  | "salesPerDay"
  | "openToSell"
  | "weeksOnHand"
  | "suggestedOrder"
  | "actualOrder"
  | "factory"
  | "price"
  | "totalCost"
  | "openPoQuantity";

export default function OrderProjections() {
  const today = getTodayYMD();
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("30");
  const [fromDate, setFromDate] = useState(() => getFromToForPreset("30").from);
  const [toDate, setToDate] = useState(() => getFromToForPreset("30").to);
  const [appliedFromDate, setAppliedFromDate] = useState(() => getFromToForPreset("30").from);
  const [appliedToDate, setAppliedToDate] = useState(() => getFromToForPreset("30").to);
  const [skuSearch, setSkuSearch] = useState("");
  const [skuFilterDebounced, setSkuFilterDebounced] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("totalSold");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // When preset changes (30/60/90/120), set From/To
  const handlePresetChange = useCallback((preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (preset !== "Custom") {
      const { from, to } = getFromToForPreset(preset);
      setFromDate(from);
      setToDate(to);
    }
  }, []);

  // When user manually changes From/To, switch to Custom
  const handleFromChange = useCallback((value: string) => {
    setFromDate(value);
    setDateRangePreset("Custom");
  }, []);
  const handleToChange = useCallback((value: string) => {
    setToDate(value);
    setDateRangePreset("Custom");
  }, []);

  // Debounce SKU search (frontend-only filter) – 300ms delay so not every keyup hits
  useEffect(() => {
    const t = setTimeout(() => setSkuFilterDebounced(skuSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [skuSearch]);

  const filter: ReportFilter = useMemo(
    () => ({
      dateRangeType: "Custom",
      startDate: appliedFromDate,
      endDate: appliedToDate,
      pageNumber: 1,
      pageSize: 5000,
    }),
    [appliedFromDate, appliedToDate]
  );

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["order-projections", filter],
    queryFn: () => reportsService.getOrderProjections(filter),
  });

  const handleApplyDates = useCallback(() => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  }, [fromDate, toDate]);

  const handleSort = useCallback((column: SortKey) => {
    setSortBy(column);
    setSortOrder((prev) => (column === sortBy ? (prev === "asc" ? "desc" : "asc") : "asc"));
  }, [sortBy]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(value);

  const formatDecimal = (value: number, decimals = 2) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  const rawRows: OrderProjectionRow[] = data?.items ?? [];
  const loading = isLoading || isRefetching;

  const sortedRows = useMemo(() => {
    const arr = [...rawRows];
    arr.sort((a, b) => {
      let aVal: string | number | null = (a as any)[sortBy];
      let bVal: string | number | null = (b as any)[sortBy];
      if (sortBy === "weeksOnHand") {
        aVal = a.weeksOnHand ?? -1;
        bVal = b.weeksOnHand ?? -1;
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder === "asc" ? 1 : -1;
      if (bVal == null) return sortOrder === "asc" ? -1 : 1;
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rawRows, sortBy, sortOrder]);

  // Frontend-only SKU filter (debounced)
  const filteredRows = useMemo(() => {
    if (!skuFilterDebounced) return sortedRows;
    const q = skuFilterDebounced.toLowerCase();
    return sortedRows.filter((r) => r.item?.toLowerCase().includes(q));
  }, [sortedRows, skuFilterDebounced]);

  // Totals for footer row (from filtered rows)
  const totals = useMemo(() => {
    if (filteredRows.length === 0) return null;
    return {
      totalSold: filteredRows.reduce((s, r) => s + r.totalSold, 0),
      totalInventory: filteredRows.reduce((s, r) => s + r.totalInventory, 0),
      openToSell: filteredRows.reduce((s, r) => s + r.openToSell, 0),
      suggestedOrder: filteredRows.reduce((s, r) => s + r.suggestedOrder, 0),
      actualOrder: filteredRows.reduce((s, r) => s + r.actualOrder, 0),
      totalCost: filteredRows.reduce((s, r) => s + r.totalCost, 0),
      openPoQuantity: filteredRows.reduce((s, r) => s + (r.openPoQuantity ?? 0), 0),
    };
  }, [filteredRows]);

  // CSV: escape field for CSV (comma, quote, newline)
  const escapeCsvField = (val: string | number): string => {
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r"))
      return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const handleExportCsv = useCallback(() => {
    const headers = [
      "ITEM",
      "TOTAL SOLD",
      "TOTAL INVENTORY",
      "SALES PER DAY",
      "OPEN TO SELL",
      "OPEN PO QTY",
      "WEEKS ON HAND",
      "SUGGESTED ORDER",
      "ACTUAL ORDER",
      "FACTORY",
      "PRICE",
      "TOTAL COST",
    ];
    const rows: string[] = [headers.map(escapeCsvField).join(",")];
    filteredRows.forEach((row) => {
      rows.push(
        [
          row.item,
          row.totalSold,
          row.totalInventory,
          row.salesPerDay,
          row.openToSell,
          row.openPoQuantity ?? 0,
          row.weeksOnHand ?? "",
          row.suggestedOrder,
          row.actualOrder,
          row.factory ?? "",
          row.price,
          row.totalCost,
        ].map(escapeCsvField).join(",")
      );
    });
    if (totals) {
      rows.push(
        [
          "Total",
          totals.totalSold,
          totals.totalInventory,
          "",
          totals.openToSell,
          totals.openPoQuantity,
          "",
          totals.suggestedOrder,
          totals.actualOrder,
          "",
          "",
          totals.totalCost,
        ].map(escapeCsvField).join(",")
      );
    }
    const csv = rows.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-projections-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRows, totals]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortBy !== column)
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline opacity-50" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 inline text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 inline text-primary" />
    );
  };

  const Th = ({
    column,
    label,
    align = "left",
  }: {
    column: SortKey;
    label: string;
    align?: "left" | "right";
  }) => {
    const isActive = sortBy === column;
    return (
      <TableHead
        className={`whitespace-nowrap cursor-pointer select-none hover:bg-muted/50 ${align === "right" ? "text-right" : ""} ${isActive ? "font-semibold text-primary bg-muted/50" : ""}`}
        onClick={() => handleSort(column)}
      >
        {label}
        <SortIcon column={column} />
      </TableHead>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">ORDER PROJECTIONS</h1>
      </div>

      {/* Filters: Search by SKU, Date range preset, From, To, Apply, Export CSV */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px] max-w-sm">
              <label className="text-sm font-medium mb-2 block">Search by SKU</label>
              <Input
                placeholder="e.g. YS-01-CREAM"
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
              />
            </div>
            <div className="min-w-[140px]">
              <label className="text-sm font-medium mb-2 block">Date range</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={dateRangePreset}
                onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
              >
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
                <option value="120">Last 120 days</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">From</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => handleToChange(e.target.value)}
              />
            </div>
            <Button onClick={handleApplyDates} disabled={loading}>
              Apply
            </Button>
            <Button variant="outline" onClick={handleExportCsv} disabled={filteredRows.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table with sortable columns */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <Th column="item" label="ITEM" />
                  <Th column="totalSold" label="TOTAL SOLD" align="right" />
                  <Th column="totalInventory" label="TOTAL INVENTORY" align="right" />
                  <Th column="salesPerDay" label="SALES PER DAY" align="right" />
                  <Th column="openToSell" label="OPEN TO SELL" align="right" />
                  <Th column="weeksOnHand" label="WEEKS ON HAND" align="right" />
                  <Th column="openPoQuantity" label="OPEN PO QTY" align="right" />
                  <Th column="suggestedOrder" label="SUGGESTED ORDER" align="right" />
                  <Th column="actualOrder" label="ACTUAL ORDER" align="right" />
                  <Th column="factory" label="FACTORY" />
                  <Th column="price" label="PRICE" align="right" />
                  <Th column="totalCost" label="TOTAL COST" align="right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                      No data. Try a different SKU or clear search.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredRows.map((row, idx) => (
                      <TableRow key={`${row.item}-${idx}`}>
                        <TableCell className="font-medium whitespace-nowrap">{row.item}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.totalSold)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.totalInventory)}</TableCell>
                        <TableCell className="text-right">{formatDecimal(row.salesPerDay)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.openToSell)}</TableCell>
                        <TableCell className="text-right">
                          {row.weeksOnHand != null ? formatDecimal(Number(row.weeksOnHand), 1) : ""}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(row.openPoQuantity ?? 0)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.suggestedOrder)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.actualOrder)}</TableCell>
                        <TableCell>{row.factory ?? ""}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.totalCost)}</TableCell>
                      </TableRow>
                    ))}
                    {totals && (
                      <TableRow className="bg-muted/60 font-semibold">
                        <TableCell className="font-semibold whitespace-nowrap">Total</TableCell>
                        <TableCell className="text-right">{formatNumber(totals.totalSold)}</TableCell>
                        <TableCell className="text-right">{formatNumber(totals.totalInventory)}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">{formatNumber(totals.openToSell)}</TableCell>
                        <TableCell className="text-right">{formatNumber(totals.openPoQuantity)}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">{formatNumber(totals.suggestedOrder)}</TableCell>
                        <TableCell className="text-right">{formatNumber(totals.actualOrder)}</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
