import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MarketAnalysis() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    // Form states
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('분석')
    const [value, setValue] = useState('')
    const [desc, setDesc] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

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
            console.log('Error fetching data (Might be initial if table missing rules)', e)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!title || !value) return;

        try {
            const payload = { title, category, value: Number(value), description: desc, date: new Date().toISOString() };

            // 1. Dual Backup: Notion via Vercel Serverless Function
            await fetch('/api/syncNotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'market', data: payload })
            }).catch(err => console.error("Notion sync failed:", err));

            // 2. Primary: Supabase
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

    return (
        <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
            <div className="container">
                <div className="flex items-center justify-between" style={{ marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Outfit' }}>시장 및 조달 데이터</h1>
                        <p style={{ color: 'var(--text-muted)' }}>LOOV LED Analysis Hub</p>
                    </div>
                </div>

                <div className="grid grid-cols-3">
                    {/* Submissions form mapping */}
                    <div className="glass-panel flex-col gap-4">
                        <h2 style={{ fontSize: 18, fontWeight: 600 }}>새 데이터 추가</h2>
                        <form onSubmit={handleSubmit} className="flex-col gap-4">
                            <div>
                                <label>데이터 제목</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 2026년 LED 조달 실적..." />
                            </div>
                            <div className="flex gap-4">
                                <div style={{ flex: 1 }}>
                                    <label>분류</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="분석">시장 분석</option>
                                        <option value="조달시장">조달 시장</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>수치/금액</label>
                                    <input required type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="숫자 입력" />
                                </div>
                            </div>
                            <div>
                                <label>상세 내용 (Notion 동시 저장)</label>
                                <textarea rows="3" value={desc} onChange={e => setDesc(e.target.value)} placeholder="분석 요약 내용" />
                            </div>
                            <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>저장 및 동기화</button>
                        </form>
                    </div>

                    {/* List display */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <div className="flex-col gap-4">
                            {loading ? (
                                <div style={{ padding: 24, textAlign: 'center', color: '#a1a1aa' }}>데이터를 불러오는 중...</div>
                            ) : data.length === 0 ? (
                                <div className="glass-panel" style={{ textAlign: 'center', opacity: 0.5 }}>아직 등록된 데이터가 없습니다.</div>
                            ) : (
                                data.map(item => (
                                    <div key={item.id} className="glass-panel flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                                                <span className={`pill ${item.category === '분석' ? 'green' : 'yellow'}`}>{item.category}</span>
                                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>{item.title}</h3>
                                            {item.description && <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{item.description}</p>}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Outfit' }}>
                                                {item.value.toLocaleString()}
                                            </div>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Data Value</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
