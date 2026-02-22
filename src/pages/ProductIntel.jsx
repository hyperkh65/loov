import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { runDailyCollection } from '../lib/scraper'

const C = '#00e5ff'

export default function ProductIntel() {
    const [report, setReport] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [collecting, setCollecting] = useState(false)
    const [progress, setProgress] = useState('')
    const [filter, setFilter] = useState('all')
    const [sort, setSort] = useState('price_asc')

    // ── 리포트 + 제품 로드 ──
    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)

        // 최신 리포트 로드
        const { data: reports } = await supabase
            .from('led_reports')
            .select('*')
            .order('generated_at', { ascending: false })
            .limit(1)

        if (reports?.length) setReport(reports[0])

        // 제품 목록 로드
        const { data: prods } = await supabase
            .from('led_products')
            .select('*')
            .order('price', { ascending: true })
            .limit(500)

        if (prods) setProducts(prods)

        setLoading(false)
    }

    // ── 수동 수집 트리거 ──
    async function handleCollect() {
        setCollecting(true)
        setProgress('◈ Initializing collection engine...')

        try {
            // CORS 프록시 사용 (프로덕션에서는 Edge Function 사용)
            const fetchFn = async (url) => {
                setProgress(`◈ Fetching page... ${url.match(/page=(\d+)/)?.[1] || 1}`)
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
                const res = await fetch(proxyUrl)
                return await res.text()
            }

            const result = await runDailyCollection(fetchFn)

            if (result.success) {
                setProgress(`◈ Collection complete! ${result.totalCollected} products collected.`)
                setReport(result.report)
                await loadData()
            } else {
                setProgress(`◈ Error: ${result.error}`)
            }
        } catch (err) {
            setProgress(`◈ Failed: ${err.message}`)
        }

        setTimeout(() => setCollecting(false), 3000)
    }

    // ── 필터/정렬 ──
    const filteredProducts = products
        .filter(p => filter === 'all' || p.category === filter)
        .sort((a, b) => {
            if (sort === 'price_asc') return a.price - b.price
            if (sort === 'price_desc') return b.price - a.price
            return a.name.localeCompare(b.name)
        })

    const categories = [...new Set(products.map(p => p.category))].filter(Boolean)

    return (
        <div style={{ minHeight: '100vh', background: '#00020e', paddingTop: 90 }}>
            <div className="container" style={{ maxWidth: 1200 }}>

                {/* ── 헤더 ── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 36 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{
                                fontFamily: 'Outfit', fontWeight: 900, fontSize: 32,
                                color: '#fff', letterSpacing: '-0.02em', marginBottom: 6,
                            }}>
                                <span style={{ color: C }}>◈</span> Product Intelligence
                            </h1>
                            <p style={{ fontFamily: 'monospace', fontSize: 11, color: `${C}60` }}>
                                LED Market · Daily Automated Collection & AI Analysis
                            </p>
                        </div>
                        <button
                            onClick={handleCollect}
                            disabled={collecting}
                            style={{
                                padding: '10px 22px', borderRadius: 4,
                                background: collecting ? `${C}22` : `linear-gradient(135deg, ${C}, #0090cc)`,
                                color: collecting ? `${C}88` : '#00020e',
                                border: 'none', cursor: collecting ? 'wait' : 'pointer',
                                fontFamily: 'monospace', fontWeight: 700, fontSize: 11,
                                letterSpacing: '0.1em',
                                clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                            }}
                        >
                            {collecting ? '▷ COLLECTING...' : '▷ RUN COLLECTION'}
                        </button>
                    </div>

                    {/* 수집 진행 상태 */}
                    <AnimatePresence>
                        {progress && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                    marginTop: 12, padding: '8px 14px',
                                    background: `${C}08`, border: `1px solid ${C}18`,
                                    borderRadius: 4, fontFamily: 'monospace', fontSize: 10, color: `${C}90`,
                                }}
                            >
                                {progress}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ──  KPI 카드 ── */}
                {report && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: 12, marginBottom: 32,
                        }}
                    >
                        {[
                            { label: 'TOTAL PRODUCTS', value: report.total_products?.toLocaleString(), icon: '◈' },
                            { label: 'MANUFACTURERS', value: report.total_makers?.toLocaleString(), icon: '◈' },
                            { label: 'CATEGORIES', value: report.total_categories, icon: '◈' },
                            { label: 'AVG PRICE', value: `₩${report.overall_avg_price?.toLocaleString()}`, icon: '▸' },
                            { label: 'PRICE RANGE', value: `₩${report.overall_min_price?.toLocaleString()} ~ ₩${report.overall_max_price?.toLocaleString()}`, icon: '▸', small: true },
                        ].map(({ label, value, icon, small }, i) => (
                            <div key={i} style={{
                                padding: '18px 16px',
                                background: `${C}04`, border: `1px solid ${C}12`,
                                borderRadius: 4,
                                clipPath: 'polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)',
                            }}>
                                <div style={{ fontFamily: 'monospace', fontSize: 8, color: `${C}60`, marginBottom: 8, letterSpacing: '0.12em' }}>
                                    {icon} {label}
                                </div>
                                <div style={{
                                    fontFamily: 'Outfit', fontWeight: 800,
                                    fontSize: small ? 14 : 22, color: '#fff',
                                }}>
                                    {value || '—'}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── 카테고리별 분석 ── */}
                {report?.category_stats?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            marginBottom: 32, padding: '24px',
                            background: `${C}03`, border: `1px solid ${C}10`,
                            borderRadius: 6,
                        }}
                    >
                        <h3 style={{
                            fontFamily: 'monospace', fontSize: 11, color: `${C}90`,
                            letterSpacing: '0.15em', marginBottom: 16,
                        }}>
                            ◈ CATEGORY BREAKDOWN
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                            {report.category_stats.map((cat, i) => (
                                <div key={i} style={{
                                    padding: '14px', background: `${C}06`,
                                    border: `1px solid ${C}0e`, borderRadius: 4,
                                }}>
                                    <div style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 6 }}>
                                        {cat.category}
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: 9, color: `${C}70`, lineHeight: 1.8 }}>
                                        Count: {cat.count} · Avg: ₩{cat.avg?.toLocaleString()}<br />
                                        Min: ₩{cat.min?.toLocaleString()} · Max: ₩{cat.max?.toLocaleString()}
                                    </div>
                                    {/* 가격 범위 바 */}
                                    <div style={{ marginTop: 8, height: 3, background: `${C}15`, borderRadius: 2 }}>
                                        <div style={{
                                            width: `${Math.min(100, (cat.avg / (report.overall_max_price || 1)) * 100)}%`,
                                            height: '100%', background: C, borderRadius: 2,
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── TOP 제조사 ── */}
                {report?.top_makers?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            marginBottom: 32, padding: '24px',
                            background: `${C}03`, border: `1px solid ${C}10`,
                            borderRadius: 6,
                        }}
                    >
                        <h3 style={{
                            fontFamily: 'monospace', fontSize: 11, color: `${C}90`,
                            letterSpacing: '0.15em', marginBottom: 16,
                        }}>
                            ◈ TOP MANUFACTURERS
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {report.top_makers.map((m, i) => {
                                const maxCount = report.top_makers[0]?.count || 1
                                return (
                                    <div key={i} style={{
                                        padding: '8px 14px', borderRadius: 4,
                                        background: `rgba(0,229,255,${0.03 + (m.count / maxCount) * 0.08})`,
                                        border: `1px solid ${C}${Math.round((m.count / maxCount) * 30 + 5).toString(16).padStart(2, '0')}`,
                                        fontFamily: 'monospace', fontSize: 10,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}>
                                        <span style={{ color: '#fff' }}>{m.name}</span>
                                        <span style={{ color: C, fontSize: 9 }}>{m.count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── 필터/정렬 컨트롤 ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                    fontFamily: 'monospace', fontSize: 10,
                }}>
                    <span style={{ color: `${C}60` }}>◈ FILTER:</span>
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <span style={{ color: `${C}60`, marginLeft: 12 }}>◈ SORT:</span>
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="price_asc">Price ↑</option>
                        <option value="price_desc">Price ↓</option>
                        <option value="name">Name A-Z</option>
                    </select>

                    <span style={{ color: `${C}40`, marginLeft: 'auto' }}>
                        {filteredProducts.length} results
                    </span>
                </div>

                {/* ── 제품 리스트 테이블 ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                        background: `${C}03`, border: `1px solid ${C}10`,
                        borderRadius: 6, overflow: 'hidden', marginBottom: 80,
                    }}
                >
                    {/* 테이블 헤더 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 1fr 140px 130px 100px',
                        padding: '10px 16px',
                        background: `${C}08`,
                        borderBottom: `1px solid ${C}12`,
                        fontFamily: 'monospace', fontSize: 9, color: `${C}70`,
                        letterSpacing: '0.1em',
                    }}>
                        <span>#</span>
                        <span>PRODUCT NAME</span>
                        <span>MANUFACTURER</span>
                        <span>CATEGORY</span>
                        <span style={{ textAlign: 'right' }}>PRICE</span>
                    </div>

                    {/* 로딩 */}
                    {loading && (
                        <div style={{ padding: '40px', textAlign: 'center', color: `${C}50`, fontFamily: 'monospace', fontSize: 11 }}>
                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                ◈ LOADING DATA...
                            </motion.span>
                        </div>
                    )}

                    {/* 데이터 없음 */}
                    {!loading && filteredProducts.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <p style={{ fontFamily: 'Outfit', fontSize: 16, color: '#fff', marginBottom: 10 }}>
                                No products collected yet
                            </p>
                            <p style={{ fontFamily: 'monospace', fontSize: 11, color: `${C}50`, marginBottom: 20 }}>
                                Click "RUN COLLECTION" to start the daily LED market scan
                            </p>
                        </div>
                    )}

                    {/* 제품 행 */}
                    {filteredProducts.slice(0, 100).map((p, i) => (
                        <motion.div
                            key={p.external_id || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(i * 0.02, 0.5) }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '60px 1fr 140px 130px 100px',
                                padding: '10px 16px',
                                borderBottom: `1px solid ${C}06`,
                                alignItems: 'center',
                                fontSize: 12,
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = `${C}06`}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{ fontFamily: 'monospace', fontSize: 9, color: `${C}40` }}>{i + 1}</span>
                            <span style={{ fontFamily: 'Outfit', fontWeight: 500, color: '#e8e8e8', fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {p.name}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: `${C}70` }}>{p.maker}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: `${C}50` }}>{p.category}</span>
                            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: '#fff', textAlign: 'right' }}>
                                ₩{p.price?.toLocaleString()}
                            </span>
                        </motion.div>
                    ))}

                    {filteredProducts.length > 100 && (
                        <div style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 9, color: `${C}40` }}>
                            ◈ Showing 100 of {filteredProducts.length} results
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

const selectStyle = {
    background: `rgba(0,229,255,0.06)`,
    border: `1px solid rgba(0,229,255,0.15)`,
    borderRadius: 3,
    color: '#fff',
    padding: '4px 10px',
    fontSize: 10,
    fontFamily: 'monospace',
    outline: 'none',
}
