import { useEffect } from 'react'
import { audio } from './audio'
import { CHEATS } from './content'
import { useGame } from './store'
import { Boot } from './ui/Boot'
import { Hud, Menu, Toasts } from './ui/Hud'
import { Cover } from './sections/Cover'
import { Story } from './sections/Story'
import { Crew } from './sections/Crew'
import { Atlas } from './sections/Atlas'
import { Drive } from './sections/Drive'
import { Garage } from './sections/Garage'
import { Radio } from './sections/Radio'
import { Logbook } from './sections/Logbook'
import { Finale } from './sections/Finale'

export function App() {
  const lead = useGame((s) => s.lead)
  const cheats = useGame((s) => s.cheats)
  const booted = useGame((s) => s.booted)
  const driving = useGame((s) => s.driving)
  const night = cheats.includes('NIGHTSHIFT')

  useEffect(() => {
    const root = document.documentElement
    root.dataset.lead = lead
    root.dataset.night = night ? 'on' : 'off'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#10162a' : '#efe6d3')
  }, [lead, night])

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !booted || driving)
  }, [booted, driving])

  useEffect(() => {
    // The radio lives in the store so the dial on the page and the button in the game stay in step.
    audio.tune(useGame.getState().radioFreq)
    const stop = useGame.subscribe((s, prev) => {
      if (s.radioFreq !== prev.radioFreq) audio.tune(s.radioFreq)
      if (s.radioOn !== prev.radioOn) {
        audio.setRadio(s.radioOn)
        audio.tune(s.radioFreq)
      }
    })
    if (import.meta.env.DEV) Object.assign(window, { __audio: audio, __game: useGame })
    return stop
  }, [])

  useEffect(() => {
    let typed = ''
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.matches('input:not([type=range]), textarea')) return
      const { driving, menu, setMenu, swapLead, cheat, booted } = useGame.getState()
      if (!booted) return
      if (e.key === 'Escape' && !driving) setMenu(!menu)
      if (e.key === 'Tab' && e.shiftKey && !driving && !menu) {
        e.preventDefault()
        swapLead()
      }
      if (e.key.length !== 1 || !/[a-z]/i.test(e.key) || e.metaKey || e.ctrlKey) return
      typed = (typed + e.key.toUpperCase()).slice(-12)
      const hit = CHEATS.find((c) => typed.endsWith(c.code))
      if (hit) {
        typed = ''
        cheat(hit.code)
      }
    }
    const onClick = () => {
      if (useGame.getState().cheats.includes('HONKHONK')) audio.horn()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onClick)
    }
  }, [])

  return (
    <>
      <a className="skip" href="#story">Skip to the story</a>
      <main>
        <Cover />
        <Story />
        <Crew />
        <Atlas />
        <Drive />
        <Garage />
        <Radio />
        <Logbook />
        <Finale />
      </main>
      <Hud />
      <Menu />
      <Toasts />
      {!booted && <Boot />}
    </>
  )
}
