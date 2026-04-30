// Noise buffer helper — fills a buffer with white noise
function makeNoise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const frameCount = Math.ceil(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frameCount; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buffer
  return src
}

// Simple short farts — quick and dirty
type SimpleProfile = {
  duration: number
  baseFreq: number
  endFreq: number
  decay: number
  wobble: number
}

const SIMPLE: SimpleProfile[] = [
  { duration: 0.4,  baseFreq: 120, endFreq: 60,  decay: 0.12, wobble: 8  },
  { duration: 0.8,  baseFreq: 90,  endFreq: 40,  decay: 0.18, wobble: 14 },
  { duration: 0.25, baseFreq: 180, endFreq: 100, decay: 0.08, wobble: 5  },
  { duration: 1.1,  baseFreq: 70,  endFreq: 30,  decay: 0.25, wobble: 20 },
  { duration: 0.6,  baseFreq: 150, endFreq: 55,  decay: 0.15, wobble: 10 },
]

function playSimple(ctx: AudioContext, p: SimpleProfile): void {
  const now = ctx.currentTime
  const noise = makeNoise(ctx, p.duration)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 2
  filter.frequency.setValueAtTime(p.baseFreq, now)
  filter.frequency.exponentialRampToValueAtTime(p.endFreq, now + p.duration)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(1.2, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + p.duration)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  noise.start(now)
  noise.stop(now + p.duration + 0.05)
  noise.onended = () => ctx.close()
}

// ─────────────────────────────────────────────────────────────────────────────
// Contest-winner farts — multi-layer, LFO bubble modulation, complex envelopes
// ─────────────────────────────────────────────────────────────────────────────

// Shared builder: noise → bandpass filter → lfo-modulated freq → gain envelope
function buildWetLayer(
  ctx: AudioContext,
  dest: AudioNode,
  duration: number,
  centerFreq: number,
  q: number,
  lfoRate: number,
  lfoDepth: number,
  gainKeyframes: [number, number][],   // [absoluteTime, amplitude]
  startAt = ctx.currentTime,
): void {
  const noise = makeNoise(ctx, duration)

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = centerFreq
  filter.Q.value = q

  // LFO drives filter frequency for bubble/wet texture
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = lfoRate
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = lfoDepth
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0.001, startAt)
  for (const [t, amp] of gainKeyframes) {
    gainNode.gain.linearRampToValueAtTime(amp, t)
  }

  noise.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(dest)

  lfo.start(startAt)
  lfo.stop(startAt + duration)
  noise.start(startAt)
  noise.stop(startAt + duration + 0.1)
}

// Deep sub-bass rumble layer: lowpass near 60-80Hz for the chest-feel
function buildDeepLayer(
  ctx: AudioContext,
  dest: AudioNode,
  duration: number,
  freqStart: number,
  freqEnd: number,
  gainKeyframes: [number, number][],
  startAt = ctx.currentTime,
): void {
  const noise = makeNoise(ctx, duration)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 1.5
  filter.frequency.setValueAtTime(freqStart, startAt)
  filter.frequency.linearRampToValueAtTime(freqEnd, startAt + duration)

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0.001, startAt)
  for (const [t, amp] of gainKeyframes) {
    gainNode.gain.linearRampToValueAtTime(amp, t)
  }

  noise.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(dest)

  noise.start(startAt)
  noise.stop(startAt + duration + 0.1)
}

// High squeak: short bandpass burst at the end (the "wet finish")
function buildSqueak(
  ctx: AudioContext,
  dest: AudioNode,
  startAt: number,
  freq: number,
  duration: number,
  amplitude: number,
): void {
  const noise = makeNoise(ctx, duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = 12
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(amplitude, startAt)
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  noise.start(startAt)
  noise.stop(startAt + duration + 0.05)
}

// ─── Contest Profile 1: The Grand Champion ───────────────────────────────────
// 4.2s. Massive opening blast, mid-section bubbles, sputtery third act, wet squeak finish.
function playGrandChampion(ctx: AudioContext): void {
  const now = ctx.currentTime
  const dur = 4.2
  const master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)

  // Deep rumble — sustains entire duration, fades in phases
  buildDeepLayer(ctx, master, dur, 95, 28, [
    [now + 0.05, 1.4],
    [now + 1.0,  1.2],
    [now + 1.8,  0.6],
    [now + 2.2,  1.1],  // second wind
    [now + 3.0,  0.8],
    [now + 4.0,  0.3],
    [now + dur,  0.001],
  ], now)

  // Wet mid layer — heavy bubble LFO (6Hz), main body
  buildWetLayer(ctx, master, dur, 140, 8, 6, 55, [
    [now + 0.04, 1.5],
    [now + 1.1,  1.3],
    [now + 1.7,  0.4],
    [now + 2.1,  1.2],  // second burst
    [now + 2.9,  0.7],
    [now + 3.5,  0.4],
    [now + dur,  0.001],
  ], now)

  // Sputtering upper layer — faster LFO (11Hz), comes in at 2s
  buildWetLayer(ctx, master, dur - 2.0, 210, 10, 11, 70, [
    [now + 2.05, 0.8],
    [now + 2.4,  0.5],
    [now + 2.6,  0.9],  // sputter peak
    [now + 2.9,  0.3],
    [now + 3.2,  0.7],  // another sputter
    [now + 3.6,  0.2],
    [now + dur,  0.001],
  ], now + 2.0)

  // Wet squeak at the very end — the crowd goes wild
  buildSqueak(ctx, master, now + 3.85, 420, 0.35, 0.7)
  buildSqueak(ctx, master, now + 4.05, 380, 0.2,  0.5)

  setTimeout(() => ctx.close(), (dur + 0.5) * 1000)
}

