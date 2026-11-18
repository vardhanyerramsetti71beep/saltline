import * as THREE from 'three'
import { audio } from '../audio'
import { CARS, REGIONS, type LeadId } from '../content'
import { buildCar, type CarLook } from './car'
import { bendUniform, bendable, box, cone, cyl, flatVertex, merged, rock, wheel } from './kit'

export type Phase = 'attract' | 'count' | 'run' | 'paused' | 'over' | 'win'
export type DriveHud = {
  phase: Phase; kmh: number; km: number; fuel: number; lives: number; livesMax: number
  valves: number; region: number; count: number; reason: string; lostWhy: string
}
export type DriveEvents = {
  hud: (h: DriveHud) => void
  region: (index: number) => void
  ghost: () => void
  end: (won: boolean, km: number, valves: number) => void
}

const FINISH = 580
const ROAD = 7
const SHOULDER = 10.4

type Palette = { top: string; mid: string; hor: string; sun: string; ground: string; road: string; line: string; hemi: string; low: string; dir: string; near: number; far: number; night: number; sunDir: [number, number, number] }

const PALETTES: Palette[] = [
  { top: '#141a36', mid: '#43294f', hor: '#dd6a3c', sun: '#ffb27a', ground: '#262a38', road: '#1c1f2b', line: '#f0d6a2', hemi: '#8f8fb8', low: '#2a2230', dir: '#ffae80', near: 50, far: 300, night: 0.55, sunDir: [0.28, 0.09, -1] },
  { top: '#3c8cae', mid: '#a7d3cd', hor: '#f6edd9', sun: '#fffbe9', ground: '#f0e8d6', road: '#5f5d5b', line: '#fffaf0', hemi: '#ffffff', low: '#d8ccb0', dir: '#fff3d8', near: 90, far: 360, night: 0, sunDir: [-0.2, 0.42, -1] },
  { top: '#431b25', mid: '#b5421f', hor: '#f2a83c', sun: '#ffe08a', ground: '#3f2a1b', road: '#2a211d', line: '#f6d88f', hemi: '#ffb27c', low: '#3a1d17', dir: '#ff9a4d', near: 40, far: 270, night: 0.28, sunDir: [-0.42, 0.1, -1] },
  { top: '#050a1c', mid: '#0d2040', hor: '#285571', sun: '#e6eff2', ground: '#12202f', road: '#0f1722', line: '#bcdcdd', hemi: '#6b86ad', low: '#0b1420', dir: '#a9c7e6', near: 34, far: 240, night: 1, sunDir: [0.36, 0.36, -1] },
]

const regionAt = (km: number) => {
  for (let i = REGIONS.length - 1; i >= 0; i--) if (km >= REGIONS[i].from) return i
  return 0
}

type Prop = { mesh: THREE.InstancedMesh; region: number; items: { x: number; z: number; s: number; ry: number; on: boolean }[]; min: number; max: number; spread: [number, number] }
type Kind = 'truck' | 'barrier' | 'cones' | 'valve' | 'fuel' | 'ghost' | 'lighthouse'
type Entity = { kind: Kind; obj: THREE.Object3D; on: boolean; x: number; z: number; w: number; l: number; vz: number; hit: boolean }

const SPAWN_Z = -340

export class DriveGame {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(66, 1, 0.1, 900)
  private raf = 0
  private visible = false
  private last = performance.now()
  private observer: ResizeObserver

  private car!: THREE.Group
  private look: CarLook
  private lead: LeadId
  private headlights: THREE.Mesh

  private skyMat: THREE.ShaderMaterial
  private groundMat: THREE.MeshBasicMaterial
  private roadMat: THREE.MeshBasicMaterial
  private lineMat: THREE.MeshBasicMaterial
  private groundTex: THREE.CanvasTexture
  private lineTex: THREE.CanvasTexture
  private hemi: THREE.HemisphereLight
  private sun: THREE.DirectionalLight
  private fog: THREE.Fog
  private pal: { [K in 'top' | 'mid' | 'hor' | 'sun' | 'ground' | 'road' | 'line' | 'hemi' | 'low' | 'dir']: THREE.Color } & { near: number; far: number; night: number; sunDir: THREE.Vector3 }

  private props: Prop[] = []
  private entities: Entity[] = []
  private streaks: THREE.LineSegments
  private streakData: { x: number; y: number; z: number; v: number }[] = []

  phase: Phase = 'attract'
  input = { left: false, right: false, up: false, down: false, axis: 0 }
  private dist = 0
  private km = 0
  private kmh = 148
  private x = 0
  private vx = 0
  private fuel = 100
  private lives = 3
  private livesMax = 3
  private valves = 0
  private chain = 0
  private invuln = 0
  private shake = 0
  private region = 0
  private displayRegion = 0
  private count = 0
  private nextSpawn = 0
  private nextFuel = 500
  private ghostDone = false
  private houseDone = false
  private attractTime = 0
  private reason = ''
  private lostWhy = ''
  private hudTimer = 0
  private infinite = false
  private blueprint = false
  private time = 0

