import { create } from 'zustand'
import { audio } from './audio'
import { CHEATS, SECRETS, type CarId, type LeadId, type SecretId, type StripeId } from './content'

type Saved = {
  lead: LeadId
  car: CarId
  paint: string
  stripe: StripeId
  callsign: string
  secrets: SecretId[]
  cheats: string[]
  bestMiles: number
  bestValves: number
  finished: boolean
}

export type Toast = { id: number; kicker: string; title: string; body?: string }

type State = Saved & {
  sound: boolean
  menu: boolean
  driving: boolean
  booted: boolean
  toasts: Toast[]
  setLead: (lead: LeadId) => void
  swapLead: () => void
  setLook: (patch: Partial<Pick<Saved, 'car' | 'paint' | 'stripe'>>) => void
  setCallsign: (callsign: string) => void
  setSound: (on: boolean) => void
  setMenu: (open: boolean) => void
  setDriving: (on: boolean) => void
  boot: (sound: boolean) => void
  find: (id: SecretId) => void
  cheat: (code: string) => boolean
  recordRun: (miles: number, valves: number, finished: boolean) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dropToast: (id: number) => void
  reset: () => void
}

const KEY = 'saltline.v1'
const DEFAULTS: Saved = {
  lead: 'ines', car: 'sandpiper', paint: 'signal', stripe: 'rally', callsign: 'NIGHT DRIVER',
  secrets: [], cheats: [], bestMiles: 0, bestValves: 0, finished: false,
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

let toastId = 0

export const useGame = create<State>((set, get) => ({
  ...load(),
  sound: false,
  menu: false,
  driving: false,
  booted: false,
  toasts: [],
  setLead: (lead) => {
    if (lead !== get().lead) audio.swap()
    set({ lead })
  },
  swapLead: () => get().setLead(get().lead === 'ines' ? 'dov' : 'ines'),
  setLook: (patch) => set(patch),
  setCallsign: (callsign) => set({ callsign }),
  setSound: (sound) => {
    audio.setEnabled(sound)
    set({ sound })
  },
  setMenu: (menu) => set({ menu }),
  setDriving: (driving) => set({ driving }),
  boot: (sound) => {
    audio.setEnabled(sound)
    if (sound) audio.click()
    set({ booted: true, sound })
  },
  find: (id) => {
    const { secrets, toast } = get()
    if (secrets.includes(id)) return
    const next = [...secrets, id]
    const def = SECRETS.find((s) => s.id === id)!
    set({ secrets: next })
    audio.unlock()
    toast({ kicker: `Secret ${next.length} of ${SECRETS.length}`, title: def.name, body: def.found })
    if (next.length === SECRETS.length) {
      toast({ kicker: 'All six found', title: 'Moonmetal paint unlocked', body: 'It is waiting in the garage.' })
    }
  },
  cheat: (raw) => {
    const code = raw.trim().toUpperCase()
    const def = CHEATS.find((c) => c.code === code)
    if (!def) return false
    const { cheats, toast, find } = get()
    const on = !cheats.includes(code)
    set({ cheats: on ? [...cheats, code] : cheats.filter((c) => c !== code) })
    audio.unlock()
    toast({ kicker: on ? 'Cheat on' : 'Cheat off', title: def.name })
    if (code === 'CQCQ') find('cq')
    return true
  },
  recordRun: (miles, valves, finished) =>
    set((s) => ({
      bestMiles: Math.max(s.bestMiles, Math.round(miles)),
      bestValves: Math.max(s.bestValves, valves),
      finished: s.finished || finished,
    })),
  toast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: ++toastId }] })),
  dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  reset: () => set({ ...DEFAULTS }),
}))

useGame.subscribe((s) => {
  const saved: Saved = {
    lead: s.lead, car: s.car, paint: s.paint, stripe: s.stripe, callsign: s.callsign,
    secrets: s.secrets, cheats: s.cheats, bestMiles: s.bestMiles, bestValves: s.bestValves, finished: s.finished,
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    /* Progress simply lasts for this visit when storage is blocked. */
  }
})

export const paintUnlocked = (s: Pick<Saved, 'secrets' | 'cheats'>) =>
  s.secrets.length === SECRETS.length || s.cheats.includes('MOONMETAL')
