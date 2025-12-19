
import { createClient } from '@supabase/supabase-js'

const url = 'https://ssrjexvdtrkwecymoyyr.supabase.co'
const key = 'sb_publishable_mgXvHyAGBnYkYv98g9f9PA_jhoKYW8I'

const supabase = createClient(url, key)

async function checkInventoryColumns() {
    console.log("Checking INVENTORY Columns...");
    const { data } = await supabase.from('inventory').select('*').limit(1);
    if (data && data[0]) {
        Object.keys(data[0]).forEach(k => console.log(k));
    } else {
        console.log("Empty or Error");
    }
}
checkInventoryColumns();
