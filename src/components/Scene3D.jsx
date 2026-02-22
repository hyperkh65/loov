import { useEffect, useRef } from 'react'

/* ── 간단한 Perlin-like 노이즈 ── */
function noise(x, y, z) {
    return (Math.sin(x * 2.3 + y * 1.7) * Math.cos(z * 3.1 + x * 1.9)
        + Math.sin(y * 2.7 + z * 1.3) * 0.5) * 0.5
}

/* ── 구면 좌표 → 3D 점 (뇌 모양 변형 포함) ── */
function buildBrainPoints(count = 2800) {
    const pts = []
    const phi = Math.PI * (Math.sqrt(5) - 1) // 황금각
    for (let i = 0; i < count; i++) {
        const y0 = 1 - (i / (count - 1)) * 2
        const r0 = Math.sqrt(Math.max(0, 1 - y0 * y0))
        const theta = phi * i
        let x = Math.cos(theta) * r0
        let z = Math.sin(theta) * r0
        let y = y0

        // 뇌처럼 좌우로 약간 납작하게
        x *= 1.25
        y *= 0.9

        // 표면 굴곡 노이즈 (주름 효과)
        const n = noise(x, y, z) * 0.22
        const len = Math.sqrt(x * x + y * y + z * z) || 1
        x += (x / len) * n
        y += (y / len) * n
        z += (z / len) * n

        pts.push({ x, y, z })
    }
    return pts
}

const BRAIN_PTS = buildBrainPoints()
const NODE_SPEED = 0.35

/* ── 궤도 노드 정의 ── */
const NODES = [
    { r: 2.6, speed: 0.9, tilt: 0.35, phase: 0.0, color: '#ff6b35', size: 8, label: 'Market' },
    { r: 3.0, speed: -0.7, tilt: 1.1, phase: 1.2, color: '#00e5ff', size: 9, label: 'AI Core' },
    { r: 2.4, speed: 1.2, tilt: 0.6, phase: 2.4, color: '#7c3aed', size: 7, label: 'Data' },
    { r: 3.2, speed: -0.5, tilt: 1.6, phase: 0.8, color: '#ffd700', size: 10, label: 'LED' },
    { r: 2.7, speed: 0.8, tilt: 0.2, phase: 3.5, color: '#00ff88', size: 7, label: 'Supply' },
    { r: 2.9, speed: -1.0, tilt: 1.3, phase: 1.8, color: '#ff3d6b', size: 8, label: 'Bid' },
    { r: 2.5, speed: 0.6, tilt: 0.9, phase: 4.2, color: '#f97316', size: 6, label: 'Trade' },
]

/* ── 3D → 2D 투영 ── */
function project(x, y, z, cx, cy, scale, rotY, rotX) {
    // Y축 회전
    const cos_y = Math.cos(rotY), sin_y = Math.sin(rotY)
    let x2 = x * cos_y + z * sin_y
    let z2 = -x * sin_y + z * cos_y

    // X축 회전
    const cos_x = Math.cos(rotX), sin_x = Math.sin(rotX)
    let y2 = y * cos_x - z2 * sin_x
    let z3 = y * sin_x + z2 * cos_x

    // 원근 투영
    const fov = 4.5
    const depth = fov + z3
    const px = cx + (x2 / depth) * scale
    const py = cy + (y2 / depth) * scale
    const pz = z3 / fov        // normalized depth [-1,1]
    return { px, py, pz, depth }
}

