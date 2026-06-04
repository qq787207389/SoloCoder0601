import { GameState, CharacterState, ItemType, BossType } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, COLORS } from './constants';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { Boss } from './entities/Boss';
import { GameLevel } from './levels/GameLevel';
import { LEVELS } from './levels/LevelData';
import { InputManager } from './core/Input';
import { HUD } from './ui/HUD';
import { Menu } from './ui/Menu';
import { ParticleSystem, ScreenShake } from './effects/Effects';
import { AudioManager } from './audio/AudioManager';

export interface GameStats {
  score: number;
  combo: number;
  currentLevel: number;
  totalEnemiesDefeated: number;
  maxCombo: number;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private gameState: GameState = GameState.MENU;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private deltaTime: number = 0;

  private input: InputManager;
  private player: Player | null = null;
  private currentLevel: GameLevel | null = null;
  private levelIndex: number = 0;
  private hud: HUD;
  private menu: Menu;
  private menuSelectedIndex: number = 0;
  private showControls: boolean = false;
  private showAbout: boolean = false;
  private particles: ParticleSystem;
  private screenShake: ScreenShake;
  private audio: AudioManager;

  private cameraX: number = 0;
  private stats: GameStats;
  private bossIntroTimer: number = 0;
  private bossIntroData: { name: string; line: string } | null = null;
  private victoryProcessed: boolean = false;

  constructor() {
    this.input = new InputManager();
    this.hud = new HUD();
    this.menu = new Menu();
    this.particles = new ParticleSystem();
    this.screenShake = new ScreenShake();
    this.audio = new AudioManager();
    this.stats = {
      score: 0,
      combo: 0,
      currentLevel: 0,
      totalEnemiesDefeated: 0,
      maxCombo: 0
    };
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.ctx.imageSmoothingEnabled = false;

    this.initLevel(0);
    this.gameState = GameState.MENU;
  }

  private initLevel(levelIndex: number): void {
    this.levelIndex = levelIndex;
    this.stats.currentLevel = levelIndex;
    this.victoryProcessed = false;

    const levelData = LEVELS[levelIndex];
    this.currentLevel = new GameLevel(levelData);
    this.currentLevel.init();

    this.player = new Player(100, GROUND_Y - 100);
    this.cameraX = 0;

    this.bossIntroTimer = 0;
    this.bossIntroData = null;
  }

  start(): void {
    if (this.animationId) return;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 16.67;
    this.lastTime = currentTime;

    this.update();
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    this.input.update();

    switch (this.gameState) {
      case GameState.MENU:
        this.updateMenu();
        break;
      case GameState.PLAYING:
        if (this.input.isJustPressed('PAUSE')) {
          this.gameState = GameState.PAUSED;
          this.menuSelectedIndex = 0;
        } else {
          this.updateGame();
        }
        break;
      case GameState.PAUSED:
        this.updatePauseMenu();
        break;
      case GameState.BOSS_INTRO:
        this.updateBossIntro();
        break;
      case GameState.VICTORY:
      case GameState.DEFEAT:
        this.updateGameOver();
        break;
    }

    this.particles.update(this.deltaTime);
    this.screenShake.update(this.deltaTime);
  }

  private updateMenu(): void {
    if (this.showControls || this.showAbout) {
      if (this.input.isJustPressed('CONFIRM') || this.input.isJustPressed('PAUSE') || this.input.isJustPressed('PUNCH') || this.input.isJustPressed('KICK')) {
        this.showControls = false;
        this.showAbout = false;
      }
      return;
    }

    const action = this.menu.handleMenuInput(this.input, 'MAIN', this.menuSelectedIndex);
    
    if (action.action === 'SELECT_UP' || action.action === 'SELECT_DOWN') {
      this.menuSelectedIndex = action.selectedIndex ?? 0;
    } else if (action.action === 'START') {
      this.startGame();
    } else if (action.action === 'CONTROLS') {
      this.showControls = true;
    } else if (action.action === 'ABOUT') {
      this.showAbout = true;
    }
  }

  private updatePauseMenu(): void {
    const action = this.menu.handleMenuInput(this.input, 'PAUSE', this.menuSelectedIndex);
    
    if (action.action === 'SELECT_UP' || action.action === 'SELECT_DOWN') {
      this.menuSelectedIndex = action.selectedIndex ?? 0;
    } else if (action.action === 'RESUME') {
      this.gameState = GameState.PLAYING;
    } else if (action.action === 'RESTART') {
      this.restart();
    } else if (action.action === 'MAIN_MENU') {
      this.gameState = GameState.MENU;
      this.menuSelectedIndex = 0;
    }
  }

  private startGame(): void {
    this.stats = {
      score: 0,
      combo: 0,
      currentLevel: 0,
      totalEnemiesDefeated: 0,
      maxCombo: 0
    };
    this.initLevel(0);
    this.gameState = GameState.PLAYING;
    this.audio.playBGM(0);
  }

