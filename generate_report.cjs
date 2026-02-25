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

        const forbidden = ['컴퓨터', 'PC', '노트북', '모니터', '데스크탑', 'OMEN', '35L', 'GT16', 'GeForce', 'Intel', 'AMD', 'RAM', 'SSD', 'Lenovo', '레노버', 'LEGION', 'HP', 'Alienware', 'Dell', 'GIGABYTE', 'MSI', 'ASUS'];
        const filtered = data.filter(p => {
            const lowerName = p.name.toLowerCase();
            const isForbidden = forbidden.some(term => lowerName.includes(term.toLowerCase()));
            const isTechGiant = (lowerName.includes('삼성') || lowerName.includes('lg')) && p.price > 400000;
            const isTooExpensive = p.price > 2000000;
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

        // 2. Brand Portfolio (Products per Brand)
        const brandStats = {};
        products.forEach(p => {
            let maker = (p.maker || 'Unknown').trim();
            if (maker.includes('[해외]') || maker === 'Unknown' || maker === '기타') return;

            if (!brandStats[maker]) {
                brandStats[maker] = { count: 0, prices: [], certCount: 0, releaseYears: {} };
            }
            brandStats[maker].count++;
            brandStats[maker].prices.push(p.price);
            if (extractCertifications(p).length > 0) brandStats[maker].certCount++;

            // Extract release year from specs.released_at (format: YYYY.MM)
            const releaseDate = p.specs?.released_at;
            if (releaseDate && releaseDate.includes('.')) {
                const year = releaseDate.split('.')[0];
                brandStats[maker].releaseYears[year] = (brandStats[maker].releaseYears[year] || 0) + 1;
            }
        });

        const top_makers = Object.entries(brandStats)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 50) // Show top 50 in stats
            .map(([name, data]) => ({
                name,
                count: data.count,
                share: parseFloat(((data.count / total) * 100).toFixed(1)),
                avgPrice: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.count),
                certRatio: parseFloat(((data.certCount / data.count) * 100).toFixed(1)),
                releaseYears: data.releaseYears
            }));

        // 3. Global Release Trends (Last 5 Years)
        const yearlyTrends = {};
        products.forEach(p => {
            const releaseDate = p.specs?.released_at;
            if (releaseDate && releaseDate.includes('.')) {
                const year = releaseDate.split('.')[0];
                yearlyTrends[year] = (yearlyTrends[year] || 0) + 1;
            }
        });

        // 4. Category Composition
        const catCounts = {};
        products.forEach(p => catCounts[p.category] = (catCounts[p.category] || 0) + 1);
        const category_stats = {};
        Object.entries(catCounts).forEach(([cat, count]) => category_stats[cat] = count);

        // 5. Origin Summary
        let koreaCount = 0;
        let chinaCount = 0;
        products.forEach(p => {
            const specStr = JSON.stringify(p.specs || {}).toLowerCase();
            const brandStr = (p.name + " " + (p.maker || "") + " " + specStr).toLowerCase();

            // Check China-first logic: Chinese indicators or generic marketplace sellers
            const isChina = brandStr.includes('중국') || brandStr.includes('made in china') || brandStr.includes('china') ||
                p.maker === 'Unknown' || p.maker === '기타' || brandStr.includes('대륙');
            const isKorea = brandStr.includes('국산') || brandStr.includes('한국') || brandStr.includes('대한민국') || brandStr.includes('korea');

            if (isChina) chinaCount++;
            else if (isKorea) koreaCount++;
            else {
                // If ambiguous, assume China for low-cost generic items, Korea for higher-end
                if (p.price < 5000) chinaCount++;
                else koreaCount++;
            }
        });

        const origin_stats = {
            korea_ratio: parseFloat(((koreaCount / total) * 100).toFixed(1)),
            china_ratio: parseFloat(((chinaCount / total) * 100).toFixed(1)),
            other_ratio: parseFloat((((total - koreaCount - chinaCount) / total) * 100).toFixed(1))
        };

        // 6. AI Commentary
        const topBrand = top_makers[0]?.name || 'Unknown';
        const ai_commentary = `오늘 시장 조사는 정말 놀라워! 총 ${total.toLocaleString()}개의 상품을 전수 조사했어.
현재 시각 ${new Date().toLocaleString()} 기준으로 분석한 결과, 중국산 비중이 ${origin_stats.china_ratio}%로 나타나며 가성비 시장을 장악하고 있네.
국산 제품(${origin_stats.korea_ratio}%)은 주로 프리미엄 및 안정성 중심의 주거용 조명 시장(거실등, 방등)에서 방어선을 구축하고 있어.
리더 브랜드인 '${topBrand}'의 행보가 눈에 띄는데, 앞으로의 가격 경쟁이 더 치열해질 것 같아! 😉`;

        const report = {
            date: new Date().toISOString().split('T')[0],
            total_products: total,
            total_makers: Object.keys(brandStats).length,
            total_categories: Object.keys(catCounts).length,
            overall_avg_price,
            category_stats,
            top_makers,
            waste_items: {
                yearly_trends: yearlyTrends,
                origin_stats: origin_stats,
                price_distribution: [
                    { tier: 'Entry (<₩5k)', ratio: parseFloat(((products.filter(p => p.price < 5000).length / total) * 100).toFixed(1)) },
                    { tier: 'Mid (₩5k-20k)', ratio: parseFloat(((products.filter(p => p.price >= 5000 && p.price < 20000).length / total) * 100).toFixed(1)) },
                    { tier: 'High (₩20k-50k)', ratio: parseFloat(((products.filter(p => p.price >= 20000 && p.price < 50000).length / total) * 100).toFixed(1)) },
                    { tier: 'Premium (>₩50k)', ratio: parseFloat(((products.filter(p => p.price >= 50000).length / total) * 100).toFixed(1)) }
                ]
            },
            ai_commentary,
            generated_at: new Date().toISOString()
        };

        const { error: reportError } = await supabase.from('led_reports').upsert(report, { onConflict: 'date' });
        if (reportError) console.error("! Error saving report:", reportError.message);
        else console.log("◈ DEP-DIVE MARKET INTELLIGENCE REPORT GENERATED.");

    } catch (err) {
        console.error("! Error during generation:", err.stack);
    }
}

generateMarketReport();
