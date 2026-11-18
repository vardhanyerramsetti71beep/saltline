import { useId, type ReactNode } from 'react'
import type { CarId } from './content'

export const INK = '#13192b'
export const PAPER = '#efe6d3'
export const RED = '#e0412a'
export const TEAL = '#0f7c7a'
export const MUSTARD = '#e2a32a'

export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Halftone({ id, color, size = 12, r = 3.4 }: { id: string; color: string; size?: number; r?: number }) {
  return (
    <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
      <circle cx={size / 2} cy={size / 2} r={r} fill={color} />
    </pattern>
  )
}

function pines(y: number, h: number, step: number, seed: number) {
  const r = rng(seed)
  let d = `M-20 1000 L-20 ${y}`
  for (let x = -20; x < 840; x += step) {
    const top = h * (0.6 + r() * 0.7)
    d += ` L${x + step * 0.3} ${y - top * 0.42} L${x + step * 0.16} ${y - top * 0.42} L${x + step * 0.5} ${y - top} L${x + step * 0.84} ${y - top * 0.42} L${x + step * 0.7} ${y - top * 0.42} L${x + step} ${y}`
  }
  return `${d} L840 1000 Z`
}

function Crane({ x, s, color }: { x: number; s: number; color: string }) {
  return (
    <g transform={`translate(${x} 690) scale(${s})`} fill="none" stroke={color} strokeWidth={8} strokeLinejoin="round">
      <path d="M-46 0 L-22 -250 M46 0 L22 -250 M-36 -90 L36 -90 M-28 -180 L28 -180 M-36 -90 L28 -180 M36 -90 L-28 -180" />
      <path d="M-110 -262 L210 -262 M-22 -250 L0 -340 L22 -250 M0 -340 L190 -262 M0 -340 L-100 -262" />
      <path d="M130 -262 L130 -150" strokeWidth={4} />
      <rect x={110} y={-150} width={40} height={20} fill={color} />
    </g>
  )
}

