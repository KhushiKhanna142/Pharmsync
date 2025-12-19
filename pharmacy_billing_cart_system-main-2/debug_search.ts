
import { createClient } from '@supabase/supabase-js'

const url = 'https://ssrjexvdtrkwecymoyyr.supabase.co'
const key = 'sb_publishable_mgXvHyAGBnYkYv98g9f9PA_jhoKYW8I'

const supabase = createClient(url, key)

async function testSearch() {
    console.log("Testing search for 'dolo' (WITHOUT pack_size)...");

    // Exact logic from product-search.ts (Updated)
    const query = 'dolo';
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
        `) // NO pack_size
        .order('med_name', { ascending: true })
        .limit(10);

    if (query && query.trim().length > 0) {
        dbQuery = dbQuery.ilike('med_name', `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
        console.error('SEARCH ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('SEARCH SUCCESS. Found:', data?.length);
        if (data && data.length > 0) {
            console.log('First Item:', JSON.stringify(data[0], null, 2));
        }
    }
}

testSearch();
