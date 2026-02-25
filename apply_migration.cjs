/**
 * apply_migration.cjs
 * Applies 002_procurement_intel.sql to Supabase via the Management API.
 * Requires SUPABASE_ACCESS_TOKEN (personal access token from supabase.com/dashboard/account/tokens)
 * Set it in .env.local as SUPABASE_ACCESS_TOKEN=sbp_...
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL; // e.g., https://iixomkwkclvutdxvqtko.supabase.co
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service_role key

if (!SUPABASE_SERVICE_KEY) {
    console.error(`
❌ SUPABASE_SERVICE_KEY not found in .env.local

Please add the following to your .env.local file:
  SUPABASE_SERVICE_KEY=eyJhbGci... (the service_role key from Supabase Dashboard)

To get it:
  1. Go to: https://supabase.com/dashboard/project/iixomkwkclvutdxvqtko/settings/api
  2. Copy the "service_role" key (NOT the anon key)
  3. Add to .env.local: SUPABASE_SERVICE_KEY=<the key>
`);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
    console.log("◈ APPLYING PROCUREMENT INTEL MIGRATION...\n");

    // Split SQL into individual statements
    const statements = [
        `CREATE TABLE IF NOT EXISTS pro_companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            biz_no TEXT UNIQUE,
            name TEXT UNIQUE NOT NULL,
            company_type TEXT,
            address TEXT,
            representative TEXT,
            contacts JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS pro_products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            prdct_idnt_no TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category_lv1 TEXT,
            category_lv2 TEXT,
            company_id UUID REFERENCES pro_companies(id),
            status TEXT DEFAULT 'active',
            image_url TEXT,
            source_registered_at TIMESTAMPTZ,
            source_updated_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS pro_product_specs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES pro_products(id) ON DELETE CASCADE,
            as_of_date DATE DEFAULT CURRENT_DATE,
            power_w NUMERIC,
            luminous_flux_lm NUMERIC,
            efficacy_lm_per_w NUMERIC,
            cct_k INTEGER,
            cri INTEGER,
            beam_angle TEXT,
            ip_rating TEXT,
            ik_rating TEXT,
            lifetime_hours INTEGER,
            warranty_years INTEGER,
            notes_raw_text TEXT,
            parse_confidence NUMERIC,
            UNIQUE(product_id, as_of_date)
        )`,
        `CREATE TABLE IF NOT EXISTS pro_certifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES pro_products(id) ON DELETE CASCADE,
            cert_type TEXT,
            cert_no TEXT,
            issued_at DATE,
            expires_at DATE,
            status TEXT DEFAULT 'valid',
            cert_image_url TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS pro_price_snapshots (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES pro_products(id) ON DELETE CASCADE,
            as_of_date DATE DEFAULT CURRENT_DATE,
            price_type TEXT,
            unit_price INTEGER,
            currency TEXT DEFAULT 'KRW',
            unit_name TEXT DEFAULT 'EA',
            source_ref TEXT,
            UNIQUE(product_id, as_of_date, price_type)
        )`,
        `CREATE TABLE IF NOT EXISTS pro_change_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES pro_products(id) ON DELETE CASCADE,
            event_type TEXT,
            detected_at TIMESTAMPTZ DEFAULT NOW(),
            before_value JSONB,
            after_value JSONB,
            diff_summary TEXT,
            severity TEXT DEFAULT 'medium'
        )`,
        `CREATE TABLE IF NOT EXISTS pro_market_overviews (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category_name TEXT,
            as_of_date DATE DEFAULT CURRENT_DATE,
            total_companies INTEGER,
            total_products INTEGER,
            min_price INTEGER,
            median_price INTEGER,
            top_10_percent_price INTEGER,
            avg_efficacy NUMERIC,
            metrics JSONB,
            UNIQUE(category_name, as_of_date)
        )`,
        // Indexes
        `CREATE INDEX IF NOT EXISTS idx_pro_products_company ON pro_products(company_id)`,
        `CREATE INDEX IF NOT EXISTS idx_pro_products_cat ON pro_products(category_lv2)`,
        `CREATE INDEX IF NOT EXISTS idx_pro_specs_product ON pro_product_specs(product_id)`,
        `CREATE INDEX IF NOT EXISTS idx_pro_prices_product ON pro_price_snapshots(product_id)`,
        `CREATE INDEX IF NOT EXISTS idx_pro_events_product ON pro_change_events(product_id)`,
        `CREATE INDEX IF NOT EXISTS idx_pro_events_date ON pro_change_events(detected_at)`,
        // RLS
        `ALTER TABLE pro_companies ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE pro_products ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE pro_product_specs ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE pro_certifications ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE pro_price_snapshots ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE pro_change_events ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE pro_market_overviews ENABLE ROW LEVEL SECURITY`,
        // Policies
        `DROP POLICY IF EXISTS "Public read pro_companies" ON pro_companies; CREATE POLICY "Public read pro_companies" ON pro_companies FOR SELECT USING (true)`,
        `DROP POLICY IF EXISTS "Public read pro_products" ON pro_products; CREATE POLICY "Public read pro_products" ON pro_products FOR SELECT USING (true)`,
        `DROP POLICY IF EXISTS "Internal write pro_companies" ON pro_companies; CREATE POLICY "Internal write pro_companies" ON pro_companies FOR ALL WITH CHECK (true)`,
        `DROP POLICY IF EXISTS "Internal write pro_products" ON pro_products; CREATE POLICY "Internal write pro_products" ON pro_products FOR ALL WITH CHECK (true)`,
        `DROP POLICY IF EXISTS "Internal write pro_product_specs" ON pro_product_specs; CREATE POLICY "Internal write pro_product_specs" ON pro_product_specs FOR ALL WITH CHECK (true)`,
        `DROP POLICY IF EXISTS "Internal write pro_certifications" ON pro_certifications; CREATE POLICY "Internal write pro_certifications" ON pro_certifications FOR ALL WITH CHECK (true)`,
        `DROP POLICY IF EXISTS "Internal write pro_price_snapshots" ON pro_price_snapshots; CREATE POLICY "Internal write pro_price_snapshots" ON pro_price_snapshots FOR ALL WITH CHECK (true)`,
        `DROP POLICY IF EXISTS "Internal write pro_change_events" ON pro_change_events; CREATE POLICY "Internal write pro_change_events" ON pro_change_events FOR ALL WITH CHECK (true)`,
        `DROP POLICY IF EXISTS "Internal write pro_market_overviews" ON pro_market_overviews; CREATE POLICY "Internal write pro_market_overviews" ON pro_market_overviews FOR ALL WITH CHECK (true)`,
    ];

    let ok = 0;
    let fail = 0;

    for (const sql of statements) {
        const preview = sql.trim().slice(0, 60).replace(/\n/g, ' ');
        const { error } = await supabase.rpc('pg_query', { query: sql }).catch(() => ({ error: { message: 'rpc_unavailable' } }));

        if (error) {
            // Try direct table insert as a health check for CREATE TABLE statements
            console.log(`  ⚠️  Skipping (RPC not available): ${preview}...`);
            fail++;
        } else {
            console.log(`  ✅ OK: ${preview}...`);
            ok++;
        }
    }

    console.log(`\n────────────────────────────────────`);
    console.log(`📋 Result: ${ok} OK, ${fail} requires manual SQL`);
    console.log(`\n────────────────────────────────────`);
    console.log(`⚠️  Manual Step Required:`);
    console.log(`   Go to: https://supabase.com/dashboard/project/iixomkwkclvutdxvqtko/sql/new`);
    console.log(`   Paste contents of: supabase/migrations/002_procurement_intel.sql`);
    console.log(`   Click "Run" to apply all tables at once.`);
}

applyMigration();
