import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { DEAD_AIR, STATIONS } from '../content'
import { ChapterHead, Reveal } from '../hooks'
import { useGame } from '../store'

const MIN = 87.5
const MAX = 102.5

export function Radio() {
  const [on, setOn] = useState(false)
  const [freq, setFreq] = useState<number>(STATIONS[0].freq)
  const bars = useRef<HTMLCanvasElement>(null)
  const setSound = useGame((s) => s.setSound)
  const sound = useGame((s) => s.sound)
  const find = useGame((s) => s.find)

  const station = STATIONS.find((s) => Math.abs(s.freq - freq) < 0.2)
  const dead = Math.abs(freq - DEAD_AIR) < 0.2

  useEffect(() => {
    audio.tune(freq)
  }, [freq])

  useEffect(() => {
    if (!on || !sound) return
    if (Math.abs(freq - DEAD_AIR) > 0.12) return
    const t = setTimeout(() => find('deadair'), 1400)
    return () => clearTimeout(t)
  }, [on, sound, freq, find])

  useEffect(() => {
    if (!on) return
    let raf = 0
    const c = bars.current
    const g = c?.getContext('2d')
    const data = new Uint8Array(32)
    const draw = () => {
      if (c && g) {
        const w = (c.width = c.clientWidth)
        const h = (c.height = c.clientHeight)
        audio.analyser?.getByteFrequencyData(data)
        g.fillStyle = getComputedStyle(c).color
        const n = 24
        for (let i = 0; i < n; i++) {
          const v = Math.round(((data[i + 1] ?? 0) / 255) * 7)
          for (let j = 0; j < v; j++) g.fillRect((i * w) / n + 1, h - (j + 1) * (h / 7) + 2, w / n - 3, h / 7 - 3)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [on])

  const power = () => {
    const next = !on
    if (next && !sound) setSound(true)
    audio.setRadio(next)
    audio.tune(freq)
    audio.click()
    setOn(next)
  }
  const tune = (f: number) => {
    setFreq(f)
    audio.tick()
    if (!on) power()
  }

  return (
    <section id="radio" className="chapter radio">
      <ChapterHead mile={301} title="Keep it on the dial">
        Three stations still on the air, all made in your browser as you listen. It keeps playing while you drive.
      </ChapterHead>
      <Reveal className={`set ${on ? 'set--on' : ''}`}>
        <div className="set__face">
          <div className="set__lcd">
            <span className="set__freq">{on ? freq.toFixed(1) : '--.-'}<small>MHz</small></span>
            <canvas ref={bars} aria-hidden="true" />
          </div>
          <div className="set__info" aria-live="polite">
            {!on && <><b>Radio off</b><span>Turn it on and find a signal.</span></>}
            {on && station && <><b>{station.name}</b><span>{station.genre} · {station.host}</span><em>{station.line}</em></>}
            {on && !station && dead && <><b>No call sign</b><span>A flat voice, reading numbers</span><em>Nobody admits to running this one.</em></>}
            {on && !station && !dead && <><b>Static</b><span>Keep turning the dial</span></>}
          </div>
          <button className="set__power" onClick={power} aria-pressed={on}>{on ? 'Off' : 'On'}</button>
        </div>
        <div className="set__dial">
          <div className="set__scale" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => <span key={i} style={{ left: `${(i / 15) * 100}%` }}>{(MIN + i + 0.5) % 2 < 1 ? Math.floor(MIN + i + 0.5) : ''}</span>)}
          </div>
          <input type="range" min={MIN} max={MAX} step={0.1} value={freq} aria-label="Tuning dial" aria-valuetext={`${freq.toFixed(1)} megahertz`} onChange={(e) => tune(Number(e.target.value))} />
        </div>
        <div className="set__presets">
          {STATIONS.map((s) => (
            <button key={s.call} className={station?.call === s.call && on ? 'on' : ''} onClick={() => tune(s.freq)}>
              <b>{s.freq.toFixed(1)}</b><span>{s.name}</span>
            </button>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
