import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

// ─── 뇌 GLB 모델 ─────────────────────────────────────────────────────
function BrainModel() {
    const { scene } = useGLTF('/brain.glb')
    const groupRef = useRef()

    // 모델 머티리얼을 사이버 느낌으로 변경
    useMemo(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: '#0a1628',
                    emissive: '#003355',
                    emissiveIntensity: 0.3,
                    metalness: 0.85,
                    roughness: 0.2,
                    wireframe: false,
                    transparent: true,
                    opacity: 0.92,
                })
                child.castShadow = true
                child.receiveShadow = true
            }
        })
    }, [scene])

    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.getElapsedTime()
        // 천천히 Y축 회전
        groupRef.current.rotation.y = t * 0.15
        // 살짝 부유
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.08
    })

    return (
        <group ref={groupRef} scale={2.8} position={[0, 0, 0]}>
            <primitive object={scene} />
        </group>
    )
}

// ─── 와이어프레임 오버레이 (같은 모델, 와이어프레임) ────────────────────
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
                    opacity: 0.06,
                })
            }
        })
        return clone
    }, [scene])

    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.getElapsedTime()
        groupRef.current.rotation.y = t * 0.15
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.08
    })

    return (
        <group ref={groupRef} scale={2.82} position={[0, 0, 0]}>
            <primitive object={cloned} />
        </group>
    )
}

// ─── 궤도 링 (사이버 아크) ─────────────────────────────────────────────
function OrbitalRing({ radius, speed, tilt, color, opacity = 0.3 }) {
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

// ─── 궤도 노드 ────────────────────────────────────────────────────────
function OrbitalNode({ radius, speed, tilt, phase, color, label }) {
    const meshRef = useRef()
    const glowRef = useRef()

    useFrame((state) => {
        if (!meshRef.current) return
        const t = state.clock.getElapsedTime()
        const a = t * speed + phase
        const x = Math.cos(a) * radius
        const z = Math.sin(a) * radius
        const y = Math.sin(a * 0.5) * radius * 0.3

        // 궤도 틸트 적용
        const ct = Math.cos(tilt), st = Math.sin(tilt)
        const fy = y * ct - z * st
        const fz = y * st + z * ct

        meshRef.current.position.set(x, fy, fz)
        if (glowRef.current) glowRef.current.position.set(x, fy, fz)
    })

    return (
        <>
            {/* 글로우 */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} />
            </mesh>
            {/* 노드 본체 */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3}
                    toneMapped={false}
                />
            </mesh>
        </>
    )
}

// ─── 파티클 필드 ──────────────────────────────────────────────────────
function ParticleField({ count = 300 }) {
    const ref = useRef()
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20
            pos[i * 3 + 1] = (Math.random() - 0.5) * 14
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20
        }
        return pos
    }, [count])

    useFrame((state) => {
        if (!ref.current) return
        ref.current.rotation.y = state.clock.getElapsedTime() * 0.02
    })

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial color="#00e5ff" size={0.03} transparent opacity={0.5} sizeAttenuation />
        </points>
    )
}

// ─── 카메라 리그 ──────────────────────────────────────────────────────
function CameraRig() {
    const vec = useMemo(() => new THREE.Vector3(), [])
    useFrame((state) => {
        vec.set(
            state.mouse.x * 2.0,
            0.3 + state.mouse.y * 1.0,
            7
        )
        state.camera.position.lerp(vec, 0.035)
        state.camera.lookAt(0, 0, 0)
    })
    return null
}

// ─── 메인 ─────────────────────────────────────────────────────────────
export default function Scene3D() {
    const NODES = [
        { radius: 3.2, speed: 0.35, tilt: 0.4, phase: 0, color: '#ff6b35', label: 'Market' },
        { radius: 3.6, speed: -0.28, tilt: 1.1, phase: 1.2, color: '#00e5ff', label: 'AI Core' },
        { radius: 2.8, speed: 0.45, tilt: 0.7, phase: 2.4, color: '#a855f7', label: 'Data' },
        { radius: 3.8, speed: -0.22, tilt: 1.5, phase: 0.8, color: '#facc15', label: 'LED' },
        { radius: 3.0, speed: 0.38, tilt: 0.2, phase: 3.5, color: '#22d3a0', label: 'Supply' },
        { radius: 3.4, speed: -0.40, tilt: 1.3, phase: 1.8, color: '#f43f5e', label: 'Bid' },
    ]

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas
                dpr={[1, 1.5]}
                camera={{ position: [0, 0.5, 7], fov: 45 }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.2,
                }}
            >
                <color attach="background" args={['#00020e']} />
                <fog attach="fog" args={['#00020e', 8, 22]} />

                {/* 조명 */}
                <ambientLight intensity={0.15} color="#0a0a40" />
                <directionalLight position={[5, 5, 5]} intensity={0.8} color="#4488cc" />
                <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#0066aa" />
                <pointLight position={[0, 0, 0]} intensity={2} color="#00e5ff" distance={8} decay={2} />

                <Suspense fallback={null}>
                    {/* 뇌 모델 */}
                    <BrainModel />
                    <BrainWireframe />

                    {/* 궤도 링 */}
                    <OrbitalRing radius={3.2} speed={0.2} tilt={0.3} color="#00e5ff" opacity={0.15} />
                    <OrbitalRing radius={3.6} speed={-0.15} tilt={1.0} color="#4488ff" opacity={0.1} />
                    <OrbitalRing radius={3.0} speed={0.25} tilt={0.6} color="#00bbcc" opacity={0.12} />

                    {/* 궤도 노드 */}
                    {NODES.map((n, i) => (
                        <OrbitalNode key={i} {...n} />
                    ))}

                    {/* 파티클 */}
                    <ParticleField />
                </Suspense>

                <CameraRig />
            </Canvas>
        </div>
    )
}

// Preload
useGLTF.preload('/brain.glb')
