import * as THREE from 'three'
import { audio } from '../audio'
import type { LeadId } from '../content'
import { LEVELS, type Level, type LevelSecret } from '../levels'
import { VEHICLE_ORDER, VEHICLES, type Stats } from '../vehicles'
import { buildCar, type CarLook } from './car'
import { bendUniform, bendable, box, cone, cyl, flatVertex, merged } from './kit'
import { BAY_X, WALL_Z, landmarkGroup, pitGroup, propGeometry, relicGeometry, trafficModels } from './props'

export type Phase = 'attract' | 'count' | 'run' | 'park' | 'paused' | 'over' | 'win'
export type ParkHud = { metres: number; aligned: boolean; slow: boolean; reverse: boolean }
export type DriveHud = {
  phase: Phase; level: number; kmh: number; km: number; length: number; fuel: number; lives: number; livesMax: number
  coins: number; region: number; count: number; reason: string; lostWhy: string; boost: boolean; park: ParkHud | null
}
export type DriveEvents = {
  hud: (h: DriveHud) => void
  region: (index: number) => void
  park: () => void
  secret: (id: string) => void
  end: (result: { won: boolean; level: number; km: number; coins: number; livesLost: number }) => void
}
export type Cheats = { infinite: boolean; blueprint: boolean; ironhide: boolean }

const ROAD = 7
const SHOULDER = 10.4
const SPAWN_Z = -340
const PARK_KM = 1.6
const KMH_TO_UNITS = 0.261

