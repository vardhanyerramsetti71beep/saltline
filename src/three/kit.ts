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

function tint(geometry: THREE.BufferGeometry, hex: string) {
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

export const cyl = (top: number, bottom: number, h: number, x: number, y: number, z: number, hex: string, seg = 8) => {
  const g = new THREE.CylinderGeometry(top, bottom, h, seg)
  g.translate(x, y + h / 2, z)
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

export const merged = (parts: THREE.BufferGeometry[]) => mergeGeometries(parts, false)!

export const flatVertex = () => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })
