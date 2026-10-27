/**
 * Tiny external stores for state that lives outside React: which side of the paddle is up (it is
 * also an attribute on <html>, set before first paint by the inline script in index.html), and
 * the rally count coming out of the three.js scene. Read with useSyncExternalStore; the server
 * snapshot is what the prerendered HTML was built with.
 */

function createStore(get, getServer) {
  const listeners = new Set()
  return {
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    get,
    getServer,
    notify: () => listeners.forEach((fn) => fn()),
  }
}

// --- side ------------------------------------------------------------------------------------

export const sideStore = createStore(
  () => (document.documentElement.dataset.side === 'black' ? 'black' : 'red'),
  () => 'red',
)

/** @param {'red' | 'black'} side */
export function setSide(side) {
  document.documentElement.dataset.side = side
  const url = new URL(window.location.href)
  if (side === 'black') url.searchParams.set('side', 'black')
  else url.searchParams.delete('side')
  window.history.replaceState(null, '', url)
  sideStore.notify()
}

// --- rally -----------------------------------------------------------------------------------

const BEST_KEY = 'rb:best-rally'
let rallyState = { rally: 0, best: 0, user: false, input: 'mouse' }
const serverRally = { rally: 0, best: 0, user: false, input: 'mouse' }

function readBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

export const rallyStore = createStore(
  () => rallyState,
  () => serverRally,
)

/** @param {{rally: number, user: boolean, input: 'mouse' | 'touch'}} s */
export function reportRally({ rally, user, input }) {
  let best = rallyState.best || readBest()
  if (user && rally > best) {
    best = rally
    try {
      window.localStorage.setItem(BEST_KEY, String(best))
    } catch {
      // storage blocked: the best score just lasts for this visit
    }
  }
  rallyState = { rally, best, user, input }
  rallyStore.notify()
}

export function initRally() {
  rallyState = { ...rallyState, best: readBest() }
  rallyStore.notify()
}
