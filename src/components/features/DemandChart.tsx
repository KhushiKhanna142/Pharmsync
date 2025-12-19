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
import { useEffect, useState } from "react";

export function DemandChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch 1: Sales Forecast
        const forecastRes = await fetch("http://localhost:8000/forecast");
        const forecastData = await forecastRes.json();

        // Fetch 2: Current Total Stats
        const statsRes = await fetch("http://localhost:8000/stats");
        const statsData = await statsRes.json();

        let currentTotalStock = statsData.total_quantity || 5000; // Default fallback if 0

        // Transform for Chart: Stock Depletion Curve
        // We accumulate demand to show how stock depletes
        // Or simpler: Show Projected Monthly Demand vs "Capacity" (Stock)

        const chartData = forecastData
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((item: any) => {
            let predictedSales = item.predicted_sales || 0;

            // Simple depletion simulation for viz
            // Stock reduces by predicted sales each month
            let stock = currentTotalStock;
            currentTotalStock -= predictedSales;

            return {
              month: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
              demand: Math.round(predictedSales),
              stock: Math.round(max(0, stock))
            };
          });

        // Helper
        function max(a: number, b: number) { return a > b ? a : b; }

        setData(chartData);
      } catch (e) {
        console.error("Chart data error", e);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Projected Demand vs. Current Stock
        </h3>
        <p className="text-sm text-muted-foreground">
          Forecasted depletion of inventory based on AI models
        </p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: "Daily Demand", angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: "Stock Level", angle: 90, position: 'insideRight' }}
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
              yAxisId="left"
              type="monotone"
              dataKey="demand"
              name="Projected Demand"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "hsl(var(--chart-1))" }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="stock"
              name="Projected Stock Level"
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
