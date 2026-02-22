import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ─── 핀 스포트라이트 + 볼류메트릭 빔 ─────────────────────────────────
function PinSpotlight() {
    const spotRef = useRef()
    const lensRef = useRef()
    const coneRef = useRef()
    const bright = useRef(0)
    const flickEnd = useRef(performance.now() + 1200)

    useFrame((_, delta) => {
        if (!spotRef.current) return
        const now = performance.now()

        bright.current = Math.min(bright.current + delta * 2.5, 1)
        const isFlicker = now < flickEnd.current
        const f = isFlicker
            ? (Math.random() > 0.35 ? bright.current : bright.current * 0.04)
            : 1.0

        spotRef.current.intensity = f * 200
        if (lensRef.current) lensRef.current.material.emissiveIntensity = f * 20
        if (coneRef.current) coneRef.current.material.opacity = f * 0.07
    })

    return (
        <group position={[0, 7, 0]}>
            {/* ── 조명 하우징 ── */}
            <mesh>
                <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
                <meshStandardMaterial color="#111" metalness={0.95} roughness={0.1} />
            </mesh>
            {/* 냉각핀 */}
            {[0, 60, 120, 180, 240, 300].map((d, i) => (
                <mesh key={i} position={[Math.cos(d * Math.PI / 180) * 0.09, 0.08, Math.sin(d * Math.PI / 180) * 0.09]}>
                    <boxGeometry args={[0.01, 0.28, 0.01]} />
                    <meshStandardMaterial color="#0a0a0a" metalness={0.9} />
                </mesh>
            ))}
            {/* 렌즈 */}
            <mesh ref={lensRef} position={[0, -0.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.058, 32]} />
                <meshStandardMaterial color="#ffffff" emissive="#e8f8ff" emissiveIntensity={0} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.265, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.058, 0.085, 32]} />
                <meshStandardMaterial color="#050505" metalness={0.95} />
            </mesh>
            {/* 케이블 */}
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 1.0, 6]} />
                <meshStandardMaterial color="#0a0a0a" />
            </mesh>

            {/* ─ 빛 원뿔 (볼류메트릭) ─ */}
            <mesh ref={coneRef} position={[0, -5.5, 0]}>
                <coneGeometry args={[2.0, 10.5, 32, 1, true]} />
                <meshBasicMaterial color="#d8efff" transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
            </mesh>

            {/* ─ 핀 스포트라이트 ─ */}
            <spotLight
                ref={spotRef}
                position={[0, -0.3, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                color="#f0f8ff"
                intensity={0}
                angle={0.22}
                penumbra={0.5}
                distance={22}
                decay={1.4}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
        </group>
    )
}

// ─── 3D LOOV 텍스트 (회전) ─────────────────────────────────────────────
function LOOVText() {
    const groupRef = useRef()
    const textRef = useRef()
    const glowRef = useRef()

    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.getElapsedTime()
        // Y축 천천히 회전
        groupRef.current.rotation.y = t * 0.3
        // 살짝 뜨고 내리는 부유 효과
        groupRef.current.position.y = -0.5 + Math.sin(t * 0.5) * 0.12
    })

    return (
        <group ref={groupRef} position={[0, -0.5, 0]}>
            {/* 메인 텍스트 */}
            <Text
                ref={textRef}
                fontSize={2.2}
                letterSpacing={0.08}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                castShadow
            >
                LOOV
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#aaddff"
                    emissiveIntensity={0.4}
                    metalness={0.8}
                    roughness={0.15}
                    toneMapped={false}
                />
            </Text>

            {/* 텍스트 뒷면 (그림자 받는 면) */}
            <Text
                fontSize={2.2}
                letterSpacing={0.08}
                color="#002244"
                anchorX="center"
                anchorY="middle"
                rotation={[0, Math.PI, 0]}
            >
                LOOV
                <meshStandardMaterial
                    color="#001122"
                    emissive="#001833"
                    emissiveIntensity={0.3}
                    metalness={0.6}
                    roughness={0.3}
                />
            </Text>
        </group>
    )
}

// ─── 반사 바닥 ─────────────────────────────────────────────────────────
function Floor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
            <planeGeometry args={[60, 60]} />
            <MeshReflectorMaterial
                blur={[300, 100]}
                resolution={512}
                mixBlur={0.9}
                mixStrength={60}
                roughness={0.5}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#06060f"
                metalness={0.5}
            />
        </mesh>
    )
}

// ─── 카메라 ───────────────────────────────────────────────────────────
function Camera() {
    const vec = useMemo(() => new THREE.Vector3(), [])
    useFrame((state) => {
        vec.set(state.mouse.x * 1.5, 0.5 + state.mouse.y * 0.8, 9)
        state.camera.position.lerp(vec, 0.03)
        state.camera.lookAt(0, 0, 0)
    })
    return null
}

// ─── 메인 ─────────────────────────────────────────────────────────────
export default function Scene3D() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas
                shadows
                dpr={[1, 1.5]}
                camera={{ position: [0, 0.5, 9], fov: 45 }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.2
                }}
            >
                <color attach="background" args={['#000005']} />
                <fog attach="fog" args={['#000005', 12, 40]} />

                {/* 최소 앰비언트 */}
                <ambientLight intensity={0.04} color="#050530" />

                {/* ── 단 하나의 핀 스포트라이트 ── */}
                <PinSpotlight />

                {/* ── LOOV 3D 회전 텍스트 ── */}
                <LOOVText />

                {/* ── 반사 바닥 ── */}
                <Floor />

                <Camera />
            </Canvas>
        </div>
    )
}
