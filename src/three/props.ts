import * as THREE from 'three'
import type { LandmarkKind, PropKind, RelicModel } from '../levels'
import { box, cone, cyl, dish, dome, merged, pyramid, rock, sphere, tube, wheel } from './kit'

const snowTier = (r: number, h: number, y: number, green: string) => [cone(r, h, 0, y, 0, green), cone(r * 0.44, h * 0.44, 0, y + h * 0.57, 0, '#f2f6fa')]

export function propGeometry(kind: PropKind): THREE.BufferGeometry {
  switch (kind) {
    case 'lamp': return merged([cyl(0.1, 0.14, 9, 0, 0, 0, '#33364a'), box(2.6, 0.14, 0.14, 1.2, 9, 0, '#33364a'), box(0.8, 0.16, 0.3, 2.3, 8.9, 0, '#ffd27a')])
    case 'crane': return merged([box(1, 26, 1, -5, 13, -3, '#c4422a'), box(1, 26, 1, 5, 13, -3, '#c4422a'), box(1, 26, 1, -5, 13, 3, '#c4422a'), box(1, 26, 1, 5, 13, 3, '#c4422a'), box(12, 1, 8, 0, 18, 0, '#7f2c20'), box(36, 1.5, 2, 8, 27, 0, '#d4a23a'), box(2, 8, 2, 0, 31, 0, '#7f2c20'), box(2.6, 2, 2.6, 18, 22, 0, '#232636')])
    case 'stack': return merged([box(12, 3, 3.2, 0, 1.5, 0, '#0f7c7a'), box(12, 3, 3.2, 0, 1.5, 3.6, '#c9842a'), box(12, 3, 3.2, 1, 4.5, 1.6, '#b83a26'), box(12, 3, 3.2, -1, 7.5, 2, '#d9cfb8')])
    case 'pole': return merged([cyl(0.12, 0.17, 11, 0, 0, 0, '#4a3a2c'), box(3.6, 0.16, 0.16, 0, 10.2, 0, '#4a3a2c'), box(2.8, 0.14, 0.14, 0, 9.2, 0, '#4a3a2c')])
    case 'mesa': return merged([cyl(5, 8, 7, 0, 0, 0, '#d8b98a', 6), cyl(3.4, 5, 3, 0.6, 7, 0, '#c7a374', 6)])
    case 'mound': return merged([cone(4, 2.2, 0, 0, 0, '#fffaf0', 6), cone(2.2, 1.5, 3.5, 0, 1, '#f4ecd9', 6)])
    case 'pine': return merged([cyl(0.3, 0.5, 3, 0, 0, 0, '#3a2318'), cone(3.2, 5, 0, 2.2, 0, '#2d3a24'), cone(2.5, 4.4, 0, 5.2, 0, '#3a4628'), cone(1.7, 3.8, 0, 8.2, 0, '#4d4f2a')])
    case 'burnt': return merged([cyl(0.14, 0.42, 9, 0, 0, 0, '#17110f', 6), box(2.6, 0.2, 0.2, 0.7, 6, 0, '#17110f', 0.6), box(1.8, 0.16, 0.16, -0.5, 7.4, 0, '#17110f', -0.5), cone(0.6, 1.3, 0, 8.6, 0, '#f08a2c', 5)])
    case 'boulder': return merged([rock(2.6, 0, 1.1, 0, '#5b4231'), rock(1.4, 2.4, 0.6, 1, '#6d4f39')])
    case 'cliff': return merged([rock(9, 0, 3, 0, '#22333f'), rock(6, 7, 1.4, 3, '#2c414d'), rock(5, -7, 1, -2, '#1b2a35')])
    case 'windtree': return merged([cyl(0.14, 0.36, 4, 0, 0, 0, '#1b2026', 5), box(5.2, 1.4, 2.4, 1.4, 4.3, 0, '#1c3a3a'), box(3.2, 1, 1.8, 2.3, 5.2, 0, '#245050')])
    case 'buoy': return merged([cyl(0.6, 0.9, 1.5, 0, 0, 0, '#b83a26', 8), cyl(0.05, 0.1, 2.4, 0, 1.5, 0, '#dddddd', 5), box(0.35, 0.35, 0.35, 0, 3.9, 0, '#ffd27a')])
    case 'snowpine': return merged([cyl(0.3, 0.45, 2.4, 0, 0, 0, '#3a2a20'), ...snowTier(3.2, 4.6, 1.8, '#2d4636'), ...snowTier(2.5, 3.8, 4.6, '#35503d'), ...snowTier(1.7, 3.2, 7.1, '#3e5a44')])
    case 'snowbank': return merged([rock(3, 0, 0.8, 0, '#f4f8fb'), rock(2, 2.6, 0.5, 1, '#e3eaf1')])
    case 'cabin': return merged([box(5, 3, 4, 0, 1.5, 0, '#6b4a33'), pyramid(4.2, 2.4, 0, 3, 0, '#f2f6fa'), box(1.1, 1, 4.1, 1.2, 1.6, 0, '#ffd27a'), box(0.6, 1.6, 0.6, 1.4, 4.2, 0.8, '#4a3a30')])
    case 'icepillar': return merged([cone(1.2, 7, 0, 0, 0, '#bfe9f7', 5), cone(0.8, 4.5, 1.4, 0, 0.6, '#d9f4fb', 5), cone(0.6, 3, -1.1, 0, -0.4, '#a6dcef', 5)])
    case 'marker': return merged([cyl(0.07, 0.07, 1.3, 0, 0, 0, '#e6e6e6', 6), box(0.14, 0.28, 0.06, 0, 1.12, 0, '#ff6a3a')])
    case 'beacon': return merged([box(0.5, 16, 0.5, 0, 8, 0, '#c9c9c9'), box(2.4, 0.2, 0.2, 0, 6, 0, '#c9c9c9'), box(2, 0.2, 0.2, 0, 11, 0, '#c9c9c9'), box(0.7, 0.7, 0.7, 0, 16.3, 0, '#ff3b24')])
    case 'mangrove': return merged([cyl(0.28, 0.4, 4.6, 0, 0.9, 0, '#4a3a2a'), cyl(0.1, 0.16, 1.4, 0.8, 0, 0, '#4a3a2a'), cyl(0.1, 0.16, 1.4, -0.7, 0, 0.4, '#4a3a2a'), cyl(0.1, 0.16, 1.4, 0, 0, -0.8, '#4a3a2a'), cyl(0.1, 0.16, 1.4, 0.2, 0, 0.8, '#4a3a2a'), sphere(3.4, 0, 6, 0, '#2f5a36', 0.55), sphere(2.4, 1.6, 5.4, 0.8, '#3a6b40', 0.6)])
    case 'reeds': return merged(Array.from({ length: 9 }, (_, i) => {
      const h = 1.6 + ((i * 37) % 10) / 9
      return box(0.08, h, 0.08, ((i * 53) % 13) / 6 - 1, h / 2, ((i * 29) % 11) / 5 - 1, i % 2 ? '#9aa860' : '#c2c27a')
    }))
    case 'stilthut': return merged([
      ...[[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.2], [1.4, 1.2]].map(([x, z]) => cyl(0.12, 0.12, 2.4, x, 0, z, '#5a4030')),
      box(3.6, 0.25, 3.2, 0, 2.4, 0, '#7a5a3a'), box(3, 2, 2.6, 0, 3.5, 0, '#a07a50'), pyramid(2.9, 1.6, 0, 4.5, 0, '#b89a5a'),
    ])
    case 'terrace': return merged([box(30, 1.4, 10, 0, 0.7, 0, '#4a7a3a'), box(26, 1.4, 8, 0, 2.1, -1, '#5a8a44'), box(22, 1.4, 6, 0, 3.5, -2, '#6a9a4c'), box(18, 1.4, 4, 0, 4.9, -3, '#7aaa54')])
    case 'teabush': return merged([sphere(1, 0, 0.6, 0, '#3f7a3c', 0.7), sphere(1, 1.8, 0.6, 0.2, '#4a8a44', 0.7), sphere(1, -1.8, 0.6, -0.2, '#3a7036', 0.7)])
    case 'stonelamp': return merged([box(0.6, 0.3, 0.6, 0, 0.15, 0, '#8a8a80'), box(0.3, 1, 0.3, 0, 0.8, 0, '#9a9a90'), box(0.7, 0.5, 0.7, 0, 1.55, 0, '#ffcf70'), box(0.9, 0.15, 0.9, 0, 1.88, 0, '#7a7a72')])
    case 'boat': return merged([box(5, 0.9, 1.8, 0, 0.45, 0, '#8a5a3a'), box(4.4, 0.2, 1.6, 0, 0.95, 0, '#c9a070'), box(1.6, 1, 1.2, -0.6, 1.5, 0, '#efe6d3'), cyl(0.06, 0.06, 4, 0.8, 1, 0, '#4a3a2a')])
    case 'lantern': return merged([cyl(0.08, 0.1, 3.2, 0, 0, 0, '#3a2a2a'), box(0.9, 0.08, 0.08, 0.35, 3.1, 0, '#3a2a2a'), box(0.5, 0.7, 0.5, 0.7, 2.5, 0, '#ff9a3a'), box(0.56, 0.1, 0.56, 0.7, 2.9, 0, '#c8392a')])
    case 'redmesa': return merged([cyl(5, 8, 7, 0, 0, 0, '#b5532c', 6), cyl(3.4, 5, 3, 0.6, 7, 0, '#c8643a', 6)])
    case 'hoodoo': return merged([rock(1.6, 0, 1, 0, '#b8603a'), rock(1.2, 0, 2.6, 0, '#c87048'), rock(1.4, 0, 4, 0, '#a8502e'), rock(0.9, 0, 5.2, 0, '#d88a5a')])
    case 'cactus': return merged([cyl(0.35, 0.4, 5, 0, 0, 0, '#3f7a3c'), box(1.2, 0.45, 0.45, 0.6, 2.4, 0, '#3f7a3c'), cyl(0.24, 0.28, 1.6, 1.1, 2.4, 0, '#4a8a44'), box(1, 0.4, 0.4, -0.5, 3.1, 0, '#3f7a3c'), cyl(0.22, 0.26, 1.3, -0.95, 3.1, 0, '#4a8a44')])
    case 'wreck': return merged([box(4, 1, 1.8, 0, 0.5, 0, '#8a4a2a', 0.3), box(2, 0.8, 1.6, -0.3, 1.4, 0, '#6a3a22', 0.3)])
    case 'dome': return merged([cyl(3, 3, 3, 0, 0, 0, '#d8d8e0', 16), dome(3, 0, 3, 0, '#ecebf2'), box(0.7, 2.6, 0.2, 0, 4.4, 2.6, '#20202a')])
    case 'dish': return merged([cyl(0.3, 0.4, 3, 0, 0, 0, '#c9c9d0'), dish(2.4, 1, 0, 4.2, 0, '#ecebf2')])
  }
}

