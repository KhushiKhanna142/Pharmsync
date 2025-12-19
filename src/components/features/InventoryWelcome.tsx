import { Package, Pill } from "lucide-react";

interface InventoryWelcomeProps {
    onSelect: (view: 'inventory' | 'drugs') => void;
}

export function InventoryWelcome({ onSelect }: InventoryWelcomeProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-8 animate-in fade-in zoom-in duration-500">

            <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-primary">
                    Welcome to Inventory Management
                </h2>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                    Select an option below to manage your stock or browse the comprehensive drug database.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">

                {/* Inventory Items Card */}
                <div
                    onClick={() => onSelect('inventory')}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/50 text-center space-y-4 flex flex-col items-center justify-center h-80"
                >
                    <div className="p-4 rounded-full bg-blue-100/50 group-hover:bg-blue-100 transition-colors">
                        <Package className="h-12 w-12 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-foreground">Inventory Items</h3>
                        <p className="text-muted-foreground">
                            Manage stock levels, track batches, and monitor expiry dates.
                        </p>
                    </div>
                </div>

                {/* Drug Info Card */}
                <div
                    onClick={() => onSelect('drugs')}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/50 text-center space-y-4 flex flex-col items-center justify-center h-80"
                >
                    <div className="p-4 rounded-full bg-purple-100/50 group-hover:bg-purple-100 transition-colors">
                        <Pill className="h-12 w-12 text-purple-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-foreground">Drug Information</h3>
                        <p className="text-muted-foreground">
                            Access the master database of medicines, manufacturers, and ingredients.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
