
import { createClient } from '@supabase/supabase-js'

const url = 'https://ssrjexvdtrkwecymoyyr.supabase.co'
const key = 'sb_publishable_mgXvHyAGBnYkYv98g9f9PA_jhoKYW8I'

const supabase = createClient(url, key)

async function checkColumns() {
    const { data } = await supabase.from('drugs').select('*').limit(1);
    if (data && data[0]) {
        Object.keys(data[0]).forEach(k => console.log(k));
    }
}
checkColumns();
