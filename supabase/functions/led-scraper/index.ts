import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Client as NotionClient } from 'https://esm.sh/@notionhq/client'

const DANAWA_BASE = 'https://search.danawa.com/dsearch.php'

// ─── CORS Headers ───────────────────────────────────────────────────
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── HTML 파싱 (정규식 기반) ──────────────────────────────────────────
function parseProductsFromHTML(html) {
    const products = []
    const itemRegex = /<li\s+class="prod_item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
    let match

    while ((match = itemRegex.exec(html)) !== null) {
        const item = match[1]
        const nameMatch = item.match(/<p\s+class="prod_name"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)
        const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : null

        const priceMatch = item.match(/<p\s+class="price_sect"[^>]*>[\s\S]*?<em[^>]*>([\s\S]*?)<\/em>/i)
        const priceStr = priceMatch ? priceMatch[1].replace(/<[^>]+>/g, '').replace(/[,원\s]/g, '').trim() : null
        const price = priceStr ? parseInt(priceStr) : null

        const makerMatch = item.match(/제조사:\s*([^<\n]+)/i) || item.match(/<span\s+class="text__maker"[^>]*>([\s\S]*?)<\/span>/i)
        const maker = makerMatch ? makerMatch[1].replace(/<[^>]+>/g, '').trim() : 'Unknown'

        const catMatch = item.match(/<span\s+class="text__category"[^>]*>([\s\S]*?)<\/span>/i)
        const category = catMatch ? catMatch[1].replace(/<[^>]+>/g, '').trim() : 'LED'

        const imgMatch = item.match(/<img[^>]+src="([^"]+)"/i)
        const image = imgMatch ? imgMatch[1] : null

        const idMatch = item.match(/data-product-code="(\d+)"/i) || item.match(/pcode=(\d+)/i)
        const productId = idMatch ? idMatch[1] : null

        if (name && price) {
            products.push({
                external_id: productId,
                name,
                price,
                maker,
                category,
                image_url: image,
                source: 'market_search',
                collected_at: new Date().toISOString(),
            })
        }
    }
    return products
}

function parseTotalCount(html) {
    const m = html.match(/총\s*<strong>([\d,]+)<\/strong>\s*개/i)
        || html.match(/검색결과\s*([\d,]+)/i)
    return m ? parseInt(m[1].replace(/,/g, '')) : 0
}

