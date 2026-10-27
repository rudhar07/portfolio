import { sides } from '../content/site.js'
import { education, experience } from '../content/experience.js'
import { alsoPlayed, matches } from '../content/matches.js'
import { cp, kit } from '../content/cp.js'
import { SectionHead } from './bits.jsx'

/** The engineer: work, matches (projects), competitive programming, kit, education. */
export default function RedSide({ stats }) {
  return (
    <div className="side only-red">
      <section className="section about" data-section="About">
        <p className="about-line" data-reveal>
          {sides.red.about}
        </p>
      </section>

      <section className="section" id="experience" data-section="Work">
        <SectionHead eyebrow="Current club" title="Where I train." />
        {experience.map((job) => (
          <article className="job" key={job.org} data-reveal>
            <div className="job-meta">
              <span className="mono">{job.range}</span>
              <span className="mono muted">{job.place}</span>
            </div>
            <div>
              <h3 className="job-org">{job.org}</h3>
              <p className="job-role">{job.role}</p>
              <ul className="job-points">
                {job.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="section" id="matches" data-section="Matches">
        <SectionHead
          eyebrow="Tournament"
          title="Matches played."
          body="Each project is a match: the problem it had to beat, the result, and the shot that won it."
        />
        <ol className="matches">
          {matches.map((m, i) => (
            <li className="match" key={m.name} data-reveal>
              <div className="match-head">
                <span className="match-num mono">M{String(i + 1).padStart(2, '0')}</span>
                <h3 className="match-name">{m.name}</h3>
                <span className="match-links">
                  {m.repo && (
                    <a href={m.repo} target="_blank" rel="noopener noreferrer">
                      Repo<span className="sr-only"> for {m.name}</span> ↗
                    </a>
                  )}
                  {m.live && (
                    <a href={m.live} target="_blank" rel="noopener noreferrer">
                      Live<span className="sr-only"> {m.name}</span> ↗
                    </a>
                  )}
                </span>
              </div>
              <dl className="match-stats">
                <div>
                  <dt>Opponent</dt>
                  <dd>{m.opponent}</dd>
                </div>
                <div className="match-score">
                  <dt>Scoreline</dt>
                  <dd>{m.scoreline}</dd>
                </div>
                <div>
                  <dt>Key point</dt>
                  <dd>{m.keyPoint}</dd>
                </div>
              </dl>
              <ul className="chips" aria-label="Stack">
                {m.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <h3 className="subhead" data-reveal>
          Also played
        </h3>
        <ul className="also" data-reveal>
          {alsoPlayed.map((p) => (
            <li key={p.name}>
              <a href={p.href} target="_blank" rel="noopener noreferrer">
                <span className="also-name">{p.name}</span>
                <span className="also-line">{p.line}</span>
                <span className="also-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="cp" data-section="CP">
        <SectionHead eyebrow="Practice hall" title="Reps." />
        <div className="stats" data-reveal>
          <div className="stat stat-big">
            <span className="stat-num">{cp.total}</span>
            <span className="stat-label">{cp.totalNote}</span>
          </div>
          <a className="stat" href={`https://leetcode.com/u/${cp.leetcode}/`} target="_blank" rel="noopener noreferrer">
            <span className="stat-num">{stats.leetcode.all}</span>
            <span className="stat-label">solved on LeetCode ↗</span>
          </a>
          <div className="stat">
            <span className="stat-num">{stats.leetcode.hard}</span>
            <span className="stat-label">of them hard</span>
          </div>
          {cp.showCodeforcesRating ? (
            <a className="stat" href={`https://codeforces.com/profile/${cp.codeforces}`} target="_blank" rel="noopener noreferrer">
              <span className="stat-num">{stats.codeforces.rating}</span>
              <span className="stat-label">Codeforces rating ↗</span>
            </a>
          ) : (
            <a className="stat" href={`https://codeforces.com/profile/${cp.codeforces}`} target="_blank" rel="noopener noreferrer">
              <span className="stat-num stat-word">CF</span>
              <span className="stat-label">Codeforces profile ↗</span>
            </a>
          )}
        </div>
        <p className="strengths" data-reveal>
          <span className="mono muted">Strongest in</span> {cp.strengths.join(' · ')}
        </p>
      </section>

      <section className="section" id="kit" data-section="Kit">
        <SectionHead eyebrow="Kit bag" title="Plays with." />
        <div className="kit" data-reveal>
          {kit.map((k) => (
            <div key={k.group}>
              <h3 className="kit-group mono">{k.group}</h3>
              <ul>
                {k.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="education" data-section="School">
        <SectionHead eyebrow="Academy" title="Two degrees, one schedule." />
        <ul className="edu">
          {education.map((e) => (
            <li key={e.org} data-reveal>
              <span className="mono">{e.range}</span>
              <span className="edu-org">{e.org}</span>
              <span className="edu-role">{e.role}</span>
              <span className="mono edu-grade">{e.grade}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
