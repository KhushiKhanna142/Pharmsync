import React, { useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Brain } from 'lucide-react';

const PredictiveTimelineComponent = () => {
    const [selectedDisease, setSelectedDisease] = useState('flu');

    // Simulated forecast data
    const getForecastData = () => {
        const baseData: any = {
            flu: {
                current: 45,
                trend: 'increasing',
                confidence: 87,
                forecast: [45, 52, 61, 68, 72, 69, 58],
                peakDay: 4,
                severity: 'orange'
            },
            dengue: {
                current: 12,
                trend: 'stable',
                confidence: 92,
                forecast: [12, 13, 14, 13, 12, 11, 10],
                peakDay: 2,
                severity: 'yellow'
            },
            covid: {
                current: 8,
                trend: 'decreasing',
                confidence: 78,
                forecast: [8, 7, 6, 5, 4, 3, 3],
                peakDay: 0,
                severity: 'green'
            }
        };
        return baseData[selectedDisease];
    };

    const data = getForecastData();
    const days = ['Today', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
    const maxValue = Math.max(...data.forecast) * 1.2;

    const getTrendIcon = () => {
        switch (data.trend) {
            case 'increasing':
                return <TrendingUp className="w-5 h-5 text-red-500" />;
            case 'stable':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'decreasing':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            default:
                return null;
        }
    };

    const getTrendColor = () => {
        switch (data.trend) {
            case 'increasing': return 'text-red-600';
            case 'stable': return 'text-yellow-600';
            case 'decreasing': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const getSeverityBadge = () => {
        const colors: any = {
            red: 'bg-red-100 text-red-700 border-red-300',
            orange: 'bg-orange-100 text-orange-700 border-orange-300',
            yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            green: 'bg-green-100 text-green-700 border-green-300'
        };
        return colors[data.severity];
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <h2 className="text-xl font-bold text-gray-800">AI-Powered Outbreak Forecast</h2>
                </div>

                <div className="flex gap-2">
                    {['flu', 'dengue', 'covid'].map(disease => (
                        <button
                            key={disease}
                            onClick={() => setSelectedDisease(disease)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDisease === disease
                                    ? 'bg-blue-500 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {disease.charAt(0).toUpperCase() + disease.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Status Card */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 mb-1">Current Cases</div>
                    <div className="text-3xl font-bold text-blue-900">{data.current}</div>
                    <div className="flex items-center gap-1 mt-2">
                        {getTrendIcon()}
                        <span className={`text-sm font-medium ${getTrendColor()}`}>
                            {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
                        </span>
                    </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-700 mb-1">AI Confidence</div>
                    <div className="text-3xl font-bold text-purple-900">{data.confidence}%</div>
                    <div className="mt-2 bg-purple-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-purple-600 h-full transition-all duration-500"
                            style={{ width: `${data.confidence}%` }}
                        />
                    </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-700 mb-1">Peak Expected</div>
                    <div className="text-3xl font-bold text-orange-900">
                        {data.peakDay === 0 ? 'Today' : `Day ${data.peakDay}`}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-600">
                            {data.peakDay === 0 ? 'Active now' : `In ${data.peakDay} days`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">7-Day Forecast</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadge()}`}>
                        {data.severity.toUpperCase()} ALERT
                    </span>
                </div>

                <div className="relative h-64 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4 pr-2 text-xs text-gray-500">
                        {[Math.round(maxValue), Math.round(maxValue * 0.5), 0].map((val, i) => (
                            <div key={i}>{val}</div>
                        ))}
                    </div>

                    {/* Chart area */}
                    <div className="ml-8 h-full flex items-end justify-between gap-2">
                        {data.forecast.map((value: number, index: number) => {
                            const height = (value / maxValue) * 100;
                            const isPeak = index === data.peakDay;
                            const isToday = index === 0;

                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    {/* Bar */}
                                    <div className="relative w-full flex flex-col justify-end" style={{ height: '200px' }}>
                                        {/* Confidence interval shadow */}
                                        <div
                                            className="absolute bottom-0 w-full bg-blue-200 opacity-30 rounded-t-lg"
                                            style={{
                                                height: `${height + 15}%`,
                                                marginBottom: '-7.5%'
                                            }}
                                        />

                                        {/* Main bar */}
                                        <div
                                            className={`relative w-full rounded-t-lg transition-all duration-500 ${isPeak
                                                    ? 'bg-gradient-to-t from-red-500 to-orange-500 animate-pulse'
                                                    : isToday
                                                        ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                                                        : 'bg-gradient-to-t from-blue-400 to-blue-300'
                                                }`}
                                            style={{ height: `${height}%` }}
                                        >
                                            {/* Value label */}
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700">
                                                {value}
                                            </div>

                                            {/* Peak indicator */}
                                            {isPeak && (
                                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3 text-red-600" />
                                                    <span className="text-xs font-bold text-red-600">PEAK</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Day label */}
                                    <div className={`text-xs font-medium ${isToday ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                                        {days[index]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Insights Section */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    AI Insights & Recommendations
                </h4>

                <div className="space-y-2">
                    {data.trend === 'increasing' && (
                        <>
                            <div className="flex items-start gap-2 text-sm">
                                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700">
                                    <strong>Alert:</strong> Cases expected to increase by {Math.round(((data.forecast[data.peakDay] - data.current) / data.current) * 100)}% over next {data.peakDay} days
                                </p>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700">
                                    <strong>Action:</strong> Notify health authorities and stock fever medications
                                </p>
                            </div>
                        </>
                    )}

                    {data.trend === 'stable' && (
                        <>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700">
                                    <strong>Status:</strong> Outbreak contained. Monitor for next 3 days.
                                </p>
                            </div>
                        </>
                    )}

                    {data.trend === 'decreasing' && (
                        <>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700">
                                    <strong>Good News:</strong> Cases declining. Outbreak subsiding.
                                </p>
                            </div>
                        </>
                    )}

                    <div className="flex items-start gap-2 text-sm text-gray-600 pt-2 border-t border-purple-200">
                        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>
                            Model trained on {selectedDisease === 'flu' ? '10,000+' : '5,000+'} historical outbreak patterns.
                            Last updated: 2 minutes ago
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PredictiveTimeline = React.memo(PredictiveTimelineComponent);
export default PredictiveTimeline;
