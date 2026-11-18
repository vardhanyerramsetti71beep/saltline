import { useEffect, useRef, useState, type PointerEvent as RP } from 'react'
import { audio } from '../audio'
import { CARS, LEADS, PAINTS, REGIONS, rankFor } from '../content'
import { ChapterHead, go, useNear } from '../hooks'
import { useGame } from '../store'
import type { DriveGame, DriveHud } from '../three/drive'

const IDLE: DriveHud = { phase: 'attract', mph: 0, miles: 0, fuel: 100, hull: 3, hullMax: 3, valves: 0, region: 0, count: 3, reason: '' }

export function Drive() {
  const { ref, near, seen } = useNear<HTMLDivElement>('240px')
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<DriveGame | null>(null)
  const [hud, setHud] = useState(IDLE)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [line, setLine] = useState<{ name: string; hour: string; text: string } | null>(null)
  const car = useGame((s) => s.car)
  const paint = useGame((s) => s.paint)
  const stripe = useGame((s) => s.stripe)
  const lead = useGame((s) => s.lead)
  const cheats = useGame((s) => s.cheats)
  const setDriving = useGame((s) => s.setDriving)
  const bestMiles = useGame((s) => s.bestMiles)
  const secrets = useGame((s) => s.secrets)
  const live = hud.phase !== 'attract'

  useEffect(() => {
    if (!seen || game.current || !canvas.current) return
    let dead = false
    void (async () => {
      try {
        const { DriveGame } = await import('../three/drive')
        if (dead || !canvas.current) return
        const state = useGame.getState()
        const color = PAINTS.find((p) => p.id === state.paint)?.hex ?? '#d63a25'
        const g = new DriveGame(canvas.current, { car: state.car, paint: color, stripe: state.stripe }, state.lead, {
          hud: setHud,
          region: (i) => speak(i),
          ghost: () => useGame.getState().find('ghost'),
          end: (won, miles, valves) => {
            const s = useGame.getState()
            s.recordRun(miles, valves, won)
            if (won) s.find('ferry')
          },
        })
        game.current = g
        if (import.meta.env.DEV) (window as unknown as { __drive: DriveGame }).__drive = g
        g.setVisible(true)
        setReady(true)
      } catch {
        setFailed(true)
      }
    })()
    return () => {
      dead = true
    }
  }, [seen])

  useEffect(() => () => game.current?.dispose(), [])

  useEffect(() => {
    game.current?.setVisible(near || live)
  }, [near, live, ready])

  useEffect(() => {
    game.current?.setLook({ car, paint: PAINTS.find((p) => p.id === paint)?.hex ?? '#d63a25', stripe })
  }, [car, paint, stripe, ready])

  useEffect(() => {
    game.current?.setLead(lead)
  }, [lead, ready])

  useEffect(() => {
    game.current?.setCheats(cheats.includes('LOWTIDE'), cheats.includes('BLUEPRINT'))
  }, [cheats, ready])

  useEffect(() => {
    setDriving(live)
    return () => setDriving(false)
  }, [live, setDriving])

  useEffect(() => {
    if (!line) return
    const t = setTimeout(() => setLine(null), 5200)
    return () => clearTimeout(t)
  }, [line])

  useEffect(() => {
    if (!live) return
    const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    }
    const down = (e: KeyboardEvent) => {
      const g = game.current
      if (!g) return
      const key = map[e.code]
      if (key) {
        e.preventDefault()
        g.input[key] = true
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat) audio.horn()
      }
      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
        e.preventDefault()
        if (g.phase === 'paused') g.resume()
        else g.pause()
      }
    }
    const up = (e: KeyboardEvent) => {
      const key = map[e.code]
      if (key && game.current) game.current.input[key] = false
    }
    const hidden = () => document.hidden && game.current?.pause()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      document.removeEventListener('visibilitychange', hidden)
    }
  }, [live])

  function speak(index: number) {
    const r = REGIONS[index]
    const who = useGame.getState().lead
    setLine({ name: r.name, hour: r.hour, text: r.banter[who] })
  }

  const start = () => {
    audio.click()
    game.current?.begin()
    speak(0)
  }
  const leave = () => {
    audio.click()
    game.current?.quit()
    setHud(IDLE)
    setLine(null)
  }
  const toCard = () => {
    leave()
    setTimeout(() => go('logbook'), 80)
  }

  const hold = (key: 'left' | 'right' | 'up' | 'down') => ({
    onPointerDown: (e: RP) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      if (game.current) game.current.input[key] = true
    },
    onPointerUp: () => { if (game.current) game.current.input[key] = false },
    onPointerCancel: () => { if (game.current) game.current.input[key] = false },
  })

  const spec = CARS[car]
  const over = hud.phase === 'over' || hud.phase === 'win'
  const low = hud.fuel < 25
  return (
    <section id="drive" className="chapter drive">
      <ChapterHead mile={180} title="Get the signal to the Cape">
        Collect radio valves, keep fuel in the tank and miss the roadblocks. Run time is about two and a half minutes.
      </ChapterHead>
      <div ref={ref} className={`stage ${live ? 'stage--live' : ''}`}>
        <canvas ref={canvas} aria-label="3D road trip game" />

        {failed && <div className="stage__panel"><h3>The road needs WebGL</h3><p>This browser could not start the 3D drive. Everything else on the page still works.</p></div>}

        {!live && !failed && (
          <div className="stage__panel">
            <span className="stage__kicker">{LEADS[lead].name} at the wheel</span>
            <h3>{spec.name}</h3>
            <p className="stage__keys"><kbd>← →</kbd> steer <kbd>↑</kbd> boost <kbd>↓</kbd> brake <kbd>Space</kbd> horn</p>
            <p className="stage__touch">Hold the on-screen pedals to steer and boost.</p>
            <button className="btn btn--solid btn--big" disabled={!ready} onClick={start}>{ready ? 'Start the run' : 'Fuelling up'}</button>
            <p className="stage__best">{bestMiles ? `Best run: mile ${bestMiles}` : 'No runs logged yet'}</p>
          </div>
        )}

        {live && (
          <>
            <div className="rh rh--top">
              <div className="rh__place"><b>{REGIONS[hud.region].name}</b><span>{REGIONS[hud.region].hour} · {REGIONS[hud.region].weather}</span></div>
              <div className="rh__track" aria-hidden="true">
                <i style={{ width: `${(hud.miles / 361) * 100}%` }} />
                {REGIONS.slice(1).map((r) => <s key={r.id} style={{ left: `${(r.from / 361) * 100}%` }} />)}
              </div>
              <button className="rh__pause" onClick={() => (hud.phase === 'paused' ? game.current?.resume() : game.current?.pause())} aria-label="Pause">II</button>
            </div>
            <div className="rh rh--bottom">
              <div className="rh__speed"><b>{hud.mph}</b><span>mph</span></div>
              <div className="rh__miles"><b>{Math.floor(hud.miles)}</b><span>of 361 miles</span></div>
              <div className="rh__valves"><b>{hud.valves}</b><span>valves</span></div>
              <div className="rh__tank">
                <span className={low ? 'low' : ''}>{cheats.includes('LOWTIDE') ? 'Fuel: bottomless' : low ? 'Fuel low' : 'Fuel'}</span>
                <div className="rh__fuel"><i className={low ? 'low' : ''} style={{ width: `${hud.fuel}%` }} /></div>
                <div className="rh__hull" aria-label={`Hull ${hud.hull} of ${hud.hullMax}`}>
                  {Array.from({ length: hud.hullMax }, (_, i) => <i key={i} className={i < hud.hull ? 'on' : ''} />)}
                </div>
              </div>
            </div>

            {line && hud.phase === 'run' && (
              <div className="rh__line" key={line.name}>
                <b>{LEADS[lead].name.split(' ')[0]}</b> {line.text}
              </div>
            )}

            {hud.phase === 'count' && <div className="rh__count" key={hud.count}>{hud.count}</div>}

            <div className="pads">
              <button aria-label="Steer left" {...hold('left')}>◀</button>
              <button aria-label="Boost" className="pads__boost" {...hold('up')}>Boost</button>
              <button aria-label="Steer right" {...hold('right')}>▶</button>
            </div>

            {hud.phase === 'paused' && (
              <div className="stage__panel stage__panel--center">
                <span className="stage__kicker">Pulled over at mile {Math.floor(hud.miles)}</span>
                <h3>Paused</h3>
                <button className="btn btn--solid btn--big" onClick={() => game.current?.resume()}>Back on the road</button>
                <button className="btn btn--light" onClick={leave}>Quit the run</button>
              </div>
            )}

            {over && (
              <div className="stage__panel stage__panel--center">
                <span className="stage__kicker">{hud.phase === 'win' ? 'Cape Lantern, 06:00' : `Stopped at mile ${Math.floor(hud.miles)}`}</span>
                <h3>{hud.phase === 'win' ? 'You made the ferry' : 'End of the road'}</h3>
                <p>{hud.reason}</p>
                <dl className="stage__stats">
                  <div><dt>Miles</dt><dd>{Math.floor(hud.miles)}</dd></div>
                  <div><dt>Valves</dt><dd>{hud.valves}</dd></div>
                  <div><dt>Rank</dt><dd>{rankFor(Math.max(bestMiles, hud.miles), secrets.length, hud.phase === 'win')}</dd></div>
                </dl>
                <button className="btn btn--solid btn--big" onClick={start}>Run it again</button>
                <div className="stage__row">
                  <button className="btn btn--light" onClick={toCard}>Make my card</button>
                  <button className="btn btn--light" onClick={leave}>Back to the page</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
