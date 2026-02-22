import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── LED 다운라이트 + 빛 원뿔 ─────────────────────────────────────────
function Downlight({ position, color = '#fff8e7', delay = 0 }) {
    const spotRef = useRef()
    const pRef = useRef()
    const lensRef = useRef()
    const coneRef = useRef()
    const poolRef = useRef()  // 바닥의 빛 웅덩이
    const bright = useRef(0)
    const flickOn = useRef(false)
    const flickEnd = useRef(0)

    useEffect(() => {
        const t = setTimeout(() => {
            flickOn.current = true
            flickEnd.current = performance.now() + 1000
        }, delay)
        return () => clearTimeout(t)
    }, [delay])

    useFrame((_, delta) => {
        const now = performance.now()
        if (!spotRef.current) return

        if (flickOn.current) {
            bright.current = Math.min(bright.current + delta * 3, 1)
            const isFlickering = now < flickEnd.current
            const f = isFlickering
                ? (Math.random() > 0.3 ? bright.current : bright.current * 0.05)
                : 1.0

            const b = f

            spotRef.current.intensity = b * 130
            if (pRef.current) pRef.current.intensity = b * 35
            if (lensRef.current) lensRef.current.material.emissiveIntensity = b * 15

            // 빛 원뿔 가시화
            if (coneRef.current) {
                coneRef.current.material.opacity = b * 0.06
            }
            // 바닥 빛 웅덩이
            if (poolRef.current) {
                poolRef.current.material.opacity = b * 0.25
                poolRef.current.material.emissiveIntensity = b * 2
            }
        }
    })

    // 바닥 위치: position[1] = 4.88, 바닥 = -3 → 거리 = 7.88
    const floorY = -3 - position[1] + 0.02  // 상대 위치

    return (
        <group position={position}>
            {/* 하우징 */}
            <mesh>
                <cylinderGeometry args={[0.07, 0.09, 0.4, 16]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.15} />
            </mesh>

            {/* 냉각 핀 */}
            {[0, 60, 120, 180, 240, 300].map((d, i) => (
                <mesh key={i} position={[
                    Math.cos(d * Math.PI / 180) * 0.10,
                    0.05,
                    Math.sin(d * Math.PI / 180) * 0.10
                ]}>
                    <boxGeometry args={[0.012, 0.22, 0.012]} />
                    <meshStandardMaterial color="#0a0a0a" metalness={0.9} />
                </mesh>
            ))}

            {/* 렌즈 */}
            <mesh ref={lensRef} position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.065, 32]} />
                <meshStandardMaterial
                    color={color} emissive={color}
                    emissiveIntensity={0} toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0, -0.215, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.065, 0.09, 32]} />
                <meshStandardMaterial color="#050505" metalness={0.95} roughness={0.1} />
            </mesh>

            {/* ★ 빛 원뿔 (볼류메트릭 시뮬레이션) */}
            <mesh ref={coneRef} position={[0, floorY / 2 - 0.2, 0]}>
                <coneGeometry args={[
                    Math.abs(floorY) * 0.38,  // 바닥에서의 반지름
                    Math.abs(floorY),          // 높이
                    24, 1, true
                ]} />
                <meshBasicMaterial
                    color={color}
                    transparent opacity={0}
                    side={THREE.BackSide}
                    depthWrite={false}
                />
            </mesh>

            {/* 바닥 빛 웅덩이 */}
            <mesh ref={poolRef} position={[0, floorY + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[Math.abs(floorY) * 0.35, 32]} />
                <meshStandardMaterial
                    color={color} emissive={color}
                    emissiveIntensity={0} transparent opacity={0}
                    toneMapped={false} depthWrite={false}
                />
            </mesh>

            {/* 스팟라이트 (아래 방향) */}
            <spotLight
                ref={spotRef}
                position={[0, -0.25, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                color={color}
                intensity={0}
                angle={0.42}
                penumbra={0.8}
                distance={20}
                decay={1.5}
            />
            {/* 보조 포인트 라이트 */}
            <pointLight
                ref={pRef}
                position={[0, -0.3, 0]}
                color={color}
                intensity={0}
                distance={11}
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
    const beamRef = useRef()
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
        pivotRef.current.rotation.x = Math.sin(t * speed * 0.7) * 0.45 - 0.25

        spotRef.current.intensity = b * 100
        if (lensRef.current) lensRef.current.material.emissiveIntensity = b * 12
        if (beamRef.current) beamRef.current.material.opacity = b * 0.08
    })

    return (
        <group position={position}>
            <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
                <meshStandardMaterial color="#111" metalness={0.9} />
            </mesh>
            <group ref={pivotRef}>
                <mesh position={[0, -0.22, 0]}>
                    <cylinderGeometry args={[0.05, 0.065, 0.26, 16]} />
                    <meshStandardMaterial color="#0d0d0d" metalness={0.85} roughness={0.15} />
                </mesh>
                <mesh ref={lensRef} position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.045, 32]} />
                    <meshStandardMaterial
                        color={color} emissive={color}
                        emissiveIntensity={0} toneMapped={false}
                    />
                </mesh>
                {/* 빔 원뿔 */}
                <mesh ref={beamRef} position={[0, -1.5, 0]}>
                    <coneGeometry args={[0.7, 3, 20, 1, true]} />
                    <meshBasicMaterial
                        color={color} transparent opacity={0}
                        side={THREE.BackSide} depthWrite={false}
                    />
                </mesh>
                <spotLight
                    ref={spotRef}
                    position={[0, -0.38, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    color={color}
                    intensity={0}
                    angle={0.13}
                    penumbra={0.35}
                    distance={24}
                    decay={1.4}
                />
            </group>
        </group>
    )
}

