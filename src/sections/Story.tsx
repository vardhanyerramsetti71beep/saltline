import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { NIGHT } from '../content'

const THEMES = [
  { bg: '#efe6d3', fg: '#13192b', sun: '#e0412a' },
  { bg: '#2a2752', fg: '#efe6d3', sun: '#e2a32a' },
  { bg: '#e9c257', fg: '#13192b', sun: '#f8f2e4' },
  { bg: '#8c1f1c', fg: '#efe6d3', sun: '#e2a32a' },
  { bg: '#f4b860', fg: '#13192b', sun: '#e0412a' },
]
const SUN = [[80, 24], [90, 42], [84, 72], [91, 28], [78, 30]]

export function Story() {
  const root = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    let raf = 0
    let shown = 0
    const loop = () => {
      const el = root.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const range = Math.max(1, rect.height - window.innerHeight)
        const p = Math.min(0.999, Math.max(0, -rect.top / range))
        const next = Math.floor(p * NIGHT.length)
        if (next !== shown) {
          shown = next
          setStep(next)
          if (rect.top < 0) audio.tick()
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const t = THEMES[step]
  const now = NIGHT[step]
  return (
    <section id="story" className="story" ref={root} style={{ height: `${NIGHT.length * 100}svh` }}>
      <div className="story__stage" style={{ background: t.bg, color: t.fg }}>
        <span className="story__sun" style={{ background: t.sun, left: `${SUN[step][0]}%`, top: `${SUN[step][1]}%` }} aria-hidden="true" />
        <div className="story__copy">
          <p className="story__place">Route 9 <i>/</i> {now.place}</p>
          <div className="story__clock" key={now.hour}>{now.hour}</div>
          <p className="story__text" key={now.text}>{now.text}</p>
        </div>
        <ol className="story__ticks" aria-hidden="true">
          {NIGHT.map((n, i) => <li key={n.hour} className={i === step ? 'on' : ''}>{n.hour}</li>)}
        </ol>
      </div>
      <ol className="sr-only">
        {NIGHT.map((n) => <li key={n.hour}>{n.hour}, {n.place}: {n.text}</li>)}
      </ol>
    </section>
  )
}
