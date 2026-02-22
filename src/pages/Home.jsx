import Scene3D from '../components/Scene3D'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const C = '#00e5ff'      // 브랜드 시안
const C2 = '#0090cc'    // 딥 시안

export default function Home() {
    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150vh', background: '#00020e' }}>

            {/* ── 3D BRAIN 배경 ── */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
                <Scene3D />
            </div>

            {/* ── HUD 코너 브래킷 ── */}
            <HUDCorners />

            {/* ── 상단 상태 바 ── */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0,
                zIndex: 10, padding: '12px 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: 'monospace', fontSize: 10, color: `${C}99`,
                borderBottom: `1px solid ${C}18`,
                background: 'linear-gradient(180deg, rgba(0,2,14,0.7) 0%, transparent 100%)',
                backdropFilter: 'blur(4px)',
            }}>
                <span>◈ LOOV INTEL SYS v2.4</span>
                <StatusBar />
                <span>◈ NEURO-LINK ACTIVE</span>
            </div>

            {/* ── 히어로 섹션 ── */}
            <section style={{
                position: 'relative', height: '100vh', zIndex: 5,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                paddingBottom: '13vh', pointerEvents: 'none',
            }}>
                {/* LOOV 단선 SVG 브랜딩 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{ marginBottom: 8, pointerEvents: 'auto' }}
                >
                    <LOOVLogo />
                </motion.div>

                {/* 슬로건 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    style={{
                        fontFamily: 'Satisfy, cursive',
                        fontSize: 16,
                        color: C,
                        letterSpacing: 2,
                        marginBottom: 10,
                        textShadow: `0 0 14px ${C}88`,
                        opacity: 0.8,
                    }}
                >
                    Born to be bright
                </motion.p>

                {/* 서브타이틀 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.0 }}
                    style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 300,
                        fontSize: 12,
                        color: `${C}80`,
                        letterSpacing: '0.35em',
                        textTransform: 'uppercase',
                        marginBottom: 32,
                    }}
                >
                    LED Intelligence Platform
                </motion.p>

                {/* 버튼 */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2 }}
                    style={{ display: 'flex', gap: 12, pointerEvents: 'auto' }}
                >
                    <Link to="/market" style={btnPrimary}>
                        ▷ INITIALIZE DASHBOARD
                    </Link>
                    <Link to="/board" style={btnSecondary}>
                        ◈ EXPLORE DATA
                    </Link>
                </motion.div>
            </section>

            {/* ── 피처 패널 ── */}
            <section className="container" style={{ position: 'relative', zIndex: 5, padding: '60px 0 100px' }}>
                <div className="grid grid-cols-3" style={{ gap: 16 }}>
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12 }}
                            className="glass-panel"
                            style={featureCard}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <span style={{ color: C, fontSize: 10, fontFamily: 'monospace' }}>◈</span>
                                <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{f.title}</span>
                            </div>
                            <p style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f.desc}</p>
                            <div style={{ marginTop: 16, height: 1, background: `linear-gradient(90deg, ${C}40, transparent)` }} />
                            <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 9, color: `${C}60` }}>{f.stat}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── 좌/우 세로 HUD 바 ── */}
            <SideHUD side="left" />
            <SideHUD side="right" />
        </div>
    )
}

/* ─── LOOV 단선 SVG 브랜딩 ──────────────────────────────────────────── */
function LOOVLogo() {
    return (
        <svg
            width="260" height="72"
            viewBox="0 0 260 72"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* L */}
            <motion.path
                d="M12 8 L12 64 L42 64"
                fill="none" stroke={C} strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3, ease: 'easeInOut' }}
            />
            {/* O (첫 번째) */}
            <motion.ellipse
                cx="83" cy="36" rx="28" ry="28"
                fill="none" stroke={C} strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.8, ease: 'easeInOut' }}
            />
            {/* O (두 번째) */}
            <motion.ellipse
                cx="166" cy="36" rx="28" ry="28"
                fill="none" stroke={C} strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 1.2, ease: 'easeInOut' }}
            />
            {/* V */}
            <motion.path
                d="M210 8 L235 64 L260 8"
                fill="none" stroke={C} strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 1.6, ease: 'easeInOut' }}
            />

            {/* 입자 장식점 */}
            {[
                [12, 8], [12, 64], [42, 64],
                [83, 8], [83, 64],
                [166, 8], [166, 64],
                [210, 8], [235, 64], [260, 8],
            ].map(([x, y], i) => (
                <motion.circle
                    key={i} cx={x} cy={y} r={2.5}
                    fill={C}
                    filter="url(#glow)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.5, 1] }}
                    transition={{ delay: 2.0 + i * 0.04, duration: 0.3 }}
                />
            ))}
        </svg>
    )
}

