import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

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

            // 1. Dual Backup: Notion
            fetch('/api/syncNotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'post', data: payload })
            }).catch(err => console.error("Notion sync failed:", err));

            // 2. Primary: Supabase
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
        <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: 100 }}>
            {showForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel flex-col gap-4" style={{ width: 600, background: 'var(--bg)' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700 }}>게시글 작성</h2>
                        <form onSubmit={handleSubmit} className="flex-col gap-4">
                            <div className="flex gap-4">
                                <div style={{ flex: 1 }}>
                                    <label>분류</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="일반">일반 게시글</option>
                                        <option value="공지사항">공지사항</option>
                                    </select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label>작성자</label>
                                    <input required value={author} onChange={e => setAuthor(e.target.value)} placeholder="닉네임" />
                                </div>
                            </div>
                            <div>
                                <label>제목</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요." />
                            </div>
                            <div>
                                <label>내용</label>
                                <textarea required rows="8" value={content} onChange={e => setContent(e.target.value)} placeholder="자유롭게 작성해주세요." />
                            </div>
                            <div className="flex justify-between" style={{ marginTop: 24 }}>
                                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>취소</button>
                                <button type="submit" className="btn-primary">등록 & Notion 연동</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="container">
                <div className="flex items-center justify-between" style={{ marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Outfit' }}>LOOV 커뮤니티 게시판</h1>
                        <p style={{ color: 'var(--text-muted)' }}>자유로운 의견과 정보를 공유하세요.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>글쓰기</button>
                </div>

                <div className="flex-col gap-4">
                    {loading ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#a1a1aa' }}>게시글을 불러오는 중...</div>
                    ) : data.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: 'center', opacity: 0.5 }}>등록된 게시글이 없습니다.</div>
                    ) : (
                        data.map(post => (
                            <div key={post.id} className="glass-panel flex items-center justify-between" style={{ padding: '20px 24px' }}>
                                <div className="flex items-center gap-6">
                                    <div style={{ width: '80px', textAlign: 'center' }}>
                                        <span className={`pill ${post.category === '공지사항' ? 'red' : 'blue'}`}>{post.category}</span>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{post.title}</h3>
                                        <div className="flex items-center gap-4" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                            <span>{post.author}</span>
                                            <span>•</span>
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                    조회 {post.views}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
