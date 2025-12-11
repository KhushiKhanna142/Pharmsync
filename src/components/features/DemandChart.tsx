import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const mockData = [
  { month: "Jan", demand: 4200, stock: 5000 },
  { month: "Feb", demand: 4800, stock: 4600 },
  { month: "Mar", demand: 5100, stock: 4200 },
  { month: "Apr", demand: 4600, stock: 4800 },
  { month: "May", demand: 5400, stock: 5200 },
  { month: "Jun", demand: 5800, stock: 5000 },
  { month: "Jul", demand: 6200, stock: 5400 },
];

export function DemandChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Projected Demand vs. Current Stock
        </h3>
        <p className="text-sm text-muted-foreground">
          Monthly comparison of inventory levels
        </p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="demand"
              name="Projected Demand"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "hsl(var(--chart-1))" }}
            />
            <Line
              type="monotone"
              dataKey="stock"
              name="Current Stock"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "hsl(var(--chart-2))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
