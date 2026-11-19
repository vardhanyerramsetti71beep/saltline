import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { CarSide } from '../art'
import { PAINTS, STRIPES } from '../content'
import { ChapterHead, useNear } from '../hooks'
import { paintUnlocked, upgradesOf, useGame } from '../store'
import type { GarageView } from '../three/garage'
import { MAX_UPGRADE, UPGRADES, VEHICLE_ORDER, VEHICLES, statsFor, upgradeCost, type CarId } from '../vehicles'
import { Coin } from './Drive'
import { MAX_POWER_STOCK, POWERS } from '../powers'
import type { CSSProperties } from 'react'

const Bar = ({ label, value, text }: { label: string; value: number; text: string }) => (
  <div className="stat"><span>{label}</span><i><b style={{ width: `${Math.min(100, value)}%` }} /></i><em>{text}</em></div>
)

export function Garage() {
  const { ref, near, seen } = useNear<HTMLDivElement>('240px')
  const canvas = useRef<HTMLCanvasElement>(null)
  const view = useRef<GarageView | null>(null)
  const [ready, setReady] = useState(false)
  const car = useGame((s) => s.car)
  const [viewing, setViewing] = useState<CarId>(car)
  const paint = useGame((s) => s.paint)
  const stripe = useGame((s) => s.stripe)
  const coins = useGame((s) => s.coins)
  const owned = useGame((s) => s.owned)
  const upgrades = useGame((s) => s.upgrades)
  const setLook = useGame((s) => s.setLook)
  const chooseCar = useGame((s) => s.chooseCar)
  const buyCar = useGame((s) => s.buyCar)
  const buyUpgrade = useGame((s) => s.buyUpgrade)
  const powers = useGame((s) => s.powers)
  const buyPower = useGame((s) => s.buyPower)
  const secrets = useGame((s) => s.secrets)
  const cheats = useGame((s) => s.cheats)
  const unlocked = paintUnlocked({ secrets, cheats })
  const hex = PAINTS.find((p) => p.id === paint)?.hex ?? PAINTS[0].hex
  const v = VEHICLES[viewing]
  const own = owned.includes(viewing)
  const up = upgradesOf({ upgrades }, viewing)
  const stats = statsFor(viewing, up)

  useEffect(() => setViewing(car), [car])

  useEffect(() => {
    if (!seen || view.current || !canvas.current) return
    let dead = false
    void import('../three/garage').then(({ GarageView }) => {
      if (dead || !canvas.current) return
      try {
        view.current = new GarageView(canvas.current)
        setReady(true)
      } catch {
        /* The controls and the flat car drawings still work without WebGL. */
      }
    })
    return () => {
      dead = true
    }
  }, [seen])

  useEffect(() => () => view.current?.dispose(), [])
  useEffect(() => view.current?.setVisible(near), [near, ready])
  useEffect(() => view.current?.setLook({ car: viewing, paint: hex, stripe }), [viewing, hex, stripe, ready])
  useEffect(() => view.current?.setBlueprint(cheats.includes('BLUEPRINT')), [cheats, ready])

  const pick = (id: CarId) => {
    audio.click()
    setViewing(id)
    if (owned.includes(id)) chooseCar(id)
  }
  const buy = () => {
    if (!buyCar(viewing)) audio.fail()
  }

  return (
    <section id="garage" className="chapter garage">
      <ChapterHead km={385} title="Dov’s garage">
        Spend the coins you collect on the road. Buy new cars and trucks, tune their speed, fuel tank and handling, and stock up on special powers for your runs.
      </ChapterHead>
      <div className="bay">
        <div className="bay__view" ref={ref}>
          <canvas ref={canvas} aria-label={`${v.name} on a turntable. Drag to rotate.`} />
          <span className="bay__hint">Drag to turn</span>
          <span className="bay__wallet"><Coin /> {coins.toLocaleString()} coins</span>
        </div>
        <div className="bay__tools">
          <div className="bay__cars" role="radiogroup" aria-label="Vehicles">
            {VEHICLE_ORDER.map((id) => {
              const has = owned.includes(id)
              return (
                <button key={id} role="radio" aria-checked={id === viewing} className={`${id === viewing ? 'on' : ''} ${id === car ? 'active' : ''}`} onClick={() => pick(id)}>
                  <CarSide car={id} color={has ? (id === car ? hex : '#d9cdb4') : 'transparent'} />
                  <span>{VEHICLES[id].name.split(' ').slice(1).join(' ')}</span>
                  <small>{id === car ? 'Driving' : has ? 'Owned' : <><Coin /> {VEHICLES[id].price.toLocaleString()}</>}</small>
                </button>
              )
            })}
          </div>
          <h3>{v.name}</h3>
          <p className="bay__kind">{v.kind} · {v.year} · {v.style} · {stats.top} kmph</p>
          <p>{v.note}{v.offroad ? ' No slowdown on the shoulder.' : ''}</p>
          <div className="stats">
            <Bar label="Top speed" value={(stats.top / 360) * 100} text={`${stats.top} kmph`} />
            <Bar label="Grip" value={(stats.grip / 1.5) * 100} text={stats.grip.toFixed(2)} />
            <Bar label="Fuel range" value={(stats.tank / 2.8) * 100} text={`×${stats.tank.toFixed(2)}`} />
            <Bar label="Toughness" value={stats.tough * 100} text={`${Math.round(stats.tough * 100)}%`} />
          </div>
          {!own && (
            <div className="bay__buy">
              <button className="btn btn--solid" disabled={coins < v.price} onClick={buy}>Buy for {v.price.toLocaleString()} coins</button>
              <p>{coins >= v.price ? 'You can afford it.' : `You need ${(v.price - coins).toLocaleString()} more coins.`}</p>
            </div>
          )}
          {own && (
            <fieldset>
              <legend>Upgrades for the {v.name.split(' ').slice(1).join(' ')}</legend>
              <div className="upgrades">
                {UPGRADES.map((u) => {
                  const lvl = up[u.id]
                  const cost = upgradeCost(u.id, lvl)
                  const maxed = lvl >= MAX_UPGRADE
                  return (
                    <div className="upgrade" key={u.id}>
                      <div><b>{u.name}</b><span>{u.effect}</span></div>
                      <i aria-label={`Level ${lvl} of ${MAX_UPGRADE}`}>{Array.from({ length: MAX_UPGRADE }, (_, i) => <s key={i} className={i < lvl ? 'on' : ''} />)}</i>
                      <button className="btn" disabled={maxed || coins < cost} onClick={() => (buyUpgrade(viewing, u.id) ? null : audio.fail())}>
                        {maxed ? 'Maxed' : <><Coin /> {cost}</>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend>Special powers <b>use them with keys 1 to 6</b></legend>
            <div className="powershop">
              {POWERS.map((p) => {
                const have = powers[p.id] ?? 0
                return (
                  <div className="pshop" key={p.id} style={{ '--pw': p.color } as CSSProperties}>
                    <span className="pshop__icon" aria-hidden="true">{p.icon}</span>
                    <div><b>{p.key} · {p.name}</b><span>{p.effect}</span></div>
                    <em aria-label={`${have} in stock`}>{have}/{MAX_POWER_STOCK}</em>
                    <button className="btn" disabled={have >= MAX_POWER_STOCK || coins < p.price} onClick={() => (buyPower(p.id) ? null : audio.fail())} aria-label={`Buy ${p.name} for ${p.price} coins`}>
                      {have >= MAX_POWER_STOCK ? 'Full' : <><Coin /> {p.price}</>}
                    </button>
                  </div>
                )
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend>Paint <b>{PAINTS.find((p) => p.id === paint)?.name}</b></legend>
            <div className="swatches">
              {PAINTS.map((p) => {
                const locked = p.secret && !unlocked
                return (
                  <button key={p.id} className={p.id === paint ? 'on' : ''} disabled={locked} style={{ background: locked ? undefined : p.hex }}
                    aria-label={locked ? 'Locked paint' : p.name} aria-pressed={p.id === paint} title={locked ? 'Find all four page secrets' : p.name}
                    onClick={() => { audio.spray(); setLook({ paint: p.id }) }}>{locked ? '?' : ''}</button>
                )
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend>Stripes</legend>
            <div className="segs">
              {STRIPES.map((s) => (
                <button key={s.id} className={s.id === stripe ? 'on' : ''} aria-pressed={s.id === stripe} onClick={() => { audio.click(); setLook({ stripe: s.id }) }}>{s.name}</button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </section>
  )
}
