import { ItemType } from '../types';
import { COLORS } from '../constants';
import type { Player } from './Player';

export interface ItemData {
  type: ItemType;
  value: number;
  lifeTime: number;
}

export const ITEM_CONFIG: Record<ItemType, ItemData> = {
  [ItemType.MANTOU]: {
    type: ItemType.MANTOU,
    value: 30,
    lifeTime: 10
  },
  [ItemType.TEA]: {
    type: ItemType.TEA,
    value: 50,
    lifeTime: 10
  },
  [ItemType.COIN]: {
    type: ItemType.COIN,
    value: 100,
    lifeTime: 10
  }
};

export class Item {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ItemType;
  value: number;
  lifeTime: number;
  maxLifeTime: number;
  isPickedUp: boolean;

  private floatOffset: number;
  private floatSpeed: number;
  private baseY: number;
  private blinkTimer: number;
  private isVisible: boolean;

  constructor(x: number, y: number, type: ItemType) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.width = 30;
    this.height = 30;
    this.type = type;

    const config = ITEM_CONFIG[type];
    this.value = config.value;
    this.lifeTime = config.lifeTime;
    this.maxLifeTime = config.lifeTime;

    this.isPickedUp = false;
    this.floatOffset = 0;
    this.floatSpeed = 2 + Math.random() * 2;
    this.blinkTimer = 0;
    this.isVisible = true;
  }

  update(dt: number): void {
    if (this.isPickedUp) return;

    this.lifeTime -= dt;

    this.floatOffset += this.floatSpeed * dt;
    this.y = this.baseY + Math.sin(this.floatOffset) * 5;

    if (this.lifeTime < 3) {
      this.blinkTimer += dt;
      if (this.blinkTimer >= 0.2) {
        this.blinkTimer = 0;
        this.isVisible = !this.isVisible;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, scale: number): void {
    if (this.isPickedUp || !this.isVisible) return;

    const scaledX = this.x * scale;
    const scaledY = this.y * scale;
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;

    ctx.save();
    ctx.shadowColor = this.getGlowColor();
    ctx.shadowBlur = 15 * scale;

    this.drawItem(ctx, scaledX, scaledY, scaledWidth, scaledHeight);

    ctx.restore();
  }

  private getGlowColor(): string {
    switch (this.type) {
      case ItemType.MANTOU:
        return 'rgba(255, 248, 225, 0.8)';
      case ItemType.TEA:
        return 'rgba(76, 175, 80, 0.8)';
      case ItemType.COIN:
        return 'rgba(255, 215, 0, 0.8)';
      default:
        return 'rgba(255, 255, 255, 0.5)';
    }
  }

  private drawItem(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    switch (this.type) {
      case ItemType.MANTOU:
        ctx.fillStyle = '#FFF8E1';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFE0B2';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - h * 0.1, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - w * 0.3, centerY);
        ctx.quadraticCurveTo(centerX, centerY - h * 0.15, centerX + w * 0.3, centerY);
        ctx.stroke();
        break;

      case ItemType.TEA:
        ctx.fillStyle = '#8D6E63';
        const cupWidth = w * 0.8;
        const cupHeight = h * 0.6;
        const cupX = x + (w - cupWidth) / 2;
        const cupY = y + h * 0.35;

        ctx.beginPath();
        ctx.moveTo(cupX, cupY);
        ctx.lineTo(cupX + cupWidth * 0.15, cupY + cupHeight);
        ctx.lineTo(cupX + cupWidth * 0.85, cupY + cupHeight);
        ctx.lineTo(cupX + cupWidth, cupY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.ellipse(centerX, cupY, cupWidth / 2, cupHeight * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#81C784';
        ctx.beginPath();
        ctx.ellipse(centerX, cupY, cupWidth * 0.35, cupHeight * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cupX + cupWidth + 3, centerY, 5, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const steamX = centerX + (i - 1) * 6;
          const steamY = y + h * 0.25 - Math.sin(this.floatOffset * 2 + i) * 3;
          ctx.beginPath();
          ctx.moveTo(steamX, steamY + 5);
          ctx.quadraticCurveTo(steamX + 2, steamY, steamX, steamY - 5);
          ctx.stroke();
        }
        break;

      case ItemType.COIN:
        const gradient = ctx.createRadialGradient(centerX - w * 0.15, centerY - h * 0.15, 0, centerX, centerY, w / 2);
        gradient.addColorStop(0, '#FFEB3B');
        gradient.addColorStop(0.5, '#FFC107');
        gradient.addColorStop(1, '#FF8F00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, w / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#E65100';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, w / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#E65100';
        ctx.font = `bold ${Math.floor(w * 0.5)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', centerX, centerY + 1);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX - w * 0.15, centerY - h * 0.2, w * 0.15, h * 0.1, -0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  checkPickup(character: Player): boolean {
    if (this.isPickedUp || !this.isActive()) return false;

    const charBox = character.getBodyBox();
    const collision = (
      this.x < charBox.x + charBox.width &&
      this.x + this.width > charBox.x &&
      this.y < charBox.y + charBox.height &&
      this.y + this.height > charBox.y
    );

    return collision;
  }

  applyEffect(character: Player): void {
    if (this.isPickedUp) return;

    this.isPickedUp = true;

    switch (this.type) {
      case ItemType.MANTOU:
        character.health = Math.min(character.maxHealth, character.health + this.value);
        break;
      case ItemType.TEA:
        character.ki = Math.min(character.maxKi, character.ki + this.value);
        break;
      case ItemType.COIN:
        break;
    }
  }

  getScoreValue(): number {
    return this.type === ItemType.COIN ? this.value : 0;
  }

  isActive(): boolean {
    return !this.isPickedUp && this.lifeTime > 0;
  }

  getType(): ItemType {
    return this.type;
  }
}
