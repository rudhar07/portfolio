import { site } from '../content/site.js'
import Stage from './Stage.jsx'
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
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <Scoreboard />
      <main id="main">
        <Stage />
        <RedSide stats={stats} />
        <BlackSide />
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
