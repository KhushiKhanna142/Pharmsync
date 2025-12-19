import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    DollarSign,
    Package,
    Search,
    TrendingUp,
    Clock,
    ArrowRight,
    RotateCcw,
    ChevronsUpDown,
    Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// --- Types ---
interface Batch {
    id: string;
    expiry: string;
    days_left: number;
    qty: number;
    price: number;
    status: "Critical" | "Warning" | "Good";
    value: number;
    supplier?: string;
    location?: string;
}

interface Drug {
    name: string;
    category?: string;
    status: "Critical" | "Warning" | "Good";
    total_stock: number;
    estimated_loss?: number;
    critical_batches: number;
    warning_batches: number;
    active_batches_count?: number;
    batches: Batch[];
}

interface ExpiryData {
    kpi: {
        critical_items: number;
        value_at_risk: number;
        potential_recovery: number;
        items_monitored: number;
    };
    drugs: Drug[];
}

export default function ExpiryManagement() {
    const [data, setData] = useState<ExpiryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [appliedBatches, setAppliedBatches] = useState<Set<string>>(new Set());
    const [manualModes, setManualModes] = useState<Set<string>>(new Set());
    const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"All" | "Critical" | "Warning" | "Good">("All");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("http://localhost:8000/expiry/alerts");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                    if (result.drugs.length > 0) {
                        setSelectedDrug(result.drugs[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching expiry alerts:", error);
                toast.error("Failed to load proactive expiry data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading inventory analysis...</div>;
    if (!data) return null;

    // Filter Logic
    const filteredDrugs = data.drugs.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "All" || d.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Helper: Pricing Logic
    const getDiscountStrategy = (status: string, price: number) => {
        if (status === "Critical") return { pct: 50, price: price * 0.5, label: "Aggressive Liquidation" };
        if (status === "Warning") return { pct: 25, price: price * 0.75, label: "Moderate Discount" };
        return { pct: 0, price: price, label: "Standard Price" };
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">

            {/* 1. Dashboard Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-rose-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpi.critical_items}</div>
                        <p className="text-xs text-muted-foreground">Expiring in ≤90 days</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Value at Risk</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(data.kpi.value_at_risk / 100000).toFixed(2)}L</div>
                        <p className="text-xs text-muted-foreground">Total potential loss</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Potential Recovery</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(data.kpi.potential_recovery / 100000).toFixed(2)}L</div>
                        <p className="text-xs text-muted-foreground">With dynamic pricing</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Items Monitored</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpi.items_monitored}</div>
                        <p className="text-xs text-muted-foreground">Total active batches</p>
                    </CardContent>
                </Card>
            </div>

            {/* MAIN CONTENT: Split Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)] min-h-[600px]">

                {/* 2. Drug Selection Panel (Left) */}
                <Card className="lg:col-span-4 flex flex-col h-full border-slate-200">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle>Medications</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search drugs..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant={filterStatus === 'Critical' ? 'destructive' : 'outline'} className="cursor-pointer" onClick={() => setFilterStatus(filterStatus === 'Critical' ? 'All' : 'Critical')}>Critical</Badge>
                            <Badge variant={filterStatus === 'Warning' ? 'default' : 'outline'} className="cursor-pointer bg-orange-500 hover:bg-orange-600 border-orange-500 text-white" onClick={() => setFilterStatus(filterStatus === 'Warning' ? 'All' : 'Warning')}>Warning</Badge>
                            <Badge variant={filterStatus === 'Good' ? 'secondary' : 'outline'} className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200" onClick={() => setFilterStatus(filterStatus === 'Good' ? 'All' : 'Good')}>Good</Badge>
                            {filterStatus !== 'All' && <Badge variant="outline" className="cursor-pointer text-xs" onClick={() => setFilterStatus('All')}>Clear</Badge>}
                        </div>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {filteredDrugs.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No drugs match filter.</div>
                            ) : filteredDrugs.map(drug => (
                                <button
                                    key={drug.name}
                                    onClick={() => setSelectedDrug(drug)}
                                    className={`w-full text-left px-3 py-3 rounded-lg flex items-center justify-between transition-colors ${selectedDrug?.name === drug.name
                                        ? "bg-slate-100 ring-1 ring-slate-200"
                                        : "hover:bg-slate-50"
                                        }`}
                                >
                                    <div>
                                        <div className="font-medium text-sm">{drug.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {drug.batches.length} batches • {drug.total_stock} units
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {drug.status === "Critical" && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Critical</Badge>}
                                        {drug.status === "Warning" && <Badge className="h-5 px-1.5 text-[10px] bg-orange-500 hover:bg-orange-600">Warning</Badge>}
                                        {drug.status === "Good" && <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-green-100 text-green-700">Good</Badge>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* 3. Batch Management (Right) */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto pr-1">
                    {selectedDrug ? (
                        <>
                            {/* Drug Header (Matched to Image) */}
                            <div>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        {/* Drug Selector Toolbar (Searchable Combobox) */}
                                        <div className="flex items-center gap-2">
                                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        role="combobox"
                                                        aria-expanded={openCombobox}
                                                        className="h-10 text-2xl font-bold p-0 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        {selectedDrug.name}
                                                        <ChevronsUpDown className="ml-1 h-5 w-5 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search medicine..." />
                                                        <CommandList>
                                                            <CommandEmpty>No medicine found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {data.drugs.map((drug) => (
                                                                    <CommandItem
                                                                        key={drug.name}
                                                                        value={drug.name}
                                                                        onSelect={(currentValue) => {
                                                                            // Command usually lowercases values, so we might need to find case-insensitive or rely on value match
                                                                            // If value={drug.name}, cmdk usually preserves it but filtering is lowercase.
                                                                            // Let's try to find exact or case-insensitive match
                                                                            const newDrug = data.drugs.find(d => d.name === currentValue || d.name.toLowerCase() === currentValue.toLowerCase());
                                                                            if (newDrug) setSelectedDrug(newDrug);
                                                                            setOpenCombobox(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                selectedDrug.name === drug.name ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {drug.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <p className="text-slate-500 text-sm">
                                            {selectedDrug.category || "General"} • {selectedDrug.active_batches_count || selectedDrug.batches.length} Active Batches
                                        </p>
                                    </div>
                                    <div className="flex gap-2">

                                        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-1.5 bg-white shadow-sm">
                                            <span className="text-sm font-medium text-slate-700">Good ({">"}180d)</span>
                                            {/* Select would go here, mock for now */}
                                        </div>
                                        <Button variant="outline" size="icon" className="h-9 w-9">
                                            <Package className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* 4 Summary Cards Row */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Total Stock</div>
                                    <div className="text-2xl font-bold text-slate-900">{selectedDrug.total_stock}</div>
                                    <div className="text-xs text-slate-500 mt-1">units</div>
                                </div>
                                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                                    <div className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-1">Estimated Loss</div>
                                    <div className="text-2xl font-bold text-slate-900 truncate" title={`₹${selectedDrug.estimated_loss?.toLocaleString()}`}>
                                        ₹{selectedDrug.estimated_loss?.toLocaleString() || "0"}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">if expired</div>
                                </div>
                                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                    <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Movement Rate</div>
                                    <div className="text-2xl font-bold text-slate-900">High</div>
                                    <div className="text-xs text-slate-500 mt-1">velocity</div>
                                </div>
                                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                    <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">Return Eligible</div>
                                    <div className="text-2xl font-bold text-slate-900">Yes</div>
                                    <div className="text-xs text-slate-500 mt-1">to supplier</div>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mt-4">Batch Details & Pricing</h3>

                            {/* Batch Cards List */}
                            <div className="space-y-6">
                                {selectedDrug.batches.map(batch => {
                                    const strategy = getDiscountStrategy(batch.status, batch.price);
                                    const isWarning = batch.status === "Warning";
                                    const isCritical = batch.status === "Critical";
                                    const isGood = batch.status === "Good";

                                    // Custom Pricing Logic
                                    const isManual = manualModes.has(batch.id);
                                    const customPrice = customPrices[batch.id];
                                    const finalPrice = isManual && customPrice !== undefined ? customPrice : strategy.price;
                                    const discountPct = isManual ? Math.round(((batch.price - finalPrice) / batch.price) * 100) : strategy.pct;

                                    // Style logic based on Mockup (Yellow for Warning, etc)
                                    let cardBg = "bg-white";
                                    let borderColor = "border-slate-200";
                                    if (isWarning) { cardBg = "bg-yellow-50/50"; borderColor = "border-yellow-400"; }
                                    if (isCritical) { cardBg = "bg-rose-50/50"; borderColor = "border-rose-400"; }
                                    if (isGood) { cardBg = "bg-green-50/50"; borderColor = "border-green-400"; }

                                    const isApplied = appliedBatches.has(batch.id);

                                    return (
                                        <Card key={batch.id} className={`shadow-sm border-2 ${borderColor} ${cardBg} overflow-hidden`}>
                                            <CardContent className="p-6">
                                                {/* Card Header: Batch ID + Badges */}
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg font-bold text-slate-900">{batch.id}</span>

                                                        {isWarning && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">WARNING</Badge>}
                                                        {isCritical && <Badge variant="destructive">CRITICAL</Badge>}
                                                        {isGood && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">GOOD</Badge>}

                                                        {(isWarning || isCritical) && (
                                                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                                                                % {discountPct}% OFF
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Batch Metadata Grid */}
                                                <div className="grid grid-cols-3 gap-8 mb-6">
                                                    <div>
                                                        <div className="text-sm text-slate-500 mb-1">Quantity</div>
                                                        <div className="font-bold text-slate-900">{batch.qty} units</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-slate-500 mb-1">Location</div>
                                                        <div className="font-medium text-slate-900">{batch.location || "Shelf A-13"}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-slate-500 mb-1">Supplier</div>
                                                        <div className="font-medium text-slate-900">{batch.supplier || "PharmaCorp"}</div>
                                                    </div>
                                                </div>

                                                {/* Timeline */}
                                                <div className="mb-6">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                                                            <Clock className="h-4 w-4" />
                                                            <span>Expires: {batch.expiry}</span>
                                                        </div>
                                                        <span className={`text-sm font-bold ${isCritical ? "text-rose-600" : isWarning ? "text-green-600" : "text-green-600"
                                                            }`}>
                                                            {batch.days_left} days remaining
                                                        </span>
                                                    </div>
                                                    {/* Custom Progress Bar Style */}
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${isCritical ? "bg-rose-500" :
                                                                isWarning ? "bg-green-500" : "bg-green-500"
                                                                }`}
                                                            style={{ width: `${Math.min(100, (batch.days_left / 180) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dynamic Pricing Box (Only if not Good) */}
                                                {!isGood && (
                                                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                                                <span className="font-bold text-slate-900 text-sm">Dynamic Pricing Recommendation</span>
                                                            </div>

                                                            {/* User Toggle: Manual Price */}
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    id={`manual-mode-${batch.id}`}
                                                                    checked={isManual}
                                                                    onCheckedChange={(checked) => {
                                                                        const next = new Set(manualModes);
                                                                        if (checked) next.add(batch.id);
                                                                        else next.delete(batch.id);
                                                                        setManualModes(next);
                                                                        // Reset custom price if toggled off
                                                                        if (!checked) {
                                                                            const nextPrices = { ...customPrices };
                                                                            delete nextPrices[batch.id];
                                                                            setCustomPrices(nextPrices);
                                                                        }
                                                                    }}
                                                                    disabled={isApplied} // Lock editing if already applied
                                                                />
                                                                <Label htmlFor={`manual-mode-${batch.id}`} className="text-sm font-medium text-slate-600">Custom Price</Label>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-8 mb-6">
                                                            <div>
                                                                <div className="text-xs text-slate-500 uppercase font-medium mb-1">Original Price</div>
                                                                <div className={`text-lg font-bold ${isApplied ? "text-slate-300 line-through" : "text-slate-400 line-through"}`}>₹{batch.price.toFixed(2)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-slate-500 uppercase font-medium mb-1">{isApplied ? "New Active Price" : (isManual ? "Custom Price" : "Suggested Price")}</div>
                                                                {isManual && !isApplied ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-green-600 font-bold text-lg">₹</span>
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 w-24 text-lg font-bold text-green-600 border-green-200 focus transition-all"
                                                                            value={customPrice || ""}
                                                                            onChange={(e) => {
                                                                                const val = parseFloat(e.target.value);
                                                                                setCustomPrices(prev => ({ ...prev, [batch.id]: val }));
                                                                            }}
                                                                            placeholder={strategy.price.toString()}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className={`text-2xl font-bold ${isApplied ? "text-slate-900" : "text-green-600"}`}>₹{finalPrice.toFixed(2)}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-slate-500 uppercase font-medium mb-1">Potential Revenue</div>
                                                                <div className="text-xl font-bold text-blue-600">₹{(finalPrice * batch.qty).toFixed(0)}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <Button
                                                                className={`flex-1 font-medium h-10 ${isApplied ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                                                                onClick={() => {
                                                                    setAppliedBatches(prev => new Set(prev).add(batch.id));
                                                                    toast.success(`Price updated to ₹${finalPrice.toFixed(2)} for batch ${batch.id}`);
                                                                }}
                                                                disabled={isApplied || (isManual && !customPrice)}
                                                            >
                                                                {isApplied ? (
                                                                    <>
                                                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Price Applied
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <DollarSign className="h-4 w-4 mr-2" /> Apply Pricing
                                                                    </>
                                                                )}
                                                            </Button>

                                                            {/* Revert / Move to Front Button */}
                                                            {isApplied ? (
                                                                <Button
                                                                    variant="outline"
                                                                    className="flex-1 bg-white hover:bg-red-50 text-red-600 border-red-200 font-medium h-10"
                                                                    onClick={() => {
                                                                        const next = new Set(appliedBatches);
                                                                        next.delete(batch.id);
                                                                        setAppliedBatches(next);
                                                                        toast.info(`Price reverted for batch ${batch.id}`);
                                                                    }}
                                                                >
                                                                    <RotateCcw className="h-4 w-4 mr-2" /> Revert
                                                                </Button>
                                                            ) : (
                                                                <Button variant="outline" className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-medium h-10">
                                                                    Move to Front
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Good Batch Actions */}
                                                {isGood && (
                                                    <div className="flex gap-3 mt-4">
                                                        <div className="flex-1 p-3 bg-green-50 rounded border border-green-100 text-green-800 text-sm flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4" /> Stock level healthy. No action required.
                                                        </div>
                                                    </div>
                                                )}

                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            Select a medication to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
