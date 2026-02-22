import { useRef, useMemo, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ─── 뇌 모델 (작게 + 발광) ───────────────────────────────────────────
function BrainModel() {
    const { scene } = useGLTF('/brain.glb')
    const groupRef = useRef()
    const pulseRef = useRef(0)

    useMemo(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: '#0a1a30',
                    emissive: '#004488',
                    emissiveIntensity: 0.5,
                    metalness: 0.9,
                    roughness: 0.15,
                    transparent: true,
                    opacity: 0.88,
                })
                child.castShadow = true
            }
        })
    }, [scene])

    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.getElapsedTime()
        groupRef.current.rotation.y = t * 0.12
        groupRef.current.position.y = Math.sin(t * 0.4) * 0.06

        // 뇌 펄스 발광
        pulseRef.current = (Math.sin(t * 1.8) + 1) / 2
        scene.traverse((child) => {
            if (child.isMesh) {
                child.material.emissiveIntensity = 0.3 + pulseRef.current * 0.5
            }
        })
    })

    return (
        <group ref={groupRef} scale={1.8} position={[0, 0.1, 0]}>
            <primitive object={scene} />
        </group>
    )
}

// ─── 뇌 와이어프레임 (시안 글로우) ────────────────────────────────────
function BrainWireframe() {
    const { scene } = useGLTF('/brain.glb')
    const groupRef = useRef()
    const cloned = useMemo(() => {
        const clone = scene.clone(true)
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshBasicMaterial({
                    color: '#00e5ff',
                    wireframe: true,
                    transparent: true,
                    opacity: 0.05,
                })
            }
        })
        return clone
    }, [scene])

    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.getElapsedTime()
        groupRef.current.rotation.y = t * 0.12
        groupRef.current.position.y = Math.sin(t * 0.4) * 0.06
    })

    return (
        <group ref={groupRef} scale={1.82} position={[0, 0.1, 0]}>
            <primitive object={cloned} />
        </group>
    )
}

// ─── 뉴런 신호 (뇌 표면 위를 달리는 빛 펄스) ──────────────────────────
function NeuronPulses({ count = 18 }) {
    const meshRefs = useRef([])
    const data = useMemo(() =>
        Array.from({ length: count }, () => ({
            // 랜덤 궤도 파라미터
            r: 1.0 + Math.random() * 0.55,
            theta0: Math.random() * Math.PI * 2,
            phi0: (Math.random() - 0.5) * Math.PI * 0.9,
            speed: 0.6 + Math.random() * 1.4,
            phase: Math.random() * Math.PI * 2,
            color: new THREE.Color().setHSL(0.52 + Math.random() * 0.1, 0.9, 0.6),
        }))
        , [count])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        data.forEach((d, i) => {
            const mesh = meshRefs.current[i]
            if (!mesh) return
            const angle = d.theta0 + t * d.speed
            const phi = d.phi0 + Math.sin(t * d.speed * 0.7 + d.phase) * 0.5
            mesh.position.set(
                Math.cos(angle) * Math.cos(phi) * d.r,
                Math.sin(phi) * d.r + 0.1,
                Math.sin(angle) * Math.cos(phi) * d.r,
            )
            // 빛 깜빡임
            const blink = (Math.sin(t * 6 + d.phase) + 1) / 2
            mesh.material.emissiveIntensity = 2 + blink * 6
            mesh.scale.setScalar(0.6 + blink * 0.6)
        })
    })

    return (
        <group rotation={[0, 0, 0]}>
            {data.map((d, i) => (
                <mesh key={i} ref={(el) => (meshRefs.current[i] = el)}>
                    <sphereGeometry args={[0.028, 8, 8]} />
                    <meshStandardMaterial
                        color={d.color}
                        emissive={d.color}
                        emissiveIntensity={3}
                        toneMapped={false}
                        transparent
                        opacity={0.9}
                    />
                </mesh>
            ))}
        </group>
    )
}

