import { useEffect, useRef, useState, type FormEvent } from 'react'
import { audio } from '../audio'
import { CHAPTERS, CHEATS, LEADS, SECRETS } from '../content'
import { go } from '../hooks'
import { useGame } from '../store'

export function Hud() {
  const lead = useGame((s) => s.lead)
  const swapLead = useGame((s) => s.swapLead)
  const sound = useGame((s) => s.sound)
  const setSound = useGame((s) => s.setSound)
  const secrets = useGame((s) => s.secrets)
  const setMenu = useGame((s) => s.setMenu)
  const driving = useGame((s) => s.driving)
  const booted = useGame((s) => s.booted)
  const kmRef = useRef<HTMLElement>(null)
  const speedRef = useRef<HTMLElement>(null)
  const carRef = useRef<HTMLSpanElement>(null)
  const needleRef = useRef<SVGLineElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    let raf = 0
    let lastY = window.scrollY
    let lastT = performance.now()
    let speed = 0
    let shownKm = -1
    let shownSpeed = -1
    let shownActive = -1
    const loop = (now: number) => {
      const y = window.scrollY
      const dt = Math.max(16, now - lastT)
      const burst = Math.min(290, (Math.abs(y - lastY) / dt) * 100)
      lastY = y
      lastT = now
      speed += (burst - speed) * (burst > speed ? 0.22 : 0.06)
      const probe = y + window.innerHeight * 0.4
      let index = 0
      let km = 0
      const tops = CHAPTERS.map((c) => document.getElementById(c.id)?.offsetTop ?? 0)
      for (let i = 0; i < tops.length; i++) if (probe >= tops[i]) index = i
      const start = tops[index]
      const end = tops[index + 1] ?? document.documentElement.scrollHeight
      const nextKm = CHAPTERS[index + 1]?.km ?? 580
      km = CHAPTERS[index].km + (nextKm - CHAPTERS[index].km) * Math.min(1, Math.max(0, (probe - start) / Math.max(1, end - start)))
      const m = Math.round(km)
      const s = Math.round(speed)
      if (m !== shownKm && kmRef.current) {
        shownKm = m
        kmRef.current.textContent = String(m).padStart(3, '0')
      }
      if (s !== shownSpeed && speedRef.current) {
        shownSpeed = s
        speedRef.current.textContent = String(s).padStart(3, '0')
        needleRef.current?.setAttribute('transform', `rotate(${-120 + (s / 290) * 240} 40 44)`)
      }
      if (carRef.current) carRef.current.style.top = `${(km / 580) * 100}%`
      if (index !== shownActive) {
        shownActive = index
        setActive(index)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!booted || driving) return null
  const other = LEADS[lead === 'ines' ? 'dov' : 'ines']
  return (
    <div className="hud">
      <button className="hud__brand" onClick={() => go('cover')} aria-label="Back to the cover">SALTLINE</button>
      <div className="hud__right">
        <button className="chip chip--lead" onClick={swapLead} aria-label={`Switch to ${other.name}`} title="Shift + Tab">
          <i aria-hidden="true" /> {LEADS[lead].name.split(' ')[0]}
        </button>
        <button className="chip" onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
          {sound ? 'Sound on' : 'Sound off'}
        </button>
        <button className="chip chip--menu" onClick={() => { audio.click(); setMenu(true) }} aria-label={`Open glovebox. ${secrets.length} of 6 secrets found`}>
          Glovebox <b>{secrets.length}/6</b>
        </button>
      </div>
      <div className="dash" aria-hidden="true">
        <svg viewBox="0 0 80 62">
          <path d="M9 58 A36 36 0 1 1 71 58" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="2 5" />
          <line ref={needleRef} x1="40" y1="44" x2="40" y2="14" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" transform="rotate(-120 40 44)" />
          <circle cx="40" cy="44" r="4" fill="currentColor" />
        </svg>
        <div><b ref={speedRef}>000</b><span>kmph</span></div>
        <div><b ref={kmRef}>000</b><span>km</span></div>
      </div>
      <nav className="strip" aria-label="Chapters">
        <span className="strip__car" ref={carRef} aria-hidden="true" />
        {CHAPTERS.map((c, i) => (
          <button key={c.id} style={{ top: `${(c.km / 580) * 100}%` }} className={i === active ? 'on' : ''} onClick={() => go(c.id)} aria-current={i === active ? 'true' : undefined}>
            <span>{c.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export function Menu() {
  const open = useGame((s) => s.menu)
  const setMenu = useGame((s) => s.setMenu)
  const secrets = useGame((s) => s.secrets)
  const cheats = useGame((s) => s.cheats)
  const cheat = useGame((s) => s.cheat)
  const reset = useGame((s) => s.reset)
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(false)
  const [sure, setSure] = useState(false)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) close.current?.focus()
    else setSure(false)
  }, [open])

  if (!open) return null
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const ok = cheat(code)
    setWrong(!ok)
    if (ok) setCode('')
    else audio.fail()
  }
  return (
    <div className="menu" role="dialog" aria-modal="true" aria-label="Glovebox" onClick={(e) => e.target === e.currentTarget && setMenu(false)}>
      <div className="menu__box">
        <header>
          <h2>Glovebox</h2>
          <button ref={close} className="chip" onClick={() => setMenu(false)}>Close</button>
        </header>
        <div className="menu__grid">
          <section>
            <h3>Route</h3>
            <ol className="menu__route">
              {CHAPTERS.map((c) => (
                <li key={c.id}><button onClick={() => { setMenu(false); go(c.id) }}><span>{String(c.km).padStart(3, '0')}</span>{c.label}</button></li>
              ))}
            </ol>
          </section>
          <section>
            <h3>Secrets <b>{secrets.length}/6</b></h3>
            <ul className="menu__secrets">
              {SECRETS.map((s) => {
                const got = secrets.includes(s.id)
                return <li key={s.id} className={got ? 'got' : ''}><strong>{got ? s.name : 'Unfound'}</strong><span>{got ? s.found : s.hint}</span></li>
              })}
            </ul>
          </section>
          <section>
            <h3>Cheat codes</h3>
            <form onSubmit={submit} className="menu__code">
              <label htmlFor="code">Type a code here, or anywhere on the page</label>
              <div>
                <input id="code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setWrong(false) }} autoComplete="off" spellCheck={false} maxLength={12} placeholder="CODE" />
                <button className="btn btn--solid">Enter</button>
              </div>
              <p role="status">{wrong ? 'Nothing happens. Try another.' : ' '}</p>
            </form>
            <ul className="menu__cheats">
              {CHEATS.map((c) => {
                const on = cheats.includes(c.code)
                return <li key={c.code} className={on ? 'got' : ''}><code>{on ? c.code : `${c.code[0]}${'·'.repeat(c.code.length - 1)}`}</code><span>{on ? c.name : c.hint}</span></li>
              })}
            </ul>
          </section>
          <section>
            <h3>Controls</h3>
            <dl className="menu__keys">
              <div><dt>← → or A D</dt><dd>Steer</dd></div>
              <div><dt>↑ or W</dt><dd>Boost, uses more fuel</dd></div>
              <div><dt>↓ or S</dt><dd>Brake</dd></div>
              <div><dt>Space</dt><dd>Horn</dd></div>
              <div><dt>P or Esc</dt><dd>Pause the run</dd></div>
              <div><dt>Shift + Tab</dt><dd>Switch driver</dd></div>
            </dl>
            <button className="btn btn--quiet" onClick={() => (sure ? (reset(), setSure(false)) : setSure(true))}>{sure ? 'Tap again to erase progress' : 'Erase my progress'}</button>
          </section>
        </div>
      </div>
    </div>
  )
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  const drop = useGame((s) => s.dropToast)
  useEffect(() => {
    if (!toasts.length) return
    const t = setTimeout(() => drop(toasts[0].id), 4600)
    return () => clearTimeout(t)
  }, [toasts, drop])
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.slice(0, 2).map((t) => (
        <div className="toast" key={t.id}>
          <span>{t.kicker}</span>
          <strong>{t.title}</strong>
          {t.body && <p>{t.body}</p>}
        </div>
      ))}
    </div>
  )
}
