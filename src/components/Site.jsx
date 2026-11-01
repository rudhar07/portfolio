import { site } from '../content/site.js'
import { cp } from '../content/cp.js'
import Stage from './Stage.jsx'
import Ticker from './Ticker.jsx'
import RedSide from './RedSide.jsx'
import BlackSide from './BlackSide.jsx'
import Contact from './Contact.jsx'
import { Header, PaddleFlip, Scoreboard } from './Chrome.jsx'

/**
 * The whole page. Rendered to HTML at build time (src/entry-server.jsx) and hydrated in the
 * browser (src/entry-client.jsx). `stats` is fetched by the build and handed to both, so the
 * two renders always match.
 */
export default function Site({ stats }) {
  const live = [
    `${cp.total} problems solved`,
    `LeetCode ${stats.leetcode.all} · ${stats.leetcode.hard} hard`,
    'Now: RL environments at Scaler AI Labs',
    `Last shipped: ${site.lastShipped}`,
    'State-level table tennis',
  ]
  const serve = ['Return the serve', site.email, 'Internships · collaborations · a match']

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <Scoreboard />
      <main id="main">
        <Stage />
        <Ticker label="Live" items={live} />
        <RedSide stats={stats} />
        <BlackSide />
        <Ticker label="Serve" items={serve} reverse />
        <Contact />
      </main>
      <footer className="footer">
        <p className="mono muted">
          © {stats.year} {site.name}. Built with React and three.js, no physics engine.
        </p>
        <p className="mono muted">
          Press <kbd>F</kbd> to flip the paddle.
        </p>
      </footer>
      <PaddleFlip />
    </>
  )
}
