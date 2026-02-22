import Scene3D from '../components/Scene3D'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const C = '#00e5ff'
const C2 = '#0090cc'
const C3 = '#003355'

export default function Home() {
    const [time, setTime] = useState('')
    const [scanPct, setScanPct] = useState(0)

    useEffect(() => {
        const iv = setInterval(() => {
            const d = new Date()
            setTime(d.toLocaleTimeString('en-US', { hour12: false }))
            setScanPct(prev => prev >= 100 ? 0 : prev + 0.3)
        }, 50)
        return () => clearInterval(iv)
    }, [])

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150vh', background: '#00020e', overflow: 'hidden' }}>

            {/* 3D 배경 */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
                <Scene3D />
            </div>

            {/* ──────── JARVIS HUD 레이어 ──────── */}

            {/* 코너 브래킷 */}
            <HUDCorners />

            {/* 상단 상태 바 */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
                padding: '8px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: 'monospace', fontSize: 9, color: `${C}88`,
                borderBottom: `1px solid ${C}12`,
                background: 'linear-gradient(180deg, rgba(0,2,14,0.85) 0%, rgba(0,2,14,0.2) 100%)',
                backdropFilter: 'blur(6px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{ width: 5, height: 5, borderRadius: '50%', background: '#22d3a0' }}
                    />
                    <span>◈ LOOV INTELLIGENCE SYSTEM v2.4.1</span>
                </div>
                <StatusBar />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: `${C}60` }}>{time}</span>
                    <span>◈ NEURO-LINK</span>
                    <motion.span
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2.0 }}
                        style={{ color: '#22d3a0' }}
                    >ACTIVE</motion.span>
                </div>
            </div>

            {/* 하단 상태 바 */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
                padding: '6px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: 'monospace', fontSize: 8, color: `${C}55`,
                borderTop: `1px solid ${C}10`,
                background: 'linear-gradient(0deg, rgba(0,2,14,0.85) 0%, transparent 100%)',
                backdropFilter: 'blur(4px)',
            }}>
                <span>◈ SYS.SCAN {scanPct.toFixed(1)}%</span>
                <div style={{ flex: 1, maxWidth: 200, margin: '0 12px', height: 2, background: `${C}15`, borderRadius: 1 }}>
                    <div style={{ width: `${scanPct}%`, height: '100%', background: C, borderRadius: 1, transition: 'width 0.05s linear' }} />
                </div>
                <span>THREADS: 2048 ◈ MEM: 94.2% ◈ LATENCY: 11ms</span>
                <span style={{ marginLeft: 12 }}>◈ ENCRYPTION: AES-256-GCM</span>
            </div>

            {/* 좌측 HUD 패널 */}
            <LeftHUD />

            {/* 우측 HUD 패널 */}
            <RightHUD />

            {/* 좌측 세로 바 */}
            <SideHUD side="left" />
            <SideHUD side="right" />

            {/* ──────── 히어로 ──────── */}
            <section style={{
                position: 'relative', height: '100vh', zIndex: 5,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
            }}>
                {/* 원형 HUD 링 (LOOV 뒤) */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: -1 }}>
                    <HUDCircles />
                </div>

                {/* LOOV */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'relative', marginBottom: 6 }}
                >
                    <h1 style={{
                        fontFamily: 'Outfit, sans-serif', fontWeight: 900,
                        fontSize: 'clamp(64px, 10vw, 120px)',
                        letterSpacing: '-0.03em', lineHeight: 1, margin: 0,
                        background: `linear-gradient(105deg, #fff 0%, ${C} 20%, #fff 40%, ${C} 60%, #fff 80%, ${C} 100%)`,
                        backgroundSize: '300% 100%',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        animation: 'loov-shimmer 4s linear infinite',
                        filter: `drop-shadow(0 0 12px ${C}88) drop-shadow(0 0 40px ${C}44) drop-shadow(0 0 80px ${C}22)`,
                    }}>LOOV</h1>

                    {/* 스파클 */}
                    {SPARKLES.map((sp, i) => (
                        <motion.div key={i} style={{
                            position: 'absolute', left: sp.x, top: sp.y,
                            width: sp.s, height: sp.s, borderRadius: '50%',
                            background: C, boxShadow: `0 0 ${sp.s * 3}px ${C}`,
                            pointerEvents: 'none',
                        }}
                            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                            transition={{ repeat: Infinity, duration: sp.dur, delay: sp.delay, ease: 'easeInOut' }}
                        />
                    ))}
                </motion.div>

                <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    style={{
                        width: '22vw', maxWidth: 260, height: 1.5,
                        background: `linear-gradient(90deg, transparent, ${C}, transparent)`,
                        transformOrigin: 'center', marginBottom: 14,
                        boxShadow: `0 0 10px ${C}44`,
                    }}
                />

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                    style={{ fontFamily: 'Satisfy, cursive', fontSize: 18, color: C, letterSpacing: 1, marginBottom: 6, textShadow: `0 0 16px ${C}66`, opacity: 0.85 }}>
                    Born to be bright
                </motion.p>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
                    style={{ fontFamily: 'monospace', fontSize: 10, color: `${C}70`, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 36 }}>
                    AI-Powered LED Intelligence
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.0 }}
                    style={{ display: 'flex', gap: 12, pointerEvents: 'auto' }}>
                    <Link to="/market" style={btnPrimary}>▷ DASHBOARD</Link>
                    <Link to="/board" style={btnSecondary}>◈ EXPLORE</Link>
                </motion.div>
            </section>

            {/* 피처 카드 */}
            <section className="container" style={{ position: 'relative', zIndex: 5, padding: '60px 0 100px' }}>
                <div className="grid grid-cols-3" style={{ gap: 14 }}>
                    {FEATURES.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                            className="glass-panel" style={featureCard}>
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
        </div>
    )
}

