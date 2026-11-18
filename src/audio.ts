import { DEAD_AIR, STATIONS } from './content'

type Voice = { type?: OscillatorType; freq: number; t: number; dur: number; vol: number; attack?: number; cutoff?: number; to?: number }

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

class AudioEngine {
  private ctx?: AudioContext
  private master?: GainNode
  private sfx?: GainNode
  private noise?: AudioBuffer
  private engineOsc?: OscillatorNode
  private engineSub?: OscillatorNode
  private engineGain?: GainNode
  private engineFilter?: BiquadFilterNode
  private radioBus?: GainNode
  private staticGain?: GainNode
  private stations: { freq: number; gain: GainNode; echo: GainNode }[] = []
  private timer = 0
  private step = 0
  private nextStep = 0
  private freq: number = STATIONS[0].freq
  analyser?: AnalyserNode
  enabled = false
  radioOn = false

  private ensure() {
    if (this.ctx) return this.ctx
    const Ctor = window.AudioContext
    if (!Ctor) return undefined
    const ctx = new Ctor()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = this.enabled ? 0.9 : 0
    const limiter = ctx.createDynamicsCompressor()
    this.master.connect(limiter).connect(ctx.destination)
    this.sfx = ctx.createGain()
    this.sfx.connect(this.master)
    const data = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const ch = data.getChannelData(0)
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1
    this.noise = data
    return ctx
  }

