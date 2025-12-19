
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || 'https://ssrjexvdtrkwecymoyyr.supabase.co';
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_mgXvHyAGBnYkYv98g9f9PA_jhoKYW8I';

const supabase = createClient(url, key);

async function listTables() {
    console.log('Fetching table list...');

    // Check 'transactions'
    const { error } = await supabase.from('transactions').select('id').limit(1);

    if (error) {
        console.log(`Table 'transactions': ${error.message} (${error.code})`);
    } else {
        console.log("✅ Table 'transactions' exists.");
    }
}

listTables();
