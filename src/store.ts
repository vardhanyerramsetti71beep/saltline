import { create } from 'zustand'
import { audio } from './audio'
import { CHEATS, PAGE_SECRETS, STATIONS, type LeadId, type StripeId } from './content'
import { LEVELS, LEVEL_SECRETS } from './levels'
import { MAX_UPGRADE, NO_UPGRADES, VEHICLES, upgradeCost, type CarId, type UpgradeId, type Upgrades } from './vehicles'

type Saved = {
  lead: LeadId
  car: CarId
  paint: string
  stripe: StripeId
  callsign: string
  secrets: string[]
  cheats: string[]
  bestKm: number
  bestCoins: number
  coins: number
  owned: CarId[]
  upgrades: Partial<Record<CarId, Upgrades>>
  level: number
  levelsDone: number[]
  openRoad: boolean
}

export type Toast = { id: number; kicker: string; title: string; body?: string }
export type RunResult = { won: boolean; level: number; km: number; coins: number; livesLost: number }

type State = Saved & {
  sound: boolean
  menu: boolean
  driving: boolean
  booted: boolean
  toasts: Toast[]
  radioOn: boolean
  radioFreq: number
  setLead: (lead: LeadId) => void
  swapLead: () => void
  setLook: (patch: Partial<Pick<Saved, 'paint' | 'stripe'>>) => void
  chooseCar: (id: CarId) => void
  buyCar: (id: CarId) => boolean
  buyUpgrade: (id: CarId, upgrade: UpgradeId) => boolean
  setLevel: (n: number) => void
  setCallsign: (callsign: string) => void
  setSound: (on: boolean) => void
  setMenu: (open: boolean) => void
  setDriving: (on: boolean) => void
  setRadio: (on: boolean) => void
  tuneRadio: (freq: number) => void
  cycleRadio: () => void
  boot: (sound: boolean) => void
  find: (id: string) => void
  cheat: (code: string) => boolean
  endRun: (result: RunResult) => { bonus: number }
  toast: (t: Omit<Toast, 'id'>) => void
  dropToast: (id: number) => void
  reset: () => void
}

const KEY = 'saltline.v3'
const DEFAULTS: Saved = {
  lead: 'ines', car: 'sandpiper', paint: 'signal', stripe: 'rally', callsign: 'NIGHT DRIVER',
  secrets: [], cheats: [], bestKm: 0, bestCoins: 0, coins: 150, owned: ['sandpiper'], upgrades: {},
  level: 0, levelsDone: [], openRoad: false,
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
    const old = localStorage.getItem('saltline.v2')
    if (!old) return DEFAULTS
    // Carry earlier progress over: the old route secrets become Route 9 secrets.
    const v2 = JSON.parse(old)
    const car: CarId = v2.car in VEHICLES ? v2.car : 'sandpiper'
    const secrets = (v2.secrets ?? []).map((s: string) => (s === 'ghost' ? 'l1-ghost' : s)).filter((s: string) => s !== 'ferry')
    return {
      ...DEFAULTS, lead: v2.lead ?? 'ines', car, paint: v2.paint ?? 'signal', stripe: v2.stripe ?? 'rally', callsign: v2.callsign ?? 'NIGHT DRIVER',
      secrets, cheats: (v2.cheats ?? []).filter((c: string) => c !== 'CQCQ'), bestKm: v2.bestKm ?? 0, bestCoins: v2.bestValves ?? 0,
      owned: Array.from(new Set<CarId>(['sandpiper', car])), levelsDone: v2.finished ? [0] : [],
    }
  } catch {
    return DEFAULTS
  }
}

export const levelOpen = (s: Pick<Saved, 'openRoad' | 'levelsDone'>, n: number) => n === 0 || s.openRoad || s.levelsDone.includes(n - 1)
export const upgradesOf = (s: Pick<Saved, 'upgrades'>, id: CarId): Upgrades => ({ ...NO_UPGRADES, ...s.upgrades[id] })
export const paintUnlocked = (s: Pick<Saved, 'secrets' | 'cheats'>) =>
  PAGE_SECRETS.every((p) => s.secrets.includes(p.id)) || s.cheats.includes('MOONMETAL')
export const TOTAL_SECRETS = PAGE_SECRETS.length + LEVEL_SECRETS.length

let toastId = 0
const stations = STATIONS.map((s) => s.freq)

