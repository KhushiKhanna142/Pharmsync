"use client";
import React, { useState, useEffect } from 'react';
import { Activity, Cloud, TrendingUp, AlertCircle, Wifi, WifiOff, Zap } from 'lucide-react';

// Real API clients
const diseaseAPI = {
    getIndiaStats: async () => {
        try {
            const res = await fetch('https://disease.sh/v3/covid-19/countries/India');
            return await res.json();
        } catch (e) {
            console.error("Disease API Error", e);
            return null;
        }
    },

    getHistoricalData: async (days = 7) => {
        try {
            const res = await fetch(`https://disease.sh/v3/covid-19/historical/India?lastdays=${days}`);
            return await res.json();
        } catch (e) {
            console.error("Historical API Error", e);
            return null;
        }
    }
};

const weatherAPI = {
    getCurrentWeather: async (city = 'Mumbai') => {
        try {
            // Using free weather API (no key needed for demo)
            const res = await fetch(`https://wttr.in/${city}?format=j1`);
            return await res.json();
        } catch (e) {
            console.error("Weather API Error", e);
            return null;
        }
    }
};

const RealTimeDashboardComponent = () => {
    const [liveData, setLiveData] = useState<any>({
        covid: null,
        weather: null,
        trends: [],
        lastUpdate: null,
        isConnected: false,
        dailyFallBack: 0
    });

    const [syntheticSpike, setSyntheticSpike] = useState(false);

    // Fetch real data every 60 seconds
    useEffect(() => {
        const fetchRealData = async () => {
            try {
                // Parallel fetch for speed
                const [covidData, weatherData, historicalData] = await Promise.all([
                    diseaseAPI.getIndiaStats(),
                    weatherAPI.getCurrentWeather('Mumbai'),
                    diseaseAPI.getHistoricalData(7)
                ]);

                // Only update if we have valid data (stale-while-revalidate pattern)
                if (covidData) {
                    let trends: any[] = [];
                    let dailyFallBack = 0;

                    if (historicalData && historicalData.timeline) {
                        const dates = Object.keys(historicalData.timeline.cases);
                        const cases = Object.values(historicalData.timeline.cases);
                        const deaths = Object.values(historicalData.timeline.deaths);

                        trends = dates.map((date, i) => ({
                            date,
                            cases: cases[i],
                            deaths: deaths[i]
                        }));

                        if (cases.length >= 2) {
                            dailyFallBack = Number(cases[cases.length - 1]) - Number(cases[cases.length - 2]);
                        }
                    }

                    // Use functional update to avoid stale closure and prevent unnecessary re-renders
                    setLiveData((prev: any) => ({
                        covid: covidData,
                        weather: weatherData?.current_condition?.[0] || prev.weather, // Keep old weather if new fails
                        trends: trends.slice(-7),
                        lastUpdate: new Date(),
                        isConnected: true,
                        dailyFallBack: dailyFallBack > 0 ? dailyFallBack : 0
                    }));
                } else {
                    // If data fetch failed but we have previous data, just mark connected=false but keep data
                    setLiveData((prev: any) => {
                        if (!prev.covid) {
                            // Only if we have NO data at all do we treat it as a failure that affects UI
                            console.warn("Initial data fetch failed");
                        }
                        return prev; // Don't update if we have existing data
                    });
                }
            } catch (error) {
                console.error('Failed to fetch real data:', error);
                // Keep old data on error - no state update needed
            }
        };

        fetchRealData();
        const interval = setInterval(fetchRealData, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []); // Empty deps is fine since we use functional updates

    // Simulate outbreak spike (for demo purposes)
    const triggerDemoSpike = () => {
        setSyntheticSpike(true);
        setTimeout(() => setSyntheticSpike(false), 10000); // Reset after 10 seconds
    };

    const { covid, weather, lastUpdate, isConnected, dailyFallBack } = liveData;
    const isLoaded = !!covid;

    // Strict Live Data Usage (No Simulated Fallbacks)
    const todaysCases = covid?.todayCases || 0;

    // Logic: If Today is 0 (due to UTC reset), show Yesterday's Real Data
    const displayCases = todaysCases > 0 ? todaysCases : dailyFallBack;
    const isUsingFallback = todaysCases === 0 && dailyFallBack > 0;

    const activeCases = covid?.active || 0;
    const recoveredCases = covid?.todayRecovered || 0;

    // Only apply spike multiplier if user triggers simulation
    const spikeMultiplier = syntheticSpike ? 3.5 : 1;
    const finalDisplayedCases = Math.round(displayCases * spikeMultiplier);

    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl border border-blue-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Wifi className="w-6 h-6 text-blue-600" />
                        External Signal Validation
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Correlating local pharmacy spikes with Real-time External Data (Disease.sh + Weather)
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Connection status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isConnected ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                        {!isLoaded ? (
                            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                        ) : (
                            <>
                                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {isConnected ? 'Live Connected' : 'Offline'}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Demo spike button */}
                    <button
                        onClick={triggerDemoSpike}
                        disabled={syntheticSpike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md active:scale-95 ${syntheticSpike
                            ? 'bg-red-500 ring-4 ring-red-200 cursor-not-allowed'
                            : 'bg-gray-900 hover:bg-gray-800'
                            }`}
                    >
                        <Zap className={`w-4 h-4 ${syntheticSpike ? 'fill-current' : ''}`} />
                        {syntheticSpike ? 'SIMULATING SURGE...' : 'Simulate External Surge'}
                    </button>
                </div>
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Cases Metric */}
                <div className={`bg-white rounded-xl shadow-sm border p-5 transition-all duration-500 ${syntheticSpike ? 'border-red-500 ring-4 ring-red-100 scale-105' : 'border-gray-100'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <Activity className={`w-5 h-5 ${syntheticSpike ? 'text-red-500' : 'text-blue-500'}`} />
                        {syntheticSpike && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full animate-pulse">
                                SURGE DETECTED
                            </span>
                        )}
                    </div>

                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {isUsingFallback ? "Yesterday's Cases (India)" : "India Daily Cases"}
                    </div>

                    <div className={`text-3xl font-bold tracking-tight ${syntheticSpike ? 'text-red-600' : 'text-gray-900'}`}>
                        {!isLoaded ? <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" /> : finalDisplayedCases.toLocaleString()}
                    </div>

                    {syntheticSpike ? (
                        <div className="mt-2 text-xs text-red-600 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +250% vs predicted
                        </div>
                    ) : (
                        <div className="mt-2 text-xs text-gray-400">
                            {isUsingFallback ? "Latest confirmed close (Disease.sh)" : "Real-time from Disease.sh"}
                        </div>
                    )}
                </div>

                {/* Active Cases */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Active Caseload</div>
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                        {!isLoaded ? <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" /> : activeCases.toLocaleString()}
                    </div>
                    <div className="mt-2 text-xs text-green-600 font-medium">
                        {!isLoaded ? <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /> : `${recoveredCases.toLocaleString()} recovered today`}
                    </div>
                </div>

                {/* Weather Data */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-2">
                        <Cloud className="w-5 h-5 text-sky-500" />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mumbai Conditions</div>
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                        {!isLoaded ? <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" /> : `${weather?.temp_C || '--'}°C`}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        {!isLoaded ? (
                            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                        ) : (
                            <>
                                <span>Humidity: {weather?.humidity || '--'}%</span>
                                <span className="text-gray-300">|</span>
                                <span>{weather?.weatherDesc?.[0]?.value}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Risk Score */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">External Risk Index</div>
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                        {syntheticSpike ? 'Critical' : 'Moderate'}
                    </div>
                    <div className="mt-3">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${syntheticSpike ? 'bg-red-500 w-[94%]' : 'bg-yellow-400 w-[45%]'
                                    }`}
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

const RealTimeDashboard = React.memo(RealTimeDashboardComponent);
export default RealTimeDashboard;
