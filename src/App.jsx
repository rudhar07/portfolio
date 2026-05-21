import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'

function Ball() {
  return (
    <RigidBody colliders="ball" restitution={0.88} position={[0, 4, 0]}>
      <mesh>
        <sphereGeometry args={[0.4, 64, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.0} />
      </mesh>
    </RigidBody>
  )
}

function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[0, -1.5, 0]}>
      <mesh>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial color="#0a3a73" roughness={0.3} metalness={0.0} />
      </mesh>
    </RigidBody>
  )
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 5]} intensity={2.5} castShadow />
      <Physics gravity={[0, -9.81, 0]}>
        <Ball />
        <Floor />
      </Physics>
    </Canvas>
  )
}
