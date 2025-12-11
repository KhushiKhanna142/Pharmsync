import React, { useState } from 'react';
import OutbreakHeatmap from '@/components/features/outbreak/OutbreakHeatmap';
import RealTimeDashboard from '@/components/features/outbreak/RealTimeDashboard';
import PredictiveTimeline from '@/components/features/outbreak/PredictiveTimeline';
import { TrendChart } from '@/components/features/outbreak/TrendChart';
import LiveActivityFeed from '@/components/features/outbreak/LiveActivityFeed';
import NationalHealthTicker from '@/components/features/outbreak/NationalHealthTicker';
import { StatsGrid } from '@/components/features/outbreak/StatsGrid';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Waves, Globe, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function OutbreakIntel() {
    const [activeTab, setActiveTab] = useState<'monitor' | 'predict' | 'analysis'>('monitor');

    // Mock Data for Charts
    const trendData = [
        { date: "2024-03-01", quantity: 120 },
        { date: "2024-03-02", quantity: 132 },
        { date: "2024-03-03", quantity: 101 },
        { date: "2024-03-04", quantity: 134 },
        { date: "2024-03-05", quantity: 190 }, // Spike
        { date: "2024-03-06", quantity: 230 }, // Spike
        { date: "2024-03-07", quantity: 210 }
    ];

    const stats = {
        active_outbreaks: 2,
        total_transactions_24h: 1245,
        system_status: "Operational",
        monitored_pincodes: 12
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 bg-slate-50/50 min-h-screen">

            {/* Ticker at Top */}
            <NationalHealthTicker />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Waves className="h-8 w-8 text-blue-600" />
                        Flu Radar Surveillance
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Real-time epidemiological monitoring to predict pharmacy demand surges.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant={activeTab === 'monitor' ? "default" : "outline"} onClick={() => setActiveTab('monitor')} size="sm">
                        <Globe className="mr-2 h-4 w-4" /> Monitor
                    </Button>
                    <Button variant={activeTab === 'predict' ? "default" : "outline"} onClick={() => setActiveTab('predict')} size="sm">
                        <ShieldAlert className="mr-2 h-4 w-4" /> Predict
                    </Button>
                </div>
            </div>

            <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-700 font-bold">Active Outbreak Alert</AlertTitle>
                <AlertDescription className="text-red-600">
                    Viral Influenza spike detected in Mumbai (Zone 400001). Stock multiplier (1.5x) active for Amoxicillin and Dolo 650.
                </AlertDescription>
            </Alert>

            {/* Main Dashboard Content */}
            <div className="space-y-6">

                {/* Real-time External Signals */}
                <RealTimeDashboard />

                {/* Heatmap Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Geospatial Transmission Map</h3>
                        <OutbreakHeatmap />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Live Reports</h3>
                        <LiveActivityFeed />
                    </div>
                </div>

                {/* Deep Dive Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PredictiveTimeline />
                    <TrendChart data={trendData} />
                </div>

                <StatsGrid stats={stats} />
            </div>

        </div>
    );
}