export function relicGeometry(model: RelicModel): THREE.BufferGeometry {
  const c = '#ffffff'
  switch (model) {
    case 'toll': return merged([box(2.2, 3.4, 3.4, 3.4, 1.7, 0, c), box(9, 0.45, 5, 0, 4.9, 0, c), box(0.3, 4.8, 0.3, -3.8, 2.4, 0, c), box(0.3, 4.8, 0.3, 3.8, 2.4, 0, c)])
    case 'busstop': return merged([cyl(0.08, 0.08, 3, -1.8, 0, 0.6, c), box(0.9, 0.9, 0.1, -1.8, 3, 0.6, c), box(3, 2.2, 0.1, 0, 1.1, -0.9, c), box(3.2, 0.12, 1.4, 0, 2.3, -0.3, c), box(2.4, 0.1, 0.5, 0, 0.5, -0.5, c)])
    case 'milestone': return merged([box(1, 1.6, 0.5, 0, 0.8, 0, c), sphere(0.52, 0, 1.6, 0, c, 0.6), box(1.3, 0.2, 0.7, 0, 0.1, 0, c)])
    case 'phonebox': return merged([box(1.1, 2.6, 1.1, 0, 1.3, 0, c), box(1.25, 0.25, 1.25, 0, 2.72, 0, c), box(0.8, 0.25, 1.16, 0, 2.3, 0, c)])
    case 'snowman': return merged([sphere(1, 0, 1, 0, c), sphere(0.75, 0, 2.5, 0, c), sphere(0.5, 0, 3.55, 0, c), box(0.7, 0.6, 0.7, 0, 4.2, 0, c)])
    case 'sled': return merged([box(2.6, 0.15, 1.1, 0, 0.55, 0, c), box(2.9, 0.08, 0.08, 0, 0.15, 0.5, c), box(2.9, 0.08, 0.08, 0, 0.15, -0.5, c), box(0.1, 0.4, 1, 1.2, 0.35, 0, c), box(1.6, 0.7, 0.8, -0.3, 0.98, 0, c)])
    case 'boat': return merged([box(4, 0.8, 1.6, 0, 0.6, 0, c), box(4, 0.2, 0.2, 0, 1.1, 0, c), box(0.6, 1, 0.1, 1.6, 0.5, 0.8, c)])
    case 'bell': return merged([box(0.2, 3, 0.2, -1, 1.5, 0, c), box(0.2, 3, 0.2, 1, 1.5, 0, c), box(2.4, 0.2, 0.2, 0, 3, 0, c), cone(0.7, 1, 0, 1.8, 0, c, 12)])
    case 'totem': return merged([box(1.2, 1.2, 1.2, 0, 0.6, 0, c), box(1, 1, 1, 0, 1.7, 0, c), box(0.8, 0.8, 0.8, 0, 2.6, 0, c), sphere(0.45, 0, 3.3, 0, c)])
    case 'sign': return merged([box(0.15, 3, 0.15, -1.2, 1.5, 0, c), box(0.15, 3, 0.15, 1.2, 1.5, 0, c), box(3, 1.6, 0.12, 0, 3.2, 0, c)])
    case 'car': return merged([box(1.8, 0.6, 4.2, 0, 0.6, 0, c), box(1.5, 0.5, 2, 0, 1.15, 0.3, c), wheel(0.35, 0.25, 0.85, 0.35, -1.3, c), wheel(0.35, 0.25, -0.85, 0.35, -1.3, c), wheel(0.35, 0.25, 0.85, 0.35, 1.3, c), wheel(0.35, 0.25, -0.85, 0.35, 1.3, c)])
    case 'satellite': return merged([box(1.4, 1.4, 1.4, 0, 0.9, 0, c, 0.4), box(3, 0.06, 1.2, 2.2, 1, 0, c), box(3, 0.06, 1.2, -2.2, 1, 0, c), dish(0.7, 0.3, 0, 2, 0, c)])
  }
}

