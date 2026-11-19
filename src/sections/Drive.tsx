import { useEffect, useRef, useState, type FormEvent, type PointerEvent as RP } from 'react'
import { audio } from '../audio'
import { LEADS, PAINTS, STATIONS } from '../content'
import { ChapterHead, go, useNear } from '../hooks'
import { LEVELS } from '../levels'
import { levelOpen, upgradesOf, useGame } from '../store'
import type { DriveGame, DriveHud } from '../three/drive'
import { VEHICLES, statsFor } from '../vehicles'

const IDLE: DriveHud = { phase: 'attract', level: 0, kmh: 0, km: 0, length: 580, fuel: 100, lives: 3, livesMax: 3, coins: 0, region: 0, count: 3, reason: '', lostWhy: '', boost: false, park: null, respawnCost: 100, respawns: 0 }

const Heart = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" className={on ? 'on' : ''} aria-hidden="true">
    <path d="M12 21C7 17 2 13.200 2 8.500 2 5.400 4.400 3 7.300 3c1.900 0 3.700 1 4.700 2.700C13 4 14.800 3 16.700 3 19.600 3 22 5.400 22 8.500 22 13.200 17 17 12 21Z" />
  </svg>
)

export const Coin = () => <i className="coin" aria-hidden="true" />

type Result = { won: boolean; level: number; coins: number; bonus: number; km: number }