// ─── 사무실 ───────────────────────────────────────────────────────────
function Office() {
    return (
        <group>
            {/* 바닥 (광택 타일) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
                <planeGeometry args={[50, 40]} />
                <meshStandardMaterial color="#0c0c1a" roughness={0.15} metalness={0.7} />
            </mesh>
            {/* 천장 */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.1, 0]}>
                <planeGeometry args={[50, 40]} />
                <meshStandardMaterial color="#060610" roughness={0.9} />
            </mesh>
            {/* 뒷벽 */}
            <mesh position={[0, 1, -13]}>
                <planeGeometry args={[50, 18]} />
                <meshStandardMaterial color="#05050e" roughness={0.75} metalness={0.1} />
            </mesh>
            {/* 좌/우벽 */}
            <mesh position={[-14, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[26, 18]} />
                <meshStandardMaterial color="#04040c" roughness={0.8} />
            </mesh>
            <mesh position={[14, 1, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[26, 18]} />
                <meshStandardMaterial color="#04040c" roughness={0.8} />
            </mesh>

            {/* 트랙 레일 */}
            {[-6, -2, 2, 6].map((x, i) => (
                <mesh key={i} position={[x, 4.95, -4]}>
                    <boxGeometry args={[0.07, 0.04, 22]} />
                    <meshStandardMaterial color="#141420" metalness={0.85} roughness={0.15} />
                </mesh>
            ))}

            {/* 책상들 */}
            {[[-5, -4], [0, -4], [5, -4], [-5, -7.5], [0, -7.5], [5, -7.5]].map(([x, z], i) => (
                <Desk key={i} position={[x, -3, z]} />
            ))}
        </group>
    )
}

function Desk({ position }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[2.2, 0.05, 0.95]} />
                <meshStandardMaterial color="#121225" roughness={0.4} metalness={0.3} />
            </mesh>
            {[[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, 0, lz]}>
                    <boxGeometry args={[0.05, 1.1, 0.05]} />
                    <meshStandardMaterial color="#0a0a1a" metalness={0.6} />
                </mesh>
            ))}
            <mesh position={[0, 1.14, -0.32]}>
                <boxGeometry args={[1.0, 0.62, 0.03]} />
                <meshStandardMaterial color="#050510" emissive="#081840" emissiveIntensity={2} />
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
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.8
                }}
            >
                <color attach="background" args={['#020209']} />
                <fog attach="fog" args={['#010109', 14, 40]} />

                <ambientLight intensity={0.12} color="#0d0d35" />

                {leds.map((l, i) => (
                    <Downlight key={i} position={l.pos} delay={l.delay} />
                ))}

                <RotatingSpot position={[-7, 4.85, 1.5]} color="#00c8ff" delay={1600} speed={0.32} />
                <RotatingSpot position={[7, 4.85, 1.5]} color="#0090ff" delay={1950} speed={-0.27} />
                <RotatingSpot position={[0, 4.85, -2]} color="#ffa040" delay={2300} speed={0.48} />

                <Office />
                <CameraRig />
            </Canvas>
        </div>
    )
}
