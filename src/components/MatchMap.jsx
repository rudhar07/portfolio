import { useEffect, useRef } from 'react'
import '../styles/map.css'

/**
 * The table becomes the map of the work. Beside the match cards (desktop only) a top-down table
 * stays pinned; it starts tilted like the one in the hero and lays flat as it rises into place.
 * Every match owns a spot on it. As each card reaches the middle of the screen, the ball flies
 * from the last spot to that card's spot and lights it, so by the end of the list the table shows
 * every match played.
 *
 * Decorative: the cards carry all the content, so the map is hidden from screen readers. Without
 * JS, or with reduced motion, every spot is lit and the table lies flat; nothing flies.
 */

const TILT = 55 // degrees at the start, when the table is still the hero's table

/** Spots zigzag down the table, one per match, keeping clear of the net. */
function spotOf(i, n) {
  return { x: i % 2 ? 72 : 28, y: 12 + (76 * (i + 0.5)) / n }
}

export default function MatchMap({ matches }) {
  const root = useRef(null)

  useEffect(() => {
    const map = root.current
    const list = map.parentElement.querySelector('.matches')
    const cards = [...list.querySelectorAll('[data-match]')]
    const spots = [...map.querySelectorAll('.map-spot')]
    const table = map.querySelector('.map-table')
    const ball = map.querySelector('.map-ball')
    const shadow = map.querySelector('.map-shadow')
    const caption = map.querySelector('.map-caption-name')
    const num = map.querySelector('.map-caption-num')
    const motion = () => document.documentElement.classList.contains('motion')
    let at = -1 // index of the spot the ball is on; -1 = still in the server's hand

    const place = (el, i) => {
      const p = i < 0 ? { x: 50, y: 104 } : spotOf(i, cards.length)
      el.style.left = `${p.x}%`
      el.style.top = `${p.y}%`
    }

    const fly = (to) => {
      const from = at
      at = to
      spots.forEach((s, i) => {
        s.classList.toggle('active', i === to)
        if (i <= to) s.classList.add('landed')
      })
      caption.textContent = matches[to].name
      num.textContent = `M${String(to + 1).padStart(2, '0')}`
      map.dataset.active = to

      if (!motion()) {
        place(ball, to)
        place(shadow, to)
        return
      }
      // the arc is drawn in the table's own plane: x/y across the table, z is height above it
      const w = table.offsetWidth
      const h = table.offsetHeight
      const a = from < 0 ? { x: 50, y: 104 } : spotOf(from, cards.length)
      const b = spotOf(to, cards.length)
      const dx = ((a.x - b.x) / 100) * w
      const dy = ((a.y - b.y) / 100) * h
      const lift = 40 + Math.hypot(dx, dy) * 0.35
      // both start at the old spot (offset back from the new one) and travel to zero
      const arc = []
      const ground = []
      for (let k = 0; k <= 12; k++) {
        const t = k / 12
        const x = dx * (1 - t)
        const y = dy * (1 - t)
        const height = 4 * t * (1 - t) // 0 at both ends, 1 at the top of the arc
        arc.push({ transform: `translate3d(${x}px, ${y}px, ${lift * height}px)` })
        ground.push({ transform: `translate3d(${x}px, ${y}px, 0) scale(${1 - 0.5 * height})`, opacity: 0.7 - 0.45 * height })
      }
      place(ball, to)
      place(shadow, to)
      const ms = 520
      ball.getAnimations().forEach((an) => an.cancel())
      shadow.getAnimations().forEach((an) => an.cancel())
      ball.animate(arc, { duration: ms, easing: 'linear' })
      shadow.animate(ground, { duration: ms, easing: 'linear' })
      spots[to].animate([{ transform: 'scale(1.8)' }, { transform: 'scale(1)' }], {
        duration: 420,
        delay: ms * 0.9,
        easing: 'ease-out',
      })
    }

    place(ball, -1)
    place(shadow, -1)

    // the card crossing the middle of the screen is the one being played
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = Number(e.target.dataset.match)
          if (i !== at) fly(i)
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    cards.forEach((c) => io.observe(c))

    // the table lays flat as it rises into its pinned place
    let queued = false
    const tilt = () => {
      queued = false
      const r = map.getBoundingClientRect()
      const pin = parseFloat(getComputedStyle(map).top) || 0
      const p = Math.min(1, Math.max(0, 1 - (r.top - pin) / (window.innerHeight * 0.6)))
      map.style.setProperty('--tilt', `${(TILT * (1 - p)).toFixed(2)}deg`)
    }
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(tilt)
    }
    tilt()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [matches])

  return (
    <div className="map" ref={root} aria-hidden="true">
      <div className="map-view">
        <div className="map-table">
          <span className="map-centre" />
          <span className="map-net" />
          {matches.map((m, i) => {
            const p = spotOf(i, matches.length)
            return (
              <span className="map-spot" key={m.name} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            )
          })}
          <span className="map-shadow" />
          <span className="map-ball" />
        </div>
      </div>
      <p className="map-caption">
        <span className="map-caption-num mono">M··</span>
        <span className="map-caption-name">Scroll to play</span>
      </p>
    </div>
  )
}
