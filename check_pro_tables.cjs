const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTables() {
    const tables = ['led_products', 'led_categories', 'pro_products', 'pro_companies', 'pro_product_specs', 'pro_price_snapshots', 'pro_change_events', 'pro_market_overviews'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table ${table}: ${error.message}`);
        } else {
            console.log(`✅ Table ${table}: ${data.length} rows found in sample`);
        }
    }
}

checkTables();
