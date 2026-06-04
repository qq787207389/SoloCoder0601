import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants';
import { PlayerEntity } from '../entities/Player';
import { BoxEntity, AppleEntity } from '../entities/Carryables';
import { EnemyEntity } from '../entities/Enemy';
import { ItemEntity } from '../entities/Item';
import { Platform } from '../types/game';
import { EnemyState, EnemyType, ItemType, PlayerState } from '../types/game';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cameraX: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.cameraX = 0;
  }

  clear(): void {
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  updateCamera(players: PlayerEntity[], levelWidth: number): void {
    const activePlayers = players.filter(p => p.isActive);
    if (activePlayers.length === 0) return;

    const avgX = activePlayers.reduce((sum, p) => sum + p.position.x, 0) / activePlayers.length;
    const targetX = avgX - CANVAS_WIDTH / 2;
    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraX = Math.max(0, Math.min(this.cameraX, levelWidth - CANVAS_WIDTH));
  }

  drawBackground(backgroundType: string): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    
    switch (backgroundType) {
      case 'treehouse':
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98D8C8');
        gradient.addColorStop(1, '#7CB342');
        break;
      case 'garden':
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#B2EBF2');
        gradient.addColorStop(1, '#A5D6A7');
        break;
      case 'attic':
        gradient.addColorStop(0, '#5D4037');
        gradient.addColorStop(0.5, '#795548');
        gradient.addColorStop(1, '#6D4C41');
        break;
      default:
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#90CAF9');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawBackgroundDecorations(backgroundType);
  }

  private drawBackgroundDecorations(type: string): void {
    if (type === 'treehouse' || type === 'garden') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 300 - this.cameraX * 0.3) % (CANVAS_WIDTH + 200)) - 100;
        const y = 50 + i * 30;
        this.drawCloud(x, y, 40 + i * 10);
      }
    }

    if (type === 'attic') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let i = 0; i < 10; i++) {
        const x = ((i * 200 - this.cameraX * 0.5) % (CANVAS_WIDTH + 100)) - 50;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x + 40, 0);
        this.ctx.lineTo(x + 20, 100);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }

  private drawCloud(x: number, y: number, size: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.35, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawPlatforms(platforms: Platform[]): void {
    for (const platform of platforms) {
      const x = platform.x - this.cameraX;
      
      if (x + platform.width < 0 || x > CANVAS_WIDTH) continue;

      if (platform.type === 'ground') {
        const groundGradient = this.ctx.createLinearGradient(x, platform.y, x, platform.y + platform.height);
        groundGradient.addColorStop(0, '#8B4513');
        groundGradient.addColorStop(0.3, '#654321');
        groundGradient.addColorStop(1, '#3E2723');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(x, platform.y, platform.width, platform.height);
        
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(x, platform.y, platform.width, 8);
        
        this.ctx.fillStyle = '#32CD32';
        for (let i = 0; i < platform.width; i += 12) {
          const grassHeight = 4 + Math.sin(i * 0.5) * 3;
          this.ctx.fillRect(x + i, platform.y - grassHeight, 4, grassHeight + 4);
        }
      } else {
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(x, platform.y, platform.width, platform.height);
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, platform.y + platform.height - 4, platform.width, 4);
        
        this.ctx.fillStyle = '#CD853F';
        this.ctx.fillRect(x, platform.y, platform.width, 4);
        
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        for (let i = 0; i < platform.width; i += 20) {
          this.ctx.fillRect(x + i, platform.y + 6, 2, platform.height - 10);
        }
      }
    }
  }

  drawPlayer(player: PlayerEntity): void {
    if (!player.isActive) return;

    const x = player.position.x - this.cameraX;
    const y = player.position.y;

    if (x + player.width < 0 || x > CANVAS_WIDTH) return;

    if (player.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    this.ctx.save();
    
    const shakeX = player.shakeAmount > 0 ? (Math.random() - 0.5) * player.shakeAmount : 0;
    const shakeY = player.shakeAmount > 0 ? (Math.random() - 0.5) * player.shakeAmount : 0;
    
    this.ctx.translate(x + player.width / 2 + shakeX, y + player.height / 2 + shakeY);
    
    if (player.direction === -1) {
      this.ctx.scale(-1, 1);
    }

    if (player.state === PlayerState.BEING_CARRIED) {
      this.ctx.rotate(Math.sin(Date.now() / 100) * 0.3);
    }

    this.drawSquirrel(player);

    this.ctx.restore();
    this.ctx.globalAlpha = 1;

    if (player.state === PlayerState.BEING_CARRIED) {
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.textAlign = 'center';
      const text = '咿——';
      const textX = x + player.width / 2;
      const textY = y - 20 + Math.sin(Date.now() / 200) * 5;
      this.ctx.fillText(text, textX, textY);
      
      this.ctx.strokeStyle = '#FF6B00';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(text, textX, textY);
    }
  }

  private drawSquirrel(player: PlayerEntity): void {
    const w = player.width;
    const h = player.height;
    const color = player.color;
    const colorLight = player.colorLight;

    this.ctx.save();
    this.ctx.rotate(player.tailAngle);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.ellipse(-w * 0.3, -h * 0.1, w * 0.35, h * 0.4, 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = colorLight;
    this.ctx.beginPath();
    this.ctx.ellipse(-w * 0.25, -h * 0.15, w * 0.15, h * 0.2, 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.ellipse(0, h * 0.1, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFE4C4';
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.05, h * 0.15, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(w * 0.2, -h * 0.15, w * 0.28, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = colorLight;
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.1, -h * 0.35, w * 0.08, h * 0.12, -0.3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.3, -h * 0.35, w * 0.08, h * 0.12, 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFB6C1';
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.1, -h * 0.33, w * 0.04, h * 0.06, -0.3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.3, -h * 0.33, w * 0.04, h * 0.06, 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFE4C4';
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.25, -h * 0.1, w * 0.12, h * 0.1, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(w * 0.15, -h * 0.18, w * 0.06, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(w * 0.32, -h * 0.18, w * 0.06, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(w * 0.17, -h * 0.2, w * 0.02, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(w * 0.34, -h * 0.2, w * 0.02, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(w * 0.4, -h * 0.12, w * 0.04, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(w * 0.35, -h * 0.05, w * 0.06, 0.2, Math.PI - 0.2);
    this.ctx.stroke();

    const legOffset = player.state === PlayerState.WALKING ? Math.sin(player.animFrame * Math.PI / 2) * 4 : 0;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(-w * 0.15, h * 0.3, w * 0.15, h * 0.2 + legOffset);
    this.ctx.fillRect(w * 0.1, h * 0.3, w * 0.15, h * 0.2 - legOffset);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(w * 0.05, h * 0.05, w * 0.12, h * 0.15);
  }

  drawBox(box: BoxEntity): void {
    if (!box.isActive || box.isCarried) return;

    const x = box.position.x - this.cameraX;
    const y = box.position.y;

    if (x + box.width < 0 || x > CANVAS_WIDTH) return;

    this.ctx.fillStyle = COLORS.box;
    this.ctx.fillRect(x, y, box.width, box.height);

    this.ctx.fillStyle = COLORS.boxLight;
    this.ctx.fillRect(x + 2, y + 2, box.width - 4, 4);
    this.ctx.fillRect(x + 2, y + 2, 4, box.height - 4);

    this.ctx.fillStyle = '#5D3A1A';
    this.ctx.fillRect(x + 2, y + box.height - 4, box.width - 4, 4);
    this.ctx.fillRect(x + box.width - 4, y + 2, 4, box.height - 4);

    this.ctx.strokeStyle = 'rgba(93, 58, 26, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + box.width / 2, y + 4);
    this.ctx.lineTo(x + box.width / 2, y + box.height - 4);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x + 4, y + box.height / 2);
    this.ctx.lineTo(x + box.width - 4, y + box.height / 2);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(x + 4, y + 4, 6, 6);
  }

  drawApple(apple: AppleEntity): void {
    if (!apple.isActive || apple.isCarried) return;

    const x = apple.position.x - this.cameraX;
    const y = apple.position.y + Math.sin(Date.now() / 300 + apple.bobOffset) * 3;

    if (x + apple.width < 0 || x > CANVAS_WIDTH) return;

    const centerX = x + apple.width / 2;
    const centerY = y + apple.height / 2;
    const radius = apple.width / 2;

    this.ctx.fillStyle = COLORS.apple;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.appleLeaf;
    this.ctx.beginPath();
    this.ctx.ellipse(centerX + 3, centerY - radius - 2, 6, 4, 0.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#5D4037';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - radius + 2);
    this.ctx.lineTo(centerX, centerY - radius - 4);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawEnemy(enemy: EnemyEntity): void {
    if (!enemy.isActive) return;

    const x = enemy.position.x - this.cameraX;
    const y = enemy.position.y;

    if (x + enemy.width < 0 || x > CANVAS_WIDTH) return;

    this.ctx.save();
    this.ctx.translate(x + enemy.width / 2, y + enemy.height / 2);
    
    if (enemy.direction === -1) {
      this.ctx.scale(-1, 1);
    }

    if (enemy.state === EnemyState.STUNNED) {
      this.ctx.rotate(Math.sin(Date.now() / 100) * 0.2);
    }

    switch (enemy.type) {
      case EnemyType.SNAIL:
        this.drawSnail(enemy);
        break;
      case EnemyType.BEE:
        this.drawBee(enemy);
        break;
      case EnemyType.ROBOT:
        this.drawRobot(enemy);
        break;
    }

    this.ctx.restore();

    if (enemy.state === EnemyState.STUNNED && enemy.stunStars) {
      for (const star of enemy.stunStars) {
        const starX = x + enemy.width / 2 + Math.cos(star.angle) * star.dist;
        const starY = y - 5 + Math.sin(star.angle) * star.dist * 0.5;
        this.drawStar(starX, starY, 6, '#FFD700');
      }
    }
  }

  private drawSnail(enemy: EnemyEntity): void {
    const w = enemy.width;
    const h = enemy.height;

    this.ctx.fillStyle = '#FFB347';
    this.ctx.beginPath();
    this.ctx.ellipse(0, h * 0.2, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#E67E22';
    this.ctx.beginPath();
    this.ctx.arc(w * 0.1, 0, w * 0.35, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#D35400';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(w * 0.1, 0, w * 0.25, 0, Math.PI * 1.5);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(w * 0.1, 0, w * 0.15, 0, Math.PI * 1.5);
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFB347';
    this.ctx.beginPath();
    this.ctx.ellipse(-w * 0.25, h * 0.1, w * 0.1, h * 0.15, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#FFB347';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(-w * 0.25, 0);
    this.ctx.lineTo(-w * 0.3, -h * 0.2);
    this.ctx.stroke();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(-w * 0.3, -h * 0.2, 2, 0, Math.PI * 2);
    this.ctx.fill();

    if (enemy.state === EnemyState.STUNNED) {
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(-w * 0.35, -h * 0.25);
      this.ctx.lineTo(-w * 0.25, -h * 0.15);
      this.ctx.moveTo(-w * 0.25, -h * 0.25);
      this.ctx.lineTo(-w * 0.35, -h * 0.15);
      this.ctx.stroke();
    }
  }

  private drawBee(enemy: EnemyEntity): void {
    const w = enemy.width;
    const h = enemy.height;
    const wingFlap = Math.sin(Date.now() / 30) * 0.3;

    this.ctx.fillStyle = 'rgba(200, 230, 255, 0.7)';
    this.ctx.beginPath();
    this.ctx.ellipse(-w * 0.1, -h * 0.3 - wingFlap * 10, w * 0.3, h * 0.25, -0.3 + wingFlap, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.1, -h * 0.3 - wingFlap * 10, w * 0.3, h * 0.25, 0.3 - wingFlap, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(-w * 0.3, -h * 0.1, w * 0.1, h * 0.2);
    this.ctx.fillRect(-w * 0.05, -h * 0.1, w * 0.1, h * 0.2);
    this.ctx.fillRect(w * 0.2, -h * 0.1, w * 0.1, h * 0.2);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(w * 0.35, 0, w * 0.2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(w * 0.4, -h * 0.05, w * 0.06, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.3, -h * 0.15);
    this.ctx.lineTo(w * 0.25, -h * 0.3);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.4, -h * 0.15);
    this.ctx.lineTo(w * 0.45, -h * 0.3);
    this.ctx.stroke();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.moveTo(-w * 0.35, h * 0.1);
    this.ctx.lineTo(-w * 0.5, h * 0.2);
    this.ctx.lineTo(-w * 0.35, h * 0.15);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawRobot(enemy: EnemyEntity): void {
    const w = enemy.width;
    const h = enemy.height;

    this.ctx.fillStyle = '#708090';
    this.ctx.fillRect(-w * 0.35, -h * 0.3, w * 0.7, h * 0.5);

    this.ctx.fillStyle = '#4A5568';
    this.ctx.fillRect(-w * 0.35, h * 0.15, w * 0.25, h * 0.2);
    this.ctx.fillRect(w * 0.1, h * 0.15, w * 0.25, h * 0.2);

    this.ctx.fillStyle = '#2D3748';
    this.ctx.beginPath();
    this.ctx.arc(-w * 0.22, h * 0.35, w * 0.12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(w * 0.22, h * 0.35, w * 0.12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#A0AEC0';
    this.ctx.fillRect(-w * 0.25, -h * 0.45, w * 0.5, h * 0.2);

    const eyeColor = enemy.state === EnemyState.STUNNED ? '#FF0000' : '#00FF00';
    this.ctx.fillStyle = eyeColor;
    this.ctx.fillRect(-w * 0.15, -h * 0.4, w * 0.1, h * 0.08);
    this.ctx.fillRect(w * 0.05, -h * 0.4, w * 0.1, h * 0.08);

    this.ctx.strokeStyle = '#A0AEC0';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -h * 0.45);
    this.ctx.lineTo(0, -h * 0.6);
    this.ctx.stroke();

    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.arc(0, -h * 0.6, w * 0.06, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#4A5568';
    this.ctx.fillRect(w * 0.3, -h * 0.2, w * 0.15, h * 0.3);

    this.ctx.fillStyle = '#2D3748';
    this.ctx.fillRect(w * 0.35, h * 0.05, w * 0.15, h * 0.1);
    this.ctx.fillRect(w * 0.35, h * 0.05, w * 0.05, h * 0.2);
    this.ctx.fillRect(w * 0.45, h * 0.05, w * 0.05, h * 0.2);
  }

  private drawStar(x: number, y: number, size: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawItem(item: ItemEntity): void {
    if (!item.isActive || item.collected) return;

    const x = item.position.x - this.cameraX;
    const y = item.position.y + item.getBobAmount();

    if (x + item.width < 0 || x > CANVAS_WIDTH) return;

    const centerX = x + item.width / 2;
    const centerY = y + item.height / 2;

    this.ctx.save();

    if (item.type === ItemType.STAR) {
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(item.rotationAngle);
      this.drawStar(0, 0, item.width / 2, '#FFD700');
      this.drawStar(0, 0, item.width / 3, '#FFEB3B');
    } else {
      this.ctx.translate(centerX, centerY);

      switch (item.type) {
        case ItemType.NUT:
          this.ctx.fillStyle = '#8B4513';
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, item.width / 2, item.height / 2, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#654321';
          this.ctx.beginPath();
          this.ctx.ellipse(0, -item.height * 0.2, item.width * 0.35, item.height * 0.2, 0, 0, Math.PI);
          this.ctx.fill();
          break;

        case ItemType.FLOWER:
          this.ctx.strokeStyle = '#228B22';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(0, item.height / 2);
          this.ctx.lineTo(0, 0);
          this.ctx.stroke();

          const petalColors = ['#FF69B4', '#FF1493', '#FF6B6B'];
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = Math.cos(angle) * item.width * 0.3;
            const py = Math.sin(angle) * item.height * 0.3 - 5;
            this.ctx.fillStyle = petalColors[i % 3];
            this.ctx.beginPath();
            this.ctx.ellipse(px, py, item.width * 0.15, item.height * 0.1, angle, 0, Math.PI * 2);
            this.ctx.fill();
          }

          this.ctx.fillStyle = '#FFD700';
          this.ctx.beginPath();
          this.ctx.arc(0, -5, item.width * 0.12, 0, Math.PI * 2);
          this.ctx.fill();
          break;

        case ItemType.LIFE:
          this.ctx.fillStyle = '#FF6B6B';
          this.ctx.beginPath();
          this.ctx.moveTo(0, item.height * 0.2);
          this.ctx.bezierCurveTo(-item.width * 0.5, -item.height * 0.1, -item.width * 0.3, -item.height * 0.4, 0, -item.height * 0.2);
          this.ctx.bezierCurveTo(item.width * 0.3, -item.height * 0.4, item.width * 0.5, -item.height * 0.1, 0, item.height * 0.2);
          this.ctx.fill();

          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          this.ctx.beginPath();
          this.ctx.ellipse(-item.width * 0.15, -item.height * 0.15, item.width * 0.1, item.height * 0.08, -0.5, 0, Math.PI * 2);
          this.ctx.fill();
          break;
      }
    }

    this.ctx.restore();

    if (item.type === ItemType.STAR) {
      const glow = Math.sin(Date.now() / 200) * 0.3 + 0.7;
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 20 * glow;
      this.ctx.fillStyle = `rgba(255, 215, 0, ${glow * 0.3})`;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, item.width * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  drawHUD(players: PlayerEntity[], levelName: string, score: number, flowerCount: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 200, 60);
    this.ctx.fillRect(CANVAS_WIDTH - 210, 10, 200, 60);

    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillStyle = '#FFF';
    
    this.ctx.textAlign = 'left';
    this.ctx.fillText('P1', 20, 30);
    this.drawHealthBar(50, 22, 100, 8, players[0]?.health || 0, players[0]?.maxHealth || 100, COLORS.player1);
    this.drawLives(20, 48, players[0]?.lives || 0);

    this.ctx.textAlign = 'right';
    this.ctx.fillText('P2', CANVAS_WIDTH - 20, 30);
    this.drawHealthBar(CANVAS_WIDTH - 150, 22, 100, 8, players[1]?.health || 0, players[1]?.maxHealth || 100, COLORS.player2);
    this.drawLives(CANVAS_WIDTH - 100, 48, players[1]?.lives || 0);

    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(levelName, CANVAS_WIDTH / 2, 30);

    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillText(`分数: ${score}`, CANVAS_WIDTH / 2, 55);

    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#FF69B4';
    this.ctx.fillText(`🌸 x${flowerCount}/10`, CANVAS_WIDTH / 2, 75);
  }

  private drawHealthBar(x: number, y: number, width: number, height: number, current: number, max: number, color: string): void {
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x, y, width, height);
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, (current / max) * width, height);
    
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
  }

  private drawLives(x: number, y: number, lives: number): void {
    this.ctx.fillStyle = '#FF6B6B';
    for (let i = 0; i < lives; i++) {
      const lx = x + i * 20;
      this.ctx.beginPath();
      this.ctx.moveTo(lx, y + 6);
      this.ctx.bezierCurveTo(lx - 8, y, lx - 6, y - 10, lx, y - 6);
      this.ctx.bezierCurveTo(lx + 6, y - 10, lx + 8, y, lx, y + 6);
      this.ctx.fill();
    }
  }

  drawMenu(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8C8');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(CANVAS_WIDTH / 2 - 250, 80, 500, 120);

    this.ctx.font = 'bold 56px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText('🐿️ 松鼠大战 🐿️', CANVAS_WIDTH / 2, 150);
    this.ctx.fillText('🐿️ 松鼠大战 🐿️', CANVAS_WIDTH / 2, 150);

    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText('按 ENTER 开始游戏', CANVAS_WIDTH / 2, 280);
    this.ctx.fillText('按 ENTER 开始游戏', CANVAS_WIDTH / 2, 280);

    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    
    const controls = [
      '🎮 玩家1: WASD移动 | 空格跳跃 | F举/扔',
      '🎮 玩家2: 方向键移动 | 回车跳跃 | Shift举/扔',
      '💡 搬起箱子砸敌人！可以举起队友搞破坏~'
    ];

    controls.forEach((text, i) => {
      this.ctx.strokeText(text, CANVAS_WIDTH / 2, 350 + i * 30);
      this.ctx.fillText(text, CANVAS_WIDTH / 2, 350 + i * 30);
    });

    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText('收集10朵花获得额外生命 | 吃坚果恢复体力 | 星星无敌', CANVAS_WIDTH / 2, 480);
  }

  drawGameOver(score: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.font = 'bold 64px Arial';
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    this.ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.strokeText(`最终分数: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    this.ctx.fillText(`最终分数: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.strokeText('按 ENTER 重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    this.ctx.fillText('按 ENTER 重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }

  drawLevelComplete(levelName: string, score: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.font = 'bold 56px Arial';
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#2E7D32';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText('关卡完成！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    this.ctx.fillText('关卡完成！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.strokeText(`${levelName} - 通过!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    this.ctx.fillText(`${levelName} - 通过!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.strokeText(`当前分数: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    this.ctx.fillText(`当前分数: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = '#B2FF59';
    this.ctx.strokeText('按 ENTER 进入下一关', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    this.ctx.fillText('按 ENTER 进入下一关', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  }
}
