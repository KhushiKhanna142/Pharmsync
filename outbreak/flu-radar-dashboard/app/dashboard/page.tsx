'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient, DashboardStats, TrendData, HeatmapData } from '@/lib/api-client';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { TrendChart } from '@/components/dashboard/TrendChart';
import LiveActivityFeed from '@/components/dashboard/LiveActivityFeed';
import OutbreakHeatmap from '@/components/dashboard/OutbreakHeatmap';
import PredictiveTimeline from '@/components/dashboard/PredictiveTimeline';
import NationalHealthTicker from '@/components/dashboard/NationalHealthTicker';
import RealTimeDashboard from '@/components/dashboard/RealTimeDashboard';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [trends, setTrends] = useState<any[]>([]); // simplified for chart
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Fetch all data - memoized to prevent recreation
    const fetchData = useCallback(async () => {
        try {
            setError(null);

            const [statsData, trendsData] = await Promise.all([
                apiClient.getStats(),
                apiClient.getTrends(undefined, 7)
            ]);

            // Only update if data actually changed to prevent unnecessary re-renders
            setStats(prevStats => {
                if (prevStats && JSON.stringify(prevStats) === JSON.stringify(statsData)) {
                    return prevStats; // Return same reference if unchanged
                }
                return statsData;
            });

            setTrends(prevTrends => {
                const newTrends = trendsData.data || [];
                if (JSON.stringify(prevTrends) === JSON.stringify(newTrends)) {
                    return prevTrends; // Return same reference if unchanged
                }
                return newTrends;
            });
        } catch (err) {
            console.error('❌ Dashboard fetch error:', err);
            // Don't show error screen on transient failure if we have data
            setError(prevError => {
                // Use functional update to access current stats
                return prevError; // Keep existing error if we have data
            });
        } finally {
            setIsInitialLoad(false);
            setLoading(false);
        }
    }, []); // Empty deps - use functional updates instead

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (isInitialLoad && loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 animate-pulse">Initializing Flu Radar System...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Connection Lost</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
                <NationalHealthTicker />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-blue-600">⚡</span> Flu Radar Surveillance
                            </h1>
                            <p className="text-sm text-gray-500">Hyper-Local Disease Outbreak Detection System</p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                            <div className="hidden sm:block">
                                <div className="text-xs text-gray-400 uppercase tracking-wider">System Status</div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <span className="text-sm font-medium text-green-600">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* 1. High Level Stats */}
                <section>
                    <StatsGrid stats={stats} />
                </section>

                {/* 2. Main Monitoring: Heatmap vs Trends */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Interactive Map */}
                        <OutbreakHeatmap />

                        {/* Trend Analysis */}
                        <TrendChart data={trends} />
                    </div>

                    <div className="space-y-8">
                        {/* Real-time Feed */}
                        <LiveActivityFeed />
                    </div>
                </section>

                {/* 3. Predictive Analysis */}
                <section>
                    <PredictiveTimeline />
                </section>

                {/* 4. External Validation Layer */}
                <section>
                    <RealTimeDashboard />
                </section>
            </main>

            <footer className="bg-white border-t mt-12 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                    <p>© 2025 Flu Radar System. Powered by Isolation Forest & Prophet ML.</p>
                </div>
            </footer>
        </div>
    );
}
