import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'

function Ball() {
  return (
    <RigidBody colliders="ball" restitution={0.88} position={[0, 4, 0]}>
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

function Paddle({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
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

export default function App() {
  return (
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
        <Ball />
        <Floor />
      </Physics>
      <Paddle position={[2.5, 0.5, 0.3]} rotation={[0, -0.4, 0.4]} />
    </Canvas>
  )
}
