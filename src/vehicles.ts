export type CarId = 'sandpiper' | 'tern' | 'merle' | 'heron' | 'falcon' | 'ostler' | 'mule' | 'drayman' | 'bison'
export type UpgradeId = 'engine' | 'tank' | 'grip'
export type Upgrades = Record<UpgradeId, number>

type Pt = [number, number]
/** A box drawn on the vehicle: u runs nose-to-tail along the length (front is positive), v is height. */
export type Panel = { u0: number; u1: number; v0: number; v1: number; w: number; x?: number; mat: 'paint' | 'trim' | 'cargo' | 'chrome' | 'lamp' }
export type Profile = {
  width: number; floor: number; wheel: number; arch: number; front: number; rear: number
  body: Pt[]; cabin: Pt[]; roof: Pt[]; cabinWidth: number; panels?: Panel[]
}
export type Vehicle = {
  id: CarId; name: string; kind: 'Car' | 'Truck'; style: string; year: number; price: number
  top: number; grip: number; tank: number; tough: number; offroad?: boolean; note: string; profile: Profile
}

export const VEHICLES: Record<CarId, Vehicle> = {
  sandpiper: {
    id: 'sandpiper', name: 'Harlow Sandpiper', kind: 'Car', style: 'Rally wagon', year: 1974, price: 0,
    top: 212, grip: 1, tank: 1.12, tough: 0.58, note: 'Carries the transmitter, the spares and most of the argument.',
    profile: {
      width: 1.84, floor: 0.34, wheel: 0.37, arch: 0.47, front: 1.36, rear: -1.36, cabinWidth: 1.56,
      body: [[-2.2, 0.36], [-2.26, 0.84], [-2.08, 0.98], [1.0, 1.0], [2.0, 0.86], [2.2, 0.68], [2.24, 0.36]],
      cabin: [[-2.04, 0.96], [-1.96, 1.47], [0.12, 1.5], [1.04, 0.98]],
      roof: [[-2.02, 1.42], [-1.98, 1.55], [0.14, 1.58], [0.34, 1.42]],
    },
  },
  tern: {
    id: 'tern', name: 'Pell Tern', kind: 'Car', style: 'City hatchback', year: 1979, price: 450,
    top: 188, grip: 1.12, tank: 1.3, tough: 0.5, note: 'Small, light and happy to squeeze between two trucks.',
    profile: {
      width: 1.72, floor: 0.32, wheel: 0.33, arch: 0.42, front: 1.15, rear: -1.1, cabinWidth: 1.46,
      body: [[-1.85, 0.34], [-1.9, 0.86], [-1.75, 0.95], [0.85, 0.95], [1.7, 0.8], [1.88, 0.62], [1.9, 0.34]],
      cabin: [[-1.78, 0.93], [-1.62, 1.5], [0.12, 1.52], [0.95, 0.93]],
      roof: [[-1.7, 1.44], [-1.62, 1.56], [0.14, 1.58], [0.3, 1.44]],
    },
  },
  merle: {
    id: 'merle', name: 'Corvane Merle', kind: 'Car', style: 'Grand tourer', year: 1971, price: 1300,
    top: 250, grip: 0.86, tank: 0.9, tough: 0.42, note: 'Very fast. Very thirsty. Very sure of itself.',
    profile: {
      width: 1.9, floor: 0.3, wheel: 0.36, arch: 0.46, front: 1.46, rear: -1.42, cabinWidth: 1.5,
      body: [[-2.24, 0.34], [-2.3, 0.76], [-2.14, 0.9], [0.66, 0.88], [2.08, 0.72], [2.3, 0.56], [2.32, 0.34]],
      cabin: [[-1.92, 0.88], [-0.72, 1.28], [0.02, 1.3], [0.86, 0.88]],
      roof: [[-0.92, 1.2], [-0.7, 1.33], [0.04, 1.35], [0.26, 1.2]],
      panels: [{ u0: -2.2, u1: -1.9, v0: 0.98, v1: 1.03, w: 0.9, mat: 'trim' }],
    },
  },
  heron: {
    id: 'heron', name: 'Aldane Heron', kind: 'Car', style: 'Touring saloon', year: 1977, price: 1700,
    top: 226, grip: 0.98, tank: 1.08, tough: 0.6, note: 'Long, quiet and built for driving through the night.',
    profile: {
      width: 1.86, floor: 0.32, wheel: 0.36, arch: 0.46, front: 1.5, rear: -1.45, cabinWidth: 1.52,
      body: [[-2.4, 0.36], [-2.45, 0.84], [-2.3, 0.94], [1.1, 0.94], [2.25, 0.8], [2.42, 0.6], [2.44, 0.36]],
      cabin: [[-1.55, 0.92], [-1.05, 1.38], [0.45, 1.4], [1.2, 0.92]],
      roof: [[-1.2, 1.32], [-1.02, 1.44], [0.45, 1.46], [0.66, 1.32]],
    },
  },
  falcon: {
    id: 'falcon', name: 'Vesta Falcon', kind: 'Car', style: 'Rally coupe', year: 1982, price: 3200,
    top: 272, grip: 1.06, tank: 0.86, tough: 0.5, note: 'Built to win one championship and never quite calmed down.',
    profile: {
      width: 1.92, floor: 0.3, wheel: 0.37, arch: 0.44, front: 1.36, rear: -1.38, cabinWidth: 1.48,
      body: [[-2.15, 0.34], [-2.2, 0.8], [-2.0, 0.92], [0.55, 0.9], [2.0, 0.7], [2.22, 0.52], [2.24, 0.34]],
      cabin: [[-1.6, 0.9], [-0.55, 1.3], [0.15, 1.32], [0.8, 0.9]],
      roof: [[-0.75, 1.24], [-0.55, 1.36], [0.17, 1.38], [0.36, 1.24]],
      panels: [
        { u0: -2.24, u1: -1.86, v0: 1.18, v1: 1.24, w: 0.96, mat: 'trim' },
        { u0: -2.1, u1: -1.98, v0: 0.9, v1: 1.18, w: 0.05, x: 0.55, mat: 'trim' },
        { u0: -2.1, u1: -1.98, v0: 0.9, v1: 1.18, w: 0.05, x: -0.55, mat: 'trim' },
      ],
    },
  },
  ostler: {
    id: 'ostler', name: 'Ostler Twelve', kind: 'Truck', style: 'Ferry-yard pickup', year: 1968, price: 700,
    top: 183, grip: 0.92, tank: 1.36, tough: 0.74, note: 'Has already hit everything you are about to hit.',
    profile: {
      width: 1.96, floor: 0.44, wheel: 0.43, arch: 0.55, front: 1.46, rear: -1.46, cabinWidth: 1.72,
      body: [[-2.42, 0.46], [-2.44, 1.04], [1.0, 1.06], [2.1, 1.0], [2.26, 0.82], [2.28, 0.46]],
      cabin: [[-0.56, 1.04], [-0.52, 1.74], [0.56, 1.76], [1.02, 1.06]],
      roof: [[-0.58, 1.68], [-0.56, 1.82], [0.6, 1.84], [0.78, 1.68]],
      panels: [
        { u0: -2.35, u1: -0.65, v0: 1.03, v1: 1.11, w: 0.82, mat: 'trim' },
        { u0: -2.0, u1: -1.2, v0: 1.1, v1: 1.54, w: 0.46, mat: 'cargo' },
      ],
    },
  },
  mule: {
    id: 'mule', name: 'Brandt Mule', kind: 'Truck', style: 'Four-by-four', year: 1975, price: 1500, offroad: true,
    top: 196, grip: 0.95, tank: 1.22, tough: 0.8, note: 'Does not slow down on the shoulder. Does not slow down for much.',
    profile: {
      width: 1.9, floor: 0.58, wheel: 0.48, arch: 0.56, front: 1.35, rear: -1.3, cabinWidth: 1.74,
      body: [[-2.0, 0.58], [-2.02, 1.22], [1.25, 1.24], [1.95, 1.15], [2.06, 0.92], [2.06, 0.58]],
      cabin: [[-1.92, 1.2], [-1.88, 1.86], [0.55, 1.88], [1.15, 1.22]],
      roof: [[-1.92, 1.8], [-1.9, 1.94], [0.6, 1.96], [0.78, 1.8]],
      panels: [
        { u0: -2.16, u1: -2.02, v0: 0.78, v1: 1.5, w: 0.42, mat: 'trim' },
        { u0: -1.6, u1: 0.3, v0: 1.96, v1: 2.02, w: 0.86, mat: 'trim' },
        { u0: 0.4, u1: 0.52, v0: 1.98, v1: 2.1, w: 0.72, mat: 'lamp' },
      ],
    },
  },
  drayman: {
    id: 'drayman', name: 'Kettle Drayman', kind: 'Truck', style: 'Panel van', year: 1972, price: 1900,
    top: 172, grip: 0.84, tank: 1.6, tough: 0.86, note: 'Holds a whole radio station in the back. It has done.',
    profile: {
      width: 1.98, floor: 0.46, wheel: 0.4, arch: 0.5, front: 1.55, rear: -1.5, cabinWidth: 1.86,
      body: [[-2.55, 0.46], [-2.56, 1.22], [1.75, 1.22], [2.35, 1.12], [2.5, 0.95], [2.5, 0.46]],
      cabin: [[0.4, 1.18], [0.4, 2.1], [1.03, 2.13], [1.8, 1.2]],
      roof: [[0.38, 2.04], [0.38, 2.18], [1.02, 2.2], [1.14, 2.04]],
      panels: [{ u0: -2.56, u1: 0.42, v0: 1.18, v1: 2.18, w: 1, mat: 'paint' }],
    },
  },
  bison: {
    id: 'bison', name: 'Rook Bison', kind: 'Truck', style: 'Cab-over hauler', year: 1966, price: 2800,
    top: 166, grip: 0.8, tank: 1.85, tough: 0.95, note: 'Slow to start, slower to stop, impossible to argue with.',
    profile: {
      width: 2.2, floor: 0.62, wheel: 0.55, arch: 0.64, front: 1.6, rear: -1.7, cabinWidth: 2.12,
      body: [[-2.9, 0.62], [-2.9, 1.38], [0.9, 1.38], [0.9, 1.48], [2.2, 1.48], [2.32, 1.22], [2.32, 0.62]],
      cabin: [[0.95, 1.46], [0.95, 2.52], [2.0, 2.56], [2.28, 1.46]],
      roof: [[0.93, 2.46], [0.93, 2.64], [2.04, 2.68], [2.14, 2.46]],
      panels: [
        { u0: 0.93, u1: 2.3, v0: 1.46, v1: 1.98, w: 1.02, mat: 'paint' },
        { u0: -2.7, u1: -1.3, v0: 1.38, v1: 2.2, w: 0.86, mat: 'cargo' },
        { u0: -1.2, u1: 0.6, v0: 1.38, v1: 2.0, w: 0.86, mat: 'cargo' },
        { u0: 0.74, u1: 0.86, v0: 1.4, v1: 2.9, w: 0.06, x: 0.92, mat: 'chrome' },
      ],
    },
  },
}

