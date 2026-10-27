import { sides } from '../content/site.js'
import { player } from '../content/tt.js'
import { SectionHead } from './bits.jsx'

/** The player: the record, the style, the club work, and RallyTrack. */
export default function BlackSide() {
  const { style, results, offTable, rallyTrack } = player

  return (
    <div className="side only-black">
      <section className="section about" data-section="About">
        <p className="about-line" data-reveal>
          {sides.black.about}
        </p>
      </section>

      <section className="section" id="record" data-section="Record">
        <SectionHead eyebrow="The record" title="On the table." body={player.headline} />
        {results.length > 0 && (
          <ol className="results" data-reveal>
            {results.map((r) => (
              <li key={`${r.year}-${r.event}`}>
                <span className="mono">{r.year}</span>
                <span className="result-event">{r.event}</span>
                <span className="result-result">{r.result}</span>
              </li>
            ))}
          </ol>
        )}
        {style.length > 0 && (
          <dl className="style" data-reveal>
            {style.map((s) => (
              <div key={s.label}>
                <dt className="mono">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="section" id="club" data-section="Club">
        <SectionHead eyebrow="Off the table" title="Running the draw." />
        <article className="job" data-reveal>
          <div className="job-meta">
            <span className="mono">{offTable.org}</span>
          </div>
          <div>
            <h3 className="job-org">{offTable.role}</h3>
            <p className="job-role">{offTable.line}</p>
          </div>
        </article>
      </section>

      <section className="section" id="rallytrack" data-section="RallyTrack">
        <SectionHead
          eyebrow="Where the sides meet"
          title="RallyTrack."
          body={
            'Ball tracking from my own match footage: every bounce located on the table, so I can ' +
            'see where I actually put the ball instead of where I think I do.'
          }
        />
        <figure className="heatmap" data-reveal>
          <svg viewBox="0 0 152.5 274" role="img" aria-label={
            rallyTrack.bounces.length
              ? `Top-down table with ${rallyTrack.bounces.length} tracked bounces`
              : 'Top-down table, no bounces tracked yet'
          }>
            <rect x="0" y="0" width="152.5" height="274" className="hm-table" />
            <rect x="1" y="1" width="150.5" height="272" className="hm-line" />
            <line x1="76.25" y1="0" x2="76.25" y2="274" className="hm-line" />
            <line x1="-6" y1="137" x2="158.5" y2="137" className="hm-net" />
            {rallyTrack.bounces.map((b, i) => (
              <circle key={i} cx={76.25 + b.x * 76.25} cy={137 + b.y * 137} r="3.2" className="hm-dot" />
            ))}
          </svg>
          <figcaption className="mono muted">
            {rallyTrack.bounces.length
              ? `${rallyTrack.bounces.length} bounces tracked`
              : 'In progress. This table fills with real bounces once tracking works on my footage.'}
          </figcaption>
        </figure>
      </section>
    </div>
  )
}