export function Drive() {
  const { ref, near, seen } = useNear<HTMLDivElement>('240px')
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<DriveGame | null>(null)
  const [hud, setHud] = useState(IDLE)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [line, setLine] = useState<{ id: number; who: string; text: string } | null>(null)
  const [lost, setLost] = useState<{ id: number; left: number; why: string } | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [code, setCode] = useState('')
  const [codeNote, setCodeNote] = useState('')
  const livesSeen = useRef(3)
  const radioDeclined = useRef(false)
  const runLevel = useRef(0)

  const car = useGame((s) => s.car)
  const paint = useGame((s) => s.paint)
  const stripe = useGame((s) => s.stripe)
  const lead = useGame((s) => s.lead)
  const cheats = useGame((s) => s.cheats)
  const level = useGame((s) => s.level)
  const levelsDone = useGame((s) => s.levelsDone)
  const openRoad = useGame((s) => s.openRoad)
  const secrets = useGame((s) => s.secrets)
  const coins = useGame((s) => s.coins)
  const upgrades = useGame((s) => s.upgrades)
  const radioOn = useGame((s) => s.radioOn)
  const radioFreq = useGame((s) => s.radioFreq)
  const setLevel = useGame((s) => s.setLevel)
  const setDriving = useGame((s) => s.setDriving)
  const live = hud.phase !== 'attract'
  const L = LEVELS[live ? hud.level : level]
  const stats = statsFor(car, upgradesOf({ upgrades }, car))

  useEffect(() => {
    if (!seen || game.current || !canvas.current) return
    let dead = false
    void (async () => {
      try {
        const { DriveGame } = await import('../three/drive')
        if (dead || !canvas.current) return
        const s = useGame.getState()
        const look = { car: s.car, paint: PAINTS.find((p) => p.id === s.paint)?.hex ?? '#d63a25', stripe: s.stripe }
        const g = new DriveGame(canvas.current, look, statsFor(s.car, upgradesOf(s, s.car)), s.lead, s.level, {
          hud: setHud,
          region: (i) => speak(i),
          park: () => say('Pit stop ahead. Slow down and stop inside the bay.'),
          secret: (id) => useGame.getState().find(id),
          end: (r) => {
            const { bonus } = useGame.getState().endRun(r)
            setResult({ won: r.won, level: r.level, coins: r.coins, bonus, km: r.km })
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
  useEffect(() => game.current?.setVisible(near || live), [near, live, ready])
  useEffect(() => game.current?.setLook({ car, paint: PAINTS.find((p) => p.id === paint)?.hex ?? '#d63a25', stripe }), [car, paint, stripe, ready])
  useEffect(() => game.current?.setStats(statsFor(car, upgradesOf({ upgrades }, car))), [car, upgrades, ready])
  useEffect(() => game.current?.setLead(lead), [lead, ready])
  useEffect(() => game.current?.setLevel(level), [level, ready])
  useEffect(() => game.current?.setCheats({ infinite: cheats.includes('LOWTIDE'), blueprint: cheats.includes('BLUEPRINT'), ironhide: cheats.includes('IRONHIDE') }), [cheats, ready])

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
    if (hud.lives < livesSeen.current && hud.lives > 0) setLost({ id: Date.now(), left: hud.lives, why: hud.lostWhy })
    livesSeen.current = hud.lives
  }, [hud.lives, hud.lostWhy])

  useEffect(() => {
    if (!lost) return
    const t = setTimeout(() => setLost(null), 1700)
    return () => clearTimeout(t)
  }, [lost])

  useEffect(() => {
    if (!live) return
    const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    }
    const down = (e: KeyboardEvent) => {
      const g = game.current
      if (!g || (e.target as HTMLElement).matches('input')) return
      const key = map[e.code]
      if (key) {
        e.preventDefault()
        g.input[key] = true
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat) honk()
      }
      if (e.code === 'Escape' && !e.repeat && !useGame.getState().menu) {
        e.preventDefault()
        if (g.phase === 'paused') g.resume()
        else g.pause()
      }
      if (e.code === 'KeyR' && !e.repeat) radio()
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

  function say(text: string) {
    const who = LEADS[useGame.getState().lead].name.split(' ')[0]
    setLine({ id: Date.now(), who, text })
  }
  function speak(index: number) {
    const s = useGame.getState()
    const r = LEVELS[runLevel.current].regions[index]
    if (r) say(r.banter[s.lead])
  }

  function honk() {
    audio.horn()
    game.current?.honk()
  }
  function radio() {
    const s = useGame.getState()
    if (s.radioOn && STATIONS.findIndex((st) => Math.abs(st.freq - s.radioFreq) < 0.2) === STATIONS.length - 1) radioDeclined.current = true
    s.cycleRadio()
  }

  const start = (n = useGame.getState().level) => {
    audio.click()
    setResult(null)
    if (n !== useGame.getState().level) useGame.getState().setLevel(n)
    runLevel.current = n
    game.current?.setLevel(n)
    game.current?.begin()
    const s = useGame.getState()
    if (s.sound && !s.radioOn && !radioDeclined.current) s.setRadio(true)
    say(LEVELS[n].regions[0].banter[s.lead])
  }
  const leave = () => {
    audio.click()
    game.current?.quit()
    setHud(IDLE)
    setLine(null)
    setResult(null)
  }
  const goTo = (id: string) => {
    leave()
    setTimeout(() => go(id), 80)
  }
  /** Pays for one more life: coins picked up in this run are spent first, then the wallet. */
  const buyLife = () => {
    const g = game.current
    if (!g || g.phase !== 'down') return
    const cost = g.respawnCost
    const s = useGame.getState()
    if (s.coins + hud.coins < cost) return audio.fail()
    const fromRun = g.takeRunCoins(cost)
    if (!s.spend(cost - fromRun)) return audio.fail()
    g.respawn()
  }
  const enterCode = (e: FormEvent) => {
    e.preventDefault()
    const ok = useGame.getState().cheat(code)
    setCodeNote(ok ? 'Done.' : 'Nothing happens. Check the glovebox for the codes.')
    if (ok) setCode('')
  }

  const hold = (key: 'left' | 'right' | 'up' | 'down') => ({
    onPointerDown: (e: RP) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      if (game.current) game.current.input[key] = true
    },
    onPointerUp: () => { if (game.current) game.current.input[key] = false },
    onPointerCancel: () => { if (game.current) game.current.input[key] = false },
  })

  const v = VEHICLES[car]
  const over = hud.phase === 'over' || hud.phase === 'win'
  const low = hud.fuel < 25
  const station = STATIONS.find((s) => Math.abs(s.freq - radioFreq) < 0.2)
  const region = L.regions[hud.region] ?? L.regions[0]
  const nextLevel = result?.won ? LEVELS[result.level + 1] : undefined
  const levelSecrets = (n: number) => LEVELS[n].secrets.filter((s) => secrets.includes(s.id)).length
  return (
    <section id="drive" className="chapter drive">
      <ChapterHead km={290} title="Get the signal through">
        Four levels, each on a new map. Collect coins, watch the fuel, miss the roadblocks and park at the pit stop to unlock the next level. Out of lives? Spend coins to respawn, and each respawn in a run costs double. Every level hides six secrets.
      </ChapterHead>
      <div ref={ref} className={`stage ${live ? 'stage--live' : ''} ${hud.boost ? 'is-boost' : ''}`}>
        <canvas ref={canvas} aria-label="3D road trip game" />

        {failed && <div className="stage__panel"><h3>The road needs WebGL</h3><p>This browser could not start the 3D drive. Everything else on the page still works.</p></div>}

        {!live && !failed && (
          <div className="stage__panel stage__panel--menu">
            <span className="stage__kicker">{LEADS[lead].name} · {v.name}</span>
            <h3>Level {L.n}: {L.name}</h3>
            <div className="levels" role="radiogroup" aria-label="Choose a level">
              {LEVELS.map((l, i) => {
                const open = levelOpen({ levelsDone, openRoad }, i)
                return (
                  <button key={l.id} role="radio" aria-checked={i === level} disabled={!open} className={i === level ? 'on' : ''} onClick={() => { audio.click(); setLevel(i) }}>
                    <b>{l.n}</b>
                    <span>{l.name}{levelsDone.includes(i) ? ' ✓' : ''}</span>
                    <small>{open ? `${l.length} km · ${levelSecrets(i)}/6 secrets` : `Finish level ${l.n - 1} to unlock`}</small>
                  </button>
                )
              })}
            </div>
            <p className="stage__keys"><kbd>← →</kbd> steer <kbd>↑</kbd> boost <kbd>↓</kbd> brake <kbd>Space</kbd> horn <kbd>R</kbd> radio <kbd>Esc</kbd> pause</p>
            <p className="stage__touch">Hold the on-screen pedals to steer, brake and boost.</p>
            <button className="btn btn--solid btn--big" disabled={!ready} onClick={() => start()}>{ready ? `Start level ${L.n}` : 'Fuelling up'}</button>
            <p className="stage__best"><Coin /> {coins.toLocaleString()} coins · 3 lives · boost burns fuel fast</p>
          </div>
        )}

        {live && (
          <>
            <div className="rh rh--top">
              <div className="rh__place"><b>{region.name}</b><span>Level {L.n} · {region.hour} · {region.weather}</span></div>
              <div className="rh__track" aria-hidden="true">
                <i style={{ width: `${(hud.km / hud.length) * 100}%` }} />
                {L.regions.slice(1).map((r) => <s key={r.id} style={{ left: `${(r.from / hud.length) * 100}%` }} />)}
              </div>
              <button className={`rh__radio ${radioOn ? 'on' : ''}`} onClick={radio} aria-label={radioOn ? `Radio: ${station?.name ?? 'static'}. Change station` : 'Turn the radio on'}>
                <span aria-hidden="true">♪</span> {radioOn ? station?.name ?? 'Static' : 'Radio off'}
              </button>
              <button className="rh__pause" onClick={() => (hud.phase === 'paused' ? game.current?.resume() : game.current?.pause())} aria-label="Pause">II</button>
            </div>
            <div className="rh rh--bottom">
              <div className="rh__speed"><b>{hud.kmh}</b><span>kmph</span></div>
              <div className="rh__km"><b>{Math.floor(hud.km)}</b><span>of {hud.length} km</span></div>
              <div className="rh__coins"><b><Coin />{hud.coins}</b><span>coins</span></div>
              <div className="rh__lives" role="img" aria-label={`${hud.lives} of ${hud.livesMax} lives left`}>
                <div>{Array.from({ length: hud.livesMax }, (_, i) => <Heart key={i} on={i < hud.lives} />)}</div>
                <span>lives</span>
              </div>
              <div className="rh__tank">
                <span className={low ? 'low' : ''}>{cheats.includes('LOWTIDE') ? 'Fuel: bottomless' : hud.boost ? 'Boost: burning fuel fast' : low ? 'Fuel low' : 'Fuel'}</span>
                <div className="rh__fuel"><i className={`${low ? 'low' : ''} ${hud.boost ? 'boost' : ''}`} style={{ width: `${hud.fuel}%` }} /></div>
              </div>
            </div>

            {hud.park && hud.phase === 'park' && (
              <div className={`rh__park ${hud.park.aligned ? 'ok' : ''}`} role="status">
                <span>Pit stop · {L.pitStop}</span>
                <b>{hud.park.aligned ? (hud.park.slow ? 'Hold it…' : 'Brake now!') : hud.park.metres > 2 ? `${hud.park.metres} m to the bay` : 'Line up with the bay'}</b>
                <small>{hud.park.reverse ? 'Reversing' : 'Steer into the glowing bay. Hold ↓ to brake, keep holding to reverse.'}</small>
              </div>
            )}

            {line && (hud.phase === 'run' || hud.phase === 'park') && !hud.park && (
              <div className="rh__line" key={line.id}><b>{line.who}</b> {line.text}</div>
            )}

            {lost && (hud.phase === 'run' || hud.phase === 'park') && (
              <div className="rh__lost" key={lost.id} role="status">
                <div><span>{lost.why}</span><b>{lost.left} {lost.left === 1 ? 'life' : 'lives'} left</b></div>
              </div>
            )}

            {hud.phase === 'count' && <div className="rh__count" key={hud.count}>{hud.count}</div>}

            <div className="pads">
              <button aria-label="Steer left" {...hold('left')}>◀</button>
              <button aria-label="Brake" className="pads__text" {...hold('down')}>Brake</button>
              <button aria-label="Horn" className="pads__text pads__horn" onPointerDown={honk}>Horn</button>
              <button aria-label="Boost" className="pads__text" {...hold('up')}>Boost</button>
              <button aria-label="Steer right" {...hold('right')}>▶</button>
            </div>

            {hud.phase === 'paused' && (
              <div className="stage__panel stage__panel--center">
                <span className="stage__kicker">Pulled over at km {Math.floor(hud.km)}</span>
                <h3>Paused</h3>
                <button className="btn btn--solid btn--big" onClick={() => game.current?.resume()}>Back on the road</button>
                <form className="stage__code" onSubmit={enterCode}>
                  <label htmlFor="runcode">Cheat code</label>
                  <div>
                    <input id="runcode" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeNote('') }} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12} placeholder="CODE" />
                    <button className="btn">Enter</button>
                  </div>
                  <p role="status">{codeNote || ' '}</p>
                </form>
                <div className="stage__row">
                  <button className="btn btn--light" onClick={() => useGame.getState().setMenu(true)}>Open glovebox</button>
                  <button className="btn btn--light" onClick={leave}>Quit the run</button>
                </div>
              </div>
            )}

            {hud.phase === 'down' && (() => {
              const cost = hud.respawnCost
              const have = coins + hud.coins
              const short = cost - have
              return (
                <div className="stage__panel stage__panel--center stage__panel--down">
                  <span className="stage__kicker">Out of lives at km {Math.floor(hud.km)}</span>
                  <h3>Respawn?</h3>
                  <p>{hud.reason}</p>
                  <div className="respawn">
                    <span>One extra life</span>
                    <b><Coin />{cost.toLocaleString()}</b>
                    <small>{hud.respawns ? `Respawn ${hud.respawns + 1} this run. ` : ''}The next one costs {(cost * 2).toLocaleString()}.</small>
                  </div>
                  <button className="btn btn--solid btn--big" disabled={short > 0} onClick={buyLife}>Respawn for {cost.toLocaleString()} coins</button>
                  <p className="stage__note">{short > 0 ? `You have ${have.toLocaleString()} coins. You need ${short.toLocaleString()} more.` : `You have ${have.toLocaleString()} coins, ${hud.coins} of them from this run.`}</p>
                  <button className="btn btn--light" onClick={() => game.current?.giveUp()}>End the run</button>
                </div>
              )
            })()}

            {over && (
              <div className="stage__panel stage__panel--center">
                <span className="stage__kicker">{hud.phase === 'win' ? `Level ${L.n} complete` : `Stopped at km ${Math.floor(hud.km)}`}</span>
                <h3>{hud.phase === 'win' ? 'Parked and safe' : 'End of the road'}</h3>
                <p>{hud.reason}</p>
                <dl className="stage__stats">
                  <div><dt>Km</dt><dd>{Math.floor(hud.km)}</dd></div>
                  <div><dt>Coins</dt><dd>+{(result?.coins ?? hud.coins) + (result?.bonus ?? 0)}</dd></div>
                  <div><dt>Secrets</dt><dd>{levelSecrets(hud.level)}/6</dd></div>
                </dl>
                {!!result?.bonus && <p className="stage__note">Includes a {result.bonus}-coin bonus for finishing the level.</p>}
                {nextLevel ? (
                  <button className="btn btn--solid btn--big" onClick={() => start(nextLevel.n - 1)}>Next level: {nextLevel.name}</button>
                ) : (
                  <button className="btn btn--solid btn--big" onClick={() => start(hud.level)}>Run it again</button>
                )}
                <div className="stage__row">
                  {nextLevel && <button className="btn btn--light" onClick={() => start(hud.level)}>Replay</button>}
                  <button className="btn btn--light" onClick={() => goTo('garage')}>Spend coins</button>
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
