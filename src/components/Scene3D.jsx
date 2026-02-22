import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

// ─── LED 패널 조명 (천장에 박힌 LED) ──────────────────────────────────
function LEDPanel({ position, delay = 0, color = '#ffffff', size = [2, 0.05, 0.5] }) {
    const lightRef = useRef()
    const meshRef = useRef()
    const [intensity, setIntensity] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            let start = null
            const duration = 800
            const animate = (ts) => {
                if (!start) start = ts
                const progress = Math.min((ts - start) / duration, 1)
                // Ease-in: flickers up
                const eased = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2
                setIntensity(eased)
                if (progress < 1) requestAnimationFrame(animate)
            }
            requestAnimationFrame(animate)
        }, delay)
        return () => clearTimeout(timer)
    }, [delay])

    useFrame((state) => {
        if (!lightRef.current || !meshRef.current) return
        // 켜진 후 미세한 플리커 (형광등 느낌)
        const flicker = intensity > 0.9
            ? 1 + Math.sin(state.clock.getElapsedTime() * 60) * 0.015
            : 1
        lightRef.current.intensity = intensity * 12 * flicker
        meshRef.current.material.emissiveIntensity = intensity * 3 * flicker
    })

    return (
        <group position={position}>
            {/* LED 패널 몸체 */}
            <mesh ref={meshRef}>
                <boxGeometry args={size} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0}
                    toneMapped={false}
                />
            </mesh>
            {/* 실제 광원 */}
            <pointLight
                ref={lightRef}
                color={color}
                intensity={0}
                distance={12}
                decay={2}
                castShadow
                shadow-mapSize={[512, 512]}
            />
        </group>
    )
}

