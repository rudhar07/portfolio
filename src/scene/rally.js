/**
 * The hero rally: a table, a ball, and two paddles, in plain three.js.
 *
 * No physics engine. A table tennis ball only ever does three things here (fly under gravity,
 * bounce off the table, get hit), so the flight is integrated directly and every shot is
 * solved for: given where the ball is and where it should land, pick the velocity that gets it
 * there and clears the net. That keeps rallies stable without tuning restitution against a
 * solver, and it is why the bundle no longer ships a WASM physics engine.
 *
 * Units are metres and seconds, on a regulation table. +z is the player's (camera) side.
 *
 * Modes: with no pointer over the stage both paddles are automatic and the rally plays itself.
 * Move a mouse over the stage, or put a finger on it, and the near paddle follows; returns you
 * make count toward the rally. Miss and the opponent serves again. On touch, each return gives a
 * short vibration where the device supports it, and lifting the finger hands the paddle back to
 * the computer after a grace period, so you can let go between shots.
 *
 * Broadcast moments: lose a rally of 3 or more and the last couple of seconds play back in slow
 * motion with a trail behind the ball (a click skips it). The hidden level swaps the opponent for
 * a reward hacker: its rubber turns green and every few shots it cheats instead of returning,
 * either straight through the net or by teleporting the ball past you. A verifier catches each
 * one, freezes the ball where the rules broke, and the point goes to you. The page hears about
 * all of this through `onEvent` and draws the overlays.
 */

import * as THREE from 'three'
import { pock } from '../lib/sound.js'

const TABLE = { w: 1.525, l: 2.74, h: 0.76, net: 0.1525 }
const HALF_W = TABLE.w / 2
const HALF_L = TABLE.l / 2
const BALL_R = 0.03 // a little over regulation, so it reads at hero size
const G = 9.81
const BOUNCE = 0.86
const PLAYER_Z = HALF_L + 0.18
const OPP_Z = -(HALF_L + 0.18)
const REACH = 0.2 // how far either side of the ball the near paddle still makes contact
const TOUCH_GRACE_MS = 2500 // how long the paddle stays yours after the finger lifts
const HIT_BUZZ_MS = 14
const REPLAY_SECONDS = 1.8 // how much of the lost rally the replay shows
const REPLAY_SPEED = 0.4
const REPLAY_MIN_RALLY = 3
const TRAIL = 12 // ghost balls behind the replayed one
const VERDICT_SECONDS = 1.6 // how long a caught cheat stays frozen on the table
const CHEATS = ['net', 'teleport']

const COLORS = {
  table: 0x174f86,
  line: 0xf4f1ea,
  red: 0xd7263d,
  black: 0x111111,
  wood: 0x8b5a2b,
  handle: 0x3a2418,
  ball: 0xfbfaf7,
  hacker: 0x22c55e,
}

const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/**
 * Velocity that takes a ball from `p` to land on (tx, tz) at roughly `speed` m/s across the
 * table, lofting it further each try until the arc clears the net with a margin.
 */
function solveShot(p, tx, tz, speed) {
  const dx = tx - p.x
  const dz = tz - p.z
  const ty = TABLE.h + BALL_R
  let t = Math.hypot(dx, dz) / speed
  let vy = 0
  for (let i = 0; i < 14; i++) {
    vy = (ty - p.y + 0.5 * G * t * t) / t
    const tNet = -p.z / (dz / t)
    const yNet = p.y + vy * tNet - 0.5 * G * tNet * tNet
    if (yNet > TABLE.h + TABLE.net + 0.05) break
    t *= 1.1
  }
  return new THREE.Vector3(dx / t, vy, dz / t)
}

function box(w, h, d, color, opts = {}) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts }),
  )
}

