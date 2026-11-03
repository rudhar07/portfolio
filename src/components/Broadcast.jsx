import { useSyncExternalStore } from 'react'
import { broadcastStore } from '../lib/broadcast.js'
import '../styles/broadcast.css'

/**
 * TV graphics over the hero table: letterbox bars and a REPLAY tag during slow-motion replays,
 * lower-thirds for rally milestones, and the verifier's call in the hidden level. What to show
 * and when comes from lib/broadcast.js. Decorative, like the canvas under it.
 */
export default function Broadcast() {
  const { mode, replay, third, verdict } = useSyncExternalStore(broadcastStore.subscribe, broadcastStore.get, broadcastStore.getServer)

  return (
    <div className="bc" data-replay={replay ? 'on' : undefined} aria-hidden="true">
      <span className="bc-bar bc-bar-top" />
      <span className="bc-bar bc-bar-bottom" />

      <div className="bc-tags">
        {replay && (
          <p className="bc-tag bc-replay">
            <span className="bc-dot" />
            Replay <span className="bc-speed">{replay.speed}×</span>
          </p>
        )}
        {mode === 'hacker' && <p className="bc-tag bc-mode">vs Reward Hacker · Esc</p>}
      </div>

      {third && (
        <div className={`bc-third${third.tone ? ` bc-third-${third.tone}` : ''}`} key={third.id} style={{ '--ms': `${third.ms}ms` }}>
          <span className="bc-kicker">{third.kicker}</span>
          <span className="bc-title">{third.title}</span>
          {third.line && <span className="bc-line">{third.line}</span>}
        </div>
      )}

      {verdict && (
        <div className="bc-verdict" key={verdict.id} style={{ '--ms': `${verdict.ms}ms` }}>
          <span className="bc-kicker">Verifier</span>
          <span className="bc-title">Rejected</span>
          <span className="bc-line">{verdict.reason}</span>
          {verdict.point && <span className="bc-point">Point to you</span>}
        </div>
      )}
    </div>
  )
}
