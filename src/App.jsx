import { Canvas, useThree } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Howl } from 'howler'
import { useRef, useState } from 'react'

const USE_GLTF_PADDLE = false
const PADDLE_MODEL_PATH = '/models/paddle.glb'

const pock = new Howl({
  src: ['/sounds/pock.mp3'],
  volume: 0.6,
  preload: true,
})

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

function PaddleGLTF({
  groupRef,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  modelScale = 1,
  modelRotation = [0, 0, 0],
  modelPosition = [0, 0, 0],
}) {
  const { scene } = useGLTF(PADDLE_MODEL_PATH)

  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive
        object={scene}
        scale={modelScale}
        rotation={modelRotation}
        position={modelPosition}
      />
    </group>
  )
}

function Cinematic({ ballRef, paddleRef, onStrike }) {
  const { camera } = useThree()

  useGSAP(() => {
    ballRef.current?.setTranslation({ x: 0, y: 5, z: 0 }, true)
    ballRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true)
    ballRef.current?.setAngvel({ x: 0, y: 0, z: 0 }, true)

    const tl = gsap.timeline()

    tl.to(camera.position, {
      x: 0,
      y: 1.0,
      z: 3.8,
      duration: 1.5,
      ease: 'power2.inOut',
    }, 1.5)

    tl.to(paddleRef.current.position, {
      x: 0.7,
      y: -0.7,
      z: 0.5,
      duration: 1.0,
      ease: 'power3.in',
    }, 1.8)

    tl.to(paddleRef.current.rotation, {
      y: -0.1,
      z: 0.1,
      duration: 1.0,
      ease: 'power3.in',
    }, 1.8)

    tl.call(() => {
      ballRef.current?.applyImpulse({ x: -1.2, y: 3.5, z: 5 }, true)
      pock.play()
      onStrike()
    }, [], 2.8)

    tl.to(camera.position, {
      x: 0,
      y: 1.8,
      z: 7,
      duration: 1.2,
      ease: 'power2.out',
    }, 2.9)
  }, [])

  return null
}

export default function App() {
  const ballRef = useRef()
  const paddleRef = useRef()
  const [started, setStarted] = useState(false)
  const [nameVisible, setNameVisible] = useState(false)

  const paddleProps = {
    groupRef: paddleRef,
    position: [2.5, 0.5, 0.3],
    rotation: [0, -0.4, 0.4],
  }

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
        {USE_GLTF_PADDLE ? (
          <PaddleGLTF
            {...paddleProps}
            modelScale={1}
            modelRotation={[0, 0, 0]}
            modelPosition={[0, 0, 0]}
          />
        ) : (
          <Paddle {...paddleProps} />
        )}
        {started && (
          <Cinematic
            ballRef={ballRef}
            paddleRef={paddleRef}
            onStrike={() => setNameVisible(true)}
          />
        )}
      </Canvas>

      {!started && (
        <button className="intro" onClick={() => setStarted(true)}>
          <span className="intro-prompt">Press to Serve</span>
          <span className="intro-hint">Click anywhere</span>
        </button>
      )}

      <div className={`hud ${nameVisible ? 'visible' : ''}`}>
        <h1>RUDHAR BAJAJ</h1>
        <p>Rally · Code · Repeat</p>
      </div>
    </>
  )
}
