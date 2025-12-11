import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";

const salesData = [
  { month: "Jan", sales: 45000 },
  { month: "Feb", sales: 52000 },
  { month: "Mar", sales: 48000 },
  { month: "Apr", sales: 61000 },
  { month: "May", sales: 55000 },
  { month: "Jun", sales: 67000 },
];

const categoryData = [
  { name: "Antibiotics", value: 35 },
  { name: "Analgesics", value: 25 },
  { name: "Cardiovascular", value: 20 },
  { name: "Diabetes", value: 15 },
  { name: "Others", value: 5 },
];

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Analytics() {
  return (
    <div className="space-y-8 pt-12 md:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Track sales performance and inventory insights
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-foreground">$328,400</p>
            </div>
            <div className="rounded-lg bg-success/10 p-3">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-success">+12.5%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Units Sold</p>
              <p className="mt-1 text-2xl font-bold text-foreground">12,847</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-success">+8.2%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="mt-1 text-2xl font-bold text-foreground">$25.54</p>
            </div>
            <div className="rounded-lg bg-accent/10 p-3">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-destructive">-2.1%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inventory Turnover</p>
              <p className="mt-1 text-2xl font-bold text-foreground">4.2x</p>
            </div>
            <div className="rounded-lg bg-warning/10 p-3">
              <Package className="h-5 w-5 text-warning" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-success">+0.3x</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-6 text-lg font-semibold text-foreground">
            Monthly Sales
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Sales"]}
                />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-6 text-lg font-semibold text-foreground">
            Sales by Category
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
