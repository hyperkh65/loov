import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Shield, BarChart3, Repeat, FileText,
    AlertTriangle, ArrowUpRight, ArrowDownRight,
    Search, Filter, ChevronRight, Package, Building2,
    CheckCircle2, XCircle, Info, Download
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
    const [view, setView] = useState('overview'); // overview, market, compare, simulator
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({ total_products: 0, total_companies: 0, changes_24h: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        setLoading(true);
        try {
            // Load Events
            const { data: eventData } = await supabase
                .from('pro_change_events')
                .select('*, pro_products(name, company_id, pro_companies(name))')
                .order('detected_at', { ascending: false })
                .limit(20);

            setEvents(eventData || []);

            // Dashboard Summary
            const { count: prodCount } = await supabase.from('pro_products').select('*', { count: 'exact', head: true });
            const { count: compCount } = await supabase.from('pro_companies').select('*', { count: 'exact', head: true });
            const { count: eventCount } = await supabase.from('pro_change_events')
                .select('*', { count: 'exact', head: true })
                .gte('detected_at', new Date(Date.now() - 86400000).toISOString());

            setStats({
                total_products: prodCount || 0,
                total_companies: compCount || 0,
                changes_24h: eventCount || 0
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

                {view === 'market' && <MarketBoardView />}
                {view === 'compare' && <ComparisonView />}
            </main>
        </div>
    );
}

// --- SUBVIEWS ---

function MarketBoardView() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...cardStyle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>CATEGORY MARKET OVERVIEW</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={filterIconStyle}><Search size={16} /></div>
                    <div style={filterIconStyle}><Filter size={16} /></div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ color: TEXT_SEC, fontSize: 11, borderBottom: `1px solid ${BORDER}` }}>
                        <th style={{ padding: '15px 0' }}>CATEGORY</th>
                        <th>SUPPLIERS</th>
                        <th>SKU COUNT</th>
                        <th>PRICE RANGE (MIN - MEDIAN)</th>
                        <th>AVG EFFICACY</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: 13 }}>
                    {[
                        { cat: 'LED 거실등', comps: 42, sku: 891, price: '₩52,000 - ₩84,000', eff: '142 lm/W' },
                        { cat: 'LED 가로등', comps: 18, sku: 245, price: '₩180,000 - ₩320,000', eff: '158 lm/W' },
                        { cat: 'LED 매입등', comps: 64, sku: 1240, price: '₩8,900 - ₩18,500', eff: '135 lm/W' }
                    ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ padding: '20px 0', fontWeight: 700 }}>{row.cat}</td>
                            <td>{row.comps}</td>
                            <td>{row.sku}</td>
                            <td style={{ fontFamily: 'JetBrains Mono' }}>{row.price}</td>
                            <td style={{ color: ACCENT, fontWeight: 700 }}>{row.eff}</td>
                            <td><ChevronRight size={16} color={TEXT_SEC} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </motion.div>
    );
}

function ComparisonView() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 30 }}>
            <div style={{ ...cardStyle, height: 'fit-content' }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 20 }}>TARGET SPECIFICATION</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <SpecInput label="Required Efficacy" val="> 140 lm/W" />
                    <SpecInput label="Required Power" val="50W ± 10%" />
                    <SpecInput label="Warranty" val="> 3 Years" />
                    <SpecInput label="CCT Range" val="5700K - 6500K" />
                </div>
                <button style={{ marginTop: 25, width: '100%', background: ACCENT, border: 'none', padding: '12px', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>SEARCH EQUIVALENTS</button>
            </div>

            <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20 }}>
                {/* Comparison Card (Mock) */}
                <CompareCard
                    data={{ name: 'Premium Edge V2', maker: 'A-Lighting', price: 92000, flux: 7200, power: 50, eff: 144, warranty: 5 }}
                    compliance={{ eff: true, power: true, warranty: true }}
                />
                <CompareCard
                    data={{ name: 'Eco Slim Board', maker: 'B-Tech', price: 78000, flux: 6500, power: 48, eff: 135, warranty: 2 }}
                    compliance={{ eff: false, power: true, warranty: false }}
                />
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

            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 25, color: ACCENT }}>₩{data.price.toLocaleString()}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SpecRow label="Luminous Flux" value={`${data.flux} lm`} />
                <SpecRow label="Power" value={`${data.power} W`} />
                <SpecRow label="Efficacy" value={`${data.eff} lm/W`} status={compliance.eff} />
                <SpecRow label="Warranty" value={`${data.warranty} Years`} status={compliance.warranty} />
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
