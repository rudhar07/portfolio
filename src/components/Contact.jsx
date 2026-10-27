import { useState } from 'react'
import { site } from '../content/site.js'
import { SectionHead } from './bits.jsx'

/*
 * Delivery. With VITE_WEB3FORMS_KEY set (free key from web3forms.com, mailed to the address it
 * is registered with), the form posts there and only says "served" when the API says so.
 * Without a key it opens the visitor's mail app with the message filled in, and says that is
 * what happened. It never claims a message was sent when it was not.
 */
const FORM_KEY = import.meta.env.VITE_WEB3FORMS_KEY

function mailto({ name, message }) {
  const subject = encodeURIComponent(`Portfolio: hello from ${name}`)
  const body = encodeURIComponent(message)
  return `mailto:${site.email}?subject=${subject}&body=${body}`
}

export default function Contact() {
  const [status, setStatus] = useState('idle') // idle | sending | sent | opened | error

  async function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    if (!FORM_KEY) {
      window.location.href = mailto(data)
      setStatus('opened')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: FORM_KEY,
          subject: `Portfolio: message from ${data.name}`,
          from_name: data.name,
          name: data.name,
          email: data.email,
          message: data.message,
          botcheck: data.botcheck,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`)
      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="section contact" id="contact" data-section="Contact">
      <SectionHead
        eyebrow="Set point"
        title="Return the serve."
        body="Internships, collaborations, a project, or a match. Email is fastest."
      />

      <div className="contact-grid">
        <div className="contact-direct" data-reveal>
          <a className="contact-email" href={`mailto:${site.email}`}>
            {site.email.split('@')[0]}@<wbr />
            {site.email.split('@')[1]}
          </a>
          <ul className="contact-links">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label} ↗
                </a>
              </li>
            ))}
            <li>
              <a href={site.resume} target="_blank" rel="noopener">
                Résumé (PDF) ↗
              </a>
            </li>
          </ul>
        </div>

        <form className="contact-form" onSubmit={onSubmit} data-reveal>
          <label className="field">
            <span>Name</span>
            <input type="text" name="name" required autoComplete="name" />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" required autoComplete="email" />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea name="message" rows={5} required />
          </label>
          <input type="checkbox" name="botcheck" className="sr-only" tabIndex={-1} aria-hidden="true" />

          <div className="form-foot">
            <button type="submit" className="serve" disabled={status === 'sending'}>
              {status === 'sending' ? 'Serving…' : 'Serve'}
            </button>
            <p className="form-status" role="status" aria-live="polite">
              {status === 'sent' && 'Served. It is in my inbox, and I reply to everything.'}
              {status === 'opened' && (
                <>
                  Your mail app should have opened with this message. If it did not, write to{' '}
                  <a href={`mailto:${site.email}`}>{site.email}</a>.
                </>
              )}
              {status === 'error' && (
                <>
                  That one hit the net, nothing was sent. Try again, or email{' '}
                  <a href={`mailto:${site.email}`}>{site.email}</a>.
                </>
              )}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