export const VEHICLE_ORDER: CarId[] = ['sandpiper', 'tern', 'merle', 'heron', 'falcon', 'ostler', 'mule', 'drayman', 'bison']

export const UPGRADES: { id: UpgradeId; name: string; effect: string; base: number }[] = [
  { id: 'engine', name: 'Speed tuning', effect: '+5% top speed per level', base: 150 },
  { id: 'tank', name: 'Fuel tank', effect: '+10% fuel range per level', base: 120 },
  { id: 'grip', name: 'Handling', effect: '+6% grip per level', base: 120 },
]
export const MAX_UPGRADE = 5
export const NO_UPGRADES: Upgrades = { engine: 0, tank: 0, grip: 0 }
export const upgradeCost = (id: UpgradeId, level: number) => UPGRADES.find((u) => u.id === id)!.base * (level + 1)

export type Stats = { top: number; grip: number; tank: number; tough: number; offroad: boolean }
export function statsFor(id: CarId, up: Upgrades = NO_UPGRADES): Stats {
  const v = VEHICLES[id]
  return {
    top: Math.round(v.top * (1 + 0.05 * up.engine)),
    grip: v.grip * (1 + 0.06 * up.grip),
    tank: v.tank * (1 + 0.1 * up.tank),
    tough: v.tough,
    offroad: !!v.offroad,
  }
}