/* ─── HUD 코너 브래킷 ── */
function HUDCorners() {
    const style = { position: 'fixed', zIndex: 8, width: 40, height: 40 }
    const line = { stroke: C, strokeWidth: 1.5, fill: 'none', opacity: 0.5 }
    return (
        <>
            {/* 좌상 */}
            <svg style={{ ...style, top: 60, left: 16 }} viewBox="0 0 40 40">
                <path d="M30 4 L4 4 L4 30" {...line} />
            </svg>
            {/* 우상 */}
            <svg style={{ ...style, top: 60, right: 16 }} viewBox="0 0 40 40">
                <path d="M10 4 L36 4 L36 30" {...line} />
            </svg>
            {/* 좌하 */}
            <svg style={{ ...style, bottom: 16, left: 16 }} viewBox="0 0 40 40">
                <path d="M4 10 L4 36 L30 36" {...line} />
            </svg>
            {/* 우하 */}
            <svg style={{ ...style, bottom: 16, right: 16 }} viewBox="0 0 40 40">
                <path d="M36 10 L36 36 L10 36" {...line} />
            </svg>
        </>
    )
}

/* ─── 상단 상태 바 ── */
function StatusBar() {
    return (
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {[
                { label: 'NEURO', val: 94 },
                { label: 'SYNC', val: 87 },
                { label: 'DATA', val: 100 },
            ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: `${C}70`, fontSize: 9 }}>{label}</span>
                    <div style={{ width: 44, height: 3, background: `${C}20`, borderRadius: 2 }}>
                        <div style={{ width: `${val}%`, height: '100%', background: C, borderRadius: 2 }} />
                    </div>
                    <span style={{ color: `${C}90`, fontSize: 9 }}>{val}%</span>
                </div>
            ))}
        </div>
    )
}

/* ─── 세로 사이드 HUD ── */
function SideHUD({ side }) {
    const isLeft = side === 'left'
    return (
        <div style={{
            position: 'fixed',
            [isLeft ? 'left' : 'right']: 14,
            top: '50%', transform: 'translateY(-50%)',
            zIndex: 8,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6,
        }}>
            {/* 세로 선 */}
            <div style={{ width: 1, height: 60, background: `linear-gradient(180deg, transparent, ${C}60)` }} />
            {[72, 55, 88, 41].map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: isLeft ? 'row' : 'row-reverse', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 1, height: 14, background: `${C}50` }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 8, color: `${C}60`, writingMode: 'vertical-rl' }}>{v}</span>
                </div>
            ))}
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C, boxShadow: `0 0 6px ${C}` }} />
            {[63, 79, 51, 96].map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: isLeft ? 'row' : 'row-reverse', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 1, height: 14, background: `${C}50` }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 8, color: `${C}60`, writingMode: 'vertical-rl' }}>{v}</span>
                </div>
            ))}
            <div style={{ width: 1, height: 60, background: `linear-gradient(180deg, ${C}60, transparent)` }} />
        </div>
    )
}

/* ─── 상수 ── */
const FEATURES = [
    { title: 'NEURAL MARKET', desc: 'AI 기반 LED 조달 시장 실시간 분석 및 낙찰 전략 데이터', stat: 'SYS.STATUS ▸ ONLINE ◈ LATENCY 12ms' },
    { title: 'LED INTEL CORE', desc: '초저전력 고효율 광학 시스템 및 데이터 기반 최적화 솔루션', stat: 'CORE.LOAD ▸ 94% ◈ THREADS 2048' },
    { title: 'SECURE CLOUD', desc: 'Supabase·Notion 멀티 클라우드 암호화 동기화', stat: 'ENCRYPT ▸ AES-256 ◈ NODES 8' },
]
const btnPrimary = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '11px 26px', borderRadius: 4,
    background: `linear-gradient(135deg, ${C} 0%, ${C2} 100%)`,
    color: '#00020e', fontWeight: 700, fontSize: 11,
    textDecoration: 'none', fontFamily: 'monospace',
    letterSpacing: '0.12em',
    boxShadow: `0 0 20px ${C}44, inset 0 1px 0 rgba(255,255,255,0.15)`,
    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
}
const btnSecondary = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '11px 22px', borderRadius: 4,
    border: `1px solid ${C}35`,
    background: `rgba(0,229,255,0.05)`,
    color: `${C}cc`, fontSize: 11,
    textDecoration: 'none', fontFamily: 'monospace',
    letterSpacing: '0.1em',
    backdropFilter: 'blur(8px)',
    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
}
const featureCard = {
    padding: '28px 26px',
    background: 'rgba(0,229,255,0.03)',
    border: '1px solid rgba(0,229,255,0.12)',
    borderRadius: 6,
    clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 16px)',
}
