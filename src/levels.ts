import type { LeadId } from './content'

export type PropKind =
  | 'lamp' | 'crane' | 'stack' | 'pole' | 'mesa' | 'mound' | 'pine' | 'burnt' | 'boulder' | 'cliff' | 'windtree' | 'buoy'
  | 'snowpine' | 'snowbank' | 'cabin' | 'icepillar' | 'marker' | 'beacon'
  | 'mangrove' | 'reeds' | 'stilthut' | 'terrace' | 'teabush' | 'stonelamp' | 'boat' | 'lantern'
  | 'redmesa' | 'hoodoo' | 'cactus' | 'wreck' | 'dome' | 'dish'
export type RelicModel = 'toll' | 'busstop' | 'milestone' | 'phonebox' | 'snowman' | 'sled' | 'boat' | 'bell' | 'totem' | 'sign' | 'car' | 'satellite'
export type LandmarkKind = 'lighthouse' | 'mast' | 'biglantern' | 'bigdish'

export type Palette = {
  top: string; mid: string; hor: string; sun: string; ground: string; road: string; line: string; hemi: string; low: string; dir: string
  near: number; far: number; night: number; sunDir: [number, number, number]; aurora?: number; auroraColor?: string
}
export type Particles = { color: string; opacity: number; fall: number; len: number; lean: number; low?: boolean }
export type PropSpec = { kind: PropKind; count: number; min: number; max: number; scale: [number, number] }
export type Region = {
  id: string; name: string; from: number; hour: string; weather: string; blurb?: string; watch?: string
  banter: Record<LeadId, string>; palette: Palette; particles: Particles; props: PropSpec[]
}
export type LevelSecret = {
  id: string; name: string; hint: string; found: string
  type: 'relic' | 'honk' | 'clean' | 'park'; km?: number; side?: 1 | -1; model?: RelicModel
}
export type Level = {
  n: number; id: string; name: string; tagline: string; length: number; density: number
  pitStop: string; landmark: LandmarkKind; regions: Region[]; secrets: LevelSecret[]
}

const rain: Particles = { color: '#c8d6ee', opacity: 0.5, fall: 36, len: 0.9, lean: 0.2 }
const snow: Particles = { color: '#ffffff', opacity: 0.85, fall: 3.2, len: 0.07, lean: 0.9 }