/** The big landmark near the end of each level. Its lamp is the child named 'glow'. */
export function landmarkGroup(kind: LandmarkKind, flat: THREE.Material, glow: THREE.Material, beamMat: THREE.Material) {
  const group = new THREE.Group()
  let glowMesh: THREE.Mesh
  if (kind === 'lighthouse') {
    group.add(new THREE.Mesh(merged([cyl(2.4, 4.2, 12, 0, 12, 0, '#efe6d3', 12), cyl(3.1, 4.8, 12, 0, 0, 0, '#c8392a', 12), cyl(1.8, 2.4, 10, 0, 24, 0, '#c8392a', 12), cyl(2.6, 2.6, 0.8, 0, 34, 0, '#13192b', 12), cone(2.1, 2.4, 0, 38, 0, '#13192b', 10), rock(18, 0, -2, 0, '#1b2a35')]), flat))
    glowMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.2, 10).translate(0, 36.4, 0), glow)
    const beam = new THREE.Mesh(new THREE.ConeGeometry(16, 170, 18, 1, true).rotateZ(-Math.PI / 2).translate(85, 0, 0), beamMat)
    beam.position.y = 36.4
    beam.name = 'beam'
    group.add(beam)
  } else if (kind === 'mast') {
    const parts = [rock(14, 0, -2, 0, '#e3eaf1'), box(1.2, 44, 1.2, 0, 22, 0, '#b8bcc4')]
    for (let y = 6; y < 42; y += 6) parts.push(box(5 - y / 12, 0.3, 0.3, 0, y, 0, '#b8bcc4'), box(0.3, 0.3, 5 - y / 12, 0, y + 3, 0, '#b8bcc4'))
    group.add(new THREE.Mesh(merged(parts), flat))
    glowMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1).translate(0, 45, 0), glow)
  } else if (kind === 'biglantern') {
    group.add(new THREE.Mesh(merged([box(30, 1.2, 14, 0, 0.6, 0, '#5a3a2a'), cyl(0.6, 0.8, 22, 0, 0, 0, '#3a2a2a'), box(10, 0.6, 0.6, 3, 22, 0, '#3a2a2a'), box(9.6, 0.8, 9.6, 7, 9.4, 0, '#c8392a'), box(9.6, 0.8, 9.6, 7, 20.2, 0, '#c8392a')]), flat))
    glowMesh = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 10, 12).translate(7, 14.8, 0), glow)
  } else {
    group.add(new THREE.Mesh(merged([rock(12, 0, -2, 0, '#3a2a2a'), cyl(2, 3, 14, 0, 0, 0, '#c9c9d0', 10), box(6, 2, 6, 0, 14, 0, '#b8b8c0'), dish(16, 6, 0, 22, 0, '#ecebf2', 0.7)]), flat))
    glowMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1).translate(0, 30, -6), glow)
  }
  glowMesh.name = 'glow'
  group.add(glowMesh)
  return group
}

