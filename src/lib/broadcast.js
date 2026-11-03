/**
 * What the broadcast overlay on the hero table shows (components/Broadcast.jsx draws it).
 *
 *  - Lower-thirds: rally milestones (5, 10, 20, then every 10), a new best, a change of opponent.
 *  - The replay tag while the scene plays a lost rally back in slow motion.
 *  - The verifier's call when the reward hacker gets caught.
 *
 * Fed by the scene's events (reportEvent) and by the rally store; each card clears itself.
 */

import { createStore, rallyStore } from './stores.js'

const THIRD_MS = 2600
const VERDICT_MS = 2400

const initial = { mode: 'fair', replay: null, third: null, verdict: null }
let state = initial
let seq = 0
const timers = {}

export const broadcastStore = createStore(
  () => state,
  () => initial,
)

function set(patch) {
  state = { ...state, ...patch }
  broadcastStore.notify()
}

/** Put a card up under `key` and take it down again after `ms`. */
function show(key, card, ms) {
  clearTimeout(timers[key])
  set({ [key]: { ...card, ms, id: ++seq } })
  timers[key] = setTimeout(() => set({ [key]: null }), ms)
}

/** @param {{type: 'replay', on: boolean, speed?: number} | {type: 'mode', mode: 'fair' | 'hacker'} | {type: 'verdict', reason: string, point: boolean}} e */
export function reportEvent(e) {
  if (e.type === 'replay') set({ replay: e.on ? { speed: e.speed } : null })
  if (e.type === 'mode') {
    set({ mode: e.mode })
    show(
      'third',
      e.mode === 'hacker'
        ? { kicker: 'New opponent', title: 'Reward Hacker', line: 'It cheats. A verifier is watching. Esc to leave.', tone: 'hacker' }
        : { kicker: 'Opponent', title: 'Fair play', line: 'Back to the honest one.' },
      THIRD_MS + 800,
    )
  }
  if (e.type === 'verdict') show('verdict', { reason: e.reason, point: e.point }, VERDICT_MS)
}

// --- rally milestones --------------------------------------------------------------------------

const MILESTONES = { 10: 'Double figures.', 20: 'Twenty shots. A proper rally.' }
let bestAtServe = 0
let bestShown = false
let lastRally = 0

rallyStore.subscribe(() => {
  const { rally, best, user, input } = rallyStore.get()
  const was = lastRally
  lastRally = rally
  if (!user || rally === 0) {
    // between rallies: remember the best to beat
    bestAtServe = best
    bestShown = false
    return
  }
  if (rally <= was) return
  const n = String(rally).padStart(2, '0')
  if (!bestShown && bestAtServe >= 3 && rally > bestAtServe) {
    bestShown = true
    show('third', { kicker: 'New best', title: `Rally ${n}`, line: 'Your longest on this device.', tone: 'best' }, THIRD_MS)
  } else if (rally === 5) {
    const line =
      state.mode === 'hacker'
        ? 'The verifier is still watching.'
        : input === 'mouse'
          ? 'Type SPIN for a tougher opponent.'
          : 'Keep it going.'
    show('third', { kicker: 'Rally', title: n, line }, THIRD_MS)
  } else if (MILESTONES[rally] || (rally > 20 && rally % 10 === 0)) {
    show('third', { kicker: 'Rally', title: n, line: MILESTONES[rally] || 'Still going.' }, THIRD_MS)
  }
})
