export type SoundType = 'hit' | 'kick' | 'punch' | 'special' | 'jump' | 'hurt' | 'coin' | 'heal';

interface BGMData {
  notes: number[];
  durations: number[];
  tempo: number;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmTimeout: number | null = null;
  private currentBGMIndex: number = -1;
  private isPlaying: boolean = false;

  private readonly BGM_DATA: BGMData[] = [
    {
      notes: [262, 294, 330, 262, 262, 294, 330, 262, 330, 349, 392, 330, 349, 392, 392, 440],
      durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5],
      tempo: 120
    },
    {
      notes: [392, 349, 330, 294, 392, 349, 330, 294, 262, 294, 330, 349, 330, 294, 262, 196],
      durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1],
      tempo: 100
    },
    {
      notes: [440, 494, 523, 440, 440, 494, 523, 440, 523, 587, 659, 523, 587, 659, 659, 698],
      durations: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.8, 0.4, 0.4, 0.8, 0.4, 0.4],
      tempo: 140
    },
    {
      notes: [220, 247, 262, 294, 330, 294, 262, 247, 220, 196, 220, 262, 294, 330, 294, 262],
      durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      tempo: 110
    },
    {
      notes: [349, 392, 440, 349, 392, 440, 494, 440, 392, 349, 330, 294, 330, 349, 392, 349],
      durations: [0.3, 0.3, 0.6, 0.3, 0.3, 0.3, 0.3, 0.6, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.6, 0.6],
      tempo: 130
    }
  ];

  init(): void {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);

      this.bgmGain = this.audioContext.createGain();
      this.bgmGain.gain.value = 0.15;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.3;
      this.sfxGain.connect(this.masterGain);
    }
  }

  playSound(type: SoundType): void {
    if (!this.audioContext || !this.sfxGain) return;

    const now = this.audioContext.currentTime;

    switch (type) {
      case 'hit':
        this.playHitSound(now);
        break;
      case 'punch':
        this.playPunchSound(now);
        break;
      case 'kick':
        this.playKickSound(now);
        break;
      case 'special':
        this.playSpecialSound(now);
        break;
      case 'jump':
        this.playJumpSound(now);
        break;
      case 'hurt':
        this.playHurtSound(now);
        break;
      case 'coin':
        this.playCoinSound(now);
        break;
      case 'heal':
        this.playHealSound(now);
        break;
    }
  }

  private playHitSound(now: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const noiseBuffer = this.createNoiseBuffer(0.1);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.1);
  }

  private playPunchSound(now: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);

    const noiseBuffer = this.createNoiseBuffer(0.05);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.05);
  }

  private playKickSound(now: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);

    const noiseBuffer = this.createNoiseBuffer(0.1);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 1;

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.1);
  }

  private playSpecialSound(now: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

    const gain1 = this.audioContext.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const gain2 = this.audioContext.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.3);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(this.sfxGain);

    osc1.start(now);
    osc1.stop(now + 0.5);
    osc2.start(now);
    osc2.stop(now + 0.3);

    const noiseBuffer = this.createNoiseBuffer(0.4);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(2000, now + 0.3);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.4);
  }

  private playJumpSound(now: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playHurtSound(now: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);

    const noiseBuffer = this.createNoiseBuffer(0.15);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noiseSource.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.15);
  }

  private playCoinSound(now: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);

    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318, now);

    const gain1 = this.audioContext.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    const gain2 = this.audioContext.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.sfxGain);
    gain2.connect(this.sfxGain);

    osc1.start(now);
    osc1.stop(now + 0.1);
    osc2.start(now);
    osc2.stop(now + 0.2);
  }

  private playHealSound(now: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523, now);
    osc1.frequency.setValueAtTime(659, now + 0.1);
    osc1.frequency.setValueAtTime(784, now + 0.2);

    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(784, now);
    osc2.frequency.setValueAtTime(988, now + 0.1);
    osc2.frequency.setValueAtTime(1175, now + 0.2);

    const gain1 = this.audioContext.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const gain2 = this.audioContext.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.sfxGain);
    gain2.connect(this.sfxGain);

    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now);
    osc2.stop(now + 0.4);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.audioContext) {
      return new AudioBuffer({ length: 1, sampleRate: 44100 });
    }

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  playBGM(levelIndex: number): void {
    if (!this.audioContext || !this.bgmGain) return;

    this.stopBGM();

    const bgmIndex = levelIndex % this.BGM_DATA.length;
    this.currentBGMIndex = bgmIndex;
    this.isPlaying = true;

    const bgmData = this.BGM_DATA[bgmIndex];
    const noteDuration = 60 / bgmData.tempo;

    this.playBGMSequence(bgmData, noteDuration, 0);
  }

  private playBGMSequence(bgmData: BGMData, noteDuration: number, noteIndex: number): void {
    if (!this.audioContext || !this.bgmGain || !this.isPlaying) return;

    if (noteIndex >= bgmData.notes.length) {
      this.playBGMSequence(bgmData, noteDuration, 0);
      return;
    }

    const now = this.audioContext.currentTime;
    const frequency = bgmData.notes[noteIndex];
    const duration = bgmData.durations[noteIndex] * noteDuration;

    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(now);
    osc.stop(now + duration);

    this.bgmOscillators.push(osc);

    const bassFreq = frequency / 2;
    const bassOsc = this.audioContext.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(bassFreq, now);

    const bassGain = this.audioContext.createGain();
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(this.bgmGain);

    bassOsc.start(now);
    bassOsc.stop(now + duration);

    this.bgmOscillators.push(bassOsc);

    this.bgmTimeout = window.setTimeout(() => {
      if (this.isPlaying) {
        this.playBGMSequence(bgmData, noteDuration, noteIndex + 1);
      }
    }, duration * 1000);
  }

  stopBGM(): void {
    this.isPlaying = false;

    if (this.bgmTimeout !== null) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }

    this.bgmOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // Ignore errors for already stopped oscillators
      }
    });
    this.bgmOscillators = [];

    this.currentBGMIndex = -1;
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(clampedVolume, this.audioContext?.currentTime || 0);
    }
  }

  setSfxVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(clampedVolume, this.audioContext?.currentTime || 0);
    }
  }

  setBgmVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(clampedVolume, this.audioContext?.currentTime || 0);
    }
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }
  }

  get isInitialized(): boolean {
    return this.audioContext !== null;
  }

  get bgmIndex(): number {
    return this.currentBGMIndex;
  }
}

export const audioManager = new AudioManager();
