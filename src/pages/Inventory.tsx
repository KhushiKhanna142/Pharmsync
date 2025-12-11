import { useState, useEffect } from "react";
import { CSVUploader } from "@/components/features/CSVUploader";
import { InventoryTable } from "@/components/features/InventoryTable";
import { FileSpreadsheet, Download, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function Inventory() {
  const [inventoryData, setInventoryData] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    drugName: "med_name",
    quantity: "quantity",
    expiryDate: "expiry_date",
    batchNumber: "batch_id",
    category: "status"
  });
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      console.log("Fetching inventory from localhost:8000...");
      const response = await fetch("http://localhost:8000/inventory");

      if (!response.ok) {
        throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Inventory data loaded:", data.length);

      if (Array.isArray(data)) {
        const formattedData = data.map((item: any) => ({
          // Safely convert all fields to strings as expected by the table component
          // Use String() to handle numbers, null, undefined
          // Handle case-sensitivity from API (e.g. 'Qty_On_Hand' vs 'quantity', 'BATCH_ID' vs 'batch_id')
          med_name: String(item.med_name || item.SKU_ID || item.med || ""),
          quantity: String(item.quantity ?? item.Qty_On_Hand ?? item.qty ?? "0"),
          expiry_date: String(item.expiry_date || item.Expiry_Date || item.expiry || ""),
          batch_id: String(item.batch_id || item.Batch_ID || item.batch || "-"),
          status: String(item.status || "Unknown"),
          is_outbreak_col: String(item.is_outbreak || "false")
        }));
        setInventoryData(formattedData);
        setColumnMapping(prev => ({ ...prev, isOutbreak: "is_outbreak_col" }));
      } else {
        console.error("Data received is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Connection Error: Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDataLoaded = (
    data: Record<string, string>[],
    mapping: Record<string, string>
  ) => {
    // For now, local preview of CSV upload
    setInventoryData(data);
    setColumnMapping(mapping);
    toast.success("CSV loaded for preview (Not saved to DB yet)");
  };

  return (
    <div className="space-y-8 pt-12 md:pt-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Inventory Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Upload and manage your pharmacy inventory with FEFO sorting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchInventory} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.kaggle.com/datasets/snowyowl22/pharmacy-dataset"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Sample Dataset
            </a>
          </Button>
          {inventoryData.length > 0 && (
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Dataset Info */}
      <div className="rounded-xl border border-secondary bg-secondary/30 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-secondary p-2">
            <FileSpreadsheet className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Compatible with Pharmacy Dataset
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This system is designed to work with the{" "}
              <a
                href="https://www.kaggle.com/datasets/snowyowl22/pharmacy-dataset"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Kaggle Pharmacy Dataset
              </a>
              . Upload your Drug/Medicine CSV file and map the columns using our smart mapper.
            </p>
          </div>
        </div>
      </div>

      {/* CSV Uploader */}
      <CSVUploader onDataLoaded={handleDataLoaded} />

      {/* Inventory Table */}
      <ErrorBoundary>
        <InventoryTable data={inventoryData} mapping={columnMapping} />
      </ErrorBoundary>
    </div>
  );
}
