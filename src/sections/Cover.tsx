import { useEffect, useRef } from 'react'
import { audio } from '../audio'
import { INK, MUSTARD, PAPER, TEAL } from '../art'
import { go } from '../hooks'
import { useGame } from '../store'

const layer = (depth: number) => ({ transform: `translate(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth * 0.45}px))` })

export function Cover() {
  const root = useRef<HTMLElement>(null)
  const knocks = useRef<number[]>([])
  const lampRef = useRef<SVGCircleElement>(null)
  const find = useGame((s) => s.find)

  useEffect(() => {
    const el = root.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let tx = 0, ty = 0, x = 0, y = 0
    const move = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5
      ty = e.clientY / window.innerHeight - 0.5
    }
    const loop = () => {
      x += (tx - x) * 0.06
      y += (ty - y) * 0.06
      el.style.setProperty('--px', x.toFixed(4))
      el.style.setProperty('--py', y.toFixed(4))
      el.style.setProperty('--sy', String(Math.min(1, window.scrollY / window.innerHeight)))
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  const knock = () => {
    audio.tick()
    const now = performance.now()
    knocks.current = [...knocks.current.filter((t) => now - t < 1800), now]
    lampRef.current?.animate([{ opacity: 1, r: '30' }, { opacity: 0.4, r: '14' }], { duration: 220 })
    if (knocks.current.length >= 3) find('lamp')
  }

  return (
    <section id="cover" className="cover" ref={root}>
      <svg className="cover__art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="false" role="group" aria-label="A road runs towards a red sun and a lighthouse">
        <defs>
          <pattern id="coverDots" width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="7.500" cy="7.500" r="4" fill="var(--accent)" /></pattern>
          <radialGradient id="coverFade"><stop offset=".72" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
          <mask id="coverMask"><circle cx="800" cy="520" r="430" fill="url(#coverFade)" /></mask>
        </defs>
        <g style={layer(-10)}>
          <circle cx="800" cy="520" r="430" fill="url(#coverDots)" mask="url(#coverMask)" opacity=".55" />
          <circle cx="800" cy="520" r="312" fill="var(--accent)" />
        </g>
        <g style={layer(-18)} fill={INK}>
          <path d="M268 640v-150l10-120h16l10 120h38v-30h-74v-14h170v14h-30v180Z" opacity=".85" />
          <path d="M120 640v-92h110v92Zm-90 0v-60h80v60Z" opacity=".85" />
          <path d="M452 640v-46h120v46Z" opacity=".85" />
        </g>
        <rect x="-200" y="618" width="2000" height="34" fill={TEAL} />
        <g style={layer(-26)}>
          <path d="M880 650 C 930 590, 1000 566, 1090 560 C 1210 552, 1320 590, 1420 650Z" fill={INK} />
          <g transform="translate(1059 566) scale(.72) translate(-1059 -566)">
          <path d="M1024 566 L1036 356 H1082 L1094 566Z" fill={PAPER} />
          <path d="M1031 452 H1087 L1090 512 H1028Z" fill="var(--accent-print)" />
          <rect x="1024" y="342" width="70" height="15" fill={INK} />
          <rect x="1038" y="294" width="42" height="48" fill={MUSTARD} stroke={INK} strokeWidth="6" />
          <path d="M1030 294 L1059 256 L1088 294Z" fill={INK} />
          <path d="M1059 318 L1560 210 V 420Z" fill={MUSTARD} opacity=".32" />
          <circle ref={lampRef} cx="1059" cy="318" r="14" fill="#fff6c8" />
          <circle
            className="cover__lamp" cx="1059" cy="318" r="62" fill="transparent" role="button" tabIndex={0}
            aria-label="Lighthouse lamp" onClick={knock} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), knock())}
          />
          </g>
        </g>
        <path d="M-200 648 H1800 V1000 H-200Z" fill={INK} />
        <g style={layer(10)}>
          <path d="M800 648 L1420 1010 H180Z" fill="#242b42" />
          <path d="M800 648 L1236 1010 H1190 L800 648 L410 1010 H364Z" fill={PAPER} opacity=".92" />
          {[[664, 8, 2], [690, 12, 4], [730, 20, 7], [790, 36, 12], [880, 62, 22]].map(([y, h, w]) => (
            <rect key={y} x={800 - w / 2} y={y} width={w} height={h} fill={MUSTARD} />
          ))}
        </g>
        <g className="cover__car" style={layer(26)}>
          <path d="M716 930 L728 852 Q732 838 748 838 H852 Q868 838 872 852 L884 930Z" fill="#0a0e1b" />
          <path d="M740 882 L748 850 H852 L860 882Z" fill={TEAL} />
          <rect x="692" y="880" width="216" height="62" rx="10" fill="var(--accent)" stroke="#0a0e1b" strokeWidth="6" />
          <rect x="708" y="896" width="42" height="14" fill="#ffe29a" />
          <rect x="850" y="896" width="42" height="14" fill="#ffe29a" />
          <rect x="770" y="916" width="60" height="16" fill={PAPER} />
          <rect x="700" y="942" width="44" height="26" fill="#0a0e1b" />
          <rect x="856" y="942" width="44" height="26" fill="#0a0e1b" />
          <path d="M800 838 V760" stroke="#0a0e1b" strokeWidth="4" />
        </g>
      </svg>

      <h1 className="cover__title" data-text="SALTLINE">SALTLINE</h1>
      <div className="cover__foot">
        <p className="cover__tag">One night. One road.<br />One last broadcast.</p>
        <div className="cover__cta">
          <button className="btn btn--solid" onClick={() => go('drive')}>Play the drive</button>
          <button className="btn btn--light" onClick={() => go('story')}>Read the story</button>
        </div>
      </div>
    </section>
  )
}
