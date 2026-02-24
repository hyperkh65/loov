require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function patchSchema() {
    console.log("◈ PATCHING DATABASE SCHEMA...");

    // We can't run ALTER TABLE directly via the anon key if RLS/Permissions are tight.
    // However, if the user has set up the project with the script, maybe it works if they have a service role key.
    // Let's check if we have a service role key.

    const token = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Using RPC or just checking if columns exist via a query is better.
    // Actually, I'll just try to upsert a dummy item with the new columns.

    const { error } = await supabase.from('led_products').upsert([{
        external_id: 'schema_temp',
        name: 'Schema Check',
        price: 0,
        specs: { test: true },
        seller_count: 1
    }]);

    if (error) {
        console.log("   ! Schema check failed (likely missing columns):", error.message);
        console.log("   ! Please manually add 'specs' (JSONB) and 'seller_count' (INT) to 'led_products' table.");
    } else {
        console.log("   - Schema verified. Columns exist.");
        // Clean up
        await supabase.from('led_products').delete().eq('external_id', 'schema_temp');
    }
}

patchSchema();
