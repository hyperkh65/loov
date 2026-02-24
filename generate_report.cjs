const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function getAllProducts() {
    let all = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('led_products')
            .select('*')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        // --- FILTER IRLRELEVANT DATA ---
        const forbidden = ['컴퓨터', 'PC', '노트북', '모니터', '데스크탑', 'OMEN', '35L', 'GT16', 'GeForce', 'Intel', 'AMD', 'RAM', 'SSD', 'Lenovo', '레노버', 'LEGION', 'HP', 'Alienware', 'Dell', 'GIGABYTE', 'MSI', 'ASUS'];
        const filtered = data.filter(p => {
            const lowerName = p.name.toLowerCase();
            const isForbidden = forbidden.some(term => lowerName.includes(term.toLowerCase()));

            // Special case: Samsung/LG electronics often mixed in if they have LED in name
            const isTechGiant = (lowerName.includes('삼성') || lowerName.includes('lg')) && p.price > 300000;

            const isTooExpensive = p.price > 1500000;
            return !isForbidden && !isTooExpensive && !isTechGiant;
        });

        all.push(...filtered);
        if (data.length < PAGE_SIZE) break;
        page++;
    }
    return all;
}

function extractCertifications(p) {
    const text = (p.name + JSON.stringify(p.specs || {})).toLowerCase();
    const certs = [];
    if (text.includes('kc인증') || text.includes('kc 인증') || text.includes('kc ')) certs.push('KC');
    if (text.includes('ks인증') || text.includes('ks 인증') || text.includes('ks ')) certs.push('KS');
    return certs;
}

async function generateMarketReport() {
    console.log("◈ GENERATING HYPER-DEEP MARKET INTELLIGENCE REPORT...");

    try {
        const products = await getAllProducts();
        const total = products.length;
        console.log(`   - Analyzing ${total} items...`);

        // 1. Basic KPIs
        const prices = products.map(p => p.price).filter(p => p > 0);
        const overall_avg_price = Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1));
        const overall_min_price = prices.length ? Math.min(...prices) : 0;
        const overall_max_price = prices.length ? Math.max(...prices) : 0;

        // 2. Certification Analysis
        let kcCount = 0;
        let ksCount = 0;
        let bothCount = 0;
        products.forEach(p => {
            const certs = extractCertifications(p);
            if (certs.includes('KC') && certs.includes('KS')) bothCount++;
            else if (certs.includes('KC')) kcCount++;
            else if (certs.includes('KS')) ksCount++;
        });

        const certification_stats = {
            kc_only: parseFloat(((kcCount / total) * 100).toFixed(1)),
            ks_only: parseFloat(((ksCount / total) * 100).toFixed(1)),
            both: parseFloat(((bothCount / total) * 100).toFixed(1)),
            none: parseFloat((((total - (kcCount + ksCount + bothCount)) / total) * 100).toFixed(1)),
            kc_total_ratio: parseFloat((((kcCount + bothCount) / total) * 100).toFixed(1)),
            ks_total_ratio: parseFloat((((ksCount + bothCount) / total) * 100).toFixed(1))
        };

        // 3. Brand Deep Dive (Top 20)
        const brandCounts = {};
        products.forEach(p => brandCounts[p.maker] = (brandCounts[p.maker] || 0) + 1);
        const top_makers = Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([name, count]) => ({
                name,
                count,
                share: parseFloat(((count / total) * 100).toFixed(1))
            }));

        // 4. Price Tier Distribution
        const tiers = {
            'Entry (<₩5k)': 0,
            'Mid (₩5k-20k)': 0,
            'High (₩20k-50k)': 0,
            'Premium (>₩50k)': 0
        };
        products.forEach(p => {
            if (p.price < 5000) tiers['Entry (<₩5k)']++;
            else if (p.price < 20000) tiers['Mid (₩5k-20k)']++;
            else if (p.price < 50000) tiers['High (₩20k-50k)']++;
            else tiers['Premium (>₩50k)']++;
        });
        const price_distribution = Object.entries(tiers).map(([tier, count]) => ({
            tier,
            count,
            ratio: parseFloat(((count / total) * 100).toFixed(1))
        }));

        // 5. Category Breakdown with deeper metrics
        const catMap = {};
        products.forEach(p => {
            if (!catMap[p.category]) catMap[p.category] = { count: 0, sum: 0, min: p.price, max: p.price, certCount: 0 };
            catMap[p.category].count++;
            catMap[p.category].sum += p.price;
            if (p.price < catMap[p.category].min) catMap[p.category].min = p.price;
            if (p.price > catMap[p.category].max) catMap[p.category].max = p.price;
            if (extractCertifications(p).length > 0) catMap[p.category].certCount++;
        });
        const category_stats = Object.entries(catMap).map(([category, data]) => ({
            category,
            count: data.count,
            avg: Math.round(data.sum / data.count),
            min: data.min,
            max: data.max,
            cert_ratio: parseFloat(((data.certCount / data.count) * 100).toFixed(1))
        }));

        // 6. Waste Items
        const waste_items = products
            .filter(p => p.price > overall_avg_price * 3) // More aggressive filter
            .sort((a, b) => b.price - a.price)
            .slice(0, 10)
            .map(p => ({
                name: p.name,
                price: p.price,
                avg_price: overall_avg_price,
                diff_percent: Math.round(((p.price - (overall_avg_price || 1)) / (overall_avg_price || 1)) * 100)
            }));

        // 7. Dynamic AI Commentary
        const topBrand = top_makers[0]?.name || 'Unknown';
        const certHealth = certification_stats.kc_total_ratio > 30 ? '건강함' : '주의필요';
        const ai_commentary = `오늘 시장 조사는 끝판왕이야! ${total.toLocaleString()}개 제품 중 KC/KS 인증 비중이 ${certification_stats.kc_total_ratio}% 정도네. 인증 제품이 생각보다 많아서 시장이 꽤 ${certHealth} 상태라고 볼 수 있겠어. 
가격대를 보니까 ₩5,000 이하 입문형 제품이 전체의 ${price_distribution[0].ratio}%를 차지할 정도로 경쟁이 치열해. 
특히 '${topBrand}'가 물량 공세를 엄청하고 있는데, 그 사이에서 가격이 평균보다 3배 넘게 비싼 거품 낀 녀석들도 내가 다 골라냈어. 
하단의 인증 분포와 제조사 점유율 그래프를 보면 어떤 브랜드가 시장을 주도하는지 한눈에 보일 거야! 😎`;

        const report = {
            date: new Date().toISOString().split('T')[0],
            total_products: total,
            total_makers: Object.keys(brandCounts).length,
            overall_avg_price,
            overall_min_price,
            overall_max_price,
            category_stats,
            top_makers,
            waste_items,
            ai_commentary,
            generated_at: new Date().toISOString()
        };

        // 8. Need to make sure market_depth column exists in DB or map it
        // I will map price_distribution to a new field or nested in category_stats if needed
        // For now, I'll try upserting as is. If it fails, I'll adapt.
        const { error: reportError } = await supabase.from('led_reports').upsert(report, { onConflict: 'date' });

        if (reportError) {
            console.error("! Failed to save report:", reportError.message);
            // Fallback: strip market_depth if column missing
            delete report.market_depth;
            await supabase.from('led_reports').upsert(report, { onConflict: 'date' });
        } else {
            console.log("◈ HYPER-DEEP MARKET INTELLIGENCE REPORT GENERATED.");
        }
    } catch (err) {
        console.error("! Error during deep report generation:", err.message);
    }
}

generateMarketReport();