export const BAY_X = 5.25
export const WALL_Z = -14

/** The pit stop at the end of every level: a marked bay in the right lane, a sign, a building and an end wall. */
export function pitGroup(flat: THREE.Material, bayMat: THREE.Material) {
  const group = new THREE.Group()
  const L = 6.6
  const W = 3.4
  const lines = [
    box(W + 0.24, 0.04, 0.16, BAY_X, 0.03, -L / 2, '#ffffff'), box(W + 0.24, 0.04, 0.16, BAY_X, 0.03, L / 2, '#ffffff'),
    box(0.16, 0.04, L, BAY_X - W / 2, 0.03, 0, '#ffffff'), box(0.16, 0.04, L, BAY_X + W / 2, 0.03, 0, '#ffffff'),
  ]
  for (const z of [11, 17, 23]) lines.push(box(0.3, 0.04, 1.6, BAY_X - 0.5, 0.03, z, '#ffffff', -0.6), box(0.3, 0.04, 1.6, BAY_X + 0.5, 0.03, z, '#ffffff', 0.6))
  const sign = [cyl(0.1, 0.1, 4, 9.2, 0, 0, '#c9c9c9'), box(1.6, 1.6, 0.12, 9.2, 4.6, 0, '#1f4f8f'), box(0.26, 1.1, 0.04, 8.9, 4.6, 0.08, '#ffffff'), box(0.6, 0.22, 0.04, 9.15, 5.04, 0.08, '#ffffff'), box(0.6, 0.22, 0.04, 9.15, 4.6, 0.08, '#ffffff'), box(0.2, 0.62, 0.04, 9.45, 4.82, 0.08, '#ffffff')]
  const building = [box(8, 4, 12, 17, 2, -1, '#efe6d3'), box(9, 0.5, 13, 17, 4.25, -1, '#c8392a'), box(3, 0.2, 10, 12.2, 3.2, -1, '#c8392a'), box(0.2, 3.2, 0.2, 10.8, 1.6, -5.5, '#c9c9c9'), box(0.2, 3.2, 0.2, 10.8, 1.6, 3.5, '#c9c9c9'), box(0.1, 1.8, 6, 12.98, 1.6, -1, '#2a3550')]
  const wall: THREE.BufferGeometry[] = []
  for (let i = 0; i < 12; i++) wall.push(box(1.74, 1.3, 0.6, -9.6 + i * 1.75, 0.65, WALL_Z, i % 2 ? '#efe6d3' : '#e0412a'))
  const lights = [cyl(0.12, 0.12, 7, -9, 0, -4, '#9a9aa0'), box(1.2, 0.3, 0.6, -8.6, 7, -4, '#fff1c4'), cyl(0.12, 0.12, 7, 10.6, 0, 8, '#9a9aa0'), box(1.2, 0.3, 0.6, 10.2, 7, 8, '#fff1c4')]
  const cones = [-3.6, -1.2, 1.2, 3.6].map((z) => cone(0.3, 0.9, BAY_X - W / 2 - 0.5, 0, z, '#ee6a2a', 8))
  group.add(new THREE.Mesh(merged([...lines, ...sign, ...building, ...wall, ...lights, ...cones]), flat))
  const bay = new THREE.Mesh(new THREE.PlaneGeometry(W, L).rotateX(-Math.PI / 2).translate(BAY_X, 0.025, 0), bayMat)
  bay.name = 'bay'
  group.add(bay)
  return group
}

