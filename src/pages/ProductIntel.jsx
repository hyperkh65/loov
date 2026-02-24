import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const C = '#00e5ff'
const C2 = '#ff00d4' // Accent color
const BG = '#05050a'
const CARD_BG = 'rgba(20, 20, 30, 0.4)'
const BORDER = 'rgba(255, 255, 255, 0.08)'
const GLOW = '0 0 20px rgba(0, 229, 255, 0.15)'

export default function ProductIntel() {
    const [report, setReport] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [collecting, setCollecting] = useState(false)
    const [progress, setProgress] = useState('')
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

    // Filters
    const [activeCategory, setActiveCategory] = useState('all')
    const [activeMaker, setActiveMaker] = useState('all')
    const [priceRange, setPriceRange] = useState([0, 200000])
    const [searchQuery, setSearchQuery] = useState('')
    const [sort, setSort] = useState('latest')
    const [certFilter, setCertFilter] = useState('all') // 'kc', 'ks', 'all'

    useEffect(() => {
        loadData()
        const channel = supabase
            .channel('job-status')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'led_collection_jobs' }, (payload) => {
                const job = payload.new
                if (job.status === 'RUNNING') {
                    setCollecting(true)
                    setProgress(job.progress || '◈ BACKGROUND SYNC IN PROGRESS...')
                } else if (job.status === 'COMPLETED') {
                    setCollecting(false)
                    setProgress(`◈ TASK COMPLETE: ${job.result_summary?.totalCollected || 0} ITEMS SYNCED`)
                    loadData()
                }
            })
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [])

    async function loadData() {
        setLoading(true)
        const { data: reports } = await supabase.from('led_reports').select('*').order('generated_at', { ascending: false }).limit(1)
        if (reports?.length) setReport(reports[0])

        const { data: prods } = await supabase.from('led_products').select('*').order('collected_at', { ascending: false }).limit(2000)
        if (prods) setProducts(prods)
        setLoading(false)
    }

    const filteredProducts = products.filter(p => {
        const matchesCat = activeCategory === 'all' || p.category === activeCategory
        const matchesMaker = activeMaker === 'all' || p.maker === activeMaker
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1]
        const q = searchQuery.toLowerCase()
        const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.maker.toLowerCase().includes(q)

        const certText = (p.name + (p.specs ? JSON.stringify(p.specs) : '')).toLowerCase()
        const hasKC = certText.includes('kc')
        const hasKS = certText.includes('ks')
        const matchesCert = certFilter === 'all' || (certFilter === 'kc' && hasKC) || (certFilter === 'ks' && hasKS)

        return matchesCat && matchesMaker && matchesPrice && matchesSearch && matchesCert
    }).sort((a, b) => {
        if (sort === 'price_asc') return a.price - b.price
        if (sort === 'price_desc') return b.price - a.price
        return new Date(b.collected_at) - new Date(a.collected_at)
    })

    const makers = [...new Set(products.map(p => p.maker))].sort()
    const categories = [...new Set(products.map(p => p.category))].sort()

    const calculateMarketDepth = (items) => {
        if (!items || items.length === 0) return null;

        const total = items.length;

        // Certification
        let kcCount = 0;
        let ksCount = 0;
        let bothCount = 0;
        items.forEach(p => {
            const text = (p.name + (p.specs ? JSON.stringify(p.specs) : '')).toLowerCase();
            const hasKC = text.includes('kc');
            const hasKS = text.includes('ks');
            if (hasKC && hasKS) bothCount++;
            else if (hasKC) kcCount++;
            else if (hasKS) ksCount++;
        });

        const certification_stats = {
            kc_total_ratio: parseFloat((((kcCount + bothCount) / total) * 100).toFixed(1)),
            ks_total_ratio: parseFloat((((ksCount + bothCount) / total) * 100).toFixed(1))
        };

        // Price tiers
        const tiers = {
            'Entry (<₩5k)': 0,
            'Mid (₩5k-20k)': 0,
            'High (₩20k-50k)': 0,
            'Premium (>₩50k)': 0
        };
        items.forEach(p => {
            if (p.price < 5000) tiers['Entry (<₩5k)']++;
            else if (p.price < 20000) tiers['Mid (₩5k-20k)']++;
            else if (p.price < 50000) tiers['High (₩20k-50k)']++;
            else tiers['Premium (>₩50k)']++;
        });
        const price_distribution = Object.entries(tiers).map(([tier, count]) => ({
            tier,
            ratio: parseFloat(((count / total) * 100).toFixed(1))
        }));

        return { certification_stats, price_distribution };
    };

    const marketDepth = report?.market_depth || calculateMarketDepth(products);

    const selectStyle = {
        background: BG,
        border: `1px solid ${BORDER}`,
        color: '#fff',
        padding: '6px 12px',
        borderRadius: 4,
        fontSize: 11,
        outline: 'none'
    }

    return (
        <div style={{ minHeight: '100vh', background: BG, color: '#fff', paddingTop: 80, paddingBottom: 100, position: 'relative', overflow: 'hidden' }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: `radial-gradient(circle, ${C}08 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: `radial-gradient(circle, ${C2}05 0%, transparent 70%)`, pointerEvents: 'none' }} />

            <div className="container" style={{ maxWidth: 1400, position: 'relative', zIndex: 1 }}>

                {/* --- HEADER --- */}
                <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
                            MARKET <span style={{ color: C }}>INTELLIGENCE</span>
                        </h1>
                        <p style={{ fontFamily: 'monospace', color: `${C}70`, fontSize: 12, marginTop: 4 }}>
                            PROPRIETARY DATA HARVESTING // REAL-TIME ANALYSIS ENGINE
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: '#4efaa6', boxShadow: '0 0 8px #4efaa6' }}
                            />
                            <span style={{ fontSize: 10, color: '#4efaa6', fontWeight: 900, fontFamily: 'monospace' }}>LIVE CONNECTION ACTIVE</span>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: `${C}50`, fontFamily: 'monospace', marginBottom: 2 }}>LAST INTELLIGENCE HARVEST</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{report ? new Date(report.generated_at).toLocaleString() : 'PENDING SYNC'}</div>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32 }}>

                    {/* --- SIDEBAR FILTERS --- */}
                    <aside style={{ position: 'sticky', top: 100, height: 'fit-content' }}>
                        <section style={sideSectionStyle}>
                            <h3 style={sideTitleStyle}>◈ SEARCH ENGINE</h3>
                            <input
                                type="text"
                                placeholder="Model or Vendor..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={inputStyle}
                            />
                        </section>

                        <section style={sideSectionStyle}>
                            <h3 style={sideTitleStyle}>◈ CATEGORY</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <button onClick={() => setActiveCategory('all')} style={filterBtnStyle(activeCategory === 'all')}>ALL CATEGORIES</button>
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setActiveCategory(cat)} style={filterBtnStyle(activeCategory === cat)}>{cat}</button>
                                ))}
                            </div>
                        </section>

                        <section style={sideSectionStyle}>
                            <h3 style={sideTitleStyle}>◈ QUALITY ASSURANCE</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setCertFilter('all')} style={filterBtnStyle(certFilter === 'all')}>ALL</button>
                                <button onClick={() => setCertFilter('kc')} style={filterBtnStyle(certFilter === 'kc')}>KC ONLY</button>
                                <button onClick={() => setCertFilter('ks')} style={filterBtnStyle(certFilter === 'ks')}>KS ONLY</button>
                            </div>
                        </section>

                        <section style={sideSectionStyle}>
                            <h3 style={sideTitleStyle}>◈ PRICE SEGMENTATION</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <input type="range" min="0" max="200000" step="5000" value={priceRange[1]} onChange={e => setPriceRange([0, parseInt(e.target.value)])} style={{ accentColor: C }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10, color: `${C}80` }}>
                                    <span>₩0</span>
                                    <span>₩{priceRange[1].toLocaleString()}</span>
                                </div>
                            </div>
                        </section>

                        {report?.waste_items?.length > 0 && (
                            <section style={{
                                marginBottom: 32,
                                borderLeft: `2px solid ${C2}`,
                                background: `linear-gradient(90deg, ${C2}08, transparent)`,
                                padding: '16px 20px',
                                borderRadius: '0 8px 8px 0'
                            }}>
                                <h3 style={{ ...sideTitleStyle, color: C2, marginBottom: 12 }}>◈ WASTE DETECTION</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {report.waste_items.slice(0, 4).map((w, i) => (
                                        <div key={i}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#fafafa', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 13, color: C2, fontWeight: 900, fontFamily: 'monospace' }}>₩{w.price.toLocaleString()}</span>
                                                <span style={{ fontSize: 9, background: `${C2}20`, padding: '2px 6px', borderRadius: 4, color: C2, fontWeight: 800 }}>+{w.diff_percent}% HIGH</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </aside>

                    {/* --- MAIN CONTENT --- */}
                    <main>
                        {/* AI Insights & KPI Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 32 }}>
                            <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${C}10 0%, transparent 100%)`, borderLeft: `4px solid ${C}` }}>
                                <h4 style={{ fontSize: 10, fontFamily: 'monospace', color: C, marginBottom: 12 }}>◈ AI STRATEGIC SUMMARY</h4>
                                <p style={{ fontSize: 16, lineHeight: 1.6, color: '#e0e0e0', margin: 0, fontStyle: 'italic' }}>
                                    {report?.ai_commentary || "기다려봐! 지금 시장 데이터를 싹 다 분석해서 끝내주는 의견을 정리하고 있어... 😉"}
                                </p>
                            </div>
                            <div style={cardStyle}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: `${C}60`, marginBottom: 8 }}>MARKET COVERAGE</div>
                                    <div style={{ fontSize: 42, fontWeight: 900, color: '#fff' }}>{report?.total_products?.toLocaleString() || '0'}</div>
                                    <div style={{ fontSize: 11, color: `${C}80`, marginTop: 4 }}>Unique Stock Keeping Units (SKUs)</div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Insights Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 40 }}>
                            <div style={{ ...cardStyle, gridColumn: 'span 1' }}>
                                <h4 style={graphTitleStyle}>BRAND DOMINANCE</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                                    {report?.top_makers?.slice(0, 5).map((m, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                                                <span style={{ fontWeight: 600 }}>{m.name}</span>
                                                <span style={{ color: C, fontWeight: 900 }}>{m.share}%</span>
                                            </div>
                                            <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${m.share}%` }} style={{ height: '100%', background: `linear-gradient(90deg, ${C}, ${C}80)`, borderRadius: 3 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ ...cardStyle }}>
                                <h4 style={graphTitleStyle}>CATEGORY COMPOSITION</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                                    {report?.category_stats && Object.entries(report.category_stats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count], i) => {
                                        const share = ((count / (report.total_products || 1)) * 100).toFixed(1);
                                        return (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                                                    <span style={{ fontWeight: 600 }}>{cat}</span>
                                                    <span style={{ color: C2, fontWeight: 900 }}>{share}%</span>
                                                </div>
                                                <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${share}%` }} style={{ height: '100%', background: `linear-gradient(90deg, ${C2}, ${C2}80)`, borderRadius: 3 }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={cardStyle}>
                                <h4 style={graphTitleStyle}>CERTIFICATION LANDSCAPE</h4>
                                <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 20, marginTop: 20, padding: '10px 20px' }}>
                                    {marketDepth?.certification_stats && (
                                        <>
                                            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${marketDepth.certification_stats.kc_total_ratio}%` }}
                                                    style={{ background: `linear-gradient(to top, ${C}, ${C}40)`, borderRadius: '6px 6px 0 0', width: '100%', border: `1px solid ${C}50` }}
                                                />
                                                <div style={{ fontSize: 10, fontWeight: 800, color: C, marginTop: 12 }}>{marketDepth.certification_stats.kc_total_ratio}%</div>
                                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>KC COMPLIANT</div>
                                            </div>
                                            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${marketDepth.certification_stats.ks_total_ratio}%` }}
                                                    style={{ background: `linear-gradient(to top, ${C2}, ${C2}40)`, borderRadius: '6px 6px 0 0', width: '100%', border: `1px solid ${C2}50` }}
                                                />
                                                <div style={{ fontSize: 10, fontWeight: 800, color: C2, marginTop: 12 }}>{marketDepth.certification_stats.ks_total_ratio}%</div>
                                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>KS STANDARD</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={cardStyle}>
                                <h4 style={graphTitleStyle}>PRICE DISTRIBUTION TIERS</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                                    {marketDepth?.price_distribution?.map((tier, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ fontSize: 9, width: 90, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{tier.tier}</div>
                                            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${tier.ratio}%` }}
                                                    style={{ height: '100%', background: i % 2 === 0 ? C : C2 }}
                                                />
                                            </div>
                                            <div style={{ fontSize: 10, width: 35, fontWeight: 700, textAlign: 'right' }}>{tier.ratio}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* List Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 12, color: `${C}80`, fontFamily: 'monospace' }}>
                                SHOWING {filteredProducts.length} ITEMS // {activeCategory.toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
                                    <option value="latest">LATEST COLLECTED</option>
                                    <option value="price_asc">PRICE ASCENDING</option>
                                    <option value="price_desc">PRICE DESCENDING</option>
                                </select>
                            </div>
                        </div>

                        {/* Results Grid/List */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                            {filteredProducts.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                                    style={productCardStyle}
                                >
                                    <div style={{ height: 140, background: '#111', position: 'relative', overflow: 'hidden' }}>
                                        {p.image_url ? (
                                            <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>NO IMAGE</div>
                                        )}
                                        <div style={{ position: 'absolute', top: 8, right: 8, padding: '4px 8px', background: `${BG}90`, backdropFilter: 'blur(10px)', border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 9, fontWeight: 900 }}>
                                            {p.maker}
                                        </div>
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px 0', height: 40, overflow: 'hidden', color: '#fff' }}>{p.name}</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 15, height: 20 }}>
                                            {(p.name + JSON.stringify(p.specs || {})).toLowerCase().includes('kc') && <span style={badgeStyle('#4caf50')}>KC</span>}
                                            {(p.name + JSON.stringify(p.specs || {})).toLowerCase().includes('ks') && <span style={badgeStyle('#2196f3')}>KS</span>}
                                            {p.specs?.wattage && <span style={badgeStyle(C)}>{p.specs.wattage}</span>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div>
                                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>RETAIL PRICE</div>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: C }}>₩{p.price.toLocaleString()}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>SELLERS</div>
                                                <div style={{ fontSize: 12, fontWeight: 700 }}>{p.seller_count || 1}</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}

const sideSectionStyle = {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: `1px solid ${BORDER}`
}

const sideTitleStyle = {
    fontFamily: 'monospace',
    fontSize: 10,
    color: `${C}60`,
    letterSpacing: '0.2em',
    marginBottom: 16,
    fontWeight: 800
}

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${BORDER}`,
    padding: '10px 14px',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    outline: 'none'
}

const filterBtnStyle = (active) => ({
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    background: active ? `${C}15` : 'transparent',
    border: 'none',
    color: active ? C : 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: active ? 800 : 400,
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'Outfit'
})

const cardStyle = {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: 24,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
}

const productCardStyle = {
    background: 'rgba(255, 255, 255, 0.02)',
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
}

const graphTitleStyle = {
    fontSize: 10,
    fontFamily: 'monospace',
    color: `${C}90`,
    letterSpacing: '0.2em',
    margin: '0 0 20px 0',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'uppercase'
}

const badgeStyle = (color) => ({
    fontSize: 8,
    padding: '2px 5px',
    borderRadius: 2,
    background: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
    fontWeight: 900,
    fontFamily: 'monospace'
})
