import { useEffect, useRef, useSyncExternalStore } from 'react'
import { site, sides } from '../content/site.js'
import { rallyStore, reportRally, sideStore } from '../lib/stores.js'
import { broadcastStore, reportEvent } from '../lib/broadcast.js'
import Broadcast from './Broadcast.jsx'

/**
 * The hero. Text for both sides is in the HTML; CSS shows the one that matches <html data-side>.
 * The 3D table waits until the page has loaded and the main thread is idle: parsing three.js and
 * compiling its shaders is the single most expensive thing the page does, and on a phone it
 * should never compete with the text becoming readable and tappable.
 *
 * Typing "spin" anywhere on the page (outside a form field) swaps the opponent for the reward
 * hacker; typing it again, or Esc, brings the fair one back.
 */
export default function Stage() {
  const canvasRef = useRef(null)
  const { user, rally, best } = useSyncExternalStore(rallyStore.subscribe, rallyStore.get, rallyStore.getServer)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowPower = window.matchMedia('(pointer: coarse)').matches
    let scene = null
    let cancelled = false
    let idleId = 0
    const unsubscribe = sideStore.subscribe(() => scene?.showSide(sideStore.get()))

    function start() {
      import('../scene/rally.js')
        .then(({ mountRally }) => {
          if (cancelled) return
          scene = mountRally(el, { reducedMotion, lowPower, side: sideStore.get(), onRally: reportRally, onEvent: reportEvent })
          el.dataset.ready = 'true'
          // automated browsers get the scene's debug handle, so the tests can play real rallies
          if (navigator.webdriver) window.__rally = scene.debug
        })
        .catch(() => {
          // no WebGL or the chunk failed: the stage just stays a quiet panel
        })
    }
    const whenIdle = () => {
      idleId = window.requestIdleCallback
        ? window.requestIdleCallback(start, { timeout: 3000 })
        : window.setTimeout(start, 600)
    }
    if (document.readyState === 'complete') whenIdle()
    else window.addEventListener('load', whenIdle, { once: true })

    let typed = ''
    const onKey = (e) => {
      if (!scene || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return
      const hacker = broadcastStore.get().mode === 'hacker'
      if (e.key === 'Escape' && hacker) {
        scene.setMode('fair')
        return
      }
      typed = (typed + e.key.toLowerCase()).slice(-4)
      if (typed === 'spin') {
        typed = ''
        scene.setMode(hacker ? 'fair' : 'hacker')
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      cancelled = true
      window.removeEventListener('load', whenIdle)
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      else window.clearTimeout(idleId)
      unsubscribe()
      scene?.dispose()
    }
  }, [])

  return (
    <section className="stage" id="top" data-section="Serve">
      <div className="stage-copy">
        <h1 className="hero-name">{site.name}</h1>
        {['red', 'black'].map((key) => {
          const { hero } = sides[key]
          return (
            <div className={`stage-side only-${key}`} key={key}>
              <p className="kicker">{hero.kicker}</p>
              <p className="hero-title">
                {hero.lines.map((line) => (
                  <span className="hero-line" key={line}>
                    {line}
                  </span>
                ))}
              </p>
              <p className="hero-body">{hero.body}</p>
            </div>
          )
        })}
        <div className="hero-links">
          <a className="btn btn-solid only-red" href="#matches">
            See the matches
          </a>
          <a className="btn btn-solid only-black" href="#record">
            See the record
          </a>
          <a className="btn" href={site.resume} target="_blank" rel="noopener">
            Résumé
          </a>
          <a className="btn" href="#contact">
            Contact
          </a>
        </div>
      </div>

      <div className="stage-table">
        <div className="stage-canvas" ref={canvasRef} />
        <Broadcast />
        <p className="stage-hint" aria-hidden="true">
          <span className="hint-pointer">
            {user ? (
              <>
                <span className="hint-live">You’re the player.</span> Slide left and right to return
              </>
            ) : (
              <>
                Hover the table to <span className="hint-live">become the player</span>
              </>
            )}
          </span>
          {/* the scoreboard is hidden on phones, so the touch hint carries the count */}
          <span className="hint-touch">
            {user ? (
              <>
                <span className="hint-live">Rally {String(rally).padStart(2, '0')}</span> · best{' '}
                {String(best).padStart(2, '0')} · drag to return
              </>
            ) : (
              <>
                Drag across the table to <span className="hint-live">become the player</span>
              </>
            )}
          </span>
        </p>
      </div>
    </section>
  )
}
