import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { cardBlob, drawCard } from '../card'
import { ChapterHead, Reveal, useNear } from '../hooks'
import { TOTAL_SECRETS, useGame } from '../store'
import { SecretGroups } from '../ui/Secrets'

export function Logbook() {
  const { ref, seen } = useNear<HTMLDivElement>('300px')
  const canvas = useRef<HTMLCanvasElement>(null)
  const callsign = useGame((s) => s.callsign)
  const setCallsign = useGame((s) => s.setCallsign)
  const lead = useGame((s) => s.lead)
  const car = useGame((s) => s.car)
  const paint = useGame((s) => s.paint)
  const km = useGame((s) => s.bestKm)
  const coins = useGame((s) => s.coins)
  const secrets = useGame((s) => s.secrets)
  const levelsDone = useGame((s) => s.levelsDone)
  const level = useGame((s) => s.level)
  const toast = useGame((s) => s.toast)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator.canShare === 'function')
  }, [])

  useEffect(() => {
    if (!seen || !canvas.current) return
    void drawCard(canvas.current, { callsign, lead, car, paint, km, coins, secrets: secrets.length, totalSecrets: TOTAL_SECRETS, levelsDone })
  }, [seen, callsign, lead, car, paint, km, coins, secrets, levelsDone])

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
        It updates with your best run, your vehicle, your coins, the levels you clear and every secret you find.
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
          <h3>Secrets <b>{secrets.length}/{TOTAL_SECRETS}</b></h3>
          <p className="log__note">Four on this page, and six on every level of the drive.</p>
          <SecretGroups openLevel={level} />
        </Reveal>
      </div>
    </section>
  )
}
