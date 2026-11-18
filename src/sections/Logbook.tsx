import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { cardBlob, drawCard } from '../card'
import { SECRETS } from '../content'
import { ChapterHead, Reveal, useNear } from '../hooks'
import { useGame } from '../store'

export function Logbook() {
  const { ref, seen } = useNear<HTMLDivElement>('300px')
  const canvas = useRef<HTMLCanvasElement>(null)
  const callsign = useGame((s) => s.callsign)
  const setCallsign = useGame((s) => s.setCallsign)
  const lead = useGame((s) => s.lead)
  const car = useGame((s) => s.car)
  const paint = useGame((s) => s.paint)
  const km = useGame((s) => s.bestKm)
  const valves = useGame((s) => s.bestValves)
  const secrets = useGame((s) => s.secrets)
  const finished = useGame((s) => s.finished)
  const toast = useGame((s) => s.toast)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator.canShare === 'function')
  }, [])

  useEffect(() => {
    if (!seen || !canvas.current) return
    void drawCard(canvas.current, { callsign, lead, car, paint, km, valves, secrets: secrets.length, finished })
  }, [seen, callsign, lead, car, paint, km, valves, secrets, finished])

  const save = async () => {
    if (!canvas.current) return
    const blob = await cardBlob(canvas.current)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'saltline-drivers-card.png'
    a.click()
    URL.revokeObjectURL(url)
    audio.unlock()
    toast({ kicker: 'Saved', title: 'Your driver’s card is downloaded' })
  }

  const share = async () => {
    if (!canvas.current) return
    const blob = await cardBlob(canvas.current)
    if (!blob) return
    const file = new File([blob], 'saltline-drivers-card.png', { type: 'image/png' })
    const data = { files: [file], title: 'SALTLINE', text: `I reached km ${km} on Route 9.` }
    if (!navigator.canShare?.(data)) return void save()
    try {
      await navigator.share(data)
    } catch {
      /* Closing the share sheet is not an error worth reporting. */
    }
  }

  return (
    <section id="logbook" className="chapter logbook">
      <ChapterHead km={547} title="Your driver’s card">
        It updates with your best run, your car and every secret you find.
      </ChapterHead>
      <div className="log" ref={ref}>
        <Reveal className="log__card"><canvas ref={canvas} width={1080} height={1350} role="img" aria-label={`Driver’s card for ${callsign}`} /></Reveal>
        <Reveal className="log__side" delay={120}>
          <label htmlFor="callsign">Your call sign</label>
          <input id="callsign" value={callsign} maxLength={16} onChange={(e) => setCallsign(e.target.value.toUpperCase())} spellCheck={false} autoComplete="off" />
          <div className="log__actions">
            <button className="btn btn--solid" onClick={save}>Download card</button>
            {canShare && <button className="btn" onClick={share}>Share</button>}
          </div>
          <h3>Six secrets <b>{secrets.length}/6</b></h3>
          <ol className="log__secrets">
            {SECRETS.map((s, i) => {
              const got = secrets.includes(s.id)
              return (
                <li key={s.id} className={got ? 'got' : ''}>
                  <span>{i + 1}</span>
                  <div><strong>{got ? s.name : 'Not found yet'}</strong><p>{got ? s.found : s.hint}</p></div>
                </li>
              )
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
