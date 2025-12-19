
import { useState, useEffect } from "react";
import { InventoryTable } from "@/components/features/InventoryTable";
import { InventoryWelcome } from "@/components/features/InventoryWelcome";
import { DrugDatabaseTable } from "@/components/features/DrugDatabaseTable";
import { Download, RefreshCw, ChevronRight, Package, Pill, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";

type InventoryView = 'welcome' | 'inventory' | 'drugs';

export default function Inventory() {
  const [view, setView] = useState<InventoryView>('welcome');

  // Inventory Data State
  const [inventoryData, setInventoryData] = useState<Record<string, string>[]>([]);
  // Drug Database State
  const [drugData, setDrugData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Column Mapping (Corrected for InventoryTable Props)
  const columnMapping = {
    drugName: "med_name",
    quantity: "quantity",
    expiryDate: "expiry_date",
    batchNumber: "batch_id",
    category: "status",
    isOutbreak: "is_outbreak_col"
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const url = new URL("http://localhost:8000/inventory");
      url.searchParams.append("limit", "1000");
      if (searchTerm) url.searchParams.append("search", searchTerm);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();

      if (Array.isArray(data)) {
        const formattedData = data.map((item: any) => ({
          med_name: String(item.med_name || item.SKU_ID || ""),
          quantity: String(item.quantity ?? item.Qty_On_Hand ?? "0"),
          expiry_date: String(item.expiry_date || item.Expiry_Date || ""),
          batch_id: String(item.batch_id || item.Batch_ID || "-"),
          status: String(item.status || "Unknown"),
          is_outbreak_col: String(item.is_outbreak || "false")
        }));
        setInventoryData(formattedData);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading inventory data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrugDatabase = async () => {
    setLoading(true);
    try {
      const url = new URL("http://localhost:8000/drugs");
      url.searchParams.append("limit", "1000");
      if (searchTerm) url.searchParams.append("search", searchTerm);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch drug database");
      const data = await response.json();
      if (Array.isArray(data)) {
        setDrugData(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading drug database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (view === 'inventory') fetchInventory();
      if (view === 'drugs') fetchDrugDatabase();
    }, 500);

    return () => clearTimeout(timer);
  }, [view, searchTerm]);

  // Handle View Refresh
  const handleRefresh = () => {
    if (view === 'inventory') fetchInventory();
    if (view === 'drugs') fetchDrugDatabase();
  };

  return (
    <div className="space-y-6 pt-6 md:pt-0 h-full flex flex-col">
      {/* Breadcrumb / Header Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">

        {/* Breadcrumb Title */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 ${view === 'welcome' ? 'text-primary font-bold' : ''}`}
            onClick={() => setView('welcome')}
          >
            <div className="bg-primary/10 p-1 rounded-md">
              <Home className="h-4 w-4" />
            </div>
            Inventory
          </Button>

          {view !== 'welcome' && (
            <>
              <ChevronRight className="h-4 w-4" />
              <div className="flex items-center gap-2 font-medium text-foreground animate-in fade-in slide-in-from-left-2">
                {view === 'inventory' ? (
                  <>
                    <Package className="h-4 w-4 text-blue-500" />
                    Inventory Items
                  </>
                ) : (
                  <>
                    <Pill className="h-4 w-4 text-purple-500" />
                    Drug Database
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions Toolbar */}
        {view !== 'welcome' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {view === 'welcome' && (
          <InventoryWelcome onSelect={setView} />
        )}

        {view === 'inventory' && (
          <ErrorBoundary>
            <InventoryTable
              data={inventoryData}
              mapping={columnMapping}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
            />
          </ErrorBoundary>
        )}

        {view === 'drugs' && (
          <ErrorBoundary>
            <DrugDatabaseTable
              data={drugData}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
