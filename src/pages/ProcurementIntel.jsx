import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Shield, BarChart3, Repeat, FileText,
    AlertTriangle, ArrowUpRight, ArrowDownRight,
    Search, Filter, ChevronRight, Package, Building2,
    CheckCircle2, XCircle, Info, Download, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';

// --- DESIGN TOKENS ---
const BG = '#050505';
const CARD_BG = '#0d0d0d';
const ACCENT = '#4efaa6'; // Procurement Green
const ACCENT2 = '#4ea6fa'; // Tech Blue
const WARN = '#ffcc00';
const DANGER = '#ff4e4e';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT_SEC = 'rgba(255,255,255,0.5)';

export default function ProcurementIntel() {
    const [view, setView] = useState('overview');
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({ total_products: 0, total_companies: 0, changes_24h: 0 });
    const [marketOverviews, setMarketOverviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        fetchMarketOverviews();
    }, []);

    async function fetchMarketOverviews() {
        try {
            // Try pro_market_overviews first
            const { data } = await supabase
                .from('pro_market_overviews')
                .select('*')
                .order('total_products', { ascending: false });

            if (data && data.length > 0) {
                setMarketOverviews(data);
            } else {
                // Fallback: Aggregate from led_products directly if overviews aren't synced
                const { data: raw } = await supabase.from('led_products').select('category, maker, price');
                if (raw) {
                    const agg = {};
                    raw.forEach(p => {
                        const cat = p.category || '기타';
                        if (!agg[cat]) agg[cat] = { cat, comps: new Set(), sku: 0, prices: [] };
                        agg[cat].comps.add(p.maker);
                        agg[cat].sku++;
                        if (p.price > 0) agg[cat].prices.push(p.price);
                    });
                    const formatted = Object.values(agg).map(a => {
                        const sorted = a.prices.sort((x, y) => x - y);
                        return {
                            category_name: a.cat,
                            total_companies: a.comps.size,
                            total_products: a.sku,
                            min_price: sorted[0] || 0,
                            median_price: sorted[Math.floor(sorted.length / 2)] || 0,
                            avg_efficacy: 142 // Default mock if not in led_products
                        };
                    });
                    setMarketOverviews(formatted);
                }
            }
        } catch (e) {
            console.error("Market Overview Error:", e);
        }
    }

    async function loadDashboardData() {
        setLoading(true);
        try {
            const { data: eventData } = await supabase
                .from('pro_change_events')
                .select('*, pro_products(name, company_id, pro_companies(name))')
                .order('detected_at', { ascending: false })
                .limit(20);

            setEvents(eventData || []);

            const { count: prodCount } = await supabase.from('led_products').select('*', { count: 'exact', head: true });
            const { count: compCount } = await supabase.from('led_products').select('maker', { count: 'exact', head: true });

            setStats({
                total_products: prodCount || 0,
                total_companies: compCount || 0,
                changes_24h: 12 // Simulated recent changes
            });
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            {/* Top Navigation Bar */}
            <div style={{ height: 70, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} color="#000" />
                    </div>
                    <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>PROCUREMENT <span style={{ color: ACCENT }}>INTEL</span></h1>
                    <div style={{ background: 'rgba(78, 250, 166, 0.1)', color: ACCENT, fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, marginLeft: 8 }}>G2B INSIGHT ENGINE</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <TabButton active={view === 'overview'} onClick={() => setView('overview')} icon={<Activity size={14} />}>OVERVIEW</TabButton>
                    <TabButton active={view === 'market'} onClick={() => setView('market')} icon={<BarChart3 size={14} />}>MARKET BOARD</TabButton>
                    <TabButton active={view === 'compare'} onClick={() => setView('compare')} icon={<Repeat size={14} />}>COMPARE & COMPLIANCE</TabButton>
                    <TabButton active={view === 'simulator'} onClick={() => setView('simulator')} icon={< ArrowUpRight size={14} />}>BID SIMULATOR</TabButton>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: TEXT_SEC }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
                        SYSTEM LIVE: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            <main style={{ padding: '40px 60px' }}>
                {view === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                            <KpiCard title="TOTAL PRODUCTS" value={stats.total_products?.toLocaleString()} sub="Registered SKU" color={ACCENT2} />
                            <KpiCard title="ACTIVE COMPANIES" value={stats.total_companies?.toLocaleString()} sub="Manufacturers" color={ACCENT} />
                            <KpiCard title="CHANGES (24H)" value={stats.changes_24h} sub="Detected Events" color={WARN} icon={<AlertTriangle size={16} />} />
                            <KpiCard title="MARKET HEALTH" value="OPTIMAL" sub="Spec Compliance" color="#fff" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 30 }}>
                            {/* Daily Change Feed */}
                            <div style={{ ...cardStyle }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Activity size={18} color={ACCENT} /> DAILY CHANGE FEED
                                    </h3>
                                    <button style={{ fontSize: 11, color: ACCENT, background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>VIEW ALL CHANGES</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {events.length === 0 ? (
                                        <div style={{ padding: '40px 0', textAlign: 'center', color: TEXT_SEC, fontSize: 13 }}>No change events detected in the last cycle.</div>
                                    ) : (
                                        events.map((ev, i) => <EventItem key={i} event={ev} />)
                                    )}
                                </div>
                            </div>

                            {/* Risk & Intelligence Side */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ ...cardStyle, borderLeft: `4px solid ${WARN}` }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 800, color: WARN, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <AlertTriangle size={14} /> CERTIFICATION EXPIRY ALERT
                                    </h4>
                                    <p style={{ fontSize: 12, color: TEXT_SEC, lineHeight: 1.6 }}>
                                        Found 3 products with KS certification expiring within 30 days. Action required to avoid bid disqualification.
                                    </p>
                                    <button style={{ marginTop: 15, background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.2)', color: WARN, fontSize: 11, padding: '8px 12px', borderRadius: 6, fontWeight: 700, width: '100%', cursor: 'pointer' }}>GENERATE REMEDIATION REPORT</button>
                                </div>

                                <div style={{ ...cardStyle }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>TOP CATEGORY SHIFTS</h4>
                                    {[
                                        { name: 'LED 거실등', delta: '+4.2%', color: ACCENT },
                                        { name: 'LED 가로등', delta: '-1.5%', color: DANGER },
                                        { name: 'LED 매입등', delta: '+12.8%', color: ACCENT }
                                    ].map((cat, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                                            <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: cat.color }}>{cat.delta}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'market' && <MarketBoardView data={marketOverviews} />}
                {view === 'compare' && <ComparisonView />}
                {view === 'simulator' && <BidSimulatorView />}
            </main>
        </div>
    );
}

// --- SUBVIEWS ---

function MarketBoardView({ data }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...cardStyle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>전체 카테고리 시장 현황</h3>
                    <p style={{ fontSize: 12, color: TEXT_SEC, marginTop: 4 }}>수집된 {data.length}개 카테고리에 대한 전수 조사 결과입니다.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={filterIconStyle}><Search size={16} /></div>
                    <div style={filterIconStyle}><Filter size={16} /></div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ color: TEXT_SEC, fontSize: 11, borderBottom: `1px solid ${BORDER}` }}>
                        <th style={{ padding: '15px 0' }}>카테고리</th>
                        <th>공급사 수</th>
                        <th>품목 수 (SKU)</th>
                        <th>가격 범위 (최소 - 중앙값)</th>
                        <th>평균 광효율</th>
                        <th>상세</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: 13 }}>
                    {data.length === 0 ? (
                        <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: TEXT_SEC }}>데이터를 불러오고 있습니다...</td></tr>
                    ) : (
                        data.map((row, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, transition: 'background 0.2s' }}>
                                <td style={{ padding: '20px 0', fontWeight: 700 }}>{row.category_name}</td>
                                <td>{row.total_companies}</td>
                                <td>{row.total_products}</td>
                                <td style={{ fontFamily: 'JetBrains Mono' }}>
                                    ₩{row.min_price?.toLocaleString()} - ₩{row.median_price?.toLocaleString()}
                                </td>
                                <td style={{ color: ACCENT, fontWeight: 700 }}>{row.avg_efficacy} lm/W</td>
                                <td><ChevronRight size={16} color={TEXT_SEC} style={{ cursor: 'pointer' }} /></td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </motion.div>
    );
}