export function Poster({ region, label = true }: { region: string; label?: boolean }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const r = rng(region.length * 97 + 11)
  let scene: ReactNode = null
  let caption = { name: 'Port Sable', marker: 'KM 000', ink: PAPER }

  if (region === 'sable') {
    const rain = Array.from({ length: 90 }, () => [r() * 860 - 30, r() * 720, 26 + r() * 40])
    scene = (
      <>
        <rect width="800" height="1000" fill="#1b2142" />
        <rect y="240" width="800" height="150" fill="#2a2752" />
        <rect y="390" width="800" height="150" fill="#49304f" />
        <rect y="540" width="800" height="160" fill="#8c3b3f" />
        <circle cx="548" cy="572" r="172" fill={RED} />
        <circle cx="548" cy="572" r="172" fill={`url(#${uid}d)`} />
        <Crane x={150} s={1.15} color={INK} />
        <Crane x={420} s={0.8} color={INK} />
        <Crane x={680} s={1} color={INK} />
        {[[20, 640, TEAL], [112, 640, MUSTARD], [204, 640, RED], [62, 596, PAPER], [154, 596, TEAL], [560, 650, MUSTARD], [652, 650, TEAL]].map(([x, y, c], i) => (
          <rect key={i} x={x as number} y={y as number} width="88" height="42" fill={c as string} stroke={INK} strokeWidth="4" />
        ))}
        <rect y="690" width="800" height="310" fill={INK} />
        {Array.from({ length: 11 }, (_, i) => (
          <rect key={i} x={548 - (150 - i * 11) + (i % 2) * 16} y={704 + i * 15} width={(150 - i * 11) * 2} height="5" fill={RED} />
        ))}
        <g stroke={PAPER} strokeOpacity=".42" strokeWidth="2">
          {rain.map(([x, y, l], i) => <line key={i} x1={x} y1={y} x2={x - l * 0.34} y2={y + l} />)}
        </g>
      </>
    )
  } else if (region === 'flats') {
    caption = { name: 'The Glass Flats', marker: 'KM 180', ink: INK }
    scene = (
      <>
        <rect width="800" height="1000" fill="#f0c95f" />
        <rect y="190" width="800" height="170" fill="#f3d684" />
        <rect y="360" width="800" height="150" fill="#f6e5ae" />
        <circle cx="400" cy="400" r="196" fill={PAPER} />
        <circle cx="400" cy="400" r="196" fill={`url(#${uid}d)`} opacity=".5" />
        <rect y="580" width="800" height="420" fill="#f8f2e4" />
        {[586, 596, 610].map((y, i) => <rect key={y} x={70 + i * 90} y={y} width={560 - i * 150} height={4 - i} fill={TEAL} />)}
        <path d="M400 580 L190 1000 L610 1000 Z" fill={INK} />
        {[640, 700, 780, 890].map((y, i) => <path key={y} d={`M${398 - i} ${y} h${4 + i * 2} l${2 + i} ${28 + i * 16} h${-(8 + i * 4)} Z`} fill={PAPER} />)}
        {[[650, 600, 0.32], [700, 640, 0.58], [770, 720, 1]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth="7" fill="none">
            <path d="M0 40 L0 -190 M-44 -170 L44 -170 M-34 -140 L34 -140" />
          </g>
        ))}
        <g stroke={INK} strokeWidth="1.500" opacity=".35" fill="none">
          <path d="M60 760 l90 40 l-20 70 M150 800 l70 -20 M40 900 l80 -30 l40 70 M690 880 l-60 40 l40 60" />
        </g>
      </>
    )
  } else if (region === 'pines') {
    caption = { name: 'Ember Pines', marker: 'KM 385', ink: PAPER }
    const embers = Array.from({ length: 46 }, () => [r() * 800, r() * 760, 2 + r() * 5])
    scene = (
      <>
        <rect width="800" height="1000" fill="#8c1f1c" />
        <rect y="180" width="800" height="160" fill="#b92f1e" />
        <rect y="340" width="800" height="150" fill={RED} />
        <rect y="490" width="800" height="200" fill="#ee7a2b" />
        <circle cx="280" cy="470" r="150" fill={MUSTARD} />
        <path d={pines(600, 150, 56, 3)} fill="#b6401f" />
        <path d={pines(700, 190, 74, 8)} fill="#7a2a1e" />
        <path d={pines(810, 240, 96, 5)} fill="#40191c" />
        <path d={pines(930, 300, 128, 21)} fill={INK} />
        {embers.map(([x, y, s], i) => <circle key={i} cx={x} cy={y} r={s} fill={i % 3 ? MUSTARD : PAPER} />)}
      </>
    )
  } else {
    caption = { name: 'Cape Lantern', marker: 'KM 470', ink: PAPER }
    const stars = Array.from({ length: 80 }, () => [r() * 800, r() * 500, 0.8 + r() * 2])
    scene = (
      <>
        <rect width="800" height="1000" fill="#0a1230" />
        <rect y="330" width="800" height="210" fill="#10224a" />
        <rect y="540" width="800" height="140" fill="#17395f" />
        {stars.map(([x, y, s], i) => <circle key={i} cx={x} cy={y} r={s} fill={PAPER} />)}
        <path d="M512 306 L-40 110 L-40 300 Z" fill={MUSTARD} opacity=".9" />
        <path d="M528 306 L860 410 L860 250 Z" fill={MUSTARD} opacity=".55" />
        <path d="M478 720 L498 330 L542 330 L562 720 Z" fill={PAPER} />
        <path d="M491 470 L549 470 L554 560 L486 560 Z M482 640 L558 640 L562 720 L478 720 Z" fill={RED} />
        <rect x="486" y="318" width="68" height="16" fill={INK} />
        <rect x="498" y="274" width="44" height="44" fill={MUSTARD} stroke={INK} strokeWidth="6" />
        <path d="M490 274 L520 240 L550 274 Z" fill={RED} stroke={INK} strokeWidth="5" />
        <path d="M250 1000 Q300 760 450 716 Q600 690 760 744 L840 780 L840 1000 Z" fill={INK} />
        <rect y="790" width="460" height="210" fill="#0f5c68" />
        {Array.from({ length: 6 }, (_, row) => (
          <path key={row} d={Array.from({ length: 9 }, (_, i) => `M${i * 72 - 40 + row * 20} ${812 + row * 32} q18 -14 36 0 t36 0`).join(' ')} fill="none" stroke={PAPER} strokeOpacity=".55" strokeWidth="3" />
        ))}
        <path d="M250 1000 Q300 870 460 842 L460 1000 Z" fill={INK} />
      </>
    )
  }

  return (
    <svg className="poster" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Travel poster of ${caption.name}`}>
      <defs>
        <Halftone id={`${uid}d`} color={region === 'flats' ? MUSTARD : '#b22d1b'} />
      </defs>
      {scene}
      {label && (
        <g fill={caption.ink} style={{ fontFamily: 'var(--display)' }}>
          <text x="44" y="82" fontSize="30" style={{ fontFamily: 'var(--mono)' }}>{caption.marker}</text>
          <text x="756" y="82" fontSize="30" textAnchor="end" style={{ fontFamily: 'var(--mono)' }}>ROUTE 9</text>
          <text x="40" y="962" fontSize={caption.name.length > 12 ? 104 : 124} fontWeight="900" fill={PAPER} stroke={INK} strokeWidth="10" paintOrder="stroke">{caption.name.toUpperCase()}</text>
        </g>
      )}
    </svg>
  )
}

const SKIN = { ines: ['#8d5636', '#6c3e26'], dov: ['#dba97c', '#ba875b'], quill: ['#5e3a29', '#47291b'], pim: ['#e6b992', '#c8956c'], reyne: ['#c79068', '#a4704c'], toll: ['#1a2036', '#111627'] }
const BACK: Record<string, string> = { ines: RED, dov: TEAL, quill: MUSTARD, pim: '#d8c7a4', reyne: '#2c3a63', toll: '#3a2c1c' }

export function Portrait({ who }: { who: keyof typeof SKIN }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const [skin, shade] = SKIN[who]
  const coat: Record<string, string> = { ines: INK, dov: MUSTARD, quill: TEAL, pim: RED, reyne: INK, toll: '#0c101d' }
  return (
    <svg className="portrait" viewBox="0 0 400 480" preserveAspectRatio="xMidYMin slice" role="img" aria-label={`Illustrated portrait of ${who}`}>
      <defs>
        <Halftone id={`${uid}h`} color={who === 'pim' ? TEAL : PAPER} size={13} r={3} />
        <clipPath id={`${uid}f`}><ellipse cx="200" cy="208" rx="80" ry="100" /></clipPath>
      </defs>
      <rect width="400" height="480" fill={BACK[who]} />
      <circle cx="262" cy="170" r="150" fill={`url(#${uid}h)`} opacity=".62" />
      {who === 'ines' && <g fill={INK}><circle cx="200" cy="130" r="88" /><circle cx="118" cy="182" r="52" /><circle cx="282" cy="182" r="52" /><circle cx="130" cy="108" r="46" /><circle cx="270" cy="108" r="46" /><circle cx="108" cy="244" r="36" /><circle cx="292" cy="244" r="36" /></g>}
      {who === 'toll' && <circle cx="200" cy="330" r="150" fill={MUSTARD} opacity=".3" />}
      <path d="M28 480 Q38 362 150 330 L250 330 Q362 362 372 480 Z" fill={coat[who]} />
      <rect x="164" y="272" width="72" height="78" fill={shade} />
      <ellipse cx="200" cy="208" rx="80" ry="100" fill={skin} />
      <g clipPath={`url(#${uid}f)`}><rect x="208" y="90" width="90" height="240" fill={shade} /></g>

      {who !== 'toll' && who !== 'reyne' && (
        <g fill={INK}>
          <path d="M142 190 q22 -14 44 0 l-3 7 q-19 -10 -38 0 Z" />
          <path d="M214 190 q22 -14 44 0 l-3 7 q-19 -10 -38 0 Z" />
          <ellipse cx="164" cy="214" rx="10" ry="6" />
          <ellipse cx="236" cy="214" rx="10" ry="6" />
        </g>
      )}
      {who !== 'toll' && <path d="M202 214 L190 256 L212 258" fill="none" stroke={shade === SKIN.dov[1] ? '#8f6641' : '#3a2115'} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />}
      {(who === 'ines' || who === 'quill' || who === 'pim') && <path d="M172 280 Q200 298 230 280 Q200 288 172 280" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />}

      {who === 'ines' && (
        <g>
          <path d="M116 142 Q200 104 284 142" fill="none" stroke={MUSTARD} strokeWidth="14" />
          <circle cx="164" cy="128" r="31" fill={TEAL} stroke={PAPER} strokeWidth="9" />
          <circle cx="236" cy="128" r="31" fill={TEAL} stroke={PAPER} strokeWidth="9" />
          <path d="M150 118 l20 -12 M222 118 l20 -12" stroke={PAPER} strokeWidth="6" strokeLinecap="round" />
          <circle cx="118" cy="264" r="15" fill="none" stroke={MUSTARD} strokeWidth="7" />
          <circle cx="282" cy="264" r="15" fill="none" stroke={MUSTARD} strokeWidth="7" />
          <path d="M150 336 L200 400 L250 336 L286 352 L226 480 L174 480 L114 352 Z" fill={RED} />
          <path d="M200 400 L200 480" stroke={PAPER} strokeWidth="6" />
          <rect x="52" y="410" width="60" height="16" fill={PAPER} transform="rotate(-8 82 418)" />
        </g>
      )}
      {who === 'dov' && (
        <g>
          <path d="M120 212 Q124 330 200 334 Q276 330 280 212 Q262 248 236 244 Q200 228 164 244 Q138 248 120 212 Z" fill="#3b2a22" />
          <path d="M162 258 Q200 238 238 258 Q200 266 162 258 Z" fill="#231814" />
          <path d="M110 164 Q116 86 204 86 Q288 88 292 164 Z" fill={INK} />
          <path d="M96 170 Q200 128 322 178 Q330 190 312 190 Q200 152 108 186 Q88 184 96 170 Z" fill={RED} />
          <path d="M130 336 L150 480 M270 336 L250 480" stroke={INK} strokeWidth="20" />
          <rect x="146" y="404" width="108" height="76" fill={INK} />
          <path d="M60 480 L92 380" stroke={PAPER} strokeWidth="5" strokeDasharray="10 8" />
        </g>
      )}
      {who === 'quill' && (
        <g>
          <path d="M122 200 Q112 96 202 92 Q292 96 280 200 Q268 136 202 134 Q136 136 122 200 Z" fill={PAPER} />
          <path d="M104 212 Q104 62 200 62 Q298 62 296 212" fill="none" stroke={INK} strokeWidth="16" />
          <rect x="84" y="186" width="42" height="84" rx="14" fill={RED} stroke={INK} strokeWidth="6" />
          <rect x="274" y="186" width="42" height="84" rx="14" fill={RED} stroke={INK} strokeWidth="6" />
          <path d="M104 268 Q116 320 176 306" fill="none" stroke={INK} strokeWidth="7" />
          <rect x="172" y="294" width="42" height="22" rx="8" fill={INK} />
          <path d="M112 350 Q200 420 288 350 L300 372 Q200 452 100 372 Z" fill={MUSTARD} />
        </g>
      )}
      {who === 'pim' && (
        <g>
          <path d="M118 176 Q118 92 200 92 Q284 92 284 176 Q250 142 216 164 Q176 130 118 176 Z" fill="#6b3b1f" />
          <path d="M200 96 L200 34" stroke={INK} strokeWidth="7" />
          <circle cx="200" cy="30" r="12" fill={RED} stroke={INK} strokeWidth="5" />
          <circle cx="164" cy="214" r="31" fill={PAPER} fillOpacity=".3" stroke={INK} strokeWidth="8" />
          <circle cx="236" cy="214" r="31" fill={PAPER} fillOpacity=".3" stroke={INK} strokeWidth="8" />
          <path d="M195 212 h10" stroke={INK} strokeWidth="8" />
          <path d="M136 340 Q200 400 264 340 L280 356 Q200 430 120 356 Z" fill={MUSTARD} />
        </g>
      )}
      {who === 'reyne' && (
        <g>
          <path d="M130 196 h66 v34 q-30 14 -66 0 Z M204 196 h66 v34 q-34 14 -66 0 Z" fill={INK} />
          <path d="M142 204 l30 0" stroke={PAPER} strokeWidth="5" />
          <path d="M160 270 Q200 252 240 270 Q200 284 160 270 Z" fill="#33231c" />
          <path d="M98 142 Q120 62 200 60 Q282 62 304 142 Q200 118 98 142 Z" fill={INK} />
          <path d="M100 144 Q200 112 302 144 L316 176 Q200 138 86 176 Z" fill="#242d4d" stroke={MUSTARD} strokeWidth="5" />
          <circle cx="200" cy="100" r="16" fill={MUSTARD} />
          <path d="M60 372 L130 346 L136 372 L70 396 Z M340 372 L270 346 L264 372 L330 396 Z" fill={MUSTARD} />
          <path d="M176 340 L200 400 L224 340" fill={PAPER} />
        </g>
      )}
      {who === 'toll' && (
        <g>
          <path d="M92 188 L150 176 Q154 90 200 86 Q246 90 250 176 L308 188 Q200 214 92 188 Z" fill="#0c101d" />
          <circle cx="172" cy="232" r="5" fill={MUSTARD} />
          <circle cx="228" cy="232" r="5" fill={MUSTARD} />
          <path d="M312 372 v-34 M290 372 h44 l-6 66 h-32 Z" stroke={INK} strokeWidth="6" fill={MUSTARD} />
        </g>
      )}
    </svg>
  )
}

