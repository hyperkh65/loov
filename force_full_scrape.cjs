require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

function parseProductsFromHTML(html, categoryName) {
    const products = [];
    const itemRegex = /<li[^>]+id=["']productItem\d*["'][^>]*>([\s\S]*?)<\/li>/gi;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
        const item = match[1];

        // 1. Name
        const nameMatch = item.match(/<(?:p|div|span)\s+class=["'](?:prod_name|goods-list__title|goods-list__item__name)["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)
            || item.match(/class=["'](?:prod_name|goods-list__title|goods-list__item__name)["'][^>]*>([\s\S]*?)<\/span>/i)
            || item.match(/class=["'](?:prod_name|goods-list__title)["']>([\s\S]*?)<\/a>/i);
        let name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').split('\n')[0].trim() : null;

        // 2. Price
        const hiddenPriceMatch = item.match(/id=["']min_price_\d+["']\s+value=["'](\d+)["']/i);
        const priceMatch = hiddenPriceMatch
            || item.match(/<em[^>]*>([\d,]+)<\/em>\s*원/i)
            || item.match(/<p\s+class=["']goods_price["'][^>]*>[\s\S]*?<em>([\d,]+)<\/em>/i)
            || item.match(/<em\s+class=["']number["'][^>]*>([\s\S]*?)<\/em>/i)
            || item.match(/class=["'](?:price_sect|goods_price)["'].*?<em>([\d,]+)<\/em>/i);

        let price = null;
        if (hiddenPriceMatch) {
            price = parseInt(hiddenPriceMatch[1]);
        } else if (priceMatch) {
            const priceStr = priceMatch[1].replace(/<[^>]+>/g, '').replace(/[,원\s]/g, '').trim();
            price = parseInt(priceStr);
        }

        // 3. Image - Improved detection with data-src for lazyload
        const imgMatch = item.match(/data-src=["']([^"']+)["']/i)
            || item.match(/data-original=["']([^"']+)["']/i)
            || item.match(/<img[^>]+src=["']([^"']+)["']/i);

        let image = imgMatch ? imgMatch[1] : null;
        if (image && (image.includes('noImg') || image.includes('no_image') || image.includes('noData'))) {
            // If src is placeholder, try one more time for anything else
            const secondImgMatch = item.match(/(?:\/\/img\.danawa\.com\/prod_img\/[^"']+\.(?:jpg|png|gif))/i);
            if (secondImgMatch) image = secondImgMatch[0];
        }

        if (image) {
            if (image.startsWith('//')) image = 'https:' + image;
            image = image.split('?')[0];
        }

        const isDanawaLogo = image && (image.includes('no_image') || image.includes('danawa_logo') || image.includes('noData') || image.includes('noImg'));

        // 4. Specs
        const specs = {};
        const specListMatch = item.match(/<div class=["']spec_list["']>([\s\S]*?)<\/div>/i);
        if (specListMatch) {
            const rawSpecs = specListMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            specs.raw = rawSpecs;
            const wattMatch = rawSpecs.match(/(\d+)\s*w/i) || name?.match(/(\d+)\s*w/i);
            if (wattMatch) specs.wattage = wattMatch[1] + "W";

            const fluxMatch = rawSpecs.match(/([\d,]+)\s*lm/i);
            if (fluxMatch) specs.luminous_flux = fluxMatch[1].replace(/,/g, '') + "lm";

            const effMatch = rawSpecs.match(/([\d.]+)\s*lm\/w/i);
            if (effMatch) specs.efficacy = effMatch[1] + "lm/W";

            const colorMatch = rawSpecs.match(/색온도:\s*([^/ ,]+)/i);
            if (colorMatch) specs.color_temp = colorMatch[1].trim();

            const chipMatch = rawSpecs.match(/모듈칩:\s*([^/ ,]+)/i);
            if (chipMatch) specs.chip = chipMatch[1].trim();

            const certs = [];
            if (rawSpecs.includes('KS') || name?.includes('KS')) certs.push('KS');
            if (rawSpecs.includes('KC') || name?.includes('KC')) certs.push('KC');
            if (rawSpecs.includes('고효율') || name?.includes('고효율')) certs.push('고효율');
            if (certs.length > 0) specs.certifications = certs;

            const releaseMatch = item.match(/<dt>등록월<\/dt>\s*<dd>(\d{4}\.\d{2})/i);
            if (releaseMatch) specs.released_at = releaseMatch[1];
        } else {
            const wattMatch = name?.match(/(\d+)\s*W/i);
            if (wattMatch) specs.wattage = wattMatch[1] + "W";
        }

        // 5. Maker
        let maker = 'Unknown';
        if (specs.raw) {
            const specMaker = specs.raw.match(/(?:제조사|브랜드):\s*([^/ ,]+)/i);
            if (specMaker) maker = specMaker[1].trim();
        }
        if (maker === 'Unknown') {
            const makerExplicit = item.match(/<a[^>]+class=["']link_maker["'][^>]*>([\s\S]*?)<\/a>/i)
                || item.match(/<span\s+class=["']text__maker["'][^>]*>([\s\S]*?)<\/span>/i);
            if (makerExplicit) {
                maker = makerExplicit[1].replace(/<[^>]+>/g, '').trim();
            } else if (name) {
                const parts = name.split(/\s+/);
                const firstWord = parts[0];
                const commonGenerics = ['LED', '공간', '조명', 'KC', 'KS', '전구', '밝기', '국산', '모듈'];
                if (firstWord.length > 1 && !commonGenerics.includes(firstWord.toUpperCase())) {
                    maker = firstWord;
                } else if (parts[1] && parts[1].length > 1 && !commonGenerics.includes(parts[1].toUpperCase())) {
                    maker = parts[1];
                }
            }
        }

        // 7. Origin
        let productOrigin = 'Unknown';
        if (specs.raw) {
            const originMatch = specs.raw.match(/(?:제조국|원산지):\s*([^/ ,]+)/i);
            if (originMatch) productOrigin = originMatch[1].trim();
        }
        if (productOrigin === 'Unknown') {
            const checkStr = (name + " " + maker + " " + (specs.raw || "")).toLowerCase();
            if (checkStr.includes('국산') || checkStr.includes('한국') || checkStr.includes('대한민국') || checkStr.includes('korea')) productOrigin = '한국';
            else if (checkStr.includes('중국') || checkStr.includes('china')) productOrigin = '중국';
        }
        specs.origin = productOrigin;

        // 6. ID
        const idMatch = item.match(/id=["'](?:productItem_categoryInfo_|min_price_)(\d+)["']/i)
            || item.match(/data-product-code=["'](\d+)["']/i)
            || item.match(/pcode=(\d+)/i);
        const productId = idMatch ? idMatch[1] : `dnw-${Math.random().toString(36).substr(2, 9)}`;

        // Filtering
        const forbiddenTerms = ['컴퓨터', 'PC', '노트북', '모니터', '데스크탑', 'OMEN', '35L', 'GT16', 'GeForce', 'Intel', 'AMD', 'RAM', 'SSD', '메모리'];
        const isIrrelevant = name && forbiddenTerms.some(term => name.toLowerCase().includes(term.toLowerCase()));
        const isTooExpensive = price > 3000000;

        if (name && price && price > 0 && !isIrrelevant && !isTooExpensive) {
            products.push({
                external_id: productId,
                name,
                price,
                maker: maker.replace(/^\[[^\]]+\]\s*/, '').trim(),
                category: categoryName,
                seller_count: item.match(/판매처\s*<strong>([\d,]+)<\/strong>/i) ? parseInt(item.match(/판매처\s*<strong>([\d,]+)<\/strong>/i)[1].replace(/,/g, '')) : 1,
                specs,
                image_url: isDanawaLogo ? null : image,
                source: 'market_search',
                collected_at: new Date().toISOString()
            });
        }
    }
    return products;
}

async function forceScrape() {
    console.log('◈ STARTING FULL MARKET PENETRATION SCRAPE...');

    // 1. Get all active categories
    const { data: categories, error: catError } = await supabase
        .from('led_categories')
        .select('*')
        .eq('is_active', true);

    if (catError || !categories) {
        console.error('Failed to fetch categories:', catError);
        return;
    }

    console.log(`◈ FOUND ${categories.length} ACTIVE CATEGORIES.\n`);

    let totalCollected = 0;

    for (const cat of categories.slice(0, 3)) {
        console.log(`◈ ANALYZING [${cat.name}]...`);
        let catCount = 0;

        // Scrape up to 2 pages per category for quick test
        for (let page = 1; page <= 2; page++) {
            process.stdout.write(`  Page ${page}... `);
            const url = `https://search.danawa.com/dsearch.php?query=${encodeURIComponent(cat.keyword)}&page=${page}&limit=40&sort=saveDESC`;

            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
                    }
                });

                if (!response.ok) {
                    console.log(`Failed (HTTP ${response.status})`);
                    break;
                }

                const html = await response.text();
                const products = parseProductsFromHTML(html, cat.name);
                console.log(`(Found: ${products.length})`);

                if (products.length === 0) {
                    console.log('Empty. Next category.');
                    break;
                }

                const { error } = await supabase.from('led_products').upsert(products, { onConflict: 'external_id' });
                if (error) console.error('Upsert Error:', error.message);

                catCount += products.length;
                totalCollected += products.length;

                await new Promise(r => setTimeout(r, 1200)); // Politeness delay

            } catch (err) {
                console.error(`Error:`, err.message);
                break;
            }
        }

        // Update last scraped time
        await supabase.from('led_categories').update({ last_scraped_at: new Date().toISOString() }).eq('id', cat.id);
        console.log(`◈ FINISHED [${cat.name}]: ${catCount} products.\n`);
    }

    console.log(`\n◈ SCRAPE COMPLETE! TOTAL: ${totalCollected}`);
    console.log('◈ TRIGGERING FINAL REPORT...');

    try {
        const { exec } = require('child_process');
        exec('node generate_report.cjs', (error, stdout) => {
            if (!error) console.log('◈ REPORT SUCCESSFUL!');
        });
    } catch (err) { }
}

forceScrape();
