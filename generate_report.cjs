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

// Unified Origin Detection
function detectOrigin(p) {
    const specStr = JSON.stringify(p.specs || {}).toLowerCase();
    const brandStr = (p.name + " " + (p.maker || "") + " " + specStr).toLowerCase();

    const hasChina = brandStr.includes('중국') || brandStr.includes('made in china') || brandStr.includes('china') || brandStr.includes('대륙');
    const hasKorea = brandStr.includes('국산') || brandStr.includes('한국') || brandStr.includes('대한민국') || brandStr.includes('korea');

    // China-first logic: If China is mentioned at all, or it's a generic marketplace item
    if (hasChina) return 'China';
    if (hasKorea) return 'Korea';

    // Defaults based on heuristics
    if (p.maker === 'Unknown' || p.maker === '기타' || p.price < 5000) return 'China';
    return 'Korea';
}

async function generateMarketReport() {
    console.log("◈ GENERATING HYPER-DEEP MARKET INTELLIGENCE REPORT...");

    try {
        const products = await getAllProducts();
        const total = products.length;
        if (total === 0) return;

        console.log(`   - Analyzing ${total} items...`);

        // 1. Basic KPIs
        const prices = products.map(p => p.price).filter(p => p > 0);
        const overall_avg_price = Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1));

        // 2. Brand Analysis
        const brandStats = {};
        products.forEach(p => {
            let maker = (p.maker || 'Unknown').trim();
            if (maker.includes('[해외]') || maker === 'Unknown' || maker === '기타') return;

            if (!brandStats[maker]) {
                brandStats[maker] = { count: 0, prices: [], certCount: 0, chinaCount: 0 };
            }
            brandStats[maker].count++;
            brandStats[maker].prices.push(p.price);
            if (extractCertifications(p).length > 0) brandStats[maker].certCount++;
            if (detectOrigin(p) === 'China') brandStats[maker].chinaCount++;
        });

        const top_makers = Object.entries(brandStats)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 100)
            .map(([name, data]) => ({
                name,
                count: data.count,
                share: parseFloat(((data.count / total) * 100).toFixed(1)),
                avgPrice: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.count),
                certRatio: parseFloat(((data.certCount / data.count) * 100).toFixed(1)),
                chinaRatio: parseFloat(((data.chinaCount / data.count) * 100).toFixed(1))
            }));

        // 3. Category Analysis
        const catStats = {};
        products.forEach(p => {
            if (!catStats[p.category]) catStats[p.category] = { count: 0, prices: [], chinaCount: 0 };
            catStats[p.category].count++;
            catStats[p.category].prices.push(p.price);
            if (detectOrigin(p) === 'China') catStats[p.category].chinaCount++;
        });

        const sortedCats = Object.entries(catStats).sort((a, b) => b[1].count - a[1].count);
        const topCat = sortedCats[0];
        const topCatName = topCat[0];
        const topCatChinaRatio = ((topCat[1].chinaCount / topCat[1].count) * 100).toFixed(1);

        // 4. Origin Summary
        let koreaCount = 0;
        let chinaCount = 0;
        products.forEach(p => {
            if (detectOrigin(p) === 'China') chinaCount++;
            else koreaCount++;
        });

        const origin_stats = {
            korea_ratio: parseFloat(((koreaCount / total) * 100).toFixed(1)),
            china_ratio: parseFloat(((chinaCount / total) * 100).toFixed(1))
        };

        // 5. Price Distribution
        const priceTiers = [
            { label: 'Entry (<₩5k)', count: products.filter(p => p.price < 5000).length },
            { label: 'Mid (₩5k-20k)', count: products.filter(p => p.price >= 5000 && p.price < 20000).length },
            { label: 'High (₩20k-50k)', count: products.filter(p => p.price >= 20000 && p.price < 50000).length },
            { label: 'Premium (>₩50k)', count: products.filter(p => p.price >= 50000).length }
        ];
        const distribution = priceTiers.map(t => ({ tier: t.label, ratio: parseFloat(((t.count / total) * 100).toFixed(1)) }));
        const dominantTier = priceTiers.sort((a, b) => b.count - a.count)[0].label;

        // 6. Strategic AI Commentary
        const topBrand = top_makers[0] || { name: '시장 선도 브랜드', chinaRatio: 0, avgPrice: 0 };
        const secondBrand = top_makers[1] || { name: '후발주자', chinaRatio: 0 };

        let sentiment = "";
        if (origin_stats.china_ratio > 30) sentiment = "중국산 저가 공세가 매우 거섭니다. 시장의 가격 주도권이 이미 상당 부분 넘어간 상태네요.";
        else sentiment = "국산 브랜드들이 품질과 신뢰를 바탕으로 견고한 점유율을 유지하고 있는 건강한 생태계입니다.";

        const ai_commentary = `◈ 전략 리포트 (분석 시각: ${new Date().toLocaleString()})
현재 ${total.toLocaleString()}개 품목 전수 조사 결과, 시장의 심장부는 '${topCatName}' 분야로 총 ${topCat[1].count}개의 SKU가 경쟁 중입니다. 
가장 활발한 가격대는 '${dominantTier}'로 확인되며, 여기서의 승자가 전체 점유율을 결정짓고 있네요.

특히 점유율 1위인 '${topBrand.name}' 브랜드는 평균 단가 ₩${topBrand.avgPrice.toLocaleString()} 선에서 ${topBrand.chinaRatio > 50 ? '중국 OEM' : '국산 제조'} 중심의 라인업을 구축하며 시장을 장착했습니다. 
전체 중국산 비중은 ${origin_stats.china_ratio}%로 집계되는데, 특히 '${topCatName}' 카테고리 내 중국산 비중이 ${topCatChinaRatio}%에 육박하며 국산 프리미엄 라인을 위협하는 양상입니다. 
${sentiment} 향후 '${secondBrand.name}'과의 핵심 가격 구간대 경쟁이 전체 시장 판도를 바꿀 분수령이 될 것으로 보입니다! 😉`;

        const report = {
            date: new Date().toISOString().split('T')[0],
            total_products: total,
            total_makers: Object.keys(brandStats).length,
            total_categories: Object.keys(catStats).length,
            overall_avg_price,
            category_stats: Object.fromEntries(Object.entries(catStats).map(([k, v]) => [k, v.count])),
            top_makers,
            waste_items: {
                origin_stats,
                price_distribution: distribution,
                market_insights: {
                    top_category: topCatName,
                    dominant_tier: dominantTier,
                    sentiment
                }
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