function makeTable() {
  const g = new THREE.Group()
  const top = box(TABLE.w, 0.04, TABLE.l, COLORS.table, { roughness: 0.5 })
  top.position.y = TABLE.h - 0.02
  top.receiveShadow = true
  g.add(top)

  const lineY = TABLE.h + 0.001
  const edge = 0.02
  const lines = [
    [TABLE.w, edge, 0, HALF_L - edge / 2],
    [TABLE.w, edge, 0, -HALF_L + edge / 2],
    [edge, TABLE.l, HALF_W - edge / 2, 0],
    [edge, TABLE.l, -HALF_W + edge / 2, 0],
    [0.003, TABLE.l, 0, 0],
  ]
  for (const [w, d, x, z] of lines) {
    const m = box(w, 0.002, d, COLORS.line, { roughness: 0.4 })
    m.position.set(x, lineY, z)
    m.receiveShadow = true
    g.add(m)
  }

  const apron = box(TABLE.w - 0.1, 0.12, TABLE.l - 0.1, 0x050505)
  apron.position.y = TABLE.h - 0.1
  g.add(apron)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = box(0.05, TABLE.h - 0.1, 0.05, 0x050505)
      leg.position.set(sx * (HALF_W - 0.2), (TABLE.h - 0.1) / 2, sz * (HALF_L - 0.35))
      g.add(leg)
    }
  }

  const net = box(TABLE.w + 0.3, TABLE.net, 0.004, 0x1a1a1a, { transparent: true, opacity: 0.55 })
  net.position.set(0, TABLE.h + TABLE.net / 2, 0)
  g.add(net)
  const band = box(TABLE.w + 0.3, 0.015, 0.006, COLORS.line)
  band.position.set(0, TABLE.h + TABLE.net - 0.0075, 0)
  g.add(band)
  for (const sx of [-1, 1]) {
    const post = box(0.02, TABLE.net + 0.02, 0.03, 0x222222)
    post.position.set(sx * (HALF_W + 0.15), TABLE.h + TABLE.net / 2, 0)
    g.add(post)
  }
  return g
}

/** A paddle whose `front` rubber faces -z (toward the net, for the near paddle). */
function makePaddle(front, back) {
  const g = new THREE.Group()
  const disc = (r, depth, color, z) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, depth, 40),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
    )
    m.rotation.x = Math.PI / 2
    m.position.z = z
    m.castShadow = true
    return m
  }
  g.add(disc(0.1, 0.008, COLORS.wood, 0))
  g.add(disc(0.097, 0.004, front, -0.006))
  g.add(disc(0.097, 0.004, back, 0.006))
  const handle = box(0.032, 0.11, 0.026, COLORS.handle)
  handle.position.y = -0.15
  handle.castShadow = true
  g.add(handle)
  return g
}

/**
 * Mount the rally into `container`.
 *
 * @param {HTMLElement} container
 * Events passed to `onEvent`:
 *   { type: 'replay', on: boolean, speed?: number }  slow-motion replay started / ended
 *   { type: 'mode', mode: 'fair' | 'hacker' }     the opponent changed
 *   { type: 'verdict', reason: string, point: boolean }  the verifier caught a cheat
 *
 * @param {HTMLElement} container
 * @param {{ reducedMotion: boolean, lowPower?: boolean, side?: 'red' | 'black', onRally: (s: {rally: number, user: boolean, input: 'mouse' | 'touch'}) => void, onEvent?: (e: object) => void }} opts
 * @returns {{ dispose: () => void, showSide: (side: 'red' | 'black') => void, setMode: (mode: 'fair' | 'hacker') => void }}
 */
