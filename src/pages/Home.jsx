import Scene3D from '../components/Scene3D'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const C = '#00e5ff'
const C2 = '#0090cc'

export default function Home() {
    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150vh', background: '#00020e' }}>

            {/* 3D 배경 */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
                <Scene3D />
            </div>

            <HUDCorners />

            {/* 상단 바 */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
                padding: '10px 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: 'monospace', fontSize: 9, color: `${C}88`,
                borderBottom: `1px solid ${C}15`,
                background: 'linear-gradient(180deg, rgba(0,2,14,0.8) 0%, transparent 100%)',
                backdropFilter: 'blur(4px)',
            }}>
                <span>◈ LOOV INTEL SYS v2.4</span>
                <StatusBar />
                <span>◈ NEURO-LINK ACTIVE</span>
            </div>

            {/* 히어로 — LOOV가 세상의 중심 */}
            <section style={{
                position: 'relative', height: '100vh', zIndex: 5,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
            }}>
                {/* ★ LOOV 메인 타이틀 — 굵고 반짝반짝 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'relative', marginBottom: 6 }}
                >
                    <h1
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(64px, 10vw, 120px)',
                            letterSpacing: '-0.03em',
                            lineHeight: 1,
                            margin: 0,
                            /* 쉬머 그라디언트 */
                            background: `linear-gradient(
                                105deg,
                                #ffffff 0%,
                                ${C} 20%,
                                #ffffff 40%,
                                ${C} 60%,
                                #ffffff 80%,
                                ${C} 100%
                            )`,
                            backgroundSize: '300% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            animation: 'loov-shimmer 4s linear infinite',
                            /* 펄스 글로우 */
                            filter: `drop-shadow(0 0 12px ${C}88) drop-shadow(0 0 40px ${C}44) drop-shadow(0 0 80px ${C}22)`,
                        }}
                    >
                        LOOV
                    </h1>

                    {/* 스파클 파티클 장식 */}
                    {SPARKLES.map((sp, i) => (
                        <motion.div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: sp.x, top: sp.y,
                                width: sp.s, height: sp.s,
                                borderRadius: '50%',
                                background: C,
                                boxShadow: `0 0 ${sp.s * 3}px ${C}`,
                                pointerEvents: 'none',
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: sp.dur,
                                delay: sp.delay,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </motion.div>

                {/* 밑줄 라인 */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    style={{
                        width: '22vw', maxWidth: 260, height: 1.5,
                        background: `linear-gradient(90deg, transparent, ${C}, transparent)`,
                        transformOrigin: 'center', marginBottom: 14,
                        boxShadow: `0 0 10px ${C}44`,
                    }}
                />

                {/* 슬로건 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    style={{
                        fontFamily: 'Satisfy, cursive', fontSize: 18,
                        color: C, letterSpacing: 1, marginBottom: 6,
                        textShadow: `0 0 16px ${C}66`, opacity: 0.85,
                    }}
                >
                    Born to be bright
                </motion.p>

                {/* 서브 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    style={{
                        fontFamily: 'monospace', fontWeight: 400, fontSize: 10,
                        color: `${C}70`, letterSpacing: '0.4em',
                        textTransform: 'uppercase', marginBottom: 36,
                    }}
                >
                    AI-Powered LED Intelligence
                </motion.p>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.0 }}
                    style={{ display: 'flex', gap: 12, pointerEvents: 'auto' }}
                >
                    <Link to="/market" style={btnPrimary}>▷ DASHBOARD</Link>
                    <Link to="/board" style={btnSecondary}>◈ EXPLORE</Link>
                </motion.div>
            </section>

            {/* 피처 카드 */}
            <section className="container" style={{ position: 'relative', zIndex: 5, padding: '60px 0 100px' }}>
                <div className="grid grid-cols-3" style={{ gap: 14 }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                                <span style={{ color: C, fontSize: 9, fontFamily: 'monospace' }}>◈</span>
                                <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: '0.12em' }}>{f.title}</span>
                            </div>
                            <p style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{f.desc}</p>
                            <div style={{ marginTop: 14, height: 1, background: `linear-gradient(90deg, ${C}30, transparent)` }} />
                            <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 8, color: `${C}50` }}>{f.stat}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <SideHUD side="left" />
            <SideHUD side="right" />
        </div>
    )
}

