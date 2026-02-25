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
    const [originFilter, setOriginFilter] = useState('all') // 'korea', 'china', 'all'
    const [dbCategories, setDbCategories] = useState([])
    const [showAddCategory, setShowAddCategory] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [newCatPass, setNewCatPass] = useState('')

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

        let allProds = [];
        let offset = 0;
        const PAGE_SIZE = 1000;

        try {
            while (allProds.length < 10000) {
                const { data, error } = await supabase
                    .from('led_products')
                    .select('*')
                    .order('collected_at', { ascending: false })
                    .range(offset, offset + PAGE_SIZE - 1);

                if (error || !data || data.length === 0) break;
                allProds = [...allProds, ...data];
                if (data.length < PAGE_SIZE) break;
                offset += PAGE_SIZE;
            }
            setProducts(allProds)
        } catch (e) {
            console.error("◈ Error fetching products:", e);
        }

        const { data: cats, error: catError } = await supabase.from('led_categories').select('*').order('name')
        if (catError) {
            console.warn("◈ LED_CATEGORIES table missing or inaccessible. Run migration 002.");
            setDbCategories([])
        } else if (cats) {
            setDbCategories(cats)
        }

        setLoading(false)
    }

    async function handleAddCategory() {
        if (newCatPass !== '1209') {
            alert('◈ ACCESS DENIED: INVALID KEYCODE')
            return
        }
        if (!newCatName.trim()) return

        const { error } = await supabase.from('led_categories').insert([{ name: newCatName.trim(), keyword: newCatName.trim() }])
        if (error) {
            alert('! ERROR: ' + error.message)
        } else {
            setNewCatName('')
            setNewCatPass('')
            setShowAddCategory(false)
            loadData()
        }
    }

    const filteredProducts = products.filter(p => {
        const matchesCat = activeCategory === 'all' || p.category === activeCategory
        const matchesMaker = activeMaker === 'all' || p.maker === activeMaker
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1]
        const q = searchQuery.toLowerCase()
        const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.maker.toLowerCase().includes(q)

        // Origin logic: Korea vs China vs Other
        const specStr = JSON.stringify(p.specs || {}).toLowerCase();
        const brandStr = (p.name + " " + p.maker + " " + specStr).toLowerCase();
        const isKorea = brandStr.includes('국산') || brandStr.includes('한국') || brandStr.includes('대한민국') || brandStr.includes('korea');
        const isChina = brandStr.includes('중국') || brandStr.includes('made in china') || brandStr.includes('china');
        const pOrigin = isKorea ? 'korea' : (isChina ? 'china' : 'other');

        let matchesOrigin = true;
        if (originFilter === 'korea') matchesOrigin = pOrigin === 'korea';
        else if (originFilter === 'china') matchesOrigin = pOrigin === 'china';

        const imgUrl = p.image_url || ''
        const isDanawaLogo = imgUrl.includes('danawa.com/prod_img') && (imgUrl.includes('no_image') || imgUrl.includes('danawa_logo') || imgUrl.includes('img_danawa.com/new/no_image'))
        const hasNoImage = !imgUrl || isDanawaLogo

        return matchesCat && matchesMaker && matchesPrice && matchesSearch && matchesOrigin && !hasNoImage
    }).sort((a, b) => {
        if (sort === 'price_asc') return a.price - b.price
        if (sort === 'price_desc') return b.price - a.price
        return new Date(b.collected_at) - new Date(a.collected_at)
    })

    const makers = [...new Set(products.map(p => p.maker))].sort()
    const categories = dbCategories.length > 0
        ? dbCategories.filter(c => c.is_active).map(c => c.name)
        : [...new Set(products.map(p => p.category))].filter(Boolean).sort()

    const calculateMarketDepth = (items) => {
        if (!items || items.length === 0) return null;

        const total = items.length;

        // Origin
        let koreaCount = 0;
        let chinaCount = 0;
        items.forEach(p => {
            const s = (p.name + p.maker + JSON.stringify(p.specs || {})).toLowerCase();
            if (s.includes('국산') || s.includes('한국') || s.includes('korea')) koreaCount++;
            else if (s.includes('중국') || s.includes('china')) chinaCount++;
        });
        const origin_stats = {
            korea_ratio: parseFloat(((koreaCount / total) * 100).toFixed(1)),
            china_ratio: parseFloat(((chinaCount / total) * 100).toFixed(1))
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

        // Yearly Trends
        const yearly_trends = {};
        items.forEach(p => {
            const releaseDate = p.specs?.released_at;
            if (releaseDate && releaseDate.includes('.')) {
                const year = releaseDate.split('.')[0];
                if (parseInt(year) > 2015 && parseInt(year) <= new Date().getFullYear()) {
                    yearly_trends[year] = (yearly_trends[year] || 0) + 1;
                }
            }
        });

        return { origin_stats, price_distribution, yearly_trends };
    };

    const marketDepth = report?.waste_items?.origin_stats
        ? report.waste_items
        : calculateMarketDepth(filteredProducts);

    const yearlyTrends = marketDepth?.yearly_trends || {};
    const originStatsData = marketDepth?.origin_stats || { korea_ratio: 0, china_ratio: 0 };

    const selectStyle = {
        background: `${BG}99`,
        border: `1px solid ${BORDER}`,
        color: '#fff',
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 11,
        outline: 'none',
        backdropFilter: 'blur(5px)'
    }

    const inputStyle = {
        width: '100%',
        background: '#000',
        border: `1px solid ${C}30`,
        color: '#fff',
        padding: '12px',
        borderRadius: 8,
        fontSize: 13,
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    }

    const sideSectionStyle = {
        background: `${BG}40`,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${BORDER}`,
        backdropFilter: 'blur(10px)'
    }

    const sideTitleStyle = { fontSize: 10, fontWeight: 700, color: `${C}cc`, marginBottom: 12, letterSpacing: '0.1em' }

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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ ...sideTitleStyle, marginBottom: 0 }}>◈ CATEGORY</h3>
                                <button
                                    onClick={() => setShowAddCategory(true)}
                                    style={{
                                        background: `linear-gradient(135deg, ${C}, ${C2})`,
                                        border: 'none',
                                        color: BG,
                                        fontSize: 9,
                                        fontWeight: 800,
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        boxShadow: `0 4px 12px ${C}30`
                                    }}
                                >+ NEW</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflowY: 'auto', paddingRight: 6, scrollbarWidth: 'thin' }}>
                                <button onClick={() => setActiveCategory('all')} style={filterBtnStyle(activeCategory === 'all')}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <span>ALL CATEGORIES</span>
                                        <span style={{ fontSize: 9, background: `${C}20`, color: C, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{products.length}</span>
                                    </div>
                                </button>
                                {categories.map(cat => {
                                    const count = products.filter(p => p.category === cat).length;
                                    return (
                                        <button key={cat} onClick={() => setActiveCategory(cat)} style={filterBtnStyle(activeCategory === cat)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <span>{cat.toUpperCase()}</span>
                                                <span style={{ opacity: 0.5, fontSize: 10, fontWeight: 800 }}>
                                                    {products.filter(p => (p.category || '').trim() === cat.trim()).length}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section style={sideSectionStyle}>
                            <h3 style={sideTitleStyle}>◈ PRODUCT ORIGIN</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setOriginFilter('all')} style={filterBtnStyle(originFilter === 'all')}>ALL</button>
                                <button onClick={() => setOriginFilter('korea')} style={filterBtnStyle(originFilter === 'korea')}>KOREA</button>
                                <button onClick={() => setOriginFilter('china')} style={filterBtnStyle(originFilter === 'china')}>CHINA</button>
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

                        {/* --- BRAND PORTFOLIO (TOP 100) --- */}
                        <section style={{ ...sideSectionStyle, borderBottom: 'none' }}>
                            <h3 style={sideTitleStyle}>◈ BRAND PORTFOLIO (TOP 100)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {report?.top_makers?.slice(0, 100).map((maker, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                            <span style={{ fontWeight: 900, color: '#fff', wordBreak: 'break-all', lineHeight: 1.2 }}>
                                                #{i + 1} {maker.name}
                                            </span>
                                            <span style={{ color: C, fontWeight: 900 }}>{maker.count}</span>
                                        </div>
                                        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                                            <div style={{ height: '100%', width: `${(maker.count / (report.top_makers[0]?.count || 1)) * 100}%`, background: C, borderRadius: 2 }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                            <span>₩{Math.round(maker.avgPrice / 1000)}k</span>
                                            <span>CERT {maker.certRatio}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

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

                            <div style={cardStyle}>
                                <h4 style={graphTitleStyle}>ANNUAL RELEASE TRENDS</h4>
                                <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 20 }}>
                                    {yearlyTrends && Object.entries(yearlyTrends)
                                        .sort((a, b) => a[0] - b[0])
                                        .slice(-8)
                                        .map(([year, count], i) => {
                                            const max = Math.max(...Object.values(yearlyTrends));
                                            const height = (count / max) * 100;
                                            return (
                                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: '100%', height: 140, display: 'flex', alignItems: 'flex-end' }}>
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${height}%` }}
                                                            style={{
                                                                width: '100%',
                                                                background: `linear-gradient(to top, ${C2}, ${C2}20)`,
                                                                border: `1px solid ${C2}40`,
                                                                borderRadius: '4px 4px 0 0',
                                                                boxShadow: `0 0 15px ${C2}20`
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ fontSize: 9, color: `${C2}cc`, fontFamily: 'monospace', fontWeight: 800 }}>{year}</div>
                                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{count}</div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            <div style={cardStyle}>
                                <h4 style={graphTitleStyle}>MARKET ORIGIN RATIO</h4>
                                <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 20, marginTop: 20, padding: '10px 20px' }}>
                                    {(() => {
                                        const kRatio = originStatsData.korea_ratio || 0;
                                        const cRatio = originStatsData.china_ratio || 0;

                                        return (
                                            <>
                                                <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${kRatio}%` }}
                                                        style={{ background: `linear-gradient(to top, #4efaa6, #4efaa640)`, borderRadius: '6px 6px 0 0', width: '100%', border: `1px solid #4efaa650` }}
                                                    />
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#4efaa6', marginTop: 12 }}>{kRatio}%</div>
                                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>KOREA ORIGIN</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${cRatio}%` }}
                                                        style={{ background: `linear-gradient(to top, #ff4e4e, #ff4e4e40)`, borderRadius: '6px 6px 0 0', width: '100%', border: `1px solid #ff4e4e50` }}
                                                    />
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#ff4e4e', marginTop: 12 }}>{cRatio}%</div>
                                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>CHINA ORIGIN</div>
                                                </div>
                                            </>
                                        );
                                    })()}
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
                                            {(() => {
                                                const s = (p.name + JSON.stringify(p.specs || {})).toLowerCase();
                                                const kr = s.includes('국산') || s.includes('한국') || s.includes('korea');
                                                const cn = s.includes('중국') || s.includes('china');
                                                return (
                                                    <>
                                                        {kr && <span style={badgeStyle('#4efaa6')}>KR</span>}
                                                        {cn && <span style={badgeStyle('#ff4e4e')}>CN</span>}
                                                    </>
                                                );
                                            })()}
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

                {/* --- ADD CATEGORY MODAL --- */}
                <AnimatePresence>
                    {showAddCategory && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                style={{ ...cardStyle, width: 320, padding: 30, border: `1px solid ${C}40` }}
                            >
                                <h3 style={{ ...sideTitleStyle, color: C, textAlign: 'center' }}>◈ REGISTER CATEGORY</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: `${C}80`, marginBottom: 6 }}>CATEGORY NAME</div>
                                        <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={inputStyle} placeholder="e.g. LED 거실등" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10, color: `${C}80`, marginBottom: 6 }}>SECURITY KEYCODE</div>
                                        <input type="password" value={newCatPass} onChange={e => setNewCatPass(e.target.value)} style={inputStyle} placeholder="****" />
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                        <button onClick={() => setShowAddCategory(false)} style={{ ...filterBtnStyle(false), flex: 1 }}>CANCEL</button>
                                        <button onClick={handleAddCategory} style={{ ...filterBtnStyle(true), flex: 1, background: C, color: BG }}>CONFIRM</button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
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
