import { useEffect, useRef, useSyncExternalStore } from 'react'
import { site, sides } from '../content/site.js'
import { rallyStore, reportRally, sideStore } from '../lib/stores.js'

/**
 * The hero. Text for both sides is in the HTML; CSS shows the one that matches <html data-side>.
 * The 3D table waits until the page has loaded and the main thread is idle: parsing three.js and
 * compiling its shaders is the single most expensive thing the page does, and on a phone it
 * should never compete with the text becoming readable and tappable.
 */
export default function Stage() {
  const canvasRef = useRef(null)
  const { user } = useSyncExternalStore(rallyStore.subscribe, rallyStore.get, rallyStore.getServer)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowPower = window.matchMedia('(pointer: coarse)').matches
    let rally = null
    let cancelled = false
    let idleId = 0
    const unsubscribe = sideStore.subscribe(() => rally?.showSide(sideStore.get()))

    function start() {
      import('../scene/rally.js')
        .then(({ mountRally }) => {
          if (cancelled) return
          rally = mountRally(el, { reducedMotion, lowPower, side: sideStore.get(), onRally: reportRally })
          el.dataset.ready = 'true'
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

    return () => {
      cancelled = true
      window.removeEventListener('load', whenIdle)
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      else window.clearTimeout(idleId)
      unsubscribe()
      rally?.dispose()
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
          <span className="hint-touch">Demo rally · play it on a computer</span>
        </p>
      </div>
    </section>
  )
}