/* ─── 스파클 위치 ── */
const SPARKLES = Array.from({ length: 12 }, (_, i) => ({
    x: `${15 + Math.random() * 70}%`,
    y: `${10 + Math.random() * 80}%`,
    s: 2 + Math.random() * 3,
    dur: 1.5 + Math.random() * 2,
    delay: Math.random() * 3,
}))

/* ─── HUD ── */
function HUDCorners() {
    const s = { position: 'fixed', zIndex: 8, width: 36, height: 36 }
    const l = { stroke: C, strokeWidth: 1.5, fill: 'none', opacity: 0.4 }
    return (
        <>
            <svg style={{ ...s, top: 56, left: 14 }} viewBox="0 0 40 40"><path d="M30 4 L4 4 L4 30" {...l} /></svg>
            <svg style={{ ...s, top: 56, right: 14 }} viewBox="0 0 40 40"><path d="M10 4 L36 4 L36 30" {...l} /></svg>
            <svg style={{ ...s, bottom: 14, left: 14 }} viewBox="0 0 40 40"><path d="M4 10 L4 36 L30 36" {...l} /></svg>
            <svg style={{ ...s, bottom: 14, right: 14 }} viewBox="0 0 40 40"><path d="M36 10 L36 36 L10 36" {...l} /></svg>
        </>
    )
}

function StatusBar() {
    return (
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            {[{ l: 'NEURO', v: 94 }, { l: 'SYNC', v: 87 }, { l: 'DATA', v: 100 }].map(({ l, v }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: `${C}60`, fontSize: 8 }}>{l}</span>
                    <div style={{ width: 36, height: 2, background: `${C}18`, borderRadius: 1 }}>
                        <div style={{ width: `${v}%`, height: '100%', background: C, borderRadius: 1 }} />
                    </div>
                    <span style={{ color: `${C}80`, fontSize: 8 }}>{v}%</span>
                </div>
            ))}
        </div>
    )
}

function SideHUD({ side }) {
    const isL = side === 'left'
    return (
        <div style={{
            position: 'fixed', [isL ? 'left' : 'right']: 12,
            top: '50%', transform: 'translateY(-50%)',
            zIndex: 8, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 5,
        }}>
            <div style={{ width: 1, height: 50, background: `linear-gradient(180deg, transparent, ${C}50)` }} />
            {[72, 55, 88, 41].map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: isL ? 'row' : 'row-reverse', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 1, height: 12, background: `${C}40` }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 7, color: `${C}50`, writingMode: 'vertical-rl' }}>{v}</span>
                </div>
            ))}
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: C, boxShadow: `0 0 5px ${C}` }} />
            {[63, 79, 51, 96].map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: isL ? 'row' : 'row-reverse', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 1, height: 12, background: `${C}40` }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 7, color: `${C}50`, writingMode: 'vertical-rl' }}>{v}</span>
                </div>
            ))}
            <div style={{ width: 1, height: 50, background: `linear-gradient(180deg, ${C}50, transparent)` }} />
        </div>
    )
}

const FEATURES = [
    { title: 'NEURAL MARKET', desc: 'AI 기반 LED 조달 시장 실시간 분석 및 낙찰 전략', stat: 'STATUS ▸ ONLINE ◈ 12ms' },
    { title: 'LED INTEL CORE', desc: '초저전력 고효율 광학 데이터 기반 최적화 솔루션', stat: 'LOAD ▸ 94% ◈ TH 2048' },
    { title: 'SECURE CLOUD', desc: 'Supabase·Notion 멀티 클라우드 암호화 동기화', stat: 'AES-256 ◈ NODES 8' },
]

const btnPrimary = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '10px 24px', borderRadius: 3,
    background: `linear-gradient(135deg, ${C}, ${C2})`,
    color: '#00020e', fontWeight: 700, fontSize: 10,
    textDecoration: 'none', fontFamily: 'monospace',
    letterSpacing: '0.14em',
    boxShadow: `0 0 18px ${C}44`,
    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
}

const btnSecondary = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '10px 20px', borderRadius: 3,
    border: `1px solid ${C}30`,
    background: `rgba(0,229,255,0.04)`,
    color: `${C}bb`, fontSize: 10,
    textDecoration: 'none', fontFamily: 'monospace',
    letterSpacing: '0.1em', backdropFilter: 'blur(6px)',
    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
}

const featureCard = {
    padding: '24px 22px',
    background: 'rgba(0,229,255,0.025)',
    border: '1px solid rgba(0,229,255,0.10)',
    borderRadius: 4,
    clipPath: 'polygon(14px 0%, 100% 0%, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0% 100%, 0% 14px)',
}
