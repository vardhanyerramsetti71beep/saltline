import * as THREE from 'three'
import { buildCar, repaint, type CarLook } from './car'

export class GarageView {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  private turntable = new THREE.Group()
  private car?: THREE.Group
  private look?: CarLook
  private raf = 0
  private visible = false
  private angle = 0.7
  private spin = 0.25
  private dragging = false
  private lastX = 0
  private mist: THREE.Points
  private mistAge = 9
  private observer: ResizeObserver
  private blueprint = false
  private last = performance.now()

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.camera.position.set(0, 2.7, 11.5)
    this.camera.lookAt(0, 0.72, 0)

    this.scene.add(new THREE.HemisphereLight(0xfff4df, 0x5a5146, 2.1))
    const key = new THREE.DirectionalLight(0xfff0d8, 2.4)
    key.position.set(5, 8, 6)
    const rim = new THREE.DirectionalLight(0x9fd4d2, 1.3)
    rim.position.set(-7, 3, -6)
    this.scene.add(key, rim)

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.85, 0.16, 64), new THREE.MeshLambertMaterial({ color: 0x13192b }))
    floor.position.y = -0.08
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.42, 64), new THREE.MeshBasicMaterial({ color: 0xe2a32a }))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.006
    this.turntable.add(floor, ring)
    for (let i = 0; i < 24; i++) {
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.22), new THREE.MeshBasicMaterial({ color: 0xefe6d3 }))
      const a = (i / 24) * Math.PI * 2
      tick.rotation.set(-Math.PI / 2, 0, -a)
      tick.position.set(Math.sin(a) * 3.6, 0.006, Math.cos(a) * 3.6)
      this.turntable.add(tick)
    }
    this.scene.add(this.turntable)

    const mistGeo = new THREE.BufferGeometry()
    mistGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(420 * 3), 3))
    this.mist = new THREE.Points(mistGeo, new THREE.PointsMaterial({ size: 0.07, transparent: true, opacity: 0, depthWrite: false }))
    this.scene.add(this.mist)

    canvas.addEventListener('pointerdown', this.down)
    window.addEventListener('pointermove', this.move)
    window.addEventListener('pointerup', this.up)
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas.parentElement!)
    this.resize()
  }

  private down = (e: PointerEvent) => {
    this.dragging = true
    this.lastX = e.clientX
  }
  private move = (e: PointerEvent) => {
    if (!this.dragging) return
    const dx = e.clientX - this.lastX
    this.lastX = e.clientX
    this.angle += dx * 0.009
    this.spin = dx * 0.5
  }
  private up = () => {
    this.dragging = false
  }

  private resize() {
    const parent = this.canvas.parentElement!
    const w = parent.clientWidth
    const h = parent.clientHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.fov = w / h < 1 ? 46 : 32
    this.camera.updateProjectionMatrix()
    this.render()
  }

  setLook(look: CarLook) {
    const rebuild = !this.look || this.look.car !== look.car || this.look.stripe !== look.stripe
    const repainted = this.look && this.look.paint !== look.paint
    this.look = look
    if (rebuild) {
      if (this.car) this.turntable.remove(this.car)
      this.car = buildCar(look)
      this.turntable.add(this.car)
      this.applyBlueprint()
    } else if (this.car) {
      repaint(this.car, look.paint)
    }
    if (repainted) this.spray(look.paint)
    this.render()
  }

  setBlueprint(on: boolean) {
    this.blueprint = on
    this.applyBlueprint()
    this.render()
  }

  private applyBlueprint() {
    this.car?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
      if (m) m.wireframe = this.blueprint
    })
  }

  private spray(hex: string) {
    this.mistAge = 0
    ;(this.mist.material as THREE.PointsMaterial).color.set(hex)
    const p = this.mist.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, (Math.random() - 0.5) * 5, Math.random() * 2, (Math.random() - 0.5) * 3)
    }
    p.needsUpdate = true
  }

  setVisible(on: boolean) {
    if (on === this.visible) return
    this.visible = on
    cancelAnimationFrame(this.raf)
    if (on) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.frame)
    }
  }

  private frame = (now: number) => {
    const dt = THREE.MathUtils.clamp((now - this.last) / 1000, 0, 0.05)
    this.last = now
    if (!this.dragging) {
      this.spin += (0.25 - this.spin) * Math.min(1, dt * 2)
      this.angle += this.spin * dt
    }
    this.turntable.rotation.y = this.angle
    if (this.mistAge < 1.2) {
      this.mistAge += dt
      const material = this.mist.material as THREE.PointsMaterial
      material.opacity = Math.max(0, 0.75 - this.mistAge * 0.65)
      this.mist.position.y = this.mistAge * 0.4
    }
    this.render()
    this.raf = requestAnimationFrame(this.frame)
  }

  private render() {
    this.turntable.rotation.y = this.angle
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointerdown', this.down)
    window.removeEventListener('pointermove', this.move)
    window.removeEventListener('pointerup', this.up)
    this.renderer.dispose()
  }
}