export const CAR_SIDE: Record<CarId, { body: string; glass: string; wheels: [number, number][]; r: number }> = {
  sandpiper: {
    body: 'M8 60V40q2-8 10-10l8-17q2-3 7-3h98q6 0 10 4l24 21 48 5q15 2 19 12l2 8Z',
    glass: 'M36 16h44v15H29Zm50 0h44q4 0 7 3l15 12H86Z',
    wheels: [[54, 60], [186, 60]], r: 15,
  },
  merle: {
    body: 'M6 60V43q2-6 10-8l34-6q24-16 48-17h30q16 1 30 18l54 6q18 3 22 14l1 10Z',
    glass: 'M60 30q18-11 38-12v12Zm44-12h24q10 1 20 12h-44Z',
    wheels: [[52, 60], [188, 60]], r: 15,
  },
  ostler: {
    body: 'M6 60V32h86l4-22q1-3 4-3h50q4 0 7 3l15 23 44 3q10 1 14 9l2 15Z',
    glass: 'M104 13h20v20h-24Zm26 0h19q3 0 5 3l11 17h-35Z',
    wheels: [[50, 60], [190, 60]], r: 17,
  },
}

export function CarSide({ car, color, className }: { car: CarId; color: string; className?: string }) {
  const c = CAR_SIDE[car]
  return (
    <svg className={className} viewBox="0 0 240 80" aria-hidden="true">
      <path d={c.body} fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={c.glass} fill={INK} />
      {c.wheels.map(([x, y]) => (
        <g key={x}><circle cx={x} cy={y} r={c.r} fill={INK} /><circle cx={x} cy={y} r={c.r * 0.42} fill={PAPER} /></g>
      ))}
    </svg>
  )
}