  private restart(): void {
    this.stats = {
      score: 0,
      combo: 0,
      currentLevel: this.levelIndex,
      totalEnemiesDefeated: 0,
      maxCombo: 0
    };
    this.initLevel(this.levelIndex);
    this.gameState = GameState.PLAYING;
    this.menuSelectedIndex = 0;
  }

  private updateGame(): void {
    if (!this.player || !this.currentLevel) return;

    const physics = { groundY: GROUND_Y };
    const combatSystem = this.createCombatSystem();

    this.player.update(this.deltaTime, this.input, physics, combatSystem);

    this.currentLevel.update(this.deltaTime, this.player);

    const enemies = this.currentLevel.getEnemies() as unknown as Enemy[];
    const levelBounds = {
      groundY: GROUND_Y,
      leftBound: 0,
      rightBound: this.currentLevel.getLevelWidth()
    };

    for (const enemy of enemies) {
      enemy.updateAI(this.deltaTime, this.player, levelBounds);
      this.checkEnemyAttack(enemy);
    }

    const boss = this.currentLevel.getBoss() as unknown as Boss;
    if (boss && boss.state !== CharacterState.DEAD) {
      boss.updateAI(this.deltaTime, this.player, levelBounds);
      this.checkEnemyAttack(boss as unknown as Enemy);
    }

    this.currentLevel.checkInteractables(this.player);

    this.checkItemCollection();

    this.updateCamera();

    this.checkBossIntro();

    this.checkGameState();

    this.updateCombo();

    this.collectItems();
  }

  private createCombatSystem() {
    return {
      registerHit: (attacker: Player, defender: unknown, damage: number) => {
        const enemy = defender as Enemy;
        const knockback = attacker.facing;
        enemy.takeDamage(damage, 8, knockback);
        this.particles.spawnHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FFD700');
        this.screenShake.shake(3, 10);
        this.stats.score += damage * 10;

        if (enemy.health <= 0) {
          this.stats.totalEnemiesDefeated++;
          this.stats.score += 500;
          this.currentLevel?.spawnItems(enemy.x, enemy.y);
        }
      },
      getActiveEnemies: () => {
        const enemies = this.currentLevel?.getEnemies() || [];
        const boss = this.currentLevel?.getBoss();
        const result = [...enemies];
        if (boss) result.push(boss as unknown as typeof enemies[0]);
        return result;
      }
    };
  }

  private checkEnemyAttack(enemy: Enemy): void {
    if (!this.player || !enemy.isAttackActive()) return;

    const hitbox = enemy.getAttackHitbox();
    if (!hitbox) return;

    const playerBox = this.player.getBodyBox();
    const collision = (
      hitbox.x < playerBox.x + playerBox.width &&
      hitbox.x + hitbox.width > playerBox.x &&
      hitbox.y < playerBox.y + playerBox.height &&
      hitbox.y + hitbox.height > playerBox.y
    );

    if (collision && enemy.moveData) {
      const knockback = enemy.facing;
      const damage = Math.floor(enemy.moveData.damage * enemy.damageMultiplier);
      this.player.takeDamage(damage, enemy.moveData.knockback, knockback);
      this.particles.spawnHitParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#FF4444');
      this.screenShake.shake(3, 10);
      this.stats.combo = 0;
    }
  }

  private checkItemCollection(): void {
    if (!this.player || !this.currentLevel) return;

    const items = (this.currentLevel as unknown as { items: Array<{ type: ItemType; collected: boolean; x: number; y: number; width: number; height: number }> }).items;

    for (const item of items) {
      if (item.collected) continue;

      const collision = (
        this.player.x < item.x + item.width &&
        this.player.x + this.player.width > item.x &&
        this.player.y < item.y + item.height &&
        this.player.y + this.player.height > item.y
      );

      if (collision) {
        item.collected = true;
        this.applyItemEffect(item.type);
        this.particles.spawnHitParticles(item.x + item.width / 2, item.y + item.height / 2, '#00FF00');
      }
    }
  }

  private applyItemEffect(type: ItemType): void {
    if (!this.player) return;

    switch (type) {
      case ItemType.MANTOU:
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
        this.stats.score += 100;
        break;
      case ItemType.TEA:
        this.player.ki = Math.min(this.player.maxKi, this.player.ki + 30);
        this.stats.score += 100;
        break;
      case ItemType.COIN:
        this.stats.score += 200;
        break;
    }
  }

  private collectItems(): void {
  }

  private updateCamera(): void {
    if (!this.player || !this.currentLevel) return;

    const targetX = this.player.x - CANVAS_WIDTH / 2 + this.player.width / 2;
    const maxX = this.currentLevel.getLevelWidth() - CANVAS_WIDTH;

    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraX = Math.max(0, Math.min(maxX, this.cameraX));
  }

  private checkBossIntro(): void {
    if (!this.currentLevel) return;

    const boss = this.currentLevel.getBoss();
    if (boss && !this.bossIntroData && this.gameState === GameState.PLAYING) {
      this.bossIntroData = this.currentLevel.getBossIntro();
      this.bossIntroTimer = 180;
      this.gameState = GameState.BOSS_INTRO;
    }
  }

