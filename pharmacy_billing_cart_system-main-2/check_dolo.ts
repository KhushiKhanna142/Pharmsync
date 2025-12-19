
import { createClient } from '@supabase/supabase-js'

const url = 'https://ssrjexvdtrkwecymoyyr.supabase.co'
const key = 'sb_publishable_mgXvHyAGBnYkYv98g9f9PA_jhoKYW8I'

const supabase = createClient(url, key)

async function checkDolo() {
    console.log("Checking Dolo...");
    const { data } = await supabase
        .from('inventory')
        .select('*')
        .ilike('med_name', '%Dolo 1000mg%')
        .limit(1);

    if (data && data.length > 0) {
        console.log('Dolo Data:', JSON.stringify(data[0], null, 2));
    } else {
        console.log("Dolo not found");
    }
}
checkDolo();
