import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const bendUniform = { value: new THREE.Vector2(0, 0) }

/** Curves the world in view space, so a straight road reads as hills and bends. */
export function bendable<T extends THREE.Material>(material: T): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBend = bendUniform
    shader.vertexShader = `uniform vec2 uBend;\n${shader.vertexShader}`.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
       mvPosition.xy += uBend * mvPosition.z * mvPosition.z;
       gl_Position = projectionMatrix * mvPosition;`,
    )
  }
  return material
}

export function tint(geometry: THREE.BufferGeometry, hex: string) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  const c = new THREE.Color(hex)
  const count = g.attributes.position.count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  if (g.attributes.uv) g.deleteAttribute('uv')
  return g
}

export const box = (w: number, h: number, d: number, x: number, y: number, z: number, hex: string, ry = 0) => {
  const g = new THREE.BoxGeometry(w, h, d)
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  return tint(g, hex)
}

export const cone = (r: number, h: number, x: number, y: number, z: number, hex: string, seg = 7) => {
  const g = new THREE.ConeGeometry(r, h, seg)
  g.translate(x, y + h / 2, z)
  return tint(g, hex)
}

/** A four-sided roof whose edges line up with a box below it. */
export const pyramid = (r: number, h: number, x: number, y: number, z: number, hex: string) => {
  const g = new THREE.ConeGeometry(r, h, 4)
  g.rotateY(Math.PI / 4)
  g.translate(x, y + h / 2, z)
  return tint(g, hex)
}

export const cyl = (top: number, bottom: number, h: number, x: number, y: number, z: number, hex: string, seg = 8) => {
  const g = new THREE.CylinderGeometry(top, bottom, h, seg)
  g.translate(x, y + h / 2, z)
  return tint(g, hex)
}

/** A cylinder lying down, along the length of the road (z) or across it (x). */
export const tube = (r: number, len: number, x: number, y: number, z: number, hex: string, axis: 'x' | 'z' = 'z', seg = 12) => {
  const g = new THREE.CylinderGeometry(r, r, len, seg)
  if (axis === 'z') g.rotateX(Math.PI / 2)
  else g.rotateZ(Math.PI / 2)
  g.translate(x, y, z)
  return tint(g, hex)
}

/** An upright wheel whose axle runs across the vehicle. */
export const wheel = (r: number, width: number, x: number, y: number, z: number, hex: string) => {
  const g = new THREE.CylinderGeometry(r, r, width, 16)
  g.rotateZ(Math.PI / 2)
  g.translate(x, y, z)
  return tint(g, hex)
}

export const rock = (r: number, x: number, y: number, z: number, hex: string) => {
  const g = new THREE.IcosahedronGeometry(r, 0)
  g.scale(1, 0.72, 1)
  g.translate(x, y, z)
  return tint(g, hex)
}

export const sphere = (r: number, x: number, y: number, z: number, hex: string, squash = 1) => {
  const g = new THREE.IcosahedronGeometry(r, 1)
  g.scale(1, squash, 1)
  g.translate(x, y, z)
  return tint(g, hex)
}

export const dome = (r: number, x: number, y: number, z: number, hex: string) => {
  const g = new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  g.translate(x, y, z)
  return tint(g, hex)
}

/** A bowl facing up and tilted back, like a radio telescope. */
export const dish = (r: number, depth: number, x: number, y: number, z: number, hex: string, tilt = 0.6) => {
  const g = new THREE.ConeGeometry(r, depth, 18, 1, true)
  g.rotateX(Math.PI + tilt)
  g.translate(x, y, z)
  return tint(g, hex)
}

export const merged = (parts: THREE.BufferGeometry[]) => mergeGeometries(parts, false)!

export const flatVertex = () => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide })
