import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

function Ball() {
  const ref = useRef()

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.5
    ref.current.rotation.x += delta * 0.1
  })

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.0} />
    </mesh>
  )
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 3, 5]} intensity={2.5} />
      <Ball />
    </Canvas>
  )
}
