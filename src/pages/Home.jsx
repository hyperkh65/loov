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
            {/* 3D 배경 */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
                <Scene3D />
            </div>

            {/* 히어로 섹션 */}
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
                    {/* 슬로건 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ marginBottom: 20 }}
                    >
                        <span className="script-font" style={{
                            fontSize: '30px',
                            color: '#f0c060',
                            opacity: 0.9,
                            textShadow: '0 0 20px rgba(240,192,96,0.6)'
                        }}>
                            Born to be bright
                        </span>
                    </motion.div>

                    {/* 메인 타이틀 */}
                    <h1 style={{
                        fontSize: 'clamp(56px, 9vw, 120px)',
                        fontWeight: 900,
                        fontFamily: 'Outfit',
                        letterSpacing: '-0.04em',
                        lineHeight: 0.9,
                        marginBottom: 32,
                        color: '#ffffff',
                        textShadow: '0 0 60px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.8)',
                    }}>
                        LOOV<br />
                        <span style={{
                            color: '#f5a623',
                            textShadow: '0 0 40px rgba(245,166,35,0.5)',
                        }}>BEYOND LIMITS.</span>
                    </h1>

                    {/* 설명 */}
                    <p style={{
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: '19px',
                        maxWidth: '680px',
                        margin: '0 auto 48px',
                        lineHeight: 1.7,
                        fontWeight: 400,
                        textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                    }}>
                        국내 최고 수준의 LED 조달 시장 분석 및 지능형 플랫폼.<br />
                        LOOV Intelligence: 데이터가 만드는 새로운 빛의 세계를 경험하세요.
                    </p>

                    {/* CTA 버튼 */}
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                        <Link
                            to="/market"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '16px 40px', borderRadius: 12,
                                background: 'linear-gradient(135deg, #f5a623 0%, #f0c050 100%)',
                                color: '#000', fontWeight: 700, fontSize: 16,
                                textDecoration: 'none', fontFamily: 'Outfit',
                                boxShadow: '0 0 30px rgba(245,166,35,0.4)',
                                transition: 'all 0.3s'
                            }}
                        >
                            Go Dashboard <ArrowRight size={18} />
                        </Link>
                        <Link
                            to="/board"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '16px 36px', borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff', fontWeight: 600, fontSize: 16,
                                textDecoration: 'none',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            Explore Insights
                        </Link>
                    </div>
                </motion.div>

                {/* 스크롤 인디케이터 */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ position: 'absolute', bottom: 40, left: 'calc(50% - 12px)', opacity: 0.4 }}
                >
                    <div style={{
                        width: 24, height: 40, border: '2px solid rgba(240,192,96,0.6)',
                        borderRadius: 12, display: 'flex', justifyContent: 'center'
                    }}>
                        <div style={{
                            width: 4, height: 8, background: '#f0c060',
                            borderRadius: 2, marginTop: 8
                        }} />
                    </div>
                </motion.div>
            </section>

            {/* 피처 카드 섹션 */}
            <section className="container" style={{ position: 'relative', zIndex: 1, padding: '100px 0' }}>
                <div className="grid grid-cols-3">
                    <FeatureCard
                        icon={<Zap color="#f5a623" />}
                        title="High Performance"
                        desc="초저전력, 고효율 광학 시스템 설계 및 데이터 기반 최적화 솔루션."
                        index={0}
                        accent="#f5a623"
                    />
                    <FeatureCard
                        icon={<Target color="#ffffff" />}
                        title="Market Insight"
                        desc="전국 조달 시장 실시간 수집 및 AI 기술 기반 낙찰 전략 데이터."
                        index={1}
                        accent="#ffffff"
                    />
                    <FeatureCard
                        icon={<ShieldCheck color="#f0c060" />}
                        title="Secure Infrastructure"
                        desc="Supabase·Notion 멀티 클라우드 동기화를 통한 데이터 보안 확보."
                        index={2}
                        accent="#f0c060"
                    />
                </div>
            </section>
        </div>
    )
}

function FeatureCard({ icon, title, desc, index, accent }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="glass-panel"
            style={{ padding: '48px', borderTop: `3px solid ${accent}40` }}
        >
            <div style={{
                width: 54, height: 54, borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24, border: `1px solid ${accent}30`
            }}>
                {icon}
            </div>
            <h3 style={{
                fontSize: 22, fontWeight: 700, marginBottom: 14,
                color: '#fff', fontFamily: 'Outfit'
            }}>{title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{desc}</p>
        </motion.div>
    )
}