export function mountRally(container, { reducedMotion, lowPower = false, onRally, onEvent = () => {}, side: initialSide = 'red' }) {
  // phones get no shadow pass and a lower pixel ratio: half the GPU work, same picture at arm's length
  const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2))
  renderer.shadowMap.enabled = !lowPower
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.setAttribute('aria-hidden', 'true')
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 2.2))
  const rim = new THREE.DirectionalLight(0xffffff, 1.2)
  rim.position.set(-2, 2.5, -3)
  scene.add(rim)
  const key = new THREE.DirectionalLight(0xffffff, 3.2)
  key.position.set(1.2, 4, 1.5)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 2, bottom: -2, near: 1, far: 8 })
  scene.add(key)

  scene.add(makeTable())

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_R, 32, 16),
    new THREE.MeshStandardMaterial({ color: COLORS.ball, roughness: 0.35, emissive: 0x222222 }),
  )
  ball.castShadow = true
  scene.add(ball)

  const player = makePaddle(COLORS.red, COLORS.black)
  const opp = makePaddle(COLORS.red, COLORS.black)
  const oppRubber = opp.children[1].material
  opp.rotation.y = Math.PI
  player.position.set(0.2, TABLE.h + 0.2, PLAYER_Z)
  opp.position.set(-0.1, TABLE.h + 0.2, OPP_Z)
  scene.add(player, opp)

  // --- rally state ---------------------------------------------------------------------------
  const pos = new THREE.Vector3(0, TABLE.h + 0.25, 0)
  const vel = new THREE.Vector3()
  let live = false
  let deadFor = 0
  let hitter = 'opp' // who touched it last
  let bounces = { player: 0, opp: 0 }
  let rally = 0
  let user = false
  let input = 'mouse' // what is steering the near paddle while `user` is true
  let pointerX = 0
  let paddleVx = 0

  // broadcast state
  let mode = 'fair'
  let oppReturns = 0
  let nextCheat = 2
  let cheat = null // the cheat riding on the ball in flight
  let frozen = 0 // seconds a caught cheat stays on screen
  let clock = 0
  const history = [] // the last REPLAY_SECONDS of frames, for the replay
  let replay = null // { frames, t } while a replay is playing

  const emit = () => onRally({ rally, user, input })

  function buzz() {
    if (input !== 'touch') return
    try {
      navigator.vibrate?.(HIT_BUZZ_MS)
    } catch {
      // vibration blocked or unsupported (iOS Safari): the pock is enough
    }
  }

  // the near paddle shows the camera the rubber of the side the page is on
  let facing = Math.PI
  let facingTarget = Math.PI
  function showSide(side) {
    facingTarget = side === 'red' ? Math.PI : 0
  }
  showSide(initialSide)
  facing = facingTarget
  player.rotation.y = facing

  function hit(by, tx, tz, speed) {
    vel.copy(solveShot(pos, tx, tz, speed))
    hitter = by
    bounces = { player: 0, opp: 0 }
    pock('paddle')
  }

  function serve() {
    pos.set(rand(-0.3, 0.3), TABLE.h + 0.28, OPP_Z + 0.08)
    live = true
    cheat = null
    hit('opp', rand(-0.5, 0.5), rand(0.55, 1.05), rand(4, 4.8))
  }

  function lose() {
    live = false
    deadFor = 0
    if (user && rally >= REPLAY_MIN_RALLY && history.length > 10) startReplay()
    if (user && rally > 0) {
      rally = 0
      emit()
    }
  }

  // --- the reward hacker ---------------------------------------------------------------------
  function setMode(next) {
    if (reducedMotion || next === mode) return
    mode = next
    oppRubber.color.setHex(mode === 'hacker' ? COLORS.hacker : COLORS.red)
    oppReturns = 0
    nextCheat = 2
    onEvent({ type: 'mode', mode })
  }

  /** The opponent's return, unless it is a hacker due to cheat. */
  function oppShot() {
    if (mode !== 'hacker' || ++oppReturns < nextCheat) {
      hit('opp', rand(-0.6, 0.6), rand(0.5, 1.15), rand(4, 5.6))
      return
    }
    oppReturns = 0
    nextCheat = 2 + Math.floor(rand(0, 2))
    cheat = CHEATS[Math.floor(rand(0, CHEATS.length))]
    if (cheat === 'net') {
      // a flat, low drive: it cannot clear the band, and it does not mean to
      pos.y = TABLE.h + 0.05
      const t = 0.24
      vel.set((rand(-0.4, 0.4) - pos.x) / t, (BALL_R + 0.5 * G * t * t - 0.05) / t, (0.45 - pos.z) / t)
      hitter = 'opp'
      bounces = { player: 0, opp: 0 }
      pock('paddle')
    } else {
      hit('opp', rand(-0.5, 0.5), rand(0.6, 1.1), rand(4.4, 5))
    }
  }

  function caught(reason) {
    live = false
    frozen = VERDICT_SECONDS
    ball.material.color.setHex(COLORS.red)
    const point = user
    if (user) {
      rally += 1
      emit()
    }
    cheat = null
    onEvent({ type: 'verdict', reason, point })
  }

  // --- slow-motion replay --------------------------------------------------------------------
  const ghosts = []
  for (let i = 0; i < TRAIL; i++) {
    const g = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_R * (1 - i / (TRAIL * 1.6)), 16, 8),
      new THREE.MeshBasicMaterial({ color: COLORS.red, transparent: true, opacity: 0.55 * (1 - i / TRAIL), depthWrite: false }),
    )
    g.visible = false
    scene.add(g)
    ghosts.push(g)
  }

  function record(dt) {
    clock += dt
    history.push({
      t: clock,
      ball: pos.clone(),
      seen: ball.visible,
      player: player.position.clone(),
      tilt: player.rotation.z,
      opp: opp.position.clone(),
    })
    while (history.length && history[0].t < clock - REPLAY_SECONDS) history.shift()
  }

  function frameAt(t) {
    const { frames } = replay
    let i = 0
    while (i < frames.length - 1 && frames[i + 1].t <= t) i++
    return frames[i]
  }

  function startReplay() {
    const frames = history.splice(0)
    replay = { frames, t: frames[0].t }
    onEvent({ type: 'replay', on: true, speed: REPLAY_SPEED })
  }

  function endReplay() {
    if (!replay) return
    replay = null
    ghosts.forEach((g) => (g.visible = false))
    deadFor = 0
    onEvent({ type: 'replay', on: false })
  }

  function playReplay(dt) {
    replay.t += dt * REPLAY_SPEED
    const end = replay.frames[replay.frames.length - 1].t
    if (replay.t >= end) return endReplay()
    const f = frameAt(replay.t)
    ball.position.copy(f.ball)
    ball.visible = f.seen
    player.position.copy(f.player)
    player.rotation.z = f.tilt
    opp.position.copy(f.opp)
    ghosts.forEach((g, i) => {
      const past = frameAt(replay.t - (i + 1) * 0.022)
      g.position.copy(past.ball)
      g.visible = past.seen && past !== f
    })
  }

  function step(dt) {
    vel.y -= G * dt
    const prevZ = pos.z
    pos.addScaledVector(vel, dt)

    // the hacker's cheats, caught the moment the rules break
    const crossed = Math.sign(prevZ) !== Math.sign(pos.z)
    if (cheat === 'net' && crossed) {
      if (pos.y < TABLE.h + TABLE.net) {
        pos.z = 0
        return caught('The ball went through the net.')
      }
      cheat = null // it cleared the band after all: a fair shot
    }
    if (cheat === 'teleport' && pos.z > 0.2) {
      const from = pos.z
      pos.set(pos.x * 0.6, TABLE.h + 0.12, PLAYER_Z + 0.45)
      return caught(`The ball skipped ${(pos.z - from).toFixed(1)} m of its flight.`)
    }

    // net: crossing the net plane below the band kills the ball
    if (crossed && pos.y < TABLE.h + TABLE.net && Math.abs(pos.x) < HALF_W + 0.15) {
      pos.z = prevZ
      vel.z *= -0.15
      vel.x *= 0.3
      bounces = { player: 2, opp: 2 }
    }

    // table
    const onTable = Math.abs(pos.x) <= HALF_W && Math.abs(pos.z) <= HALF_L
    if (onTable && pos.y - BALL_R <= TABLE.h && vel.y < 0 && pos.y > TABLE.h - 0.05) {
      pos.y = TABLE.h + BALL_R
      vel.y *= -BOUNCE
      vel.x *= 0.97
      vel.z *= 0.97
      const side = pos.z > 0 ? 'player' : 'opp'
      bounces[side] += 1
      if (side === hitter || bounces[side] > 1) bounces = { player: 2, opp: 2 }
      pock('table')
    }
  }

  function rackets(dt) {
    const heading = vel.z > 0 ? 'player' : 'opp'

    // opponent: never misses, glides toward where the ball will be
    const oppTargetX = heading === 'opp' ? pos.x : 0
    opp.position.x += (clamp(oppTargetX, -1, 1) - opp.position.x) * Math.min(1, dt * 8)
    opp.position.y += (clamp(pos.y, TABLE.h + 0.08, TABLE.h + 0.5) - opp.position.y) * Math.min(1, dt * 6)

    if (live && hitter === 'player' && bounces.opp === 1 && vel.z < 0 && (pos.z <= OPP_Z + 0.04 || (vel.y < 0 && pos.y < TABLE.h + 0.14))) {
      opp.position.x = pos.x
      oppShot()
    }

    // near paddle
    const prevX = player.position.x
    const targetX = user ? pointerX : heading === 'player' ? pos.x + 0.04 : 0.15
    const follow = user ? 18 : 7
    player.position.x += (clamp(targetX, -1.1, 1.1) - player.position.x) * Math.min(1, dt * follow)
    player.position.y += (clamp(pos.y, TABLE.h + 0.08, TABLE.h + 0.5) - player.position.y) * Math.min(1, dt * 6)
    paddleVx = dt > 0 ? (player.position.x - prevX) / dt : 0
    player.rotation.z = clamp(-paddleVx * 0.06, -0.5, 0.5)
    player.rotation.x = -0.25
    facing += (facingTarget - facing) * Math.min(1, dt * 7)
    player.rotation.y = facing

    const atPlayer = vel.z > 0 && (pos.z >= PLAYER_Z - 0.04 || (vel.y < 0 && pos.y < TABLE.h + 0.14 && pos.z > HALF_L - 0.25))
    if (live && hitter === 'opp' && bounces.player === 1 && atPlayer) {
      const offset = pos.x - player.position.x
      if (!user) {
        hit('player', rand(-0.6, 0.6), rand(-1.15, -0.5), rand(4, 5.4))
      } else if (Math.abs(offset) < REACH) {
        const tx = clamp(-pos.x * 0.3 + offset * -2.5 + paddleVx * 0.08, -0.65, 0.65)
        hit('player', tx, rand(-1.15, -0.55), 4.2 + Math.min(Math.abs(paddleVx) * 0.35, 2.4))
        rally += 1
        buzz()
        emit()
      }
    }

    if (live && (pos.y < TABLE.h - 0.6 || Math.abs(pos.z) > HALF_L + 1.4 || Math.abs(pos.x) > 2.5)) lose()
    if (live && (bounces.player > 1 || bounces.opp > 1) && pos.y < TABLE.h - 0.2) lose()
  }

  // --- view ----------------------------------------------------------------------------------
  let baseFov = 32
  function frameCamera() {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const narrow = camera.aspect < 1
    baseFov = narrow ? 42 : 32
    camera.fov = replay ? baseFov * 0.8 : baseFov
    camera.position.set(narrow ? 0 : 0.6, narrow ? 2.6 : 2.15, narrow ? 4.6 : 4.4)
    camera.lookAt(0, TABLE.h - 0.12, -0.3)
    camera.updateProjectionMatrix()
  }
  frameCamera()
  const ro = new ResizeObserver(() => {
    frameCamera()
    if (reducedMotion) renderer.render(scene, camera)
  })
  ro.observe(container)

  // pointer → x on the near paddle's plane
  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -PLAYER_Z)
  const hitPoint = new THREE.Vector3()
  const ndc = new THREE.Vector2()
  function aim(e) {
    const r = container.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    if (ray.ray.intersectPlane(plane, hitPoint)) pointerX = hitPoint.x
  }
  function takeOver(type) {
    if (user && input === type) return
    user = true
    input = type
    rally = 0
    emit()
  }
  function release() {
    if (!user) return
    user = false
    rally = 0
    emit()
  }

  // Touch: the stage is `touch-action: pan-y`, so vertical swipes still scroll the page while
  // horizontal drags and taps arrive here. A cancel means the browser took the gesture for a scroll.
  let touching = false
  let releaseTimer = 0
  function onDown(e) {
    endReplay() // a click or tap skips the replay
    if (e.pointerType !== 'touch') return
    touching = true
    clearTimeout(releaseTimer)
    aim(e)
    takeOver('touch')
  }
  function onUp(e) {
    if (e.pointerType !== 'touch') return
    touching = false
    clearTimeout(releaseTimer)
    releaseTimer = setTimeout(release, TOUCH_GRACE_MS)
  }
  function onMove(e) {
    if (e.pointerType === 'mouse') {
      aim(e)
      takeOver('mouse')
    } else if (e.pointerType === 'touch' && touching) {
      aim(e)
    }
  }
  function onLeave(e) {
    // a finger lifting also fires pointerleave; touch hands back on its own timer instead
    if (e.pointerType === 'mouse') release()
  }

  if (reducedMotion) {
    pos.set(0.12, TABLE.h + TABLE.net + 0.18, 0.15)
    ball.position.copy(pos)
    renderer.render(scene, camera)
    return {
      showSide(side) {
        showSide(side)
        player.rotation.y = facing = facingTarget
        renderer.render(scene, camera)
      },
      setMode() {},
      dispose() {
        ro.disconnect()
        renderer.dispose()
        renderer.domElement.remove()
      },
    }
  }

  container.addEventListener('pointerdown', onDown)
  container.addEventListener('pointermove', onMove)
  container.addEventListener('pointerup', onUp)
  container.addEventListener('pointercancel', onUp)
  container.addEventListener('pointerleave', onLeave)

  let visible = true
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  })
  io.observe(container)

  let last = performance.now()
  let raf = 0
  function tick(now) {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    if (!visible || document.hidden) return

    // the replay zooms in a little, like a broadcast cutting to the slow-mo camera
    const fov = replay ? baseFov * 0.8 : baseFov
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 4)
      camera.updateProjectionMatrix()
    }

    if (replay) {
      playReplay(dt)
      renderer.render(scene, camera)
      return
    }
    if (frozen > 0) {
      // a caught cheat: the ball stays where the rule broke while the verifier speaks
      frozen -= dt
      if (frozen <= 0) {
        ball.material.color.setHex(COLORS.ball)
        deadFor = 0.4
      }
      ball.position.copy(pos)
      ball.visible = true
      renderer.render(scene, camera)
      return
    }

    if (live) {
      const n = 4
      for (let i = 0; i < n && live; i++) step(dt / n)
    } else {
      deadFor += dt
      if (deadFor > 0.9) serve()
    }
    if (frozen <= 0) rackets(dt)
    ball.position.copy(pos)
    ball.visible = live || frozen > 0 || deadFor < 0.4
    record(dt)
    renderer.render(scene, camera)
  }
  // one frame up front, so the table is there even if the tab starts in the background
  rackets(0)
  ball.position.copy(pos)
  renderer.render(scene, camera)
  raf = requestAnimationFrame(tick)
  emit()

  return {
    showSide,
    setMode,
    // for scripted checks of the rally (see CHANGES.md): read the ball, steer the near paddle
    debug: {
      state: () => ({ x: pos.x, y: pos.y, z: pos.z, live, rally, user, input, hitter, mode, replay: !!replay, frozen: frozen > 0 }),
      steer(x, type = 'mouse') {
        takeOver(type)
        pointerX = x
      },
    },
    dispose() {
      cancelAnimationFrame(raf)
      clearTimeout(releaseTimer)
      io.disconnect()
      ro.disconnect()
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerup', onUp)
      container.removeEventListener('pointercancel', onUp)
      container.removeEventListener('pointerleave', onLeave)
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
