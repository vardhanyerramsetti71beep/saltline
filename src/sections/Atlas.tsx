import { useState } from 'react'
import { audio } from '../audio'
import { Poster } from '../art'
import { REGIONS } from '../content'
import { ChapterHead, Reveal, go } from '../hooks'
import { useGame } from '../store'

const MARKS = [[120, 130], [300, 230], [470, 360], [650, 500]]
const LAND = 'M60 60 C150 30 260 60 360 110 S520 200 590 290 S700 440 720 520 C690 560 630 560 590 530 C520 490 470 520 400 490 C320 450 290 380 210 360 C140 340 70 300 55 220 C45 160 40 100 60 60Z'

export function Atlas() {
  const [pick, setPick] = useState(0)
  const find = useGame((s) => s.find)
  const r = REGIONS[pick]
  const choose = (i: number) => {
    audio.click()
    setPick(i)
  }
  return (
    <section id="atlas" className="chapter atlas">
      <ChapterHead mile={112} title="The Free State of Orrin">
        Four regions, 361 miles and a single road between them. Pick a stop on the map.
      </ChapterHead>
      <div className="atlas__grid">
        <Reveal className="map">
          <svg viewBox="0 0 760 620" role="group" aria-label="Map of Orrin and Route 9">
            <defs>
              <pattern id="sea" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 8h16" stroke="var(--sea-line)" strokeWidth="1.500" /></pattern>
              <pattern id="wood" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M7 3l4 8H3Z" fill="#7a4a2a" opacity=".55" /></pattern>
              <clipPath id="landClip"><path d={LAND} /></clipPath>
            </defs>
            <rect width="760" height="620" fill="var(--sea)" />
            <rect width="760" height="620" fill="url(#sea)" />
            <path d={LAND} fill="var(--land)" stroke="var(--ink)" strokeWidth="3" />
            <g clipPath="url(#landClip)">
              <ellipse cx="300" cy="225" rx="118" ry="64" fill="#fbf7ec" stroke="var(--ink)" strokeDasharray="3 6" transform="rotate(26 300 225)" />
              <ellipse cx="480" cy="372" rx="110" ry="74" fill="url(#wood)" transform="rotate(38 480 372)" />
              <g fill="none" stroke="var(--ink)" opacity=".18">
                <path d="M90 90 C190 70 300 100 390 150 S560 270 610 360" /><path d="M100 250 C150 310 240 320 320 400 S500 480 620 510" />
              </g>
            </g>
            <path className="map__route" pathLength={1} d="M120 130 C180 190 230 180 300 230 S410 300 470 360 S590 440 650 500" />
            {MARKS.map(([x, y], i) => (
              <g key={i} className={`map__mark ${i === pick ? 'on' : ''}`} role="button" tabIndex={0} aria-label={REGIONS[i].name} aria-pressed={i === pick}
                onClick={() => choose(i)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), choose(i))}>
                <rect x={i === 3 ? x - 190 : x - 30} y={y - 42} width="220" height="72" fill="transparent" />
                <circle cx={x} cy={y} r={i === pick ? 13 : 9} />
                <text x={x + (i === 3 ? -20 : 20)} y={y - 16} textAnchor={i === 3 ? 'end' : 'start'}>{REGIONS[i].name}</text>
              </g>
            ))}
            <path className="map__isle" d="M648 116 q10 -14 22 -8 q14 2 10 14 q-12 12 -26 6 q-8 -4 -6 -12Z" role="button" tabIndex={0} aria-label="An unnamed island"
              onClick={() => find('island')} onKeyDown={(e) => e.key === 'Enter' && find('island')} />
            <g transform="translate(76 524)" fill="var(--ink)">
              <circle r="34" fill="none" stroke="var(--ink)" strokeWidth="2" />
              <path d="M0 -44 L9 0 L0 9 L-9 0Z" />
              <text y="-50" textAnchor="middle" className="map__n">N</text>
            </g>
            <g transform="translate(150 562)" className="map__scale"><path d="M0 0h130M0 -6v12M65 -6v12M130 -6v12" stroke="var(--ink)" strokeWidth="2" /><text y="22">0</text><text x="124" y="22">50 mi</text></g>
          </svg>
        </Reveal>
        <Reveal className="stop" delay={120}>
          <div className="stop__poster" key={r.id}><Poster region={r.id} label={false} /></div>
          <div className="stop__body">
            <div className="stop__tabs" role="tablist" aria-label="Regions">
              {REGIONS.map((reg, i) => (
                <button key={reg.id} role="tab" aria-selected={i === pick} onClick={() => choose(i)}>{String(reg.from).padStart(3, '0')}</button>
              ))}
            </div>
            <h3>{r.name}</h3>
            <p>{r.blurb}</p>
            <dl>
              <div><dt>Arrive</dt><dd>{r.hour}</dd></div>
              <div><dt>Weather</dt><dd>{r.weather}</dd></div>
              <div><dt>Watch for</dt><dd>{r.watch}</dd></div>
            </dl>
            <button className="btn btn--solid" onClick={() => go('drive')}>Drive this road</button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