  private updateBossIntro(): void {
    this.bossIntroTimer--;
    if (this.bossIntroTimer <= 0) {
      this.gameState = GameState.PLAYING;
    }
  }

  private checkGameState(): void {
    if (!this.player || !this.currentLevel) return;

    if (this.player.health <= 0) {
      this.gameState = GameState.DEFEAT;
      this.audio.stopBGM();
      return;
    }

    if (this.currentLevel.checkVictory() && !this.victoryProcessed) {
      this.victoryProcessed = true;
      if (this.levelIndex < LEVELS.length - 1) {
        this.stats.score += 5000;
        setTimeout(() => {
          this.initLevel(this.levelIndex + 1);
        }, 2000);
      } else {
        this.gameState = GameState.VICTORY;
        this.audio.stopBGM();
      }
    }
  }

  private updateCombo(): void {
    if (!this.player) return;

    this.stats.combo = this.player.getComboCount();
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }
  }

  private updateGameOver(): void {
    if (this.input.isJustPressed('CONFIRM') || this.input.isJustPressed('PUNCH') || this.input.isJustPressed('KICK')) {
      this.gameState = GameState.MENU;
      this.menuSelectedIndex = 0;
      this.showControls = false;
      this.showAbout = false;
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.gameState === GameState.MENU) {
      if (this.showControls) {
        this.menu.renderControls(this.ctx);
      } else if (this.showAbout) {
        this.menu.renderAbout(this.ctx);
      } else {
        this.menu.renderMainMenu(this.ctx, this.menuSelectedIndex);
      }
      return;
    }

    if (this.currentLevel) {
      this.currentLevel.renderBackground(this.ctx, this.cameraX);
      this.currentLevel.renderForeground(this.ctx, this.cameraX);
    }

    if (this.player) {
      this.player.render(this.ctx, null, 1);
    }

    const shakeOffset = this.screenShake.update(this.deltaTime);
    this.ctx.save();
    this.ctx.translate(shakeOffset.x, shakeOffset.y);
    
    this.particles.render(this.ctx);
    
    this.ctx.restore();

    if (this.player) {
      const boss = this.currentLevel?.getBoss();
      this.hud.render(
        this.ctx,
        this.player,
        this.stats.currentLevel,
        this.stats.score,
        this.stats.combo,
        !!boss,
        boss?.health || 0,
        boss?.maxHealth || 0,
        boss ? this.getBossName(boss.bossType) : undefined
      );
    }

    if (this.gameState === GameState.PAUSED) {
      this.menu.renderPauseMenu(this.ctx, this.menuSelectedIndex);
    } else if (this.gameState === GameState.BOSS_INTRO && this.bossIntroData) {
      const progress = 1 - this.bossIntroTimer / 180;
      this.menu.renderBossIntro(this.ctx, this.bossIntroData.name, this.bossIntroData.line, progress);
    } else if (this.gameState === GameState.VICTORY) {
      const battleStats = {
        totalDamage: this.stats.score,
        maxCombo: this.stats.maxCombo,
        enemiesDefeated: this.stats.totalEnemiesDefeated,
        timeElapsed: 0,
        perfectBonus: this.player?.health === this.player?.maxHealth,
        itemsCollected: { mantou: 0, tea: 0, coin: 0 }
      };
      this.menu.renderVictory(this.ctx, battleStats, this.stats.currentLevel);
    } else if (this.gameState === GameState.DEFEAT) {
      const battleStats = {
        totalDamage: this.stats.score,
        maxCombo: this.stats.maxCombo,
        enemiesDefeated: this.stats.totalEnemiesDefeated,
        timeElapsed: 0,
        perfectBonus: false,
        itemsCollected: { mantou: 0, tea: 0, coin: 0 }
      };
      this.menu.renderDefeat(this.ctx, battleStats);
    }
  }

  private getBossName(type: BossType): string {
    const bossNames: Record<BossType, string> = {
      [BossType.SHAOLIN_MONK]: '少林武僧',
      [BossType.EMEI_NUN]: '峨眉师太',
      [BossType.MONGOL_WRESTLER]: '蒙古摔跤手',
      [BossType.NINJA]: '暗影忍者',
      [BossType.OLD_MASTER]: '世外高人',
      [BossType.SENIOR_BROTHER]: '大师兄'
    };
    return bossNames[type] || 'BOSS';
  }

  private renderBossIntro(): void {
    if (!this.ctx || !this.bossIntroData) return;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = COLORS.ANCIENT_GOLD;
    this.ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.bossIntroData.name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
    this.ctx.font = '24px "Microsoft YaHei", sans-serif';
    this.ctx.fillText(`"${this.bossIntroData.line}"`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  getPlayerHealth(): { current: number; max: number } {
    if (!this.player) return { current: 0, max: 0 };
    return { current: this.player.health, max: this.player.maxHealth };
  }

  getPlayerKi(): { current: number; max: number } {
    if (!this.player) return { current: 0, max: 0 };
    return { current: this.player.ki, max: this.player.maxKi };
  }

  destroy(): void {
    this.stop();
    this.input.destroy();
  }
}
