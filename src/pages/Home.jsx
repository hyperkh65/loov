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
                        <span className="pill" style={{
                            background: 'rgba(0, 242, 255, 0.1)', color: '#00f2ff',
                            border: '1px solid rgba(0, 242, 255, 0.2)', padding: '8px 20px',
                            fontSize: '13px', fontWeight: 700, letterSpacing: '2px'
                        }}>
                            NEXT-GEN LED ECOSYSTEM
                        </span>
                    </motion.div>

                    <h1 className="shimmer" style={{
                        fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 900, fontFamily: 'Outfit',
                        letterSpacing: '-0.04em', lineHeight: 0.9, marginBottom: 32
                    }}>
                        FUTURE<br />
                        <span style={{ color: '#fff', opacity: 0.9 }}>BEYOND LIGHT.</span>
                    </h1>

                    <p style={{
                        color: 'rgba(255,255,255,0.6)', fontSize: '20px', maxWidth: '700px',
                        margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 400
                    }}>
                        LOOV Intelligence Platform: 광학 기술과 데이터 분석의 결합.<br />
                        국내 최고 수준의 LED 조달 시장 분석 및 기술 솔루션을 경험하세요.
                    </p>

                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                        <Link to="/market" className="btn-primary flex items-center gap-2" style={{ padding: '18px 40px', fontSize: '16px' }}>
                            Dashboard Launcher <ArrowRight size={18} />
                        </Link>
                        <Link to="/board" className="btn-ghost" style={{ padding: '18px 40px', fontSize: '16px' }}>
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
                        desc="초저전력, 고효율 광학 시스템 설계 및 최적화 솔루션 제공."
                        index={0}
                    />
                    <FeatureCard
                        icon={<Target color="#7000ff" />}
                        title="Market Insight"
                        desc="국가 조달 시장 실시간 분석 및 수주 전략 데이터 지원."
                        index={1}
                    />
                    <FeatureCard
                        icon={<ShieldCheck color="#22c55e" />}
                        title="Secure Sync"
                        desc="Supabase와 Notion의 완벽한 데이터 동기화 시스템 구축."
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
            style={{ padding: '40px' }}
        >
            <div style={{
                width: 50, height: 50, borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
        </motion.div>
    )
}
