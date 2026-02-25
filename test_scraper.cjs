require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testScraper() {
    console.log("◈ STARTING TEST SCRAPE...");

    // First ensure led_categories exist
    console.log("Checking categories...");
    const { data: cats, error: catError } = await supabase.from('led_categories').select('*');

    if (catError || !cats || cats.length === 0) {
        console.log("! Categories missing or empty. Populating initial data...");
        const initialCats = [
            { name: 'LED 센서등', keyword: 'LED 센서등' },
            { name: 'LED 다운라이트', keyword: 'LED 다운라이트' },
            { name: 'LED 방등', keyword: 'LED 방등' },
            { name: 'LED 평판등', keyword: 'LED 평판등' },
            { name: 'LED 직부등', keyword: 'LED 직부등' },
            { name: 'LED 주방등', keyword: 'LED 주방등' },
            { name: 'LED 욕실등', keyword: 'LED 욕실등' },
            { name: 'LED 거실등', keyword: 'LED 거실등' },
            { name: 'LED T5', keyword: 'LED T5' },
            { name: 'LED 전구', keyword: 'LED 전구' }
        ];
        // This might fail if the table doesn't exist.
        const { error: insertError } = await supabase.from('led_categories').upsert(initialCats, { onConflict: 'name' });
        if (insertError) {
            console.error("! Could not populate categories:", insertError.message);
            console.log("! Please ensure the 'led_categories' table is created manually.");
            return;
        }
    }

    // Now test one category scrape
    const keyword = 'LED 센서등';
    const pages = 2; // Test just 2 pages
    console.log(`Testing scrape for: ${keyword} (${pages} pages)`);

    const allProducts = [];
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    for (let page = 1; page <= pages; page++) {
        console.log(`  Page ${page}...`);
        const url = `https://search.danawa.com/dsearch.php?query=${encodeURIComponent(keyword)}&page=${page}&limit=40&sort=saveDESC`;
        const resp = await fetch(url, { headers });
        const html = await resp.text();

        const products = parseProductsFromHTML(html);
        console.log(`    Found ${products.length} valid products.`);
        allProducts.push(...products);
    }

    console.log(`◈ TEST DONE. TOTAL PRODUCTS FOUND: ${allProducts.length}`);
    if (allProducts.length > 0) {
        console.log("SAMPLE:", allProducts[0]);
        // Optionally upsert a few to test DB
        // await supabase.from('led_products').upsert(allProducts.slice(0, 5), { onConflict: 'external_id' });
    }
}

function parseProductsFromHTML(html) {
    const products = [];
    const itemRegex = /<li[^>]+(?:class="prod_item|id="productItem|class="goods-list__item")[^>]*>([\s\S]*?)<\/li>/gi;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
        const item = match[1];

        // Name
        const nameMatch = item.match(/class="(?:prod_name|goods-list__title|goods-list__item__name)"[^>]*>([\s\S]*?)<\/span>/i)
            || item.match(/<p\s+class="prod_name"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)
            || item.match(/class="(?:prod_name|goods-list__title)">([\s\S]*?)<\/a>/i);
        let name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : null;

        // Price
        const priceMatch = item.match(/<em\s+class="number"[^>]*>([\s\S]*?)<\/em>/i)
            || item.match(/<p\s+class="price_sect"[^>]*>[\s\S]*?<em[^>]*>([\s\S]*?)<\/em>/i)
            || item.match(/class="price_sect".*?<em>([\d,]+)<\/em>/i);
        const priceStr = priceMatch ? priceMatch[1].replace(/<[^>]+>/g, '').replace(/[,원\s]/g, '').trim() : null;
        const price = priceStr ? parseInt(priceStr) : null;

        // Maker/Brand
        const makerMatch = item.match(/제조사:\s*([^<\n]+)/i) || item.match(/<span\s+class="text__maker"[^>]*>([\s\S]*?)<\/span>/i);
        let maker = makerMatch ? makerMatch[1].replace(/<[^>]+>/g, '').trim() : 'Unknown';

        const imgMatch = item.match(/<img[^>]+src="([^"]+)"/i) || item.match(/src="(\/\/img\.danawa\.com\/prod_img\/[^"]+)"/i);
        let image = imgMatch ? imgMatch[1] : null;
        if (image && image.startsWith('//')) image = 'https:' + image;

        const isDanawaLogo = image && (image.includes('no_image') || image.includes('danawa_logo') || image.includes('img_danawa.com/new/no_image'));

        // Filter irrelevant
        const forbiddenTerms = ['컴퓨터', 'PC', '노트북', '모니터', '데스크탑', 'OMEN', '35L', 'GT16', 'GeForce', 'Intel', 'AMD', 'RAM', 'SSD', '메모리'];
        const isIrrelevant = name && forbiddenTerms.some(term => name.toLowerCase().includes(term.toLowerCase()));

        if (name && price && price > 0 && !isIrrelevant && !isDanawaLogo) {
            products.push({
                external_id: `test-${Math.random()}`,
                name,
                price,
                maker,
                image_url: image
            });
        }
    }
    return products;
}

testScraper();