/** A flat side view of a vehicle, built from the same profile as the 3D model. Nose points right. */
const K = 40
const X = (u: number) => +((u + 3.1) * K).toFixed(1)
const Y = (v: number) => +((3.0 - v) * K).toFixed(1)

export function sideView(id: CarId) {
  const p = VEHICLES[id].profile
  let body = p.body.map(([u, v], i) => `${i ? 'L' : 'M'}${X(u)} ${Y(v)}`).join(' ')
  const r = p.arch * K
  body += ` L${X(p.front + p.arch)} ${Y(p.floor)} A${r} ${r} 0 0 0 ${X(p.front - p.arch)} ${Y(p.floor)}`
  body += ` L${X(p.rear + p.arch)} ${Y(p.floor)} A${r} ${r} 0 0 0 ${X(p.rear - p.arch)} ${Y(p.floor)} Z`
  const poly = (pts: Pt[]) => pts.map(([u, v], i) => `${i ? 'L' : 'M'}${X(u)} ${Y(v)}`).join(' ') + ' Z'
  const rect = (b: Panel) => `M${X(b.u0)} ${Y(b.v1)} H${X(b.u1)} V${Y(b.v0)} H${X(b.u0)} Z`
  const panels = p.panels ?? []
  const xs = [...p.body, ...p.cabin, ...p.roof].map(([u]) => X(u)).concat(panels.flatMap((b) => [X(b.u0), X(b.u1)]))
  const ys = [...p.body, ...p.cabin, ...p.roof].map(([, v]) => Y(v)).concat(panels.map((b) => Y(b.v1)), [Y(0)])
  const minX = Math.min(...xs) - 6
  const minY = Math.min(...ys) - 6
  return {
    body,
    glass: poly(p.cabin),
    roof: poly(p.roof),
    paint: panels.filter((b) => b.mat === 'paint').map(rect).join(' '),
    trim: panels.filter((b) => b.mat !== 'paint').map(rect).join(' '),
    wheels: [[X(p.front), Y(p.wheel)], [X(p.rear), Y(p.wheel)]] as [number, number][],
    r: p.wheel * K,
    viewBox: `${minX} ${minY} ${Math.max(...xs) + 6 - minX} ${Y(0) + 4 - minY}`,
  }
}
