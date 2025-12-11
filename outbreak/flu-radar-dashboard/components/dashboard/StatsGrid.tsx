import { Card } from "@/components/ui/card";
import { Activity, AlertTriangle, MapPin, ShieldCheck } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import React from "react";

function StatsGridComponent({ stats }: { stats: any }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 flex items-center space-x-4 border-l-4 border-l-red-500">
                <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Active Outbreaks</p>
                    <h3 className="text-2xl font-bold">
                        <AnimatedCounter value={stats.active_outbreaks || 0} />
                    </h3>
                </div>
            </Card>

            <Card className="p-6 flex items-center space-x-4 border-l-4 border-l-blue-500">
                <div className="p-3 bg-blue-100 rounded-full">
                    <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Transactions (24h)</p>
                    <h3 className="text-2xl font-bold">
                        <AnimatedCounter value={stats.total_transactions_24h || 0} duration={2000} />
                    </h3>
                </div>
            </Card>

            <Card className="p-6 flex items-center space-x-4 border-l-4 border-l-green-500">
                <div className="p-3 bg-green-100 rounded-full">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">System Status</p>
                    <h3 className="text-2xl font-bold">{stats.system_status || "Unknown"}</h3>
                </div>
            </Card>

            <Card className="p-6 flex items-center space-x-4 border-l-4 border-l-purple-500">
                <div className="p-3 bg-purple-100 rounded-full">
                    <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Monitored Areas</p>
                    <h3 className="text-2xl font-bold">
                        <AnimatedCounter value={stats.monitored_pincodes || 0} />
                    </h3>
                </div>
            </Card>
        </div>
    );
}

export const StatsGrid = React.memo(StatsGridComponent);