serve(async (req) => {
    // CORS 대응
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const notion = new NotionClient({ auth: Deno.env.get('NOTION_TOKEN') })
    const marketDbId = Deno.env.get('NOTION_MARKET_DB_ID')

    const jobId = '00000000-0000-0000-0000-000000000001'

    try {
        console.log('Starting LED collection task...')

        // 1. 상태 업데이트: RUNNING
        await supabase.from('led_collection_jobs').update({
            status: 'RUNNING',
            progress: '◈ SCANNING DANAWA MARKET...',
            started_at: new Date().toISOString()
        }).eq('id', jobId)

        const allProducts = []
        let totalCount = 0
        const perPage = 30

        // 첫 페이지 로드 및 총 개수 파악
        const firstUrl = `${DANAWA_BASE}?query=LED&tab=goods&page=1`
        const firstResp = await fetch(firstUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.danawa.com/'
            }
        })
        const firstHtml = await firstResp.text()
        totalCount = parseTotalCount(firstHtml)
        allProducts.push(...parseProductsFromHTML(firstHtml))

        const totalPages = Math.min(Math.ceil(totalCount / perPage), 50)
        console.log(`Total Pages: ${totalPages}, Total Items: ${totalCount}`)

        // 2. 페이지별 크롤링
        for (let page = 2; page <= totalPages; page++) {
            await supabase.from('led_collection_jobs').update({
                progress: `◈ COLLECTING DATA: PAGE ${page}/${totalPages} (${allProducts.length} ITEMS FOUND)`
            }).eq('id', jobId)

            const url = `${DANAWA_BASE}?query=LED&tab=goods&page=${page}`
            const resp = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://www.danawa.com/'
                }
            })
            const html = await resp.text()
            allProducts.push(...parseProductsFromHTML(html))

            // 딜레이
            await new Promise(r => setTimeout(r, 1000))
        }

        // 3. Supabase 저장
        await supabase.from('led_collection_jobs').update({
            progress: `◈ SYNCING TO SUPABASE... (${allProducts.length} ITEMS)`
        }).eq('id', jobId)

        await supabase.from('led_products').upsert(allProducts, { onConflict: 'external_id' })

        const priceEntries = allProducts.map(p => ({
            product_id: p.external_id,
            price: p.price,
            recorded_at: new Date().toISOString()
        }))
        await supabase.from('led_price_history').insert(priceEntries)

        // 4. 리포트 생성 및 분석
        const categoryStats = {}
        allProducts.forEach(p => {
            if (!categoryStats[p.category]) categoryStats[p.category] = { sum: 0, count: 0, min: Infinity, max: 0 }
            categoryStats[p.category].sum += p.price
            categoryStats[p.category].count += 1
            categoryStats[p.category].min = Math.min(categoryStats[p.category].min, p.price)
            categoryStats[p.category].max = Math.max(categoryStats[p.category].max, p.price)
        })

        const catSummary = Object.entries(categoryStats).map(([cat, s]) => ({
            category: cat,
            count: s.count,
            avg: Math.round(s.sum / s.count),
            min: s.min,
            max: s.max
        }))

        // 'Waste' 아이템 탐지 (평균가보다 50% 이상 비싼 제품들)
        const wasteItems = allProducts.filter(p => {
            const stats = categoryStats[p.category]
            const avg = stats.sum / stats.count
            return p.price > avg * 1.5
        }).map(p => ({
            name: p.name,
            price: p.price,
            avg_price: Math.round(categoryStats[p.category].sum / categoryStats[p.category].count),
            diff_percent: Math.round((p.price / (categoryStats[p.category].sum / categoryStats[p.category].count) - 1) * 100)
        })).slice(0, 5)

        const overallAvg = Math.round(allProducts.reduce((s, p) => s + p.price, 0) / allProducts.length)

        const report = {
            date: new Date().toISOString().split('T')[0],
            total_products: allProducts.length,
            total_makers: [...new Set(allProducts.map(p => p.maker))].length,
            total_categories: Object.keys(categoryStats).length,
            overall_avg_price: overallAvg,
            overall_min_price: Math.min(...allProducts.map(p => p.price)),
            overall_max_price: Math.max(...allProducts.map(p => p.price)),
            category_stats: catSummary,
            ai_commentary: `오늘의 LED 시장 분석 결과입니다. 현재 전체 평균가는 ₩${overallAvg.toLocaleString()}이며, ${wasteItems.length}개의 고평가(Waste) 품목이 발견되었습니다. 특히 ${catSummary[0]?.category} 카테고리의 가격 변동성이 높으니 주의 깊게 살펴보세요!`,
            waste_items: wasteItems,
            top_makers: Object.entries(allProducts.reduce((acc, p) => { acc[p.maker] = (acc[p.maker] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
            generated_at: new Date().toISOString()
        }
        await supabase.from('led_reports').upsert(report, { onConflict: 'date' })

        // 5. Notion 동기화 (리포트 요약)
        if (marketDbId) {
            await supabase.from('led_collection_jobs').update({
                progress: `◈ EXPORTING TO NOTION...`
            }).eq('id', jobId)

            await notion.pages.create({
                parent: { database_id: marketDbId },
                properties: {
                    Title: { title: [{ text: { content: `LED Market Report - ${report.date}` } }] },
                    Category: { select: { name: 'LED Analysis' } },
                    Value: { number: report.overall_avg_price },
                    Description: { rich_text: [{ text: { content: `Total: ${report.total_products} products collected. Avg Price: ${report.overall_avg_price} KRW.` } }] },
                    Date: { date: { start: new Date().toISOString() } }
                }
            })
        }

        // 6. 상태 업데이트: COMPLETED
        await supabase.from('led_collection_jobs').update({
            status: 'COMPLETED',
            progress: `◈ TASK COMPLETE: ${allProducts.length} ITEMS PROCESSED`,
            finished_at: new Date().toISOString(),
            result_summary: { totalCollected: allProducts.length, avgPrice: overallAvg }
        }).eq('id', jobId)

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err) {
        console.error('Edge Function Error:', err)
        await supabase.from('led_collection_jobs').update({
            status: 'FAILED',
            progress: `◈ ERROR: ${err.message}`
        }).eq('id', jobId)

        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
