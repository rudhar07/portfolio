import { useEffect, useRef } from 'react'
import '../styles/ticker.css'

/**
 * A TV-style "LIVE" strip. The items scroll on their own, speed up with how fast the page is
 * being scrolled, and run backwards while you scroll up, easing back once scrolling stops.
 * Movements under a couple of pixels a frame are ignored: the browser nudges the scroll position
 * by that much when fonts or images change the layout, and that must not flip the strip.
 *
 * The row is rendered twice (the copy is aria-hidden) and the track is moved by exactly one row
 * width, so the loop never shows a seam. Each row also repeats its items once so it is wider than
 * any screen. With reduced motion the strip just sits still.
 */
export default function Ticker({ label, items, reverse = false }) {
  const trackRef = useRef(null)
  const rowRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    const row = rowRef.current
    if (!track || !row || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rowWidth = row.offsetWidth
    const ro = new ResizeObserver(() => {
      rowWidth = row.offsetWidth
    })
    ro.observe(row)

    let visible = false
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(track)

    const base = reverse ? -1 : 1
    let x = 0
    let dir = base // eased, so a reversal glides through zero instead of snapping
    let target = base
    let stillFor = 0
    let boost = 0
    let lastY = window.scrollY
    let last = performance.now()
    let raf = 0

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const dy = window.scrollY - lastY
      lastY = window.scrollY
      if (!visible || !rowWidth || dt === 0) return

      if (Math.abs(dy) > 2) {
        target = Math.sign(dy) * base
        stillFor = 0
      } else if ((stillFor += dt) > 0.4) {
        target = base
      }
      dir += (target - dir) * Math.min(1, dt * 6)
      boost += ((Math.abs(dy) > 2 ? Math.abs(dy) : 0) / dt - boost) * Math.min(1, dt * 5)
      const speed = 55 + Math.min(boost * 0.5, 900)
      x -= speed * dt * dir
      x %= rowWidth
      if (x > 0) x -= rowWidth
      track.style.transform = `translate3d(${x}px, 0, 0)`
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [reverse])

  const row = [...items, ...items]

  return (
    <div className="ticker" role="marquee" aria-label={`${label}: ${items.join(', ')}`}>
      <span className="ticker-badge" aria-hidden="true">
        <span className="ticker-dot" />
        {label}
      </span>
      <div className="ticker-window" aria-hidden="true">
        <div className="ticker-track" ref={trackRef}>
          <ul className="ticker-row" ref={rowRef}>
            {row.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <ul className="ticker-row">
            {row.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