export const LEVELS: Level[] = [
  {
    n: 1, id: 'route9', name: 'Route 9', tagline: 'Port Sable to Cape Lantern', length: 580, density: 1,
    pitStop: 'Cape Lantern ferry ramp', landmark: 'lighthouse',
    regions: [
      {
        id: 'sable', name: 'Port Sable', from: 0, hour: '21:00', weather: 'Rain, low cloud',
        blurb: 'A harbour city going under one street at a time. The cranes still work. Nobody is sure who for.',
        watch: 'Container trucks running the evacuation lanes',
        banter: { ines: 'Rain on the causeway. Keep it smooth and stay off the paint.', dov: 'Wipers are decorative. Good luck.' },
        palette: { top: '#141a36', mid: '#43294f', hor: '#dd6a3c', sun: '#ffb27a', ground: '#262a38', road: '#1c1f2b', line: '#f0d6a2', hemi: '#8f8fb8', low: '#2a2230', dir: '#ffae80', near: 50, far: 300, night: 0.55, sunDir: [0.28, 0.09, -1] },
        particles: rain,
        props: [
          { kind: 'lamp', count: 14, min: 11.5, max: 12.5, scale: [1, 1] },
          { kind: 'crane', count: 9, min: 42, max: 150, scale: [0.9, 1.5] },
          { kind: 'stack', count: 18, min: 18, max: 110, scale: [0.8, 1.3] },
        ],
      },
      {
        id: 'flats', name: 'The Glass Flats', from: 180, hour: '23:15', weather: 'Clear, strange light',
        blurb: 'A hundred and fifty kilometres of dry sea bed, white as paper. The heat stays long after dark and the road plays tricks.',
        watch: 'Mirages, and one toll booth that should not be there',
        banter: { ines: 'Flat for 150 kilometres. Trust the notes, not your eyes.', dov: 'Salt in the bearings. I can hear it.' },
        palette: { top: '#3c8cae', mid: '#a7d3cd', hor: '#f6edd9', sun: '#fffbe9', ground: '#f0e8d6', road: '#5f5d5b', line: '#fffaf0', hemi: '#ffffff', low: '#d8ccb0', dir: '#fff3d8', near: 90, far: 360, night: 0, sunDir: [-0.2, 0.42, -1] },
        particles: { color: '#ffffff', opacity: 0.2, fall: 0.3, len: 0.05, lean: 0.6 },
        props: [
          { kind: 'pole', count: 14, min: 12, max: 13, scale: [1, 1] },
          { kind: 'mesa', count: 12, min: 60, max: 240, scale: [1, 2.8] },
          { kind: 'mound', count: 22, min: 16, max: 150, scale: [0.6, 1.6] },
        ],
      },
      {
        id: 'pines', name: 'Ember Pines', from: 385, hour: '02:50', weather: 'Smoke, falling embers',
        blurb: 'The forest has been burning for nine days. The road is the only gap in it and the Authority knows that.',
        watch: 'Roadblocks at every narrow',
        banter: { ines: 'Smoke ahead. Roadblocks after it. Pick a gap and commit.', dov: 'If the paint blisters, that’s just character.' },
        palette: { top: '#431b25', mid: '#b5421f', hor: '#f2a83c', sun: '#ffe08a', ground: '#3f2a1b', road: '#2a211d', line: '#f6d88f', hemi: '#ffb27c', low: '#3a1d17', dir: '#ff9a4d', near: 40, far: 270, night: 0.28, sunDir: [-0.42, 0.1, -1] },
        particles: { color: '#ffb24d', opacity: 0.95, fall: -4, len: 0.14, lean: 1.5, low: true },
        props: [
          { kind: 'pine', count: 70, min: 13, max: 130, scale: [0.8, 1.9] },
          { kind: 'burnt', count: 22, min: 13, max: 80, scale: [0.8, 1.4] },
          { kind: 'boulder', count: 12, min: 14, max: 70, scale: [0.6, 1.4] },
        ],
      },
      {
        id: 'cape', name: 'Cape Lantern', from: 470, hour: '05:20', weather: 'Sea fog, stars above it',
        blurb: 'The end of Route 9. One lighthouse, one ramp, one ferry with its engines already running.',
        watch: 'No street lights past the ridge',
        banter: { ines: 'I can see the lamp. Don’t you dare slow down.', dov: 'Nineteen years I worked that ramp. Hold on.' },
        palette: { top: '#050a1c', mid: '#0d2040', hor: '#285571', sun: '#e6eff2', ground: '#12202f', road: '#0f1722', line: '#bcdcdd', hemi: '#6b86ad', low: '#0b1420', dir: '#a9c7e6', near: 34, far: 240, night: 1, sunDir: [0.36, 0.36, -1] },
        particles: { color: '#cfe4e6', opacity: 0.3, fall: 0.5, len: 0.05, lean: 0.4 },
        props: [
          { kind: 'cliff', count: 22, min: 22, max: 170, scale: [0.8, 2.4] },
          { kind: 'windtree', count: 16, min: 14, max: 60, scale: [0.8, 1.4] },
          { kind: 'buoy', count: 10, min: 15, max: 42, scale: [1, 1.4] },
        ],
      },
    ],
    secrets: [
      { id: 'l1-busstop', type: 'relic', km: 120, side: -1, model: 'busstop', name: 'The Drowned Bus Stop', hint: 'Keep far left in Port Sable around km 120.', found: 'The timetable says the next bus is due in 1961.' },
      { id: 'l1-ghost', type: 'relic', km: 290, side: 1, model: 'toll', name: 'The Ghost Toll', hint: 'Keep far right on the Glass Flats around km 290.', found: 'You paid. You do not remember paying.' },
      { id: 'l1-milestone', type: 'relic', km: 430, side: -1, model: 'milestone', name: 'The Burnt Milestone', hint: 'A milestone glows on the left in Ember Pines near km 430.', found: 'It counts the kilometres back to a town that is gone.' },
      { id: 'l1-keeper', type: 'honk', name: 'Wake the Keeper', hint: 'Sound the horn while the lighthouse is in view.', found: 'Three flashes from the lamp. Someone is still up there.' },
      { id: 'l1-clean', type: 'clean', name: 'Not a Scratch', hint: 'Finish Route 9 without losing a life.', found: 'Dov checked the paint twice. Not a mark on it.' },
      { id: 'l1-ferry', type: 'park', name: 'The Last Ferry', hint: 'Park dead centre in the bay at Cape Lantern.', found: 'The ramp came up behind you.' },
    ],
  },
  {
    n: 2, id: 'frostline', name: 'Frostline Pass', tagline: 'Whitepine Ridge to Aurora Summit', length: 620, density: 0.9,
    pitStop: 'Summit hut', landmark: 'mast',
    regions: [
      {
        id: 'whitepine', name: 'Whitepine Ridge', from: 0, hour: '01:10', weather: 'Light snow',
        banter: { ines: 'Snow on the crest. Small inputs, no heroics.', dov: 'Chains are in the back. Somewhere.' },
        palette: { top: '#5b6f8c', mid: '#9fb3c9', hor: '#e6edf2', sun: '#fdfdf8', ground: '#eef3f6', road: '#4b525c', line: '#ffe58a', hemi: '#e9f1ff', low: '#9aa8b8', dir: '#fff6e8', near: 50, far: 280, night: 0.1, sunDir: [0.3, 0.2, -1] },
        particles: snow,
        props: [
          { kind: 'snowpine', count: 80, min: 13, max: 130, scale: [0.8, 1.8] },
          { kind: 'snowbank', count: 18, min: 12, max: 60, scale: [0.6, 1.4] },
          { kind: 'cabin', count: 8, min: 22, max: 70, scale: [0.9, 1.2] },
        ],
      },
      {
        id: 'glacier', name: 'Glacier Causeway', from: 220, hour: '02:40', weather: 'Clear and bitter cold',
        banter: { ines: 'Ice under the road. Keep the wheel straight.', dov: 'I can see my breath inside the car.' },
        palette: { top: '#0f2a4a', mid: '#3a7aa8', hor: '#bfe4f2', sun: '#f2fbff', ground: '#d6eef7', road: '#3c4652', line: '#e9fbff', hemi: '#cfefff', low: '#6d93ad', dir: '#dff4ff', near: 70, far: 320, night: 0.35, sunDir: [-0.3, 0.25, -1] },
        particles: { color: '#e8fbff', opacity: 0.5, fall: 0.4, len: 0.04, lean: 0.3 },
        props: [
          { kind: 'icepillar', count: 26, min: 16, max: 140, scale: [0.8, 2.2] },
          { kind: 'snowbank', count: 16, min: 13, max: 80, scale: [0.6, 1.6] },
          { kind: 'marker', count: 16, min: 11.4, max: 11.8, scale: [1, 1] },
        ],
      },
      {
        id: 'aurora', name: 'Aurora Summit', from: 430, hour: '04:15', weather: 'Night, aurora overhead',
        banter: { ines: 'Look up for one second. Then never again.', dov: 'Nineteen years and I never saw it this green.' },
        palette: { top: '#030a1a', mid: '#0b2238', hor: '#1f4a5a', sun: '#dff7ff', ground: '#c9d6e2', road: '#1b222c', line: '#9ff0d0', hemi: '#7fa6c9', low: '#1a2633', dir: '#a9d8ff', near: 36, far: 250, night: 1, sunDir: [0.4, 0.3, -1], aurora: 1, auroraColor: '#5cffb0' },
        particles: { ...snow, fall: 1.8, opacity: 0.6 },
        props: [
          { kind: 'snowpine', count: 50, min: 14, max: 120, scale: [0.8, 1.6] },
          { kind: 'cabin', count: 6, min: 22, max: 60, scale: [0.9, 1.2] },
          { kind: 'beacon', count: 6, min: 30, max: 120, scale: [0.8, 1.3] },
        ],
      },
    ],
    secrets: [
      { id: 'l2-phonebox', type: 'relic', km: 140, side: 1, model: 'phonebox', name: 'The Frozen Phone Box', hint: 'A phone box is ringing on the right around km 140.', found: 'Nobody on the line. Just wind.' },
      { id: 'l2-watcher', type: 'relic', km: 330, side: -1, model: 'snowman', name: 'The Watcher', hint: 'Something stands on the left of the causeway near km 330.', found: 'Someone built it facing the road. Recently.' },
      { id: 'l2-sled', type: 'relic', km: 500, side: 1, model: 'sled', name: 'The Lost Sled', hint: 'Under the aurora, keep right around km 500.', found: 'Still loaded. Still nobody to pull it.' },
      { id: 'l2-beacon', type: 'honk', name: 'Signal the Summit', hint: 'Sound the horn while the summit beacon is in view.', found: 'The beacon blinked back twice.' },
      { id: 'l2-clean', type: 'clean', name: 'Clean Descent', hint: 'Finish Frostline Pass without losing a life.', found: 'Not one slide all night.' },
      { id: 'l2-park', type: 'park', name: 'Summit Parking', hint: 'Park dead centre in the bay at the summit hut.', found: 'The hut keeper gave you soup for that.' },
    ],
  },
  {
    n: 3, id: 'delta', name: 'Monsoon Delta', tagline: 'Mangrove Reach to Lotus Harbour', length: 680, density: 0.8,
    pitStop: 'Lotus Harbour pit stop', landmark: 'biglantern',
    regions: [
      {
        id: 'mangrove', name: 'Mangrove Reach', from: 0, hour: '19:30', weather: 'Warm fog, fireflies',
        banter: { ines: 'Fog in the low ground. Read the trees, not the road.', dov: 'Something just swam past the wheel arch.' },
        palette: { top: '#1d2b2a', mid: '#3e5a4a', hor: '#c6b77a', sun: '#ffe2a0', ground: '#2f4434', road: '#22282a', line: '#f2e3a0', hemi: '#a8c49a', low: '#25352a', dir: '#ffd890', near: 30, far: 220, night: 0.55, sunDir: [0.2, 0.08, -1] },
        particles: { color: '#d9ff6a', opacity: 0.9, fall: -0.3, len: 0.05, lean: 1.2, low: true },
        props: [
          { kind: 'mangrove', count: 40, min: 14, max: 110, scale: [0.8, 1.6] },
          { kind: 'reeds', count: 40, min: 11.5, max: 40, scale: [0.8, 1.4] },
          { kind: 'stilthut', count: 8, min: 20, max: 70, scale: [0.9, 1.2] },
        ],
      },
      {
        id: 'terraces', name: 'Tea Terraces', from: 230, hour: '21:00', weather: 'Monsoon rain',
        banter: { ines: 'Standing water on every bend. Ease off, then commit.', dov: 'The roof leaks. It always leaked.' },
        palette: { top: '#24323d', mid: '#4d6b6a', hor: '#9fb9a8', sun: '#e8f2e0', ground: '#3f6b3e', road: '#2a2f33', line: '#f4f0d0', hemi: '#b5d1b0', low: '#2c4430', dir: '#d9ecd0', near: 34, far: 230, night: 0.3, sunDir: [-0.3, 0.2, -1] },
        particles: { ...rain, color: '#cfe3ff', opacity: 0.55, fall: 40 },
        props: [
          { kind: 'terrace', count: 14, min: 34, max: 140, scale: [0.8, 1.4] },
          { kind: 'teabush', count: 60, min: 12, max: 60, scale: [0.7, 1.3] },
          { kind: 'stonelamp', count: 12, min: 11.6, max: 12.2, scale: [1, 1] },
        ],
      },
      {
        id: 'lotus', name: 'Lotus Harbour', from: 470, hour: '22:40', weather: 'Lantern-lit evening',
        banter: { ines: 'Lanterns on the water. We are close.', dov: 'Smell that? Fried fish and diesel. Home.' },
        palette: { top: '#2b1a3a', mid: '#7a3a5a', hor: '#f0956a', sun: '#ffd1a0', ground: '#2a2440', road: '#1f1b2a', line: '#ffd29a', hemi: '#e0a0c0', low: '#2a1f33', dir: '#ffb090', near: 40, far: 260, night: 0.6, sunDir: [0.35, 0.1, -1] },
        particles: { color: '#ffb85a', opacity: 0.9, fall: -0.6, len: 0.08, lean: 0.5, low: true },
        props: [
          { kind: 'boat', count: 14, min: 18, max: 80, scale: [0.9, 1.4] },
          { kind: 'lantern', count: 16, min: 11.6, max: 12.2, scale: [1, 1] },
          { kind: 'stilthut', count: 8, min: 20, max: 70, scale: [0.9, 1.3] },
        ],
      },
    ],
    secrets: [
      { id: 'l3-boat', type: 'relic', km: 150, side: -1, model: 'boat', name: 'The Upturned Boat', hint: 'An upturned boat lies on the left in the mangroves near km 150.', found: 'Someone carved a map on the hull.' },
      { id: 'l3-bell', type: 'relic', km: 360, side: 1, model: 'bell', name: 'The Rain Bell', hint: 'Between the terraces, keep right around km 360.', found: 'It rang once, with no wind at all.' },
      { id: 'l3-stone', type: 'relic', km: 560, side: -1, model: 'totem', name: 'The Lotus Stone', hint: 'At the harbour, a carved stone stands on the left near km 560.', found: 'Warm to the touch, even in the rain.' },
      { id: 'l3-lantern', type: 'honk', name: 'Light the Great Lantern', hint: 'Sound the horn while the great lantern is in view.', found: 'The whole harbour cheered.' },
      { id: 'l3-clean', type: 'clean', name: 'Dry Feet', hint: 'Finish Monsoon Delta without losing a life.', found: 'Not one wave over the bonnet.' },
      { id: 'l3-park', type: 'park', name: 'Harbour Berth', hint: 'Park dead centre in the bay at Lotus Harbour.', found: 'The harbour master wrote your name in the log.' },
    ],
  },
  {
    n: 4, id: 'canyon', name: 'Red Canyon Run', tagline: 'Copper Canyon to Observatory Rim', length: 740, density: 0.72,
    pitStop: 'Rim Observatory gate', landmark: 'bigdish',
    regions: [
      {
        id: 'copper', name: 'Copper Canyon', from: 0, hour: '13:00', weather: 'Hard sun',
        banter: { ines: 'Rock walls both sides. No room to argue.', dov: 'The engine likes the heat less than I do.' },
        palette: { top: '#2f7fb8', mid: '#8ec4dc', hor: '#f6d7a8', sun: '#fffbe8', ground: '#c9693a', road: '#5a4a44', line: '#fff1d0', hemi: '#ffe9d0', low: '#8a4a2a', dir: '#fff0d8', near: 80, far: 350, night: 0, sunDir: [0.1, 0.6, -1] },
        particles: { color: '#e8b48a', opacity: 0.35, fall: 0.2, len: 0.06, lean: 3 },
        props: [
          { kind: 'redmesa', count: 16, min: 50, max: 220, scale: [1, 2.8] },
          { kind: 'hoodoo', count: 20, min: 14, max: 90, scale: [0.8, 1.6] },
          { kind: 'cactus', count: 30, min: 12, max: 70, scale: [0.8, 1.4] },
        ],
      },
      {
        id: 'duststorm', name: 'Dust Storm Flats', from: 250, hour: '16:30', weather: 'Sandstorm',
        banter: { ines: 'Can’t see fifty metres. Lights on, nerve steady.', dov: 'Sand in my teeth, sand in the gearbox.' },
        palette: { top: '#8a5a3a', mid: '#b8834e', hor: '#d9a86a', sun: '#ffe6b0', ground: '#c08850', road: '#6a5040', line: '#ffe8b8', hemi: '#f0c890', low: '#7a5030', dir: '#ffd8a0', near: 16, far: 160, night: 0.1, sunDir: [-0.3, 0.3, -1] },
        particles: { color: '#e0b080', opacity: 0.6, fall: 0.1, len: 0.04, lean: 18 },
        props: [
          { kind: 'hoodoo', count: 10, min: 14, max: 70, scale: [0.8, 1.4] },
          { kind: 'cactus', count: 16, min: 12, max: 60, scale: [0.8, 1.3] },
          { kind: 'wreck', count: 8, min: 13, max: 40, scale: [1, 1.2] },
        ],
      },
      {
        id: 'rim', name: 'Observatory Rim', from: 500, hour: '23:50', weather: 'Clear desert night',
        banter: { ines: 'Every star at once. Eyes on the road anyway.', dov: 'Somebody up there is watching us. Professionally.' },
        palette: { top: '#020617', mid: '#141a3a', hor: '#4a2f5a', sun: '#f1f3ff', ground: '#3a2a2a', road: '#16141c', line: '#c9c2ff', hemi: '#6a6aa8', low: '#1a1418', dir: '#b8b8ff', near: 40, far: 300, night: 1, sunDir: [-0.4, 0.4, -1] },
        particles: { color: '#d8c8ff', opacity: 0.25, fall: 0.3, len: 0.04, lean: 0.6 },
        props: [
          { kind: 'dome', count: 6, min: 30, max: 120, scale: [0.9, 1.4] },
          { kind: 'dish', count: 10, min: 22, max: 110, scale: [0.8, 1.4] },
          { kind: 'redmesa', count: 10, min: 60, max: 220, scale: [1, 2.4] },
        ],
      },
    ],
    secrets: [
      { id: 'l4-sign', type: 'relic', km: 160, side: 1, model: 'sign', name: 'The Rusted Sign', hint: 'A road sign glows on the right in Copper Canyon near km 160.', found: 'It points to a town that was never built.' },
      { id: 'l4-racer', type: 'relic', km: 380, side: -1, model: 'car', name: 'The Ghost Racer', hint: 'Inside the sandstorm, keep left around km 380.', found: 'Engine still warm. Driver nowhere.' },
      { id: 'l4-satellite', type: 'relic', km: 620, side: 1, model: 'satellite', name: 'The Fallen Satellite', hint: 'On the rim, keep right around km 620.', found: 'It is still sending. Nobody knows what.' },
      { id: 'l4-dish', type: 'honk', name: 'Ping the Big Dish', hint: 'Sound the horn while the giant dish is in view.', found: 'The dish turned, very slowly, to look at you.' },
      { id: 'l4-clean', type: 'clean', name: 'Untouched', hint: 'Finish Red Canyon Run without losing a life.', found: 'The canyon did not get a single scratch on you.' },
      { id: 'l4-park', type: 'park', name: 'Rim Parking', hint: 'Park dead centre in the bay at the observatory gate.', found: 'The night staff applauded from the dome.' },
    ],
  },
]

export const ROUTE9 = LEVELS[0].regions
export const LEVEL_SECRETS = LEVELS.flatMap((l) => l.secrets.map((s) => ({ ...s, level: l.n })))
