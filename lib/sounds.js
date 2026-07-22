// Sound effects for the Bridge app
// Using Web Audio API for high-quality, minimal sounds

class SoundManager {
  constructor() {
    this.audioContext = null
    this.sounds = {}
    this.initialized = false
  }

  init() {
    if (this.initialized) return
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.initialized = true
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }

  // Success chime - Apple-style, uplifting
  playSuccess() {
    if (!this.initialized) this.init()
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime
    
    const oscillator1 = ctx.createOscillator()
    const oscillator2 = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator1.frequency.setValueAtTime(523.25, now)
    oscillator1.type = 'sine'
    
    oscillator2.frequency.setValueAtTime(659.25, now + 0.1)
    oscillator2.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
    
    oscillator1.start(now)
    oscillator1.stop(now + 0.5)
    oscillator2.start(now + 0.1)
    oscillator2.stop(now + 0.5)
  }

  playCorrection() {
    if (!this.initialized) this.init()
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.setValueAtTime(440, now)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.03)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
    
    oscillator.start(now)
    oscillator.stop(now + 0.3)
  }

  playHint() {
    if (!this.initialized) this.init()
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.setValueAtTime(300, now)
    oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.2)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
    
    oscillator.start(now)
    oscillator.stop(now + 0.25)
  }

  playComplete() {
    if (!this.initialized) this.init()
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime
    
    const notes = [523.25, 659.25, 783.99]
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.setValueAtTime(freq, now + i * 0.1)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, now + i * 0.1)
      gainNode.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4)
      
      oscillator.start(now + i * 0.1)
      oscillator.stop(now + i * 0.1 + 0.4)
    })
  }

  playLevelUp() {
    if (!this.initialized) this.init()
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime
    
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]
    
    scale.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.setValueAtTime(freq, now + i * 0.05)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, now + i * 0.05)
      gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.05 + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15)
      
      oscillator.start(now + i * 0.05)
      oscillator.stop(now + i * 0.05 + 0.15)
    })
  }

  playBreakTime() {
    if (!this.initialized) this.init()
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime
    
    const tones = [783.99, 659.25, 523.25]
    
    tones.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.setValueAtTime(freq, now + i * 0.3)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, now + i * 0.3)
      gainNode.gain.linearRampToValueAtTime(0.2, now + i * 0.3 + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 1.0)
      
      oscillator.start(now + i * 0.3)
      oscillator.stop(now + i * 0.3 + 1.0)
    })
  }
}

export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null
