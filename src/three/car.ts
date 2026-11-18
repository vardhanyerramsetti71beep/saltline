import * as THREE from 'three'
import type { CarId, StripeId } from '../content'

type Pt = [number, number]
type Spec = {
  width: number; floor: number; wheel: number; arch: number; front: number; rear: number
  body: Pt[]; cabin: Pt[]; roof: Pt[]; cabinWidth: number
}

const SPECS: Record<CarId, Spec> = {
  sandpiper: {
    width: 1.84, floor: 0.34, wheel: 0.37, arch: 0.47, front: 1.36, rear: -1.36, cabinWidth: 1.56,
    body: [[-2.2, 0.36], [-2.26, 0.84], [-2.08, 0.98], [1.0, 1.0], [2.0, 0.86], [2.2, 0.68], [2.24, 0.36]],
    cabin: [[-2.04, 0.96], [-1.96, 1.47], [0.12, 1.5], [1.04, 0.98]],
    roof: [[-2.02, 1.42], [-1.98, 1.55], [0.14, 1.58], [0.34, 1.42]],
  },
  merle: {
    width: 1.9, floor: 0.3, wheel: 0.36, arch: 0.46, front: 1.46, rear: -1.42, cabinWidth: 1.5,
    body: [[-2.24, 0.34], [-2.3, 0.76], [-2.14, 0.9], [0.66, 0.88], [2.08, 0.72], [2.3, 0.56], [2.32, 0.34]],
    cabin: [[-1.92, 0.88], [-0.72, 1.28], [0.02, 1.3], [0.86, 0.88]],
    roof: [[-0.92, 1.2], [-0.7, 1.33], [0.04, 1.35], [0.26, 1.2]],
  },
  ostler: {
    width: 1.96, floor: 0.44, wheel: 0.43, arch: 0.55, front: 1.46, rear: -1.46, cabinWidth: 1.72,
    body: [[-2.42, 0.46], [-2.44, 1.04], [1.0, 1.06], [2.1, 1.0], [2.26, 0.82], [2.28, 0.46]],
    cabin: [[-0.56, 1.04], [-0.52, 1.74], [0.56, 1.76], [1.02, 1.06]],
    roof: [[-0.58, 1.68], [-0.56, 1.82], [0.6, 1.84], [0.78, 1.68]],
  },
}

const extrude = (shape: THREE.Shape, depth: number, bevel = 0.05) => {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10,
  })
  g.translate(0, 0, -depth / 2)
  g.rotateY(Math.PI / 2)
  return g
}

const polygon = (pts: Pt[]) => {
  const s = new THREE.Shape()
  pts.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)))
  s.closePath()
  return s
}

function bodyShape(spec: Spec) {
  const s = new THREE.Shape()
  spec.body.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)))
  s.lineTo(spec.front + spec.arch, spec.floor)
  s.absarc(spec.front, spec.floor, spec.arch, 0, Math.PI, false)
  s.lineTo(spec.rear + spec.arch, spec.floor)
  s.absarc(spec.rear, spec.floor, spec.arch, 0, Math.PI, false)
  s.closePath()
  return s
}

export type CarLook = { car: CarId; paint: string; stripe: StripeId }
type Wrap = <T extends THREE.Material>(m: T) => T

const stripeColor = (paint: string) => (new THREE.Color(paint).getHSL({ h: 0, s: 0, l: 0 }).l > 0.55 ? '#13192b' : '#efe6d3')

