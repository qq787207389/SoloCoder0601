export class AudioManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null

  init() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.3
      this.masterGain.connect(this.audioContext.destination)
    } catch (e) {
      console.log('Audio not supported')
    }
  }

  playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || !this.masterGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  playHit() {
    this.playTone(800, 0.1, 'square', 0.2)
    setTimeout(() => this.playTone(600, 0.05, 'square', 0.1), 20)
  }

  playSpike() {
    this.playTone(200, 0.2, 'sawtooth', 0.4)
    setTimeout(() => this.playTone(150, 0.15, 'square', 0.3), 50)
  }

  playBlock() {
    this.playTone(300, 0.15, 'square', 0.35)
  }

  playReceive() {
    this.playTone(500, 0.1, 'sine', 0.2)
  }

  playSet() {
    this.playTone(700, 0.08, 'sine', 0.15)
  }

  playScore() {
    this.playTone(523, 0.15, 'sine', 0.3)
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 150)
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.3), 300)
  }

  playSpecial() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.playTone(400 + i * 100, 0.1, 'sawtooth', 0.25), i * 50)
    }
  }

  playBounce() {
    this.playTone(300, 0.05, 'sine', 0.1)
  }
}

export const audioManager = new AudioManager()
