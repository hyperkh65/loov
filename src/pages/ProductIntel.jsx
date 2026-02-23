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

    // ── 리포트 + 제품 + 작업 상태 로드 ──
    useEffect(() => {
        loadData()

        // 실시간 작업 상태 구독
        const channel = supabase
            .channel('job-status')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'led_collection_jobs'
            }, (payload) => {
                const job = payload.new
                if (job.status === 'RUNNING') {
                    setCollecting(true)
                    setProgress(job.progress || '◈ BACKGROUND SYNC IN PROGRESS...')
                } else if (job.status === 'COMPLETED') {
                    setCollecting(false)
                    setProgress(`◈ TASK COMPLETE: ${job.result_summary?.totalCollected || 0} ITEMS SYNCED TO NOTION & SUPABASE`)
                    loadData()
                } else if (job.status === 'FAILED') {
                    setCollecting(false)
                    setProgress(`◈ SYSTEM ERROR: ${job.progress}`)
                }
            })
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    async function loadData() {
        setLoading(true)
        // 최신 리포트
        const { data: reports } = await supabase.from('led_reports').select('*').order('generated_at', { ascending: false }).limit(1)
        if (reports?.length) setReport(reports[0])

        // 제품 목록
        const { data: prods } = await supabase.from('led_products').select('*').order('price', { ascending: true }).limit(500)
        if (prods) setProducts(prods)

        // 초기 작업 상태 확인
        const { data: jobs } = await supabase.from('led_collection_jobs').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single()
        if (jobs?.status === 'RUNNING') {
            setCollecting(true)
            setProgress(jobs.progress || '◈ PREVIOUS TASK RESUMING...')
        }

        setLoading(false)
    }

    // ── 수집 신호 전송 (백엔드로 토스) ──
    async function handleCollect() {
        if (collecting) return

        setCollecting(true)
        setProgress('◈ TRIGGERING REMOTE COLLECTION ENGINE...')

        // 작업 상태를 RUNNING으로 변경
        await supabase.from('led_collection_jobs').update({
            status: 'RUNNING',
            progress: '◈ INITIALIZING BACKEND WORKER...',
            started_at: new Date().toISOString()
        }).eq('id', '00000000-0000-0000-0000-000000000001')

        // Edge Function 호출
        try {
            const { data, error } = await supabase.functions.invoke('led-scraper')
            if (error) throw error
        } catch (err) {
            console.error('Trigger error:', err)
            // 에러가 나더라도 Realtime 구독을 통해 상태가 업데이트될 수 있으므로 별도 처리는 생략 가능
        }
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
                    style={{ marginBottom: 40 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div>
                            <h1 style={{
                                fontFamily: 'Outfit', fontWeight: 900, fontSize: 36,
                                color: '#fff', letterSpacing: '-0.02em', marginBottom: 4,
                            }}>
                                <span style={{ color: C }}>◈</span> PRODUCT <span style={{ color: C }}>INTEL</span>
                            </h1>
                            <p style={{ fontFamily: 'monospace', fontSize: 11, color: `${C}60`, letterSpacing: '0.05em' }}>
                                LED MARKET SEARCH ENGINE // AI POWERED ANALYSIS
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${C}30` }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCollect}
                            disabled={collecting}
                            style={{
                                padding: '12px 24px', borderRadius: 4,
                                background: collecting ? 'transparent' : C,
                                color: collecting ? C : '#000',
                                border: `1px solid ${C}`, cursor: collecting ? 'wait' : 'pointer',
                                fontFamily: 'monospace', fontWeight: 800, fontSize: 12,
                                letterSpacing: '0.1em',
                                transition: 'all 0.3s'
                            }}
                        >
                            {collecting ? '◈ SYNCING...' : '◈ RUN COLLECTION'}
                        </motion.button>
                    </div>

                    <AnimatePresence mode="wait">
                        {progress && (
                            <motion.div
                                key="progress"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                    padding: '12px 16px',
                                    background: `${C}08`, border: `1px solid ${C}18`,
                                    borderRadius: 4, fontFamily: 'monospace', fontSize: 10, color: `${C}90`,
                                    marginBottom: 20
                                }}
                            >
                                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                                    {progress}
                                </motion.span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* AI Insight Box */}
                    {report?.ai_commentary && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                padding: '24px',
                                background: `linear-gradient(135deg, ${C}15 0%, rgba(0,0,0,0) 100%)`,
                                borderLeft: `4px solid ${C}`,
                                borderRight: `1px solid ${C}10`,
                                borderTop: `1px solid ${C}10`,
                                borderBottom: `1px solid ${C}10`,
                                borderRadius: '0 8px 8px 0',
                                marginBottom: 32,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 90, color: `${C}05`, fontFamily: 'serif', zIndex: 0 }}>
                                "
                            </div>
                            <h4 style={{ fontFamily: 'monospace', fontSize: 10, color: C, marginBottom: 12, letterSpacing: '0.3em', fontWeight: 800 }}>
                                ◈ AI SMART COACH INSIGHT
                            </h4>
                            <p style={{ fontFamily: 'Outfit', fontSize: 16, color: '#e0e0e0', lineHeight: 1.6, margin: 0, position: 'relative', zIndex: 1, fontStyle: 'italic', fontWeight: 400 }}>
                                {report.ai_commentary}
                            </p>
                        </motion.div>
                    )}
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

                {/* ── WASTE MONITOR (고평가 품목) ── */}
                {report?.waste_items?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{
                            marginBottom: 32, padding: '24px',
                            background: `rgba(255, 50, 50, 0.04)`,
                            border: `1px solid rgba(255, 50, 50, 0.15)`,
                            borderRadius: 6,
                        }}
                    >
                        <h3 style={{
                            fontFamily: 'monospace', fontSize: 11, color: '#ff6b6b',
                            letterSpacing: '0.15em', marginBottom: 16,
                            display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <span style={{ fontSize: 14 }}>⚠️</span> WASTE MONITOR: OVERPRICED ITEMS
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {report.waste_items.map((item, i) => (
                                <div key={i} style={{
                                    padding: '14px', background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 4,
                                    position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: 10, right: 10, fontFamily: 'monospace', fontSize: 10, color: '#ff6b6b', fontWeight: 800 }}>
                                        +{item.diff_percent}%
                                    </div>
                                    <div style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 12, color: '#fff', marginBottom: 8, paddingRight: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.name}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 700, color: '#ff6b6b' }}>
                                            ₩{item.price?.toLocaleString()}
                                        </div>
                                        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                                            Avg: ₩{item.avg_price?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
