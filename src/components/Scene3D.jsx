import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────
// 트랙 LED 조명 유닛 (사진과 동일한 형태)
// ─────────────────────────────────────────────
function TrackLED({ position, targetOffset = [0, 0, 0], color = '#fff5e0', delay = 0, intensity = 40, castShadow = false }) {
    const groupRef = useRef()
    const spotRef = useRef()
    const lensRef = useRef()
    const brightRef = useRef(0)
    const [on, setOn] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setOn(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    // 조명 방향: 타겟을 향해 회전
    const dir = useMemo(() => {
        const v = new THREE.Vector3(...targetOffset)
        v.normalize()
        return v
    }, [targetOffset])

    useFrame((state, delta) => {
        if (!spotRef.current || !lensRef.current) return

        // 밝기 애니메이션
        if (on) {
            brightRef.current = Math.min(brightRef.current + delta * 3.0, 1)
        }
        const b = brightRef.current

        // 플리커 (켜지는 중일 때만)
        const flicker = b < 0.9
            ? (Math.random() > 0.35 ? b : b * 0.15)
            : 1.0

        spotRef.current.intensity = flicker * intensity
        lensRef.current.material.emissiveIntensity = flicker * 10
    })

    return (
        <group ref={groupRef} position={position}>
            {/* 트랙 레일 조각 */}
            <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[0.25, 0.06, 0.06]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* 조명 마운트 브래킷 */}
            <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[0.08, 0.1, 0.08]} />
                <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* 조명 하우징 본체 (원통) */}
            <mesh position={[0, -0.32, 0]}>
                <cylinderGeometry args={[0.07, 0.085, 0.45, 16]} />
                <meshStandardMaterial color="#0d0d0d" metalness={0.85} roughness={0.15} />
            </mesh>

            {/* 냉각핀 (디테일) */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <mesh key={i} position={[
                    Math.cos(deg * Math.PI / 180) * 0.09,
                    -0.25,
                    Math.sin(deg * Math.PI / 180) * 0.09
                ]}>
                    <boxGeometry args={[0.015, 0.2, 0.015]} />
                    <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
                </mesh>
            ))}

            {/* 렌즈 (조명 on시 빛남) */}
            <mesh ref={lensRef} position={[0, -0.56, 0]}>
                <circleGeometry args={[0.065, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* 렌즈 외부 링 */}
            <mesh position={[0, -0.555, 0]}>
                <ringGeometry args={[0.065, 0.09, 32]} />
                <meshStandardMaterial color="#050505" metalness={0.95} roughness={0.1} />
            </mesh>

            {/* 실제 스포트라이트 */}
            <spotLight
                ref={spotRef}
                position={[0, -0.58, 0]}
                target-position={targetOffset}
                color={color}
                intensity={0}
                angle={0.35}
                penumbra={0.6}
                distance={20}
                decay={1.5}
                castShadow={castShadow}
                shadow-mapSize-width={512}
                shadow-mapSize-height={512}
            />
            {/* 보조 포인트라이트 - 주변 확실히 밝힘 */}
            <pointLight
                color={color}
                intensity={0}
                distance={12}
                decay={2}
                ref={(ref) => {
                    if (ref) {
                        ref.intensity = brightRef.current * (intensity * 0.3)
                    }
                }}
            />
        </group>
    )
}

// ─────────────────────────────────────────────
// 회전하는 스포트라이트 (연출용)
// ─────────────────────────────────────────────
function RotatingSpot({ position, color, delay, speed }) {
    const groupRef = useRef()
    const spotRef = useRef()
    const lensRef = useRef()
    const brightRef = useRef(0)
    const [on, setOn] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setOn(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    useFrame((state, delta) => {
        if (!groupRef.current || !spotRef.current) return
        if (on) brightRef.current = Math.min(brightRef.current + delta * 1.2, 1)
        const b = brightRef.current
        const t = state.clock.getElapsedTime()

        groupRef.current.rotation.y = t * speed
        groupRef.current.rotation.z = Math.sin(t * speed * 0.8) * 0.45

        spotRef.current.intensity = b * 25
        if (lensRef.current) lensRef.current.material.emissiveIntensity = b * 8
    })

    return (
        <group ref={groupRef} position={position}>
            <mesh>
                <cylinderGeometry args={[0.06, 0.09, 0.3, 16]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh ref={lensRef} position={[0, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.055, 32]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0} toneMapped={false} />
            </mesh>
            <spotLight
                ref={spotRef}
                color={color}
                intensity={0}
                angle={0.15}
                penumbra={0.4}
                distance={20}
                decay={1.5}
                castShadow
            />
        </group>
    )
}

// ─────────────────────────────────────────────
// 사무실 공간
// ─────────────────────────────────────────────
function Office() {
    return (
        <group>
            {/* 바닥 - 광택 타일 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
                <planeGeometry args={[40, 30]} />
                <meshStandardMaterial color="#0c0c18" roughness={0.3} metalness={0.5} />
            </mesh>

            {/* 천장 */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]} receiveShadow>
                <planeGeometry args={[40, 30]} />
                <meshStandardMaterial color="#070710" roughness={0.9} metalness={0} />
            </mesh>

            {/* 뒷벽 */}
            <mesh position={[0, 1, -12]} receiveShadow>
                <planeGeometry args={[40, 16]} />
                <meshStandardMaterial color="#06060f" roughness={0.8} metalness={0.05} />
            </mesh>

            {/* 좌측 벽 */}
            <mesh position={[-13, 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[24, 16]} />
                <meshStandardMaterial color="#060610" roughness={0.85} />
            </mesh>

            {/* 우측 벽 */}
            <mesh position={[13, 1, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[24, 16]} />
                <meshStandardMaterial color="#060610" roughness={0.85} />
            </mesh>

            {/* 천장 트랙 레일 (수평선) */}
            {[-6, -2, 2, 6].map((x, i) => (
                <mesh key={i} position={[x, 4.93, -4]} castShadow>
                    <boxGeometry args={[0.08, 0.05, 18]} />
                    <meshStandardMaterial color="#111118" metalness={0.8} roughness={0.2} />
                </mesh>
            ))}

            {/* 책상 배치 */}
            {[
                [-5, -4], [0, -4], [5, -4],
                [-5, -7.5], [0, -7.5], [5, -7.5],
            ].map(([x, z], i) => (
                <Desk key={i} position={[x, -3, z]} />
            ))}
        </group>
    )
}

function Desk({ position }) {
    return (
        <group position={position}>
            {/* 상판 */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.0, 0.05, 0.9]} />
                <meshStandardMaterial color="#141428" roughness={0.5} metalness={0.2} />
            </mesh>
            {/* 다리 */}
            {[[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, 0, lz]} castShadow>
                    <boxGeometry args={[0.05, 1.1, 0.05]} />
                    <meshStandardMaterial color="#0a0a18" metalness={0.6} roughness={0.4} />
                </mesh>
            ))}
            {/* 모니터 */}
            <mesh position={[0, 1.15, -0.3]} castShadow>
                <boxGeometry args={[0.9, 0.58, 0.03]} />
                <meshStandardMaterial
                    color="#050510"
                    emissive="#0a1540"
                    emissiveIntensity={1.5}
                />
            </mesh>
            {/* 모니터 스탠드 */}
            <mesh position={[0, 0.75, -0.3]} castShadow>
                <boxGeometry args={[0.04, 0.38, 0.04]} />
                <meshStandardMaterial color="#0a0a18" metalness={0.7} />
            </mesh>
        </group>
    )
}

