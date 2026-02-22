import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── LED 천장 패널 ──────────────────────────────────────────────────────
function LEDPanel({ position, delay = 0, size = [1.8, 0.06, 0.45] }) {
    const meshRef = useRef()
    const lightRef = useRef()
    const brightness = useRef(0)
    const flickering = useRef(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            flickering.current = true
            // 켜진 후 2초 뒤 플리커 종료
            setTimeout(() => { flickering.current = false }, 1200)
        }, delay)
        return () => clearTimeout(timer)
    }, [delay])

    useFrame((state, delta) => {
        if (!meshRef.current || !lightRef.current) return
        const time = state.clock.getElapsedTime()

        if (flickering.current) {
            // 형광등 켜지는 플리커 효과
            const flicker = Math.random() > 0.3 ? 1 : 0.1
            brightness.current = Math.min(brightness.current + delta * 3, 1)
            const val = brightness.current * flicker
            lightRef.current.intensity = val * 14
            meshRef.current.material.emissiveIntensity = val * 4
        } else if (brightness.current > 0) {
            // 안정 상태 - 아주 미세한 떨림
            brightness.current = Math.min(brightness.current + delta * 2, 1)
            const stable = brightness.current * (1 + Math.sin(time * 80) * 0.008)
            lightRef.current.intensity = stable * 14
            meshRef.current.material.emissiveIntensity = stable * 4
        }
    })

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <boxGeometry args={size} />
                <meshStandardMaterial
                    color="#e8f0ff"
                    emissive="#c0d8ff"
                    emissiveIntensity={0}
                    toneMapped={false}
                />
            </mesh>
            <pointLight
                ref={lightRef}
                color="#d0e8ff"
                intensity={0}
                distance={10}
                decay={2}
            />
        </group>
    )
}