// ─── 뉴런 트레일 라인 (뇌 표면 신경경로) ──────────────────────────────
function NeuronTrails({ count = 8 }) {
    const linesRef = useRef([])
    const trailData = useMemo(() =>
        Array.from({ length: count }, () => {
            const pts = []
            const segments = 30
            const startTheta = Math.random() * Math.PI * 2
            const startPhi = (Math.random() - 0.5) * Math.PI * 0.8
            const r = 1.05 + Math.random() * 0.3
            for (let j = 0; j <= segments; j++) {
                const t = j / segments
                const theta = startTheta + t * (0.8 + Math.random() * 1.5)
                const phi = startPhi + Math.sin(t * 3) * 0.3
                pts.push(new THREE.Vector3(
                    Math.cos(theta) * Math.cos(phi) * r,
                    Math.sin(phi) * r + 0.1,
                    Math.sin(theta) * Math.cos(phi) * r,
                ))
            }
            return {
                curve: new THREE.CatmullRomCurve3(pts),
                color: new THREE.Color().setHSL(0.5 + Math.random() * 0.12, 0.8, 0.55),
                speed: 0.3 + Math.random() * 0.5,
                phase: Math.random() * 10,
            }
        })
        , [count])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        trailData.forEach((td, i) => {
            const line = linesRef.current[i]
            if (!line) return
            // 반짝임 효과
            const pulse = (Math.sin(t * td.speed * 3 + td.phase) + 1) / 2
            line.material.opacity = 0.05 + pulse * 0.18
        })
    })

    return (
        <>
            {trailData.map((td, i) => {
                const pts = td.curve.getPoints(40)
                const geo = new THREE.BufferGeometry().setFromPoints(pts)
                return (
                    <line key={i} ref={(el) => (linesRef.current[i] = el)} geometry={geo}>
                        <lineBasicMaterial color={td.color} transparent opacity={0.1} />
                    </line>
                )
            })}
        </>
    )
}

// ─── 생각 노드 (좌우 배치 + 연결선 + 난반사) ──────────────────────────
const THOUGHT_NODES = [
    // 왼쪽
    { label: 'MARKET', x: -4.2, y: 1.4, z: -0.5, color: '#ff6b35' },
    { label: 'SUPPLY', x: -3.8, y: -0.3, z: 0.6, color: '#22d3a0' },
    { label: 'BID DATA', x: -4.5, y: 0.5, z: -1.2, color: '#f43f5e' },
    { label: 'ANALYSIS', x: -3.5, y: -1.5, z: 0.2, color: '#a855f7' },
    // 오른쪽
    { label: 'AI CORE', x: 4.0, y: 1.2, z: -0.3, color: '#00e5ff' },
    { label: 'LED DATA', x: 4.4, y: -0.5, z: 0.8, color: '#facc15' },
    { label: 'INTEL', x: 3.6, y: 0.8, z: -1.0, color: '#38bdf8' },
    { label: 'PRICING', x: 4.2, y: -1.3, z: 0.0, color: '#fb923c' },
]

