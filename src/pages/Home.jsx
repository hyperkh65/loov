import Scene3D from '../components/Scene3D'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const CYAN = '#00e5ff'
const CYAN2 = '#00c8ff'

export default function Home() {
    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150vh', background: '#000' }}>

            {/* ── 3D 배경 (고정) ── */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
                <Scene3D />
            </div>

            {/* ── 히어로 섹션 ── */}
            <section style={{
                position: 'relative', height: '100vh', zIndex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
            }}>
                {/* 슬로건 */}
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{
                        fontFamily: 'Satisfy, cursive',
                        fontSize: 22,
                        color: CYAN,
                        letterSpacing: 1,
                        marginBottom: 16,
                        textShadow: `0 0 20px rgba(0,229,255,0.5)`,
                    }}
                >
                    Born to be bright
                </motion.p>

                {/* LOOV — 핵심 텍스트 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'relative', marginBottom: 12 }}
                >
                    <h1 style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 900,
                        fontSize: 'clamp(80px, 14vw, 160px)',
                        letterSpacing: '-0.06em',
                        lineHeight: 1,
                        margin: 0,
                        /* 시안 → 화이트 그라디언트 */
                        background: `linear-gradient(170deg, #ffffff 0%, ${CYAN} 60%, ${CYAN2} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        /* 빛 글로우 효과 */
                        filter: `drop-shadow(0 0 28px rgba(0,229,255,0.4)) drop-shadow(0 0 60px rgba(0,180,255,0.2))`,
                    }}>
                        LOOV
                    </h1>

                    {/* 텍스트 아래 선 */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1.0, duration: 0.8 }}
                        style={{
                            height: 2,
                            background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
                            transformOrigin: 'center',
                            marginTop: 4,
                        }}
                    />
                </motion.div>

                {/* 서브타이틀 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 300,
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        marginBottom: 44,
                    }}
                >
                    LED Intelligence Platform
                </motion.p>

                {/* CTA 버튼 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    style={{ display: 'flex', gap: 12, pointerEvents: 'auto' }}
                >
                    <Link
                        to="/market"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '13px 32px', borderRadius: 8,
                            background: `linear-gradient(135deg, ${CYAN} 0%, ${CYAN2} 100%)`,
                            color: '#000', fontWeight: 700, fontSize: 14,
                            textDecoration: 'none', fontFamily: 'Outfit, sans-serif',
                            letterSpacing: 0.3,
                            boxShadow: `0 0 24px rgba(0,200,255,0.4)`,
                        }}
                    >
                        Go Dashboard <ArrowRight size={15} />
                    </Link>
                    <Link
                        to="/board"
                        style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '13px 28px', borderRadius: 8,
                            border: `1px solid rgba(0,229,255,0.25)`,
                            background: 'rgba(0,229,255,0.05)',
                            color: 'rgba(255,255,255,0.75)', fontSize: 14,
                            textDecoration: 'none', fontFamily: 'Outfit, sans-serif',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        Explore
                    </Link>
                </motion.div>

                {/* 스크롤 힌트 */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    style={{ position: 'absolute', bottom: 36, opacity: 0.3 }}
                >
                    <div style={{
                        width: 20, height: 34, border: `1.5px solid ${CYAN}`,
                        borderRadius: 10, display: 'flex', justifyContent: 'center'
                    }}>
                        <div style={{ width: 3, height: 6, background: CYAN, borderRadius: 2, marginTop: 7 }} />
                    </div>
                </motion.div>
            </section>

            {/* ── 피처 카드 ── */}
            <section className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 0 120px' }}>
                <div className="grid grid-cols-3">
                    {[
                        { title: 'High Performance', desc: '초저전력 고효율 광학 시스템 설계 및 데이터 기반 최적화' },
                        { title: 'Market Insight', desc: '전국 조달 시장 실시간 수집 및 AI 기반 낙찰 전략 데이터' },
                        { title: 'Secure Cloud', desc: 'Supabase·Notion 멀티 클라우드 동기화 및 데이터 보안' },
                    ].map(({ title, desc }, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="glass-panel"
                            style={{ padding: '36px 32px', borderTop: `1px solid rgba(0,229,255,0.2)` }}
                        >
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: CYAN, marginBottom: 20,
                                boxShadow: `0 0 10px ${CYAN}`,
                            }} />
                            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: 17, marginBottom: 10, color: '#fff' }}>{title}</h3>
                            <p style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 300, color: 'rgba(255,255,255,0.48)', lineHeight: 1.7, fontSize: 14 }}>{desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}