type Kind = 'traffic' | 'barrier' | 'cones' | 'coin' | 'fuel' | 'relic' | 'landmark' | 'pit'
type Entity = { kind: Kind; obj: THREE.Object3D; on: boolean; x: number; z: number; w: number; l: number; vz: number; hit: boolean; speed?: [number, number]; secret?: LevelSecret }
type Prop = { mesh: THREE.InstancedMesh; region: number; items: { x: number; z: number; s: number; ry: number; on: boolean }[]; min: number; max: number; spread: [number, number] }
type PaletteState = { [K in 'top' | 'mid' | 'hor' | 'sun' | 'ground' | 'road' | 'line' | 'hemi' | 'low' | 'dir' | 'aurora']: THREE.Color } & { near: number; far: number; night: number; auroraLevel: number; sunDir: THREE.Vector3 }

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
  private stats: Stats
  private lead: LeadId
  private level: Level
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
  private pal: PaletteState
  private flat = bendable(flatVertex())
  private ghostMat = bendable(new THREE.MeshBasicMaterial({ color: 0x9ff3e6, transparent: true, opacity: 0.46, depthWrite: false }))
  private glowMat = bendable(new THREE.MeshBasicMaterial({ color: 0xffe39a }))
  private beamMat = bendable(new THREE.MeshBasicMaterial({ color: 0xffe39a, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }))
  private bayMat = bendable(new THREE.MeshBasicMaterial({ color: 0xe2a32a, transparent: true, opacity: 0.55, depthWrite: false }))

  private props: Prop[] = []
  private entities: Entity[] = []
  private streaks: THREE.LineSegments
  private streakData: { x: number; y: number; z: number; v: number }[] = []

  phase: Phase = 'attract'
  private resumeTo: Phase = 'run'
  input = { left: false, right: false, up: false, down: false, axis: 0 }
  private dist = 0
  private km = 0
  private kmh = 148
  private x = 0
  private vx = 0
  private fuel = 100
  private lives = 3
  private livesMax = 3
  private coins = 0
  private chain = 0
  private invuln = 0
  private shake = 0
  private region = 0
  private displayRegion = 0
  private count = 0
  private nextSpawn = 0
  private nextFuel = 500
  private spawnedSecrets = new Set<string>()
  private landmarkDone = false
  private attractTime = 0
  private reason = ''
  private lostWhy = ''
  private hudTimer = 0
  private cheats: Cheats = { infinite: false, blueprint: false, ironhide: false }
  private time = 0
  private boosting = false
  private straight = 1
  private parkTimer = 0
  private park: ParkHud | null = null
  private glowPulse = 0
  private parkOffset = { dx: 0, dz: 0 }

  constructor(private canvas: HTMLCanvasElement, look: CarLook, stats: Stats, lead: LeadId, level: number, private events: DriveEvents) {
    this.look = look
    this.stats = stats
    this.lead = lead
    this.level = LEVELS[level] ?? LEVELS[0]
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))

    const p = this.level.regions[0].palette
    const c = (hex: string) => new THREE.Color(hex)
    this.pal = {
      top: c(p.top), mid: c(p.mid), hor: c(p.hor), sun: c(p.sun), ground: c(p.ground), road: c(p.road), line: c(p.line),
      hemi: c(p.hemi), low: c(p.low), dir: c(p.dir), aurora: c(p.auroraColor ?? '#5cffb0'),
      near: p.near, far: p.far, night: p.night, auroraLevel: p.aurora ?? 0, sunDir: new THREE.Vector3(...p.sunDir).normalize(),
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
        cTop: { value: this.pal.top }, cMid: { value: this.pal.mid }, cHor: { value: this.pal.hor }, cSun: { value: this.pal.sun },
        sunDir: { value: this.pal.sunDir }, night: { value: p.night }, aurora: { value: 0 }, cAurora: { value: this.pal.aurora }, uTime: { value: 0 },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vDir; uniform vec3 cTop, cMid, cHor, cSun, sunDir, cAurora; uniform float night, aurora, uTime;
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
          float curtain = smoothstep(0.1, 0.26, h) * (1.0 - smoothstep(0.42, 0.72, h));
          float wave = sin(atan(d.z, d.x) * 9.0 + sin(d.x * 4.0 + uTime * 0.4) * 2.0 + uTime * 0.25);
          c += cAurora * curtain * (0.35 + 0.65 * max(0.0, wave)) * aurora * 0.6;
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

  /** Builds the roadside scenery for every region of the current level. */
  private buildProps() {
    for (const p of this.props) {
      this.scene.remove(p.mesh)
      p.mesh.geometry.dispose()
    }
    this.props = []
    this.level.regions.forEach((region, r) => {
      for (const spec of region.props) {
        const mesh = new THREE.InstancedMesh(propGeometry(spec.kind), this.flat, spec.count)
        mesh.frustumCulled = false
        const prop: Prop = { mesh, region: r, items: [], min: spec.min, max: spec.max, spread: spec.scale }
        prop.items = Array.from({ length: spec.count }, (_, i) => {
          const it = { x: 0, z: 0, s: 1, ry: 0, on: false }
          this.seat(prop, it)
          it.z = 20 + SPAWN_Z * (i / spec.count) + Math.random() * 12
          return it
        })
        this.props.push(prop)
        this.scene.add(mesh)
      }
    })
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
    for (const m of trafficModels()) this.addEntity('traffic', new THREE.Mesh(m.geo, this.flat), m.w, m.l, m.speed)
    const carIds = VEHICLE_ORDER.filter((id) => VEHICLES[id].kind === 'Car' || id === 'mule')
    const paints = ['#d63a25', '#eee7d8', '#1f4f8f', '#1f5c47', '#e0a226', '#1b1e29', '#7a3a5a', '#b9c6d2']
    for (let i = 0; i < 6; i++) {
      const id = carIds[i % carIds.length]
      const car = buildCar({ car: id, paint: paints[(i * 3) % paints.length], stripe: i % 3 === 0 ? 'rally' : 'none' }, bendable)
      const p = VEHICLES[id].profile
      this.addEntity('traffic', car, p.width / 2 + 0.05, (p.body[p.body.length - 1][0] - p.body[0][0]) / 2, [26, 36])
    }

    const parts = [box(6.4, 0.2, 0.3, 0, 1.25, 0, '#efe6d3'), box(0.25, 1.3, 0.25, -2.8, 0.65, 0, '#232636'), box(0.25, 1.3, 0.25, 2.8, 0.65, 0, '#232636'), box(1, 0.08, 1.4, -2.8, 0.04, 0, '#232636'), box(1, 0.08, 1.4, 2.8, 0.04, 0, '#232636')]
    for (let i = 0; i < 4; i++) parts.push(box(0.75, 0.22, 0.32, -2.3 + i * 1.55, 1.25, 0, '#e0412a'))
    parts.push(cyl(0.16, 0.16, 0.3, -2.8, 1.35, 0, '#ffb12a'), cyl(0.16, 0.16, 0.3, 2.8, 1.35, 0, '#ffb12a'))
    const barrierGeo = merged(parts)
    for (let i = 0; i < 8; i++) this.addEntity('barrier', new THREE.Mesh(barrierGeo, this.flat), 3.2, 0.8)

    const coneParts: THREE.BufferGeometry[] = []
    for (const [x, z] of [[-1.5, 0], [0, -1.2], [1.5, 0], [-0.7, 1.3], [0.8, 1.2]]) {
      coneParts.push(box(0.8, 0.08, 0.8, x, 0.04, z, '#232636'), cone(0.32, 1, x, 0.06, z, '#ee6a2a', 8), cyl(0.2, 0.25, 0.14, x, 0.46, z, '#f7f1e3', 8))
    }
    const conesGeo = merged(coneParts)
    for (let i = 0; i < 5; i++) this.addEntity('cones', new THREE.Mesh(conesGeo, this.flat), 2, 1.8)

    const gold = bendable(new THREE.MeshBasicMaterial({ color: 0xf5c533 }))
    const goldDark = bendable(new THREE.MeshBasicMaterial({ color: 0xc98e14 }))
    const rim = new THREE.CylinderGeometry(0.62, 0.62, 0.14, 24).rotateX(Math.PI / 2)
    const face = new THREE.CylinderGeometry(0.4, 0.4, 0.17, 24).rotateX(Math.PI / 2)
    for (let i = 0; i < 30; i++) {
      const spin = new THREE.Group()
      spin.add(new THREE.Mesh(rim, gold), new THREE.Mesh(face, goldDark))
      spin.position.y = 1.15
      const holder = new THREE.Group()
      holder.add(spin)
      this.addEntity('coin', holder, 0.6, 0.6)
    }

    const fuelGeo = merged([box(1.1, 1.4, 0.55, 0, 1.1, 0, '#e0412a'), box(0.5, 0.26, 0.2, 0.2, 1.92, 0, '#f7f1e3'), box(0.8, 0.14, 0.58, 0, 1.1, 0, '#f7f1e3')])
    for (let i = 0; i < 3; i++) this.addEntity('fuel', new THREE.Mesh(fuelGeo, this.flat), 1.1, 1.1)

    this.buildLevelEntities()
  }

  /** Relics, the landmark and the pit stop change with every level. */
  private buildLevelEntities() {
    for (const e of this.entities.filter((n) => n.kind === 'relic' || n.kind === 'landmark' || n.kind === 'pit')) this.scene.remove(e.obj)
    this.entities = this.entities.filter((n) => n.kind !== 'relic' && n.kind !== 'landmark' && n.kind !== 'pit')
    for (const s of this.level.secrets) {
      if (s.type !== 'relic' || !s.model) continue
      const mesh = new THREE.Mesh(relicGeometry(s.model), this.ghostMat)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.08, 6, 30).rotateX(Math.PI / 2).translate(0, 0.08, 0), this.ghostMat)
      const g = new THREE.Group()
      g.add(mesh, ring)
      this.addEntity('relic', g, 3, 3)
      this.entities[this.entities.length - 1].secret = s
    }
    this.addEntity('landmark', landmarkGroup(this.level.landmark, this.flat, this.glowMat, this.beamMat), 0, 0)
    this.addEntity('pit', pitGroup(this.flat, this.bayMat), 0, 0)
  }

  private addEntity(kind: Kind, obj: THREE.Object3D, w: number, l: number, speed?: [number, number]) {
    obj.visible = false
    obj.traverse((o) => (o.frustumCulled = false))
    this.scene.add(obj)
    this.entities.push({ kind, obj, on: false, x: 0, z: 0, w, l, vz: 0, hit: false, speed })
  }

  private spawn(kind: Kind, x: number, z: number, vz = 0, pick?: (e: Entity) => boolean) {
    const free = this.entities.filter((n) => n.kind === kind && !n.on && (!pick || pick(n)))
    const e = free[Math.floor(Math.random() * free.length)]
    if (!e) return undefined
    e.on = true
    e.hit = false
    e.x = x
    e.z = z
    e.vz = vz || (e.speed ? e.speed[0] + Math.random() * (e.speed[1] - e.speed[0]) : 0)
    e.obj.visible = true
    e.obj.position.set(x, 0, z)
    return e
  }

  private buildStreaks() {
    const n = 170
    const positions = new Float32Array(n * 6)
    for (let i = 0; i < n; i++) this.streakData.push({ x: (Math.random() - 0.5) * 70, y: Math.random() * 26, z: -Math.random() * 90, v: 0.6 + Math.random() * 0.8 })
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
  setStats(stats: Stats) {
    this.stats = stats
  }
  setLead(lead: LeadId) {
    this.lead = lead
  }
  setLevel(n: number) {
    const next = LEVELS[n]
    if (!next || next === this.level || (this.phase !== 'attract' && this.phase !== 'over' && this.phase !== 'win')) return
    this.level = next
    this.region = 0
    this.attractTime = 0
    this.buildProps()
    this.buildLevelEntities()
    this.applyBlueprint()
    this.snapPalette()
  }
  setCheats(cheats: Cheats) {
    const changed = cheats.blueprint !== this.cheats.blueprint
    this.cheats = cheats
    if (changed) this.applyBlueprint()
  }
  private applyBlueprint() {
    this.car?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
      if (m) m.wireframe = this.cheats.blueprint
    })
    this.flat.wireframe = this.cheats.blueprint
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
    this.lives = 3
    this.coins = 0
    this.chain = 0
    this.invuln = 0
    this.shake = 0
    this.region = 0
    this.displayRegion = 0
    this.nextSpawn = 140
    this.nextFuel = 620
    this.spawnedSecrets.clear()
    this.landmarkDone = false
    this.reason = ''
    this.lostWhy = ''
    this.boosting = false
    this.straight = 1
    this.parkTimer = 0
    this.park = null
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
    if (this.phase === 'run' || this.phase === 'count' || this.phase === 'park') {
      this.resumeTo = this.phase === 'count' ? 'run' : this.phase
      this.phase = 'paused'
      audio.engineStop()
      this.pushHud(true)
    }
  }
  resume() {
    if (this.phase !== 'paused') return
    this.phase = this.resumeTo
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

  /** Called when the player sounds the horn. Honking at the level's landmark is one of its secrets. */
  honk() {
    if (this.phase !== 'run' && this.phase !== 'park') return
    const mark = this.entities.find((e) => e.kind === 'landmark' && e.on)
    if (mark && mark.z > -320 && mark.z < 30) {
      const secret = this.level.secrets.find((s) => s.type === 'honk')
      if (secret) this.events.secret(secret.id)
      this.glowPulse = 2.5
    }
  }

  setVisible(on: boolean) {
    if (on === this.visible) return
    this.visible = on
    cancelAnimationFrame(this.raf)
    if (on) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.frame)
    } else if (this.phase === 'run' || this.phase === 'count' || this.phase === 'park') this.pause()
  }

  /** Development helper used to test later parts of a level without driving there. */
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
    this.skyMat.uniforms.uTime.value = this.time
    const driving = this.phase === 'run' || this.phase === 'park'
    if (this.phase === 'count') {
      this.count -= dt
      if (this.count <= 0) {
        this.phase = 'run'
        this.kmh = 113
      }
      this.pushHud(true)
    }

    if (this.phase === 'attract') this.attract(dt)
    else if (driving) this.drive(dt)
    else if (this.phase === 'win' || this.phase === 'over') this.kmh = Math.max(0, this.kmh - dt * (this.phase === 'win' ? 42 : 113))

    const paused = this.phase === 'paused'
    const vel = paused ? 0 : this.kmh * KMH_TO_UNITS
    if (!paused) this.dist += vel * dt
    this.bend(dt)
    this.world(dt, vel)
    this.paletteStep(dt)
    this.camStep(dt)

    this.hudTimer -= dt
    if (this.hudTimer <= 0) this.pushHud(false)
    if (driving) audio.engineSet(Math.abs(this.kmh) / this.stats.top)
  }

  private attract(dt: number) {
    this.attractTime += dt
    this.kmh += (148 - this.kmh) * Math.min(1, dt)
    this.x = Math.sin(this.attractTime * 0.5) * 3.6
    this.vx = Math.cos(this.attractTime * 0.5) * 1.8
    this.region = Math.floor(this.attractTime / 9) % this.level.regions.length
  }

  private drive(dt: number) {
    const s = this.stats
    const parking = this.phase === 'park'
    const offroad = Math.abs(this.x) > ROAD + 0.5 && !s.offroad
    let target: number
    let rate: number
    if (parking) {
      if (this.input.down) target = this.kmh > 2 ? 0 : -22
      else if (this.input.up) target = 90
      else target = 0
      rate = this.input.down ? 3.2 : this.input.up ? 1.4 : 0.7
    } else {
      target = s.top * 0.76
      if (this.input.up && this.fuel > 0) target = s.top
      if (this.input.down) target = s.top * 0.4
      if (this.fuel <= 0) target = 0
      rate = target > this.kmh ? 0.85 : 2.1
    }
    if (offroad) target *= 0.72
    this.kmh += (target - this.kmh) * Math.min(1, dt * rate)
    this.boosting = !parking && this.input.up && this.fuel > 0

    const axis = this.input.axis || Number(this.input.right) - Number(this.input.left)
    const reach = 25 * s.grip * THREE.MathUtils.clamp(0.3 + Math.abs(this.kmh) / 150, 0.3, 1)
    this.vx += (axis * reach - this.vx) * Math.min(1, dt * 7.5 * s.grip)
    const push = parking ? 0 : -bendUniform.value.x * this.kmh * 2.11
    this.x = THREE.MathUtils.clamp(this.x + (this.vx + push) * dt, -SHOULDER + 1.1, SHOULDER - 1.1)

    this.km = Math.max(0, this.km + this.kmh * 0.02 * dt)
    if (!this.cheats.infinite && !parking) {
      // Boost burns fuel three times faster; Ines's pace notes save a quarter of that.
      const burn = this.boosting ? (this.lead === 'ines' ? 2.4 : 3.2) : 1
      this.fuel = Math.max(0, this.fuel - (dt * (100 / 62) * burn) / s.tank)
    }
    this.invuln = Math.max(0, this.invuln - dt)

    const next = this.regionAt(this.km)
    if (next !== this.displayRegion) {
      this.displayRegion = next
      this.events.region(next)
    }
    this.region = next

    if (parking) return this.parkStep(dt)
    this.director()
    if (this.km >= this.level.length - PARK_KM) return this.startPark()
    if (this.fuel <= 0 && this.kmh < 13) {
      this.fuel = 60
      this.kmh = 64
      this.loseLife('The tank ran dry', 'The tank ran dry on your last life.')
    }
  }

  private regionAt(km: number) {
    const r = this.level.regions
    for (let i = r.length - 1; i >= 0; i--) if (km >= r[i].from) return i
    return 0
  }

  private director() {
    const L = this.level
    const progress = this.km / L.length
    if (this.dist > this.nextSpawn) {
      this.nextSpawn = this.dist + THREE.MathUtils.lerp(70, 44, progress) * L.density * (0.85 + Math.random() * 0.45)
      this.pattern(progress)
    }
    if (this.dist > this.nextFuel) {
      this.nextFuel = this.dist + 560 + Math.random() * 180
      this.spawn('fuel', this.lane(), SPAWN_Z)
    }
    for (const s of L.secrets) {
      if (s.type !== 'relic' || s.km === undefined || this.spawnedSecrets.has(s.id) || this.km < s.km - 25) continue
      this.spawnedSecrets.add(s.id)
      this.spawn('relic', (s.side ?? 1) * 8.6, SPAWN_Z, 0, (e) => e.secret?.id === s.id)
    }
    if (!this.landmarkDone && this.km >= L.length - 26) {
      this.landmarkDone = true
      this.spawn('landmark', -46, SPAWN_Z)
    }
  }

  private lane() {
    return [-5.25, -1.75, 1.75, 5.25][Math.floor(Math.random() * 4)]
  }

  private pattern(progress: number) {
    const hard = (1 - this.level.density) + progress * 0.5
    const roll = Math.random()
    if (roll < 0.34) {
      const x = this.lane()
      const weave = Math.random() < 0.5 ? 0 : 1.7
      for (let i = 0; i < 6; i++) this.spawn('coin', THREE.MathUtils.clamp(x + Math.sin(i * 0.9) * weave, -6, 6), SPAWN_Z - i * 7)
    } else if (roll < 0.58) {
      const gap = Math.floor(Math.random() * 4)
      const blocked = Math.random() < 0.15 + hard * 0.6 ? 2 : 1
      const lanes = [0, 1, 2, 3].filter((l) => l !== gap).sort(() => Math.random() - 0.5).slice(0, blocked)
      for (const l of lanes) this.spawn('barrier', -5.25 + l * 3.5, SPAWN_Z)
    } else if (roll < 0.86) {
      this.spawn('traffic', this.lane(), SPAWN_Z)
      if (Math.random() < hard * 0.5) this.spawn('traffic', this.lane(), SPAWN_Z - 30)
    } else {
      this.spawn('cones', this.lane(), SPAWN_Z)
    }
  }

  private startPark() {
    this.phase = 'park'
    this.parkTimer = 0
    this.boosting = false
    for (const e of this.entities) {
      if (e.on && e.kind !== 'landmark' && e.z < -30) {
        e.on = false
        e.obj.visible = false
      }
    }
    this.spawn('pit', 0, -170)
    this.events.park()
    this.pushHud(true)
  }

  private parkStep(dt: number) {
    const pit = this.entities.find((e) => e.kind === 'pit' && e.on)
    if (!pit) return
    const dz = pit.z
    const dx = this.x - BAY_X
    const aligned = Math.abs(dz) < 1.4 && Math.abs(dx) < 0.9
    const slow = Math.abs(this.kmh) < 4
    this.park = { metres: Math.max(0, Math.round(-dz)), aligned, slow, reverse: this.kmh < -1 }
    this.bayMat.color.set(aligned ? 0x3ddc84 : 0xe2a32a)
    this.bayMat.opacity = aligned ? 0.75 : 0.45 + Math.sin(this.time * 6) * 0.15
    if (aligned && slow) {
      this.parkTimer += dt
      if (this.parkTimer > 0.7) {
        this.parkOffset = { dx, dz }
        this.finish(true, `Parked at the ${this.level.pitStop}.`)
      }
    } else this.parkTimer = 0
    if (pit.z + WALL_Z > -2.4 && this.kmh > 0) {
      this.kmh = 0
      pit.z -= 6
      this.loseLife('You hit the pit wall', 'You hit the pit wall on your last life.', true)
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

    this.glowPulse = Math.max(0, this.glowPulse - dt)
    const glow = 1 + Math.sin(this.time * 10) * 0.5 * Math.min(1, this.glowPulse)
    this.glowMat.color.setRGB(glow, glow * 0.89, glow * 0.6)
    this.ghostMat.opacity = 0.36 + Math.sin(this.time * 3) * 0.12

    for (const e of this.entities) {
      if (!e.on) continue
      e.z += (vel - e.vz) * dt
      if (e.kind === 'coin') e.obj.children[0].rotation.y += dt * 4
      if (e.kind === 'fuel') e.obj.rotation.y += dt * 2
      if (e.kind === 'relic') e.obj.rotation.y = Math.sin(this.time) * 0.15
      if (e.kind === 'landmark') {
        const beam = e.obj.getObjectByName('beam')
        if (beam) beam.rotation.y = this.time * 0.8
      }
      e.obj.position.set(e.x, 0, e.z)
      if (this.phase === 'run' || this.phase === 'park') this.collide(e)
      if (e.z > 30 && e.kind !== 'pit') {
        e.on = false
        e.obj.visible = false
      }
    }

    const strokes = this.streaks.geometry.attributes.position as THREE.BufferAttribute
    const pt = this.level.regions[this.region].particles
    this.streakData.forEach((s, i) => {
      s.z += vel * dt * s.v
      s.y -= pt.fall * dt * s.v
      s.x += Math.sin(this.time + i) * dt * pt.lean + (pt.lean > 6 ? -pt.lean * dt : 0)
      if (s.z > 8 || s.y < 0 || s.y > 28 || Math.abs(s.x - this.x) > 40) {
        s.z = -70 - Math.random() * 50
        s.y = pt.low ? Math.random() * 7 : Math.random() * 28
        s.x = this.x + (Math.random() - 0.5) * 70
      }
      strokes.setXYZ(i * 2, s.x, s.y, s.z)
      strokes.setXYZ(i * 2 + 1, s.x + 0.08 + (pt.lean > 6 ? 0.6 : 0), s.y + pt.len, s.z + vel * 0.012)
    })
    strokes.needsUpdate = true
    const col = this.streaks.material as THREE.LineBasicMaterial
    col.color.set(pt.color)
    col.opacity = pt.opacity

    const wheels = this.car.userData.wheels as THREE.Object3D[]
    wheels.forEach((w) => (w.rotation.x -= vel * dt * 2.6))
    this.car.position.x = this.x
    this.car.position.y = Math.sin(this.time * 19) * 0.012 * Math.min(1, Math.abs(this.kmh) / 129)
    this.car.rotation.y = THREE.MathUtils.lerp(this.car.rotation.y, -this.vx * 0.016, Math.min(1, dt * 9))
    this.car.rotation.z = THREE.MathUtils.lerp(this.car.rotation.z, -this.vx * 0.006, Math.min(1, dt * 8))
    this.car.visible = this.invuln <= 0 || Math.floor(this.time * 18) % 2 === 0
    this.headlights.position.x = this.x
  }

  private collide(e: Entity) {
    if (e.hit || e.kind === 'landmark' || e.kind === 'pit') return
    const dz = Math.abs(e.z)
    const dx = Math.abs(e.x - this.x)
    if (e.kind === 'relic') {
      if (dz < 3 && dx < 3 && e.secret) {
        e.hit = true
        this.events.secret(e.secret.id)
      }
      return
    }
    // Pickups count only when the car actually touches them: no pull from neighbouring lanes.
    if (dz > e.l + 2.1 || dx > e.w + 0.92) return
    e.hit = true
    if (e.kind === 'coin') {
      e.on = false
      e.obj.visible = false
      this.coins++
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
    this.kmh *= this.stats.tough
    if (e.kind !== 'traffic') {
      e.on = false
      e.obj.visible = false
    } else {
      e.z = Math.min(e.z, -e.l - 3)
    }
    this.loseLife('You crashed', 'That crash took your last life.')
  }

  private loseLife(why: string, lastWords: string, wall = false) {
    this.chain = 0
    this.shake = 0.8
    audio.crash()
    if (this.cheats.ironhide) {
      this.invuln = 1
      return
    }
    this.lives--
    this.lostWhy = why
    this.invuln = this.lead === 'dov' ? 3.6 : 1.8
    if (wall) this.invuln = 0.5
    this.pushHud(true)
    if (this.lives <= 0) this.finish(false, lastWords)
  }

  private finish(won: boolean, reason: string) {
    if (this.phase !== 'run' && this.phase !== 'park') return
    this.phase = won ? 'win' : 'over'
    this.reason = reason
    this.boosting = false
    audio.engineStop()
    won ? audio.win() : audio.fail()
    if (won) {
      this.km = this.level.length
      if (this.lives === this.livesMax) this.secretOf('clean')
      if (Math.abs(this.parkOffset.dx) < 0.4 && Math.abs(this.parkOffset.dz) < 0.6) this.secretOf('park')
    }
    this.events.end({ won, level: this.level.n - 1, km: Math.min(this.km, this.level.length), coins: this.coins, livesLost: this.livesMax - this.lives })
    this.pushHud(true)
  }

  private secretOf(type: LevelSecret['type']) {
    const s = this.level.secrets.find((n) => n.type === type)
    if (s) this.events.secret(s.id)
  }

  private bend(dt: number) {
    this.straight += ((this.phase === 'park' ? 0 : 1) - this.straight) * Math.min(1, dt * 0.8)
    const d = this.dist
    const x = (0.0013 * Math.sin(d * 0.0029) + 0.0008 * Math.sin(d * 0.0077 + 1.3)) * this.straight
    const y = (-0.00032 + 0.00042 * Math.sin(d * 0.0043 + 2)) * (0.3 + 0.7 * this.straight)
    bendUniform.value.set(x, y)
  }

  private snapPalette() {
    this.paletteStep(10)
  }

  private paletteStep(dt: number) {
    const p = this.level.regions[this.region].palette
    const k = Math.min(1, dt * 0.9)
    const pal = this.pal
    for (const key of ['top', 'mid', 'hor', 'sun', 'ground', 'road', 'line', 'hemi', 'low', 'dir'] as const) pal[key].lerp(tmp.set(p[key]), k)
    pal.aurora.lerp(tmp.set(p.auroraColor ?? '#5cffb0'), k)
    pal.near += (p.near - pal.near) * k
    pal.far += (p.far - pal.far) * k
    pal.night += (p.night - pal.night) * k
    pal.auroraLevel += ((p.aurora ?? 0) - pal.auroraLevel) * k
    pal.sunDir.lerp(tmpV.set(...p.sunDir).normalize(), k)
    this.fog.color.copy(pal.hor)
    this.fog.near = pal.near
    this.fog.far = pal.far
    this.skyMat.uniforms.night.value = pal.night
    this.skyMat.uniforms.aurora.value = pal.auroraLevel
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
    const parking = this.phase === 'park'
    const orbit = finale ? this.time * 0.35 : 0
    const tx = finale ? this.x + Math.sin(orbit) * 9 : this.x * (parking ? 0.85 : 0.62)
    const tz = finale ? Math.cos(orbit) * 9 : (wide ? 10 : 8.8) + (parking ? 2.5 : 0)
    const ty = finale ? 3.4 : (wide ? 4.1 : 3.5) + (parking ? 2.2 : 0)
    this.camera.position.x += (tx - this.camera.position.x) * k
    this.camera.position.y += (ty - this.camera.position.y) * k
    this.camera.position.z += (tz - this.camera.position.z) * k
    this.shake = Math.max(0, this.shake - dt * 1.7)
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.6
    }
    if (finale) this.camera.lookAt(this.x, 1, 0)
    else this.camera.lookAt(this.x * 0.78, parking ? 0.4 : 1.25, -13)
    const speedFov = (wide ? 82 : 64) + Math.min(10, Math.abs(this.kmh) / 26) + (this.boosting ? 6 : 0)
    this.camera.fov += (speedFov - this.camera.fov) * Math.min(1, dt * 2)
    this.camera.updateProjectionMatrix()
  }

  private pushHud(force: boolean) {
    this.hudTimer = 0.1
    if (!force && this.phase !== 'run' && this.phase !== 'park') return
    this.events.hud({
      phase: this.phase, level: this.level.n - 1, kmh: Math.round(this.kmh), km: this.km, length: this.level.length, fuel: this.fuel,
      lives: this.lives, livesMax: this.livesMax, coins: this.coins, region: this.displayRegion, count: Math.ceil(this.count),
      reason: this.reason, lostWhy: this.lostWhy, boost: this.boosting, park: this.phase === 'park' ? this.park : null,
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
