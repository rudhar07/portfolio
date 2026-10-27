import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Site from './components/Site.jsx'
import { fallbackStats } from './lib/stats.js'
import { initRally } from './lib/stores.js'
import { startMotion } from './lib/motion.js'
import './styles.css'

const root = document.getElementById('root')
const stats = window.__STATS__ ?? fallbackStats()
const app = (
  <StrictMode>
    <Site stats={stats} />
  </StrictMode>
)

// `npm run dev` serves an empty #root; the production build ships it prerendered.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)

initRally()
requestAnimationFrame(() => startMotion())
