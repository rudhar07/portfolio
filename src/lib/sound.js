/**
 * The pock, synthesised. A short pitched click for the paddle, a duller one for the table.
 * Off by default; the AudioContext is only created when someone turns sound on, which is also
 * the user gesture browsers require before audio can play.
 */

let ctx = null
let noise = null
let enabled = false
const listeners = new Set()

export const soundStore = {
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  get: () => enabled,
  getServer: () => false,
}

export function setSound(on) {
  enabled = on
  if (on) {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) {
        enabled = false
        return
      }
      ctx = new AC()
      noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
    }
    if (ctx.state === 'suspended') ctx.resume()
  }
  listeners.forEach((fn) => fn())
}

/** @param {'paddle' | 'table'} kind */
export function pock(kind = 'paddle') {
  if (!enabled || !ctx) return
  const t = ctx.currentTime
  const pitch = kind === 'table' ? 1050 : 1500
  const level = kind === 'table' ? 0.1 : 0.2

  const osc = ctx.createOscillator()
  const tone = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(pitch, t)
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.55, t + 0.05)
  tone.gain.setValueAtTime(level, t)
  tone.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
  osc.connect(tone).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.08)

  const click = ctx.createBufferSource()
  const hp = ctx.createBiquadFilter()
  const clickGain = ctx.createGain()
  click.buffer = noise
  hp.type = 'highpass'
  hp.frequency.value = 2500
  clickGain.gain.value = level * 0.8
  click.connect(hp).connect(clickGain).connect(ctx.destination)
  click.start(t)
}
