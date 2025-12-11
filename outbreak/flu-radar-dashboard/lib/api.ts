import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const api = {
    getStats: async () => {
        try {
            const res = await axios.get(`${API_URL}/dashboard/stats`);
            return res.data;
        } catch (error) {
            console.error("API Error - Stats:", error);
            // Return dummy data if API fails (for demo robustness)
            return {
                active_outbreaks: 0,
                monitored_pincodes: 0,
                total_transactions_24h: 0,
                system_status: "Offline"
            };
        }
    },

    getHeatmap: async () => {
        try {
            const res = await axios.get(`${API_URL}/heatmap`);
            return res.data;
        } catch (error) {
            console.error("API Error - Heatmap:", error);
            return { alerts: [] };
        }
    },

    getTrends: async (pincode?: string) => {
        try {
            const res = await axios.get(`${API_URL}/trends`, {
                params: pincode ? { pincode } : {}
            });
            return res.data;
        } catch (error) {
            console.error("API Error - Trends:", error);
            return { data: [] };
        }
    }
};
