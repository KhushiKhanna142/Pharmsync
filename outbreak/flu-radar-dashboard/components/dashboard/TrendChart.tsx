"use client";
import { useState, useMemo } from 'react';
import React from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label, ReferenceDot, Area, ComposedChart } from 'recharts';
import { Filter, AlertCircle, Info } from 'lucide-react';

function TrendChartComponent({ data }: { data: any }) {
    const [activeFilter, setActiveFilter] = useState('All');

    // Enhanced Data Processing for Demo
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map((item, index) => {
            // Simulate "Last Week" data for comparison
            const lastWeekBase = item.quantity * (0.9 + Math.sin(index) * 0.2);

            // Apply mock filter reduction
            let current = item.quantity;
            let lastWeek = lastWeekBase;

            if (activeFilter === 'Fever') {
                current = Math.round(current * 0.6);
                lastWeek = Math.round(lastWeek * 0.55);
            } else if (activeFilter === 'Respiratory') {
                current = Math.round(current * 0.3);
                lastWeek = Math.round(lastWeek * 0.35);
            }

            return {
                ...item,
                dateObj: new Date(item.date),
                current,
                lastWeek: Math.round(lastWeek),
                // Annotate specific drops for the demo story
                annotation: index === 2 ? 'Weekend Dip' : (index === 5 && current > lastWeek * 1.5 ? 'Spike!' : null)
            };
        });
    }, [data, activeFilter]);

    if (!data || data.length === 0) {
        return (
            <Card className="p-6 h-[400px] flex items-center justify-center">
                <p className="text-gray-400">No trend data available</p>
            </Card>
        );
    }

    // Calculate Week-over-Week Metrics
    const totalCurrent = processedData.reduce((acc, curr) => acc + curr.current, 0);
    const totalLast = processedData.reduce((acc, curr) => acc + curr.lastWeek, 0);
    const wowGrowth = ((totalCurrent - totalLast) / totalLast) * 100;

    return (
        <Card className="p-6 transition-all hover:shadow-md">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Pharmacy Purchase Trends
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </h3>
                    <p className="text-sm text-gray-500">7-Day Symptom Tracking & Anomaly Detection</p>
                </div>

                {/* Filter Toggles */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    {['All', 'Fever', 'Respiratory'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeFilter === filter
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium mb-1">Total Volume (This Week)</div>
                    <div className="text-2xl font-bold text-gray-900">{totalCurrent.toLocaleString()} <span className="text-sm font-normal text-gray-500">units</span></div>
                </div>
                <div className={`p-3 rounded-lg border ${wowGrowth > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <div className={`text-xs font-medium mb-1 ${wowGrowth > 0 ? 'text-red-600' : 'text-green-600'}`}>Week over Week</div>
                    <div className={`text-2xl font-bold ${wowGrowth > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {wowGrowth > 0 ? '↑' : '↓'} {Math.abs(wowGrowth).toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[350px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                        <defs>
                            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                            dataKey="dateObj"
                            tickFormatter={(date) => {
                                // Format: "Thu (14)"
                                return `${date.toLocaleDateString('en-US', { weekday: 'short' })} (${date.getDate()})`;
                            }}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${value}`} // Plain number for cleaner look
                            label={{ value: 'Sales Volume', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                        />

                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const date = payload[0].payload.dateObj;
                                    const curr = payload[0].value;
                                    // payload[1] should be "previous week" but sometimes order varies, check dataKey
                                    const prev = payload.find(p => p.dataKey === 'lastWeek')?.value;

                                    return (
                                        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm">
                                            <div className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1">
                                                {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <span className="text-blue-600 font-semibold">This Week:</span>
                                                <span className="font-bold">{curr} units</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                                <span className="text-gray-400">Last Week:</span>
                                                <span className="text-gray-500 font-medium">{prev} units</span>
                                            </div>
                                            {curr > prev * 1.5 && (
                                                <div className="mt-2 text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-semibold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Anomaly Detected
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Last Week Trend (Gray / Dashed) */}
                        <Line
                            type="monotone"
                            dataKey="lastWeek"
                            stroke="#cbd5e1"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            name="Last Week"
                            animationDuration={1500}
                        />

                        {/* Current Trend (Blue / Filled) */}
                        <Area
                            type="monotone"
                            dataKey="current"
                            stroke="#2563eb"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCurrent)"
                            name="This Week"
                            animationDuration={1500}
                        />

                        {/* Spikes / Annotations */}
                        {processedData.map((entry, index) => {
                            if (entry.annotation === 'Spike!' || (entry.current > entry.lastWeek * 1.5)) {
                                return (
                                    <ReferenceDot key={index} x={entry.dateObj} y={entry.current} r={5} fill="#ef4444" stroke="white" strokeWidth={2}>
                                        <Label value="⚠️ Spike" position="top" fill="#ef4444" fontSize={11} fontWeight="bold" />
                                    </ReferenceDot>
                                );
                            }
                            if (entry.annotation === 'Weekend Dip') {
                                return (
                                    <ReferenceDot key={index} x={entry.dateObj} y={entry.current} r={4} fill="#64748b" stroke="white" strokeWidth={2}>
                                        <Label value="Weekend" position="bottom" fill="#64748b" fontSize={10} />
                                    </ReferenceDot>
                                );
                            }
                            return null;
                        })}

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export const TrendChart = React.memo(TrendChartComponent);