// ─── 회전 스포트라이트 (시안 LED 빔) ──────────────────────────────────
function SpotBeam({ position, color, delay, speed, axis = 'y' }) {
    const groupRef = useRef()
    const lightRef = useRef()
    const brightness = useRef(0)
    const [active, setActive] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setActive(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    useFrame((state, delta) => {
        if (!groupRef.current || !lightRef.current) return
        const time = state.clock.getElapsedTime()

        if (active) brightness.current = Math.min(brightness.current + delta * 1.5, 1)

        groupRef.current.rotation.y = time * speed
        groupRef.current.rotation.z = Math.sin(time * speed * 0.7) * 0.4

        lightRef.current.intensity = brightness.current * 20
        lightRef.current.distance = brightness.current * 18
    })

    return (
        <group ref={groupRef} position={position}>
            {/* 조명 하우징 */}
            <mesh>
                <cylinderGeometry args={[0.06, 0.1, 0.2, 12]} />
                <meshStandardMaterial color="#1a1a2a" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* 렌즈 */}
            <mesh position={[0, -0.12, 0]}>
                <circleGeometry args={[0.07, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={brightness.current * 5} toneMapped={false} />
            </mesh>
            <spotLight
                ref={lightRef}
                color={color}
                intensity={0}
                angle={0.18}
                penumbra={0.6}
                distance={0}
                decay={1.5}
            />
        </group>
    )
}

// ─── 사무실 공간 ──────────────────────────────────────────────────────
function Room() {
    const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#0a0a14',
        roughness: 0.4,
        metalness: 0.6,
    }), [])

    const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#080812',
        roughness: 0.85,
    }), [])

    const deskMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#111128',
        roughness: 0.6,
        metalness: 0.2,
    }), [])

    return (
        <group>
            {/* 바닥 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
                <planeGeometry args={[50, 50]} />
                <primitive object={floorMat} attach="material" />
            </mesh>
            {/* 천장 */}
            <mesh position={[0, 5.1, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#080812" roughness={0.9} />
            </mesh>
            {/* 뒷벽 */}
            <mesh position={[0, 1, -12]}>
                <planeGeometry args={[50, 18]} />
                <primitive object={wallMat} attach="material" />
            </mesh>
            {/* 좌벽 */}
            <mesh position={[-14, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[25, 18]} />
                <primitive object={wallMat} attach="material" />
            </mesh>
            {/* 우벽 */}
            <mesh position={[14, 1, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[25, 18]} />
                <primitive object={wallMat} attach="material" />
            </mesh>

            {/* 천장 프레임 그리드 */}
            {[-6, -2, 2, 6].map((x, i) => (
                <mesh key={`frame-x-${i}`} position={[x, 4.95, 0]}>
                    <boxGeometry args={[0.05, 0.12, 22]} />
                    <meshStandardMaterial color="#0d0d1e" metalness={0.7} roughness={0.3} />
                </mesh>
            ))}
            {[-8, -4, 0, -12].map((z, i) => (
                <mesh key={`frame-z-${i}`} position={[0, 4.95, z]}>
                    <boxGeometry args={[28, 0.12, 0.05]} />
                    <meshStandardMaterial color="#0d0d1e" metalness={0.7} roughness={0.3} />
                </mesh>
            ))}

            {/* 책상 배치 */}
            {[[-5, -4], [0, -4], [5, -4], [-5, -8], [0, -8], [5, -8]].map(([x, z], i) => (
                <group key={`desk-${i}`} position={[x, -2.5, z]}>
                    {/* 테이블 상판 */}
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[2.2, 0.05, 1.0]} />
                        <primitive object={deskMat} attach="material" />
                    </mesh>
                    {/* 다리 */}
                    {[[-1, 0, -0.4], [1, 0, -0.4], [-1, 0, 0.4], [1, 0, 0.4]].map((leg, j) => (
                        <mesh key={j} position={leg}>
                            <boxGeometry args={[0.05, 1, 0.05]} />
                            <meshStandardMaterial color="#0a0a18" metalness={0.5} />
                        </mesh>
                    ))}
                    {/* 모니터 */}
                    <mesh position={[0, 1.15, -0.34]}>
                        <boxGeometry args={[1.0, 0.65, 0.03]} />
                        <meshStandardMaterial
                            color="#050510"
                            emissive="#000820"
                            emissiveIntensity={1}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

// ─── 마우스 반응 카메라 ──────────────────────────────────────────────────
function CameraRig() {
    const vec = useMemo(() => new THREE.Vector3(), [])
    useFrame((state) => {
        vec.set(
            state.mouse.x * 2.5,
            0.5 + state.mouse.y * 1.5,
            9
        )
        state.camera.position.lerp(vec, 0.04)
        state.camera.lookAt(0, -0.5, -4)
    })
    return null
}

// ─── 메인 씬 ──────────────────────────────────────────────────────────────
export default function Scene3D() {
    // LED 패널 위치 배열
    const panels = [
        // 앞줄
        { pos: [-6, 4.88, -1], delay: 300 },
        { pos: [-2, 4.88, -1], delay: 550 },
        { pos: [2, 4.88, -1], delay: 420 },
        { pos: [6, 4.88, -1], delay: 700 },
        // 중간줄
        { pos: [-6, 4.88, -5], delay: 850 },
        { pos: [-2, 4.88, -5], delay: 1050 },
        { pos: [2, 4.88, -5], delay: 950 },
        { pos: [6, 4.88, -5], delay: 1150 },
        // 뒷줄
        { pos: [-4, 4.88, -9], delay: 1350 },
        { pos: [0, 4.88, -9], delay: 1500 },
        { pos: [4, 4.88, -9], delay: 1420 },
    ]

    return (
        <div style={{
            width: '100%', height: '100vh',
            position: 'absolute', top: 0, left: 0, zIndex: 0
        }}>
            <Canvas
                dpr={[1, 1.5]}
                camera={{ position: [0, 1, 9], fov: 55 }}
                gl={{ antialias: true }}
            >
                <color attach="background" args={['#030308']} />
                <fog attach="fog" args={['#010108', 10, 35]} />

                {/* 극소 앰비언트 - 완전 암흑 */}
                <ambientLight intensity={0.05} color="#101030" />

                {/* 천장 LED 패널들 */}
                {panels.map((p, i) => (
                    <LEDPanel key={i} position={p.pos} delay={p.delay} />
                ))}

                {/* 회전 스포트라이트 (브랜드 컬러 빔) */}
                <SpotBeam position={[-6, 4.6, 1]} color="#00c8ff" delay={1700} speed={0.35} />
                <SpotBeam position={[6, 4.6, 1]} color="#00aaff" delay={2100} speed={-0.28} />
                <SpotBeam position={[0, 4.6, -3]} color="#40d0ff" delay={2500} speed={0.5} />

                {/* 사무실 공간 */}
                <Room />

                {/* 마우스 반응 카메라 */}
                <CameraRig />
            </Canvas>
        </div>
    )
}
