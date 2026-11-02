/**
 * Pointer effects, mouse only (styles/feel.css does the drawing; this only feeds it numbers).
 *
 *  - Match cards tilt toward the cursor like a paddle face: up to a few degrees on each axis,
 *    plus the cursor position for the glare and the edge highlight.
 *  - Buttons lean toward the cursor by a few pixels.
 *
 * Called from lib/motion.js, which already skips everything under reduced motion.
 */

const TILT_X = 4 // degrees at the card's top/bottom edge
const TILT_Y = 2.5 // degrees at its left/right edge; cards are wide, so this stays small

function tilt(card) {
  const onMove = (e) => {
    const r = card.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    card.style.setProperty('--rx', `${((0.5 - py) * TILT_X * 2).toFixed(2)}deg`)
    card.style.setProperty('--ry', `${((px - 0.5) * TILT_Y * 2).toFixed(2)}deg`)
    card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`)
    card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
    card.classList.add('tilting')
  }
  const onLeave = () => {
    card.style.setProperty('--rx', '0deg')
    card.style.setProperty('--ry', '0deg')
    card.classList.remove('tilting')
  }
  card.addEventListener('pointermove', onMove)
  card.addEventListener('pointerleave', onLeave)
}

function magnet(el, pull) {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    el.style.setProperty('--mx', `${(dx * pull).toFixed(1)}px`)
    el.style.setProperty('--my', `${(dy * pull).toFixed(1)}px`)
  })
  el.addEventListener('pointerleave', () => {
    el.style.setProperty('--mx', '0px')
    el.style.setProperty('--my', '0px')
  })
}

export function startHover() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  document.querySelectorAll('.match').forEach(tilt)
  document.querySelectorAll('.btn').forEach((el) => magnet(el, 5))
  document.querySelectorAll('.serve').forEach((el) => magnet(el, 8))
}
