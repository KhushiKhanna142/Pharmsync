
import { supabase } from './supabase';

export interface Product {
    id: string; // from inventory.id
    name: string; // med_name
    category: string; // from drugs.manufacturer or 'General'
    mrp: number; // Unit Price
    cost_price?: number; // Raw Pack Price (Same as Unit Price per user/friend)
    stock_quantity: number; // inventory.quantity
    pack_size: number; // inventory.pack_size
    batch_id?: string; // inventory.batch_id
    expiry_date?: string; // inventory.expiry_date
}

export const productSearch = {
    init: async () => {
        // No init needed for server-side search
        console.log('Supabase Search Initialized');
    },

    search: async (query: string): Promise<Product[]> => {
        try {
            let dbQuery = supabase
                .from('inventory')
                .select(`
                    id,
                    med_name,
                    quantity,
                    batch_id,
                    expiry_date,
                    status,
                    cost_price
                `) // REMOVED pack_size as it does not exist in DB
                .order('med_name', { ascending: true })
                .limit(100);

            // Only filter if query exists
            if (query && query.trim().length > 0) {
                dbQuery = dbQuery.ilike('med_name', `%${query}%`);
            }

            const { data, error } = await dbQuery;

            if (error) {
                console.error('Supabase search error:', error);
                return [];
            }

            if (!data) return [];

            // RE-RANKING: Prioritize "Starts With"
            const lowerQuery = (query || '').toLowerCase();
            const sortedData = data.sort((a, b) => {
                const nameA = a.med_name.toLowerCase();
                const nameB = b.med_name.toLowerCase();
                const startsA = nameA.startsWith(lowerQuery);
                const startsB = nameB.startsWith(lowerQuery);
                if (startsA && !startsB) return -1;
                if (!startsA && startsB) return 1;
                return 0;
            });

            // Map to Product Interface using DIRECT COST PRICE (Per Friend's Advice)
            return sortedData.map((item: any) => {
                const costPrice = item.cost_price || 0;
                let unitPrice = costPrice;

                // Fallback to mock only if real price is missing/zero
                if (unitPrice === 0) {
                    unitPrice = calculateMockPrice(item.med_name);
                }

                return {
                    id: item.id.toString(),
                    name: item.med_name,
                    category: 'Medicine',
                    mrp: parseFloat(unitPrice.toFixed(2)),
                    cost_price: costPrice,
                    stock_quantity: item.quantity,
                    pack_size: 1, // Defaulting to 1 as DB column is missing
                    batch_id: item.batch_id,
                    expiry_date: item.expiry_date
                };
            });

        } catch (err) {
            console.error('Search exception:', err);
            return [];
        }
    },

    getProductById: async (id: string) => {
        const { data } = await supabase.from('inventory').select('*').eq('id', id).single();
        if (data) {
            return {
                id: data.id.toString(),
                name: data.med_name,
                category: 'Medicine',
                mrp: calculateMockPrice(data.med_name),
                stock_quantity: data.quantity,
                pack_size: '10s',
                batch_id: data.batch_id,
                expiry_date: data.expiry_date
            };
        }
        return null;
    }
};

// Helper to generate consistent mock price based on string hash
function calculateMockPrice(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const price = Math.abs(hash) % 500 + 50; // Random price between 50 and 550
    return parseFloat(price.toFixed(2));
}
