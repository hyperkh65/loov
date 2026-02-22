import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── 다운라이트 LED (아래를 향해 고정) ────────────────────────────────
function Downlight({ position, color = '#fff8e7', delay = 0 }) {
    const spotRef = useRef()
    const lensRef = useRef()
    const pRef = useRef()
    const bright = useRef(0)
    const flickOn = useRef(false)
    const flickEnd = useRef(0)

    useEffect(() => {
        const t = setTimeout(() => {
            flickOn.current = true
            flickEnd.current = performance.now() + 900 // 0.9초 플리커
        }, delay)
        return () => clearTimeout(t)
    }, [delay])

    useFrame((_, delta) => {
        const now = performance.now()
        if (!spotRef.current) return

        if (flickOn.current) {
            if (now < flickEnd.current) {
                // 실제 형광등/LED 시동 플리커
                bright.current = Math.min(bright.current + delta * 3, 1)
                const f = Math.random() > 0.3 ? bright.current : bright.current * 0.08
                spotRef.current.intensity = f * 120
                if (pRef.current) pRef.current.intensity = f * 30
                if (lensRef.current) lensRef.current.material.emissiveIntensity = f * 12
            } else {
                // 안정화
                bright.current = 1
                spotRef.current.intensity = 120
                if (pRef.current) pRef.current.intensity = 30
                if (lensRef.current) lensRef.current.material.emissiveIntensity = 12
            }
        }
    })

    return (
        <group position={position}>
            {/* 하우징 몸체 */}
            <mesh>
                <cylinderGeometry args={[0.07, 0.09, 0.4, 16]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* 냉각 핀 */}
            {[0, 60, 120, 180, 240, 300].map((d, i) => (
                <mesh key={i} position={[
                    Math.cos(d * Math.PI / 180) * 0.095,
                    0.05,
                    Math.sin(d * Math.PI / 180) * 0.095
                ]}>
                    <boxGeometry args={[0.012, 0.22, 0.012]} />
                    <meshStandardMaterial color="#0a0a0a" metalness={0.9} />
                </mesh>
            ))}
            {/* 렌즈 (빛날 때 빛남) */}
            <mesh ref={lensRef} position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.065, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* 렌즈 링 */}
            <mesh position={[0, -0.215, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.065, 0.09, 32]} />
                <meshStandardMaterial color="#050505" metalness={0.95} roughness={0.1} />
            </mesh>

            {/* ★ 실제 조명: 완전 아래를 향함 */}
            <spotLight
                ref={spotRef}
                position={[0, -0.25, 0]}
                rotation={[-Math.PI / 2, 0, 0]}  // 정확히 아래
                color={color}
                intensity={0}
                angle={0.4}
                penumbra={0.7}
                distance={18}
                decay={1.6}
            />
            {/* 보조 포인트 라이트 */}
            <pointLight
                ref={pRef}
                position={[0, -0.25, 0]}
                color={color}
                intensity={0}
                distance={10}
                decay={2}
            />
        </group>
    )
}

// ─── 회전 스포트라이트 ─────────────────────────────────────────────────
function RotatingSpot({ position, color, delay, speed }) {
    const pivotRef = useRef()
    const spotRef = useRef()
    const lensRef = useRef()
    const bright = useRef(0)
    const [on, setOn] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setOn(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    useFrame((state, delta) => {
        if (!pivotRef.current || !spotRef.current) return
        if (on) bright.current = Math.min(bright.current + delta * 1.5, 1)
        const b = bright.current
        const t = state.clock.getElapsedTime()

        pivotRef.current.rotation.y = t * speed
        pivotRef.current.rotation.x = Math.sin(t * speed * 0.7) * 0.5 - 0.3

        spotRef.current.intensity = b * 80
        if (lensRef.current) lensRef.current.material.emissiveIntensity = b * 10
    })

    return (
        <group position={position}>
            {/* 마운트 */}
            <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.12, 12]} />
                <meshStandardMaterial color="#111" metalness={0.9} />
            </mesh>
            <group ref={pivotRef}>
                {/* 하우징 */}
                <mesh position={[0, -0.25, 0]}>
                    <cylinderGeometry args={[0.055, 0.07, 0.28, 16]} />
                    <meshStandardMaterial color="#0d0d0d" metalness={0.85} roughness={0.15} />
                </mesh>
                {/* 렌즈 */}
                <mesh ref={lensRef} position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.048, 32]} />
                    <meshStandardMaterial
                        color={color} emissive={color}
                        emissiveIntensity={0} toneMapped={false}
                    />
                </mesh>
                {/* 스팟 */}
                <spotLight
                    ref={spotRef}
                    position={[0, -0.42, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    color={color}
                    intensity={0}
                    angle={0.12}
                    penumbra={0.3}
                    distance={22}
                    decay={1.4}
                />
            </group>
        </group>
    )
}

