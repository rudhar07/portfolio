export function SectionHead({ eyebrow, title, body }) {
  return (
    <header className="section-head" data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {body && <p className="section-body">{body}</p>}
    </header>
  )
}
