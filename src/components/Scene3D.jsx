import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshReflectorMaterial, Environment, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

// A soft, architectural glowing curve (resembles LOOV's coved lighting)
function ArchitecturalLight({ radius, thickness, color, speed, rotation = [0, 0, 0], scale = 1 }) {
    const meshRef = useRef()

    useFrame((state) => {
        const time = state.clock.getElapsedTime()
        // Subtly pulse the light to make it feel "alive"
        const pulse = 1 + Math.sin(time * speed) * 0.2
        meshRef.current.material.emissiveIntensity = 4 * pulse

        // Gentle rotation for dynamic feel
        meshRef.current.rotation.z += 0.001 * speed
        meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1
    })

    return (
        <group rotation={rotation} scale={scale}>
            <mesh ref={meshRef}>
                <torusGeometry args={[radius, thickness, 32, 100, Math.PI * 0.8]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            {/* Soft glow aura */}
            <mesh scale={1.1}>
                <torusGeometry args={[radius, thickness * 2, 16, 50, Math.PI * 0.8]} />
                <meshBasicMaterial color={color} transparent opacity={0.05} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    )
}

function PolishedFloor() {
    return (
        <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
                blur={[300, 100]}
                resolution={1024}
                mixBlur={1}
                mixStrength={40}
                roughness={0.1}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#f8f7f2" // Matches warm beige background
                metalness={0.5}
            />
        </mesh>
    )
}

export default function Scene3D() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 12], fov: 45 }}>
                <color attach="background" args={['#edecea']} /> {/* Slightly darker warm beige for depth */}
                <fog attach="fog" args={['#edecea', 10, 40]} />

                <ambientLight intensity={0.5} />
                <Environment preset="studio" />

                <group position={[0, 1, 0]}>
                    {/* Main Living Light Arches - inspired by loov.co.kr */}
                    <ArchitecturalLight radius={5} thickness={0.08} color="#ffffff" speed={0.8} rotation={[Math.PI / 2, 0.5, 0]} />
                    <ArchitecturalLight radius={4.5} thickness={0.12} color="#a4c639" speed={1.2} rotation={[Math.PI / 2, -0.3, 0.5]} scale={0.9} />
                    <ArchitecturalLight radius={6} thickness={0.05} color="#a4c639" speed={0.5} rotation={[Math.PI / 2.2, 0.8, -0.2]} scale={1.2} />
                </group>

                {/* Sparkling particles for airy feel */}
                <Sparkles count={100} scale={15} size={2} speed={0.2} color="#a4c639" opacity={0.4} />

                <PolishedFloor />

                <EffectComposer multisampling={8}>
                    <Bloom luminanceThreshold={0.4} intensity={1.5} mipmapBlur radius={0.6} />
                    <Vignette offset={0.1} darkness={0.3} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}
