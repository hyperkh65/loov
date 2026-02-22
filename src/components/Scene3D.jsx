import { useEffect, useRef } from 'react'

/* ── Fibonacci 구면 분포 + 노이즈 변형 ── */
function noise(x, y, z) {
    return (Math.sin(x * 2.3 + y * 1.7) * Math.cos(z * 3.1 + x * 1.9)
        + Math.sin(y * 2.7 + z * 1.3) * 0.5) * 0.5
}
function buildBrainPoints(count = 3200) {
    const pts = []
    const phi = Math.PI * (Math.sqrt(5) - 1)
    for (let i = 0; i < count; i++) {
        const y0 = 1 - (i / (count - 1)) * 2
        const r0 = Math.sqrt(Math.max(0, 1 - y0 * y0))
        const theta = phi * i
        let x = Math.cos(theta) * r0 * 1.28
        let z = Math.sin(theta) * r0
        let y = y0 * 0.92
        const n = noise(x, y, z) * 0.25
        const len = Math.sqrt(x * x + y * y + z * z) || 1
        x += (x / len) * n; y += (y / len) * n; z += (z / len) * n
        pts.push({ x, y, z })
    }
    return pts
}
const BRAIN_PTS = buildBrainPoints()

/* ── 궤도 노드 ── */
const NODES = [
    { r: 2.7, speed: 0.85, tilt: 0.35, phase: 0.0, color: '#ff6b35', size: 7, label: 'MARKET' },
    { r: 3.1, speed: -0.65, tilt: 1.10, phase: 1.2, color: '#00e5ff', size: 8, label: 'AI CORE' },
    { r: 2.5, speed: 1.15, tilt: 0.65, phase: 2.4, color: '#a855f7', size: 6, label: 'DATA' },
    { r: 3.3, speed: -0.50, tilt: 1.60, phase: 0.8, color: '#facc15', size: 9, label: 'LED' },
    { r: 2.8, speed: 0.75, tilt: 0.20, phase: 3.5, color: '#22d3a0', size: 6, label: 'SUPPLY' },
    { r: 3.0, speed: -0.95, tilt: 1.30, phase: 1.8, color: '#f43f5e', size: 7, label: 'BID' },
    { r: 2.6, speed: 0.60, tilt: 0.90, phase: 4.2, color: '#38bdf8', size: 6, label: 'INTEL' },
]

/* ── 3D 투영 ── */
function project(x, y, z, cx, cy, sc, ry, rx) {
    const cy_ = Math.cos(ry), sy_ = Math.sin(ry)
    let x2 = x * cy_ + z * sy_
    let z2 = -x * sy_ + z * cy_
    const cx_ = Math.cos(rx), sx_ = Math.sin(rx)
    let y2 = y * cx_ - z2 * sx_
    let z3 = y * sx_ + z2 * cx_
    const fov = 5, d = fov + z3
    return { px: cx + (x2 / d) * sc, py: cy + (y2 / d) * sc, pz: z3 / fov, d }
}

/* ── 헥사곤 한 개 그리기 ── */
function hexPath(ctx, cx, cy, r) {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
    }
    ctx.closePath()
}

