import '../styles/feel.css'

export function SectionHead({ eyebrow, title, body }) {
  return (
    <header className="section-head" data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title">
        <span className="sr-only">{title}</span>
        <SpinLetters text={title} />
      </h2>
      {body && <p className="section-body">{body}</p>}
    </header>
  )
}

/**
 * The title, one span per letter, so each letter can roll into place with topspin when the
 * section arrives (styles/feel.css). Words stay unbreakable; `--i` staggers the letters.
 * Hidden from screen readers, which read the plain title next to it instead.
 */
function SpinLetters({ text }) {
  let i = 0
  const words = text.split(' ').map((word) => [...word].map((ch) => ({ ch, i: i++ })))
  return (
    <span className="spin-title" aria-hidden="true">
      {words.map((letters, w) => (
        <span key={w}>
          {w > 0 && ' '}
          <span className="spin-word">
            {letters.map(({ ch, i }) => (
              <span className="spin-ch" style={{ '--i': i }} key={i}>
                {ch}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
}
