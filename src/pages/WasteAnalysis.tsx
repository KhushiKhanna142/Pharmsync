import { useEffect, useState } from "react";
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    DollarSign,
    Package,
    Download,
    Filter,
    ChevronsRight,
    Activity,
    Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface WasteMetrics {
    kpi: {
        total_waste_units: number;
        total_waste_value: number;
        expired_items_count: number;
        expiring_soon_count?: number; // Added new metric
        waste_percentage: number;
        overstock_count?: number;
    };
    top_wasted: {
        medication: string;
        quantity_wasted: number;
        value: number;
        primary_reason: string;
        expiry_date: string;
    }[];
    categories: {
        name: string;
        value: number;
        percentage: number;
    }[];
    overstock_items?: {
        med_name: string;
        quantity: number;
        value: number;
    }[];
}

export default function WasteAnalysis() {
    const [data, setData] = useState<WasteMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedReason, setSelectedReason] = useState<string>("All");
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("http://localhost:8000/waste/analytics");
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching waste analytics:", error);
                toast.error("Failed to load waste data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredWaste = data?.top_wasted.filter(item => {
        if (selectedReason === "All") return true;
        // Normalize comparison (handle "Expired" vs "Expiration")
        const reason = item.primary_reason.toLowerCase();
        const filter = selectedReason.toLowerCase();
        if (filter === "expired") return reason === "expired" || reason === "expiration";
        return reason.includes(filter);
    }) || [];

    const handleDownload = () => {
        setShowReport(true);
    };

    if (loading) {
        return <div className="p-8 flex items-center justify-center min-h-[400px]">Loading waste logs...</div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory Waste Analysis</h1>
                    <p className="text-muted-foreground mt-1">Track, analyze, and reduce pharmacy medication waste</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Last Month
                    </Button>
                    <Button variant="outline" className="gap-2">
                        All Categories
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <Download className="h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Waste Units</CardTitle>
                        <Package className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpi.total_waste_units.toLocaleString()}</div>
                        <div className="flex items-center text-xs text-rose-500 bg-rose-50 px-2 py-1 rounded w-fit mt-1">
                            +5.2% <span className="text-muted-foreground ml-1">last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Waste Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.kpi.total_waste_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className="flex items-center text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded w-fit mt-1">
                            +3.8% <span className="text-muted-foreground ml-1">last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Waste Percentage</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpi.waste_percentage}%</div>
                        <div className="flex items-center text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded w-fit mt-1">
                            3.2% <span className="text-muted-foreground ml-1">vs target</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expired Items</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpi.expired_items_count.toLocaleString()}</div>
                        <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded w-fit mt-1 font-medium">
                            Critical Action Needed
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Section: Categories & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-3">

                {/* Waste by Category */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Waste by Category</CardTitle>
                        <CardDescription>Breakdown of value lost by reason (Real-time Inventory Data)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {data.categories.map((cat, i) => {
                            // Assign distinct colors based on index
                            const colors = [
                                "bg-rose-500", // Expired
                                "bg-orange-500", // Damaged
                                "bg-blue-500", // Temperature
                                "bg-yellow-500" // Others
                            ];
                            const colorClass = colors[i % colors.length];

                            return (
                                <div key={cat.name} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                                            <span className="font-medium">{cat.name}</span>
                                        </div>
                                        <span className="font-bold">{cat.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${colorClass}`}
                                                style={{ width: `${cat.percentage}%` }}
                                            />
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            ₹{cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Button variant="destructive" className="justify-start bg-rose-50 text-rose-700 hover:bg-rose-100 border-none" onClick={() => setSelectedReason("Expired")}>
                                View Expiring Soon ({data.kpi.expiring_soon_count || 0})
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" className="justify-start bg-orange-50 text-orange-700 hover:bg-orange-100">
                                        Overstock Alerts ({data.kpi.overstock_count || 0})
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Overstock Alerts</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <p className="text-sm text-muted-foreground">Items with excess inventory ({'>'}300 units).</p>
                                        <div className="grid gap-2">
                                            {(!data.overstock_items || data.overstock_items.length === 0) ? (
                                                <p className="text-muted-foreground text-sm">No items found.</p>
                                            ) : (
                                                data.overstock_items.map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                                                        <span className="font-medium">{item.med_name}</span>
                                                        <div className="text-right">
                                                            <div className="font-bold">{item.quantity} units</div>
                                                            <div className="text-xs text-muted-foreground">₹{item.value?.toLocaleString()} value</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Button variant="secondary" className="justify-start bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={handleDownload}>
                                Generate Waste Report
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Waste Reduction Goal</CardTitle>
                                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">Monthly Target</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span className="font-bold">82% Complete</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[82%]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Top Wasted Medications Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Wasted Medications</CardTitle>
                    <CardDescription>Highest value items designated as waste (Expired)</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>MEDICATION</TableHead>
                                <TableHead>QUANTITY WASTED</TableHead>
                                <TableHead>VALUE</TableHead>
                                <TableHead className="w-[200px]">
                                    <Select value={selectedReason} onValueChange={setSelectedReason}>
                                        <SelectTrigger className="h-8 w-full border-none shadow-none font-bold text-muted-foreground hover:text-foreground p-0">
                                            <SelectValue placeholder="PRIMARY REASON" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Reasons</SelectItem>
                                            <SelectItem value="Expired">Expired</SelectItem>
                                            <SelectItem value="Damaged">Damaged</SelectItem>
                                            <SelectItem value="Temperature Excursion">Temperature Excursion</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredWaste.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                        No items found matching the selected reason.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredWaste.slice(0, 5).map((item, index) => (
                                    <TableRow key={`${item.medication}-${index}`}>
                                        <TableCell className="font-medium">{item.medication}</TableCell>
                                        <TableCell>{item.quantity_wasted} units</TableCell>
                                        <TableCell>₹{item.value.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-medium">
                                                {item.primary_reason}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {/* Report Dialog */}
            <Dialog open={showReport} onOpenChange={setShowReport}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Waste Analysis Report</DialogTitle>
                        <CardDescription>Generated on {new Date().toLocaleDateString()}</CardDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4" id="printable-report">
                        {/* Summary Header */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="font-bold text-lg mb-4 text-slate-800">Executive Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-muted-foreground text-sm">Total Value Lost:</span>
                                    <div className="text-2xl font-bold text-rose-600">₹{data.kpi.total_waste_value.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm">Waste Ratio:</span>
                                    <div className="text-2xl font-bold text-blue-600">{data.kpi.waste_percentage}%</div>
                                </div>
                                <div className="col-span-2 border-t pt-2 mt-2">
                                    <span className="text-muted-foreground text-sm">Primary Contributor:</span>
                                    <div className="font-semibold">{data.categories?.[0]?.name || "N/A"} ({data.categories?.[0]?.percentage?.toFixed(1) || 0}%)</div>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div>
                            <h4 className="font-semibold mb-2">Category Breakdown</h4>
                            <div className="space-y-2">
                                {data.categories.map((cat, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                                        <span>{cat.name}</span>
                                        <span className="font-mono">₹{cat.value.toLocaleString()} ({cat.percentage.toFixed(1)}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Offenders */}
                        <div>
                            <h4 className="font-semibold mb-2">High Value Loss Items</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="h-8">Item</TableHead>
                                        <TableHead className="h-8 text-right">Value</TableHead>
                                        <TableHead className="h-8">Reason</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.top_wasted.slice(0, 5).map((item, i) => (
                                        <TableRow key={i} className="h-10">
                                            <TableCell className="font-medium py-2">{item.medication}</TableCell>
                                            <TableCell className="text-right py-2">₹{item.value.toLocaleString()}</TableCell>
                                            <TableCell className="py-2 text-xs text-muted-foreground">{item.primary_reason}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border-blue-100">
                            <strong>AI Recommendation:</strong> High expiration rate detected in {data.categories?.[0]?.name || "Antibiotics"}.
                            Recommend adjusting safety stock for low-turnover items.
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowReport(false)}>Close</Button>
                        <Button onClick={() => window.print()} className="gap-2">
                            <Printer className="h-4 w-4" /> Print / Save PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
