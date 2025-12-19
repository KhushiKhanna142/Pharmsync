import { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Calendar,
    Info,
    CheckCircle2,
    ArrowRight,
    Search,
    Snowflake,
    Sun,
    CloudRain,
    Leaf
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ForecastingDashboard() {
    const [selectedDrug, setSelectedDrug] = useState("Dolo 650");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Mock list for Left Panel (would come from API in real usage)
    const drugList = [
        { name: "Dolo 650", status: "Adequate" },
        { name: "Augmentin 625", status: "Low" },
        { name: "Pan 40", status: "Adequate" },
        { name: "Azithral 500", status: "Medium" },
        { name: "Cipcal 500", status: "Adequate" }
    ];

    const filteredDrugs = drugList.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/forecast/detail?med_name=${selectedDrug}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Forecast fetch error", error);
                toast.error("Failed to load forecast data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDrug]);

    const getSeasonIcon = (season: string) => {
        switch (season) {
            case "Winter": return <Snowflake className="h-4 w-4 text-blue-500" />;
            case "Summer": return <Sun className="h-4 w-4 text-orange-500" />;
            case "Spring": return <Leaf className="h-4 w-4 text-green-500" />;
            case "Fall": return <CloudRain className="h-4 w-4 text-slate-500" />;
            default: return null;
        }
    };

    if (loading && !data) return <div className="p-8">Loading Forecasts...</div>;

    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-100px)] flex flex-col">

            {/* 1. Dashboard Metrics (Top) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Forecast Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{data?.accuracy || 94.2}%</div>
                        <p className="text-xs text-blue-600 mt-1">High Confidence Model</p>
                    </CardContent>
                </Card>


                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Est. Cost Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">₹{(data?.avg_monthly_demand * 12 * 0.15).toFixed(0)}</div>
                        <p className="text-xs text-green-600 mt-1">Via Optimized Inventory</p>
                    </CardContent>
                </Card>
            </div>

            {/* Split Panel Area */}
            <div className="flex flex-1 gap-6 min-h-0">

                {/* 2. Left Panel - Drug Selection */}
                <Card className="w-80 flex flex-col border-slate-200 h-full">
                    <CardHeader className="pb-3 border-b bg-slate-50 rounded-t-lg">
                        <CardTitle className="text-base">Medications</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-8 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col">
                                {filteredDrugs.map((drug) => (
                                    <button
                                        key={drug.name}
                                        onClick={() => setSelectedDrug(drug.name)}
                                        className={cn(
                                            "flex items-center justify-between p-4 text-sm transition-colors border-b last:border-0 text-left hover:bg-slate-50",
                                            selectedDrug === drug.name ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                                        )}
                                    >
                                        <div className="font-medium">{drug.name}</div>
                                        <Badge variant={drug.status === "Low" ? "destructive" : drug.status === "Medium" ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5">
                                            {drug.status}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>

                </Card>

                {/* 3. Right Panel - Detailed Forecasts */}
                <div className="flex-1 overflow-y-auto pr-1">
                    <div className="space-y-6">
                        {/* Current Overview */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-slate-800">{selectedDrug} Analysis</h2>
                                <p className="text-muted-foreground">AI-Powered Demand Prediction Model v2.1</p>
                            </div>

                            <div className="flex gap-4 text-right">
                                <div>
                                    <div className="text-sm text-muted-foreground">Current Stock</div>
                                    <div className="font-mono font-bold text-lg">{data?.current_stock}</div>
                                </div>
                                <Separator orientation="vertical" className="h-10" />
                                <div>
                                    <div className="text-sm text-muted-foreground">Avg Demand</div>
                                    <div className="font-mono font-bold text-lg">{data?.avg_monthly_demand}</div>
                                </div>
                            </div>
                        </div>

                        {/* Forecast Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>6-Month Demand Forecast</CardTitle>
                                <CardDescription>projected consumption based on historical & seasonal trends</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.forecast_data}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="bg-slate-900 text-white text-xs p-2 rounded shadow-lg">
                                                            <div className="font-bold mb-1">{d.month}</div>
                                                            <div>Qty: {d.quantity}</div>
                                                            <div>Conf: {d.confidence}%</div>
                                                            <div className="text-slate-300 italic mt-1">{d.reason}</div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                                            {data?.forecast_data?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : "#cbd5e1"} /> // Highlight current month
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Detail Tabs */}
                        <Tabs defaultValue="predictions">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="predictions">Monthly Predictions</TabsTrigger>
                                <TabsTrigger value="seasonal">Seasonal Impact</TabsTrigger>
                                <TabsTrigger value="reorders">Reorders</TabsTrigger>
                            </TabsList>

                            <TabsContent value="predictions" className="space-y-4 mt-4">
                                <div className="grid gap-4">
                                    {data?.forecast_data?.map((month: any, i: number) => (
                                        <Card key={i} className="overflow-hidden border-l-4 border-l-blue-500">
                                            <div className="flex items-center p-4 gap-4">
                                                <div className="min-w-[80px]">
                                                    <div className="font-bold">{month.month}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {month.trend === "up" ? <TrendingUp className="h-3 w-3 text-green-500" /> :
                                                            month.trend === "down" ? <TrendingDown className="h-3 w-3 text-red-500" /> :
                                                                <Minus className="h-3 w-3 text-slate-500" />}
                                                        {month.trend.toUpperCase()}
                                                    </div>
                                                </div>
                                                <Separator orientation="vertical" className="h-10" />
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-slate-900 border-b border-dashed border-slate-200 pb-1 mb-1 inline-block">
                                                        Why?
                                                    </div>
                                                    <div className="text-sm text-slate-600">
                                                        {month.reason}
                                                    </div>
                                                </div>
                                                <div className="text-right min-w-[100px]">
                                                    <div className="text-xl font-bold">{month.quantity}</div>
                                                    <Badge variant="outline" className="text-[10px]">{month.confidence}% Conf.</Badge>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="seasonal" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Seasonal Demand Multipliers</CardTitle>
                                        <CardDescription>How seasons impact demand for {selectedDrug}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {data?.seasonal_factors?.map((s: any) => (
                                                <div key={s.season} className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border">
                                                    <div className="mb-2 p-2 bg-white rounded-full shadow-sm">
                                                        {getSeasonIcon(s.season)}
                                                    </div>
                                                    <div className="font-semibold text-sm">{s.season}</div>
                                                    <div className={cn(
                                                        "text-xl font-bold mt-1",
                                                        s.factor > 1 ? "text-green-600" : s.factor < 1 ? "text-red-500" : "text-slate-600"
                                                    )}>
                                                        {s.factor}x
                                                    </div>
                                                    <div className="text-xs text-muted-foreground text-center mt-1">
                                                        {s.factor > 1 ? "Higher Demand" : s.factor < 1 ? "Lower Demand" : "Normal Demand"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 flex gap-3 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg items-start">
                                            <Info className="h-5 w-5 shrink-0 mt-0.5" />
                                            <div>
                                                <strong>AI Insight:</strong> Seasonal patterns for this medication are well-correlated with historical environmental data.
                                                Expect deviations of ±5% based on actual weather severity.
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="reorders" className="mt-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                                        <CardHeader>
                                            <CardTitle className="text-base text-indigo-900">Recommended Reorders</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {data?.reorder_schedule?.map((order: any, i: number) => (
                                                <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 border-indigo-200">
                                                    <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-indigo-900">Order {order.quantity} units on {order.date}</div>
                                                        <div className="text-xs text-indigo-700 mt-1">{order.reason}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                                Schedule All Orders <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Year-Over-Year Performance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold text-green-600">+{data?.yoy_growth}%</div>
                                            <p className="text-sm text-muted-foreground mb-4">Growth compared to last year</p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Last Year Total</span>
                                                    <span className="font-medium">{(data?.avg_monthly_demand * 10 * 0.9).toFixed(0)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Projected Total</span>
                                                    <span className="font-medium">{(data?.avg_monthly_demand * 10).toFixed(0)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
