import Scene3D from '../components/Scene3D'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Target, ShieldCheck } from 'lucide-react'

export default function Home() {
    const { scrollY } = useScroll()
    const opacity = useTransform(scrollY, [0, 400], [1, 0])
    const scale = useTransform(scrollY, [0, 400], [1, 0.9])

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150vh', background: '#000' }}>
            {/* 3D Background - Fixed position */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}>
                <Scene3D />
            </div>

            {/* Hero Section */}
            <section style={{
                position: 'relative', height: '100vh', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 1, pointerEvents: 'none'
            }}>
                <motion.div
                    style={{ opacity, scale, textAlign: 'center', padding: '0 24px', pointerEvents: 'auto' }}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ marginBottom: 24 }}
                    >
                        <span className="script-font" style={{ fontSize: '28px', color: '#00f2ff', opacity: 0.8 }}>Born to be bright</span>
                    </motion.div>

                    <h1 className="shimmer" style={{
                        fontSize: 'clamp(48px, 8vw, 110px)', fontWeight: 900, fontFamily: 'Outfit',
                        letterSpacing: '-0.04em', lineHeight: 0.9, marginBottom: 32
                    }}>
                        LOOV<br />
                        <span style={{ color: '#fff', opacity: 0.9 }}>BEYOND LIMITS.</span>
                    </h1>

                    <p style={{
                        color: 'rgba(255,255,255,0.6)', fontSize: '20px', maxWidth: '700px',
                        margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 400
                    }}>
                        국내 최고 수준의 LED 조달 시장 분석 및 지능형 플랫폼.<br />
                        LOOV Intelligence: 데이터가 만드는 새로운 빛의 세계를 경험하세요.
                    </p>

                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                        <Link to="/market" className="btn-primary flex items-center gap-2" style={{ padding: '16px 36px', fontSize: '16px' }}>
                            Go Dashboard <ArrowRight size={18} />
                        </Link>
                        <Link to="/board" className="btn-ghost" style={{ padding: '16px 36px', fontSize: '16px' }}>
                            Explore Insights
                        </Link>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ position: 'absolute', bottom: 40, opacity: 0.5, left: 'calc(50% - 12px)' }}
                >
                    <div style={{ width: '24px', height: '40px', border: '2px solid #fff', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '4px', height: '8px', background: '#fff', borderRadius: '2px', marginTop: '8px' }} />
                    </div>
                </motion.div>
            </section>

            {/* Features Staggered Section */}
            <section className="container" style={{ position: 'relative', zIndex: 1, padding: '100px 0' }}>
                <div className="grid grid-cols-3">
                    <FeatureCard
                        icon={<Zap color="#00f2ff" />}
                        title="High Performance"
                        desc="초저전력, 고효율 광학 시스템 설계 및 데이터 기반 최적화 솔루션."
                        index={0}
                    />
                    <FeatureCard
                        icon={<Target color="#a4c639" />}
                        title="Market Insight"
                        desc="전국 조달 시장 실시간 수집 및 AI 기술 기반 낙찰 전략 데이터."
                        index={1}
                    />
                    <FeatureCard
                        icon={<ShieldCheck color="#ffffff" />}
                        title="Secure Infrastructure"
                        desc="Supabase - Notion 멀티 클라우드 동기화를 통한 데이터 보안 확보."
                        index={2}
                    />
                </div>
            </section>
        </div>
    )
}

function FeatureCard({ icon, title, desc, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="glass-panel"
            style={{ padding: '48px' }}
        >
            <div style={{
                width: 54, height: 54, borderRadius: '14px', background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
        </motion.div>
    )
}
