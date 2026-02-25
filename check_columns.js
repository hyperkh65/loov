
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
    const { data, error } = await supabase.from('led_reports').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log('Sample Row:', data[0]);
        console.log('Columns:', Object.keys(data[0] || {}));
    }
}
check();