// ─── Contest Profile 2: The Juicy Disaster ───────────────────────────────────
// 3.4s. Absolutely soaking wet. Rapid bubble LFO the entire time.
// Sounds like someone sat in pudding.
function playJuicyDisaster(ctx: AudioContext): void {
  const now = ctx.currentTime
  const dur = 3.4
  const master = ctx.createGain()
  master.gain.value = 0.95
  master.connect(ctx.destination)

  // Ultra-wet low layer — rapid 14Hz LFO (tiny bubbles)
  buildWetLayer(ctx, master, dur, 110, 12, 14, 80, [
    [now + 0.03, 1.6],
    [now + 0.8,  1.4],
    [now + 1.5,  1.5],
    [now + 2.2,  1.2],
    [now + 3.0,  0.8],
    [now + dur,  0.001],
  ], now)

  // Wet mid layer — slower 7Hz LFO (big bubbles on top)
  buildWetLayer(ctx, master, dur, 185, 9, 7, 90, [
    [now + 0.05, 1.2],
    [now + 0.6,  1.0],
    [now + 1.3,  1.3],
    [now + 2.0,  1.1],
    [now + 2.8,  0.6],
    [now + dur,  0.001],
  ], now)

  // Sub bass for that bodily authority
  buildDeepLayer(ctx, master, dur, 75, 35, [
    [now + 0.06, 1.3],
    [now + 1.0,  1.1],
    [now + 2.0,  1.0],
    [now + 3.0,  0.5],
    [now + dur,  0.001],
  ], now)

  // Two wet squeaks mid-way and at end
  buildSqueak(ctx, master, now + 1.8,  350, 0.25, 0.55)
  buildSqueak(ctx, master, now + 3.1,  460, 0.3,  0.6)
  buildSqueak(ctx, master, now + 3.25, 390, 0.18, 0.4)

  setTimeout(() => ctx.close(), (dur + 0.5) * 1000)
}

// ─── Contest Profile 3: The Slow Burn ────────────────────────────────────────
// 4.8s. Quiet suspicious start, builds to a thunderous peak, long wet decay.
// The one that clears the room.
function playSlowBurn(ctx: AudioContext): void {
  const now = ctx.currentTime
  const dur = 4.8
  const master = ctx.createGain()
  master.gain.value = 0.85
  master.connect(ctx.destination)

  // Deep build — starts nearly silent
  buildDeepLayer(ctx, master, dur, 85, 25, [
    [now + 0.5,  0.05],
    [now + 1.5,  0.3],
    [now + 2.2,  1.5],  // peak
    [now + 3.0,  1.2],
    [now + 3.8,  0.7],
    [now + 4.5,  0.3],
    [now + dur,  0.001],
  ], now)

  // Mid wet layer — builds with the deep
  buildWetLayer(ctx, master, dur, 155, 7, 5, 50, [
    [now + 0.8,  0.08],
    [now + 1.8,  0.5],
    [now + 2.3,  1.6],  // peak
    [now + 3.1,  1.3],
    [now + 4.0,  0.6],
    [now + dur,  0.001],
  ], now)

  // Bubble layer — appears after peak
  buildWetLayer(ctx, master, dur - 2.0, 190, 11, 9, 75, [
    [now + 2.1,  0.3],
    [now + 2.5,  1.0],
    [now + 3.0,  0.9],
    [now + 3.5,  0.7],
    [now + 4.2,  0.4],
    [now + dur,  0.001],
  ], now + 2.0)

  // Triple squeak at the very end — last breath
  buildSqueak(ctx, master, now + 4.3,  480, 0.22, 0.5)
  buildSqueak(ctx, master, now + 4.52, 410, 0.18, 0.45)
  buildSqueak(ctx, master, now + 4.68, 520, 0.12, 0.35)

  setTimeout(() => ctx.close(), (dur + 0.5) * 1000)
}

