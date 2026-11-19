export type Metric = 'coins' | 'km' | 'power' | 'pickup' | 'fuel' | 'finish' | 'smash' | 'honk' | 'boost' | 'perfect'

export type DailyTask = { id: string; metric: Metric; target: number; reward: number; text: string }

const POOL: DailyTask[] = [
  { id: 'coins-80', metric: 'coins', target: 80, reward: 100, text: 'Collect 80 coins' },
  { id: 'coins-160', metric: 'coins', target: 160, reward: 180, text: 'Collect 160 coins' },
  { id: 'km-300', metric: 'km', target: 300, reward: 120, text: 'Drive 300 km' },
  { id: 'km-800', metric: 'km', target: 800, reward: 240, text: 'Drive 800 km' },
  { id: 'power-3', metric: 'power', target: 3, reward: 120, text: 'Use 3 special powers' },
  { id: 'pickup-2', metric: 'pickup', target: 2, reward: 120, text: 'Grab 2 power-ups on the road' },
  { id: 'fuel-4', metric: 'fuel', target: 4, reward: 90, text: 'Pick up 4 fuel cans' },
  { id: 'finish-1', metric: 'finish', target: 1, reward: 250, text: 'Finish any level' },
  { id: 'smash-3', metric: 'smash', target: 3, reward: 130, text: 'Smash 3 obstacles with nitro or a shield' },
  { id: 'honk-10', metric: 'honk', target: 10, reward: 60, text: 'Sound the horn 10 times on the road' },
  { id: 'boost-40', metric: 'boost', target: 40, reward: 110, text: 'Boost for 40 seconds' },
  { id: 'perfect-1', metric: 'perfect', target: 1, reward: 300, text: 'Park dead centre in a pit stop bay' },
]

export const DAILY_BONUS = 200

/** Today's date on the player's own clock, as YYYY-MM-DD. */
export function today(now = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** Three tasks for a given day, each tracking something different. Everyone gets the same three on the same date. */
export function tasksFor(date: string): DailyTask[] {
  let seed = 0
  for (const ch of date) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const order = [...POOL].sort(() => rand() - 0.5)
  const picked: DailyTask[] = []
  for (const task of order) {
    if (picked.length === 3) break
    if (!picked.some((p) => p.metric === task.metric)) picked.push(task)
  }
  return picked
}

/** Time left until tomorrow's tasks, for the reset label. */
export function untilTomorrow(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const mins = Math.max(0, Math.round((next.getTime() - now.getTime()) / 60000))
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}
