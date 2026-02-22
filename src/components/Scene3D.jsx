import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, OrbitControls, ContactShadows, SoftShadows } from '@react-three/drei'
import * as THREE from 'three'

function LEDGrid({ color = "#ffffff", intensity = 5, ...props }) {
    const ref = useRef()

    useFrame((state, delta) => {
        ref.current.rotation.y += delta * 0.2
        ref.current.rotation.z += delta * 0.1
        // Pulsate the light slightly to emulate a living LED
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 1
        ref.current.children.forEach(child => {
            if (child.isPointLight) {
                child.intensity = intensity * pulse
            }
            if (child.material && child.material.emissiveIntensity) {
                child.material.emissiveIntensity = intensity * 0.5 * pulse;
            }
        })
    })

    // Create a sleek modern LED fixture shape
    return (
        <group ref={ref} {...props}>
            <mesh castShadow receiveShadow>
                {/* Main Body */}
                <boxGeometry args={[4, 0.4, 4]} />
                <meshStandardMaterial
                    color="#111111"
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Glow Panel underneath */}
            <mesh position={[0, -0.21, 0]}>
                <boxGeometry args={[3.8, 0.05, 3.8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={intensity * 0.5}
                    toneMapped={false}
                />
            </mesh>

            {/* Point Light to cast actual light in the scene */}
            <pointLight
                position={[0, -0.5, 0]}
                intensity={intensity}
                color={color}
                distance={20}
                castShadow
                decay={2}
            />
            {/* Accent Light pointing up slightly */}
            <pointLight
                position={[0, 1, 0]}
                intensity={intensity * 0.1}
                color={color}
                distance={10}
                decay={2}
            />
        </group>
    )
}

function SceneEnvironment() {
    return (
        <group>
            <mesh receiveShadow position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#09090b" roughness={1} metalness={0} />
            </mesh>
        </group>
    )
}

export default function Scene3D() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <Canvas shadows camera={{ position: [5, 2, 10], fov: 45 }}>
                <SoftShadows size={20} samples={10} focus={0.5} />
                <color attach="background" args={['#050505']} />
                <fog attach="fog" args={['#050505', 5, 20]} />

                {/* Subtle ambient light to keep dark atmosphere */}
                <ambientLight intensity={0.1} color="#ffffff" />

                <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                    <LEDGrid position={[0, 1, 0]} color="#ffffff" intensity={15} />
                </Float>

                <SceneEnvironment />
                <ContactShadows position={[0, -2.99, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#000000" />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2 - 0.1} />

                {/* Postprocessing or environment if needed, but keeping it vanilla ensures speed & beauty */}
            </Canvas>
        </div>
    )
}