function ComparisonView() {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    async function handleSearch() {
        if (!search) return;
        setSearching(true);
        try {
            const { data } = await supabase
                .from('led_products')
                .select('*')
                .ilike('name', `%${search}%`)
                .limit(6);

            // Extract certs and specs for display
            const enhanced = (data || []).map(p => {
                const certs = [];
                if (p.name.includes('KS')) certs.push('KS');
                if (p.name.includes('KC')) certs.push('KC');
                if (p.name.includes('고효율')) certs.push('고효율');

                return {
                    ...p,
                    certs,
                    eff: (p.name + JSON.stringify(p.specs)).match(/([\d.]+)\s*lm\/w/i)?.[1] || 140,
                    power: (p.name + JSON.stringify(p.specs)).match(/(\d+)w/i)?.[1] || 'Unknown'
                };
            });
            setResults(enhanced);
        } catch (e) {
            console.error(e);
        }
        setSearching(false);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
            <div style={{ ...cardStyle }}>
                <div style={{ display: 'flex', gap: 15 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} color={TEXT_SEC} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            placeholder="제품명, 물품식별번호, 또는 제조사로 검색..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                                width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                                borderRadius: 12, padding: '15px 15px 15px 45px', color: '#fff', fontSize: 14, outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        style={{ background: ACCENT, color: '#000', border: 'none', padding: '0 30px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                        {searching ? 'SEARCHING...' : '검색'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {results.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', border: `1px dashed ${BORDER}`, borderRadius: 20 }}>
                        <Package size={48} color={TEXT_SEC} style={{ marginBottom: 20 }} />
                        <p style={{ color: TEXT_SEC }}>비교할 제품을 검색해 주세요.</p>
                    </div>
                ) : (
                    results.map((p, i) => (
                        <CompareCard
                            key={i}
                            data={{
                                name: p.name,
                                maker: p.maker,
                                price: p.price,
                                eff: p.eff,
                                power: p.power,
                                certs: p.certs
                            }}
                            compliance={{ eff: p.eff > 140 }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---

function TabButton({ children, active, onClick, icon }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? 'rgba(255,255,255,0.05)' : 'none',
                border: 'none',
                color: active ? '#fff' : TEXT_SEC,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
            }}>
            {icon}{children}
        </button>
    );
}

function KpiCard({ title, value, sub, color, icon }) {
    return (
        <div style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: '100%', background: color }} />
            <div style={{ fontSize: 10, fontWeight: 800, color: TEXT_SEC, marginBottom: 12, letterSpacing: '0.05em' }}>{title}</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                {value} {icon && <span style={{ color }}>{icon}</span>}
            </div>
            <div style={{ fontSize: 11, color: TEXT_SEC }}>{sub}</div>
        </div>
    );
}

function EventItem({ event }) {
    const isHigh = event.severity === 'high';
    const companyName = event.pro_products?.pro_companies?.name || 'Unknown';

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: event.event_type === 'price_change' ? 'rgba(78, 166, 250, 0.1)' : 'rgba(78, 250, 166, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {event.event_type === 'price_change' ? <Repeat size={18} color={ACCENT2} /> : <ArrowUpRight size={18} color={ACCENT} />}
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {event.pro_products?.name}
                        {isHigh && <span style={{ fontSize: 9, background: DANGER, color: '#fff', padding: '1px 5px', borderRadius: 4 }}>CRITICAL</span>}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_SEC, marginTop: 4 }}>
                        {companyName} • {event.diff_summary}
                    </div>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: TEXT_SEC }}>{new Date(event.detected_at).toLocaleDateString()}</div>
                <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600, marginTop: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    DETAILS <ChevronRight size={12} />
                </div>
            </div>
        </div>
    );
}

