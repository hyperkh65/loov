import Scene3D from '../components/Scene3D'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb, TrendingUp, Cpu } from 'lucide-react'

export default function Home() {
    const { scrollY } = useScroll()
    const opacity = useTransform(scrollY, [0, 400], [1, 0])
    const scale = useTransform(scrollY, [0, 400], [1, 0.9])

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150vh', background: 'var(--bg)' }}>
            {/* 3D Background - Living Lights */}
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
                        <span className="script-font" style={{ fontSize: '32px', color: '#a4c639' }}>Born to be bright</span>
                    </motion.div>

                    <h1 style={{
                        fontSize: 'clamp(48px, 8vw, 120px)', fontWeight: 800, fontFamily: 'Outfit',
                        letterSpacing: '-0.06em', lineHeight: 0.85, marginBottom: 32, color: 'var(--text-main)'
                    }}>
                        LOOV<br />
                        <span style={{ color: '#a4c639' }}>SYSTEMS.</span>
                    </h1>

                    <p style={{
                        color: 'var(--text-muted)', fontSize: '20px', maxWidth: '700px',
                        margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 500
                    }}>
                        공간의 가치를 완성하는 지능형 LED 시스템.<br />
                        LOOV는 단순한 조명을 넘어 공간의 생명력을 불어넣는 기술을 연구합니다.
                    </p>

                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                        <Link to="/market" className="btn-primary flex items-center gap-2">
                            Dashboard Launcher <ArrowRight size={18} />
                        </Link>
                        <button className="btn-ghost" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
                            Explore Living Lights
                        </button>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ position: 'absolute', bottom: 40, opacity: 0.3, left: 'calc(50% - 12px)' }}
                >
                    <div style={{ width: '24px', height: '40px', border: '2px solid var(--text-main)', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '4px', height: '8px', background: 'var(--text-main)', borderRadius: '2px', marginTop: '8px' }} />
                    </div>
                </motion.div>
            </section>

            {/* Features Staggered Section */}
            <section className="container" style={{ position: 'relative', zIndex: 1, padding: '100px 0' }}>
                <div className="grid grid-cols-3">
                    <FeatureCard
                        icon={<Lightbulb color="#a4c639" />}
                        title="Smart Optics"
                        desc="인간 중심 조명을 위한 미세 광학 설계 및 사용자 맞춤형 제어 시스템."
                        index={0}
                    />
                    <FeatureCard
                        icon={<TrendingUp color="#a4c639" />}
                        title="Market Intelligence"
                        desc="조달 시장 빅데이터 분석을 통한 최적의 비즈니스 인사이트 제공."
                        index={1}
                    />
                    <FeatureCard
                        icon={<Cpu color="#a4c639" />}
                        title="AI Automation"
                        desc="설계부터 출하까지, AI 기반의 스마트 생산 및 관리 프로세스."
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
                width: 60, height: 60, borderRadius: '16px', background: '#eef7d4',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16, fontFamily: 'Outfit' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '16px' }}>{desc}</p>
        </motion.div>
    )
}
