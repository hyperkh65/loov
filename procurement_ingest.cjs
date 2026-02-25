const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// IMPORTANT: Requires service_role key to bypass RLS for DDL or if RLS is strict.
// For now we use ANON key and assume RLS is set to public-write in the migration.
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * 1. Normalizer: LED Spec Parser
 * Extracts Power (W), Lumens (lm), Efficiency (lm/W), CCT (K), CRI from raw text.
 */
function normalizeLedSpecs(rawText) {
    if (!rawText) return {};
    const text = rawText.toLowerCase();

    const specs = {
        power_w: null,
        luminous_flux_lm: null,
        efficacy_lm_per_w: null,
        cct_k: null,
        cri: null,
        ip_rating: null,
        warranty_years: null
    };

    // Power (W)
    const powerMatch = text.match(/소비전력\s*:\s*([\d.]+)\s*w/i) || text.match(/(\d+)\s*w/i);
    if (powerMatch) specs.power_w = parseFloat(powerMatch[1]);

    // Lumens (lm)
    const lumenMatch = text.match(/광속\s*:\s*([\d,]+)\s*lm/i) || text.match(/([\d,]+)\s*lm/i);
    if (lumenMatch) specs.luminous_flux_lm = parseInt(lumenMatch[1].replace(/,/g, ''));

    // Efficiency (lm/W)
    const efficiencyMatch = text.match(/광효율\s*:\s*([\d.]+)\s*lm\/w/i) || text.match(/([\d.]+)\s*lm\/w/i);
    if (efficiencyMatch) specs.efficacy_lm_per_w = parseFloat(efficiencyMatch[1]);

    // CCT (K)
    const cctMatch = text.match(/색온도\s*:\s*(\d{4})k/i) || text.match(/(\d{4})k/i);
    if (cctMatch) specs.cct_k = parseInt(cctMatch[1]);

    // CRI (Ra)
    const criMatch = text.match(/연색성\s*:\s*(\d+)/i) || text.match(/ra\s*>?(\d+)/i);
    if (criMatch) specs.cri = parseInt(criMatch[1]);

    // IP Rating
    const ipMatch = text.match(/ip(\d+)/i);
    if (ipMatch) specs.ip_rating = 'IP' + ipMatch[1];

    // Warranty
    const warrantyMatch = text.match(/보증(?:기간)?\s*:\s*(\d+)\s*년/i);
    if (warrantyMatch) specs.warranty_years = parseInt(warrantyMatch[1]);

    return specs;
}

/**
 * 2. Change Detector
 * Compares before/after and generates events.
 */
function detectChanges(oldProduct, newProduct) {
    const events = [];

    // Price change
    if (oldProduct.price && oldProduct.price !== newProduct.price) {
        const diff = newProduct.price - oldProduct.price;
        const pct = ((diff / oldProduct.price) * 100).toFixed(1);
        events.push({
            event_type: 'price_change',
            before_value: { price: oldProduct.price },
            after_value: { price: newProduct.price },
            diff_summary: `가격이 ${pct}% ${diff > 0 ? '인상' : '인하'}되었습니다. (₩${oldProduct.price.toLocaleString()} → ₩${newProduct.price.toLocaleString()})`,
            severity: Math.abs(parseFloat(pct)) > 10 ? 'high' : 'medium'
        });
    }

    // Status change
    if (oldProduct.status !== newProduct.status) {
        events.push({
            event_type: 'status_change',
            before_value: { status: oldProduct.status },
            after_value: { status: newProduct.status },
            diff_summary: `제품 상태가 '${oldProduct.status}'에서 '${newProduct.status}'로 변경되었습니다.`,
            severity: 'high'
        });
    }

    return events;
}

/**
 * 3. Main Ingestion Loop
 */
async function runProcurementIngest() {
    console.log("◈ STARTING PROCUREMENT DATA INGESTION & NORMALIZATION...");

    try {
        // Fetch raw data from market_search (simulating G2B data bridge for MVP)
        const { data: rawProducts, error: fetchError } = await supabase
            .from('led_products')
            .select('*')
            .limit(100); // Process in batches for MVP

        if (fetchError) throw fetchError;

        console.log(`◈ Processing ${rawProducts.length} items...`);

        for (const raw of rawProducts) {
            // 1. Company Prep
            const { data: company, error: compError } = await supabase
                .from('pro_companies')
                .upsert({ name: raw.maker || 'Unknown' }, { onConflict: 'name', onConflict: 'name' })
                .select()
                .single();

            if (compError) continue;

            const productIdentifier = raw.external_id; // Mapping market ID to G2B style ID for simulation

            // 2. Fetch Existing for Comparison
            const { data: existing } = await supabase
                .from('pro_products')
                .select('*')
                .eq('prdct_idnt_no', productIdentifier)
                .single();

            // 3. Normalized Product Upsert
            const proProduct = {
                prdct_idnt_no: productIdentifier,
                name: raw.name,
                category_lv2: raw.category,
                company_id: company.id,
                image_url: raw.image_url,
                source_updated_at: new Date().toISOString()
            };

            const { data: savedProduct, error: prodError } = await supabase
                .from('pro_products')
                .upsert(proProduct, { onConflict: 'prdct_idnt_no' })
                .select()
                .single();

            if (prodError) {
                console.error("Prod Upsert Error:", prodError.message);
                continue;
            }

            // 4. Normalized Specs
            const normSpecs = normalizeLedSpecs(raw.specs?.raw || raw.name);
            await supabase.from('pro_product_specs').upsert({
                product_id: savedProduct.id,
                as_of_date: new Date().toISOString().split('T')[0],
                ...normSpecs,
                notes_raw_text: raw.specs?.raw,
                parse_confidence: Object.values(normSpecs).filter(v => v !== null).length / Object.keys(normSpecs).length
            });

            // 5. Price Snapshot
            await supabase.from('pro_price_snapshots').upsert({
                product_id: savedProduct.id,
                as_of_date: new Date().toISOString().split('T')[0],
                price_type: 'contract_unit_price',
                unit_price: raw.price
            });

            // 6. Change Detection
            if (existing) {
                const events = detectChanges(existing, proProduct);
                for (const event of events) {
                    await supabase.from('pro_change_events').insert({
                        product_id: savedProduct.id,
                        ...event
                    });
                }
            } else {
                // New product event
                await supabase.from('pro_change_events').insert({
                    product_id: savedProduct.id,
                    event_type: 'new_product',
                    diff_summary: '신규 조달 제품이 등록되었습니다.',
                    severity: 'medium'
                });
            }
        }

        console.log("◈ PROCUREMENT INGESTION COMPLETE.");

    } catch (err) {
        console.error("! Ingestion Error:", err.message);
    }
}

runProcurementIngest();
