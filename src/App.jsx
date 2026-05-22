import { Canvas, useThree } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState } from 'react'

function Ball({ bodyRef }) {
  return (
    <RigidBody
      ref={bodyRef}
      colliders="ball"
      restitution={0.88}
      position={[0, 4, 0]}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.4, 64, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.0} />
      </mesh>
    </RigidBody>
  )
}

function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[0, -1.5, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial color="#0a3a73" roughness={0.3} metalness={0.0} />
      </mesh>
    </RigidBody>
  )
}

function Paddle({ groupRef, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 48]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.65} metalness={0} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]} castShadow>
        <cylinderGeometry args={[0.78, 0.78, 0.02, 48]} />
        <meshStandardMaterial color="#D7263D" roughness={0.85} metalness={0} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.04]} castShadow>
        <cylinderGeometry args={[0.78, 0.78, 0.02, 48]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0, -1, 0]} castShadow>
        <boxGeometry args={[0.25, 0.9, 0.35]} />
        <meshStandardMaterial color="#3a2418" roughness={0.55} metalness={0} />
      </mesh>
    </group>
  )
}

function Cinematic({ ballRef, paddleRef, onStrike }) {
  const { camera } = useThree()

  useGSAP(() => {
    const tl = gsap.timeline()

    tl.to(camera.position, {
      x: 0,
      y: 1.0,
      z: 3.8,
      duration: 1.5,
      ease: 'power2.inOut',
    }, 2.0)

    tl.to(paddleRef.current.position, {
      x: 0.7,
      y: -0.7,
      z: 0.5,
      duration: 1.0,
      ease: 'power3.in',
    }, 2.3)

    tl.to(paddleRef.current.rotation, {
      y: -0.1,
      z: 0.1,
      duration: 1.0,
      ease: 'power3.in',
    }, 2.3)

    tl.call(() => {
      ballRef.current?.applyImpulse({ x: -1.2, y: 3.5, z: 5 }, true)
      onStrike()
    }, [], 3.3)

    tl.to(camera.position, {
      x: 0,
      y: 1.8,
      z: 7,
      duration: 1.2,
      ease: 'power2.out',
    }, 3.4)
  }, [])

  return null
}

export default function App() {
  const ballRef = useRef()
  const paddleRef = useRef()
  const [nameVisible, setNameVisible] = useState(false)

  return (
    <>
      <Canvas shadows camera={{ position: [0, 1.5, 6], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[3, 5, 5]}
          intensity={2.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Physics gravity={[0, -9.81, 0]}>
          <Ball bodyRef={ballRef} />
          <Floor />
        </Physics>
        <Paddle
          groupRef={paddleRef}
          position={[2.5, 0.5, 0.3]}
          rotation={[0, -0.4, 0.4]}
        />
        <Cinematic
          ballRef={ballRef}
          paddleRef={paddleRef}
          onStrike={() => setNameVisible(true)}
        />
      </Canvas>

      <div className={`hud ${nameVisible ? 'visible' : ''}`}>
        <h1>RUDHAR BAJAJ</h1>
        <p>Rally · Code · Repeat</p>
      </div>
    </>
  )
}
