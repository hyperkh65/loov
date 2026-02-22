import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, BarChart3, TrendingUp, Filter, Plus, Database, Globe } from 'lucide-react'

export default function MarketAnalysis() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, analysis: 0, procurement: 0 })

    // Form states
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('분석')
    const [value, setValue] = useState('')
    const [desc, setDesc] = useState('')
    const [activeTab, setActiveTab] = useState('All')

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (data.length > 0) {
            const total = data.reduce((acc, curr) => acc + curr.value, 0)
            const analysis = data.filter(d => d.category === '분석').length
            const procurement = data.filter(d => d.category === '조달시장').length
            setStats({ total, analysis, procurement })
        }
    }, [data])

    async function fetchData() {
        try {
            setLoading(true)
            const { data: dbData, error } = await supabase
                .from('market_data')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            setData(dbData)
        } catch (e) {
            console.log('Error fetching data', e)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!title || !value) return;

        try {
            const payload = { title, category, value: Number(value), description: desc, date: new Date().toISOString() };

            // Backup & Save
            await fetch('/api/syncNotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'market', data: payload })
            }).catch(err => console.error("Notion sync failed:", err));

            const { error } = await supabase.from('market_data').insert([payload])
            if (error) throw error

            setTitle('')
            setValue('')
            setDesc('')
            fetchData()
        } catch (err) {
            alert("Failed to submit: " + err.message)
        }
    }

    const filteredData = activeTab === 'All' ? data : data.filter(d => d.category === activeTab);

    return (
        <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }} className="scanline">
            <div className="container">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between" 
                    style={{ marginBottom: 48 }}
                >
                    <div>
                        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                            <Activity size={18} color="var(--accent)" />
                            <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: 1 }}>REAL-TIME ANALYTICS</span>
                        </div>
                        <h1 className="shimmer" style={{ fontSize: 42, fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                            시장 및 조달 데이터 허브
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>LOOV Intelligence Dashboard v2.0</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn-ghost flex items-center gap-2">
                            <Globe size={18} /> Global Sync
                        </button>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3" style={{ marginBottom: 48 }}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel stat-card"
                    >
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>누적 거래 규모</div>
                        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit' }}>₩ {stats.total.toLocaleString()}</div>
                        <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '70%' }}
                                style={{ height: '100%', background: 'var(--primary)', borderRadius: 2 }}
                            />
                        </div>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel" style={{ borderLeft: '4px solid #22c55e' }}
                    >
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>시장 분석 데이터</div>
                        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit' }}>{stats.analysis} <span style={{ fontSize: 14, fontWeight: 400 }}>Items</span></div>
                        <TrendingUp size={24} color="#22c55e" style={{ marginTop: 8 }} />
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel" style={{ borderLeft: '4px solid #eab308' }}
                    >
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>조달 시장 실적</div>
                        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit' }}>{stats.procurement} <span style={{ fontSize: 14, fontWeight: 400 }}>Records</span></div>
                        <BarChart3 size={24} color="#eab308" style={{ marginTop: 8 }} />
                    </motion.div>
                </div>

                <div className="grid grid-cols-3" style={{ alignItems: 'start' }}>
                    {/* Interaction Form */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-panel flex-col gap-6"
                    >
                        <div className="flex items-center gap-2">
                            <Plus size={20} />
                            <h2 style={{ fontSize: 18, fontWeight: 600 }}>신규 데이터 엔트리</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-col gap-6">
                            <div className="input-group">
                                <label>분석 프로젝트 명</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="분석 타이틀 입력..." />
                            </div>
                            <div className="flex gap-4">
                                <div style={{ flex: 1 }}>
                                    <label>데이터 분야</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="분석">시장 분석</option>
                                        <option value="조달시장">조달 시장</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>값 (Amount)</label>
                                    <input required type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="수치" />
                                </div>
                            </div>
                            <div>
                                <label>동기화 메모</label>
                                <textarea rows="4" value={desc} onChange={e => setDesc(e.target.value)} placeholder="노션 및 데이터베이스 설명 기록" />
                            </div>
                            <button type="submit" className="btn-primary flex items-center justify-center gap-2" style={{ padding: '16px' }}>
                                <Database size={18} /> 시스템 동기화 실행
                            </button>
                        </form>
                    </motion.div>

                    {/* Interactive Feed */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: 24, padding: '0 8px' }}>
                            <div className="flex gap-6">
                                {['All', '분석', '조달시장'].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{ 
                                            fontSize: 14, fontWeight: 600, color: activeTab === tab ? '#fff' : '#71717a',
                                            paddingBottom: 8, borderBottom: `2px solid ${activeTab === tab ? '#fff' : 'transparent'}`,
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                <Filter size={14} /> 최신순 정렬
                            </div>
                        </div>

                        <div className="flex-col gap-4">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ padding: 48, textAlign: 'center', color: '#a1a1aa' }}
                                    >
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                            <Activity size={32} />
                                        </motion.div>
                                        <p style={{ marginTop: 12 }}>데이터 암호화 해제 중...</p>
                                    </motion.div>
                                ) : filteredData.length === 0 ? (
                                    <motion.div 
                                        key="empty"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="glass-panel" style={{ textAlign: 'center', opacity: 0.5, padding: 48 }}
                                    >
                                        현재 카테고리에 데이터가 비어 있습니다.
                                    </motion.div>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <motion.div 
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                            className="glass-panel glow-hover flex items-center justify-between"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div style={{ 
                                                    width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)'
                                                }}>
                                                    {item.category === '분석' ? <TrendingUp size={20} color="#22c55e" /> : <BarChart3 size={20} color="#eab308" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                                        <span className={`pill ${item.category === '분석' ? 'green' : 'yellow'}`}>{item.category}</span>
                                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{item.title}</h3>
                                                    {item.description && <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{item.description}</p>}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Outfit', color: '#fff' }}>
                                                    {item.value.toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1 }}>ANALYSIS VALUE</div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
