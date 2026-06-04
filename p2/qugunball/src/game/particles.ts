import type { Vec2, Particle } from './types';
import { RINK } from './types';

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomAngle(): number {
  return Math.random() * Math.PI * 2;
}

const ICE_COLORS = ['#E0F0FF', '#C0E0FF', '#A0D0FF', '#FFFFFF', '#D8EEFF'];
const SPARK_COLORS = ['#FFFF00', '#FFAA00', '#FF6600', '#FFFFFF', '#FFDD44'];
const STAR_COLORS = ['#FFD700', '#FFFF00', '#FFFFFF', '#FFE066'];
const CONFETTI_COLORS = ['#FF2D2D', '#2D7BFF', '#FFD700', '#44DD44', '#FF66FF', '#66FFFF', '#FF6600'];
const FIRE_COLORS = ['#FF4400', '#FF6600', '#FF8800', '#FFAA00', '#FFCC00', '#FFFF00'];
const WHIRLWIND_COLORS = ['#88CCFF', '#AAEEFF', '#FFFFFF', '#66AAEE', '#44DDFF'];
const SNOW_COLORS = ['#FFFFFF', '#E8F0FF', '#D0E0FF', '#F0F8FF'];

export class ParticleSystem {
  particles: Particle[] = [];

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      switch (p.type) {
        case 'ice':
          p.vel.x *= 0.95;
          p.vel.y *= 0.95;
          p.size *= 0.98;
          break;
        case 'spark':
          p.vel.x *= 0.92;
          p.vel.y *= 0.92;
          p.size *= 0.96;
          break;
        case 'star':
          p.vel.y -= 0.3 * dt;
          p.vel.x *= 0.98;
          break;
        case 'confetti':
          p.vel.y += 1.5 * dt;
          p.vel.x *= 0.99;
          break;
        case 'fire':
          p.vel.y -= 2.0 * dt;
          p.vel.x += randomRange(-0.5, 0.5) * dt;
          p.size *= 0.97;
          break;
        case 'whirlwind':
          p.rotation += p.rotationSpeed * dt;
          const angle = p.rotation;
          p.vel.x = Math.cos(angle) * 2;
          p.vel.y = Math.sin(angle) * 2;
          p.size *= 0.98;
          break;
        case 'snow':
          p.vel.x += randomRange(-0.3, 0.3) * dt;
          p.vel.x *= 0.99;
          break;
      }

      p.pos.x += p.vel.x * dt * 60;
      p.pos.y += p.vel.y * dt * 60;
      p.rotation += p.rotationSpeed * dt;
    }
  }

  private spawnParticle(opts: Partial<Particle> & { pos: Vec2; type: Particle['type'] }): void {
    const life = opts.life ?? 1.0;
    this.particles.push({
      pos: { x: opts.pos.x, y: opts.pos.y },
      vel: opts.vel ?? { x: 0, y: 0 },
      life,
      maxLife: life,
      type: opts.type,
      size: opts.size ?? 3,
      color: opts.color ?? '#FFFFFF',
      rotation: opts.rotation ?? 0,
      rotationSpeed: opts.rotationSpeed ?? 0,
    });
  }

  spawnIceParticles(pos: Vec2, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = randomAngle();
      const speed = randomRange(1, 4);
      this.spawnParticle({
        pos: { x: pos.x + randomRange(-5, 5), y: pos.y + randomRange(-5, 5) },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: randomRange(0.3, 0.8),
        type: 'ice',
        size: randomRange(2, 5),
        color: ICE_COLORS[Math.floor(Math.random() * ICE_COLORS.length)],
        rotation: randomAngle(),
        rotationSpeed: randomRange(-2, 2),
      });
    }
  }

  spawnSparkParticles(pos: Vec2, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = randomAngle();
      const speed = randomRange(3, 8);
      this.spawnParticle({
        pos: { x: pos.x + randomRange(-3, 3), y: pos.y + randomRange(-3, 3) },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: randomRange(0.2, 0.5),
        type: 'spark',
        size: randomRange(1, 3),
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  spawnStarParticles(pos: Vec2, count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnParticle({
        pos: { x: pos.x + randomRange(-8, 8), y: pos.y - 10 + randomRange(-5, 5) },
        vel: { x: randomRange(-0.5, 0.5), y: randomRange(-1.5, -0.5) },
        life: randomRange(0.8, 1.5),
        type: 'star',
        size: randomRange(3, 6),
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        rotation: randomAngle(),
        rotationSpeed: randomRange(-1, 1),
      });
    }
  }

  spawnConfetti(pos: Vec2, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = randomAngle();
      const speed = randomRange(2, 6);
      this.spawnParticle({
        pos: { x: pos.x + randomRange(-20, 20), y: pos.y + randomRange(-20, 10) },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 3 },
        life: randomRange(1.0, 2.5),
        type: 'confetti',
        size: randomRange(3, 7),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: randomAngle(),
        rotationSpeed: randomRange(-5, 5),
      });
    }
  }

  spawnFireParticles(pos: Vec2, count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnParticle({
        pos: { x: pos.x + randomRange(-6, 6), y: pos.y + randomRange(-4, 4) },
        vel: { x: randomRange(-1, 1), y: randomRange(-3, -1) },
        life: randomRange(0.3, 0.7),
        type: 'fire',
        size: randomRange(4, 9),
        color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
        rotation: 0,
        rotationSpeed: randomRange(-1, 1),
      });
    }
  }

  spawnWhirlwindParticles(pos: Vec2, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.spawnParticle({
        pos: { x: pos.x + Math.cos(angle) * randomRange(5, 15), y: pos.y + Math.sin(angle) * randomRange(5, 15) },
        vel: { x: Math.cos(angle) * 2, y: Math.sin(angle) * 2 },
        life: randomRange(0.5, 1.0),
        type: 'whirlwind',
        size: randomRange(3, 7),
        color: WHIRLWIND_COLORS[Math.floor(Math.random() * WHIRLWIND_COLORS.length)],
        rotation: angle,
        rotationSpeed: randomRange(4, 8),
      });
    }
  }

  spawnSnowParticles(count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnParticle({
        pos: { x: randomRange(0, RINK.width), y: randomRange(-10, 0) },
        vel: { x: randomRange(-0.3, 0.3), y: randomRange(0.5, 1.5) },
        life: randomRange(3, 6),
        type: 'snow',
        size: randomRange(1, 3),
        color: SNOW_COLORS[Math.floor(Math.random() * SNOW_COLORS.length)],
        rotation: 0,
        rotationSpeed: randomRange(-0.5, 0.5),
      });
    }
  }
}
