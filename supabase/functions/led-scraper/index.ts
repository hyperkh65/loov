import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Client as NotionClient } from 'https://esm.sh/@notionhq/client'

const DANAWA_BASE = 'https://search.danawa.com/dsearch.php'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseProductsFromHTML(html: string) {
    const products = []
    const itemRegex = /<li[^>]+(?:class="prod_item|id="productItem|class="goods-list__item")[^>]*>([\s\S]*?)<\/li>/gi
    let match

    while ((match = itemRegex.exec(html)) !== null) {
        const item = match[1]

        // Name
        const nameMatch = item.match(/class="(?:prod_name|goods-list__title|goods-list__item__name)"[^>]*>([\s\S]*?)<\/span>/i)
            || item.match(/<p\s+class="prod_name"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)
            || item.match(/class="(?:prod_name|goods-list__title)">([\s\S]*?)<\/a>/i)
        let name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : null

        // Price
        const priceMatch = item.match(/<em\s+class="number"[^>]*>([\s\S]*?)<\/em>/i)
            || item.match(/<p\s+class="price_sect"[^>]*>[\s\S]*?<em[^>]*>([\s\S]*?)<\/em>/i)
            || item.match(/class="price_sect".*?<em>([\d,]+)<\/em>/i)
        const priceStr = priceMatch ? priceMatch[1].replace(/<[^>]+>/g, '').replace(/[,원\s]/g, '').trim() : null
        const price = priceStr ? parseInt(priceStr) : null

        // Seller Count (Retailer Count)
        const sellerMatch = item.match(/판매처\s*<strong>([\d,]+)<\/strong>/i)
            || item.match(/판매처\s*([\d,]+)/i)
            || item.match(/>([\d,]+)개\s*판매처/i)
        const sellerCount = sellerMatch ? parseInt(sellerMatch[1].replace(/,/g, '')) : 1

        // Maker/Brand
        const makerMatch = item.match(/제조사:\s*([^<\n]+)/i) || item.match(/<span\s+class="text__maker"[^>]*>([\s\S]*?)<\/span>/i)
        let maker = makerMatch ? makerMatch[1].replace(/<[^>]+>/g, '').trim() : 'Unknown'
        if ((maker === 'Unknown' || maker === '') && name) {
            const firstWord = name.split(' ')[0]
            if (firstWord.length > 1) maker = firstWord
        }

        // Category & Specs (Size, Power)
        const catMatch = item.match(/<span\s+class="text__category"[^>]*>([\s\S]*?)<\/span>/i)
        const category = catMatch ? catMatch[1].replace(/<[^>]+>/g, '').trim() : 'LED'

        // Detailed Specs Extraction
        const specs: any = {}
        const sizeMatch = name?.match(/(\d+)\s*(?:inch|인치|")/i) || item.match(/(\d+)\s*(?:inch|인치|")/i)
        if (sizeMatch) specs.size = sizeMatch[1] + "inch"

        const wattMatch = name?.match(/(\d+)\s*W/i) || item.match(/(\d+)\s*W/i)
        if (wattMatch) specs.wattage = wattMatch[1] + "W"

        const tempMatch = name?.match(/(\d{4})K/i) || item.match(/(\d{4})K/i) || item.match(/(전구색|주백색|주광색)/i)
        if (tempMatch) specs.color_temp = tempMatch[1]

        const imgMatch = item.match(/<img[^>]+src="([^"]+)"/i) || item.match(/src="(\/\/img\.danawa\.com\/prod_img\/[^"]+)"/i)
        let image = imgMatch ? imgMatch[1] : null
        if (image && image.startsWith('//')) image = 'https:' + image

        const isDanawaLogo = image && (image.includes('no_image') || image.includes('danawa_logo') || image.includes('img_danawa.com/new/no_image'))

        const idMatch = item.match(/data-product-code="(\d+)"/i) || item.match(/pcode=(\d+)/i) || item.match(/id="productItem-(\d+)"/i)
        const productId = idMatch ? idMatch[1] : null

        // --- FILTER IRRELEVANT PRODUCTS ---
        const forbiddenTerms = ['컴퓨터', 'PC', '노트북', '모니터', '데스크탑', 'OMEN', '35L', 'GT16', 'GeForce', 'Intel', 'AMD', 'RAM', 'SSD', '메모리'];
        const lowerName = name?.toLowerCase() || '';
        const isIrrelevant = forbiddenTerms.some(term => lowerName.includes(term.toLowerCase()));

        // Clean brand name
        maker = maker.replace(/^\[[^\]]+\]\s*/, '').trim();
        if (maker === 'Unknown' || maker === '' || maker === '해외' || maker === '국내') {
            const cleanName = name.replace(/^\[[^\]]+\]\s*/, '').trim();
            const firstWord = cleanName.split(' ')[0];
            if (firstWord.length > 1) maker = firstWord;
        }

        if (name && price && price > 0 && !isIrrelevant && !isDanawaLogo) {
            products.push({
                external_id: productId || `dnw-${Math.random().toString(36).substr(2, 9)}`,
                name,
                price,
                maker,
                category,
                seller_count: sellerCount,
                specs,
                image_url: image,
                source: 'market_search',
                collected_at: new Date().toISOString(),
            })
        }
    }
    return products
}

function parseTotalCount(html: string) {
    const m = html.match(/<strong>([\d,]+)<\/strong>\s*개/i)
        || html.match(/총\s*<strong>([\d,]+)<\/strong>/i)
        || html.match(/검색결과\s*([\d,]+)/i)
    return m ? parseInt(m[1].replace(/,/g, '')) : 300
}