export default function Scene3D() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animId, startTime = null
        let mx = 0, my = 0
        let scanY = 0

        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)
        window.addEventListener('mousemove', e => {
            mx = (e.clientX / window.innerWidth - 0.5)
            my = (e.clientY / window.innerHeight - 0.5)
        })

        function draw(ts) {
            if (!startTime) startTime = ts
            const t = (ts - startTime) / 1000
            const W = canvas.width, H = canvas.height
            const cx = W / 2, cy = H * 0.48
            const sc = Math.min(W, H) * 0.40   // 더 크게

            /* 배경 */
            ctx.fillStyle = '#00020e'
            ctx.fillRect(0, 0, W, H)

            /* ── 헥사곤 그리드 (사이버 배경) ── */
            const hSize = 38
            const hW = hSize * Math.sqrt(3), hH = hSize * 2
            ctx.strokeStyle = 'rgba(0,200,255,0.06)'
            ctx.lineWidth = 0.7
            for (let row = -1; row < H / hH + 2; row++) {
                for (let col = -1; col < W / hW + 2; col++) {
                    const ox = col * hW + (row % 2 === 0 ? 0 : hW / 2)
                    const oy = row * hH * 0.75
                    hexPath(ctx, ox, oy, hSize - 1)
                    ctx.stroke()
                }
            }

            /* ── 스캔라인 ── */
            scanY = (scanY + 0.8) % H
            const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 15)
            scanGrad.addColorStop(0, 'rgba(0,229,255,0)')
            scanGrad.addColorStop(0.7, 'rgba(0,229,255,0.06)')
            scanGrad.addColorStop(1, 'rgba(0,229,255,0.18)')
            ctx.fillStyle = scanGrad
            ctx.fillRect(0, scanY - 60, W, 75)

            /* ── 원형 회전 아크 (뇌 주변) ── */
            ctx.save()
            ctx.translate(cx, cy)
            for (let i = 0; i < 3; i++) {
                const R = sc * (0.92 + i * 0.15)
                const startA = t * (0.4 + i * 0.15) * (i % 2 === 0 ? 1 : -1)
                const arc = Math.PI * (0.35 + i * 0.12)
                ctx.beginPath()
                ctx.arc(0, 0, R, startA, startA + arc)
                ctx.strokeStyle = `rgba(0,${180 - i * 30},${255 - i * 20},${0.22 - i * 0.04})`
                ctx.lineWidth = 1
                ctx.stroke()

                // 아크 끝에 작은 마커
                const ex = R * Math.cos(startA + arc), ey = R * Math.sin(startA + arc)
                ctx.beginPath()
                ctx.arc(ex, ey, 3, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(0,229,255,0.7)`
                ctx.fill()
            }
            ctx.restore()

            /* ── 뇌 point cloud ── */
            const rotY = t * 0.10 + mx * 0.35
            const rotX = -0.12 + my * 0.25

            for (const p of BRAIN_PTS) {
                const { px, py, pz } = project(p.x, p.y, p.z, cx, cy, sc, rotY, rotX)
                const alpha = (pz + 1) / 2
                const r = 0.5 + alpha * 0.65
                ctx.beginPath()
                ctx.arc(px, py, r, 0, Math.PI * 2)
                // 사이버 테크 색상: 연한 청록
                ctx.fillStyle = `rgba(${30 + alpha * 60},${160 + alpha * 80},${220 + alpha * 35},${0.12 + alpha * 0.32})`
                ctx.fill()
            }

            /* ── 노드 위치 계산 ── */
            const nodePos = NODES.map(nd => {
                const angle = t * nd.speed * 0.35 + nd.phase
                const lx = Math.cos(angle) * nd.r
                const lz = Math.sin(angle) * nd.r
                const ly = Math.sin(angle * 0.5 + nd.tilt) * nd.r * 0.38
                const { px, py, pz, d } = project(lx, ly, lz, cx, cy, sc, rotY, rotX)
                return { px, py, pz, d, ...nd }
            })

            /* ── 점선 (노드 → 중심) ── */
            ctx.setLineDash([3, 7])
            for (const nd of nodePos) {
                const a = ((nd.pz + 1) / 2) * 0.25
                ctx.strokeStyle = nd.color + Math.round(a * 255).toString(16).padStart(2, '0')
                ctx.lineWidth = 0.6
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nd.px, nd.py); ctx.stroke()
            }
            ctx.setLineDash([])

            /* ── 연결선 (노드 간) ── */
            for (let i = 0; i < nodePos.length; i++) {
                for (let j = i + 1; j < nodePos.length; j++) {
                    const a = nodePos[i], b = nodePos[j]
                    const dist = Math.sqrt((a.px - b.px) ** 2 + (a.py - b.py) ** 2)
                    if (dist < sc * 1.7) {
                        const alpha = (1 - dist / (sc * 1.7)) * 0.55
                        const grad = ctx.createLinearGradient(a.px, a.py, b.px, b.py)
                        grad.addColorStop(0, a.color + Math.round(alpha * 255).toString(16).padStart(2, '0'))
                        grad.addColorStop(1, b.color + Math.round(alpha * 255).toString(16).padStart(2, '0'))
                        ctx.strokeStyle = grad
                        ctx.lineWidth = 0.9
                        ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke()
                    }
                }
            }

            /* ── 노드 렌더 (깊이순) ── */
            nodePos.sort((a, b) => a.d - b.d)
            for (const nd of nodePos) {
                const al = (nd.pz + 1) / 2
                const r = nd.size * (0.55 + al * 0.7)

                // 글로우
                const gw = ctx.createRadialGradient(nd.px, nd.py, 0, nd.px, nd.py, r * 4)
                gw.addColorStop(0, nd.color + 'bb')
                gw.addColorStop(0.5, nd.color + '44')
                gw.addColorStop(1, nd.color + '00')
                ctx.fillStyle = gw
                ctx.beginPath(); ctx.arc(nd.px, nd.py, r * 4, 0, Math.PI * 2); ctx.fill()

                // 본체
                ctx.beginPath(); ctx.arc(nd.px, nd.py, r, 0, Math.PI * 2)
                ctx.fillStyle = nd.color; ctx.fill()

                // 하이라이트
                ctx.beginPath()
                ctx.arc(nd.px - r * 0.28, nd.py - r * 0.28, r * 0.38, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill()

                // HUD 라벨
                ctx.font = `${Math.round(8 + al * 3)}px 'Outfit', monospace`
                ctx.fillStyle = nd.color + Math.round((0.5 + al * 0.5) * 255).toString(16).padStart(2, '0')
                ctx.textAlign = 'center'
                ctx.fillText(nd.label, nd.px, nd.py + r + 13)

                // 라벨 아래 작은 데이터 바
                const barW = 28 + al * 10, barH = 2
                const barX = nd.px - barW / 2, barY = nd.py + r + 16
                ctx.fillStyle = 'rgba(0,229,255,0.15)'
                ctx.fillRect(barX, barY, barW, barH)
                ctx.fillStyle = nd.color
                ctx.fillRect(barX, barY, barW * (0.4 + al * 0.55), barH)
            }

            /* ── 중앙 코어 펄스 ── */
            const pulse = (Math.sin(t * 2.5) + 1) / 2
            const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sc * 0.18)
            coreGlow.addColorStop(0, `rgba(0,229,255,${0.15 + pulse * 0.1})`)
            coreGlow.addColorStop(1, 'rgba(0,100,255,0)')
            ctx.fillStyle = coreGlow
            ctx.beginPath(); ctx.arc(cx, cy, sc * 0.18, 0, Math.PI * 2); ctx.fill()

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
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, display: 'block' }}
        />
    )
}
