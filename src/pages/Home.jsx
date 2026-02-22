import Scene3D from '../components/Scene3D'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
            {/* 3D Background */}
            <Scene3D />

            {/* Overlay Content */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', pointerEvents: 'none',
                background: 'radial-gradient(circle at center, transparent 30%, rgba(2,2,2,0.95) 100%)',
                zIndex: 10
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ textAlign: 'center', padding: '0 24px', pointerEvents: 'auto', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}
                >

                    <div style={{ marginBottom: 16 }}>
                        <span className="pill" style={{
                            background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            Discover the Light
                        </span>
                    </div>

                    <h1 className="gradient-text" style={{
                        fontSize: 'max(4vw, 48px)', fontWeight: 800, fontFamily: 'Outfit',
                        letterSpacing: '-0.02em', marginBottom: 24, lineHeight: 1.1
                    }}>
                        Illuminating Spaces,<br />
                        Intelligent LED Solutions
                    </h1>

                    <p style={{
                        color: '#a1a1aa', fontSize: '18px', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6
                    }}>
                        LOOV delivers cutting-edge LED technologies, comprehensive market analysis, and public procurement insights perfectly tailored for the modern lighting industry.
                    </p>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                        <Link to="/market" className="btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
                            Explore Data & Market
                        </Link>
                        <Link to="/board" className="btn-ghost" style={{ padding: '16px 32px', fontSize: '16px' }}>
                            Join Community
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