// ─────────────────────────────────────────────
// 마우스 반응 카메라
// ─────────────────────────────────────────────
function CameraRig() {
    const vec = useMemo(() => new THREE.Vector3(), [])
    useFrame((state) => {
        vec.set(
            state.mouse.x * 2.5,
            0.8 + state.mouse.y * 1.2,
            9.5
        )
        state.camera.position.lerp(vec, 0.04)
        state.camera.lookAt(0, -0.5, -3)
    })
    return null
}

// ─────────────────────────────────────────────
// 메인 씬
// ─────────────────────────────────────────────
export default function Scene3D() {
    // 트랙 LED 배치 (트랙 레일 위 위치, 아래로 조명 방향)
    const trackLights = [
        // 앞줄 레일 (-6 x)
        { pos: [-6, 4.9, -1], target: [0, -8, 0], color: '#fff0d0', delay: 300, intensity: 45 },
        { pos: [-6, 4.9, -5], target: [0, -8, 0], color: '#ffe8c0', delay: 700, intensity: 45 },
        { pos: [-6, 4.9, -9], target: [0, -8, 0], color: '#fff5e0', delay: 1100, intensity: 40 },
        // (-2 x)
        { pos: [-2, 4.9, -1], target: [0, -8, 0], color: '#fff0d0', delay: 450, intensity: 45 },
        { pos: [-2, 4.9, -5], target: [0, -8, 0], color: '#ffe8c0', delay: 850, intensity: 45 },
        { pos: [-2, 4.9, -9], target: [0, -8, 0], color: '#fff5e0', delay: 1250, intensity: 40 },
        // (2 x)
        { pos: [2, 4.9, -1], target: [0, -8, 0], color: '#fff0d0', delay: 380, intensity: 45 },
        { pos: [2, 4.9, -5], target: [0, -8, 0], color: '#ffe8c0', delay: 780, intensity: 45 },
        { pos: [2, 4.9, -9], target: [0, -8, 0], color: '#fff5e0', delay: 1180, intensity: 40 },
        // (6 x)
        { pos: [6, 4.9, -1], target: [0, -8, 0], color: '#fff0d0', delay: 580, intensity: 45 },
        { pos: [6, 4.9, -5], target: [0, -8, 0], color: '#ffe8c0', delay: 980, intensity: 45 },
        { pos: [6, 4.9, -9], target: [0, -8, 0], color: '#fff5e0', delay: 1380, intensity: 40 },
    ]

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            zIndex: 0,
        }}>
            <Canvas
                shadows={{ type: THREE.PCFSoftShadowMap }}
                dpr={[1, 1.5]}
                camera={{ position: [0, 1, 9.5], fov: 50 }}
                gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}
            >
                <color attach="background" args={['#020208']} />
                <fog attach="fog" args={['#01010a', 12, 38]} />

                {/* 환경광 - 공간이 바로 보이도록 */}
                <ambientLight intensity={0.25} color="#0a0a30" />

                {/* ── 트랙 LED 조명 ── */}
                {trackLights.map((l, i) => (
                    <TrackLED
                        key={i}
                        position={l.pos}
                        targetOffset={l.target}
                        color={l.color}
                        delay={l.delay}
                        intensity={l.intensity}
                        castShadow={i < 3}  // 앞 3개만 그림자 (성능)
                    />
                ))}

                {/* ── LOOV 브랜드 회전 스포트라이트 ── */}
                <RotatingSpot position={[-7, 4.85, 2]} color="#00c8ff" delay={1600} speed={0.3} />
                <RotatingSpot position={[7, 4.85, 2]} color="#0090ff" delay={1900} speed={-0.25} />
                <RotatingSpot position={[0, 4.85, -2]} color="#40d0ff" delay={2200} speed={0.45} />

                {/* ── 사무실 ── */}
                <Office />

                {/* ── 카메라 리그 ── */}
                <CameraRig />
            </Canvas>
        </div>
    )
}
