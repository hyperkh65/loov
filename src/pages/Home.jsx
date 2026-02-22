import Scene3D from '../components/Scene3D'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Target, ShieldCheck } from 'lucide-react'

export default function Home() {
    const { scrollY } = useScroll()
    const opacity = useTransform(scrollY, [0, 400], [1, 0])
    const scale = useTransform(scrollY, [0, 400], [1, 0.95])

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150vh', background: '#000' }}>
            {/* 3D 배경 고정 */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
                <Scene3D />
            </div>

            {/* 히어로 */}
            <section style={{
                position: 'relative', height: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1, pointerEvents: 'none'
            }}>
                <motion.div
                    style={{ opacity, scale, textAlign: 'center', padding: '0 24px', pointerEvents: 'auto' }}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                >
                    {/* 슬로건 — 골드 */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        style={{
                            fontFamily: "'Satisfy', cursive",
                            fontSize: 28,
                            color: '#f0c060',
                            marginBottom: 16,
                            textShadow: '0 0 24px rgba(240,192,96,0.55)',
                            letterSpacing: 1,
                        }}
                    >
                        Born to be bright
                    </motion.p>

                    {/* 메인 헤드라인 — Outfit 통일 */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.9 }}
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(52px, 8.5vw, 110px)',
                            letterSpacing: '-0.04em',
                            lineHeight: 0.92,
                            marginBottom: 28,
                            color: '#ffffff',
                            textShadow: '0 4px 32px rgba(0,0,0,0.9)',
                        }}
                    >
                        LOOV<br />
                        <span style={{
                            color: '#f5a623',
                            textShadow: '0 0 50px rgba(245,166,35,0.45), 0 4px 24px rgba(0,0,0,0.9)',
                        }}>
                            BEYOND LIMITS.
                        </span>
                    </motion.h1>

                    {/* 설명 — Outfit */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0, duration: 0.8 }}
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 300,
                            fontSize: 18,
                            color: 'rgba(255,255,255,0.7)',
                            maxWidth: 680,
                            margin: '0 auto 44px',
                            lineHeight: 1.75,
                            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
                        }}
                    >
                        국내 최고 수준의 LED 조달 시장 분석 및 지능형 플랫폼.<br />
                        LOOV Intelligence: 데이터가 만드는 새로운 빛의 세계를 경험하세요.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.7 }}
                        style={{ display: 'flex', gap: 16, justifyContent: 'center' }}
                    >
                        <Link
                            to="/market"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '15px 38px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #e8960a 0%, #f5c842 100%)',
                                color: '#0a0500', fontWeight: 700, fontSize: 15,
                                textDecoration: 'none', fontFamily: 'Outfit, sans-serif',
                                letterSpacing: 0.3,
                                boxShadow: '0 0 28px rgba(245,166,35,0.35)',
                            }}
                        >
                            Go Dashboard <ArrowRight size={17} />
                        </Link>
                        <Link
                            to="/board"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '15px 34px', borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.18)',
                                background: 'rgba(255,255,255,0.04)',
                                color: '#fff', fontWeight: 500, fontSize: 15,
                                textDecoration: 'none', fontFamily: 'Outfit, sans-serif',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            Explore Insights
                        </Link>
                    </motion.div>
                </motion.div>

                {/* 스크롤 힌트 */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    style={{ position: 'absolute', bottom: 36, left: 'calc(50% - 12px)', opacity: 0.35 }}
                >
                    <div style={{
                        width: 22, height: 38, border: '1.5px solid rgba(240,192,96,0.5)',
                        borderRadius: 11, display: 'flex', justifyContent: 'center'
                    }}>
                        <div style={{ width: 3, height: 7, background: '#f0c060', borderRadius: 2, marginTop: 7 }} />
                    </div>
                </motion.div>
            </section>

            {/* 피처 카드 섹션 */}
            <section className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 0 120px' }}>
                <div className="grid grid-cols-3">
                    {[
                        { icon: <Zap color="#f5a623" size={24} />, title: 'High Performance', desc: '초저전력, 고효율 광학 시스템 설계 및 데이터 기반 최적화 솔루션.', accent: '#f5a623' },
                        { icon: <Target color="#fff" size={24} />, title: 'Market Insight', desc: '전국 조달 시장 실시간 수집 및 AI 기술 기반 낙찰 전략 데이터.', accent: '#ffffff' },
                        { icon: <ShieldCheck color="#f0c060" size={24} />, title: 'Secure Infrastructure', desc: 'Supabase·Notion 멀티 클라우드 동기화를 통한 데이터 보안 확보.', accent: '#f0c060' },
                    ].map(({ icon, title, desc, accent }, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.18 }}
                            className="glass-panel"
                            style={{ padding: '44px 40px', borderTop: `2px solid ${accent}35` }}
                        >
                            <div style={{
                                width: 50, height: 50, borderRadius: 12,
                                background: 'rgba(255,255,255,0.04)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 22, border: `1px solid ${accent}25`
                            }}>
                                {icon}
                            </div>
                            <h3 style={{
                                fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                                fontSize: 20, marginBottom: 12, color: '#fff'
                            }}>{title}</h3>
                            <p style={{
                                fontFamily: 'Outfit, sans-serif', fontWeight: 300,
                                color: 'rgba(255,255,255,0.58)', lineHeight: 1.72, fontSize: 15
                            }}>{desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}
