
import { createClient } from '@supabase/supabase-js'

const url = 'https://ssrjexvdtrkwecymoyyr.supabase.co'
const key = 'sb_publishable_mgXvHyAGBnYkYv98g9f9PA_jhoKYW8I'

const supabase = createClient(url, key)

async function checkColumns() {
    console.log("Checking Inventory Columns...");
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("Table accessible but empty?");
    }
}
checkColumns();
