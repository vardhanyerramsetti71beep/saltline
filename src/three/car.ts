import * as THREE from 'three'
import type { StripeId } from '../content'
import { VEHICLES, type CarId, type Profile } from '../vehicles'

type Pt = [number, number]

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

function bodyShape(p: Profile) {
  const s = new THREE.Shape()
  p.body.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)))
  s.lineTo(p.front + p.arch, p.floor)
  s.absarc(p.front, p.floor, p.arch, 0, Math.PI, false)
  s.lineTo(p.rear + p.arch, p.floor)
  s.absarc(p.rear, p.floor, p.arch, 0, Math.PI, false)
  s.closePath()
  return s
}

export type CarLook = { car: CarId; paint: string; stripe: StripeId }
type Wrap = <T extends THREE.Material>(m: T) => T

const stripeColor = (paint: string) => (new THREE.Color(paint).getHSL({ h: 0, s: 0, l: 0 }).l > 0.55 ? '#13192b' : '#efe6d3')

export function buildCar(look: CarLook, wrap: Wrap = (m) => m) {
  const p = VEHICLES[look.car].profile
  const group = new THREE.Group()
  const paint = wrap(new THREE.MeshPhongMaterial({ color: look.paint, shininess: 90, specular: 0x666666 }))
  const glass = wrap(new THREE.MeshPhongMaterial({ color: 0x10151f, shininess: 120, specular: 0x8899aa }))
  const trim = wrap(new THREE.MeshLambertMaterial({ color: 0x151822 }))
  const chrome = wrap(new THREE.MeshPhongMaterial({ color: 0xd4d8d8, shininess: 140, specular: 0xffffff }))
  const stripe = wrap(new THREE.MeshPhongMaterial({ color: stripeColor(look.paint), shininess: 60 }))
  const lamp = wrap(new THREE.MeshBasicMaterial({ color: 0xfff1c4 }))
  const tail = wrap(new THREE.MeshBasicMaterial({ color: 0xff2a16 }))
  const cargo = wrap(new THREE.MeshLambertMaterial({ color: 0xc58a3c }))
  const mats = { paint, trim, chrome, lamp, cargo }
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
    const m = new THREE.Mesh(geometry, material)
    group.add(m)
    return m
  }

  add(extrude(bodyShape(p), p.width), paint)
  add(extrude(polygon(p.cabin), p.cabinWidth, 0.03), glass)
  add(extrude(polygon(p.roof), p.cabinWidth + 0.04, 0.03), paint)

  const [cabinRear, , cabinTop] = p.cabin
  const pillarH = cabinTop[1] - cabinRear[1]
  for (const side of [-1, 1]) {
    const pillar = new THREE.BoxGeometry(0.03, pillarH, 0.1)
    pillar.translate((side * (p.cabinWidth + 0.06)) / 2, cabinRear[1] + pillarH / 2, -(cabinRear[0] + cabinTop[0]) / 2)
    add(pillar, paint)
  }

  for (const b of p.panels ?? []) {
    const g = new THREE.BoxGeometry(p.width * b.w, b.v1 - b.v0, b.u1 - b.u0)
    g.translate(b.x ?? 0, (b.v0 + b.v1) / 2, -(b.u0 + b.u1) / 2)
    add(g, mats[b.mat])
  }

  if (look.stripe !== 'none') {
    const offsets = look.stripe === 'rally' ? [0] : [-0.32, 0.32]
    const w = look.stripe === 'rally' ? 0.44 : 0.2
    for (const x of offsets) {
      const b = extrude(polygon(p.body), w, 0.058)
      b.translate(x, 0, 0)
      add(b, stripe)
      const r = extrude(polygon(p.roof), w, 0.037)
      r.translate(x, 0, 0)
      add(r, stripe)
    }
  }

  const frontZ = -p.body[p.body.length - 1][0]
  const rearZ = -p.body[0][0]
  const lampY = p.body[p.body.length - 2][1] - 0.08
  for (const side of [-1, 1]) {
    const head = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 14)
    head.rotateX(Math.PI / 2)
    head.translate(side * (p.width / 2 - 0.3), lampY, frontZ - 0.03)
    add(head, lamp)
    const back = new THREE.BoxGeometry(0.42, 0.14, 0.05)
    back.translate(side * (p.width / 2 - 0.3), p.body[1][1] - 0.1, rearZ + 0.02)
    add(back, tail)
  }
  const bumperF = new THREE.BoxGeometry(p.width + 0.04, 0.12, 0.14)
  bumperF.translate(0, p.floor + 0.12, frontZ - 0.04)
  add(bumperF, chrome)
  const bumperR = new THREE.BoxGeometry(p.width + 0.04, 0.12, 0.14)
  bumperR.translate(0, p.floor + 0.12, rearZ + 0.04)
  add(bumperR, chrome)

  if (look.car === 'sandpiper') {
    // The stolen transmitter rides on the roof rack.
    const roofY = p.roof[2][1]
    const rack = new THREE.BoxGeometry(1.3, 0.05, 1.5)
    rack.translate(0, roofY + 0.08, 0.95)
    add(rack, trim)
    const crate = new THREE.BoxGeometry(0.95, 0.34, 0.86)
    crate.translate(0, roofY + 0.27, 1.05)
    add(crate, cargo)
    const mast = new THREE.CylinderGeometry(0.012, 0.022, 1.15, 6)
    mast.translate(0.38, roofY + 0.86, 1.3)
    add(mast, trim)
    for (const side of [-1, 1]) {
      const rally = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12)
      rally.rotateX(Math.PI / 2)
      rally.translate(side * 0.28, p.floor + 0.34, frontZ - 0.08)
      add(rally, lamp)
    }
  }

  const wheels: THREE.Object3D[] = []
  const tyre = new THREE.CylinderGeometry(p.wheel, p.wheel, 0.28 + p.wheel * 0.15, 18)
  tyre.rotateZ(Math.PI / 2)
  const hub = new THREE.CylinderGeometry(p.wheel * 0.5, p.wheel * 0.5, 0.32 + p.wheel * 0.15, 6)
  hub.rotateZ(Math.PI / 2)
  for (const z of [-p.front, -p.rear]) {
    for (const side of [-1, 1]) {
      const w = new THREE.Group()
      w.add(new THREE.Mesh(tyre, trim), new THREE.Mesh(hub, chrome))
      w.position.set(side * (p.width / 2 - 0.1), p.wheel, z)
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