/* ─── 원형 HUD 링 (LOOV 뒤에서 회전) ── */
function HUDCircles() {
    return (
        <div style={{ position: 'relative', width: 400, height: 400 }}>
            {[
                { r: 160, dur: 20, dir: 1, w: 0.8, dash: '4 12', opc: 0.12 },
                { r: 180, dur: 28, dir: -1, w: 0.5, dash: '2 8', opc: 0.08 },
                { r: 200, dur: 35, dir: 1, w: 0.4, dash: '1 16', opc: 0.06 },
            ].map((ring, i) => (
                <motion.svg
                    key={i}
                    width={ring.r * 2 + 20} height={ring.r * 2 + 20}
                    style={{
                        position: 'absolute',
                        top: 200 - ring.r - 10, left: 200 - ring.r - 10,
                    }}
                    animate={{ rotate: ring.dir * 360 }}
                    transition={{ repeat: Infinity, duration: ring.dur, ease: 'linear' }}
                >
                    <circle
                        cx={ring.r + 10} cy={ring.r + 10} r={ring.r}
                        fill="none" stroke={C}
                        strokeWidth={ring.w}
                        strokeDasharray={ring.dash}
                        opacity={ring.opc}
                    />
                    {/* 눈금 마커 */}
                    {[0, 90, 180, 270].map((deg) => (
                        <circle
                            key={deg}
                            cx={ring.r + 10 + Math.cos(deg * Math.PI / 180) * ring.r}
                            cy={ring.r + 10 + Math.sin(deg * Math.PI / 180) * ring.r}
                            r={2} fill={C} opacity={ring.opc * 2.5}
                        />
                    ))}
                </motion.svg>
            ))}
        </div>
    )
}

/* ─── 좌측 HUD 데이터 패널 ── */
function LeftHUD() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            style={{
                position: 'fixed', left: 40, top: '28%', zIndex: 8,
                fontFamily: 'monospace', fontSize: 8, color: `${C}60`,
                width: 130,
            }}
        >
            <div style={{ borderLeft: `1px solid ${C}25`, paddingLeft: 10 }}>
                <div style={{ color: `${C}90`, fontSize: 9, marginBottom: 8, letterSpacing: '0.15em' }}>◈ NEURAL STATUS</div>
                {[
                    { label: 'CORTEX', val: 94, color: '#22d3a0' },
                    { label: 'SYNAPSE', val: 87, color: C },
                    { label: 'AXON NET', val: 78, color: '#a855f7' },
                    { label: 'DENDRITE', val: 91, color: '#facc15' },
                ].map(({ label, val, color }) => (
                    <div key={label} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span>{label}</span>
                            <span style={{ color }}>{val}%</span>
                        </div>
                        <div style={{ height: 2, background: `${C}12`, borderRadius: 1 }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ delay: 2.8, duration: 1.2 }}
                                style={{ height: '100%', background: color, borderRadius: 1 }}
                            />
                        </div>
                    </div>
                ))}
                <div style={{ marginTop: 10, borderTop: `1px solid ${C}15`, paddingTop: 6 }}>
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{ fontSize: 7, color: `${C}50` }}
                    >
                        ▸ PROCESSING NEURAL DATA...
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

/* ─── 우측 HUD 데이터 패널 ── */
function RightHUD() {
    const [logs, setLogs] = useState([])
    useEffect(() => {
        const entries = [
            '◈ Neural link established',
            '◈ Synapse calibration OK',
            '◈ Market data stream ON',
            '◈ LED analytics loaded',
            '◈ AI core warming up...',
            '◈ Prediction model ready',
            '◈ Bid analysis active',
            '◈ Supply chain mapped',
        ]
        let i = 0
        const iv = setInterval(() => {
            if (i < entries.length) {
                setLogs(prev => [...prev, entries[i]])
                i++
            }
        }, 800)
        return () => clearInterval(iv)
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            style={{
                position: 'fixed', right: 40, top: '28%', zIndex: 8,
                fontFamily: 'monospace', fontSize: 8, color: `${C}50`,
                width: 160, maxHeight: 220, overflow: 'hidden',
            }}
        >
            <div style={{ borderRight: `1px solid ${C}25`, paddingRight: 10, textAlign: 'right' }}>
                <div style={{ color: `${C}90`, fontSize: 9, marginBottom: 8, letterSpacing: '0.15em' }}>SYSTEM LOG ◈</div>
                {logs.map((log, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ marginBottom: 4, color: i === logs.length - 1 ? `${C}aa` : `${C}40` }}
                    >
                        {log}
                    </motion.div>
                ))}
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    style={{ color: C }}
                >▮</motion.span>
            </div>
        </motion.div>
    )
}

