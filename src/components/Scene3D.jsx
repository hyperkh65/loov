import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Safe pre-allocated vectors
const tempVec = new THREE.Vector3()

function InteractiveLightLine({ radius, thickness, color, speed, rotationOffset = [0, 0, 0], scale = 1 }) {
    const meshRef = useRef()
    const [hovered, setHover] = useState(false)

    useFrame((state) => {
        if (!meshRef.current || !meshRef.current.material) return

        const time = state.clock.getElapsedTime()
        const mouseX = state.mouse.x
        const mouseY = state.mouse.y

        // React to mouse: Rotation follow
        meshRef.current.rotation.x = rotationOffset[0] + mouseY * 0.1 + Math.sin(time * speed * 0.3) * 0.05
        meshRef.current.rotation.y = rotationOffset[1] + mouseX * 0.1 + Math.cos(time * speed * 0.3) * 0.05
        meshRef.current.rotation.z += 0.002 * speed

        // Breathing light effect
        const pulse = 1 + Math.sin(time * 1.5) * 0.2
        meshRef.current.material.emissiveIntensity = 4 * pulse * (hovered ? 1.5 : 1)

        // Dynamic scaling
        const s = scale * (hovered ? 1.05 : 1)
        tempVec.set(s, s, s)
        meshRef.current.scale.lerp(tempVec, 0.1)
    })

    return (
        <mesh
            ref={meshRef}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <torusGeometry args={[radius, thickness, 24, 64, Math.PI * 0.7]} />
            <meshStandardMaterial
                color="#ffffff"
                emissive={color}
                emissiveIntensity={4}
                transparent
                opacity={0.7}
                toneMapped={false}
            />
        </mesh>
    )
}

function Rig() {
    const { camera, mouse } = useThree()
    const vec = new THREE.Vector3()
    useFrame(() => {
        if (!camera) return
        vec.set(mouse.x * 1, 1 + mouse.y * 0.5, 10)
        camera.position.lerp(vec, 0.05)
        camera.lookAt(0, 0, 0)
    })
    return null
}

export default function Scene3D() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            {/* Ultra-stable canvas with minimum features to diagnose crash */}
            <Canvas dpr={[1, 1]} camera={{ position: [0, 2, 10], fov: 45 }}>
                <color attach="background" args={['#000000']} />

                <ambientLight intensity={0.6} />
                <pointLight position={[5, 5, 5]} intensity={1} />

                <group position={[0, 1, 0]}>
                    <InteractiveLightLine radius={5} thickness={0.03} color="#00f2ff" speed={0.4} rotationOffset={[Math.PI / 2, 0, 0]} />
                    <InteractiveLightLine radius={4.5} thickness={0.04} color="#a4c639" speed={0.6} rotationOffset={[Math.PI / 2.2, 0.5, 0.2]} scale={0.9} />
                </group>

                <Rig />
            </Canvas>
        </div>
    )
}
