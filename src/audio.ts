import { DEAD_AIR, STATIONS } from './content'

type Voice = { type?: OscillatorType; freq: number; t: number; dur: number; vol: number; attack?: number; cutoff?: number; to?: number }

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

type Station = { freq: number; gain: GainNode; echo: GainNode; bpm: number; next: number; step: number; play: (i: number, t: number, s: Station) => void }

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
  private stations: Station[] = []
  private timer = 0
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
    // iPhones mute web audio on the silent switch unless the page asks for playback.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
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
    this.engineGain.gain.setTargetAtTime(this.radioOn ? 0.028 : 0.075, ctx.currentTime, 0.2)
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
    // A broadcast-style compressor keeps every station loud and even, like a real radio.
    const glue = ctx.createDynamicsCompressor()
    glue.threshold.value = -24
    glue.knee.value = 10
    glue.ratio.value = 4
    glue.attack.value = 0.004
    glue.release.value = 0.2
    const makeup = ctx.createGain()
    makeup.gain.value = 1.8
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 128
    this.analyser.smoothingTimeConstant = 0.72
    this.radioBus.connect(glue).connect(makeup).connect(this.analyser)
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
    const defs: [number, number, Station['play']][] = [
      [STATIONS[0].freq, 84, this.dub],
      [STATIONS[1].freq, 66, this.tide],
      [STATIONS[2].freq, 118, this.motor],
      [DEAD_AIR, 96, this.numbers],
    ]
    this.stations = defs.map(([freq, bpm, play]) => {
      const gain = ctx.createGain()
      gain.gain.value = 0
      gain.connect(this.radioBus!)
      const echo = ctx.createGain()
      const delay = ctx.createDelay(2)
      delay.delayTime.value = (60 / bpm) * 0.75
      const feedback = ctx.createGain()
      feedback.gain.value = 0.38
      const dull = ctx.createBiquadFilter()
      dull.type = 'lowpass'
      dull.frequency.value = 2600
      echo.connect(delay)
      delay.connect(dull).connect(feedback).connect(delay)
      dull.connect(gain)
      return { freq, gain, echo, bpm, next: 0, step: 0, play: play.bind(this) }
    })
  }

  private lock(s: Station) {
    return Math.max(0, 1 - Math.abs(this.freq - s.freq) / 0.32)
  }

  private mix() {
    const ctx = this.ctx
    if (!ctx || !this.staticGain) return
    let strongest = 0
    for (const s of this.stations) {
      const lock = this.lock(s)
      strongest = Math.max(strongest, lock)
      s.gain.gain.setTargetAtTime(lock * lock, ctx.currentTime, 0.03)
    }
    this.staticGain.gain.setTargetAtTime(0.16 * (1 - strongest), ctx.currentTime, 0.03)
  }

  tune(freq: number) {
    this.freq = freq
    this.mix()
  }

  setRadio(on: boolean) {
    const ctx = this.ensure()
    if (!ctx) return
    void ctx.resume()
    this.buildRadio()
    this.radioBus?.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.08)
    if (on && this.radioOn && this.timer) return
    this.radioOn = on
    window.clearInterval(this.timer)
    this.timer = 0
    if (!on) return
    this.mix()
    for (const s of this.stations) s.next = ctx.currentTime + 0.05
    this.timer = window.setInterval(() => this.schedule(), 25)
  }

  private schedule() {
    const ctx = this.ctx
    if (!ctx) return
    const ahead = ctx.currentTime + 0.16
    for (const s of this.stations) {
      if (this.lock(s) <= 0) {
        // Off-air stations keep time without playing, so tuning in lands on the beat.
        while (s.next < ctx.currentTime) {
          s.next += 60 / s.bpm / 4
          s.step++
        }
        continue
      }
      while (s.next < ahead) {
        s.play(s.step, Math.max(s.next, ctx.currentTime), s)
        s.step++
        s.next += 60 / s.bpm / 4
      }
    }
  }

  /** One synth voice: oscillator, optional sweeping low-pass filter, and a clean envelope. */
  private note(out: AudioNode, o: { type: OscillatorType; freq: number; t: number; dur: number; vol: number; attack?: number; release?: number; cutoff?: number; cutoffEnd?: number; detune?: number }) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.type = o.type
    osc.frequency.value = o.freq
    if (o.detune) osc.detune.value = o.detune
    const env = ctx.createGain()
    const a = o.attack ?? 0.008
    const r = o.release ?? 0.08
    const hold = Math.max(a, o.dur)
    env.gain.setValueAtTime(0, o.t)
    env.gain.linearRampToValueAtTime(o.vol, o.t + a)
    env.gain.setValueAtTime(o.vol, o.t + hold)
    env.gain.exponentialRampToValueAtTime(0.0001, o.t + hold + r)
    let head: AudioNode = osc
    if (o.cutoff) {
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.Q.value = 0.8
      f.frequency.setValueAtTime(o.cutoff, o.t)
      if (o.cutoffEnd) f.frequency.exponentialRampToValueAtTime(o.cutoffEnd, o.t + hold + r)
      osc.connect(f)
      head = f
    }
    head.connect(env).connect(out)
    osc.start(o.t)
    osc.stop(o.t + hold + r + 0.05)
  }

  private chord(out: AudioNode, notes: number[], t: number, dur: number, vol: number, cutoff: number, cutoffEnd?: number, attack?: number, release?: number) {
    for (const n of notes) {
      for (const detune of [-7, 7]) this.note(out, { type: 'sawtooth', freq: midi(n), t, dur, vol, cutoff, cutoffEnd, detune, attack, release })
    }
  }

  private kick(out: AudioNode, t: number, vol: number) {
    this.tone({ type: 'sine', freq: 160, to: 52, t, dur: 0.3, vol }, out)
    this.burst(t, 0.018, vol * 0.5, 'highpass', 2500, out)
  }
  private snare(out: AudioNode, t: number, vol: number) {
    this.burst(t, 0.18, vol, 'bandpass', 1800, out)
    this.tone({ type: 'triangle', freq: 210, to: 160, t, dur: 0.1, vol: vol * 0.5 }, out)
  }
  private hat(out: AudioNode, t: number, vol: number, open = false) {
    this.burst(t, open ? 0.2 : 0.045, vol, 'highpass', 7800, out)
  }
  private clap(out: AudioNode, t: number, vol: number) {
    for (let k = 0; k < 3; k++) this.burst(t + k * 0.011, 0.03, vol, 'bandpass', 1300, out)
    this.burst(t + 0.033, 0.16, vol * 0.7, 'bandpass', 1300, out)
  }

  /** 88.3 Radio Saltline: a one-drop dub groove with a melodica tune and tape echo, in A minor. */
  private dub(i: number, t: number, s: Station) {
    const step = i % 16
    const bar = Math.floor(i / 16) % 4
    const chords = [[57, 60, 64], [57, 60, 64], [57, 62, 65], [59, 64, 67]]
    const roots = [45, 45, 50, 52]
    const bassline: Record<number, number> = { 0: 0, 3: 0, 6: 7, 10: 10, 12: 12, 14: 7 }
    if (bassline[step] !== undefined) {
      const n = roots[bar] + bassline[step]
      this.note(s.gain, { type: 'sawtooth', freq: midi(n), t, dur: 0.24, vol: 0.2, cutoff: 900, cutoffEnd: 400 })
      this.note(s.gain, { type: 'triangle', freq: midi(n + 12), t, dur: 0.22, vol: 0.12 })
    }
    if (step === 4 || step === 12) {
      this.chord(s.gain, chords[bar], t, 0.11, 0.045, 3200, 900)
      this.chord(s.echo, chords[bar], t, 0.11, 0.025, 3200, 900)
    }
    if (step === 8) {
      this.kick(s.gain, t, 0.8)
      this.snare(s.gain, t, 0.35)
      this.snare(s.echo, t, 0.18)
    }
    if (step % 2 === 0) this.hat(s.gain, t, step % 4 === 2 ? 0.09 : 0.05)
    const tune: [number, number, number][] = [
      [0, 76, 3], [4, 79, 2], [6, 76, 2], [8, 74, 4], [12, 72, 4], [16, 74, 2], [18, 72, 2], [20, 69, 6], [28, 67, 4],
      [32, 69, 3], [36, 72, 2], [38, 74, 2], [40, 77, 4], [44, 76, 4], [48, 74, 2], [50, 72, 2], [52, 71, 4], [56, 69, 8],
    ]
    const phrase = i % 128
    if (phrase < 64) {
      for (const [at, n, len] of tune) {
        if (at !== phrase) continue
        const dur = (len * 60) / s.bpm / 4
        this.note(s.gain, { type: 'square', freq: midi(n), t, dur, vol: 0.075, attack: 0.02, release: 0.12, cutoff: 2400 })
        this.note(s.echo, { type: 'square', freq: midi(n), t, dur, vol: 0.04, attack: 0.02, release: 0.12, cutoff: 2000 })
      }
    }
  }

  /** 94.7 Lantern FM: slow pads, a ringing bell melody and a soft shaker. */
  private tide(i: number, t: number, s: Station) {
    const step = i % 32
    const section = Math.floor(i / 32) % 4
    const chords = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [48, 55, 60, 64, 71], [55, 59, 62, 64, 67]]
    const beat = 60 / s.bpm / 4
    if (step === 0) {
      this.chord(s.gain, chords[section], t, beat * 28, 0.026, 1700, 1100, 1.2, 1.6)
      this.note(s.gain, { type: 'triangle', freq: midi(chords[section][0] - 12), t, dur: beat * 30, vol: 0.14, attack: 0.6, release: 1.2 })
    }
    if (step % 2 === 0) {
      const pattern = [0, 2, 4, 3, 1, 4, 2, 3]
      const n = chords[section][pattern[(step / 2) % pattern.length]] + 12
      this.note(s.gain, { type: 'sine', freq: midi(n), t, dur: 0.18, vol: 0.13, release: 0.6 })
      this.note(s.gain, { type: 'triangle', freq: midi(n + 12), t, dur: 0.05, vol: 0.035, release: 0.3 })
      this.note(s.echo, { type: 'sine', freq: midi(n), t, dur: 0.18, vol: 0.07, release: 0.5 })
    }
    if (step % 4 === 2) this.hat(s.gain, t, 0.03)
  }

  /** 101.1 Ember AM: four-on-the-floor motor disco with an octave bass, claps, stabs and a lead riff. */
  private motor(i: number, t: number, s: Station) {
    const step = i % 16
    const bar = Math.floor(i / 16) % 4
    const roots = [45, 45, 41, 43]
    const chords = [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
    if (step % 4 === 0) this.kick(s.gain, t, 0.9)
    if (step === 4 || step === 12) this.clap(s.gain, t, 0.32)
    if (step % 4 === 2) this.hat(s.gain, t, 0.11, true)
    else if (step % 2 === 1) this.hat(s.gain, t, 0.04)
    const n = roots[bar] + (step % 2 ? 12 : 0)
    this.note(s.gain, { type: 'sawtooth', freq: midi(n), t, dur: 0.09, vol: 0.15, cutoff: 1800, cutoffEnd: 500 })
    if (step === 6 || step === 14) this.chord(s.gain, chords[bar], t, 0.1, 0.045, 3600, 1200)
    const lead = Math.floor(i / 64) % 2 === 1
    const riff: Record<number, number> = { 0: 0, 3: 2, 6: 1, 8: 2, 10: 0, 12: 1, 14: 2 }
    if (lead && riff[step] !== undefined) {
      const note = chords[bar][riff[step]] + 12
      this.note(s.gain, { type: 'square', freq: midi(note), t, dur: 0.1, vol: 0.06, cutoff: 2800 })
      this.note(s.echo, { type: 'square', freq: midi(note), t, dur: 0.1, vol: 0.03, cutoff: 2400 })
    }
  }

  /** 87.9 dead air: someone reading numbers as beeps. */
  private numbers(i: number, t: number, s: Station) {
    const code = [3, 1, 4, 1, 5, 0, 9, 2, 6, 0]
    const slot = Math.floor(i / 8) % code.length
    const n = code[slot]
    const pos = i % 8
    if (n && pos < Math.min(n, 6)) this.tone({ type: 'sine', freq: 1046, t, dur: 0.06, vol: 0.22 }, s.gain)
  }
}

export const audio = new AudioEngine()
