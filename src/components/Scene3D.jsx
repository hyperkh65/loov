import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshReflectorMaterial, Environment, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'

// Highly interactive architectural light line
function InteractiveLightLine({ radius, thickness, color, speed, rotationOffset = [0, 0, 0], scale = 1 }) {
    const meshRef = useRef()
    const [hovered, setHover] = useState(false)

    useFrame((state) => {
        const time = state.clock.getElapsedTime()
        const mouseX = state.mouse.x
        const mouseY = state.mouse.y

        // React to mouse: Rotation follow
        meshRef.current.rotation.x = rotationOffset[0] + mouseY * 0.2 + Math.sin(time * speed * 0.5) * 0.1
        meshRef.current.rotation.y = rotationOffset[1] + mouseX * 0.2 + Math.cos(time * speed * 0.5) * 0.1
        meshRef.current.rotation.z += 0.005 * speed

        // Breathing light effect + Interaction glow
        const pulse = 1 + Math.sin(time * 2) * 0.3
        const hoverBoost = hovered ? 2 : 1
        meshRef.current.material.emissiveIntensity = 5 * pulse * hoverBoost

        // Dynamic scaling on interaction
        const targetScale = scale * (hovered ? 1.1 : 1)
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    })

    return (
        <mesh
            ref={meshRef}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <torusGeometry args={[radius, thickness, 32, 100, Math.PI * 0.7]} />
            <meshStandardMaterial
                color="#ffffff"
                emissive={color}
                emissiveIntensity={5}
                toneMapped={false}
                transparent
                opacity={0.8}
            />
        </mesh>
    )
}

function Rig() {
    const { camera, mouse } = useThree()
    const vec = new THREE.Vector3()
    return useFrame(() => {
        // Smooth camera movement based on mouse
        camera.position.lerp(vec.set(mouse.x * 2, 2 + mouse.y * 1, 12), 0.05)
        camera.lookAt(0, 0, 0)
    })
}

function Ground() {
    return (
        <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
                blur={[300, 100]}
                resolution={1024}
                mixBlur={1}
                mixStrength={60}
                roughness={1}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#050505"
                metalness={0.5}
            />
        </mesh>
    )
}

export default function Scene3D() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 12], fov: 45 }}>
                <color attach="background" args={['#000000']} />
                <fog attach="fog" args={['#000', 10, 35]} />

                <ambientLight intensity={0.2} />
                <Environment preset="night" />

                <group position={[0, 1, 0]}>
                    {/* Living Architectural Lights (inspired by loov.co.kr curves) but in Dark/Cyan/Lime */}
                    <InteractiveLightLine radius={5} thickness={0.05} color="#00f2ff" speed={0.5} rotationOffset={[Math.PI / 2, 0, 0]} scale={1} />
                    <InteractiveLightLine radius={4.5} thickness={0.08} color="#a4c639" speed={0.8} rotationOffset={[Math.PI / 2.2, 0.5, 0.2]} scale={0.9} />
                    <InteractiveLightLine radius={6} thickness={0.03} color="#ffffff" speed={0.3} rotationOffset={[Math.PI / 1.8, -0.4, -0.3]} scale={1.2} />
                </group>

                {/* Floating cyber particles */}
                <Sparkles count={80} scale={15} size={2} speed={0.3} color="#00f2ff" opacity={0.5} />

                <Ground />
                <Rig />

                <EffectComposer multisampling={8}>
                    <Bloom luminanceThreshold={0.5} intensity={2} mipmapBlur radius={0.8} />
                    <ChromaticAberration offset={[0.002, 0.002]} />
                    <Vignette offset={0.3} darkness={0.8} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}
