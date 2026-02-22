import Scene3D from '../components/Scene3D'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Target, ShieldCheck } from 'lucide-react'

/* ── loov.co.kr 시안/테크 블루 브랜드 색상 ── */
const BRAND = '#00e5ff'
const BRAND2 = '#00c8ff'

export default function Home() {
    const { scrollY } = useScroll()
    const opacity = useTransform(scrollY, [0, 400], [1, 0])

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150vh', background: '#000' }}>
            {/* 3D 배경 */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
                <Scene3D />
            </div>

            {/* 히어로 */}
            <section style={{
                position: 'relative', height: '100vh',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                paddingBottom: '14vh',
                zIndex: 1, pointerEvents: 'none'
            }}>
                <motion.div
                    style={{ opacity, textAlign: 'center', padding: '0 24px', pointerEvents: 'auto' }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.0, ease: 'easeOut', delay: 0.4 }}
                >
                    {/* 슬로건 */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        style={{
                            fontFamily: 'Satisfy, cursive',
                            fontSize: 20,
                            color: BRAND,
                            marginBottom: 12,
                            textShadow: `0 0 18px rgba(0,229,255,0.5)`,
                            letterSpacing: 1,
                        }}
                    >
                        Born to be bright
                    </motion.p>

                    {/* 설명 */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0 }}
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 300,
                            fontSize: 15,
                            color: 'rgba(255,255,255,0.6)',
                            maxWidth: 520,
                            margin: '0 auto 32px',
                            lineHeight: 1.8,
                        }}
                    >
                        국내 최고 수준의 LED 조달 시장 분석 및 지능형 플랫폼.<br />
                        데이터가 만드는 새로운 빛의 세계를 경험하세요.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        style={{ display: 'flex', gap: 14, justifyContent: 'center' }}
                    >
                        <Link
                            to="/market"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                padding: '12px 30px', borderRadius: 8,
                                background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND2} 100%)`,
                                color: '#000', fontWeight: 700, fontSize: 14,
                                textDecoration: 'none', fontFamily: 'Outfit, sans-serif',
                                letterSpacing: 0.4,
                                boxShadow: `0 0 22px rgba(0,200,255,0.35)`,
                            }}
                        >
                            Go Dashboard <ArrowRight size={15} />
                        </Link>
                        <Link
                            to="/board"
                            style={{
                                display: 'inline-flex', alignItems: 'center',
                                padding: '12px 28px', borderRadius: 8,
                                border: `1px solid rgba(0,229,255,0.2)`,
                                background: 'rgba(0,229,255,0.04)',
                                color: 'rgba(255,255,255,0.8)', fontWeight: 400, fontSize: 14,
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
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    style={{ marginTop: 40, opacity: 0.3 }}
                >
                    <div style={{
                        width: 20, height: 34, border: `1.5px solid ${BRAND}`,
                        borderRadius: 10, display: 'flex', justifyContent: 'center'
                    }}>
                        <div style={{ width: 3, height: 6, background: BRAND, borderRadius: 2, marginTop: 6 }} />
                    </div>
                </motion.div>
            </section>

            {/* 피처 카드 */}
            <section className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 0 120px' }}>
                <div className="grid grid-cols-3">
                    {[
                        { icon: <Zap color={BRAND} size={22} />, title: 'High Performance', desc: '초저전력, 고효율 광학 시스템 설계 및 데이터 기반 최적화 솔루션', accent: BRAND },
                        { icon: <Target color="#fff" size={22} />, title: 'Market Insight', desc: '전국 조달 시장 실시간 수집 및 AI 기술 기반 낙찰 전략 데이터', accent: '#fff' },
                        { icon: <ShieldCheck color={BRAND2} size={22} />, title: 'Secure', desc: 'Supabase·Notion 멀티 클라우드 동기화를 통한 데이터 보안 확보', accent: BRAND2 },
                    ].map(({ icon, title, desc, accent }, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="glass-panel"
                            style={{ padding: '38px 34px', borderTop: `2px solid ${accent}30` }}
                        >
                            <div style={{
                                width: 46, height: 46, borderRadius: 10,
                                background: 'rgba(255,255,255,0.03)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 18, border: `1px solid ${accent}20`
                            }}>{icon}</div>
                            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: 17, marginBottom: 10, color: '#fff' }}>{title}</h3>
                            <p style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 300, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontSize: 14 }}>{desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}