function generateAiCommentary(data: any) {
    const { avgPrice, wasteCount, topMaker, marketVolume } = data
    return `안녕! 오늘 LED 시장 조사를 끝냈어. 현재 온라인 상에는 약 ${marketVolume.toLocaleString()}개의 제품이 활발히 유통되고 있네. 가장 영향력 있는 브랜드는 '${topMaker}'(으)로 보여. 전체 평균가는 ₩${avgPrice.toLocaleString()} 선인데, 그 중 ${wasteCount}개 정도는 가격 거품이 좀 있더라고. 특히 다운라이트 시장은 인치별로 가격 차이가 좀 있으니 내가 정리한 표를 꼭 확인해봐! 궁금한 거 있으면 더 물어봐줘. 😉`
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const jobId = '00000000-0000-0000-0000-000000000001'
    let supabase: any;
    let notion: any;
    let marketDbId: string | undefined;

    try {
        supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
        notion = new NotionClient({ auth: Deno.env.get('NOTION_TOKEN') })
        marketDbId = Deno.env.get('NOTION_MARKET_DB_ID')

        await supabase.from('led_collection_jobs').update({
            status: 'RUNNING',
            progress: '◈ STARTING DEEP MARKET ANALYSIS...',
            started_at: new Date().toISOString()
        }).eq('id', jobId)

        const allProducts = []
        let totalCount = 0
        const perPage = 30
        const decoder = new TextDecoder('euc-kr')

        // Session and Headers
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://www.danawa.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        }

        // Fetch categories from DB
        const { data: dbCats } = await supabase.from('led_categories').select('*').eq('is_active', true)
        const activeCategories = dbCats || []

        for (const cat of activeCategories) {
            const query = cat.keyword || cat.name
            console.log(`Analyzing: ${query}`)
            // Scrape multiple pages
            for (let page = 1; page <= 30; page++) {
                console.log(`  Page ${page}...`)
                const queryUrl = `${DANAWA_BASE}?query=${encodeURIComponent(query)}&page=${page}&limit=40&sort=saveDESC`
                const resp = await fetch(queryUrl, { headers })
                const buf = await resp.arrayBuffer()
                const html = decoder.decode(buf)

                if (totalCount === 0 && page === 1) totalCount += parseTotalCount(html)
                const products = parseProductsFromHTML(html)
                // Add the specific category to the product
                products.forEach(p => p.category = cat.name)
                allProducts.push(...products)

                await new Promise(r => setTimeout(r, 500))
                if (products.length < 5) break; // End of results
            }
            // Update last scraped time
            await supabase.from('led_categories').update({ last_scraped_at: new Date().toISOString() }).eq('id', cat.id)
        }

        if (allProducts.length > 0) {
            // DEEP MARKET ANALYSIS LOGIC
            const brands: Record<string, number> = {}
            const retailers: number[] = []
            const specBreakdown: Record<string, { count: number, sum: number }> = {}

            allProducts.forEach(p => {
                brands[p.maker] = (brands[p.maker] || 0) + 1
                retailers.push(p.seller_count)

                const size = p.specs?.size || 'Other'
                if (!specBreakdown[size]) specBreakdown[size] = { count: 0, sum: 0 }
                specBreakdown[size].count++
                specBreakdown[size].sum += p.price
            })

            const topMakers = Object.entries(brands)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, count]) => ({ name, count, share: Math.round((count / allProducts.length) * 100) }))

            const avgRetailers = Math.round(retailers.reduce((s, c) => s + c, 0) / retailers.length)
            const overallAvg = Math.round(allProducts.reduce((s, p) => s + p.price, 0) / allProducts.length)

            const marketDepth = {
                brand_share: topMakers,
                retailer_depth: {
                    avg_retailers_per_product: avgRetailers,
                    max_retailers: Math.max(...retailers),
                },
                lineup_breakdown: Object.entries(specBreakdown).map(([size, data]) => ({
                    spec: size,
                    count: data.count,
                    avg_price: Math.round(data.sum / data.count)
                })).sort((a, b) => a.spec.localeCompare(b.spec))
            }

            const report = {
                date: new Date().toISOString().split('T')[0],
                total_products: totalCount || allProducts.length,
                total_makers: Object.keys(brands).length,
                overall_avg_price: overallAvg,
                market_depth: marketDepth,
                ai_commentary: generateAiCommentary({
                    avgPrice: overallAvg,
                    wasteCount: allProducts.filter(p => p.price > overallAvg * 1.5).length,
                    topMaker: topMakers[0]?.name || 'Unknown',
                    marketVolume: totalCount || allProducts.length
                }),
                generated_at: new Date().toISOString()
            }

            // Save to Supabase (assuming columns exist or will be added)
            await supabase.from('led_products').upsert(allProducts, { onConflict: 'external_id' })
            await supabase.from('led_reports').upsert(report, { onConflict: 'date' })

            await supabase.from('led_collection_jobs').update({
                status: 'COMPLETED',
                progress: `◈ ANALYSIS COMPLETE: ${allProducts.length} SAMPLES, DEEP INSIGHTS GENERATED`,
                finished_at: new Date().toISOString()
            }).eq('id', jobId)
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (err) {
        console.error('System Error:', err)
        if (supabase) await supabase.from('led_collection_jobs').update({ status: 'FAILED', progress: `◈ ERROR: ${err.message}` }).eq('id', jobId)
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