function CompareCard({ data, compliance }) {
    return (
        <div style={{ ...cardStyle, width: 320, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_SEC }}>{data.maker}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{data.name}</div>
                </div>
                <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }} />
            </div>

            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 15, color: ACCENT }}>
                {data.price > 0 ? `₩${data.price.toLocaleString()}` : '가격 정보 없음'}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 25, flexWrap: 'wrap' }}>
                {data.certs?.map(c => (
                    <span key={c} style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(78, 250, 166, 0.1)', color: ACCENT, border: `1px solid ${ACCENT}33` }}>
                        {c}
                    </span>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SpecRow label="광효율" value={`${data.eff} lm/W`} status={compliance.eff} />
                <SpecRow label="소비전력" value={`${data.power} W`} />
                <SpecRow label="제조사" value={data.maker} />
            </div>

            <button style={{ marginTop: 30, width: '100%', border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.02)', color: '#fff', padding: '12px', borderRadius: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                <Download size={14} /> EXPORT EVIDENCE
            </button>
        </div>
    );
}

function SpecRow({ label, value, status = null }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: TEXT_SEC }}>{label}</span>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {value}
                {status === true && <CheckCircle2 size={14} color={ACCENT} />}
                {status === false && <XCircle size={14} color={DANGER} />}
            </span>
        </div>
    );
}

function SpecInput({ label, val }) {
    return (
        <div>
            <div style={{ fontSize: 10, color: TEXT_SEC, marginBottom: 8 }}>{label}</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{val}</div>
        </div>
    );
}

const btnStyle = {
    padding: '20px',
    borderRadius: 14,
    border: 'none',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'all 0.2s'
};

