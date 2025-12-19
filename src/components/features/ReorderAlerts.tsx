import { AlertTriangle, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ReorderItem {
  med_name: string;
  current_stock: number;
  avg_daily_demand: number;
  target_stock: number;
  status: string;
  reorder_qty: number;
  outbreak_tag?: string;
}

export function ReorderAlerts() {
  const [reorders, setReorders] = useState<ReorderItem[]>([]);

  useEffect(() => {
    async function fetchReorders() {
      try {
        const response = await fetch("http://localhost:8000/reorder");
        if (response.ok) {
          const data = await response.json();
          // Filter only items that need reorder
          const activeReorders = data.filter((item: ReorderItem) => item.reorder_qty > 0).slice(0, 4);
          setReorders(activeReorders);
        }
      } catch (error) {
        console.error("Failed to fetch reorders:", error);
      }
    }
    fetchReorders();
  }, []);

  const getUrgencyStyles = (deficit: number) => {
    // Simple heuristic: Higher deficit = Higher urgency
    if (deficit > 200) return "bg-destructive/10 text-destructive border-destructive/30";
    if (deficit > 50) return "bg-warning/10 text-warning border-warning/30";
    return "bg-secondary text-secondary-foreground border-secondary";
  };

  const isHighUrgency = (deficit: number) => deficit > 200;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Recommended Reorders
          </h3>
          <p className="text-sm text-muted-foreground">
            Items where stock {"<"} predicted demand
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="space-y-3">
        {reorders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All stock levels are optimal. No reorders needed.
          </div>
        ) : (
          reorders.map((item) => (
            <div
              key={item.med_name}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Package className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.med_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {item.current_stock} | Target: {item.target_stock}
                    {item.outbreak_tag && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">(Outbreak Demand)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getUrgencyStyles(
                    item.reorder_qty
                  )}`}
                >
                  {isHighUrgency(item.reorder_qty) && (
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                  )}
                  -{item.reorder_qty} units
                </span>
                <Button size="sm" variant="outline">
                  Reorder
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
