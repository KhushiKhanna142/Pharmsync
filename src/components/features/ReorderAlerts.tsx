import { AlertTriangle, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReorderItem {
  id: string;
  name: string;
  currentStock: number;
  predictedDemand: number;
  deficit: number;
  urgency: "high" | "medium" | "low";
}

const mockReorders: ReorderItem[] = [
  {
    id: "1",
    name: "Amoxicillin 500mg",
    currentStock: 120,
    predictedDemand: 350,
    deficit: 230,
    urgency: "high",
  },
  {
    id: "2",
    name: "Lisinopril 10mg",
    currentStock: 85,
    predictedDemand: 200,
    deficit: 115,
    urgency: "high",
  },
  {
    id: "3",
    name: "Metformin 850mg",
    currentStock: 200,
    predictedDemand: 280,
    deficit: 80,
    urgency: "medium",
  },
  {
    id: "4",
    name: "Omeprazole 20mg",
    currentStock: 150,
    predictedDemand: 190,
    deficit: 40,
    urgency: "low",
  },
];

export function ReorderAlerts() {
  const getUrgencyStyles = (urgency: ReorderItem["urgency"]) => {
    switch (urgency) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "medium":
        return "bg-warning/10 text-warning border-warning/30";
      case "low":
        return "bg-secondary text-secondary-foreground border-secondary";
    }
  };

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
        {mockReorders.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Package className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Stock: {item.currentStock} | Demand: {item.predictedDemand}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${getUrgencyStyles(
                  item.urgency
                )}`}
              >
                {item.urgency === "high" && (
                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                )}
                -{item.deficit} units
              </span>
              <Button size="sm" variant="outline">
                Reorder
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