// ─── Contest Profile 4: The Triple Threat ────────────────────────────────────
// 3.8s. Three DISTINCT blasts with brief gaps. Crowd-pleasing structure.
// Like a standing ovation from your bowels.
function playTripleThreat(ctx: AudioContext): void {
  const now = ctx.currentTime
  const dur = 3.8
  const master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)

  // Blast 1 — 0 to 1.0s
  buildDeepLayer(ctx, master, 1.1, 100, 60, [
    [now + 0.04, 1.5],
    [now + 0.5,  1.3],
    [now + 0.95, 0.001],
  ], now)
  buildWetLayer(ctx, master, 1.1, 160, 7, 6, 60, [
    [now + 0.04, 1.4],
    [now + 0.5,  1.2],
    [now + 0.95, 0.001],
  ], now)

  // Blast 2 — 1.3s to 2.4s (bigger)
  buildDeepLayer(ctx, master, 1.2, 88, 45, [
    [now + 1.34, 1.8],
    [now + 1.9,  1.5],
    [now + 2.35, 0.001],
  ], now + 1.3)
  buildWetLayer(ctx, master, 1.2, 145, 9, 8, 70, [
    [now + 1.34, 1.7],
    [now + 1.9,  1.5],
    [now + 2.35, 0.001],
  ], now + 1.3)

  // Blast 3 — 2.6s to end (biggest, wettest)
  buildDeepLayer(ctx, master, dur - 2.6, 75, 30, [
    [now + 2.64, 2.0],
    [now + 3.1,  1.8],
    [now + 3.6,  0.8],
    [now + dur,  0.001],
  ], now + 2.6)
  buildWetLayer(ctx, master, dur - 2.6, 130, 12, 10, 85, [
    [now + 2.64, 1.9],
    [now + 3.1,  1.7],
    [now + 3.55, 0.6],
    [now + dur,  0.001],
  ], now + 2.6)

  // Signature wet squeak after blast 3
  buildSqueak(ctx, master, now + 3.65, 440, 0.28, 0.65)

  setTimeout(() => ctx.close(), (dur + 0.5) * 1000)
}

// ─── Contest Profile 5: The Wet Champion ─────────────────────────────────────
// 3.0s. Maximum wetness, maximum resonance. So wet it drips.
// This one wins on moisture content alone.
function playWetChampion(ctx: AudioContext): void {
  const now = ctx.currentTime
  const dur = 3.0
  const master = ctx.createGain()
  master.gain.value = 0.88
  master.connect(ctx.destination)

  // Four overlapping bubble layers at different frequencies and LFO rates
  // for an almost musical wet texture
  buildWetLayer(ctx, master, dur, 95,  15, 4,  60, [
    [now + 0.04, 1.4],
    [now + 1.2,  1.3],
    [now + 2.5,  0.7],
    [now + dur,  0.001],
  ], now)

  buildWetLayer(ctx, master, dur, 140, 13, 7,  80, [
    [now + 0.06, 1.2],
    [now + 1.0,  1.4],
    [now + 2.2,  0.9],
    [now + dur,  0.001],
  ], now)

  buildWetLayer(ctx, master, dur, 200, 10, 11, 70, [
    [now + 0.08, 0.9],
    [now + 0.8,  1.1],
    [now + 1.8,  1.0],
    [now + 2.6,  0.5],
    [now + dur,  0.001],
  ], now)

  buildDeepLayer(ctx, master, dur, 65, 30, [
    [now + 0.05, 1.5],
    [now + 1.5,  1.3],
    [now + dur,  0.001],
  ], now)

  // Wet squeaky finale — rapid fire
  buildSqueak(ctx, master, now + 2.55, 400, 0.2,  0.6)
  buildSqueak(ctx, master, now + 2.72, 460, 0.15, 0.5)
  buildSqueak(ctx, master, now + 2.85, 350, 0.18, 0.55)

  setTimeout(() => ctx.close(), (dur + 0.5) * 1000)
}

// ─────────────────────────────────────────────────────────────────────────────

const CONTEST_WINNERS = [
  playGrandChampion,
  playJuicyDisaster,
  playSlowBurn,
  playTripleThreat,
  playWetChampion,
]

export function playFart(): void {
  const ctx = new AudioContext()
  const allProfiles = SIMPLE.length + CONTEST_WINNERS.length
  const roll = Math.floor(Math.random() * allProfiles)

  if (roll < SIMPLE.length) {
    playSimple(ctx, SIMPLE[roll])
  } else {
    CONTEST_WINNERS[roll - SIMPLE.length](ctx)
  }
}