// ─── 사무실 공간 ──────────────────────────────────────────────────────
function Office() {
    return (
        <group>
            {/* 바닥 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
                <planeGeometry args={[50, 40]} />
                <meshStandardMaterial color="#0b0b18" roughness={0.25} metalness={0.55} />
            </mesh>
            {/* 천장 */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.1, 0]}>
                <planeGeometry args={[50, 40]} />
                <meshStandardMaterial color="#060610" roughness={0.9} />
            </mesh>
            {/* 뒷벽 */}
            <mesh position={[0, 1, -13]} receiveShadow>
                <planeGeometry args={[50, 18]} />
                <meshStandardMaterial color="#05050e" roughness={0.8} metalness={0.05} />
            </mesh>
            {/* 좌벽 */}
            <mesh position={[-14, 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[26, 18]} />
                <meshStandardMaterial color="#04040c" roughness={0.85} />
            </mesh>
            {/* 우벽 */}
            <mesh position={[14, 1, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[26, 18]} />
                <meshStandardMaterial color="#04040c" roughness={0.85} />
            </mesh>

            {/* 천장 트랙 레일 */}
            {[-6, -2, 2, 6].map((x, i) => (
                <mesh key={i} position={[x, 5, -4]}>
                    <boxGeometry args={[0.07, 0.04, 22]} />
                    <meshStandardMaterial color="#14141e" metalness={0.8} roughness={0.2} />
                </mesh>
            ))}

            {/* 책상 6개 */}
            {[[-5, -4], [0, -4], [5, -4], [-5, -7.5], [0, -7.5], [5, -7.5]].map(([x, z], i) => (
                <Desk key={i} position={[x, -3, z]} />
            ))}
        </group>
    )
}

function Desk({ position }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.55, 0]} receiveShadow castShadow>
                <boxGeometry args={[2.2, 0.05, 0.95]} />
                <meshStandardMaterial color="#131326" roughness={0.45} metalness={0.25} />
            </mesh>
            {[[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, 0, lz]} castShadow>
                    <boxGeometry args={[0.05, 1.1, 0.05]} />
                    <meshStandardMaterial color="#0a0a1a" metalness={0.6} />
                </mesh>
            ))}
            {/* 모니터 */}
            <mesh position={[0, 1.14, -0.32]} castShadow>
                <boxGeometry args={[1.0, 0.62, 0.03]} />
                <meshStandardMaterial color="#050510" emissive="#081840" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[0, 0.74, -0.32]}>
                <boxGeometry args={[0.04, 0.38, 0.04]} />
                <meshStandardMaterial color="#0a0a1a" metalness={0.7} />
            </mesh>
        </group>
    )
}

// ─── 카메라 ───────────────────────────────────────────────────────────
function CameraRig() {
    const vec = useMemo(() => new THREE.Vector3(), [])
    useFrame((state) => {
        vec.set(state.mouse.x * 2.5, 0.8 + state.mouse.y * 1.2, 9.5)
        state.camera.position.lerp(vec, 0.04)
        state.camera.lookAt(0, -0.5, -3)
    })
    return null
}

// ─── 메인 ─────────────────────────────────────────────────────────────
export default function Scene3D() {
    // 트랙 LED 12개
    const leds = [
        { pos: [-6, 4.88, -1], delay: 250 },
        { pos: [-6, 4.88, -5], delay: 620 },
        { pos: [-6, 4.88, -9], delay: 1050 },
        { pos: [-2, 4.88, -1], delay: 380 },
        { pos: [-2, 4.88, -5], delay: 750 },
        { pos: [-2, 4.88, -9], delay: 1180 },
        { pos: [2, 4.88, -1], delay: 310 },
        { pos: [2, 4.88, -5], delay: 680 },
        { pos: [2, 4.88, -9], delay: 1120 },
        { pos: [6, 4.88, -1], delay: 520 },
        { pos: [6, 4.88, -5], delay: 890 },
        { pos: [6, 4.88, -9], delay: 1350 },
    ]

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas
                dpr={[1, 1.5]}
                camera={{ position: [0, 1, 9.5], fov: 50 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            >
                <color attach="background" args={['#020208']} />
                <fog attach="fog" args={['#01010a', 14, 40]} />

                {/* 최소 앰비언트 */}
                <ambientLight intensity={0.15} color="#0d0d35" />

                {/* LED 다운라이트들 */}
                {leds.map((l, i) => (
                    <Downlight key={i} position={l.pos} delay={l.delay} />
                ))}

                {/* LOOV 브랜드 회전 스팟 */}
                <RotatingSpot position={[-7, 4.85, 1.5]} color="#00c8ff" delay={1600} speed={0.32} />
                <RotatingSpot position={[7, 4.85, 1.5]} color="#0090ff" delay={1950} speed={-0.27} />
                <RotatingSpot position={[0, 4.85, -2]} color="#ffa040" delay={2300} speed={0.48} />

                <Office />
                <CameraRig />
            </Canvas>
        </div>
    )
}
