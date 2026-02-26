const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function populateMarketOverviews() {
    console.log("◈ POPULATING PROCUREMENT MARKET OVERVIEWS FROM SCRAPED DATA...");

    try {
        // 1. Fetch all led_products to calculate stats
        const { data: products, error: fetchError } = await supabase
            .from('led_products')
            .select('*');

        if (fetchError) throw fetchError;
        if (!products || products.length === 0) {
            console.log("! No products found in led_products. Scrape data first.");
            return;
        }

        const catStats = {};

        products.forEach(p => {
            const cat = p.category || '기타';
            if (!catStats[cat]) {
                catStats[cat] = {
                    companies: new Set(),
                    products: [],
                    totalEfficacy: 0,
                    effCount: 0
                };
            }

            const stats = catStats[cat];
            stats.companies.add(p.maker || 'Unknown');
            stats.products.push(p);

            // Extract efficacy if possible from specs or name
            const effMatch = (p.name + JSON.stringify(p.specs || '')).match(/([\d.]+)\s*lm\/w/i);
            if (effMatch) {
                stats.totalEfficacy += parseFloat(effMatch[1]);
                stats.effCount++;
            }
        });

        console.log(`◈ Found ${Object.keys(catStats).length} categories. Syncing to pro_market_overviews...`);

        for (const [catName, stats] of Object.entries(catStats)) {
            const prices = stats.products.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);
            if (prices.length === 0) continue;

            const min_price = prices[0];
            const median_price = prices[Math.floor(prices.length / 2)];
            const top_10_percent_price = prices[Math.floor(prices.length * 0.1)] || min_price;
            const avg_efficacy = stats.effCount > 0 ? parseFloat((stats.totalEfficacy / stats.effCount).toFixed(1)) : 140;

            const overview = {
                category_name: catName,
                as_of_date: new Date().toISOString().split('T')[0],
                total_companies: stats.companies.size,
                total_products: stats.products.length,
                min_price,
                median_price,
                top_10_percent_price,
                avg_efficacy,
                metrics: {
                    price_range: `${min_price} - ${prices[prices.length - 1]}`,
                    top_brands: Array.from(stats.companies).slice(0, 5)
                }
            };

            const { error: upsertError } = await supabase
                .from('pro_market_overviews')
                .upsert(overview, { onConflict: 'category_name,as_of_date' });

            if (upsertError) {
                console.error(`! Failed to upsert ${catName}:`, upsertError.message);
            } else {
                console.log(`✓ Synced: ${catName} (${stats.products.length} items)`);
            }
        }

        console.log("◈ MARKET OVERVIEW SYNC COMPLETE.");

    } catch (err) {
        console.error("! Sync Error:", err.message);
    }
}

populateMarketOverviews();
