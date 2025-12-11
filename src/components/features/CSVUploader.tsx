import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CSVUploaderProps {
  onDataLoaded: (data: Record<string, string>[], mapping: Record<string, string>) => void;
}

const systemFields = [
  { key: "drugName", label: "Drug Name", required: true },
  { key: "quantity", label: "Quantity", required: true },
  { key: "expiryDate", label: "Expiry Date", required: true },
  { key: "batchNumber", label: "Batch Number", required: false },
  { key: "manufacturer", label: "Manufacturer", required: false },
  { key: "unitPrice", label: "Unit Price", required: false },
  { key: "category", label: "Category", required: false },
];

export function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "complete">("upload");

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index] || "";
        return obj;
      }, {} as Record<string, string>);
    });
    return { headers, data };
  };

  const handleFile = useCallback((uploadedFile: File) => {
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, data } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvData(data);
      setStep("map");
      
      // Auto-map obvious matches
      const autoMapping: Record<string, string> = {};
      systemFields.forEach((field) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase().includes(field.key.toLowerCase()) ||
            h.toLowerCase().includes(field.label.toLowerCase().replace(" ", ""))
        );
        if (match) {
          autoMapping[field.key] = match;
        }
      });
      setMapping(autoMapping);
    };
    reader.readAsText(uploadedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile?.type === "text/csv" || droppedFile?.name.endsWith(".csv")) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleConfirmMapping = () => {
    const requiredFields = systemFields.filter((f) => f.required);
    const allRequiredMapped = requiredFields.every((f) => mapping[f.key]);
    
    if (!allRequiredMapped) {
      alert("Please map all required fields");
      return;
    }
    
    setStep("complete");
    onDataLoaded(csvData, mapping);
  };

  const resetUploader = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    setStep("upload");
  };

  if (step === "complete") {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Upload Complete</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Successfully loaded {csvData.length} records
        </p>
        <Button variant="outline" className="mt-4" onClick={resetUploader}>
          Upload Another File
        </Button>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Map CSV Columns</h3>
            <p className="text-sm text-muted-foreground">
              Match your CSV columns to system fields
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={resetUploader}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <FileSpreadsheet className="h-5 w-5 text-secondary-foreground" />
          <span className="text-sm font-medium text-foreground">{file?.name}</span>
          <span className="text-xs text-muted-foreground">
            ({csvData.length} rows)
          </span>
        </div>

        <div className="space-y-4">
          {systemFields.map((field) => (
            <div key={field.key} className="flex items-center gap-4">
              <div className="w-40">
                <p className="text-sm font-medium text-foreground">
                  {field.label}
                  {field.required && <span className="ml-1 text-destructive">*</span>}
                </p>
              </div>
              <Select
                value={mapping[field.key] || ""}
                onValueChange={(value) =>
                  setMapping((prev) => ({ ...prev, [field.key]: value }))
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select CSV column" />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={resetUploader}>
            Cancel
          </Button>
          <Button onClick={handleConfirmMapping}>Confirm Mapping</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 animate-fade-in",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Upload Daily Inventory (CSV)
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Drag and drop your CSV file here, or click to browse
      </p>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
        id="csv-upload"
      />
      <label htmlFor="csv-upload">
        <Button variant="outline" className="mt-4" asChild>
          <span>Browse Files</span>
        </Button>
      </label>
    </div>
  );
}