export default function Scene3D() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animId
        let startTime = null

        /* ── 크기 조정 ── */
        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        /* ── 마우스 ── */
        let mx = 0, my = 0
        window.addEventListener('mousemove', (e) => {
            mx = (e.clientX / window.innerWidth - 0.5)
            my = (e.clientY / window.innerHeight - 0.5)
        })

        /* ── 메인 루프 ── */
        function draw(ts) {
            if (!startTime) startTime = ts
            const t = (ts - startTime) / 1000
            const W = canvas.width
            const H = canvas.height
            const cx = W / 2
            const cy = H / 2
            const sc = Math.min(W, H) * 0.26
            const rotY = t * 0.12 + mx * 0.4
            const rotX = -0.15 + my * 0.3

            /* 배경 */
            ctx.fillStyle = '#000008'
            ctx.fillRect(0, 0, W, H)

            /* 중심 글로우 */
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sc * 1.1)
            glow.addColorStop(0, 'rgba(0,200,255,0.06)')
            glow.addColorStop(0.5, 'rgba(0,100,160,0.03)')
            glow.addColorStop(1, 'rgba(0,0,0,0)')
            ctx.fillStyle = glow
            ctx.fillRect(0, 0, W, H)

            /* ── 뇌 포인트 클라우드 ── */
            for (const p of BRAIN_PTS) {
                const { px, py, pz } = project(p.x, p.y, p.z, cx, cy, sc, rotY, rotX)
                const alpha = (pz + 1) / 2         // 앞면 밝게
                const radius = 0.7 + alpha * 0.8
                ctx.beginPath()
                ctx.arc(px, py, radius, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${40 + alpha * 100},${180 + alpha * 60},${200 + alpha * 55},${0.2 + alpha * 0.5})`
                ctx.fill()
            }

            /* ── 궤도 노드 위치 계산 ── */
            const nodePos = NODES.map((nd, i) => {
                const angle = t * nd.speed * NODE_SPEED + nd.phase
                const lx = Math.cos(angle) * nd.r
                const lz = Math.sin(angle) * nd.r
                const ly = Math.sin(angle * 0.5 + nd.tilt) * nd.r * 0.4
                const { px, py, pz, depth } = project(lx, ly, lz, cx, cy, sc, rotY, rotX)
                return { px, py, pz, depth, color: nd.color, size: nd.size, label: nd.label }
            })

            /* ── 연결선 ── */
            for (let i = 0; i < nodePos.length; i++) {
                for (let j = i + 1; j < nodePos.length; j++) {
                    const a = nodePos[i], b = nodePos[j]
                    const dist = Math.sqrt((a.px - b.px) ** 2 + (a.py - b.py) ** 2)
                    if (dist < sc * 1.8) {
                        const alpha = (1 - dist / (sc * 1.8)) * 0.6
                        const grad = ctx.createLinearGradient(a.px, a.py, b.px, b.py)
                        grad.addColorStop(0, a.color + Math.round(alpha * 255).toString(16).padStart(2, '0'))
                        grad.addColorStop(1, b.color + Math.round(alpha * 255).toString(16).padStart(2, '0'))
                        ctx.strokeStyle = grad
                        ctx.lineWidth = 0.8
                        ctx.beginPath()
                        ctx.moveTo(a.px, a.py)
                        ctx.lineTo(b.px, b.py)
                        ctx.stroke()
                    }
                }
            }

            /* ── 뇌 중심으로의 연결선 ── */
            for (const nd of nodePos) {
                const alpha = (nd.pz + 1) / 2 * 0.3
                ctx.strokeStyle = `${nd.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
                ctx.lineWidth = 0.5
                ctx.setLineDash([4, 8])
                ctx.beginPath()
                ctx.moveTo(cx, cy)
                ctx.lineTo(nd.px, nd.py)
                ctx.stroke()
                ctx.setLineDash([])
            }

            /* ── 궤도 노드 그리기 ── */
            nodePos.sort((a, b) => a.depth - b.depth)   // 깊이 정렬
            for (const nd of nodePos) {
                const alpha = (nd.pz + 1) / 2
                const r = nd.size * (0.6 + alpha * 0.7)

                // 외부 글로우
                const gw = ctx.createRadialGradient(nd.px, nd.py, 0, nd.px, nd.py, r * 3.5)
                gw.addColorStop(0, nd.color + 'aa')
                gw.addColorStop(0.4, nd.color + '44')
                gw.addColorStop(1, nd.color + '00')
                ctx.fillStyle = gw
                ctx.beginPath()
                ctx.arc(nd.px, nd.py, r * 3.5, 0, Math.PI * 2)
                ctx.fill()

                // 노드 본체
                ctx.beginPath()
                ctx.arc(nd.px, nd.py, r, 0, Math.PI * 2)
                ctx.fillStyle = nd.color
                ctx.fill()

                // 중심 반사 하이라이트
                ctx.beginPath()
                ctx.arc(nd.px - r * 0.28, nd.py - r * 0.28, r * 0.38, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(255,255,255,0.55)'
                ctx.fill()

                // 라벨
                const labelAlpha = 0.4 + alpha * 0.6
                ctx.font = `bold ${Math.round(9 + alpha * 3)}px Outfit, sans-serif`
                ctx.fillStyle = `rgba(255,255,255,${labelAlpha})`
                ctx.textAlign = 'center'
                ctx.fillText(nd.label, nd.px, nd.py + r + 14)
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0, display: 'block',
            }}
        />
    )
}
