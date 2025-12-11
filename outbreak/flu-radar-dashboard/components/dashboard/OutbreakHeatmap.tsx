import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, AlertTriangle, Users, Clock, Pill, Activity, X } from 'lucide-react';

const OutbreakHeatmapComponent = () => {
    const [selectedPincode, setSelectedPincode] = useState<any>(null);
    const [hoverPincode, setHoverPincode] = useState<any>(null);
    const [timeRange, setTimeRange] = useState('24h');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showReport, setShowReport] = useState(false);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Simulated outbreak data for Mumbai pincodes (Enhanced with metrics) - Spaced out for better usability
    const outbreakData = [
        { pincode: '400001', name: 'Fort', x: 20, y: 55, severity: 'red', cases: 245, risk: 92, avg7day: 180, z_score: 3.2, alerts: 12 },
        { pincode: '400005', name: 'Colaba', x: 15, y: 70, severity: 'orange', cases: 128, risk: 78, avg7day: 90, z_score: 2.1, alerts: 5 },
        { pincode: '400012', name: 'Parel', x: 45, y: 50, severity: 'yellow', cases: 52, risk: 45, avg7day: 48, z_score: 1.1, alerts: 1 },
        { pincode: '400022', name: 'Dadar', x: 50, y: 40, severity: 'green', cases: 13, risk: 15, avg7day: 15, z_score: 0.2, alerts: 0 },
        { pincode: '400034', name: 'Kurla', x: 75, y: 55, severity: 'red', cases: 312, risk: 88, avg7day: 210, z_score: 2.9, alerts: 15 },
        { pincode: '400051', name: 'Bandra', x: 35, y: 30, severity: 'orange', cases: 92, risk: 68, avg7day: 70, z_score: 1.8, alerts: 4 },
        { pincode: '400067', name: 'Kandivali', x: 60, y: 15, severity: 'yellow', cases: 38, risk: 32, avg7day: 35, z_score: 0.8, alerts: 0 },
        { pincode: '400078', name: 'Borivali', x: 70, y: 10, severity: 'green', cases: 8, risk: 8, avg7day: 10, z_score: -0.1, alerts: 0 },
        { pincode: '400092', name: 'Goregaon', x: 80, y: 25, severity: 'orange', cases: 89, risk: 62, avg7day: 65, z_score: 1.5, alerts: 3 },
    ];

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'red': return '#ef4444'; // Red-500
            case 'orange': return '#f97316'; // Orange-500
            case 'yellow': return '#eab308'; // Yellow-500
            default: return '#22c55e'; // Green-500
        }
    };

    const getSeverityLabel = (severity: string) => {
        switch (severity) {
            case 'red': return 'Critical Outbreak';
            case 'orange': return 'High Risk';
            case 'yellow': return 'Elevated Activity';
            default: return 'Normal Levels';
        }
    };

    // Enhanced dynamic sizing based on cases - Balanced size for reduced overlap
    const getRadius = (cases: number) => {
        return Math.max(14, Math.min(50, Math.log(cases) * 7.5));
    };

    const activeData = selectedPincode || hoverPincode;

    // Aggregated stats
    const stats = {
        total: outbreakData.length,
        critical: outbreakData.filter(d => d.severity === 'red').length,
        high: outbreakData.filter(d => d.severity === 'orange').length,
        elevated: outbreakData.filter(d => d.severity === 'yellow').length,
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 relative">
            {/* Detailed Report Modal */}
            {showReport && activeData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-blue-400" />
                                    Epidemiological Report
                                </h3>
                                <p className="text-slate-400 mt-1">Zone: {activeData.name} ({activeData.pincode})</p>
                            </div>
                            <button
                                onClick={() => setShowReport(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b pb-2">Transmission Dynamics</h4>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-gray-600 text-sm">R₀ (Reproduction Number)</span>
                                    <span className={`font-mono font-bold ${activeData.severity === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                                        {activeData.severity === 'red' ? '2.4' : '0.8'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-gray-600 text-sm">Community Spread Risk</span>
                                    <span className="font-bold text-gray-900">{activeData.risk}%</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b pb-2">Healthcare Capacity</h4>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-gray-600 text-sm">ICU Bed Occupancy</span>
                                    <span className="font-bold text-orange-600">
                                        {activeData.severity === 'red' ? '88%' : '45%'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-gray-600 text-sm">Ambulance Availability</span>
                                    <span className="font-bold text-green-600">High</span>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 mt-2">
                                <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3">AI Recommendations</h4>
                                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm leading-relaxed">
                                    <strong>Immediate Action Required:</strong> Increase surveillance of OTC antipyretic sales in {activeData.name} pharmacies.
                                    Expected peak infectiousness within 48 hours. Recommend local advisory for mask usage in public transport.
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setShowReport(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* Header with Time Context (Existing) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Outbreak Heatmap</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Updates Live • Data as of: <span className="font-semibold text-gray-700">{currentTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Time Range</span>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer hover:bg-gray-100"
                    >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Visual Map Area */}
                <div className="flex-1 relative bg-slate-900 rounded-xl overflow-hidden shadow-inner group">
                    {/* Map Background/Grid */}
                    <svg
                        viewBox="0 0 100 80"
                        className="w-full h-[450px] sm:h-[500px]"
                        style={{ background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)' }}
                    >
                        {/* Grid lines for GIS feel */}
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                            </pattern>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <rect width="100" height="80" fill="url(#grid)" />

                        {/* Connection Lines (Simulating spread/transit routes) */}
                        {outbreakData.map((start, i) => (
                            outbreakData.slice(i + 1).map((end, j) => {
                                const dist = Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2));
                                if (dist < 25) { // Only connect neighbors
                                    return (
                                        <line
                                            key={`${start.pincode}-${end.pincode}`}
                                            x1={start.x} y1={start.y}
                                            x2={end.x} y2={end.y}
                                            stroke="rgba(255,255,255,0.05)"
                                            strokeWidth="0.2"
                                            strokeDasharray="1 1"
                                        />
                                    )
                                }
                                return null;
                            })
                        ))}

                        {/* Zones - Sorted by size (descending cases) so smallest render ON TOP */}
                        {[...outbreakData]
                            .sort((a, b) => b.cases - a.cases) // Sort so larger circles render first (bottom), smaller last (top)
                            .map((location) => {
                                const radius = getRadius(location.cases);
                                const isActive = activeData?.pincode === location.pincode;
                                const isCritical = location.severity === 'red';

                                return (
                                    <g key={location.pincode}
                                        className="transition-opacity duration-300"
                                        style={{ opacity: (hoverPincode && hoverPincode.pincode !== location.pincode) ? 0.4 : 1 }}
                                    >
                                        {/* Pulsing Aura for Critical/Hover */}
                                        {(isCritical || isActive) && (
                                            <circle
                                                cx={location.x}
                                                cy={location.y}
                                                r={radius * 1.5}
                                                fill={getSeverityColor(location.severity)}
                                                opacity="0.2"
                                                className={isCritical ? "animate-pulse" : ""}
                                                pointerEvents="none" // Ensure aura doesn't block clicks
                                            />
                                        )}

                                        {/* Core Zone Circle */}
                                        <circle
                                            cx={location.x}
                                            cy={location.y}
                                            r={isActive ? radius * 1.1 : radius}
                                            fill={getSeverityColor(location.severity)}
                                            opacity={0.8}
                                            stroke="rgba(255,255,255,0.9)"
                                            strokeWidth={isActive ? 1.5 : 1}
                                            className="cursor-pointer transition-all duration-300 hover:opacity-100 hover:scale-105"
                                            onMouseEnter={() => setHoverPincode(location)}
                                            onMouseLeave={() => setHoverPincode(null)}
                                            onClick={() => setSelectedPincode(location)}
                                            filter={isActive ? "url(#glow)" : ""}
                                        />

                                        {/* Label (Enhanced Contrast) */}
                                        <g pointerEvents="none">
                                            {/* Text Shadow/Stroke simulation for readability */}
                                            <text
                                                x={location.x}
                                                y={location.y + radius + 5}
                                                textAnchor="middle"
                                                fontSize="3.5"
                                                stroke="rgba(0,0,0,0.9)"
                                                strokeWidth="0.8"
                                                fill="transparent"
                                                fontWeight="900"
                                            >
                                                {location.name}
                                            </text>
                                            <text
                                                x={location.x}
                                                y={location.y + radius + 5}
                                                textAnchor="middle"
                                                fontSize="3.5"
                                                fill="white"
                                                fontWeight="700"
                                            >
                                                {location.name}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}
                    </svg>

                    {/* Stats Indicators Overlay (Top Right) */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-white">{stats.critical} Critical Zones</span>
                        </div>
                    </div>
                </div>

                {/* Drill-down / Details Panel */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    {activeData ? (
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                            {/* Panel Header */}
                            <div className="mb-4 pb-4 border-b border-slate-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 leading-none mb-1">{activeData.name}</h3>
                                        <span className="text-xs font-mono text-gray-500">PIN: {activeData.pincode}</span>
                                    </div>
                                    <button onClick={() => setSelectedPincode(null)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div
                                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm"
                                    style={{ backgroundColor: getSeverityColor(activeData.severity) }}
                                >
                                    <Activity className="w-4 h-4" />
                                    {getSeverityLabel(activeData.severity)}
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-gray-500 mb-1">Active Cases</div>
                                    <div className="text-xl font-bold text-gray-900">{activeData.cases}</div>
                                    <div className="text-[10px] text-green-600 font-medium">+{Math.floor(Math.random() * 15) + 5}% vs avg</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-gray-500 mb-1">Anomaly Score</div>
                                    <div className="text-xl font-bold text-gray-900">{activeData.z_score}σ</div>
                                    <div className="text-[10px] text-red-500 font-medium">Spike Detected</div>
                                </div>
                            </div>

                            {/* Inventory Status (New) */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-blue-500" /> Pharmacy Inventory
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-gray-600">Antipyretics (Fever)</span>
                                        <span className="text-red-600 font-bold">Low Stock (15%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                                    </div>

                                    <div className="flex justify-between text-xs items-center mt-2">
                                        <span className="text-gray-600">Antibiotics</span>
                                        <span className="text-green-600 font-bold">Healthy (85%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => setShowReport(true)}
                                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                                >
                                    View Detailed Report <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-6 text-center">
                            <div>
                                <div className="bg-slate-100 p-4 rounded-full inline-block mb-3">
                                    <MapPin className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-gray-900 font-semibold">No Zone Selected</h3>
                                <p className="text-sm text-gray-500 mt-1">Hover over a circle to inspect metrics, or click to lock selection.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const OutbreakHeatmap = React.memo(OutbreakHeatmapComponent);
export default OutbreakHeatmap;
