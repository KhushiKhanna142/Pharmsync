import { Package, AlertTriangle, Clock, ShoppingCart } from "lucide-react";
import { KPICard } from "@/components/features/KPICard";
import { DemandChart } from "@/components/features/DemandChart";
import { ReorderAlerts } from "@/components/features/ReorderAlerts";

export default function Dashboard() {
  return (
    <div className="space-y-8 pt-12 md:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here's your pharmacy inventory overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Products"
          value="2,847"
          subtitle="Active SKUs"
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Low Stock Alerts"
          value="23"
          subtitle="Items below threshold"
          icon={AlertTriangle}
          variant="danger"
        />
        <KPICard
          title="Expiring Soon"
          value="47"
          subtitle="Within 30 days"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Pending Reorders"
          value="12"
          subtitle="Awaiting approval"
          icon={ShoppingCart}
          trend={{ value: 8, isPositive: false }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DemandChart />
        <ReorderAlerts />
      </div>
    </div>
  );
}
