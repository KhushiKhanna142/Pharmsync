import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Search,
    ShoppingCart,
    Trash2,
    CreditCard,
    Plus,
    Minus,
    Check,
    ChevronsUpDown,
    Printer,
    User,
    PackagePlus,
    Calendar as CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Types
interface InventoryItem {
    med_name: string;
    batch_id: string;
    expiry_date: string;
    quantity: number;
    price: number;
    days_left: number;
}

interface CartItem extends InventoryItem {
    cart_qty: number;
}

export default function Billing() {
    const [loading, setLoading] = useState(true);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [openCombobox, setOpenCombobox] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Stock Entry State
    const [stockLoading, setStockLoading] = useState(false);
    const [newItem, setNewItem] = useState({
        med_name: "",
        batch_id: "",
        expiry_date: "",
        quantity: 0,
        cost_price: 0
    });

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:8000/expiry/alerts");
            if (res.ok) {
                const data = await res.json();
                const flatList: InventoryItem[] = [];
                data.drugs.forEach((drug: any) => {
                    drug.batches.forEach((batch: any) => {
                        if (batch.qty > 0) {
                            flatList.push({
                                med_name: drug.name,
                                batch_id: batch.id,
                                expiry_date: batch.expiry,
                                quantity: batch.qty,
                                price: batch.price,
                                days_left: batch.days_left
                            });
                        }
                    });
                });
                setInventory(flatList);
            }
        } catch (error) {
            console.error("Failed to load inventory:", error);
            toast.error("Could not load inventory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // Cart Logic
    const addToCart = (item: InventoryItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.batch_id === item.batch_id);
            if (existing) {
                if (existing.cart_qty >= item.quantity) {
                    toast.error("Max stock reached for this batch.");
                    return prev;
                }
                return prev.map(i => i.batch_id === item.batch_id ? { ...i, cart_qty: i.cart_qty + 1 } : i);
            }
            return [...prev, { ...item, cart_qty: 1 }];
        });
        setOpenCombobox(false);
        toast.success(`Added ${item.med_name}`);
    };

    const updateQty = (batchId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.batch_id === batchId) {
                const newQty = item.cart_qty + delta;
                if (newQty > item.quantity) {
                    toast.error("Exceeds available stock.");
                    return item;
                }
                if (newQty < 1) return item;
                return { ...item, cart_qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (batchId: string) => {
        setCart(prev => prev.filter(i => i.batch_id !== batchId));
    };

    const calculateTotal = () => {
        return cart.reduce((acc, item) => acc + (item.price * item.cart_qty), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error("Cart is empty.");
            return;
        }
        setCheckoutLoading(true);
        try {
            const payload = {
                items: cart.map(i => ({
                    med_name: i.med_name,
                    batch_id: i.batch_id,
                    quantity: i.cart_qty,
                    price: i.price
                }))
            };

            const res = await fetch("http://localhost:8000/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Transaction failed");
            }

            toast.success("Transaction completed successfully!");
            console.log("RECEIPT", payload);
            setCart([]);
            setCustomerName("");
            fetchInventory(); // Refresh stock

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleStockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStockLoading(true);
        try {
            const res = await fetch("http://localhost:8000/inventory/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem)
            });

            if (!res.ok) {
                throw new Error("Failed to add stock");
            }

            toast.success("Stock added successfully!");
            setNewItem({ med_name: "", batch_id: "", expiry_date: "", quantity: 0, cost_price: 0 });
            fetchInventory(); // Refresh
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setStockLoading(false);
        }
    };

    return (
        <div className="pt-6 h-[calc(100vh-100px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing & Inventory</h1>
                <div className="flex gap-2">
                    <Button variant="outline"><Printer className="h-4 w-4 mr-2" /> Reprint Last</Button>
                </div>
            </div>

            <Tabs defaultValue="billing" className="h-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                    <TabsTrigger value="billing">POS Billing</TabsTrigger>
                    <TabsTrigger value="stock">Stock Entry</TabsTrigger>
                </TabsList>

                <TabsContent value="billing" className="h-full mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                        {/* LEFT: Product Selection */}
                        <Card className="lg:col-span-7 flex flex-col h-full border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Search className="h-5 w-5 text-slate-500" /> Item Lookup
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label>Customer Name (Optional)</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-9"
                                            placeholder="Walk-in Customer"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Search Medicine</Label>
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCombobox}
                                                className="w-full justify-between h-12 text-lg px-4"
                                            >
                                                Select Medicine / Scan Barcode...
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[600px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Type brand or generic name..." className="h-12 text-lg" />
                                                <CommandList className="max-h-[400px]">
                                                    <CommandEmpty>No medicine found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {inventory.map((item) => (
                                                            <CommandItem
                                                                key={`${item.med_name}-${item.batch_id}`}
                                                                value={`${item.med_name} ${item.batch_id}`}
                                                                onSelect={() => addToCart(item)}
                                                                className="p-3 cursor-pointer"
                                                            >
                                                                <div className="flex justify-between items-center w-full">
                                                                    <div>
                                                                        <div className="font-bold text-base">{item.med_name}</div>
                                                                        <div className="text-xs text-slate-500">
                                                                            Batch: {item.batch_id} • Exp: {item.expiry_date}
                                                                            {item.days_left <= 90 && <span className="text-red-500 font-bold ml-2">(Expiring Soon)</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-bold text-green-600">₹{item.price.toFixed(2)}</div>
                                                                        <div className="text-xs text-slate-500">{item.quantity} available</div>
                                                                    </div>
                                                                </div>
                                                                <Check className={cn("ml-2 h-4 w-4", cart.some(c => c.batch_id === item.batch_id) ? "opacity-100" : "opacity-0")} />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="text-blue-600 font-bold text-lg mb-1">{inventory.length}</div>
                                        <div className="text-sm text-slate-600">Total Batches Active</div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                        <div className="text-green-600 font-bold text-lg mb-1">Online</div>
                                        <div className="text-sm text-slate-600">System Status</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* RIGHT: Bill / Cart */}
                        <Card className="lg:col-span-5 flex flex-col h-full border-slate-200 shadow-lg ring-1 ring-slate-100">
                            <CardHeader className="bg-slate-900 text-white rounded-t-xl py-4">
                                <CardTitle className="flex justify-between items-center">
                                    <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Current Bill</span>
                                    <span className="text-sm font-normal text-slate-400">#INV-{Math.floor(Date.now() / 1000).toString().slice(-6)}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 flex flex-col">
                                <div className="flex-1 overflow-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0">
                                            <TableRow>
                                                <TableHead className="w-[40%]">Item</TableHead>
                                                <TableHead className="w-[30%] text-center">Qty</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="w-[10%]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-40 text-center text-slate-400">Cart is empty.</TableCell>
                                                </TableRow>
                                            ) : (
                                                cart.map((item) => (
                                                    <TableRow key={item.batch_id}>
                                                        <TableCell>
                                                            <div className="font-medium">{item.med_name}</div>
                                                            <div className="text-xs text-slate-500">{item.batch_id}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.batch_id, -1)}><Minus className="h-3 w-3" /></Button>
                                                                <span className="w-4 text-center text-sm font-bold">{item.cart_qty}</span>
                                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.batch_id, 1)}><Plus className="h-3 w-3" /></Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">₹{(item.price * item.cart_qty).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => removeFromCart(item.batch_id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-6 bg-slate-50 border-t space-y-3">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Subtotal</span>
                                        <span>₹{calculateTotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Tax (18% GST)</span>
                                        <span>₹{(calculateTotal() * 0.18).toFixed(2)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-bold text-xl text-slate-900">Total</span>
                                        <span className="font-bold text-2xl text-blue-600">₹{(calculateTotal() * 1.18).toFixed(2)}</span>
                                    </div>
                                    <Button
                                        size="lg"
                                        className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg shadow-md"
                                        onClick={handleCheckout}
                                        disabled={checkoutLoading || cart.length === 0}
                                    >
                                        {checkoutLoading ? "Processing..." : <><CreditCard className="mr-2 h-5 w-5" /> Checkout</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="stock">
                    <Card className="max-w-2xl mx-auto shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PackagePlus className="h-6 w-6 text-blue-600" /> Add New Stock
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleStockSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Medicine Name</Label>
                                    <Input
                                        required
                                        value={newItem.med_name}
                                        onChange={e => setNewItem({ ...newItem, med_name: e.target.value })}
                                        placeholder="e.g. Paracetamol 500mg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Batch ID</Label>
                                        <Input
                                            required
                                            value={newItem.batch_id}
                                            onChange={e => setNewItem({ ...newItem, batch_id: e.target.value })}
                                            placeholder="e.g. BATCH-001"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Expiry Date</Label>
                                        <Input
                                            required
                                            type="date"
                                            value={newItem.expiry_date}
                                            onChange={e => setNewItem({ ...newItem, expiry_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Quantity</Label>
                                        <Input
                                            required
                                            type="number"
                                            min="1"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Cost Price (per unit)</Label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newItem.cost_price}
                                            onChange={e => setNewItem({ ...newItem, cost_price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 text-lg" disabled={stockLoading}>
                                    {stockLoading ? "Adding..." : "Add to Inventory"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