/* ─── 스파클 ── */
const SPARKLES = Array.from({ length: 14 }, () => ({
    x: `${15 + Math.random() * 70}%`, y: `${10 + Math.random() * 80}%`,
    s: 2 + Math.random() * 3, dur: 1.5 + Math.random() * 2, delay: Math.random() * 3,
}))

/* ─── HUD 코너 ── */
function HUDCorners() {
    const s = { position: 'fixed', zIndex: 8, width: 44, height: 44 }
    const l = { stroke: C, strokeWidth: 1.5, fill: 'none', opacity: 0.35 }
    return (
        <>
            <svg style={{ ...s, top: 50, left: 12 }} viewBox="0 0 44 44">
                <path d="M34 4 L4 4 L4 34" {...l} />
                <circle cx="4" cy="4" r="2" fill={C} opacity="0.4" />
            </svg>
            <svg style={{ ...s, top: 50, right: 12 }} viewBox="0 0 44 44">
                <path d="M10 4 L40 4 L40 34" {...l} />
                <circle cx="40" cy="4" r="2" fill={C} opacity="0.4" />
            </svg>
            <svg style={{ ...s, bottom: 30, left: 12 }} viewBox="0 0 44 44">
                <path d="M4 10 L4 40 L34 40" {...l} />
                <circle cx="4" cy="40" r="2" fill={C} opacity="0.4" />
            </svg>
            <svg style={{ ...s, bottom: 30, right: 12 }} viewBox="0 0 44 44">
                <path d="M40 10 L40 40 L10 40" {...l} />
                <circle cx="40" cy="40" r="2" fill={C} opacity="0.4" />
            </svg>
        </>
    )
}

function StatusBar() {
    return (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {[{ l: 'NEURO', v: 94 }, { l: 'SYNC', v: 87 }, { l: 'DATA', v: 100 }, { l: 'GPU', v: 72 }].map(({ l, v }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: `${C}55`, fontSize: 8 }}>{l}</span>
                    <div style={{ width: 32, height: 2, background: `${C}15`, borderRadius: 1 }}>
                        <div style={{ width: `${v}%`, height: '100%', background: v === 100 ? '#22d3a0' : C, borderRadius: 1 }} />
                    </div>
                    <span style={{ color: v === 100 ? '#22d3a088' : `${C}70`, fontSize: 8 }}>{v}%</span>
                </div>
            ))}
        </div>
    )
}

function SideHUD({ side }) {
    const isL = side === 'left'
    return (
        <div style={{
            position: 'fixed', [isL ? 'left' : 'right']: 10,
            top: '50%', transform: 'translateY(-50%)', zIndex: 8,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
            <div style={{ width: 1, height: 40, background: `linear-gradient(180deg, transparent, ${C}40)` }} />
            {[72, 55, 88, 41, 93, 67].map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: isL ? 'row' : 'row-reverse', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 1, height: 10, background: `${C}35` }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 6, color: `${C}45`, writingMode: 'vertical-rl' }}>{v}</span>
                </div>
            ))}
            <motion.div
                animate={{ boxShadow: [`0 0 4px ${C}`, `0 0 10px ${C}`, `0 0 4px ${C}`] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: 4, height: 4, borderRadius: '50%', background: C }}
            />
            {[63, 79, 51, 96, 84, 38].map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: isL ? 'row' : 'row-reverse', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 1, height: 10, background: `${C}35` }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 6, color: `${C}45`, writingMode: 'vertical-rl' }}>{v}</span>
                </div>
            ))}
            <div style={{ width: 1, height: 40, background: `linear-gradient(180deg, ${C}40, transparent)` }} />
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
    border: `1px solid ${C}30`, background: `rgba(0,229,255,0.04)`,
    color: `${C}bb`, fontSize: 10,
    textDecoration: 'none', fontFamily: 'monospace',
    letterSpacing: '0.1em', backdropFilter: 'blur(6px)',
    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
}
const featureCard = {
    padding: '24px 22px',
    background: 'rgba(0,229,255,0.025)', border: '1px solid rgba(0,229,255,0.10)',
    borderRadius: 4,
    clipPath: 'polygon(14px 0%, 100% 0%, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0% 100%, 0% 14px)',
}