function ThoughtNodes() {
    const groupRef = useRef()
    const nodesRef = useRef([])
    const linesRef = useRef([])

    // 연결선 지오메트리 (뇌 중심 → 각 노드)
    const lineGeos = useMemo(() =>
        THOUGHT_NODES.map((nd) => {
            const start = new THREE.Vector3(0, 0.1, 0)
            const end = new THREE.Vector3(nd.x, nd.y, nd.z)
            const mid1 = start.clone().lerp(end, 0.3).add(new THREE.Vector3(0, 0.4, 0))
            const mid2 = start.clone().lerp(end, 0.6).add(new THREE.Vector3(0, -0.2, 0))
            const curve = new THREE.CubicBezierCurve3(start, mid1, mid2, end)
            return new THREE.BufferGeometry().setFromPoints(curve.getPoints(40))
        })
        , [])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        THOUGHT_NODES.forEach((nd, i) => {
            const mesh = nodesRef.current[i]
            if (!mesh) return
            // 호버 동작 + 살짝 진동
            mesh.position.set(
                nd.x + Math.sin(t * 0.8 + i) * 0.12,
                nd.y + Math.cos(t * 0.6 + i * 1.3) * 0.1,
                nd.z + Math.sin(t * 0.5 + i * 0.7) * 0.08,
            )
            // 글로우 펄스
            const pulse = (Math.sin(t * 2.5 + i * 0.9) + 1) / 2
            mesh.material.emissiveIntensity = 2 + pulse * 5

            // 연결선 반짝
            const line = linesRef.current[i]
            if (line) {
                line.material.opacity = 0.06 + pulse * 0.15
            }
        })
    })

    return (
        <>
            {/* 연결선 (베지어 곡선) */}
            {lineGeos.map((geo, i) => (
                <line key={`l${i}`} ref={(el) => (linesRef.current[i] = el)} geometry={geo}>
                    <lineBasicMaterial
                        color={THOUGHT_NODES[i].color}
                        transparent opacity={0.1}
                    />
                </line>
            ))}

            {/* 노드 구체 */}
            {THOUGHT_NODES.map((nd, i) => (
                <group key={i}>
                    {/* 글로우 헤일로 */}
                    <mesh position={[nd.x, nd.y, nd.z]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshBasicMaterial color={nd.color} transparent opacity={0.08} />
                    </mesh>
                    {/* 메인 구체 */}
                    <mesh
                        ref={(el) => (nodesRef.current[i] = el)}
                        position={[nd.x, nd.y, nd.z]}
                    >
                        <sphereGeometry args={[0.065, 16, 16]} />
                        <meshStandardMaterial
                            color={nd.color}
                            emissive={nd.color}
                            emissiveIntensity={3}
                            toneMapped={false}
                        />
                    </mesh>
                </group>
            ))}
        </>
    )
}

// ─── 시냅스 스파크 (연결선 위를 달리는 빛) ─────────────────────────────
function SynapseSignals({ count = 12 }) {
    const meshRefs = useRef([])
    const data = useMemo(() =>
        Array.from({ length: count }, (_, i) => {
            const nodeIdx = i % THOUGHT_NODES.length
            const nd = THOUGHT_NODES[nodeIdx]
            const start = new THREE.Vector3(0, 0.1, 0)
            const end = new THREE.Vector3(nd.x, nd.y, nd.z)
            const mid1 = start.clone().lerp(end, 0.3).add(new THREE.Vector3(0, 0.4, 0))
            const mid2 = start.clone().lerp(end, 0.6).add(new THREE.Vector3(0, -0.2, 0))
            return {
                curve: new THREE.CubicBezierCurve3(start, mid1, mid2, end),
                speed: 0.15 + Math.random() * 0.25,
                phase: Math.random() * 10,
                color: new THREE.Color(nd.color),
                reverse: Math.random() > 0.5,
            }
        })
        , [])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        data.forEach((d, i) => {
            const mesh = meshRefs.current[i]
            if (!mesh) return
            let progress = ((t * d.speed + d.phase) % 1)
            if (d.reverse) progress = 1 - progress
            const pos = d.curve.getPoint(progress)
            mesh.position.copy(pos)
            // 밝기 — 중간이 가장 밝음
            const brightness = Math.sin(progress * Math.PI)
            mesh.material.emissiveIntensity = brightness * 8
            mesh.scale.setScalar(0.5 + brightness * 1.0)
        })
    })

    return (
        <>
            {data.map((d, i) => (
                <mesh key={i} ref={(el) => (meshRefs.current[i] = el)}>
                    <sphereGeometry args={[0.022, 8, 8]} />
                    <meshStandardMaterial
                        color={d.color}
                        emissive={d.color}
                        emissiveIntensity={4}
                        toneMapped={false}
                        transparent
                        opacity={0.9}
                    />
                </mesh>
            ))}
        </>
    )
}

