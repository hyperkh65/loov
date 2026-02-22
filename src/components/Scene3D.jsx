import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, MeshReflectorMaterial, Environment, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing'

// Transparent interactive crystal ring
function CrystalLedRing({ radius, thickness, color, speed, startingRot = [0, 0, 0], invert = false }) {
    const groupRef = useRef()
    const [hovered, setHover] = useState(false)
    useCursor(hovered)

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime()
        const mouseX = state.mouse.x * 0.5
        const mouseY = state.mouse.y * 0.5

        // Core rotation
        groupRef.current.rotation.x += delta * speed * 0.15 + mouseY * 0.01
        groupRef.current.rotation.y += delta * speed * 0.25 + mouseX * 0.01
        groupRef.current.rotation.z += delta * speed * 0.1

        // Pulsing scale
        const targetScale = hovered ? 1.1 : 1
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    })

    return (
        <group
            ref={groupRef}
            rotation={startingRot}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <mesh>
                <torusGeometry args={[radius, thickness, 64, 128]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={1}
                    opacity={1}
                    metalness={0.2}
                    roughness={0.05}
                    ior={1.7}
                    thickness={0.8}
                    specularIntensity={3}
                    clearcoat={1}
                />
            </mesh>

            <mesh>
                <torusGeometry args={[radius * (invert ? 1.05 : 0.98), thickness * 0.3, 32, 128]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 8 : 4.5}
                    toneMapped={false}
                />
            </mesh>

            <pointLight color={color} intensity={hovered ? 8 : 4} distance={15} />
        </group>
    )
}

function SpectacularFloor() {
    return (
        <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
                blur={[400, 100]}
                resolution={2048}
                mixBlur={1}
                mixStrength={80}
                roughness={0.1}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#050505"
                metalness={0.9}
                mirror={1}
            />
        </mesh>
    )
}

function CinematicCamera() {
    const { camera, mouse } = useThree()
    useFrame(() => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 4, 0.05)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1 + mouse.y * 3, 0.05)
        camera.lookAt(0, 0, 0)
    })
    return null
}

export default function Scene3D() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0, background: '#000' }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1, 15], fov: 40 }}>
                <color attach="background" args={['#000000']} />
                <fog attach="fog" args={['#000000', 10, 40]} />
                <ambientLight intensity={0.1} />
                <Environment preset="night" />

                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
                    <group position={[0, 0, 0]}>
                        <CrystalLedRing radius={2} thickness={0.4} color="#00f2ff" speed={1} />
                        <CrystalLedRing radius={3.5} thickness={0.2} color="#7000ff" speed={-0.6} startingRot={[Math.PI / 4, Math.PI / 4, 0]} />
                        <CrystalLedRing radius={5} thickness={0.12} color="#ffffff" speed={0.4} invert startingRot={[-Math.PI / 6, Math.PI / 2, 0]} />
                    </group>
                </Float>

                <SpectacularFloor />
                <Sparkles count={600} scale={20} size={2} speed={0.3} color="#00f2ff" />
                <Sparkles count={300} scale={30} size={4} speed={0.1} color="#7000ff" />

                <CinematicCamera />

                <EffectComposer multisampling={8}>
                    <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.7} />
                    <ToneMapping />
                    <Vignette offset={0.1} darkness={1.2} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}
