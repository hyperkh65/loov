import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, User, Clock, Eye, Send, X } from 'lucide-react'

export default function Board() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    // Form states
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('일반')
    const [author, setAuthor] = useState('')
    const [content, setContent] = useState('')
    const [showForm, setShowForm] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            setLoading(true)
            const { data: dbData, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
            if (!error) setData(dbData)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!title || !content || !author) return;

        try {
            const payload = { title, category, author, content };

            fetch('/api/syncNotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'post', data: payload })
            }).catch(err => console.error("Notion sync failed:", err));

            const { error } = await supabase.from('posts').insert([payload])
            if (error) throw error

            setTitle('')
            setAuthor('')
            setContent('')
            setShowForm(false)
            fetchData()
        } catch (err) {
            alert("Failed to submit: " + err.message)
        }
    }

    return (
        <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: 100 }} className="scanline">

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(8px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-panel flex-col gap-6"
                            style={{ width: 640, background: 'var(--bg)', padding: 40, border: '1px solid var(--border)' }}
                        >
                            <div className="flex items-center justify-between">
                                <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit' }}>게시글 작성</h2>
                                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="flex-col gap-6">
                                <div className="flex gap-4">
                                    <div style={{ flex: 1 }}>
                                        <label>분류</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)}>
                                            <option value="일반">일반 게시글</option>
                                            <option value="공지사항">공지사항</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>작성자</label>
                                        <input required value={author} onChange={e => setAuthor(e.target.value)} placeholder="닉네임 입력" />
                                    </div>
                                </div>
                                <div>
                                    <label>제목</label>
                                    <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="게시글 제목" />
                                </div>
                                <div>
                                    <label>상세 내용 (Notion 연동됨)</label>
                                    <textarea required rows="8" value={content} onChange={e => setContent(e.target.value)} placeholder="자유롭게 의견을 나누어주세요." />
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button type="submit" className="btn-primary flex items-center gap-2" style={{ padding: '16px 32px' }}>
                                        <Send size={18} /> 시스템 등록 완료
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between"
                    style={{ marginBottom: 48 }}
                >
                    <div>
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <MessageSquare size={18} color="var(--primary)" />
                            <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, letterSpacing: 1 }}>LOOV COMMUNITY</span>
                        </div>
                        <h1 className="shimmer" style={{ fontSize: 42, fontWeight: 900, fontFamily: 'Outfit' }}>커뮤니티 게시판</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>함께 만들어가는 LED 미래 백서</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowForm(true)} style={{ padding: '14px 32px' }}>
                        글쓰기 시작
                    </button>
                </motion.div>

                <div className="flex-col gap-4">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ padding: 48, textAlign: 'center', color: '#a1a1aa' }}
                            >
                                게시글 로딩 중...
                            </motion.div>
                        ) : data.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="glass-panel" style={{ textAlign: 'center', opacity: 0.5, padding: 60 }}
                            >
                                아직 등록된 이야기가 없습니다.
                            </motion.div>
                        ) : (
                            data.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.005, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                    className="glass-panel flex items-center justify-between"
                                    style={{ padding: '24px 32px', cursor: 'pointer' }}
                                >
                                    <div className="flex items-center gap-8">
                                        <div style={{ textAlign: 'center', minWidth: 80 }}>
                                            <span className={`pill ${post.category === '공지사항' ? 'red' : 'blue'}`} style={{ width: '100%', textAlign: 'center' }}>
                                                {post.category}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{post.title}</h3>
                                            <div className="flex items-center gap-6" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                <div className="flex items-center gap-2"><User size={14} /> {post.author}</div>
                                                <div className="flex items-center gap-2"><Clock size={14} /> {new Date(post.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                                        <div className="flex items-center gap-2"><Eye size={16} /> {post.views || 0}</div>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Send size={14} style={{ opacity: 0.5 }} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
