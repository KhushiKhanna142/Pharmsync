import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    ComposedChart,
    Area,
    Cell
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle, DollarSign, PackageMinus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ForecastData {
    date: string;
    [key: string]: string | number;
}

interface DetailedForecastData {
    date: string;
    type: 'history' | 'forecast';
    value: number;
    ci_upper: number | null;
    ci_lower: number | null;
}

interface WasteAnalytics {
    batch_health: any[];
    projected_loss: number;
    waste_reasons: any[];
}

interface PricingStrategy {
    discount_pct: number;
    price: number;
    est_qty: number;
    est_revenue: number;
}

// ... (Existing Interfaces)

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];
const WASTE_COLORS = ['#ef4444', '#f97316', '#eab308']; // Red, Orange, Yellow for waste reasons

export default function ForecastingDashboard() {
    // ... (Existing State)
    const [forecast, setForecast] = useState<ForecastData[]>([]);
    const [loading, setLoading] = useState(true);
    const [duration, setDuration] = useState("15");
    const [drugKeys, setDrugKeys] = useState<string[]>([]);

    // Deep Dive State
    const [selectedDrug, setSelectedDrug] = useState<string>("");
    const [detailedData, setDetailedData] = useState<any[]>([]);

    // Module 6 State
    const [wasteAnalytics, setWasteAnalytics] = useState<WasteAnalytics>({ batch_health: [], projected_loss: 0, waste_reasons: [] });
    const [pricingStrategies, setPricingStrategies] = useState<PricingStrategy[]>([]);
    const [pricingDrug, setPricingDrug] = useState<string>("Dolo 650"); // Default for pricing tool

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch All Overview Data
                const [forecastRes, wasteRes] = await Promise.all([
                    fetch("http://localhost:8000/forecast"),
                    fetch("http://localhost:8000/waste/analytics")
                ]);

                if (!forecastRes.ok) throw new Error("Failed to fetch forecast data");
                if (!wasteRes.ok) throw new Error("Failed to fetch waste analytics");

                const forecastData = await forecastRes.json();
                const wasteData = await wasteRes.json();

                if (forecastData.length > 0) {
                    const keys = Object.keys(forecastData[0]).filter(k => k !== 'date' && k !== 'predicted_sales' && k !== 'is_holiday');
                    setDrugKeys(keys);
                    if (keys.length > 0) setSelectedDrug(keys[0]);
                }

                // Format overview
                const formattedForecast = forecastData.map((item: any) => {
                    const d = new Date(item.date);
                    return {
                        ...item,
                        displayDate: isNaN(d.getTime()) ? item.date : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    };
                });

                setForecast(formattedForecast);
                setWasteAnalytics(wasteData);

            } catch (error) {
                console.error("Error loading overview:", error);
                toast.error("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch Detailed Forecast
    useEffect(() => {
        if (!selectedDrug) return;
        const fetchDetail = async () => {
            try {
                const res = await fetch(`http://localhost:8000/forecast/detail?med_name=${selectedDrug}`);
                if (res.ok) {
                    const raw: DetailedForecastData[] = await res.json();
                    const transformed = raw.map(item => ({
                        date: item.date,
                        displayDate: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        history: item.type === 'history' ? item.value : null,
                        forecast: item.type === 'forecast' ? item.value : null,
                        ci_range: (item.type === 'forecast' && item.ci_lower !== null) ? [item.ci_lower, item.ci_upper] : null
                    }));
                    setDetailedData(transformed);
                }
            } catch (err) { console.error(err); }
        };
        fetchDetail();
    }, [selectedDrug]);

    // Fetch Pricing Strategies
    useEffect(() => {
        // Auto-fetch pricing strategies for the selected pricing drug
        const fetchPricing = async () => {
            try {
                // Mock params for demo: current price $100, 30 days left
                const res = await fetch(`http://localhost:8000/revenue/recovery?med_name=${pricingDrug}&current_price=100&days_left=30`);
                if (res.ok) {
                    const data = await res.json();
                    setPricingStrategies(data);
                }
            } catch (e) { console.error(e); }
        };
        fetchPricing();
    }, [pricingDrug]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading forecasting intelligence...</div>;
    }

    const idx = duration === "all" ? forecast.length : parseInt(duration);
    const filteredForecast = forecast.slice(0, idx);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Demand Intelligence</h1>
                    <p className="mt-2 text-slate-600">
                        AI-powered insights for inventory optimization
                    </p>
                </div>
                <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="w-[180px] bg-white border-slate-200">
                        <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="15">Next 15 Days</SelectItem>
                        <SelectItem value="30">Next 30 Days</SelectItem>
                        <SelectItem value="90">Next 3 Months</SelectItem>
                        <SelectItem value="all">All Available</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* --- SECTION 1: FORECASTING & DEEP DIVE --- */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800">1. Demand Forecasting</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="col-span-full lg:col-span-2 border-slate-200 shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-medium">Deep Dive Analysis</CardTitle>
                                <CardDescription>History (Solid), Forecast (Dashed), Confidence (Area)</CardDescription>
                            </div>
                            <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {drugKeys.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={detailedData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="displayDate" fontSize={12} tickLine={false} />
                                        <YAxis fontSize={12} tickLine={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="history" name="History" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="ci_range" name="95% CI" stroke="none" fill="#8884d8" fillOpacity={0.2} />
                                        <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#8884d8" strokeWidth={3} strokeDasharray="5 5" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-full lg:col-span-1 border-slate-200 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Market Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredForecast}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                        <XAxis dataKey="displayDate" fontSize={10} tickLine={false} />
                                        <YAxis fontSize={10} tickLine={false} width={30} />
                                        <Tooltip />
                                        {drugKeys.map((key, index) => (
                                            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} dot={false} strokeWidth={2} />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- SECTION 2: WASTE & REVENUE RECOVERY --- */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-800">2. Waste & Revenue Recovery</h2>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        Projected Loss: ${wasteAnalytics.projected_loss.toLocaleString()}
                    </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {/* Expiry Heatmap / Monitor */}
                    <Card className="col-span-full lg:col-span-1 border-slate-200 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                Expiry Risk Monitor
                            </CardTitle>
                            <CardDescription>Batches entering Critical Zone (&lt;90 days)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[300px]">
                                {wasteAnalytics.batch_health.map((batch, idx) => (
                                    <div key={idx} className="p-3 border-b last:border-0 flex justify-between items-center text-sm hover:bg-slate-50">
                                        <div>
                                            <div className="font-medium text-slate-800">{batch.med_name}</div>
                                            <div className="text-xs text-slate-500">{batch.id}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${batch.days_left < 90 ? 'text-red-600' : 'text-amber-600'}`}>
                                                {batch.days_left} Days
                                            </div>
                                            <div className="text-xs text-slate-500">Qty: {batch.Qty_On_Hand}</div>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Waste Reasons Analytics */}
                    <Card className="col-span-full lg:col-span-1 border-slate-200 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <PackageMinus className="h-4 w-4 text-red-500" />
                                Waste Analysis
                            </CardTitle>
                            <CardDescription>Historical waste by reason (Last 6 Months)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={wasteAnalytics.waste_reasons}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="waste_reason" fontSize={11} />
                                        <YAxis fontSize={12} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="total_loss" name="Loss ($)" radius={[4, 4, 0, 0]}>
                                            {wasteAnalytics.waste_reasons.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={WASTE_COLORS[index % WASTE_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dynamic Pricing Engine */}
                    <Card className="col-span-full lg:col-span-1 border-slate-200 shadow-sm bg-white ring-1 ring-blue-100">
                        <CardHeader className="bg-blue-50/50">
                            <CardTitle className="text-base font-medium flex items-center gap-2 text-blue-900">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                Smart Revenue Recovery
                            </CardTitle>
                            <CardDescription>AI-suggested clearance prices</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="mb-4">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-2 block">
                                    Target Medicine
                                </label>
                                <Select value={pricingDrug} onValueChange={setPricingDrug}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drugKeys.slice(0, 5).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="h-8 text-xs">Discount</TableHead>
                                        <TableHead className="h-8 text-xs">New Price</TableHead>
                                        <TableHead className="h-8 text-xs text-right">Est. Rev</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pricingStrategies.map((s, i) => (
                                        <TableRow key={i} className={s.discount_pct === 15 ? "bg-green-50" : ""}>
                                            <TableCell className="font-medium text-xs">
                                                {s.discount_pct}%
                                                {s.discount_pct === 15 && <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">Rec</Badge>}
                                            </TableCell>
                                            <TableCell className="text-xs">${s.price}</TableCell>
                                            <TableCell className="text-xs font-bold text-green-700 text-right">
                                                ${s.est_revenue}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-4 p-3 bg-blue-50 rounded-md text-xs text-blue-800">
                                <span className="font-bold">Insight:</span> 15% discount yields optimal revenue recovery for {pricingDrug} based on elasticity.
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