export function buildCar(look: CarLook, wrap: Wrap = (m) => m) {
  const spec = SPECS[look.car]
  const group = new THREE.Group()
  const paint = wrap(new THREE.MeshPhongMaterial({ color: look.paint, shininess: 90, specular: 0x666666 }))
  const glass = wrap(new THREE.MeshPhongMaterial({ color: 0x10151f, shininess: 120, specular: 0x8899aa }))
  const trim = wrap(new THREE.MeshLambertMaterial({ color: 0x151822 }))
  const chrome = wrap(new THREE.MeshPhongMaterial({ color: 0xd4d8d8, shininess: 140, specular: 0xffffff }))
  const stripe = wrap(new THREE.MeshPhongMaterial({ color: stripeColor(look.paint), shininess: 60 }))
  const lamp = wrap(new THREE.MeshBasicMaterial({ color: 0xfff1c4 }))
  const tail = wrap(new THREE.MeshBasicMaterial({ color: 0xff2a16 }))
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
    const m = new THREE.Mesh(geometry, material)
    group.add(m)
    return m
  }

  add(extrude(bodyShape(spec), spec.width), paint)
  add(extrude(polygon(spec.cabin), spec.cabinWidth, 0.03), glass)
  add(extrude(polygon(spec.roof), spec.cabinWidth + 0.04, 0.03), paint)

  // Door pillars break up the glass.
  const [cabinRear, , cabinTop] = spec.cabin
  const pillarH = cabinTop[1] - cabinRear[1]
  for (const side of [-1, 1]) {
    const pillar = new THREE.BoxGeometry(0.03, pillarH, 0.1)
    pillar.translate((side * (spec.cabinWidth + 0.06)) / 2, cabinRear[1] + pillarH / 2, 0.02)
    add(pillar, paint)
  }

  if (look.stripe !== 'none') {
    const offsets = look.stripe === 'rally' ? [0] : [-0.32, 0.32]
    const w = look.stripe === 'rally' ? 0.44 : 0.2
    for (const x of offsets) {
      const b = extrude(polygon(spec.body), w, 0.058)
      b.translate(x, 0, 0)
      add(b, stripe)
      const r = extrude(polygon(spec.roof), w, 0.037)
      r.translate(x, 0, 0)
      add(r, stripe)
    }
  }

  const frontZ = -spec.body[spec.body.length - 1][0]
  const rearZ = -spec.body[0][0]
  const lampY = spec.body[spec.body.length - 2][1] - 0.08
  for (const side of [-1, 1]) {
    const head = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 14)
    head.rotateX(Math.PI / 2)
    head.translate(side * (spec.width / 2 - 0.3), lampY, frontZ - 0.03)
    add(head, lamp)
    const back = new THREE.BoxGeometry(0.42, 0.14, 0.05)
    back.translate(side * (spec.width / 2 - 0.3), spec.body[1][1] - 0.1, rearZ + 0.02)
    add(back, tail)
  }
  const bumperF = new THREE.BoxGeometry(spec.width + 0.04, 0.12, 0.14)
  bumperF.translate(0, spec.floor + 0.12, frontZ - 0.04)
  add(bumperF, chrome)
  const bumperR = new THREE.BoxGeometry(spec.width + 0.04, 0.12, 0.14)
  bumperR.translate(0, spec.floor + 0.12, rearZ + 0.04)
  add(bumperR, chrome)

  if (look.car === 'sandpiper') {
    // The stolen transmitter rides on the roof rack.
    const roofY = spec.roof[2][1]
    const rack = new THREE.BoxGeometry(1.3, 0.05, 1.5)
    rack.translate(0, roofY + 0.08, 0.95)
    add(rack, trim)
    const crate = new THREE.BoxGeometry(0.95, 0.34, 0.86)
    crate.translate(0, roofY + 0.27, 1.05)
    add(crate, wrap(new THREE.MeshLambertMaterial({ color: 0xc58a3c })))
    const mast = new THREE.CylinderGeometry(0.012, 0.022, 1.15, 6)
    mast.translate(0.38, roofY + 0.86, 1.3)
    add(mast, trim)
    for (const side of [-1, 1]) {
      const rally = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12)
      rally.rotateX(Math.PI / 2)
      rally.translate(side * 0.28, spec.floor + 0.34, frontZ - 0.08)
      add(rally, lamp)
    }
  }
  if (look.car === 'ostler') {
    const bed = new THREE.BoxGeometry(spec.width - 0.34, 0.08, 1.7)
    bed.translate(0, 1.07, 1.5)
    add(bed, trim)
    const load = new THREE.BoxGeometry(0.9, 0.44, 0.8)
    load.translate(0.1, 1.31, 1.6)
    add(load, wrap(new THREE.MeshLambertMaterial({ color: 0xc58a3c })))
  }
  if (look.car === 'merle') {
    const spoiler = new THREE.BoxGeometry(spec.width - 0.2, 0.05, 0.3)
    spoiler.translate(0, 1.0, 2.05)
    add(spoiler, trim)
  }

  const wheels: THREE.Object3D[] = []
  const tyre = new THREE.CylinderGeometry(spec.wheel, spec.wheel, 0.28, 18)
  tyre.rotateZ(Math.PI / 2)
  const hub = new THREE.CylinderGeometry(spec.wheel * 0.5, spec.wheel * 0.5, 0.3, 6)
  hub.rotateZ(Math.PI / 2)
  for (const z of [-spec.front, -spec.rear]) {
    for (const side of [-1, 1]) {
      const w = new THREE.Group()
      w.add(new THREE.Mesh(tyre, trim), new THREE.Mesh(hub, chrome))
      w.position.set(side * (spec.width / 2 - 0.1), spec.wheel, z)
      group.add(w)
      wheels.push(w)
    }
  }

  group.userData = { wheels, paint, stripe }
  return group
}

export function repaint(car: THREE.Group, hex: string) {
  ;(car.userData.paint as THREE.MeshPhongMaterial).color.set(hex)
  ;(car.userData.stripe as THREE.MeshPhongMaterial).color.set(stripeColor(hex))
}
