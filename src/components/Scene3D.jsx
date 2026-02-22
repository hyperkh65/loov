import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, MeshReflectorMaterial, Environment, ContactShadows, useDepthBuffer } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing'

// A spectacular glass and LED ring structure
function CrystalLedRing({ radius, thickness, color, speed, startingRot = [0, 0, 0], invert = false }) {
    const groupRef = useRef()

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime()
        groupRef.current.rotation.x += delta * speed * 0.15
        groupRef.current.rotation.y += delta * speed * 0.25
        groupRef.current.rotation.z += delta * speed * 0.1

        // Subtle pulsing of the group scale
        const scale = 1 + Math.sin(time * 2 + (radius)) * 0.02
        groupRef.current.scale.set(scale, scale, scale)
    })

    return (
        <group ref={groupRef} rotation={startingRot}>
            {/* The Outer Glass / Crystal Casing */}
            <mesh>
                <torusGeometry args={[radius, thickness, 64, 128]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={1} // Glass-like transparency
                    opacity={1}
                    metalness={0.1}
                    roughness={0.05}
                    ior={1.5}          // Index of refraction for glass
                    thickness={0.5}    // Volume thickness for refraction
                    specularIntensity={2}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>

            {/* The Inner Pure LED Light Source */}
            <mesh position={[0, 0, 0]}>
                <torusGeometry args={[radius * (invert ? 1.05 : 0.98), thickness * 0.2, 32, 128]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4.5}
                    toneMapped={false} // Prevents Bloom from washing out the core color
                />
            </mesh>

            {/* Glowing Aura sphere for extra volume scattered light */}
            <mesh scale={[radius * 2.1, radius * 2.1, thickness * 4]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.03} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>

            <pointLight color={color} intensity={5} distance={10} decay={2} />
        </group>
    )
}

function SpectacularFloor() {
    return (
        <mesh position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
                blur={[400, 100]}
                resolution={2048}
                mixBlur={1}
                mixStrength={100}
                roughness={0.1}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#020202"
                metalness={0.8}
                mirror={0.9} // Extremely reflective
            />
        </mesh>
    )
}

function CinematicCamera() {
    const { camera, mouse } = useThree()
    useFrame(() => {
        // Smooth cinematic parallax
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 3, 0.03)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1 + mouse.y * 2, 0.03)
        camera.lookAt(0, 0, 0)
    })
    return null
}

export default function Scene3D() {
    return (
        <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0, background: '#000' }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1, 14], fov: 40, near: 0.1, far: 100 }}>
                <color attach="background" args={['#000000']} />
                <fog attach="fog" args={['#000000', 10, 30]} />

                {/* Minimal ambient light so the glowing elements pop */}
                <ambientLight intensity={0.05} />

                {/* 
                  Environment map is crucial for glass/metal reflections. 
                  Using preset="city" provides sharp neon-like reflections perfect for tech themes.
                */}
                <Environment preset="city" />

                <Float speed={2} rotationIntensity={0.8} floatIntensity={1.5}>
                    <group position={[0, 0.5, 0]}>
                        {/* Core intense ring */}
                        <CrystalLedRing radius={1.8} thickness={0.4} color="#00ffff" speed={1.2} />
                        {/* Diagonal large ring */}
                        <CrystalLedRing radius={3.2} thickness={0.25} color="#8a2be2" speed={-0.8} startingRot={[Math.PI / 3, Math.PI / 4, 0]} />
                        {/* Outer accent ring */}
                        <CrystalLedRing radius={4.5} thickness={0.15} color="#ffffff" speed={0.5} invert startingRot={[-Math.PI / 6, Math.PI / 2, Math.PI / 8]} />
                    </group>
                </Float>

                <SpectacularFloor />

                <Sparkles count={400} scale={20} size={2.5} speed={0.2} opacity={0.6} color="#00ffff" />
                <Sparkles count={200} scale={20} size={4} speed={0.4} opacity={0.3} color="#8a2be2" />

                <CinematicCamera />

                {/* High-end post processing */}
                <EffectComposer disableNormalPass multisampling={8}>
                    {/* Bloom for the glowing effect on emissive materials */}
                    <Bloom
                        luminanceThreshold={0.5}
                        mipmapBlur
                        intensity={2.5}
                        radius={0.8}
                    />
                    <ToneMapping />
                    {/* Vignette to draw eyes to the center */}
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}
