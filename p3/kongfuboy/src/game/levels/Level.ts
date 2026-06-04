import { BossType, EnemyType, ItemType, CharacterState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from '../constants';
import type { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Item } from '../entities/Item';

export interface BackgroundLayer {
  type: 'mountains' | 'trees' | 'decorations';
  color: string;
  elements: BackgroundElement[];
  scrollSpeed: number;
}

export interface BackgroundElement {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'slippery' | 'destructible';
}

export interface EnemySpawn {
  x: number;
  y: number;
  type: EnemyType;
}

export interface WaveConfig {
  enemies: EnemySpawn[];
  delay: number;
}

export interface Interactable {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'bamboo' | 'pillar' | 'lantern';
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  effect: 'barrier' | 'damage' | 'item_drop';
}

export interface BossConfig {
  type: BossType;
  x: number;
  y: number;
  intro: { name: string; line: string };
}

export interface ItemDrop {
  x: number;
  y: number;
  type: ItemType;
  chance: number;
}

export interface LevelMechanic {
  type: 'slippery_ground' | 'destructible_objects' | 'wet_ground';
  active: boolean;
  value: number;
}

export interface LevelData {
  id: number;
  name: string;
  description: string;
  backgroundColor: string;
  width: number;
  backgroundLayers: BackgroundLayer[];
  platforms: Platform[];
  waves: WaveConfig[];
  interactables: Interactable[];
  boss: BossConfig;
  itemDrops: ItemDrop[];
  mechanics: LevelMechanic[];
}

export abstract class Level {
  protected data: LevelData;
  protected currentWave: number;
  protected waveTimer: number;
  protected enemies: Enemy[];
  protected boss: Boss | null;
  protected items: Item[];
  protected interactables: Interactable[];
  protected isBossSpawned: boolean;
  protected isVictory: boolean;
  protected initialized: boolean;
  protected wavesCompleted: boolean;

  constructor(levelData: LevelData) {
    this.data = levelData;
    this.currentWave = 0;
    this.waveTimer = 0;
    this.enemies = [];
    this.boss = null;
    this.items = [];
    this.interactables = [];
    this.isBossSpawned = false;
    this.isVictory = false;
    this.initialized = false;
    this.wavesCompleted = false;
  }

  init(): void {
    this.currentWave = 0;
    this.waveTimer = 0;
    this.enemies = [];
    this.boss = null;
    this.items = [];
    this.isBossSpawned = false;
    this.isVictory = false;
    this.initialized = true;
    this.wavesCompleted = false;

    this.interactables = this.data.interactables.map(i => ({ ...i }));
  }

  update(dt: number, player: Player): void {
    if (!this.initialized) return;

    this.updateWaves(dt, player);
    this.updateEnemies(dt, player);
    this.updateBoss(dt, player);
    this.updateItems(dt, player);
    this.updateInteractables(dt, player);
    this.checkVictory();
  }

  protected updateWaves(dt: number, player: Player): void {
    if (this.isBossSpawned || this.wavesCompleted) return;

    if (this.waveTimer > 0) {
      this.waveTimer -= dt;
      return;
    }

    if (this.currentWave < this.data.waves.length) {
      if (this.enemies.filter(e => !e.isDead).length === 0) {
        this.spawnWave(this.currentWave);
        this.currentWave++;
        if (this.currentWave < this.data.waves.length) {
          this.waveTimer = this.data.waves[this.currentWave].delay;
        }
      }
    } else if (!this.isBossSpawned && this.enemies.filter(e => !e.isDead).length === 0) {
      this.spawnBoss(player.x);
      this.wavesCompleted = true;
    }
  }

  protected updateEnemies(dt: number, player: Player): void {
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const direction = player.x > enemy.x ? 1 : -1;
      enemy.x += direction * 1.5;

      if (enemy.y + enemy.height >= GROUND_Y) {
        enemy.y = GROUND_Y - enemy.height;
      }
    }
  }

  protected updateBoss(dt: number, player: Player): void {
    if (!this.boss || this.boss.isDead || !this.boss.isActive) return;

    const direction = player.x > this.boss.x ? 1 : -1;
    this.boss.x += direction * 1.2;

    if (this.boss.y + this.boss.height >= GROUND_Y) {
      this.boss.y = GROUND_Y - this.boss.height;
    }
  }

  protected updateItems(dt: number, player: Player): void {
    for (const item of this.items) {
      if (item.isPickedUp) continue;

      if (
        player.x < item.x + item.width &&
        player.x + player.width > item.x &&
        player.y < item.y + item.height &&
        player.y + player.height > item.y
      ) {
        item.isPickedUp = true;
        this.onItemCollected(item);
      }
    }
  }

  protected updateInteractables(dt: number, player: Player): void {
  }

  protected onItemCollected(item: Item): void {
  }

  renderBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    ctx.fillStyle = this.data.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const layer of this.data.backgroundLayers) {
      const offsetX = cameraX * layer.scrollSpeed;
      for (const element of layer.elements) {
        const screenX = element.x - offsetX;
        if (screenX + element.width < 0 || screenX > CANVAS_WIDTH) continue;

        ctx.fillStyle = layer.color;
        if (element.type === 'mountain') {
          this.drawMountain(ctx, screenX, element.y, element.width, element.height);
        } else if (element.type === 'tree') {
          this.drawTree(ctx, screenX, element.y, element.width, element.height);
        } else if (element.type === 'pagoda') {
          this.drawPagoda(ctx, screenX, element.y, element.width, element.height);
        } else if (element.type === 'lantern') {
          this.drawLantern(ctx, screenX, element.y, element.width, element.height);
        }
      }
    }
  }

  renderForeground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const offsetX = cameraX;

    for (const platform of this.data.platforms) {
      const screenX = platform.x - offsetX;
      if (screenX + platform.width < 0 || screenX > CANVAS_WIDTH) continue;

      ctx.fillStyle = '#5D4037';
      ctx.fillRect(screenX, platform.y, platform.width, platform.height);

      if (platform.type === 'slippery') {
        ctx.fillStyle = '#87CEEB';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(screenX, platform.y, platform.width, 3);
        ctx.globalAlpha = 1;
      }
    }

    for (const interactable of this.interactables) {
      if (interactable.isDestroyed) continue;

      const screenX = interactable.x - offsetX;
      if (screenX + interactable.width < 0 || screenX > CANVAS_WIDTH) continue;

      if (interactable.type === 'bamboo') {
        this.drawBamboo(ctx, screenX, interactable.y, interactable.width, interactable.height, interactable.health / interactable.maxHealth);
      } else if (interactable.type === 'pillar') {
        this.drawPillar(ctx, screenX, interactable.y, interactable.width, interactable.height, interactable.health / interactable.maxHealth);
      } else if (interactable.type === 'lantern') {
        this.drawLantern(ctx, screenX, interactable.y, interactable.width, interactable.height);
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const screenX = enemy.x - offsetX;
      this.drawEnemy(ctx, screenX, enemy.y, enemy.width, enemy.height, enemy.enemyType);
    }

    if (this.boss && !this.boss.isDead) {
      const screenX = this.boss.x - offsetX;
      this.drawBoss(ctx, screenX, this.boss.y, this.boss.width, this.boss.height, this.boss.bossType);
    }

    for (const item of this.items) {
      if (item.isPickedUp) continue;
      const screenX = item.x - offsetX;
      this.drawItem(ctx, screenX, item.y, item.width, item.height, item.type);
    }
  }

  protected drawMountain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }

  protected drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x + w * 0.35, y + h * 0.5, w * 0.3, h * 0.5);

    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.4, w * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  protected drawPagoda(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const stories = 5;
    const storyHeight = h / (stories + 1);

    for (let i = 0; i < stories; i++) {
      const storyY = y + i * storyHeight;
      const storyW = w * (1 - i * 0.1);
      const storyX = x + (w - storyW) / 2;

      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(storyX + storyW * 0.1, storyY + storyHeight * 0.3, storyW * 0.8, storyHeight * 0.7);

      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.moveTo(storyX, storyY + storyHeight * 0.3);
      ctx.lineTo(storyX + storyW / 2, storyY);
      ctx.lineTo(storyX + storyW, storyY + storyHeight * 0.3);
      ctx.closePath();
      ctx.fill();
    }
  }

  protected drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#D84315';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  protected drawBamboo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, healthPercent: number): void {
    ctx.fillStyle = `hsl(${120 * healthPercent}, 60%, 35%)`;
    ctx.fillRect(x + w * 0.3, y, w * 0.4, h);

    ctx.fillStyle = '#1B5E20';
    for (let i = 0; i < 5; i++) {
      const nodeY = y + (h / 5) * i;
      ctx.fillRect(x + w * 0.25, nodeY, w * 0.5, 4);
    }
  }

  protected drawPillar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, healthPercent: number): void {
    ctx.fillStyle = `hsl(30, 10%, ${30 + healthPercent * 30}%)`;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  protected drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, type: EnemyType): void {
    if (type === 'NORMAL') {
      ctx.fillStyle = '#5D4037';
    } else if (type === 'ARCHER') {
      ctx.fillStyle = '#1B5E20';
    } else {
      ctx.fillStyle = '#B71C1C';
    }
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.2, w * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#C41E3A';
    ctx.beginPath();
    ctx.arc(x + w * 0.35, y + h * 0.15, w * 0.08, 0, Math.PI * 2);
    ctx.arc(x + w * 0.65, y + h * 0.15, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  protected drawBoss(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, type: BossType): void {
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(x, y + h * 0.5, w, h * 0.1);

    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.15, w * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#C41E3A';
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.12, w * 0.1, 0, Math.PI * 2);
    ctx.arc(x + w * 0.7, y + h * 0.12, w * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', x + w / 2, y - 10);
  }

  protected drawItem(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, type: ItemType): void {
    if (type === 'MANTOU') {
      ctx.fillStyle = '#FFF8E1';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'TEA') {
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(x, y + h * 0.3, w, h * 0.7);
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(x - 5, y + h * 0.4, 5, h * 0.3);
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFA000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', x + w / 2, y + h / 2 + 4);
    }
  }

  spawnWave(waveIndex: number): void {
    if (waveIndex >= this.data.waves.length) return;

    const wave = this.data.waves[waveIndex];
    for (const spawn of wave.enemies) {
      const enemy = new Enemy(spawn.x, spawn.y, spawn.type);
      this.enemies.push(enemy);
    }
  }

  protected spawnBoss(playerX?: number): void {
    this.isBossSpawned = true;
    const bossConfig = this.data.boss;
    const spawnX = playerX !== undefined ? playerX + 600 : bossConfig.x;
    this.boss = new Boss(spawnX, bossConfig.y, bossConfig.type);
  }

  spawnItems(x: number, y: number): void {
    for (const drop of this.data.itemDrops) {
      if (Math.random() < drop.chance) {
        const item = new Item(x + Math.random() * 50 - 25, y, drop.type);
        this.items.push(item);
      }
    }
  }

  checkInteractables(player: Player): void {
    for (const interactable of this.interactables) {
      if (interactable.isDestroyed) continue;

      const collision = (
        player.x < interactable.x + interactable.width &&
        player.x + player.width > interactable.x &&
        player.y < interactable.y + interactable.height &&
        player.y + player.height > interactable.y
      );

      if (collision && player.isAttacking() && player.isAttackActive()) {
        this.damageInteractable(interactable, player);
      }
    }
  }

  protected damageInteractable(interactable: Interactable, player: Player): void {
    interactable.health -= 20;
    if (interactable.health <= 0) {
      interactable.isDestroyed = true;
      this.onInteractableDestroyed(interactable, player);
    }
  }

  protected onInteractableDestroyed(interactable: Interactable, player: Player): void {
    if (interactable.effect === 'item_drop') {
      this.spawnItems(interactable.x + interactable.width / 2, interactable.y + interactable.height / 2);
    } else if (interactable.effect === 'damage') {
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dist = Math.abs(enemy.x - interactable.x);
        if (dist < 150) {
          enemy.health -= 50;
          if (enemy.health <= 0) {
            enemy.state = CharacterState.DEAD;
            this.spawnItems(enemy.x, enemy.y);
          }
        }
      }
    }
  }

  checkVictory(): boolean {
    if (this.isVictory) return true;
    
    if (this.isBossSpawned && this.boss && this.boss.isDead) {
      this.isVictory = true;
    }
    return this.isVictory;
  }

  getCurrentWaveInfo(): { current: number; total: number; isBossWave: boolean } {
    return {
      current: this.currentWave,
      total: this.data.waves.length,
      isBossWave: this.isBossSpawned
    };
  }

  getBossIntro(): { name: string; line: string } {
    return this.data.boss.intro;
  }

  getEnemies(): Enemy[] {
    return this.enemies.filter(e => !e.isDead);
  }

  getBoss(): Boss | null {
    return this.boss && !this.boss.isDead ? this.boss : null;
  }

  getLevelWidth(): number {
    return this.data.width;
  }
}
