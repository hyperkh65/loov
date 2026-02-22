import { supabase } from '../lib/supabase'

const DANAWA_BASE = 'https://search.danawa.com/dsearch.php'

/**
 * 다나와에서 LED 제품 전체 페이지를 수집하는 스크래퍼
 * 프론트에서 직접 호출 시 CORS 문제가 있으므로,
 * Supabase Edge Function 또는 서버리스 함수에서 실행 권장.
 * 여기서는 로직만 정의하고, fetchPage는 프록시를 통해 호출.
 */

// ─── HTML 파싱 (정규식 기반, DOMParser 대체) ─────────────────────────
function parseProductsFromHTML(html) {
    const products = []
    // 상품 리스트 아이템 추출
    const itemRegex = /<li\s+class="prod_item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
    let match

    while ((match = itemRegex.exec(html)) !== null) {
        const item = match[1]

        // 상품명
        const nameMatch = item.match(/<p\s+class="prod_name"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)
        const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : null

        // 가격
        const priceMatch = item.match(/<p\s+class="price_sect"[^>]*>[\s\S]*?<em[^>]*>([\s\S]*?)<\/em>/i)
        const priceStr = priceMatch ? priceMatch[1].replace(/<[^>]+>/g, '').replace(/[,원\s]/g, '').trim() : null
        const price = priceStr ? parseInt(priceStr) : null

        // 제조사
        const makerMatch = item.match(/제조사:\s*([^<\n]+)/i) || item.match(/<span\s+class="text__maker"[^>]*>([\s\S]*?)<\/span>/i)
        const maker = makerMatch ? makerMatch[1].replace(/<[^>]+>/g, '').trim() : 'Unknown'

        // 카테고리
        const catMatch = item.match(/<span\s+class="text__category"[^>]*>([\s\S]*?)<\/span>/i)
        const category = catMatch ? catMatch[1].replace(/<[^>]+>/g, '').trim() : 'LED'

        // 이미지
        const imgMatch = item.match(/<img[^>]+src="([^"]+)"/i)
        const image = imgMatch ? imgMatch[1] : null

        // 상품 ID
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

// ─── 총 결과 수 + 페이지 수 추출 ─────────────────────────────────────
function parseTotalCount(html) {
    const m = html.match(/총\s*<strong>([\d,]+)<\/strong>\s*개/i)
        || html.match(/검색결과\s*([\d,]+)/i)
    return m ? parseInt(m[1].replace(/,/g, '')) : 0
}

// ─── Supabase에 저장 ─────────────────────────────────────────────────
export async function saveProducts(products) {
    if (!products.length) return { count: 0 }

    // upsert (external_id 기준)
    const { data, error } = await supabase
        .from('led_products')
        .upsert(products, { onConflict: 'external_id' })

    if (error) console.error('Save error:', error)
    return { count: products.length, error }
}

// ─── 가격 이력 저장 ──────────────────────────────────────────────────
export async function savePriceHistory(products) {
    const entries = products
        .filter(p => p.external_id && p.price)
        .map(p => ({
            product_id: p.external_id,
            price: p.price,
            recorded_at: new Date().toISOString(),
        }))

    if (!entries.length) return

    const { error } = await supabase
        .from('led_price_history')
        .insert(entries)

    if (error) console.error('Price history error:', error)
}

// ─── Gemini AI 리포트 생성 ────────────────────────────────────────────
export async function generateReport(products) {
    // products 를 분석용 summary 로 변환
    const makers = [...new Set(products.map(p => p.maker))]
    const categories = [...new Set(products.map(p => p.category))]
    const totalProducts = products.length

    // 카테고리별 평균가 계산
    const categoryStats = {}
    products.forEach(p => {
        if (!categoryStats[p.category]) {
            categoryStats[p.category] = { sum: 0, count: 0, min: Infinity, max: 0 }
        }
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
        max: s.max,
    }))

    // 제조사별 제품 수
    const makerCounts = {}
    products.forEach(p => { makerCounts[p.maker] = (makerCounts[p.maker] || 0) + 1 })
    const topMakers = Object.entries(makerCounts).sort((a, b) => b[1] - a[1]).slice(0, 20)

    // 전체 평균
    const overallAvg = Math.round(products.reduce((s, p) => s + p.price, 0) / totalProducts)
    const overallMin = Math.min(...products.map(p => p.price))
    const overallMax = Math.max(...products.map(p => p.price))

    const report = {
        date: new Date().toISOString().split('T')[0],
        total_products: totalProducts,
        total_makers: makers.length,
        total_categories: categories.length,
        overall_avg_price: overallAvg,
        overall_min_price: overallMin,
        overall_max_price: overallMax,
        category_stats: catSummary,
        top_makers: topMakers.map(([name, count]) => ({ name, count })),
        generated_at: new Date().toISOString(),
    }

    // Supabase 저장
    const { error } = await supabase
        .from('led_reports')
        .upsert(report, { onConflict: 'date' })

    if (error) console.error('Report save error:', error)

    return report
}

// ─── 메인 수집 함수 (프록시 or Edge Function에서 호출) ─────────────────
export async function runDailyCollection(fetchFn) {
    const allProducts = []
    let page = 1
    const perPage = 30
    let totalCount = 0

    try {
        // 첫 페이지로 총 수 파악
        const firstPageUrl = `${DANAWA_BASE}?query=LED&tab=goods&page=1`
        const firstHtml = await fetchFn(firstPageUrl)
        totalCount = parseTotalCount(firstHtml)
        const firstProducts = parseProductsFromHTML(firstHtml)
        allProducts.push(...firstProducts)

        const totalPages = Math.min(Math.ceil(totalCount / perPage), 50) // 최대 50페이지

        // 나머지 페이지
        for (page = 2; page <= totalPages; page++) {
            const url = `${DANAWA_BASE}?query=LED&tab=goods&page=${page}`
            const html = await fetchFn(url)
            const products = parseProductsFromHTML(html)
            allProducts.push(...products)
            // 레이트 리밋 방지
            await new Promise(r => setTimeout(r, 500))
        }

        // Supabase 저장
        await saveProducts(allProducts)
        await savePriceHistory(allProducts)

        // 리포트 생성
        const report = await generateReport(allProducts)

        return { success: true, totalCollected: allProducts.length, report }
    } catch (err) {
        console.error('Collection error:', err)
        return { success: false, error: err.message, partialCount: allProducts.length }
    }
}
