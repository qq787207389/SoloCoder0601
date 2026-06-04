export interface Offset {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'hit' | 'sakura' | 'dust' | 'qi';
  rotation?: number;
  rotationSpeed?: number;
}

interface AfterImageFrame {
  x: number;
  y: number;
  frame: number;
  facing: 1 | -1;
  alpha: number;
}

export class ScreenShake {
  private intensity: number = 0;
  private duration: number = 0;
  private time: number = 0;

  update(dt: number): Offset {
    if (this.time <= 0) return { x: 0, y: 0 };
    
    this.time -= dt;
    const currentIntensity = this.intensity * (this.time / this.duration);
    
    return {
      x: (Math.random() - 0.5) * 2 * currentIntensity,
      y: (Math.random() - 0.5) * 2 * currentIntensity
    };
  }

  shake(intensity: number, duration: number): void {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
    this.time = duration;
  }
}

export class AfterImage {
  private frames: AfterImageFrame[] = [];
  private maxFrames: number;
  private fadeRate: number;

  constructor(maxFrames: number = 8, fadeRate: number = 0.12) {
    this.maxFrames = maxFrames;
    this.fadeRate = fadeRate;
  }

  addFrame(x: number, y: number, frame: number, facing: 1 | -1): void {
    this.frames.unshift({ x, y, frame, facing, alpha: 1 });
    if (this.frames.length > this.maxFrames) {
      this.frames.pop();
    }
  }

  update(dt: number): void {
    for (let i = 0; i < this.frames.length; i++) {
      this.frames[i].alpha -= this.fadeRate * dt;
    }
    this.frames = this.frames.filter(f => f.alpha > 0);
  }

  render(ctx: CanvasRenderingContext2D, scale: number, renderFrame: (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, facing: 1 | -1, scale: number) => void): void {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const f = this.frames[i];
      ctx.globalAlpha = f.alpha * 0.5;
      renderFrame(ctx, f.x, f.y, f.frame, f.facing, scale);
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.frames = [];
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 300;

  spawnHitParticles(x: number, y: number, color: string = '#FFD700'): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      this.addParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        size: 2 + Math.random() * 3,
        color,
        type: 'hit'
      });
    }
  }

  spawnSakuraParticles(count: number = 20): void {
    for (let i = 0; i < count; i++) {
      this.addParticle({
        x: Math.random() * 1280,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 1,
        vy: 0.5 + Math.random() * 1.5,
        life: 8 + Math.random() * 4,
        maxLife: 12,
        size: 4 + Math.random() * 4,
        color: `hsl(${340 + Math.random() * 20}, ${70 + Math.random() * 20}%, ${70 + Math.random() * 15}%)`,
        type: 'sakura',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 2
      });
    }
  }

  spawnDustParticles(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      this.addParticle({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -1 - Math.random() * 2,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        size: 3 + Math.random() * 4,
        color: '#8B7355',
        type: 'dust'
      });
    }
  }

  spawnQiParticles(x: number, y: number, radius: number): void {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      this.addParticle({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * (1 + Math.random() * 2),
        vy: Math.sin(angle) * (1 + Math.random() * 2) - 1,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        size: 4 + Math.random() * 6,
        color: `rgba(100, 200, 255, ${0.6 + Math.random() * 0.4})`,
        type: 'qi'
      });
    }
  }

  private addParticle(particle: Particle): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push(particle);
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;

      if (p.type === 'sakura') {
        p.vx += (Math.random() - 0.5) * 0.1;
        if (p.rotationSpeed !== undefined && p.rotation !== undefined) {
          p.rotation += p.rotationSpeed * dt;
        }
      } else if (p.type === 'dust') {
        p.vy += 0.1;
      } else if (p.type === 'qi') {
        p.vx *= 0.98;
        p.vy *= 0.98;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;

      if (p.type === 'sakura' && p.rotation !== undefined) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? p.size : p.size * 0.5;
          if (i === 0) {
            ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          } else {
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'qi') {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.particles = [];
  }
}

export class SpeedLines {
  private active: boolean = false;
  private duration: number = 0;
  private time: number = 0;
  private lines: Array<{ x: number; y: number; width: number; speed: number }> = [];
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number = 1280, canvasHeight: number = 720) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.initLines();
  }

  private initLines(): void {
    for (let i = 0; i < 30; i++) {
      this.lines.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        width: 30 + Math.random() * 80,
        speed: 15 + Math.random() * 25
      });
    }
  }

  activate(duration: number): void {
    this.active = true;
    this.duration = duration;
    this.time = duration;
  }

  update(dt: number): void {
    if (!this.active) return;

    this.time -= dt;
    if (this.time <= 0) {
      this.active = false;
      return;
    }

    for (const line of this.lines) {
      line.x -= line.speed * dt * 60;
      if (line.x < -line.width) {
        line.x = this.canvasWidth + Math.random() * 100;
        line.y = Math.random() * this.canvasHeight;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const alpha = Math.min(1, this.time / this.duration * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.lineWidth = 2;

    for (const line of this.lines) {
      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      ctx.lineTo(line.x + line.width, line.y);
      ctx.stroke();
    }
  }
}

export class BlackWhiteEffect {
  private active: boolean = false;
  private duration: number = 0;
  private time: number = 0;
  private fadeIn: number = 0.1;
  private fadeOut: number = 0.3;

  activate(duration: number): void {
    this.active = true;
    this.duration = duration;
    this.time = duration;
  }

  update(dt: number): void {
    if (!this.active) return;
    
    this.time -= dt;
    if (this.time <= 0) {
      this.active = false;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  getTransition(): number {
    if (!this.active) return 0;
    
    const elapsed = this.duration - this.time;
    if (elapsed < this.fadeIn) {
      return elapsed / this.fadeIn;
    } else if (this.time < this.fadeOut) {
      return this.time / this.fadeOut;
    }
    return 1;
  }

  apply(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const transition = this.getTransition();
    if (transition <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `rgba(0, 0, 0, ${transition})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

export class GlowEffect {
  private time: number = 0;
  private pulseSpeed: number = 3;
  private minIntensity: number = 0.3;
  private maxIntensity: number = 0.8;

  update(dt: number): void {
    this.time += dt;
  }

  render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const intensity = this.minIntensity + (this.maxIntensity - this.minIntensity) * 
      (0.5 + 0.5 * Math.sin(this.time * this.pulseSpeed));
    
    const gradient = ctx.createRadialGradient(
      x + width / 2, y + height / 2, 0,
      x + width / 2, y + height / 2, Math.max(width, height) * 1.5
    );
    gradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.5})`);
    gradient.addColorStop(0.5, `rgba(255, 180, 0, ${intensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, Math.max(width, height) * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 215, 0, ${intensity})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 4, y - 4, width + 8, height + 8);
  }
}
