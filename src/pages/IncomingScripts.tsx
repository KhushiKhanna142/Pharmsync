import { FileText, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Prescription {
  id: string;
  patientName: string;
  doctor: string;
  medication: string;
  quantity: number;
  status: "pending" | "processing" | "ready" | "dispensed";
  receivedAt: string;
}

const mockPrescriptions: Prescription[] = [
  {
    id: "RX-2024-001",
    patientName: "John Smith",
    doctor: "Dr. Sarah Johnson",
    medication: "Amoxicillin 500mg",
    quantity: 21,
    status: "pending",
    receivedAt: "2 mins ago",
  },
  {
    id: "RX-2024-002",
    patientName: "Emily Davis",
    doctor: "Dr. Michael Chen",
    medication: "Lisinopril 10mg",
    quantity: 30,
    status: "processing",
    receivedAt: "15 mins ago",
  },
  {
    id: "RX-2024-003",
    patientName: "Robert Wilson",
    doctor: "Dr. Lisa Anderson",
    medication: "Metformin 850mg",
    quantity: 60,
    status: "ready",
    receivedAt: "32 mins ago",
  },
  {
    id: "RX-2024-004",
    patientName: "Maria Garcia",
    doctor: "Dr. James Brown",
    medication: "Omeprazole 20mg",
    quantity: 28,
    status: "dispensed",
    receivedAt: "1 hour ago",
  },
];

const getStatusConfig = (status: Prescription["status"]) => {
  switch (status) {
    case "pending":
      return { icon: Clock, label: "Pending", variant: "warning" as const };
    case "processing":
      return { icon: AlertCircle, label: "Processing", variant: "secondary" as const };
    case "ready":
      return { icon: CheckCircle, label: "Ready", variant: "success" as const };
    case "dispensed":
      return { icon: CheckCircle, label: "Dispensed", variant: "default" as const };
  }
};

export default function IncomingScripts() {
  return (
    <div className="space-y-8 pt-12 md:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Incoming Prescriptions
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage and process incoming prescription orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Today", value: 47, color: "primary" },
          { label: "Pending", value: 12, color: "warning" },
          { label: "Processing", value: 8, color: "secondary" },
          { label: "Ready", value: 27, color: "success" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {mockPrescriptions.map((rx) => {
          const statusConfig = getStatusConfig(rx.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={rx.id}
              className="rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-soft"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <FileText className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{rx.id}</h3>
                      <Badge variant={statusConfig.variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rx.medication} × {rx.quantity}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {rx.patientName}
                      </span>
                      <span>{rx.doctor}</span>
                      <span>{rx.receivedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {rx.status === "pending" && (
                    <Button size="sm">Process</Button>
                  )}
                  {rx.status === "ready" && (
                    <Button size="sm">Dispense</Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