// ─── 궤도 링 ──────────────────────────────────────────────────────────
function OrbitalRing({ radius, speed, tilt, color, opacity = 0.12 }) {
    const ref = useRef()
    const geo = useMemo(() => {
        const pts = []
        for (let i = 0; i <= 128; i++) {
            const a = (i / 128) * Math.PI * 2
            pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
        }
        return new THREE.BufferGeometry().setFromPoints(pts)
    }, [radius])

    useFrame((state) => {
        if (!ref.current) return
        ref.current.rotation.y = state.clock.getElapsedTime() * speed
    })

    return (
        <group rotation={[tilt, 0, 0]}>
            <line ref={ref} geometry={geo}>
                <lineBasicMaterial color={color} transparent opacity={opacity} />
            </line>
        </group>
    )
}

// ─── 배경 파티클 ──────────────────────────────────────────────────────
function ParticleField({ count = 400 }) {
    const ref = useRef()
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 24
            pos[i * 3 + 1] = (Math.random() - 0.5) * 16
            pos[i * 3 + 2] = (Math.random() - 0.5) * 24
        }
        return pos
    }, [count])

    useFrame((state) => {
        if (!ref.current) return
        ref.current.rotation.y = state.clock.getElapsedTime() * 0.015
    })

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial color="#00e5ff" size={0.025} transparent opacity={0.4} sizeAttenuation />
        </points>
    )
}

// ─── 카메라 리그 ──────────────────────────────────────────────────────
function CameraRig() {
    const vec = useMemo(() => new THREE.Vector3(), [])
    useFrame((state) => {
        vec.set(state.mouse.x * 2.5, 0.3 + state.mouse.y * 1.2, 8)
        state.camera.position.lerp(vec, 0.03)
        state.camera.lookAt(0, 0.1, 0)
    })
    return null
}

// ─── 메인 ─────────────────────────────────────────────────────────────
export default function Scene3D() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas
                dpr={[1, 1.5]}
                camera={{ position: [0, 0.5, 8], fov: 45 }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.3,
                }}
            >
                <color attach="background" args={['#00020e']} />
                <fog attach="fog" args={['#00020e', 10, 28]} />

                {/* 조명 */}
                <ambientLight intensity={0.12} color="#060828" />
                <directionalLight position={[4, 6, 4]} intensity={0.6} color="#3377bb" />
                <directionalLight position={[-3, 4, -3]} intensity={0.3} color="#005599" />
                <pointLight position={[0, 0.1, 0]} intensity={4} color="#00c8ff" distance={6} decay={2} />

                {/* 뇌 내부 글로우 라이트 */}
                <pointLight position={[0.3, 0.5, 0.2]} intensity={1.5} color="#0088ff" distance={3} decay={2} />
                <pointLight position={[-0.3, -0.2, 0.3]} intensity={1.2} color="#00ddff" distance={3} decay={2} />

                <Suspense fallback={null}>
                    {/* 뇌 모델 */}
                    <BrainModel />
                    <BrainWireframe />

                    {/* 뉴런 신호 (뇌 표면) */}
                    <NeuronPulses />
                    <NeuronTrails />

                    {/* 생각 노드 (좌우) + 연결선 */}
                    <ThoughtNodes />

                    {/* 시냅스 신호 (연결선 위를 달림) */}
                    <SynapseSignals />

                    {/* 궤도 링 */}
                    <OrbitalRing radius={2.4} speed={0.18} tilt={0.35} color="#00e5ff" opacity={0.1} />
                    <OrbitalRing radius={2.8} speed={-0.12} tilt={1.0} color="#3366cc" opacity={0.08} />
                    <OrbitalRing radius={2.1} speed={0.22} tilt={0.7} color="#00aacc" opacity={0.09} />

                    {/* 배경 파티클 */}
                    <ParticleField />
                </Suspense>

                <CameraRig />
            </Canvas>
        </div>
    )
}

useGLTF.preload('/brain.glb')