export type TrafficModel = { geo: THREE.BufferGeometry; w: number; l: number; speed: [number, number] }

const truckWheels = (zs: number[], r = 0.64) => zs.flatMap((z) => [-1, 1].flatMap((s) => [wheel(r, 0.38, s * 1.08, r, z, '#101218'), wheel(r * 0.44, 0.4, s * 1.08, r, z, '#a9adb3')]))

export function trafficModels(): TrafficModel[] {
  const boxTruck = (cargo: string, cab: string): TrafficModel => ({
    geo: merged([
      box(2.5, 2.9, 7, 0, 2.8, 1.2, cargo), box(2.2, 0.42, 9.3, 0, 1.13, 0, '#2a2d3a'), box(2.4, 2.5, 2.3, 0, 2.2, -3.5, cab),
      box(2, 0.9, 0.08, 0, 2.75, -4.68, '#10151f'), box(2.5, 0.22, 0.2, 0, 0.98, 4.66, '#15171f'),
      box(0.5, 0.2, 0.08, -0.85, 1.42, 4.74, '#ff3b1e'), box(0.5, 0.2, 0.08, 0.85, 1.42, 4.74, '#ff3b1e'), ...truckWheels([-3.4, 2.3, 3.65]),
    ]),
    w: 1.3, l: 4.7, speed: [18, 26],
  })
  const tanker: TrafficModel = {
    geo: merged([
      box(2.2, 0.42, 9.3, 0, 1.13, 0, '#2a2d3a'), tube(1.25, 6.6, 0, 2.6, 1.3, '#d9dde2'), box(2.4, 2.5, 2.3, 0, 2.2, -3.5, '#c8392a'),
      box(2, 0.9, 0.08, 0, 2.75, -4.68, '#10151f'), box(0.5, 0.2, 0.08, -0.85, 1.42, 4.74, '#ff3b1e'), box(0.5, 0.2, 0.08, 0.85, 1.42, 4.74, '#ff3b1e'),
      box(2.6, 0.3, 0.3, 0, 2.6, 4.62, '#9aa0a8'), ...truckWheels([-3.4, 2.3, 3.65]),
    ]),
    w: 1.3, l: 4.7, speed: [16, 22],
  }
  const logs: THREE.BufferGeometry[] = []
  for (const [x, y] of [[-0.62, 1.75], [0, 1.75], [0.62, 1.75], [-0.31, 2.3], [0.31, 2.3], [0, 2.85]]) logs.push(tube(0.34, 6.4, x, y, 1.4, '#7a4a2a'))
  const logger: TrafficModel = {
    geo: merged([
      box(2.2, 0.42, 9.3, 0, 1.13, 0, '#2a2d3a'), box(2.4, 2.5, 2.3, 0, 2.2, -3.5, '#e2a32a'), box(2, 0.9, 0.08, 0, 2.75, -4.68, '#10151f'),
      box(0.15, 2, 0.15, -1.1, 2.2, -1.6, '#2a2d3a'), box(0.15, 2, 0.15, 1.1, 2.2, -1.6, '#2a2d3a'), box(0.15, 2, 0.15, -1.1, 2.2, 4.3, '#2a2d3a'), box(0.15, 2, 0.15, 1.1, 2.2, 4.3, '#2a2d3a'),
      ...logs, box(0.5, 0.2, 0.08, -0.85, 1.42, 4.74, '#ff3b1e'), box(0.5, 0.2, 0.08, 0.85, 1.42, 4.74, '#ff3b1e'), ...truckWheels([-3.4, 2.3, 3.65]),
    ]),
    w: 1.3, l: 4.8, speed: [15, 21],
  }
  const bus: TrafficModel = {
    geo: merged([
      box(2.5, 2.7, 11, 0, 1.95, 0, '#e2a32a'), box(2.54, 0.8, 9.6, 0, 2.55, -0.3, '#13192b'), box(2.54, 0.18, 11.02, 0, 1.35, 0, '#13192b'),
      box(2.2, 1.1, 0.06, 0, 2.4, -5.52, '#13192b'), box(0.5, 0.2, 0.08, -0.9, 1.2, 5.52, '#ff3b1e'), box(0.5, 0.2, 0.08, 0.9, 1.2, 5.52, '#ff3b1e'),
      ...[-3.9, 3.7].flatMap((z) => [-1, 1].flatMap((s) => [wheel(0.56, 0.36, s * 1.1, 0.56, z, '#101218'), wheel(0.25, 0.38, s * 1.1, 0.56, z, '#a9adb3')])),
    ]),
    w: 1.35, l: 5.6, speed: [20, 26],
  }
  return [boxTruck('#d9cfb8', '#0f7c7a'), boxTruck('#0f7c7a', '#efe6d3'), boxTruck('#e2a32a', '#13192b'), tanker, logger, bus]
}