  constructor(private canvas: HTMLCanvasElement, look: CarLook, lead: LeadId, private events: DriveEvents) {
    this.look = look
    this.lead = lead
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))

    const p = PALETTES[0]
    this.pal = {
      top: new THREE.Color(p.top), mid: new THREE.Color(p.mid), hor: new THREE.Color(p.hor), sun: new THREE.Color(p.sun),
      ground: new THREE.Color(p.ground), road: new THREE.Color(p.road), line: new THREE.Color(p.line),
      hemi: new THREE.Color(p.hemi), low: new THREE.Color(p.low), dir: new THREE.Color(p.dir),
      near: p.near, far: p.far, night: p.night, sunDir: new THREE.Vector3(...p.sunDir).normalize(),
    }

    this.fog = new THREE.Fog(this.pal.hor.getHex(), p.near, p.far)
    this.scene.fog = this.fog
    this.hemi = new THREE.HemisphereLight(this.pal.hemi, this.pal.low, 2.2)
    this.sun = new THREE.DirectionalLight(this.pal.dir, 1.9)
    this.sun.position.set(-4, 9, 5)
    this.scene.add(this.hemi, this.sun)

    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        cTop: { value: this.pal.top }, cMid: { value: this.pal.mid }, cHor: { value: this.pal.hor },
        cSun: { value: this.pal.sun }, sunDir: { value: this.pal.sunDir }, night: { value: p.night }, uRes: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vDir; uniform vec3 cTop, cMid, cHor, cSun, sunDir; uniform float night;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        void main(){
          vec3 d = normalize(vDir);
          float h = clamp(d.y, 0.0, 1.0);
          float band = floor(pow(h, 0.62) * 9.0) / 9.0;
          vec3 c = band < 0.34 ? mix(cHor, cMid, band / 0.34) : mix(cMid, cTop, (band - 0.34) / 0.66);
          float a = dot(d, normalize(sunDir));
          float disc = smoothstep(0.9968, 0.9974, a);
          vec2 g = gl_FragCoord.xy / 7.0;
          float dots = smoothstep(0.34, 0.28, length(fract(g) - 0.5));
          float halo = smoothstep(0.962, 0.9968, a);
          c = mix(c, cSun, dots * halo * 0.75);
          c = mix(c, cSun, disc);
          vec3 cell = floor(d * 150.0);
          float star = step(0.9965, hash(cell.xy + cell.z * 7.31));
          c += vec3(star) * night * night * smoothstep(0.14, 0.42, d.y);
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
    const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 20), this.skyMat)
    sky.frustumCulled = false
    sky.renderOrder = -10
    this.scene.add(sky)

    this.groundTex = this.speckle()
    this.groundMat = bendable(new THREE.MeshBasicMaterial({ color: this.pal.ground, map: this.groundTex }))
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 470, 70, 90).rotateX(-Math.PI / 2), this.groundMat)
    ground.position.set(0, -0.02, -210)
    ground.frustumCulled = false
    this.scene.add(ground)

    this.roadMat = bendable(new THREE.MeshBasicMaterial({ color: this.pal.road }))
    const road = new THREE.Mesh(new THREE.PlaneGeometry(SHOULDER * 2, 470, 6, 110).rotateX(-Math.PI / 2), this.roadMat)
    road.position.set(0, 0, -210)
    road.frustumCulled = false
    this.scene.add(road)

    this.lineTex = this.markings()
    this.lineMat = bendable(new THREE.MeshBasicMaterial({ color: this.pal.line, map: this.lineTex, transparent: true, depthWrite: false }))
    const lines = new THREE.Mesh(new THREE.PlaneGeometry(SHOULDER * 2, 470, 6, 110).rotateX(-Math.PI / 2), this.lineMat)
    lines.position.set(0, 0.02, -210)
    lines.frustumCulled = false
    this.scene.add(lines)

    this.headlights = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 26).rotateX(-Math.PI / 2),
      bendable(new THREE.MeshBasicMaterial({ map: this.beam(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })),
    )
    this.headlights.position.set(0, 0.06, -15)
    this.scene.add(this.headlights)

    this.buildProps()
    this.buildEntities()
    this.streaks = this.buildStreaks()
    this.spawnCar()

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas.parentElement!)
    this.resize()
    this.resetRun()
    this.phase = 'attract'
  }

  private speckle() {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    g.fillStyle = '#fff'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.1})`
      g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 10, 1 + Math.random() * 3)
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(16, 8)
    return t
  }

  private markings() {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    const g = c.getContext('2d')!
    g.clearRect(0, 0, 512, 512)
    g.fillStyle = '#fff'
    const px = (x: number) => ((x + SHOULDER) / (SHOULDER * 2)) * 512
    for (const x of [-ROAD, ROAD]) g.fillRect(px(x) - 5, 0, 10, 512)
    for (const x of [-3.5, 0, 3.5]) {
      g.fillRect(px(x) - 3, 40, 6, 200)
      g.fillRect(px(x) - 3, 296, 6, 200)
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1, 18)
    t.anisotropy = 8
    return t
  }

  private beam() {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 256
    const g = c.getContext('2d')!
    const grad = g.createLinearGradient(0, 256, 0, 0)
    grad.addColorStop(0, 'rgba(255,236,190,.9)')
    grad.addColorStop(1, 'rgba(255,236,190,0)')
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(44, 256)
    g.lineTo(84, 256)
    g.lineTo(128, 0)
    g.lineTo(0, 0)
    g.fill()
    return new THREE.CanvasTexture(c)
  }

  private buildProps() {
    const material = bendable(flatVertex())
    const lamp = merged([cyl(0.1, 0.14, 9, 0, 0, 0, '#33364a'), box(2.6, 0.14, 0.14, 1.2, 9, 0, '#33364a'), box(0.8, 0.16, 0.3, 2.3, 8.9, 0, '#ffd27a')])
    const crane = merged([box(1, 26, 1, -5, 13, -3, '#c4422a'), box(1, 26, 1, 5, 13, -3, '#c4422a'), box(1, 26, 1, -5, 13, 3, '#c4422a'), box(1, 26, 1, 5, 13, 3, '#c4422a'), box(12, 1, 8, 0, 18, 0, '#7f2c20'), box(36, 1.5, 2, 8, 27, 0, '#d4a23a'), box(2, 8, 2, 0, 31, 0, '#7f2c20'), box(2.6, 2, 2.6, 18, 22, 0, '#232636')])
    const stack = merged([box(12, 3, 3.2, 0, 1.5, 0, '#0f7c7a'), box(12, 3, 3.2, 0, 1.5, 3.6, '#c9842a'), box(12, 3, 3.2, 1, 4.5, 1.6, '#b83a26'), box(12, 3, 3.2, -1, 7.5, 2, '#d9cfb8')])
    const pole = merged([cyl(0.12, 0.17, 11, 0, 0, 0, '#4a3a2c'), box(3.6, 0.16, 0.16, 0, 10.2, 0, '#4a3a2c'), box(2.8, 0.14, 0.14, 0, 9.2, 0, '#4a3a2c')])
    const mesa = merged([cyl(5, 8, 7, 0, 0, 0, '#d8b98a', 6), cyl(3.4, 5, 3, 0.6, 7, 0, '#c7a374', 6)])
    const mound = merged([cone(4, 2.2, 0, 0, 0, '#fffaf0', 6), cone(2.2, 1.5, 3.5, 0, 1, '#f4ecd9', 6)])
    const pine = merged([cyl(0.3, 0.5, 3, 0, 0, 0, '#3a2318'), cone(3.2, 5, 0, 2.2, 0, '#2d3a24'), cone(2.5, 4.4, 0, 5.2, 0, '#3a4628'), cone(1.7, 3.8, 0, 8.2, 0, '#4d4f2a')])
    const burnt = merged([cyl(0.14, 0.42, 9, 0, 0, 0, '#17110f', 6), box(2.6, 0.2, 0.2, 0.7, 6, 0, '#17110f', 0.6), box(1.8, 0.16, 0.16, -0.5, 7.4, 0, '#17110f', -0.5), cone(0.6, 1.3, 0, 8.6, 0, '#f08a2c', 5)])
    const boulder = merged([rock(2.6, 0, 1.1, 0, '#5b4231'), rock(1.4, 2.4, 0.6, 1, '#6d4f39')])
    const cliff = merged([rock(9, 0, 3, 0, '#22333f'), rock(6, 7, 1.4, 3, '#2c414d'), rock(5, -7, 1, -2, '#1b2a35')])
    const windtree = merged([cyl(0.14, 0.36, 4, 0, 0, 0, '#1b2026', 5), box(5.2, 1.4, 2.4, 1.4, 4.3, 0, '#1c3a3a'), box(3.2, 1, 1.8, 2.3, 5.2, 0, '#245050')])
    const buoy = merged([cyl(0.6, 0.9, 1.5, 0, 0, 0, '#b83a26', 8), cyl(0.05, 0.1, 2.4, 0, 1.5, 0, '#dddddd', 5), box(0.35, 0.35, 0.35, 0, 3.9, 0, '#ffd27a')])

    const def = (region: number, geometry: THREE.BufferGeometry, count: number, min: number, max: number, spread: [number, number]) => {
      const mesh = new THREE.InstancedMesh(geometry, material, count)
      mesh.frustumCulled = false
      const items = Array.from({ length: count }, () => ({ x: 0, z: 0, s: 1, ry: 0, on: region === 0 }))
      const prop: Prop = { mesh, region, items, min, max, spread }
      items.forEach((it, i) => {
        this.seat(prop, it)
        it.z = 20 + SPAWN_Z * (i / count) + Math.random() * 12
      })
      this.props.push(prop)
      this.scene.add(mesh)
    }
    def(0, lamp, 14, 11.5, 12.5, [1, 1])
    def(0, crane, 9, 42, 150, [0.9, 1.5])
    def(0, stack, 18, 18, 110, [0.8, 1.3])
    def(1, pole, 14, 12, 13, [1, 1])
    def(1, mesa, 12, 60, 240, [1, 2.8])
    def(1, mound, 22, 16, 150, [0.6, 1.6])
    def(2, pine, 70, 13, 130, [0.8, 1.9])
    def(2, burnt, 22, 13, 80, [0.8, 1.4])
    def(2, boulder, 12, 14, 70, [0.6, 1.4])
    def(3, cliff, 22, 22, 170, [0.8, 2.4])
    def(3, windtree, 16, 14, 60, [0.8, 1.4])
    def(3, buoy, 10, 15, 42, [1, 1.4])
  }

  private seat(prop: Prop, it: Prop['items'][number]) {
    const side = Math.random() < 0.5 ? -1 : 1
    it.x = side * (prop.min + Math.random() * (prop.max - prop.min))
    it.s = prop.spread[0] + Math.random() * (prop.spread[1] - prop.spread[0])
    it.ry = Math.random() * Math.PI * 2
    if (prop.max - prop.min < 3) it.ry = side > 0 ? Math.PI : 0
    it.on = prop.region === this.region
  }

  private buildEntities() {
    const material = bendable(flatVertex())
    const mk = (geometry: THREE.BufferGeometry) => new THREE.Mesh(geometry, material)
    const glow = (hex: number) => bendable(new THREE.MeshBasicMaterial({ color: hex }))

    const truckParts = [
      box(2.5, 2.9, 7, 0, 2.8, 1.2, '#d9cfb8'),
      box(2.2, 0.42, 9.3, 0, 1.13, 0, '#2a2d3a'),
      box(2.4, 2.5, 2.3, 0, 2.2, -3.5, '#0f7c7a'),
      box(2, 0.9, 0.08, 0, 2.75, -4.68, '#10151f'),
      box(2.5, 0.22, 0.2, 0, 0.98, 4.66, '#15171f'),
      box(0.5, 0.2, 0.08, -0.85, 1.42, 4.74, '#ff3b1e'),
      box(0.5, 0.2, 0.08, 0.85, 1.42, 4.74, '#ff3b1e'),
    ]
    for (const z of [-3.4, 2.3, 3.65]) {
      for (const side of [-1, 1]) {
        truckParts.push(wheel(0.64, 0.38, side * 1.08, 0.64, z, '#101218'), wheel(0.28, 0.4, side * 1.08, 0.64, z, '#a9adb3'))
      }
    }
    const truckGeo = merged(truckParts)
    for (let i = 0; i < 5; i++) this.addEntity('truck', mk(truckGeo), 1.3, 4.7)

    const parts = [box(6.4, 0.2, 0.3, 0, 1.25, 0, '#efe6d3'), box(0.25, 1.3, 0.25, -2.8, 0.65, 0, '#232636'), box(0.25, 1.3, 0.25, 2.8, 0.65, 0, '#232636'), box(1, 0.08, 1.4, -2.8, 0.04, 0, '#232636'), box(1, 0.08, 1.4, 2.8, 0.04, 0, '#232636')]
    for (let i = 0; i < 4; i++) parts.push(box(0.75, 0.22, 0.32, -2.3 + i * 1.55, 1.25, 0, '#e0412a'))
    parts.push(cyl(0.16, 0.16, 0.3, -2.8, 1.35, 0, '#ffb12a'), cyl(0.16, 0.16, 0.3, 2.8, 1.35, 0, '#ffb12a'))
    const barrierGeo = merged(parts)
    for (let i = 0; i < 8; i++) this.addEntity('barrier', mk(barrierGeo), 3.2, 0.8)

    const coneParts: THREE.BufferGeometry[] = []
    for (const [x, z] of [[-1.5, 0], [0, -1.2], [1.5, 0], [-0.7, 1.3], [0.8, 1.2]]) {
      coneParts.push(box(0.8, 0.08, 0.8, x, 0.04, z, '#232636'), cone(0.32, 1, x, 0.06, z, '#ee6a2a', 8), cyl(0.2, 0.25, 0.14, x, 0.46, z, '#f7f1e3', 8))
    }
    const conesGeo = merged(coneParts)
    for (let i = 0; i < 5; i++) this.addEntity('cones', mk(conesGeo), 2, 1.8)

    for (let i = 0; i < 24; i++) {
      const g = new THREE.Group()
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 6, 20), glow(0xffd27a))
      const tube = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.56, 4, 10), glow(0xfff0c2))
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), glow(0xe0412a))
      base.position.y = -0.5
      g.add(halo, tube, base)
      g.position.y = 1.2
      const holder = new THREE.Group()
      holder.add(g)
      this.addEntity('valve', holder, 0.8, 0.8)
    }

    const fuelGeo = merged([box(1.1, 1.4, 0.55, 0, 1.1, 0, '#e0412a'), box(0.5, 0.26, 0.2, 0.2, 1.92, 0, '#f7f1e3'), box(0.8, 0.14, 0.58, 0, 1.1, 0, '#f7f1e3')])
    for (let i = 0; i < 3; i++) this.addEntity('fuel', mk(fuelGeo), 1.1, 1.1)

    const ghost = new THREE.Group()
    const ghostMat = bendable(new THREE.MeshBasicMaterial({ color: 0xbfeee8, transparent: true, opacity: 0.42, depthWrite: false }))
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, 3.4).translate(3.4, 1.7, 0), ghostMat)
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(9, 0.45, 5).translate(0, 4.9, 0), ghostMat)
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.8, 0.3).translate(-3.8, 2.4, 0), ghostMat)
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.8, 0.3).translate(3.8, 2.4, 0), ghostMat)
    ghost.add(cabin, canopy, postL, postR)
    this.addEntity('ghost', ghost, 3, 2)

    const house = new THREE.Group()
    const houseGeo = merged([cyl(2.4, 4.2, 12, 0, 12, 0, '#efe6d3', 12), cyl(3.1, 4.8, 12, 0, 0, 0, '#c8392a', 12), cyl(1.8, 2.4, 10, 0, 24, 0, '#c8392a', 12), cyl(2.6, 2.6, 0.8, 0, 34, 0, '#13192b', 12), cyl(1.5, 1.5, 3.2, 0, 34.8, 0, '#ffe39a', 10), cone(2.1, 2.4, 0, 38, 0, '#13192b', 10), rock(18, 0, -2, 0, '#1b2a35')])
    house.add(mk(houseGeo))
    const beamGeo = new THREE.ConeGeometry(16, 170, 18, 1, true).rotateZ(-Math.PI / 2).translate(85, 0, 0)
    const beam = new THREE.Mesh(beamGeo, bendable(new THREE.MeshBasicMaterial({ color: 0xffe39a, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })))
    beam.position.y = 36.4
    beam.name = 'beam'
    house.add(beam)
    this.addEntity('lighthouse', house, 0, 0)
  }

  private addEntity(kind: Kind, obj: THREE.Object3D, w: number, l: number) {
    obj.visible = false
    obj.frustumCulled = false
    obj.traverse((o) => (o.frustumCulled = false))
    this.scene.add(obj)
    this.entities.push({ kind, obj, on: false, x: 0, z: 0, w, l, vz: 0, hit: false })
  }

  private spawn(kind: Kind, x: number, z: number, vz = 0) {
    const e = this.entities.find((n) => n.kind === kind && !n.on)
    if (!e) return
    e.on = true
    e.hit = false
    e.x = x
    e.z = z
    e.vz = vz
    e.obj.visible = true
    e.obj.position.set(x, 0, z)
  }

  private buildStreaks() {
    const n = 170
    const positions = new Float32Array(n * 6)
    for (let i = 0; i < n; i++) {
      this.streakData.push({ x: (Math.random() - 0.5) * 70, y: Math.random() * 26, z: -Math.random() * 90, v: 0.6 + Math.random() * 0.8 })
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const line = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }))
    line.frustumCulled = false
    this.scene.add(line)
    return line
  }

  private spawnCar() {
    if (this.car) this.scene.remove(this.car)
    this.car = buildCar(this.look, bendable)
    this.car.traverse((o) => (o.frustumCulled = false))
    this.scene.add(this.car)
    this.applyBlueprint()
  }

  setLook(look: CarLook) {
    const same = look.car === this.look.car && look.paint === this.look.paint && look.stripe === this.look.stripe
    this.look = look
    if (!same) this.spawnCar()
  }
  setLead(lead: LeadId) {
    this.lead = lead
  }
  setCheats(infinite: boolean, blueprint: boolean) {
    this.infinite = infinite
    if (blueprint !== this.blueprint) {
      this.blueprint = blueprint
      this.applyBlueprint()
    }
  }
  private applyBlueprint() {
    this.car?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
      if (m) m.wireframe = this.blueprint
    })
    for (const p of this.props) (p.mesh.material as THREE.MeshLambertMaterial).wireframe = this.blueprint
  }

  private resize() {
    const parent = this.canvas.parentElement!
    const w = parent.clientWidth
    const h = parent.clientHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.fov = w / h < 0.9 ? 82 : 64
    this.camera.updateProjectionMatrix()
  }

  private resetRun() {
    this.dist = 0
    this.km = 0
    this.kmh = 64
    this.x = 0
    this.vx = 0
    this.fuel = 100
    this.livesMax = 3
    this.lives = this.livesMax
    this.valves = 0
    this.chain = 0
    this.invuln = 0
    this.shake = 0
    this.region = 0
    this.displayRegion = 0
    this.nextSpawn = 140
    this.nextFuel = 620
    this.ghostDone = false
    this.houseDone = false
    this.reason = ''
    this.lostWhy = ''
    for (const e of this.entities) {
      e.on = false
      e.obj.visible = false
    }
  }

  begin() {
    this.resetRun()
    this.phase = 'count'
    this.count = 3.2
    audio.engineStart()
    this.pushHud(true)
  }
  pause() {
    if (this.phase === 'run' || this.phase === 'count') {
      this.phase = 'paused'
      audio.engineStop()
      this.pushHud(true)
    }
  }
  resume() {
    if (this.phase !== 'paused') return
    this.phase = 'run'
    audio.engineStart()
    this.last = performance.now()
    this.pushHud(true)
  }
  quit() {
    this.phase = 'attract'
    audio.engineStop()
    this.resetRun()
    this.kmh = 148
    this.pushHud(true)
  }

  setVisible(on: boolean) {
    if (on === this.visible) return
    this.visible = on
    cancelAnimationFrame(this.raf)
    if (on) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.frame)
    } else if (this.phase === 'run' || this.phase === 'count') this.pause()
  }

  /** Development helper used to test the later regions without driving there. */
  debugJump(km: number) {
    this.km = km
    this.dist = km * 12.43
  }

  private frame = (now: number) => {
    const dt = THREE.MathUtils.clamp((now - this.last) / 1000, 0, 0.05)
    this.last = now
    this.step(dt)
    this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.frame)
  }

  private step(dt: number) {
    this.time += dt
    const running = this.phase === 'run'
    if (this.phase === 'count') {
      this.count -= dt
      if (this.count <= 0) {
        this.phase = 'run'
        this.kmh = 113
      }
      this.pushHud(true)
    }

    if (this.phase === 'attract') this.attract(dt)
    else if (running) this.drive(dt)
    else if (this.phase === 'win' || this.phase === 'over') this.kmh = Math.max(0, this.kmh - dt * (this.phase === 'win' ? 42 : 113))

    const paused = this.phase === 'paused'
    const vel = paused ? 0 : this.kmh * 0.261
    if (!paused) this.dist += vel * dt
    this.bend()
    this.world(dt, vel)
    this.paletteStep(dt)
    this.camStep(dt)

    this.hudTimer -= dt
    if (this.hudTimer <= 0) this.pushHud(false)
    if (running) audio.engineSet(this.kmh / CARS[this.look.car].top)
  }

  private attract(dt: number) {
    this.attractTime += dt
    this.kmh += (148 - this.kmh) * Math.min(1, dt)
    this.x = Math.sin(this.attractTime * 0.5) * 3.6
    this.vx = Math.cos(this.attractTime * 0.5) * 1.8
    this.region = Math.floor(this.attractTime / 9) % REGIONS.length
  }

  private drive(dt: number) {
    const spec = CARS[this.look.car]
    const offroad = Math.abs(this.x) > ROAD + 0.5
    let target = spec.top * 0.84
    if (this.input.up) target = spec.top
    if (this.input.down) target = spec.top * 0.42
    if (offroad) target *= 0.72
    if (this.fuel <= 0) target = 0
    this.kmh += (target - this.kmh) * Math.min(1, dt * (target > this.kmh ? 0.85 : 2.1))

    const axis = this.input.axis || Number(this.input.right) - Number(this.input.left)
    const reach = 25 * spec.grip * Math.min(1, 0.45 + this.kmh / 177)
    this.vx += (axis * reach - this.vx) * Math.min(1, dt * 7.5 * spec.grip)
    const push = -bendUniform.value.x * this.kmh * 2.11
    this.x = THREE.MathUtils.clamp(this.x + (this.vx + push) * dt, -SHOULDER + 1.1, SHOULDER - 1.1)

    this.km += this.kmh * 0.02 * dt
    if (!this.infinite) this.fuel = Math.max(0, this.fuel - (dt * (100 / 58) * (this.input.up ? 1.22 : 1)) / spec.tank)
    this.invuln = Math.max(0, this.invuln - dt)

    const next = regionAt(this.km)
    if (next !== this.displayRegion) {
      this.displayRegion = next
      this.region = next
      this.events.region(next)
    }
    this.region = next
    this.director()

    if (this.km >= FINISH) return this.finish(true, 'Six o’clock. The signal is safe.')
    if (this.fuel <= 0 && this.kmh < 13) {
      this.fuel = 60
      this.kmh = 64
      this.loseLife('The tank ran dry', 'The tank ran dry on your last life.')
    }
  }

  private director() {
    const level = this.km / FINISH
    if (this.dist > this.nextSpawn) {
      this.nextSpawn = this.dist + THREE.MathUtils.lerp(70, 44, level) * (0.85 + Math.random() * 0.45)
      this.pattern(level)
    }
    if (this.dist > this.nextFuel) {
      this.nextFuel = this.dist + 560 + Math.random() * 180
      this.spawn('fuel', this.lane(), SPAWN_Z)
    }
    if (!this.ghostDone && this.km >= 267) {
      this.ghostDone = true
      this.spawn('ghost', 8.4, SPAWN_Z)
    }
    if (!this.houseDone && this.km >= 557) {
      this.houseDone = true
      this.spawn('lighthouse', -46, SPAWN_Z)
    }
  }

  private lane() {
    return [-5.25, -1.75, 1.75, 5.25][Math.floor(Math.random() * 4)]
  }

  private pattern(level: number) {
    const roll = Math.random()
    if (roll < 0.36) {
      const x = this.lane()
      const weave = Math.random() < 0.5 ? 0 : 1.7
      for (let i = 0; i < 6; i++) this.spawn('valve', THREE.MathUtils.clamp(x + Math.sin(i * 0.9) * weave, -6, 6), SPAWN_Z - i * 7)
    } else if (roll < 0.6) {
      const gap = Math.floor(Math.random() * 4)
      const blocked = level > 0.45 && Math.random() < 0.55 ? 2 : 1
      const lanes = [0, 1, 2, 3].filter((l) => l !== gap).sort(() => Math.random() - 0.5).slice(0, blocked)
      for (const l of lanes) this.spawn('barrier', -5.25 + l * 3.5, SPAWN_Z)
    } else if (roll < 0.84) {
      this.spawn('truck', this.lane(), SPAWN_Z, 22 + Math.random() * 10)
    } else {
      this.spawn('cones', this.lane(), SPAWN_Z)
    }
  }

  private world(dt: number, vel: number) {
    this.groundTex.offset.y += (vel * dt * 8) / 470
    this.lineTex.offset.y += (vel * dt * 18) / 470

    const matrix = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()
    for (const prop of this.props) {
      prop.items.forEach((it, i) => {
        it.z += vel * dt
        if (it.z > 26) {
          it.z += SPAWN_Z - 40 - Math.random() * 18
          this.seat(prop, it)
        }
        q.setFromAxisAngle(up, it.ry)
        pos.set(it.x, 0, it.z)
        scale.setScalar(it.on ? it.s : 0.0001)
        matrix.compose(pos, q, scale)
        prop.mesh.setMatrixAt(i, matrix)
      })
      prop.mesh.instanceMatrix.needsUpdate = true
    }

    const magnet = this.lead === 'ines' ? 5.4 : 2.7
    for (const e of this.entities) {
      if (!e.on) continue
      e.z += (vel - e.vz) * dt
      if (e.kind === 'valve') {
        const near = Math.abs(e.z) < magnet + 3 && Math.abs(e.x - this.x) < magnet
        if (near && this.phase === 'run') {
          e.x += (this.x - e.x) * Math.min(1, dt * 11)
          e.z += -e.z * Math.min(1, dt * 11)
        }
        e.obj.children[0].rotation.y += dt * 3
        e.obj.children[0].position.y = 1.2 + Math.sin(this.time * 3 + e.z) * 0.18
      }
      if (e.kind === 'fuel') e.obj.rotation.y += dt * 2
      if (e.kind === 'lighthouse') e.obj.getObjectByName('beam')!.rotation.y = this.time * 0.8
      e.obj.position.set(e.x, 0, e.z)
      if (this.phase === 'run') this.collide(e)
      if (e.z > 30) {
        e.on = false
        e.obj.visible = false
      }
    }

    const strokes = this.streaks.geometry.attributes.position as THREE.BufferAttribute
    const r = this.region
    const fall = [36, 0.3, -4, 0.5][r]
    const len = [0.9, 0.05, 0.14, 0.05][r]
    const lean = [0.2, 0.6, 1.5, 0.4][r]
    this.streakData.forEach((s, i) => {
      s.z += vel * dt * s.v
      s.y -= fall * dt * s.v
      s.x += Math.sin(this.time + i) * dt * lean
      if (s.z > 8 || s.y < 0 || s.y > 28) {
        s.z = -70 - Math.random() * 50
        s.y = r === 2 ? Math.random() * 7 : Math.random() * 28
        s.x = this.x + (Math.random() - 0.5) * 70
      }
      strokes.setXYZ(i * 2, s.x, s.y, s.z)
      strokes.setXYZ(i * 2 + 1, s.x + 0.08, s.y + len, s.z + vel * 0.012)
    })
    strokes.needsUpdate = true
    const col = this.streaks.material as THREE.LineBasicMaterial
    col.color.set(['#c8d6ee', '#ffffff', '#ffb24d', '#cfe4e6'][r])
    col.opacity = [0.5, 0.2, 0.95, 0.3][r]

    const wheels = this.car.userData.wheels as THREE.Object3D[]
    wheels.forEach((w) => (w.rotation.x -= vel * dt * 2.6))
    this.car.position.x = this.x
    this.car.position.y = Math.sin(this.time * 19) * 0.012 * Math.min(1, this.kmh / 129)
    this.car.rotation.y = THREE.MathUtils.lerp(this.car.rotation.y, -this.vx * 0.016, Math.min(1, dt * 9))
    this.car.rotation.z = THREE.MathUtils.lerp(this.car.rotation.z, -this.vx * 0.006, Math.min(1, dt * 8))
    this.car.visible = this.invuln <= 0 || Math.floor(this.time * 18) % 2 === 0
    this.headlights.position.x = this.x
  }

  private collide(e: Entity) {
    if (e.hit) return
    const dz = Math.abs(e.z)
    const dx = Math.abs(e.x - this.x)
    if (e.kind === 'ghost') {
      if (dz < 3 && dx < 3) {
        e.hit = true
        this.events.ghost()
      }
      return
    }
    if (e.kind === 'lighthouse') return
    if (dz > e.l + 2.1 || dx > e.w + 0.92) return
    e.hit = true
    if (e.kind === 'valve') {
      e.on = false
      e.obj.visible = false
      this.valves++
      this.chain++
      audio.pickup(this.chain)
      return
    }
    if (e.kind === 'fuel') {
      e.on = false
      e.obj.visible = false
      this.fuel = Math.min(100, this.fuel + 38)
      audio.fuel()
      return
    }
    if (this.invuln > 0) return
    this.kmh *= CARS[this.look.car].tough
    if (e.kind !== 'truck') {
      e.on = false
      e.obj.visible = false
    }
    this.loseLife('You crashed', 'That crash took your last life.')
  }

  private loseLife(why: string, lastWords: string) {
    this.lives--
    this.lostWhy = why
    this.chain = 0
    this.invuln = this.lead === 'dov' ? 3.6 : 1.8
    this.shake = 0.8
    audio.crash()
    this.pushHud(true)
    if (this.lives <= 0) this.finish(false, lastWords)
  }

  private finish(won: boolean, reason: string) {
    if (this.phase !== 'run') return
    this.phase = won ? 'win' : 'over'
    this.reason = reason
    audio.engineStop()
    won ? audio.win() : audio.fail()
    this.events.end(won, Math.min(this.km, FINISH), this.valves)
    this.pushHud(true)
  }

  private bend() {
    const d = this.dist
    const x = 0.0013 * Math.sin(d * 0.0029) + 0.0008 * Math.sin(d * 0.0077 + 1.3)
    const y = -0.00032 + 0.00042 * Math.sin(d * 0.0043 + 2)
    bendUniform.value.set(x, y)
  }

  private paletteStep(dt: number) {
    const p = PALETTES[this.region]
    const k = Math.min(1, dt * 0.9)
    const pal = this.pal
    for (const key of ['top', 'mid', 'hor', 'sun', 'ground', 'road', 'line', 'hemi', 'low', 'dir'] as const) {
      pal[key].lerp(tmp.set(p[key]), k)
    }
    pal.near += (p.near - pal.near) * k
    pal.far += (p.far - pal.far) * k
    pal.night += (p.night - pal.night) * k
    pal.sunDir.lerp(tmpV.set(...p.sunDir).normalize(), k)
    this.fog.color.copy(pal.hor)
    this.fog.near = pal.near
    this.fog.far = pal.far
    this.skyMat.uniforms.night.value = pal.night
    this.groundMat.color.copy(pal.ground)
    this.roadMat.color.copy(pal.road)
    this.lineMat.color.copy(pal.line)
    this.hemi.color.copy(pal.hemi)
    this.hemi.groundColor.copy(pal.low)
    this.sun.color.copy(pal.dir)
    this.sun.intensity = 2 - pal.night * 1.1
    ;(this.headlights.material as THREE.MeshBasicMaterial).opacity = pal.night * 0.5
  }

  private camStep(dt: number) {
    const wide = this.camera.aspect < 0.9
    const k = Math.min(1, dt * 5)
    const finale = this.phase === 'win' || this.phase === 'over'
    const orbit = finale ? this.time * 0.35 : 0
    const tx = finale ? this.x + Math.sin(orbit) * 9 : this.x * 0.62
    const tz = finale ? Math.cos(orbit) * 9 : wide ? 10 : 8.8
    const ty = finale ? 3.4 : wide ? 4.1 : 3.5
    this.camera.position.x += (tx - this.camera.position.x) * k
    this.camera.position.y += (ty - this.camera.position.y) * k
    this.camera.position.z += (tz - this.camera.position.z) * k
    this.shake = Math.max(0, this.shake - dt * 1.7)
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.6
    }
    if (finale) this.camera.lookAt(this.x, 1, 0)
    else this.camera.lookAt(this.x * 0.78, 1.25, -13)
    const speedFov = (wide ? 82 : 64) + Math.min(10, this.kmh / 26)
    this.camera.fov += (speedFov - this.camera.fov) * Math.min(1, dt * 2)
    this.camera.updateProjectionMatrix()
  }

  private pushHud(force: boolean) {
    this.hudTimer = 0.1
    if (!force && this.phase !== 'run') return
    this.events.hud({
      phase: this.phase, kmh: Math.round(this.kmh), km: this.km, fuel: this.fuel, lives: this.lives, livesMax: this.livesMax,
      valves: this.valves, region: this.displayRegion, count: Math.ceil(this.count), reason: this.reason, lostWhy: this.lostWhy,
    })
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    audio.engineStop()
    this.renderer.dispose()
  }
}

const tmp = new THREE.Color()
const tmpV = new THREE.Vector3()
