/**
 * Motion, applied only when the visitor has not asked for reduced motion and only after the
 * static page is already on screen.
 *
 *  - Lenis smooth scrolling.
 *  - Reveals: elements marked [data-reveal] wipe up into place the first time they enter the
 *    viewport. The hidden state is gated on html.motion, which is only set here, so if this
 *    module never runs every element is simply visible.
 */

let lenis = null

export async function startMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const root = document.documentElement
  const targets = [...document.querySelectorAll('[data-reveal]')]
  const vh = window.innerHeight
  // anything already on screen stays put, so nothing flickers on load
  for (const el of targets) {
    if (el.getBoundingClientRect().top < vh) el.classList.add('in')
  }
  root.classList.add('motion')

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  const pending = new Set(targets.filter((el) => !el.classList.contains('in')))
  pending.forEach((el) => io.observe(el))

  // A nav jump flies past whole sections without them ever intersecting. Anything that ends up
  // above the viewport is shown outright, so scrolling back up finds content, not empty space.
  let queued = false
  const settlePassed = () => {
    queued = false
    for (const el of pending) {
      if (el.classList.contains('in')) {
        pending.delete(el)
      } else if (el.offsetParent && el.getBoundingClientRect().bottom < 0) {
        el.classList.add('in')
        io.unobserve(el)
        pending.delete(el)
      }
    }
    if (!pending.size) window.removeEventListener('scroll', onScroll)
  }
  const onScroll = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(settlePassed)
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  const { default: Lenis } = await import('lenis')
  lenis = new Lenis({ duration: 1.1, smoothWheel: true })
  const raf = (t) => {
    lenis.raf(t)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  // in-page links go through Lenis so they glide instead of jumping
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null
    if (!a) return
    const id = a.getAttribute('href')
    const el = id === '#top' ? document.body : document.querySelector(id)
    if (!el) return
    e.preventDefault()
    lenis.scrollTo(el, { offset: id === '#top' ? 0 : -72 })
    window.history.replaceState(null, '', window.location.search + id)
  })
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}