// ─── 회전하는 LED 스포트라이트 (빔 효과) ────────────────────────────────
function RotatingSpotLight({ position, color = '#00c8ff', delay = 0 }) {
    const groupRef = useRef()
    const lightRef = useRef()
    const [active, setActive] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setActive(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    useFrame((state) => {
        if (!groupRef.current || !lightRef.current) return
        const time = state.clock.getElapsedTime()
        // 수평 회전
        groupRef.current.rotation.y = time * 0.4
        // 빔 각도 서서히 변화
        groupRef.current.rotation.z = Math.sin(time * 0.6) * 0.3
        lightRef.current.intensity = active
            ? 15 + Math.sin(time * 3) * 2
            : 0
    })

    return (
        <group ref={groupRef} position={position}>
            {/* 스포트라이트 본체 */}
            <mesh>
                <cylinderGeometry args={[0.08, 0.12, 0.25, 16]} />
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
            </mesh>
            <spotLight
                ref={lightRef}
                color={color}
                intensity={0}
                angle={0.25}
                penumbra={0.5}
                distance={20}
                decay={1.8}
                castShadow
            />
        </group>
    )
}

// ─── 사무 공간 구조물 ────────────────────────────────────────────────────
function OfficeStructure() {
    return (
        <group>
            {/* 바닥 - 반사 처리 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <MeshReflectorMaterial
                    blur={[200, 50]}
                    resolution={512}
                    mixBlur={0.8}
                    mixStrength={80}
                    roughness={0.6}
                    depthScale={1.5}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#0a0a0f"
                    metalness={0.3}
                />
            </mesh>

            {/* 천장 */}
            <mesh position={[0, 5, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#0d0d14" roughness={0.9} />
            </mesh>

            {/* 뒷벽 */}
            <mesh position={[0, 1, -10]} receiveShadow>
                <planeGeometry args={[40, 16]} />
                <meshStandardMaterial color="#080810" roughness={0.8} metalness={0.1} />
            </mesh>

            {/* 측면 벽 L */}
            <mesh position={[-12, 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[20, 16]} />
                <meshStandardMaterial color="#06060e" roughness={0.85} />
            </mesh>

            {/* 측면 벽 R */}
            <mesh position={[12, 1, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[20, 16]} />
                <meshStandardMaterial color="#06060e" roughness={0.85} />
            </mesh>

            {/* 천장 프레임 구조물 */}
            {[-6, -2, 2, 6].map((x, i) => (
                <mesh key={i} position={[x, 4.9, 0]}>
                    <boxGeometry args={[0.06, 0.15, 20]} />
                    <meshStandardMaterial color="#111120" metalness={0.6} roughness={0.4} />
                </mesh>
            ))}

            {/* 책상/테이블 실루엣들 */}
            <DeskSet position={[-4, -2.5, -4]} />
            <DeskSet position={[4, -2.5, -4]} />
            <DeskSet position={[0, -2.5, -7]} />
        </group>
    )
}

function DeskSet({ position }) {
    return (
        <group position={position}>
            {/* 테이블 상판 */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                <boxGeometry args={[2.4, 0.06, 1.2]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.6} />
            </mesh>
            {/* 다리 4개 */}
            {[[-1.1, 0, -0.5], [1.1, 0, -0.5], [-1.1, 0, 0.5], [1.1, 0, 0.5]].map((p, i) => (
                <mesh key={i} position={p} castShadow>
                    <boxGeometry args={[0.06, 1, 0.06]} />
                    <meshStandardMaterial color="#0f0f1a" metalness={0.6} roughness={0.4} />
                </mesh>
            ))}
            {/* 모니터 실루엣 */}
            <mesh castShadow position={[0, 1.1, -0.4]}>
                <boxGeometry args={[1.2, 0.7, 0.04]} />
                <meshStandardMaterial color="#0d0d1a" metalness={0.5} roughness={0.3} emissive="#000530" emissiveIntensity={0.3} />
            </mesh>
        </group>
    )
}

// ─── 마우스 반응 카메라 ──────────────────────────────────────────────────
function CameraRig() {
    const vec = useMemo(() => new THREE.Vector3(), [])
    useFrame((state) => {
        if (!state.camera) return
        const { mouse } = state
        vec.set(mouse.x * 3, 1 + mouse.y * 1.5, 8)
        state.camera.position.lerp(vec, 0.03)
        state.camera.lookAt(0, -1, -3)
    })
    return null
}

// ─── 메인 씬 ─────────────────────────────────────────────────────────────
export default function Scene3D() {
    // 천장 LED 패널 배치 (세로줄 × 가로 위치)
    const ledPanels = [
        // 앞줄
        { pos: [-6, 4.85, -1], delay: 200, color: '#d0e8ff' },
        { pos: [-2, 4.85, -1], delay: 500, color: '#c8e0ff' },
        { pos: [2, 4.85, -1], delay: 350, color: '#d4ecff' },
        { pos: [6, 4.85, -1], delay: 650, color: '#cce4ff' },
        // 중간줄
        { pos: [-6, 4.85, -5], delay: 800, color: '#d0e8ff' },
        { pos: [-2, 4.85, -5], delay: 1000, color: '#c8e0ff' },
        { pos: [2, 4.85, -5], delay: 900, color: '#d4ecff' },
        { pos: [6, 4.85, -5], delay: 1100, color: '#cce4ff' },
        // 뒷줄
        { pos: [-4, 4.85, -8], delay: 1400, color: '#d0e8ff' },
        { pos: [0, 4.85, -8], delay: 1600, color: '#c8e0ff' },
        { pos: [4, 4.85, -8], delay: 1500, color: '#d4ecff' },
    ]

    return (
        <div style={{
            width: '100%', height: '100vh',
            position: 'absolute', top: 0, left: 0, zIndex: 0
        }}>
            <Canvas
                dpr={[1, 1.5]}
                shadows
                camera={{ position: [0, 1.5, 8], fov: 50 }}
                gl={{ antialias: true, alpha: false }}
            >
                {/* 초기 환경: 완전 암흑 */}
                <color attach="background" args={['#000005']} />
                <fog attach="fog" args={['#000010', 8, 30]} />

                {/* 최소 앰비언트 - 완전 암흑 느낌 */}
                <ambientLight intensity={0.04} />

                {/* ── 천장 LED 패널 조명들 ── */}
                {ledPanels.map((p, i) => (
                    <LEDPanel
                        key={i}
                        position={p.pos}
                        delay={p.delay}
                        color={p.color}
                        size={[1.8, 0.04, 0.45]}
                    />
                ))}

                {/* ── 회전 스포트라이트 (LOOV 브랜드 컬러) ── */}
                <RotatingSpotLight position={[-5, 4.5, 2]} color="#00c8ff" delay={1800} />
                <RotatingSpotLight position={[5, 4.5, 2]} color="#00a0ff" delay={2200} />
                <RotatingSpotLight position={[0, 4.5, -3]} color="#40d0ff" delay={2600} />

                {/* ── 사무 공간 구조물 ── */}
                <OfficeStructure />

                {/* ── 마우스 반응 카메라 ── */}
                <CameraRig />
            </Canvas>
        </div>
    )
}