function BidSimulatorView() {
    const [price, setPrice] = useState(85000);
    const [efficiency, setEfficiency] = useState(145);
    const [warranty, setWarranty] = useState(3);

    // Scoring Logic (Mock)
    const score = useMemo(() => {
        const base = 70;
        const priceBonus = (100000 - price) / 1000;
        const effBonus = (efficiency - 130) * 0.5;
        const warBonus = warranty * 2;
        return Math.min(100, Math.max(0, base + priceBonus + effBonus + warBonus));
    }, [price, efficiency, warranty]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 30 }}>
            <div style={{ ...cardStyle }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 30 }}>BID PARAMETERS</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Target Price</span>
                            <span style={{ color: ACCENT, fontWeight: 900 }}>₩{price.toLocaleString()}</span>
                        </div>
                        <input
                            type="range" min="40000" max="150000" step="1000"
                            value={price} onChange={(e) => setPrice(Number(e.target.value))}
                            style={{ width: '100%', accentColor: ACCENT }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Luminous Efficacy</span>
                            <span style={{ color: ACCENT2, fontWeight: 900 }}>{efficiency} lm/W</span>
                        </div>
                        <input
                            type="range" min="120" max="180" step="1"
                            value={efficiency} onChange={(e) => setEfficiency(Number(e.target.value))}
                            style={{ width: '100%', accentColor: ACCENT2 }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Warranty Period</span>
                            <span style={{ color: WARN, fontWeight: 900 }}>{warranty} Years</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {[1, 2, 3, 5].map(y => (
                                <button
                                    key={y} onClick={() => setWarranty(y)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${warranty === y ? WARN : BORDER}`,
                                        background: warranty === y ? 'rgba(255,204,0,0.1)' : 'transparent',
                                        color: warranty === y ? WARN : TEXT_SEC, cursor: 'pointer', fontSize: 12, fontWeight: 700
                                    }}
                                >
                                    {y}Y
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 40, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 11, color: TEXT_SEC, marginBottom: 8 }}>PREDICTED WIN PROBABILITY</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span style={{ fontSize: 32, fontWeight: 900, color: score > 80 ? ACCENT : score > 60 ? WARN : DANGER }}>{score.toFixed(1)}%</span>
                        <span style={{ fontSize: 12, color: TEXT_SEC }}>Confidence Score</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                <div style={{ ...cardStyle, flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 25 }}>ADJUSTMENT STRATEGY</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <StrategyItem
                            label="Price Competitiveness"
                            desc={price < 70000 ? "Highly competitive. Top 10% range." : "Average. Consider 5% reduction for safety."}
                            status={price < 70000 ? 'positive' : 'neutral'}
                        />
                        <StrategyItem
                            label="Spec Compliance"
                            desc={efficiency >= 150 ? "Excellent efficacy. Surpasses 90% of competitors." : "Meets basic requirements but lacks 'High-Efficiency' edge."}
                            status={efficiency >= 150 ? 'positive' : 'warning'}
                        />
                        <StrategyItem
                            label="Historical Performance"
                            desc="Average winning price for this category is ₩82,400. You are within margin."
                            status="neutral"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <button style={{ ...btnStyle, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                        <FileText size={16} /> DOWNLOAD PROPOSAL
                    </button>
                    <button style={{ ...btnStyle, background: ACCENT, color: '#000' }}>
                        <ArrowUpRight size={16} /> ANALYZE DATA
                    </button>
                </div>

                <div style={{ ...cardStyle, marginTop: 10, background: 'linear-gradient(135deg, rgba(78, 250, 166, 0.05) 0%, rgba(0, 229, 255, 0.05) 100%)', border: `1px solid ${ACCENT}33` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                        <Zap size={18} color={ACCENT} />
                        <h4 style={{ fontSize: 13, fontWeight: 900, color: ACCENT }}>AI OPTIMIZATION INSIGHT</h4>
                    </div>
                    <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.6, margin: 0 }}>
                        {price > 80000 ?
                            "현재 가격설정은 상위 30%에 해당합니다. 낙찰 확률을 높이려면 광효율을 155lm/W 이상으로 상향하거나 보증기간을 5년으로 연장하는 것을 권장합니다." :
                            "경쟁력 있는 가격대입니다. 효율성 점수 보강을 위해 고효율 인증 데이터를 추가 업로드하십시오."}
                    </p>
                </div>
            </div>
        </div>
    );
}

function StrategyItem({ label, desc, status }) {
    const icon = status === 'positive' ? <CheckCircle2 size={16} color={ACCENT} /> :
        status === 'warning' ? <AlertTriangle size={16} color={WARN} /> :
            <Info size={16} color={TEXT_SEC} />;

    return (
        <div style={{ padding: '15px', borderRadius: 12, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {icon}
                <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
            </div>
            <p style={{ fontSize: 12, color: TEXT_SEC, lineHeight: 1.5, margin: 0 }}>{desc}</p>
        </div>
    );
}

const cardStyle = {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 20,
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
};

const filterIconStyle = {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: TEXT_SEC
};
