type FartProfile = {
  duration: number
  baseFreq: number
  endFreq: number
  decay: number
  wobble: number
}

const PROFILES: FartProfile[] = [
  { duration: 0.4, baseFreq: 120, endFreq: 60,  decay: 0.12, wobble: 8  },
  { duration: 0.8, baseFreq: 90,  endFreq: 40,  decay: 0.18, wobble: 14 },
  { duration: 0.25, baseFreq: 180, endFreq: 100, decay: 0.08, wobble: 5 },
  { duration: 1.1, baseFreq: 70,  endFreq: 30,  decay: 0.25, wobble: 20 },
  { duration: 0.6, baseFreq: 150, endFreq: 55,  decay: 0.15, wobble: 10 },
]

export function playFart(): void {
  const ctx = new AudioContext()
  const profile = PROFILES[Math.floor(Math.random() * PROFILES.length)]
  const sampleRate = ctx.sampleRate
  const frameCount = Math.ceil(sampleRate * profile.duration)

  const buffer = ctx.createBuffer(1, frameCount, sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate
    const noise = Math.random() * 2 - 1
    const envelope = Math.exp(-t / profile.decay)
    const wobbleAmt = Math.sin(2 * Math.PI * profile.wobble * t)
    data[i] = noise * envelope * (1 + 0.3 * wobbleAmt)
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(profile.baseFreq, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(
    profile.endFreq,
    ctx.currentTime + profile.duration
  )
  filter.Q.value = 2

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(1.2, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + profile.duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  source.start()
  source.stop(ctx.currentTime + profile.duration + 0.05)
  source.onended = () => ctx.close()
}
