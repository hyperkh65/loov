import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ─── 회전 스포트라이트 ──────────────────────────────────────────────────
function RotatingSpotlight() {
    const yGroupRef = useRef()  // Y축 회전 (수평 스윕)
    const spotRef = useRef()
    const lensRef = useRef()
    const coneRef = useRef()
    const bright = useRef(0)
    const flickEnd = useRef(performance.now() + 1100)

    useFrame((state, delta) => {
        const now = performance.now()
        bright.current = Math.min(bright.current + delta * 2.5, 1)

        const isFlicker = now < flickEnd.current
        const f = isFlicker
            ? (Math.random() > 0.3 ? bright.current : bright.current * 0.03)
            : 1.0

        // Y축 전체 회전 → 빔이 공간을 쓸고 지나감
        if (yGroupRef.current) {
            yGroupRef.current.rotation.y = state.clock.getElapsedTime() * 0.55
        }

        if (spotRef.current) spotRef.current.intensity = f * 320
        if (lensRef.current) lensRef.current.material.emissiveIntensity = f * 22
        if (coneRef.current) coneRef.current.material.opacity = f * 0.09
    })

    return (
        <group position={[0, 7.5, 0]}>
            {/* 천장 베이스 플레이트 */}
            <mesh>
                <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
                <meshStandardMaterial color="#141418" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Y축 회전 그룹 */}
            <group ref={yGroupRef}>
                {/* 브래킷 암 */}
                <mesh position={[0, -0.15, 0]}>
                    <boxGeometry args={[0.05, 0.2, 0.05]} />
                    <meshStandardMaterial color="#111" metalness={0.85} roughness={0.2} />
                </mesh>

                {/* 조명 헤드 (35° 앞으로 기울어짐) */}
                <group rotation={[0.6, 0, 0]} position={[0, -0.25, 0.05]}>
                    {/* 하우징 원통 */}
                    <mesh>
                        <cylinderGeometry args={[0.065, 0.085, 0.52, 16]} />
                        <meshStandardMaterial color="#0c0c0c" metalness={0.9} roughness={0.12} />
                    </mesh>

                    {/* 냉각핀 */}
                    {[0, 60, 120, 180, 240, 300].map((d, i) => (
                        <mesh key={i} position={[
                            Math.cos(d * Math.PI / 180) * 0.095,
                            0.08,
                            Math.sin(d * Math.PI / 180) * 0.095,
                        ]}>
                            <boxGeometry args={[0.012, 0.24, 0.012]} />
                            <meshStandardMaterial color="#090909" metalness={0.9} />
                        </mesh>
                    ))}

                    {/* 렌즈 반지름 링 */}
                    <mesh position={[0, -0.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.058, 0.085, 32]} />
                        <meshStandardMaterial color="#050505" metalness={0.95} roughness={0.1} />
                    </mesh>

                    {/* 렌즈 (빛날 때 발광) */}
                    <mesh ref={lensRef} position={[0, -0.275, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.057, 32]} />
                        <meshStandardMaterial
                            color="#cce8ff"
                            emissive="#aaddff"
                            emissiveIntensity={0}
                            toneMapped={false}
                            side={THREE.DoubleSide}
                        />
                    </mesh>

                    {/* 볼류메트릭 빛 원뿔 */}
                    <mesh ref={coneRef} position={[0, -4.5, 0]}>
                        <coneGeometry args={[2.1, 9, 32, 1, true]} />
                        <meshBasicMaterial
                            color="#c8e8ff"
                            transparent opacity={0}
                            side={THREE.BackSide}
                            depthWrite={false}
                        />
                    </mesh>

                    {/* 스포트라이트 */}
                    <spotLight
                        ref={spotRef}
                        position={[0, -0.3, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        color="#e8f6ff"
                        intensity={0}
                        angle={0.28}
                        penumbra={0.6}
                        distance={26}
                        decay={1.3}
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                    />
                </group>
            </group>
        </group>
    )
}

// ─── 반사 바닥 ─────────────────────────────────────────────────────────
function Floor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
            <planeGeometry args={[80, 80]} />
            <MeshReflectorMaterial
                blur={[400, 150]}
                resolution={512}
                mixBlur={1}
                mixStrength={80}
                roughness={0.45}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#050510"
                metalness={0.6}
            />
        </mesh>
    )
}

// ─── 벽 (어두운 배경) ─────────────────────────────────────────────────
function Room() {
    return (
        <>
            <mesh position={[0, -4.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 80]} />
                <meshStandardMaterial color="#030308" roughness={0.9} />
            </mesh>
            {/* 뒤 */}
            <mesh position={[0, 5, -20]}>
                <planeGeometry args={[80, 30]} />
                <meshStandardMaterial color="#02020a" roughness={0.8} />
            </mesh>
            {/* 좌 */}
            <mesh position={[-20, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[40, 30]} />
                <meshStandardMaterial color="#02020a" roughness={0.8} />
            </mesh>
            {/* 우 */}
            <mesh position={[20, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[40, 30]} />
                <meshStandardMaterial color="#02020a" roughness={0.8} />
            </mesh>
        </>
    )
}

// ─── 카메라 ───────────────────────────────────────────────────────────
function Camera() {
    const vec = new THREE.Vector3()
    useFrame((state) => {
        vec.set(state.mouse.x * 1.8, 0.3 + state.mouse.y * 0.8, 10)
        state.camera.position.lerp(vec, 0.04)
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
                camera={{ position: [0, 0.5, 10], fov: 45 }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.4,
                }}
            >
                <color attach="background" args={['#000005']} />
                <fog attach="fog" args={['#000005', 14, 45]} />

                <ambientLight intensity={0.04} color="#060630" />

                <RotatingSpotlight />
                <Floor />
                <Room />
                <Camera />
            </Canvas>
        </div>
    )
}
