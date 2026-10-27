import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { site, sides } from '../content/site.js'
import { rallyStore, setSide, sideStore } from '../lib/stores.js'
import { setSound, soundStore } from '../lib/sound.js'
import { scrollToTop } from '../lib/motion.js'

/** Fixed furniture around the page: the nav, the broadcast scoreboard and the flip paddle. */

export function Header() {
  const sound = useSyncExternalStore(soundStore.subscribe, soundStore.get, soundStore.getServer)

  return (
    <header className="topbar">
      <a className="mark" href="#top" aria-label={`RB, ${site.name}, back to top`}>
        RB
      </a>
      <nav aria-label="Primary">
        <ul className="nav">
          <li className="only-red nav-wide">
            <a href="#experience">Work</a>
          </li>
          <li className="only-red">
            <a href="#matches">Matches</a>
          </li>
          <li className="only-red nav-wide">
            <a href="#cp">CP</a>
          </li>
          <li className="only-black">
            <a href="#record">Record</a>
          </li>
          <li className="only-black nav-wide">
            <a href="#rallytrack">RallyTrack</a>
          </li>
          <li className="nav-wide">
            <a href="#contact">Contact</a>
          </li>
          <li>
            <a href={site.resume} target="_blank" rel="noopener">
              Résumé
            </a>
          </li>
          <li>
            <button
              type="button"
              className="sound-toggle"
              aria-pressed={sound}
              onClick={() => setSound(!sound)}
            >
              Sound {sound ? 'on' : 'off'}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export function Scoreboard() {
  const side = useSyncExternalStore(sideStore.subscribe, sideStore.get, sideStore.getServer)
  const { rally, best, user } = useSyncExternalStore(
    rallyStore.subscribe,
    rallyStore.get,
    rallyStore.getServer,
  )
  const [section, setSection] = useState('Serve')

  useEffect(() => {
    const seen = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target, e.isIntersecting ? e.intersectionRatio : 0)
        let top = null
        let ratio = 0
        for (const [el, r] of seen) {
          if (r > ratio) {
            top = el
            ratio = r
          }
        }
        if (top) setSection(top.dataset.section)
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1], rootMargin: '-30% 0px -30% 0px' },
    )
    document.querySelectorAll('[data-section]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <aside className="scoreboard" aria-label="Scoreboard">
      <dl>
        <div className="score-row">
          <dt>Side</dt>
          <dd>
            <span className={`side-chip side-chip-${side}`} />
            {sides[side].label}
          </dd>
        </div>
        <div className="score-row score-wide">
          <dt>Now</dt>
          <dd>{section}</dd>
        </div>
        <div className="score-row">
          <dt>Rally</dt>
          <dd className={user ? 'is-live' : undefined}>
            {user ? String(rally).padStart(2, '0') : '--'}
          </dd>
        </div>
        <div className="score-row score-wide">
          <dt>Best</dt>
          <dd>{String(best).padStart(2, '0')}</dd>
        </div>
      </dl>
    </aside>
  )
}

/**
 * The switch. Rotates a CSS paddle to show the other rubber, and covers the page with a disc of
 * the destination colour that grows out of the paddle while the content swaps underneath.
 */
export function PaddleFlip() {
  const side = useSyncExternalStore(sideStore.subscribe, sideStore.get, sideStore.getServer)
  const buttonRef = useRef(null)
  const wipeRef = useRef(null)
  const busy = useRef(false)
  const next = side === 'red' ? 'black' : 'red'

  async function flip() {
    if (busy.current) return
    busy.current = true
    const target = side === 'red' ? 'black' : 'red'
    const wipe = wipeRef.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    try {
      if (reduced || !wipe?.animate) {
        setSide(target)
        scrollToTop()
        return
      }
      const r = buttonRef.current.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const radius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy))
      wipe.dataset.to = target
      wipe.hidden = false
      await wipe.animate(
        [{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${radius}px at ${cx}px ${cy}px)` }],
        { duration: 520, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'forwards' },
      ).finished
      setSide(target)
      scrollToTop()
      await wipe.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-out', fill: 'forwards' })
        .finished
      wipe.getAnimations().forEach((a) => a.cancel())
      wipe.hidden = true
    } finally {
      busy.current = false
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'f' && e.key !== 'F') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      buttonRef.current?.click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <div className="flip-wipe" ref={wipeRef} hidden aria-hidden="true" />
      <button
        type="button"
        ref={buttonRef}
        className="flip"
        onClick={flip}
        aria-keyshortcuts="F"
      >
        <span className="flip-paddle" data-side={side} aria-hidden="true">
          <span className="flip-face flip-red" />
          <span className="flip-face flip-black" />
          <span className="flip-handle" />
        </span>
        <span className="flip-label">
          <span className="flip-to">Flip to</span>
          <span className="flip-persona">{sides[next].persona}</span>
          <kbd>F</kbd>
        </span>
      </button>
    </>
  )
}
