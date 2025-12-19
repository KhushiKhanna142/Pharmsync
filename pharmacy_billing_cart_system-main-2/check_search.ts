
import { createClient } from '@supabase/supabase-js'

const url = 'https://ssrjexvdtrkwecymoyyr.supabase.co'
const key = 'sb_publishable_mgXvHyAGBnYkYv98g9f9PA_jhoKYW8I'

const supabase = createClient(url, key)

async function checkSearch() {
    console.log("Searching for 'dolo'...");

    // 1. Search for 'Dolo%' (Starts with)
    const { data: startsWith, error: err1 } = await supabase
        .from('inventory')
        .select('med_name')
        .ilike('med_name', 'Dolo%')
        .limit(10);

    if (err1) console.error('Error 1:', err1);
    else console.log("Starts with 'Dolo':", JSON.stringify(startsWith, null, 2));

    // 2. Search for '%dolo%' (Contains - what the app uses)
    const { data: contains, error: err2 } = await supabase
        .from('inventory')
        .select('med_name')
        .ilike('med_name', '%dolo%')
        .limit(20);

    if (err2) console.error('Error 2:', err2);
    else console.log("Contains 'dolo':", JSON.stringify(contains, null, 2));
}

checkSearch();
