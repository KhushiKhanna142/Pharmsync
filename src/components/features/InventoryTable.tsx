import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInDays, isValid } from "date-fns";

interface InventoryItem {
  id: string;
  drugName: string;
  quantity: number;
  expiryDate: string;
  batchNumber?: string;
  manufacturer?: string;
  unitPrice?: number;
  category?: string;
  isOutbreak?: boolean;
}

interface InventoryTableProps {
  data: Record<string, string>[];
  mapping: Record<string, string>;
  searchTerm: string;
  onSearch: (value: string) => void;
}
const parseDate = (dateStr: string): Date => {
  // Try multiple date formats
  const formats = [
    () => parseISO(dateStr),
    () => new Date(dateStr),
    () => {
      const parts = dateStr.split(/[/-]/);
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      return new Date();
    },
  ];

  for (const fn of formats) {
    try {
      const date = fn();
      if (isValid(date)) return date;
    } catch { }
  }
  return new Date();
};

export function InventoryTable({ data, mapping, searchTerm, onSearch }: InventoryTableProps) {
  const [sortBy, setSortBy] = useState<"expiry" | "name" | "quantity">("expiry");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const processedData: InventoryItem[] = useMemo(() => {
    return data.map((row, index) => ({
      id: String(index),
      drugName: row[mapping.drugName] || "Unknown",
      quantity: parseInt(row[mapping.quantity]) || 0,
      expiryDate: row[mapping.expiryDate] || "",
      batchNumber: mapping.batchNumber ? row[mapping.batchNumber] : undefined,
      manufacturer: mapping.manufacturer ? row[mapping.manufacturer] : undefined,
      unitPrice: mapping.unitPrice ? parseFloat(row[mapping.unitPrice]) : undefined,
      category: mapping.category ? row[mapping.category] : undefined,
      isOutbreak: mapping.isOutbreak ? row[mapping.isOutbreak] === "true" : false,
    }));
  }, [data, mapping]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...processedData];

    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "expiry") {
        const dateA = parseDate(a.expiryDate);
        const dateB = parseDate(b.expiryDate);
        if (!isValid(dateA) || !isValid(dateB)) return 0; // Prevent crash on invalid dates
        comparison = dateA.getTime() - dateB.getTime();
      } else if (sortBy === "name") {
        comparison = a.drugName.localeCompare(b.drugName);
      } else if (sortBy === "quantity") {
        comparison = a.quantity - b.quantity;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [processedData, sortBy, sortOrder]);


  const getExpiryStatus = (dateStr: string) => {
    try {
      if (!dateStr) return { status: "unknown", label: "No Date", variant: "secondary" as const };

      const date = parseDate(dateStr);
      if (!isValid(date)) return { status: "unknown", label: "Invalid Date", variant: "secondary" as const };

      const daysUntilExpiry = differenceInDays(date, new Date());

      if (daysUntilExpiry < 0) {
        return { status: "expired", label: "Expired", variant: "destructive" as const };
      } else if (daysUntilExpiry <= 30) {
        return { status: "critical", label: `${daysUntilExpiry}d`, variant: "destructive" as const };
      } else if (daysUntilExpiry <= 90) {
        return { status: "warning", label: `${daysUntilExpiry}d`, variant: "warning" as const };
      }
      return { status: "ok", label: `${daysUntilExpiry}d`, variant: "secondary" as const };
    } catch (e) {
      return { status: "unknown", label: "Error", variant: "secondary" as const };
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity < 50) return { label: "Low Stock", variant: "warning" as const };
    return { label: "In Stock", variant: "success" as const };
  };

  const toggleSort = (column: "expiry" | "name" | "quantity") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // if (processedData.length === 0) {
  //   return null;
  // }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up">
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Inventory ({filteredAndSortedData.length} items)
            </h3>
            <p className="text-sm text-muted-foreground">
              Sorted by FEFO (First Expiry, First Out)
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search drugs..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("name")}
                  className="-ml-3 h-8 font-semibold"
                >
                  Drug Name
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("quantity")}
                  className="-ml-3 h-8 font-semibold"
                >
                  Quantity
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("expiry")}
                  className="-ml-3 h-8 font-semibold"
                >
                  Expiry Date
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              {mapping.batchNumber && <TableHead className="font-semibold">Batch</TableHead>}
              {mapping.category && <TableHead className="font-semibold">Category</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.slice(0, 50).map((item) => {
              const expiryStatus = getExpiryStatus(item.expiryDate);
              const stockStatus = getStockStatus(item.quantity);

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.drugName}
                    {item.isOutbreak && (
                      <Badge variant="destructive" className="ml-2 text-[10px] animate-pulse">
                        OUTBREAK IMPACT
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{item.quantity}</span>
                      {item.quantity < 50 && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{item.expiryDate}</span>
                      <Badge variant={expiryStatus.variant} className="text-xs">
                        {expiryStatus.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                  </TableCell>
                  {mapping.batchNumber && (
                    <TableCell className="text-muted-foreground">
                      {item.batchNumber}
                    </TableCell>
                  )}
                  {mapping.category && (
                    <TableCell className="text-muted-foreground">
                      {item.category}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedData.length > 50 && (
        <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
          Showing 50 of {filteredAndSortedData.length} items
        </div>
      )}
    </div>
  );
}
