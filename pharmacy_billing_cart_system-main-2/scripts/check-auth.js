
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log(`Checking connection to ${supabaseUrl}...`);
    // Try to list buckets or just query a table that might not exist yet (will return error, but not connection error)
    // querying 'products' - if 404/PGRST301 (relation not found), it means connected!
    // if connection refused/ENOTFOUND, then URL is wrong.

    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });

    if (error) {
        console.log('Result:', error.message);
        if (error.code === 'PGRST301' || error.message.includes('relation "products" does not exist')) {
            console.log('✅ Connected! (But table does not exist yet matching expectation)');
            process.exit(0);
        } else if (error.message.includes('FetchError') || error.message.includes('ENOTFOUND')) {
            console.error('❌ Connection Failed: Host not found');
            process.exit(1);
        } else if (error.code === '401' || error.message.includes('JWT')) {
            console.error('❌ Authentication Failed: Invalid Key');
            process.exit(1);
        } else {
            // Some other error (maybe permission), but implies connection worked
            console.log('⚠️ Connected but received error:', error.message);
            process.exit(0);
        }
    }

    console.log('✅ Connected and table exists!');
}

check();