  setEnabled(on: boolean) {
    this.enabled = on
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    if (on) void ctx.resume()
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.04)
  }

  private tone(v: Voice, out?: AudioNode) {
    const ctx = this.ctx
    const dest = out ?? this.sfx
    if (!ctx || !dest) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = v.type ?? 'sine'
    osc.frequency.setValueAtTime(v.freq, v.t)
    if (v.to) osc.frequency.exponentialRampToValueAtTime(v.to, v.t + v.dur)
    const a = v.attack ?? 0.006
    gain.gain.setValueAtTime(0.0001, v.t)
    gain.gain.exponentialRampToValueAtTime(v.vol, v.t + a)
    gain.gain.exponentialRampToValueAtTime(0.0001, v.t + Math.max(a + 0.01, v.dur))
    if (v.cutoff) {
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = v.cutoff
      osc.connect(f).connect(gain)
    } else osc.connect(gain)
    gain.connect(dest)
    osc.start(v.t)
    osc.stop(v.t + v.dur + 0.05)
  }

  private burst(t: number, dur: number, vol: number, type: BiquadFilterType, freq: number, out?: AudioNode) {
    const ctx = this.ctx
    const dest = out ?? this.sfx
    if (!ctx || !dest || !this.noise) return
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = true
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(dest)
    src.start(t, Math.random())
    src.stop(t + dur + 0.05)
  }

  private now() {
    const ctx = this.ensure()
    return this.enabled && ctx ? ctx.currentTime : -1
  }

  click() {
    const t = this.now()
    if (t >= 0) this.tone({ type: 'square', freq: 720, t, dur: 0.05, vol: 0.05, cutoff: 2200 })
  }
  tick() {
    const t = this.now()
    if (t >= 0) this.burst(t, 0.025, 0.14, 'highpass', 3800)
  }
  horn() {
    const t = this.now()
    if (t < 0) return
    this.hornNote(t, 0.13)
    this.hornNote(t + 0.2, 0.34)
  }

  /** A warm two-tone horn: a soft major third, rounded off with a low-pass filter. */
  private hornNote(t: number, dur: number) {
    const ctx = this.ctx
    if (!ctx || !this.sfx) return
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.17, t + 0.018)
    env.gain.setValueAtTime(0.17, t + dur)
    env.gain.linearRampToValueAtTime(0, t + dur + 0.09)
    const warmth = ctx.createBiquadFilter()
    warmth.type = 'lowpass'
    warmth.frequency.value = 1250
    warmth.Q.value = 0.8
    warmth.connect(env).connect(this.sfx)
    const voices: [number, OscillatorType, number][] = [[349.23, 'triangle', 0.7], [440, 'triangle', 0.6], [350.3, 'sawtooth', 0.16], [438.7, 'sawtooth', 0.14]]
    for (const [freq, type, level] of voices) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.value = level
      osc.connect(gain).connect(warmth)
      osc.start(t)
      osc.stop(t + dur + 0.12)
    }
  }
  pickup(chain = 0) {
    const t = this.now()
    if (t < 0) return
    const base = 72 + Math.min(chain, 8)
    this.tone({ type: 'triangle', freq: midi(base), t, dur: 0.1, vol: 0.14 })
    this.tone({ type: 'triangle', freq: midi(base + 7), t: t + 0.06, dur: 0.14, vol: 0.12 })
  }
  fuel() {
    const t = this.now()
    if (t < 0) return
    ;[60, 64, 67].forEach((n, i) => this.tone({ type: 'square', freq: midi(n), t: t + i * 0.07, dur: 0.12, vol: 0.06, cutoff: 1800 }))
  }
  crash() {
    const t = this.now()
    if (t < 0) return
    this.burst(t, 0.5, 0.7, 'lowpass', 1300)
    this.tone({ type: 'sawtooth', freq: 130, to: 34, t, dur: 0.42, vol: 0.34, cutoff: 700 })
  }
  spray() {
    const t = this.now()
    if (t >= 0) this.burst(t, 0.55, 0.16, 'bandpass', 4200)
  }
  swap() {
    const t = this.now()
    if (t < 0) return
    this.tone({ type: 'square', freq: 220, to: 660, t, dur: 0.16, vol: 0.05, cutoff: 1600 })
  }
  unlock() {
    const t = this.now()
    if (t < 0) return
    ;[69, 76, 81, 88].forEach((n, i) => this.tone({ type: 'triangle', freq: midi(n), t: t + i * 0.09, dur: 0.5, vol: 0.13 }))
  }
  fail() {
    const t = this.now()
    if (t >= 0) this.tone({ type: 'sawtooth', freq: 180, to: 60, t, dur: 0.7, vol: 0.2, cutoff: 800 })
  }
  win() {
    const t = this.now()
    if (t < 0) return
    ;[60, 67, 72, 76, 79, 84].forEach((n, i) => this.tone({ type: 'triangle', freq: midi(n), t: t + i * 0.13, dur: 0.8, vol: 0.14 }))
  }

  engineStart() {
    const ctx = this.ensure()
    if (!ctx || !this.master || this.engineOsc) return
    this.engineOsc = ctx.createOscillator()
    this.engineSub = ctx.createOscillator()
    this.engineOsc.type = 'sawtooth'
    this.engineSub.type = 'square'
    this.engineFilter = ctx.createBiquadFilter()
    this.engineFilter.type = 'lowpass'
    this.engineFilter.frequency.value = 420
    this.engineGain = ctx.createGain()
    this.engineGain.gain.value = 0.0001
    this.engineOsc.connect(this.engineFilter)
    this.engineSub.connect(this.engineFilter)
    this.engineFilter.connect(this.engineGain).connect(this.master)
    this.engineOsc.start()
    this.engineSub.start()
    this.engineGain.gain.setTargetAtTime(this.radioOn ? 0.035 : 0.075, ctx.currentTime, 0.2)
  }
  engineSet(ratio: number) {
    const ctx = this.ctx
    if (!ctx || !this.engineOsc || !this.engineSub || !this.engineFilter) return
    const f = 46 + ratio * 96
    this.engineOsc.frequency.setTargetAtTime(f, ctx.currentTime, 0.05)
    this.engineSub.frequency.setTargetAtTime(f / 2, ctx.currentTime, 0.05)
    this.engineFilter.frequency.setTargetAtTime(280 + ratio * 900, ctx.currentTime, 0.08)
  }
  engineStop() {
    const ctx = this.ctx
    if (!ctx || !this.engineOsc || !this.engineSub || !this.engineGain) return
    this.engineGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12)
    this.engineOsc.stop(ctx.currentTime + 0.6)
    this.engineSub.stop(ctx.currentTime + 0.6)
    this.engineOsc = this.engineSub = undefined
  }

  private buildRadio() {
    const ctx = this.ctx
    if (!ctx || !this.master || this.radioBus || !this.noise) return
    this.radioBus = ctx.createGain()
    this.radioBus.gain.value = 0
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 128
    this.analyser.smoothingTimeConstant = 0.72
    this.radioBus.connect(this.analyser)
    this.analyser.connect(this.master)
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = true
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 2400
    band.Q.value = 0.4
    this.staticGain = ctx.createGain()
    this.staticGain.gain.value = 0
    src.connect(band).connect(this.staticGain).connect(this.radioBus)
    src.start()
    const list = [...STATIONS.map((s) => s.freq), DEAD_AIR]
    this.stations = list.map((freq) => {
      const gain = ctx.createGain()
      gain.gain.value = 0
      gain.connect(this.radioBus!)
      const delay = ctx.createDelay(1.5)
      delay.delayTime.value = 0.39
      const feedback = ctx.createGain()
      feedback.gain.value = 0.46
      const echo = ctx.createGain()
      echo.connect(delay)
      delay.connect(feedback).connect(delay)
      delay.connect(gain)
      return { freq, gain, echo }
    })
  }

  private mix() {
    const ctx = this.ctx
    if (!ctx || !this.staticGain) return
    let strongest = 0
    for (const s of this.stations) {
      const lock = Math.max(0, 1 - Math.abs(this.freq - s.freq) / 0.32)
      strongest = Math.max(strongest, lock)
      s.gain.gain.setTargetAtTime(lock * lock, ctx.currentTime, 0.03)
    }
    this.staticGain.gain.setTargetAtTime(0.13 * (1 - strongest), ctx.currentTime, 0.03)
  }

  tune(freq: number) {
    this.freq = freq
    this.mix()
  }

  setRadio(on: boolean) {
    this.radioOn = on
    const ctx = this.ensure()
    if (!ctx) return
    void ctx.resume()
    this.buildRadio()
    this.radioBus?.gain.setTargetAtTime(on ? 0.75 : 0, ctx.currentTime, 0.08)
    window.clearInterval(this.timer)
    if (!on) return
    this.mix()
    this.nextStep = ctx.currentTime + 0.05
    this.timer = window.setInterval(() => this.schedule(), 30)
  }

  private schedule() {
    const ctx = this.ctx
    if (!ctx) return
    while (this.nextStep < ctx.currentTime + 0.14) {
      const t = this.nextStep
      const i = this.step++
      const audible = (index: number) => Math.abs(this.freq - this.stations[index].freq) < 0.34
      if (audible(0)) this.dub(i, t, this.stations[0])
      if (audible(1)) this.tide(i, t, this.stations[1])
      if (audible(2)) this.motor(i, t, this.stations[2])
      if (audible(3)) this.numbers(i, t, this.stations[3])
      this.nextStep += 60 / 96 / 4
    }
  }

  private dub(i: number, t: number, s: { gain: GainNode; echo: GainNode }) {
    const s16 = i % 32
    const bass: Record<number, number> = { 0: 33, 3: 33, 6: 36, 8: 31, 14: 28, 16: 33, 19: 33, 22: 40, 24: 38, 30: 36 }
    if (bass[s16]) this.tone({ type: 'sine', freq: midi(bass[s16]), t, dur: 0.3, vol: 0.42, cutoff: 500 }, s.gain)
    if (s16 % 8 === 4) {
      for (const n of s16 < 16 ? [57, 60, 64] : [55, 59, 62]) {
        this.tone({ type: 'sawtooth', freq: midi(n), t, dur: 0.12, vol: 0.05, cutoff: 1500 }, s.gain)
        this.tone({ type: 'sawtooth', freq: midi(n), t, dur: 0.12, vol: 0.04, cutoff: 1500 }, s.echo)
      }
    }
    if (s16 === 8 || s16 === 24) this.burst(t, 0.12, 0.2, 'bandpass', 1900, s.echo)
    if (s16 % 16 === 0) this.tone({ type: 'sine', freq: 88, to: 42, t, dur: 0.2, vol: 0.4 }, s.gain)
    if (s16 % 2 === 0) this.burst(t, 0.03, 0.05, 'highpass', 6500, s.gain)
  }

  private tide(i: number, t: number, s: { gain: GainNode; echo: GainNode }) {
    const bar = i % 64
    const chords = [[45, 57, 60, 64, 71], [41, 53, 60, 65, 69], [48, 55, 60, 67, 74], [43, 55, 59, 62, 69]]
    if (bar % 16 === 0) {
      for (const n of chords[bar / 16]) this.tone({ type: 'triangle', freq: midi(n), t, dur: 3.8, vol: 0.08, attack: 1.1, cutoff: 1100 }, s.gain)
    }
    const arp = [76, 81, 84, 88, 84, 79]
    if (i % 6 === 0) this.tone({ type: 'sine', freq: midi(arp[(i / 6) % arp.length]), t, dur: 0.7, vol: 0.06 }, s.echo)
  }

  private motor(i: number, t: number, s: { gain: GainNode; echo: GainNode }) {
    const s16 = i % 16
    if (s16 % 4 === 0) this.tone({ type: 'sine', freq: 130, to: 44, t, dur: 0.16, vol: 0.6 }, s.gain)
    if (s16 % 4 === 2) this.burst(t, 0.06, 0.16, 'highpass', 7200, s.gain)
    if (s16 === 4 || s16 === 12) this.burst(t, 0.13, 0.2, 'bandpass', 2200, s.gain)
    const root = [38, 38, 41, 36][Math.floor(i / 16) % 4]
    this.tone({ type: 'sawtooth', freq: midi(root + (s16 % 2 ? 12 : 0)), t, dur: 0.1, vol: 0.13, cutoff: 900 }, s.gain)
    if (s16 === 6 || s16 === 11) this.tone({ type: 'square', freq: midi(root + 31), t, dur: 0.1, vol: 0.035, cutoff: 2600 }, s.echo)
  }

  private numbers(i: number, t: number, s: { gain: GainNode }) {
    const code = [3, 1, 4, 1, 5, 0, 9, 2, 6, 0]
    const slot = Math.floor(i / 8) % code.length
    const n = code[slot]
    const pos = i % 8
    if (n && pos < Math.min(n, 6)) this.tone({ type: 'sine', freq: 1046, t, dur: 0.06, vol: 0.18 }, s.gain)
  }
}

export const audio = new AudioEngine()
