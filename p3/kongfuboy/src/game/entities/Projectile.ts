import { COLORS } from '../constants';
import type { Hitbox } from './Character';

export enum ProjectileType {
  DART = 'DART',
  ARROW = 'ARROW',
  QI_WAVE = 'QI_WAVE'
}

interface ProjectileConfig {
  width: number;
  height: number;
  speed: number;
  damage: number;
  lifetime: number;
  color: string;
}

export class Projectile {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  active: boolean;
  projectileType: ProjectileType;
  facing: 1 | -1;
  config: ProjectileConfig;
  rotation: number;

  constructor(x: number, y: number, direction: 1 | -1, type: ProjectileType) {
    this.projectileType = type;
    this.config = Projectile.getConfigByType(type);

    this.x = x;
    this.y = y;
    this.width = this.config.width;
    this.height = this.config.height;
    this.facing = direction;
    this.velocityX = direction * this.config.speed;
    this.velocityY = 0;
    this.damage = this.config.damage;
    this.lifetime = this.config.lifetime;
    this.maxLifetime = this.config.lifetime;
    this.active = true;
    this.rotation = 0;
  }

  private static getConfigByType(type: ProjectileType): ProjectileConfig {
    const configs: Record<ProjectileType, ProjectileConfig> = {
      [ProjectileType.DART]: {
        width: 20,
        height: 8,
        speed: 12,
        damage: 12,
        lifetime: 180,
        color: '#2F2F2F'
      },
      [ProjectileType.ARROW]: {
        width: 45,
        height: 6,
        speed: 15,
        damage: 20,
        lifetime: 240,
        color: '#8B4513'
      },
      [ProjectileType.QI_WAVE]: {
        width: 60,
        height: 60,
        speed: 8,
        damage: 35,
        lifetime: 150,
        color: '#4A90D9'
      }
    };
    return configs[type];
  }

  update(dt: number): void {
    if (!this.active) return;

    const timeScale = Math.min(dt / 16.67, 2);

    this.x += this.velocityX * timeScale;
    this.y += this.velocityY * timeScale;

    this.lifetime--;

    if (this.projectileType === ProjectileType.DART) {
      this.rotation += 0.3;
    }

    if (this.projectileType === ProjectileType.QI_WAVE) {
      this.width += 0.5;
      this.height += 0.5;
    }

    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D, scale: number): void {
    if (!this.active) return;

    const scaledX = this.x * scale;
    const scaledY = this.y * scale;
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;

    ctx.save();

    const alpha = this.lifetime < 30 ? this.lifetime / 30 : 1;
    ctx.globalAlpha = alpha;

    switch (this.projectileType) {
      case ProjectileType.DART:
        this.drawDart(ctx, scaledX, scaledY, scaledWidth, scaledHeight);
        break;
      case ProjectileType.ARROW:
        this.drawArrow(ctx, scaledX, scaledY, scaledWidth, scaledHeight);
        break;
      case ProjectileType.QI_WAVE:
        this.drawQiWave(ctx, scaledX, scaledY, scaledWidth, scaledHeight);
        break;
    }

    ctx.restore();
  }

  private drawDart(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(this.rotation);

    ctx.fillStyle = this.config.color;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2 - h, -h / 2);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 2 - h, h / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.ANCIENT_GOLD;
    ctx.fillRect(-w / 2, -h / 4, w / 3, h / 2);
  }

  private drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = this.config.color;
    ctx.fillRect(x, y + h * 0.3, w * 0.7, h * 0.4);

    ctx.fillStyle = COLORS.INK_BLACK;
    ctx.beginPath();
    if (this.facing === 1) {
      ctx.moveTo(x + w * 0.7, y - h * 0.3);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w * 0.7, y + h * 1.3);
    } else {
      ctx.moveTo(x + w * 0.3, y - h * 0.3);
      ctx.lineTo(x, y + h / 2);
      ctx.lineTo(x + w * 0.3, y + h * 1.3);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.CHINA_RED;
    const featherX = this.facing === 1 ? x : x + w * 0.85;
    ctx.beginPath();
    ctx.moveTo(featherX, y);
    ctx.lineTo(featherX - this.facing * w * 0.15, y - h * 0.5);
    ctx.lineTo(featherX, y + h);
    ctx.lineTo(featherX - this.facing * w * 0.15, y + h * 1.5);
    ctx.closePath();
    ctx.fill();
  }

  private drawQiWave(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const gradient = ctx.createRadialGradient(
      x + w / 2, y + h / 2, 0,
      x + w / 2, y + h / 2, w / 2
    );
    gradient.addColorStop(0, 'rgba(74, 144, 217, 0.9)');
    gradient.addColorStop(0.5, 'rgba(74, 144, 217, 0.5)');
    gradient.addColorStop(1, 'rgba(74, 144, 217, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.KI_FILL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `${w * 0.4}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('气', x + w / 2, y + h / 2);
  }

  checkCollision(target: { getBodyBox: () => Hitbox }): boolean {
    if (!this.active) return false;

    const targetBox = target.getBodyBox();
    const projectileBox = this.getHitbox();

    return (
      projectileBox.x < targetBox.x + targetBox.width &&
      projectileBox.x + projectileBox.width > targetBox.x &&
      projectileBox.y < targetBox.y + targetBox.height &&
      projectileBox.y + projectileBox.height > targetBox.y
    );
  }

  getHitbox(): Hitbox {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  isActive(): boolean {
    return this.active;
  }

  deactivate(): void {
    this.active = false;
  }

  getDamage(): number {
    return this.damage;
  }

  getDirection(): 1 | -1 {
    return this.facing;
  }

  getKnockback(): number {
    const knockbacks: Record<ProjectileType, number> = {
      [ProjectileType.DART]: 3,
      [ProjectileType.ARROW]: 6,
      [ProjectileType.QI_WAVE]: 12
    };
    return knockbacks[this.projectileType];
  }
}
