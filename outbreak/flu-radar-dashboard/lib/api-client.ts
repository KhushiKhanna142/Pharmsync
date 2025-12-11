/**
 * API Client for Flu Radar Dashboard
 * Connects to FastAPI backend running on port 8000
 */

import axios, { AxiosInstance } from 'axios';

// ⚠️ CRITICAL: Update this URL if backend runs on different port
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('🔗 API Base URL:', API_BASE_URL); // Debug log

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor for debugging
        this.client.interceptors.request.use(
            (config) => {
                console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor for debugging
        this.client.interceptors.response.use(
            (response) => {
                console.log(`✅ API Response: ${response.config.url}`, response.data);
                return response;
            },
            (error) => {
                console.error('❌ API Error:', error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.client.get('/');
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw new Error('Backend is not responding. Please start the FastAPI server.');
        }
    }

    // Get dashboard statistics
    async getStats() {
        try {
            const response = await this.client.get('/api/stats');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Return fallback data instead of crashing
            return {
                total_transactions_24h: 0,
                total_anomalies: 0,
                critical_alerts: 0,
                warnings: 0,
                monitoring: 0,
                pincodes_monitored: 0,
                last_updated: new Date().toISOString()
            };
        }
    }

    // Get trend data for charts
    async getTrends(pincode?: string, days: number = 7) {
        try {
            const params = new URLSearchParams();
            if (pincode) params.append('pincode', pincode);
            params.append('days', days.toString());

            const response = await this.client.get(`/api/trends?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch trends:', error);
            return { data: [], start_date: null, end_date: null };
        }
    }

    // Get heatmap data for alerts
    async getHeatmap() {
        try {
            const response = await this.client.get('/api/heatmap');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch heatmap:', error);
            return { alerts: [], timestamp: new Date().toISOString() };
        }
    }

    // Get outbreak status for specific pincode
    async getOutbreakStatus(pincode: string) {
        try {
            const response = await this.client.get(`/api/outbreak-status/${pincode}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch outbreak status for ${pincode}:`, error);
            return {
                pincode,
                severity: 'green',
                confidence: 0,
                affected_count: 0,
                detected_at: new Date().toISOString()
            };
        }
    }

    // Submit new transaction (for testing)
    async submitTransaction(transaction: {
        timestamp: string;
        pincode: string;
        medicine_name: string;
        category: string;
        quantity: number;
        customer_age?: number;
    }) {
        try {
            const response = await this.client.post('/api/transactions', transaction);
            return response.data;
        } catch (error) {
            console.error('Failed to submit transaction:', error);
            throw error;
        }
    }
}

// External API Client (Disease.sh)
export const diseaseAPI = {
    getIndiaStats: async () => {
        try {
            const res = await fetch("https://disease.sh/v3/covid-19/countries/India");
            return res.json();
        } catch (error) {
            console.error("Failed to fetch Disease.sh stats:", error);
            return null;
        }
    }
};

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export interface DashboardStats {
    total_transactions_24h: number;
    total_anomalies: number;
    critical_alerts: number;
    warnings: number;
    monitoring: number;
    pincodes_monitored: number;
    last_updated: string;
}

export interface TrendData {
    data: Array<{
        date: string;
        category: string;
        quantity: number;
    }>;
    start_date: string;
    end_date: string;
}

export interface HeatmapData {
    alerts: Array<{
        pincode: string;
        anomaly_count: number;
        total_transactions: number;
        severity: 'red' | 'orange' | 'yellow';
    }>;
    timestamp: string;
}

export interface OutbreakStatus {
    pincode: string;
    severity: 'red' | 'orange' | 'yellow' | 'green';
    confidence: number;
    affected_count: number;
    detected_at: string;
}