export const useGame = create<State>((set, get) => ({
  ...load(),
  sound: false,
  menu: false,
  driving: false,
  booted: false,
  toasts: [],
  radioOn: false,
  radioFreq: STATIONS[0].freq,
  setLead: (lead) => {
    if (lead !== get().lead) audio.swap()
    set({ lead })
  },
  swapLead: () => get().setLead(get().lead === 'ines' ? 'dov' : 'ines'),
  setLook: (patch) => set(patch),
  chooseCar: (id) => {
    if (get().owned.includes(id)) set({ car: id })
  },
  buyCar: (id) => {
    const s = get()
    const v = VEHICLES[id]
    if (s.owned.includes(id) || s.coins < v.price) return false
    set({ coins: s.coins - v.price, owned: [...s.owned, id], car: id })
    audio.unlock()
    s.toast({ kicker: `${v.kind} bought`, title: v.name, body: 'It is in the bay and ready to drive.' })
    return true
  },
  buyUpgrade: (id, upgrade) => {
    const s = get()
    if (!s.owned.includes(id)) return false
    const now = upgradesOf(s, id)
    const level = now[upgrade]
    const cost = upgradeCost(upgrade, level)
    if (level >= MAX_UPGRADE || s.coins < cost) return false
    set({ coins: s.coins - cost, upgrades: { ...s.upgrades, [id]: { ...now, [upgrade]: level + 1 } } })
    audio.unlock()
    return true
  },
  setLevel: (level) => {
    if (levelOpen(get(), level)) set({ level })
  },
  setCallsign: (callsign) => set({ callsign }),
  setSound: (sound) => {
    audio.setEnabled(sound)
    set({ sound })
  },
  setMenu: (menu) => set({ menu }),
  setDriving: (driving) => set({ driving }),
  setRadio: (radioOn) => {
    if (radioOn && !get().sound) get().setSound(true)
    set({ radioOn })
  },
  tuneRadio: (radioFreq) => set({ radioFreq }),
  cycleRadio: () => {
    const { radioOn, radioFreq, setRadio } = get()
    const at = stations.findIndex((f) => Math.abs(f - radioFreq) < 0.2)
    if (!radioOn) {
      set({ radioFreq: at >= 0 ? radioFreq : stations[0] })
      setRadio(true)
    } else if (at === stations.length - 1) setRadio(false)
    else set({ radioFreq: stations[at + 1] ?? stations[0] })
    audio.tick()
  },
  boot: (sound) => {
    audio.setEnabled(sound)
    if (sound) audio.click()
    set({ booted: true, sound })
  },
  find: (id) => {
    const s = get()
    if (s.secrets.includes(id)) return
    const next = [...s.secrets, id]
    const page = PAGE_SECRETS.find((p) => p.id === id)
    const road = LEVEL_SECRETS.find((p) => p.id === id)
    if (!page && !road) return
    set({ secrets: next })
    audio.unlock()
    if (page) {
      const count = PAGE_SECRETS.filter((p) => next.includes(p.id)).length
      s.toast({ kicker: `Page secret ${count} of ${PAGE_SECRETS.length}`, title: page.name, body: page.found })
      if (count === PAGE_SECRETS.length) s.toast({ kicker: 'Every page secret found', title: 'Moonmetal paint unlocked', body: 'It is waiting in the garage.' })
      return
    }
    const level = LEVELS[road!.level - 1]
    const found = level.secrets.filter((p) => next.includes(p.id)).length
    let coins = get().coins + 50
    s.toast({ kicker: `${level.name} secret ${found} of 6 · +50 coins`, title: road!.name, body: road!.found })
    if (found === level.secrets.length) {
      coins += 300
      s.toast({ kicker: `All six ${level.name} secrets`, title: '+300 bonus coins' })
    }
    set({ coins })
  },
  cheat: (raw) => {
    const code = raw.trim().toUpperCase().replace(/\s+/g, '')
    const def = CHEATS.find((c) => c.code === code)
    if (!def) return false
    const s = get()
    audio.unlock()
    if (def.once) {
      if (code === 'PAYDAY') set({ coins: s.coins + 1000 })
      if (code === 'OPENROAD') set({ openRoad: true })
      s.toast({ kicker: 'Cheat used', title: def.name, body: def.effect })
      if (code === 'CQCQ') s.find('cq')
      return true
    }
    const on = !s.cheats.includes(code)
    set({ cheats: on ? [...s.cheats, code] : s.cheats.filter((c) => c !== code) })
    s.toast({ kicker: on ? 'Cheat on' : 'Cheat off', title: def.name, body: on ? def.effect : undefined })
    return true
  },
  endRun: ({ won, level, km, coins }) => {
    const bonus = won ? 100 * (level + 1) : 0
    set((s) => ({
      coins: s.coins + coins + bonus,
      bestKm: Math.max(s.bestKm, Math.round(km)),
      bestCoins: Math.max(s.bestCoins, coins),
      levelsDone: won && !s.levelsDone.includes(level) ? [...s.levelsDone, level].sort() : s.levelsDone,
    }))
    return { bonus }
  },
  toast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: ++toastId }] })),
  dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  reset: () => set({ ...DEFAULTS }),
}))

useGame.subscribe((s) => {
  const saved: Saved = {
    lead: s.lead, car: s.car, paint: s.paint, stripe: s.stripe, callsign: s.callsign, secrets: s.secrets, cheats: s.cheats,
    bestKm: s.bestKm, bestCoins: s.bestCoins, coins: s.coins, owned: s.owned, upgrades: s.upgrades, level: s.level,
    levelsDone: s.levelsDone, openRoad: s.openRoad,
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    /* Progress simply lasts for this visit when storage is blocked. */
  }
})
