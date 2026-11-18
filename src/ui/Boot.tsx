import { useEffect, useState } from 'react'
import { useGame } from '../store'

export function Boot() {
  const boot = useGame((s) => s.boot)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let live = true
    const wait = new Promise((r) => setTimeout(r, 1300))
    const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))])
    void Promise.all([wait, fonts]).then(() => live && setReady(true))
    return () => {
      live = false
    }
  }, [])

  return (
    <div className={`boot ${ready ? 'is-ready' : ''}`} role="dialog" aria-label="Start SALTLINE">
      <svg className="boot__route" viewBox="0 0 800 120" aria-hidden="true">
        <path className="boot__road" d="M16 86 C 140 20, 230 104, 366 62 S 610 16, 784 58" />
        <path className="boot__draw" pathLength={1} d="M16 86 C 140 20, 230 104, 366 62 S 610 16, 784 58" />
        {[[16, 86], [272, 80], [520, 34], [784, 58]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="8" />)}
      </svg>
      <h1 className="boot__title">SALTLINE</h1>
      <p className="boot__line">580 km. Three lives. The last ferry leaves at dawn.</p>
      <div className="boot__actions">
        <button className="btn btn--solid" disabled={!ready} onClick={() => boot(true)}>{ready ? 'Start engine' : 'Warming up'}</button>
        <button className="btn" disabled={!ready} onClick={() => boot(false)}>Silent run</button>
      </div>
      <p className="boot__note">Start engine turns the sound on. SALTLINE is a made-up game. This page is its playable teaser.</p>
    </div>
  )
}
