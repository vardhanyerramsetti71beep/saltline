export type PowerId = 'shield' | 'magnet' | 'nitro' | 'ghost' | 'double' | 'repair'

export type Power = {
  id: PowerId
  name: string
  key: string
  /** Seconds the power lasts once used. 0 means it acts at once; the shield lasts until it stops a crash. */
  duration: number
  price: number
  color: string
  icon: string
  effect: string
}

export const POWERS: Power[] = [
  { id: 'shield', name: 'Shield', key: '1', duration: 30, price: 80, color: '#4fc3ff', icon: '◈', effect: 'Absorbs the next crash, for up to 30 seconds.' },
  { id: 'magnet', name: 'Coin magnet', key: '2', duration: 12, price: 60, color: '#f5c533', icon: '⊂', effect: 'Pulls in coins from every lane for 12 seconds.' },
  { id: 'nitro', name: 'Nitro', key: '3', duration: 6, price: 90, color: '#ff6a3a', icon: '»', effect: 'Full speed for 6 seconds with no fuel burn. You smash through anything in the way.' },
  { id: 'ghost', name: 'Ghost mode', key: '4', duration: 8, price: 100, color: '#9ff3e6', icon: '◌', effect: 'Drive straight through traffic and roadblocks for 8 seconds.' },
  { id: 'double', name: 'Double coins', key: '5', duration: 15, price: 70, color: '#7ee081', icon: '×2', effect: 'Every coin counts twice for 15 seconds.' },
  { id: 'repair', name: 'Repair kit', key: '6', duration: 0, price: 150, color: '#ff5a7a', icon: '+', effect: 'Gives back one lost life.' },
]

export const POWER_IDS = POWERS.map((p) => p.id)
export const MAX_POWER_STOCK = 5
export const powerById = (id: PowerId) => POWERS.find((p) => p.id === id)!
