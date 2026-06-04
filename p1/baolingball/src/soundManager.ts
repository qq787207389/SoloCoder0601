export class SoundManager {
  private audioContext: AudioContext | null = null;

  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playStrike(): void {
    this.initAudioContext();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    for (let i = 0; i < 8; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.frequency.value = 200 + Math.random() * 400;
      osc.type = 'square';
      
      gain.gain.setValueAtTime(0.15, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.2);
    }

    const applause = this.audioContext.createBufferSource();
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 1.5, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
    }
    
    applause.buffer = buffer;
    const applauseGain = this.audioContext.createGain();
    applauseGain.gain.value = 0.08;
    applause.connect(applauseGain);
    applauseGain.connect(this.audioContext.destination);
    applause.start(now + 0.3);
  }

  playPinHit(): void {
    this.initAudioContext();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.frequency.value = 800 + Math.random() * 600;
    osc.type = 'triangle';
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playBallRelease(): void {
    this.initAudioContext();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playGutter(): void {
    this.initAudioContext();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.frequency.value = 100;
    osc.type = 'sawtooth';
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playSpare(): void {
    this.initAudioContext();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.frequency.value = 523 * Math.pow(2, i / 12);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.15, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    }
  }
}
