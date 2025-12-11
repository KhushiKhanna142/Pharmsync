export const apiClient = {
    submitTransaction: async (data: any) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Return mock response
        return {
            success: true,
            transaction_id: "txn_" + Date.now(),
            is_anomaly: Math.random() > 0.8 // Random anomaly for demo
        };
    }
};

export const diseaseAPI = {
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
