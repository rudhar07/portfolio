import { Canvas } from '@react-three/fiber'

function Ball() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial color="white" />
    </mesh>
  )
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <Ball />
    </Canvas>
  )
}
