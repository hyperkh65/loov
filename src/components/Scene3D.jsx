import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, MeshReflectorMaterial, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'

// A high-end floating LED ring
function GlowingRing({ radius, thickness, color, speed, startingRot = [0, 0, 0], ...props }) {
    const ref = useRef()
    useFrame((state, delta) => {
        ref.current.rotation.x += delta * speed * 0.1
        ref.current.rotation.y += delta * speed * 0.2
        ref.current.rotation.z += delta * speed * 0.3
    })

    return (
        <group ref={ref} rotation={startingRot} {...props}>
            {/* Outer Sleek Metallic/Glass casing */}
            <mesh>
                <torusGeometry args={[radius, thickness, 64, 128]} />
                <meshStandardMaterial
                    color="#111111"
                    roughness={0.2}
                    metalness={1.0}
                    envMapIntensity={2}
                />
            </mesh>
            {/* Inner Glowing LED track */}
            <mesh position={[0, 0, thickness * 0.4]}>
                <torusGeometry args={[radius, thickness * 0.15, 32, 128]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={5}
                    toneMapped={false}
                />
            </mesh>
            {/* Ambient pulse cast down onto the floor */}
            <pointLight distance={15} color={color} intensity={2} decay={2} />
        </group>
    )
}

// Highly reflective sleek dark floor
function Ground() {
    return (
        <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
                blur={[300, 100]}
                resolution={2048}
                mixBlur={1}
                mixStrength={80}
                roughness={0.15}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#050505"
                metalness={0.9}
                mirror={0.8}
            />
        </mesh>
    )
}

function FloatingParticles() {
    return (
        <Sparkles
            count={200}
            scale={18}
            size={3}
            speed={0.4}
            opacity={0.8}
            color="#FFD700"
            noise={10}
        />
    )
}

// Interactive camera rig for subtle parallax on mouse move
function CameraRig() {
    const { camera, mouse } = useThree()
    useFrame((state) => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 2, 0.05)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1 + mouse.y * 1, 0.05)
        camera.lookAt(0, 0, 0)
    })
    return null
}

export default function Scene3D() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0, background: '#000' }}>
            <Canvas shadows camera={{ position: [0, 1, 12], fov: 45 }}>
                <color attach="background" args={['#020202']} />
                <fog attach="fog" args={['#020202', 8, 30]} />

                {/* Mood lighting */}
                <ambientLight intensity={0.1} color="#ffffff" />
                <directionalLight position={[5, 10, 2]} intensity={0.5} color="#aaaaaa" />

                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
                    <group position={[0, -0.5, 0]}>
                        <GlowingRing radius={2.5} thickness={0.4} color="#FFD700" speed={0.8} />
                        <GlowingRing radius={3.8} thickness={0.3} color="#ffffff" speed={-0.6} startingRot={[Math.PI / 4, 0, 0]} />
                        <GlowingRing radius={5.2} thickness={0.15} color="#8ab4f8" speed={0.4} startingRot={[0, Math.PI / 3, Math.PI / 6]} />
                    </group>
                </Float>

                <Ground />
                <FloatingParticles />

                <CameraRig />

                <EffectComposer disableNormalPass>
                    {/* The magical glow effect for emissive materials */}
                    <Bloom luminanceThreshold={1} mipmapBlur intensity={2.0} />
                    <ToneMapping />
                </EffectComposer>
            </Canvas>
        </div>
    )
}
