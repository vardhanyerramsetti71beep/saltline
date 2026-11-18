import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { CarSide } from '../art'
import { CARS, PAINTS, STRIPES, type CarId } from '../content'
import { ChapterHead, useNear } from '../hooks'
import { paintUnlocked, useGame } from '../store'
import type { GarageView } from '../three/garage'

const Bar = ({ label, value }: { label: string; value: number }) => (
  <div className="stat"><span>{label}</span><i><b style={{ width: `${Math.min(100, value)}%` }} /></i></div>
)

export function Garage() {
  const { ref, near, seen } = useNear<HTMLDivElement>('240px')
  const canvas = useRef<HTMLCanvasElement>(null)
  const view = useRef<GarageView | null>(null)
  const [ready, setReady] = useState(false)
  const car = useGame((s) => s.car)
  const paint = useGame((s) => s.paint)
  const stripe = useGame((s) => s.stripe)
  const setLook = useGame((s) => s.setLook)
  const secrets = useGame((s) => s.secrets)
  const cheats = useGame((s) => s.cheats)
  const unlocked = paintUnlocked({ secrets, cheats })
  const hex = PAINTS.find((p) => p.id === paint)?.hex ?? PAINTS[0].hex
  const spec = CARS[car]

  useEffect(() => {
    if (!seen || view.current || !canvas.current) return
    let dead = false
    void import('../three/garage').then(({ GarageView }) => {
      if (dead || !canvas.current) return
      try {
        view.current = new GarageView(canvas.current)
        setReady(true)
      } catch {
        /* The controls and the flat car drawing still work without WebGL. */
      }
    })
    return () => {
      dead = true
    }
  }, [seen])

  useEffect(() => () => view.current?.dispose(), [])
  useEffect(() => view.current?.setVisible(near), [near, ready])
  useEffect(() => view.current?.setLook({ car, paint: hex, stripe }), [car, hex, stripe, ready])
  useEffect(() => view.current?.setBlueprint(cheats.includes('BLUEPRINT')), [cheats, ready])

  return (
    <section id="garage" className="chapter garage">
      <ChapterHead km={385} title="Dov’s garage">
        Three cars, seven paints. Whatever leaves this bay is what you drive.
      </ChapterHead>
      <div className="bay">
        <div className="bay__view" ref={ref}>
          <canvas ref={canvas} aria-label={`${spec.name} on a turntable. Drag to rotate.`} />
          <span className="bay__hint">Drag to turn</span>
        </div>
        <div className="bay__tools">
          <div className="bay__cars" role="radiogroup" aria-label="Car">
            {(Object.keys(CARS) as CarId[]).map((id) => (
              <button key={id} role="radio" aria-checked={id === car} className={id === car ? 'on' : ''} onClick={() => { audio.click(); setLook({ car: id }) }}>
                <CarSide car={id} color={id === car ? hex : 'transparent'} />
                <span>{CARS[id].name.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
          </div>
          <h3>{spec.name}</h3>
          <p className="bay__kind">{spec.year} · {spec.kind} · {spec.top} kmph</p>
          <p>{spec.note}</p>
          <div className="stats">
            <Bar label="Top speed" value={(spec.top / 256) * 100} />
            <Bar label="Grip" value={spec.grip * 100} />
            <Bar label="Tank" value={(spec.tank / 1.4) * 100} />
            <Bar label="Toughness" value={(spec.tough / 0.8) * 100} />
          </div>
          <fieldset>
            <legend>Paint <b>{PAINTS.find((p) => p.id === paint)?.name}</b></legend>
            <div className="swatches">
              {PAINTS.map((p) => {
                const locked = p.secret && !unlocked
                return (
                  <button key={p.id} className={p.id === paint ? 'on' : ''} disabled={locked} style={{ background: locked ? undefined : p.hex }}
                    aria-label={locked ? 'Locked paint' : p.name} aria-pressed={p.id === paint} title={locked ? 'Find all six secrets' : p.name}
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
