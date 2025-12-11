import React, { useState, useEffect } from 'react';
import { Activity, MapPin, Clock, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const LiveActivityFeedComponent = () => {
    const [activities, setActivities] = useState<any[]>([]);
    const [isLive, setIsLive] = useState(true);

    // Simulate real-time data stream
    useEffect(() => {
        if (!isLive) return;

        const medicines = [
            { name: 'Paracetamol 500mg', category: 'FEVER', color: 'text-red-500' },
            { name: 'Cetirizine 10mg', category: 'COLD', color: 'text-blue-500' },
            { name: 'Cough Syrup', category: 'COUGH', color: 'text-purple-500' },
            { name: 'Dolo 650', category: 'FEVER', color: 'text-red-500' },
            { name: 'Amoxicillin', category: 'ANTIBIOTIC', color: 'text-green-500' }
        ];

        const pincodes = ['400001', '400005', '400012', '400022', '400034'];

        const addActivity = async () => {
            const med = medicines[Math.floor(Math.random() * medicines.length)];
            const pincode = pincodes[Math.floor(Math.random() * pincodes.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;

            try {
                // Send "Real" API request to backend
                // This will trigger the ML Anomaly Detection model in Python
                const response = await apiClient.submitTransaction({
                    timestamp: new Date().toISOString(),
                    pincode: pincode,
                    medicine_name: med.name,
                    category: med.category,
                    quantity: quantity
                });

                const newActivity = {
                    id: Date.now(),
                    medicine: med.name,
                    category: med.category,
                    color: med.color,
                    pincode,
                    quantity,
                    time: new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    // Use the REAL ML prediction from the backend response
                    isAnomaly: response.is_anomaly
                };

                setActivities(prev => [newActivity, ...prev].slice(0, 12));
            } catch (err) {
                console.error("Failed to submit simulated transaction", err);
            }
        };

        // Add new activity every 15 seconds (further reduced to prevent blinking)
        const interval = setInterval(addActivity, 15000); // 15s interval

        return () => clearInterval(interval);
    }, [isLive]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-bold text-gray-800">Live Transaction Stream</h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-600">
                            {isLive ? 'LIVE' : 'PAUSED'}
                        </span>
                    </div>

                    {/* Toggle button */}
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        {isLive ? 'Pause' : 'Resume'}
                    </button>
                </div>
            </div>

            {/* Activity feed */}
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300">
                {activities.map((activity, index) => (
                    <div
                        key={activity.id}
                        className={`p-3 rounded-lg border transition-all duration-300 hover:shadow-md ${activity.isAnomaly
                            ? 'bg-red-50 border-red-200 animate-pulse'
                            : 'bg-gray-50 border-gray-200'
                            }`}
                        style={{
                            animation: `slideIn 0.4s ease-out ${index * 0.05}s backwards`
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-semibold ${activity.color}`}>
                                        {activity.medicine}
                                    </span>
                                    {activity.isAnomaly && (
                                        <span className="px-2 py-0.5 text-xs font-bold text-red-600 bg-red-100 rounded-full">
                                            ANOMALY
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{activity.pincode}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>Qty: {activity.quantity}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{activity.time}</span>
                                    </div>
                                </div>
                            </div>

                            <span className={`px-2 py-1 text-xs font-medium rounded ${activity.category === 'FEVER' ? 'bg-red-100 text-red-700' :
                                activity.category === 'COUGH' ? 'bg-purple-100 text-purple-700' :
                                    activity.category === 'COLD' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                }`}>
                                {activity.category}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary footer */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                        {activities.filter(a => a.isAnomaly).length} anomalies detected
                    </span>
                    <span className="text-gray-400">
                        Last update: {activities[0]?.time || '--:--:--'}
                    </span>
                </div>
            </div>

            <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
        </div>
    );
};

const LiveActivityFeed = React.memo(LiveActivityFeedComponent);
export default LiveActivityFeed;
