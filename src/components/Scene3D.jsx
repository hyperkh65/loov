import { useEffect, useRef } from 'react'

export default function Scene3D() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        let animId
        let startTime = null

        // ── 캔버스 크기 맞추기 ─────────────────────────
        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        // ── LED 패널 정의 ──────────────────────────────
        // 격자형 천장 LED: [x비율, y비율, 딜레이ms]
        const ledPanels = [
            // 1열
            [0.15, 0.08, 300], [0.35, 0.08, 520], [0.55, 0.08, 420], [0.80, 0.08, 680],
            // 2열
            [0.15, 0.13, 880], [0.35, 0.13, 1050], [0.55, 0.13, 960], [0.80, 0.13, 1180],
            // 3열 (원근감으로 작아짐)
            [0.22, 0.17, 1380], [0.43, 0.17, 1500], [0.65, 0.17, 1440], [0.82, 0.17, 1600],
        ].map(([xr, yr, delay]) => ({
            xr, yr, delay,
            brightness: 0,
            flickering: false,
            flickerStart: null,
            stable: false,
        }))

        // ── 회전 스포트라이트 ──────────────────────────
        const spotlights = [
            { xr: 0.2, startDelay: 1800, angle: 0, speed: 0.4, color: [0, 200, 255], brightness: 0 },
            { xr: 0.5, startDelay: 2100, angle: Math.PI, speed: -0.3, color: [0, 160, 255], brightness: 0 },
            { xr: 0.8, startDelay: 2400, angle: Math.PI / 2, speed: 0.55, color: [60, 220, 255], brightness: 0 },
        ]

        // ── 마우스 트래킹 ──────────────────────────────
        let mouseX = 0.5
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth
        })

        // ── 투시 원근 변환 함수 ─────────────────────────
        function perspX(xr, yr, W, H) {
            const horizon = H * 0.32 // 소실점 높이
            const depth = (yr - 0.05) / (0.95 - 0.05)
            const spread = 0.5 + depth * 0.5
            return W * (0.5 + (xr - 0.5) * spread)
        }
        function perspY(yr, H) {
            const horizon = H * 0.32
            return horizon + (yr - 0.05) * (H - horizon) * 1.1
        }
        function perspScale(yr) {
            return 0.2 + (yr - 0.05) * 1.2
        }

        // ── 방 그리기 ──────────────────────────────────
        function drawRoom(W, H, ambientLight) {
            // 배경 (천장)
            const gradient = ctx.createLinearGradient(0, 0, 0, H)
            const al = ambientLight
            gradient.addColorStop(0, `rgb(${Math.floor(5 + al * 15)},${Math.floor(5 + al * 15)},${Math.floor(12 + al * 25)})`)
            gradient.addColorStop(0.35, `rgb(${Math.floor(3 + al * 10)},${Math.floor(3 + al * 10)},${Math.floor(8 + al * 20)})`)
            gradient.addColorStop(1, `rgb(${Math.floor(5 + al * 20)},${Math.floor(5 + al * 20)},${Math.floor(15 + al * 35)})`)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, W, H)

            // 소실점
            const vx = W * (0.5 + (mouseX - 0.5) * 0.1)
            const vy = H * 0.32

            // 바닥 그리드 (원근 선)
            ctx.strokeStyle = `rgba(30,30,60,${0.3 + al * 0.4})`
            ctx.lineWidth = 0.5
            for (let i = 0; i <= 10; i++) {
                const bx = W * (i / 10)
                ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, H); ctx.stroke()
            }
            for (let j = 0; j <= 6; j++) {
                const t = j / 6
                const y = vy + (H - vy) * t
                const xl = vx - (vx - 0) * t
                const xr2 = vx + (W - vx) * t
                ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(xr2, y); ctx.stroke()
            }

            // 천장 그리드
            ctx.strokeStyle = `rgba(20,20,50,${0.4 + al * 0.3})`
            for (let i = 0; i <= 8; i++) {
                const bx = W * (i / 8)
                ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, 0); ctx.stroke()
            }

            // 벽 경계선
            ctx.strokeStyle = `rgba(40,40,80,${0.5 + al * 0.3})`
            ctx.lineWidth = 1
            // 천장-벽
            ctx.beginPath(); ctx.moveTo(0, vy * 0.6); ctx.lineTo(vx, vy); ctx.lineTo(W, vy * 0.6); ctx.stroke()
        }

        // ── 책상 실루엣 그리기 ─────────────────────────
        function drawDesks(W, H, ambientLight) {
            const desks = [
                [0.1, 0.72, 0.18, 0.08],
                [0.35, 0.75, 0.18, 0.07],
                [0.6, 0.73, 0.18, 0.08],
                [0.83, 0.71, 0.14, 0.07],
                [0.22, 0.85, 0.2, 0.06],
                [0.52, 0.87, 0.2, 0.06],
                [0.78, 0.84, 0.16, 0.06],
            ]

            const al = ambientLight
            desks.forEach(([xr, yr, wr, hr]) => {
                const x = W * xr, y = H * yr, w = W * wr, h = H * hr

                // 테이블 면
                ctx.fillStyle = `rgba(${Math.floor(14 + al * 15)},${Math.floor(14 + al * 15)},${Math.floor(28 + al * 20)},0.95)`
                ctx.fillRect(x, y, w, h)

                // 다리
                ctx.fillStyle = `rgba(8,8,16,0.9)`
                ctx.fillRect(x + w * 0.05, y + h, w * 0.06, H * 0.04)
                ctx.fillRect(x + w * 0.89, y + h, w * 0.06, H * 0.04)

                // 모니터
                const mx = x + w * 0.25, mw = w * 0.5, mh = h * 1.3
                ctx.fillStyle = `rgba(4,4,12,0.95)`
                ctx.fillRect(mx, y - mh, mw, mh)

                // 모니터 화면 - 아주 약한 블루 글로우
                const screenGlow = ctx.createRadialGradient(mx + mw / 2, y - mh + mh / 2, 0, mx + mw / 2, y - mh + mh / 2, mw * 0.5)
                screenGlow.addColorStop(0, `rgba(0,50,150,${0.1 + al * 0.15})`)
                screenGlow.addColorStop(1, `rgba(0,0,0,0)`)
                ctx.fillStyle = screenGlow
                ctx.fillRect(mx + 2, y - mh + 2, mw - 4, mh - 4)
            })
        }

        // ── LED 패널 그리기 ─────────────────────────────
        function drawLEDPanels(W, H, now) {
            ledPanels.forEach((panel) => {
                const elapsed = now - startTime

                // 플리커 시작
                if (!panel.flickering && !panel.stable && elapsed > panel.delay) {
                    panel.flickering = true
                    panel.flickerStart = now
                }

                // 플리커 처리
                if (panel.flickering) {
                    const flickerElapsed = now - panel.flickerStart
                    if (flickerElapsed < 800) {
                        // 불규칙하게 깜빡임
                        panel.brightness = Math.random() > 0.35
                            ? Math.min(flickerElapsed / 500, 1)
                            : Math.random() * 0.3
                    } else {
                        panel.flickering = false
                        panel.stable = true
                        panel.brightness = 1
                    }
                }

                if (panel.brightness <= 0) return

                const x = W * panel.xr
                const y = H * panel.yr
                const pw = W * 0.06 * (1 - panel.yr * 0.5)
                const ph = H * 0.008

                const b = panel.brightness

                // LED 패널 몸체 (흰색 막대)
                ctx.fillStyle = `rgba(${Math.floor(200 + b * 55)},${Math.floor(220 + b * 35)},${Math.floor(255)},${b * 0.95})`
                ctx.fillRect(x - pw / 2, y - ph / 2, pw, ph)

                // 아래 빛 원뿔 (방을 비추는 빛)
                const coneH = H * 0.45 * (1 - panel.yr * 0.4)
                const coneW = pw * (3 + b * 2)
                const coneGrad = ctx.createRadialGradient(x, y, 0, x, y + coneH * 0.5, coneW * 2)
                coneGrad.addColorStop(0, `rgba(200,220,255,${b * 0.18})`)
                coneGrad.addColorStop(0.4, `rgba(150,190,255,${b * 0.08})`)
                coneGrad.addColorStop(1, `rgba(100,150,255,0)`)
                ctx.fillStyle = coneGrad
                ctx.beginPath()
                ctx.moveTo(x - pw / 2, y)
                ctx.lineTo(x - coneW, y + coneH)
                ctx.lineTo(x + coneW, y + coneH)
                ctx.lineTo(x + pw / 2, y)
                ctx.closePath()
                ctx.fill()

                // 패널 주변 글로우
                const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, pw * 1.5)
                glowGrad.addColorStop(0, `rgba(180,220,255,${b * 0.5})`)
                glowGrad.addColorStop(1, `rgba(100,180,255,0)`)
                ctx.fillStyle = glowGrad
                ctx.fillRect(x - pw, y - pw * 0.3, pw * 2, pw * 0.6)
            })
        }

        // ── 회전 스포트라이트 그리기 ──────────────────
        function drawSpotlights(W, H, now) {
            spotlights.forEach((spot) => {
                const elapsed = now - startTime
                if (elapsed < spot.startDelay) return

                // 밝기 올라오기
                spot.brightness = Math.min(spot.brightness + 0.008, 1)

                // 각도 업데이트
                spot.angle += spot.speed * 0.016

                const x = W * spot.xr
                const y = H * 0.08
                const [r, g, b2] = spot.color
                const brightness = spot.brightness

                // 빔 방향
                const len = H * 0.7
                const bx = x + Math.sin(spot.angle) * len * 0.8
                const by = y + Math.cos(spot.angle) * len

                // 빔 그라디언트
                const beamGrad = ctx.createLinearGradient(x, y, bx, by)
                beamGrad.addColorStop(0, `rgba(${r},${g},${b2},${brightness * 0.6})`)
                beamGrad.addColorStop(0.5, `rgba(${r},${g},${b2},${brightness * 0.15})`)
                beamGrad.addColorStop(1, `rgba(${r},${g},${b2},0)`)

                const beamW = 12 * brightness
                ctx.save()
                ctx.strokeStyle = beamGrad
                ctx.lineWidth = beamW
                ctx.lineCap = 'round'
                ctx.globalCompositeOperation = 'screen'
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(bx, by)
                ctx.stroke()

                // 빔 보조 (더 넓은 희미한 빛)
                ctx.lineWidth = beamW * 4
                ctx.strokeStyle = `rgba(${r},${g},${b2},${brightness * 0.06})`
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(bx, by)
                ctx.stroke()

                ctx.globalCompositeOperation = 'source-over'
                ctx.restore()

                // 스포트라이트 본체 (원)
                ctx.beginPath()
                ctx.arc(x, y, 6 * brightness, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${r},${g},${b2},${brightness * 0.9})`
                ctx.fill()

                // 본체 글로우
                const spotGlow = ctx.createRadialGradient(x, y, 0, x, y, 20)
                spotGlow.addColorStop(0, `rgba(${r},${g},${b2},${brightness * 0.4})`)
                spotGlow.addColorStop(1, `rgba(${r},${g},${b2},0)`)
                ctx.fillStyle = spotGlow
                ctx.beginPath()
                ctx.arc(x, y, 20, 0, Math.PI * 2)
                ctx.fill()
            })
        }

        // ── 바닥 반사 효과 ──────────────────────────────
        function drawFloorReflections(W, H, ambientLight) {
            const al = ambientLight
            ledPanels.forEach((panel) => {
                if (panel.brightness <= 0) return
                const x = W * panel.xr
                const ry = H * 0.82 // 바닥 반사 위치
                const rw = W * 0.08

                const refGrad = ctx.createRadialGradient(x, ry, 0, x, ry, rw)
                refGrad.addColorStop(0, `rgba(180,210,255,${panel.brightness * 0.12})`)
                refGrad.addColorStop(1, `rgba(100,150,255,0)`)
                ctx.fillStyle = refGrad
                ctx.beginPath()
                ctx.ellipse(x, ry, rw, rw * 0.3, 0, 0, Math.PI * 2)
                ctx.fill()
            })
        }

        // ── 메인 애니메이션 루프 ──────────────────────
        function draw(timestamp) {
            if (!startTime) startTime = timestamp

            const W = canvas.width
            const H = canvas.height

            // 전체 ambient 밝기 계산 (켜진 LED 비율)
            const stablePanels = ledPanels.filter(p => p.stable).length
            const ambientLight = Math.min(stablePanels / ledPanels.length, 1)

            // 캔버스 클리어
            ctx.clearRect(0, 0, W, H)

            // 레이어순 렌더링
            drawRoom(W, H, ambientLight)
            drawDesks(W, H, ambientLight)
            drawLEDPanels(W, H, timestamp)
            drawFloorReflections(W, H, ambientLight)
            drawSpotlights(W, H, timestamp)

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
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                display: 'block',
            }}
        />
    )
}
