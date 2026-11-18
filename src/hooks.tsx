import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

export function go(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

/** Reports whether an element is near the viewport, and whether it has ever been. */
export function useNear<T extends HTMLElement>(margin = '300px') {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      setNear(e.isIntersecting)
      if (e.isIntersecting) setSeen(true)
    }, { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [margin])
  return { ref, near, seen }
}

export function Reveal({ as: Tag = 'div', className = '', delay = 0, children }: { as?: ElementType; className?: string; delay?: number; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true)
        io.disconnect()
      }
    }, { rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref} className={`reveal ${shown ? 'in' : ''} ${className}`} style={{ '--d': `${delay}ms` } as CSSProperties}>{children}</Tag>
}

export function ChapterHead({ km, title, children }: { km: number; title: string; children?: ReactNode }) {
  return (
    <Reveal as="header" className="chead">
      <span className="chead__mile"><i>Km</i>{String(km).padStart(3, '0')}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </Reveal>
  )
}
