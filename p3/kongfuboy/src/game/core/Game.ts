import { GameState, ItemType, CharacterState, type Character } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, LEVEL_NAMES, BOSS_NAMES } from '../constants';
import { InputManager } from './Input';
import * as Physics from './Physics';
import * as CombatSystem from '../combat/CombatSystem';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Item } from '../entities/Item';
import { Level, type LevelData } from '../levels/Level';
import { LEVELS } from '../levels/LevelData';
import { HUD } from '../ui/HUD';
import { Menu, type BattleStats, type MenuAction } from '../ui/Menu';
import { ScreenShake, ParticleSystem, AfterImage, SpeedLines, BlackWhiteEffect, GlowEffect } from '../effects/Effects';
import { audioManager, type SoundType } from '../audio/AudioManager';

export interface GameConfig {
  canvas: HTMLCanvasElement;
  scale?: number;
}

export interface CombatStats {
  totalDamage: number;
  maxCombo: number;
  enemiesDefeated: number;
  timeElapsed: number;
  perfectBonus: boolean;
  itemsCollected: {
    mantou: number;
    tea: number;
    coin: number;
  };
}

interface GameLevel {
  getEnemies: () => Array<{ isDead: boolean; health: number }>;
  getBoss: () => { health: number; maxHealth: number; isDead: boolean } | null;
  getLevelWidth: () => number;
  getBossIntro: () => { name: string; line: string };
  checkInteractables: (player: Player) => void;
  spawnItems: (x: number, y: number) => void;
  renderBackground: (ctx: CanvasRenderingContext2D, cameraX: number) => void;
  renderForeground: (ctx: CanvasRenderingContext2D, cameraX: number) => void;
  checkVictory: () => boolean;
  data: LevelData;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number;

  private state: GameState;
  private currentLevelIndex: number;
  private level: GameLevel | null;
  private player: Player;
  private enemies: Enemy[];
  private boss: Boss | null;
  private items: Item[];

  private input: InputManager;
  private hud: HUD;
  private menu: Menu;
  private audio: typeof audioManager;

  private screenShake: ScreenShake;
  private particles: ParticleSystem;
  private afterImage: AfterImage;
  private speedLines: SpeedLines;
  private blackWhite: BlackWhiteEffect;
  private glowEffect: GlowEffect;

  private cameraX: number;
  private cameraTargetX: number;
  private score: number;
  private combo: number;
  private maxCombo: number;
  private totalDamage: number;
  private enemiesDefeated: number;
  private gameTime: number;
  private initialHealth: number;
  private hasTakenDamage: boolean;

  private selectedMenuIndex: number;
  private bossIntroProgress: number;
  private bossIntroDuration: number;
  private bossIntroSkipped: boolean;

  private animationFrameId: number | null;
  private lastTime: number;
  private isRunning: boolean;

  private itemsCollected: {
    mantou: number;
    tea: number;
    coin: number;
  };

  constructor(config: GameConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.scale = config.scale || 1;

    this.state = GameState.MENU;
    this.currentLevelIndex = 0;
    this.level = null;
    this.player = new Player(100, GROUND_Y - 100);
    this.enemies = [];
    this.boss = null;
    this.items = [];

    this.input = new InputManager();
    this.hud = new HUD();
    this.menu = new Menu();
    this.audio = audioManager;

    this.screenShake = new ScreenShake();
    this.particles = new ParticleSystem();
    this.afterImage = new AfterImage();
    this.speedLines = new SpeedLines(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.blackWhite = new BlackWhiteEffect();
    this.glowEffect = new GlowEffect();

    this.cameraX = 0;
    this.cameraTargetX = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalDamage = 0;
    this.enemiesDefeated = 0;
    this.gameTime = 0;
    this.initialHealth = 100;
    this.hasTakenDamage = false;

    this.selectedMenuIndex = 0;
    this.bossIntroProgress = 0;
    this.bossIntroDuration = 3;
    this.bossIntroSkipped = false;

    this.animationFrameId = null;
    this.lastTime = 0;
    this.isRunning = false;

    this.itemsCollected = {
      mantou: 0,
      tea: 0,
      coin: 0
    };
  }

  init(): void {
    this.audio.init();
    this.particles.spawnSakuraParticles(30);
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  startGame(levelIndex: number = 0): void {
    this.currentLevelIndex = levelIndex;
    this.loadLevel(levelIndex);
    this.changeState(GameState.PLAYING);
    this.audio.playBGM(levelIndex);
  }

  private loadLevel(levelIndex: number): void {
    const levelData = LEVELS[levelIndex % LEVELS.length];
    
    this.player = new Player(100, GROUND_Y - 100);
    this.enemies = [];
    this.boss = null;
    this.items = [];

    this.cameraX = 0;
    this.cameraTargetX = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalDamage = 0;
    this.enemiesDefeated = 0;
    this.gameTime = 0;
    this.initialHealth = this.player.maxHealth;
    this.hasTakenDamage = false;
    this.bossIntroProgress = 0;
    this.bossIntroSkipped = false;

    this.itemsCollected = {
      mantou: 0,
      tea: 0,
      coin: 0
    };

    this.particles.clear();
    this.afterImage.clear();

    const levelDataCopy = JSON.parse(JSON.stringify(levelData));
    this.level = new (class extends Level {
      constructor(data: LevelData) {
        super(data);
        this.init();
      }
    })(levelDataCopy) as unknown as GameLevel;

    this.spawnEnemiesFromLevel();
  }

  private spawnEnemiesFromLevel(): void {
    if (!this.level) return;

    const firstWave = this.level.data.waves[0];
    if (firstWave) {
      for (const spawn of firstWave.enemies) {
        const enemy = new Enemy(spawn.x, spawn.y, spawn.type);
        this.enemies.push(enemy);
      }
    }
  }

  private spawnBoss(): void {
    if (!this.level || this.boss) return;

    const bossConfig = this.level.data.boss;
    this.boss = new Boss(bossConfig.x, bossConfig.y, bossConfig.type);
    this.bossIntroProgress = 0;
    this.changeState(GameState.BOSS_INTRO);
    this.audio.playSound('special');
    this.screenShake.shake(10, 1);
  }

  update(dt: number): void {
    if (!this.isRunning) return;

    this.input.update();

    if (this.state === GameState.MENU) {
      this.updateMenu(dt);
    } else if (this.state === GameState.PAUSED) {
      this.updatePauseMenu(dt);
    } else if (this.state === GameState.BOSS_INTRO) {
      this.updateBossIntro(dt);
    } else if (this.state === GameState.PLAYING) {
      this.updateGame(dt);
    } else if (this.state === GameState.VICTORY || this.state === GameState.DEFEAT) {
      this.updateEndScreen(dt);
    }

    this.particles.update(dt);
    this.afterImage.update(dt);
    this.speedLines.update(dt);
    this.blackWhite.update(dt);
    this.glowEffect.update(dt);
  }

  private updateMenu(dt: number): void {
    const action = this.menu.handleMenuInput(this.input, 'MAIN', this.selectedMenuIndex);
    this.processMenuAction(action);
    this.particles.update(dt);
  }

  private updatePauseMenu(dt: number): void {
    const action = this.menu.handleMenuInput(this.input, 'PAUSE', this.selectedMenuIndex);
    this.processMenuAction(action);
  }

  private updateBossIntro(dt: number): void {
    if (!this.boss || !this.level) return;

    this.bossIntroProgress += dt;

    if (this.input.isJustPressed('CONFIRM') || this.input.isJustPressed('PUNCH') || this.input.isJustPressed('KICK')) {
      this.bossIntroSkipped = true;
    }

    if (this.bossIntroProgress >= this.bossIntroDuration || this.bossIntroSkipped) {
      this.changeState(GameState.PLAYING);
      this.particles.spawnHitParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#C41E3A');
      this.screenShake.shake(5, 0.5);
    }

    this.updatePlayer(dt);
  }

  private updateGame(dt: number): void {
    if (!this.level) return;

    this.gameTime += dt;

    if (this.input.isJustPressed('PAUSE')) {
      this.changeState(GameState.PAUSED);
      return;
    }

    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateItems(dt);
    this.checkCollisions();
    this.updateCamera();
    this.checkWaveSpawn();
    this.checkGameEnd();

    for (const enemy of this.enemies) {
      if (enemy.isAttackActive()) {
        const hitbox = enemy.getAttackHitbox();
        if (hitbox && CombatSystem.checkHit(enemy as unknown as Character, this.player, hitbox)) {
          CombatSystem.applyDamage(enemy as unknown as Character, this.player as unknown as CombatSystem.CombatCharacter, enemy.moveData!);
          this.onPlayerHit();
        }
      }
    }

    if (this.boss && this.boss.isAttackActive()) {
      const hitbox = this.boss.getAttackHitbox();
      if (hitbox && CombatSystem.checkHit(this.boss as unknown as Character, this.player, hitbox)) {
        CombatSystem.applyDamage(this.boss as unknown as Character, this.player as unknown as CombatSystem.CombatCharacter, this.boss.moveData!);
        this.onPlayerHit();
      }
    }

    this.level.checkInteractables(this.player);
  }

  private updateEndScreen(dt: number): void {
    const menuType = this.state === GameState.VICTORY ? 'VICTORY' : 'DEFEAT';
    const action = this.menu.handleMenuInput(this.input, menuType, 0);
    this.processMenuAction(action);
  }

  private processMenuAction(action: MenuAction): void {
    if (action.action === 'SELECT_UP' || action.action === 'SELECT_DOWN') {
      if (action.selectedIndex !== undefined) {
        this.selectedMenuIndex = action.selectedIndex;
      }
      this.audio.playSound('punch');
    } else if (action.action === 'START') {
      this.startGame(0);
    } else if (action.action === 'RESUME') {
      this.changeState(GameState.PLAYING);
    } else if (action.action === 'RESTART') {
      this.restart();
    } else if (action.action === 'MAIN_MENU') {
      this.changeState(GameState.MENU);
      this.audio.stopBGM();
    } else if (action.action === 'NEXT_LEVEL') {
      if (this.state === GameState.VICTORY) {
        this.nextLevel();
      } else {
        this.changeState(GameState.MENU);
      }
    }
  }

  private updatePlayer(dt: number): void {
    const levelBounds = {
      groundY: GROUND_Y,
      leftBound: 0,
      rightBound: this.level ? this.level.getLevelWidth() : CANVAS_WIDTH
    };

    this.player.update(dt, this.input, levelBounds);

    Physics.clampToBounds(this.player, {
      minX: 0,
      maxX: this.level ? this.level.getLevelWidth() : CANVAS_WIDTH,
      minY: 0,
      maxY: GROUND_Y
    });

    if (this.player.state === CharacterState.PUNCH) {
      this.audio.playSound('punch');
    } else if (this.player.state === CharacterState.KICK) {
      this.audio.playSound('kick');
    } else if (this.player.state === CharacterState.SPECIAL) {
      this.audio.playSound('special');
      this.speedLines.activate(0.3);
      this.blackWhite.activate(0.2);
      this.particles.spawnQiParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 50);
    } else if (this.player.state === CharacterState.JUMP && this.player.velocityY < 0) {
      this.audio.playSound('jump');
    }

    if (this.player.isAttacking() && this.player.isAttackActive()) {
      this.afterImage.addFrame(this.player.x, this.player.y, 0, this.player.facing);
    }
  }

  private updateEnemies(dt: number): void {
    const levelBounds = {
      groundY: GROUND_Y,
      leftBound: 0,
      rightBound: this.level ? this.level.getLevelWidth() : CANVAS_WIDTH
    };

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.updateAI(dt, this.player, levelBounds);
      const enemyExt = enemy as unknown as { isDead: boolean };

      if (enemy.state === CharacterState.DEAD && !enemyExt.isDead) {
        enemyExt.isDead = true;
        this.onEnemyDefeated(enemy);
      }
    }

    this.enemies = this.enemies.filter(e => !(e as unknown as { isDead: boolean }).isDead);
  }

  private updateBoss(dt: number): void {
    if (!this.boss) return;

    const levelBounds = {
      groundY: GROUND_Y,
      leftBound: 0,
      rightBound: this.level ? this.level.getLevelWidth() : CANVAS_WIDTH
    };

    this.boss.updateAI(dt, this.player, levelBounds);
    const bossExt = this.boss as unknown as { isDead: boolean };

    if (this.boss.state === CharacterState.DEAD && !bossExt.isDead) {
      bossExt.isDead = true;
      this.onBossDefeated();
    }
  }

  private updateItems(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update(dt);

      if (!item.isActive()) {
        this.items.splice(i, 1);
        continue;
      }

      if (item.checkPickup(this.player)) {
        item.applyEffect(this.player);
        this.onItemPickedUp(item);
        this.items.splice(i, 1);
      }
    }
  }

  private checkCollisions(): void {
    if (!this.player.isAttacking() || !this.player.isAttackActive()) return;

    const hitbox = this.player.getHitbox();
    if (!hitbox) return;

    for (const enemy of this.enemies) {
      if ((enemy as unknown as { isDead: boolean }).isDead) continue;

      if (CombatSystem.checkHit(this.player, enemy as unknown as Character, hitbox)) {
        CombatSystem.applyDamage(this.player, enemy as unknown as CombatSystem.CombatCharacter, this.player.moveData!);
        this.onEnemyHit(enemy);
      }
    }

    if (this.boss && !(this.boss as unknown as { isDead: boolean }).isDead) {
      if (CombatSystem.checkHit(this.player, this.boss as unknown as Character, hitbox)) {
        CombatSystem.applyDamage(this.player, this.boss as unknown as CombatSystem.CombatCharacter, this.player.moveData!);
        this.onBossHit();
      }
    }
  }

  private onPlayerHit(): void {
    this.audio.playSound('hurt');
    this.hasTakenDamage = true;
    this.combo = 0;
    this.player.resetCombo();
    this.screenShake.shake(8, 0.3);
    this.particles.spawnHitParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#C41E3A');

    if (this.player.health <= 0) {
      this.changeState(GameState.DEFEAT);
      this.audio.stopBGM();
    }
  }

  private onEnemyHit(enemy: Enemy): void {
    this.audio.playSound('hit');
    this.combo = this.player.getComboCount();
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.totalDamage += this.player.moveData?.damage || 0;
    this.screenShake.shake(3, 0.1);
    this.particles.spawnHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FFD700');

    if (this.combo >= 10) {
      this.speedLines.activate(0.2);
    }
  }

  private onBossHit(): void {
    if (!this.boss) return;

    this.audio.playSound('hit');
    this.combo = this.player.getComboCount();
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.totalDamage += this.player.moveData?.damage || 0;
    this.screenShake.shake(5, 0.2);
    this.particles.spawnHitParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#FFD700');
  }

  private onEnemyDefeated(enemy: Enemy): void {
    this.enemiesDefeated++;
    this.score += 50 * (1 + this.combo * 0.1);
    this.particles.spawnHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#C41E3A');
    this.particles.spawnQiParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 30);
    this.screenShake.shake(4, 0.15);

    if (this.level) {
      this.level.spawnItems(enemy.x + enemy.width / 2, enemy.y);
      this.spawnItemsFromLevel();
    }
  }

  private onBossDefeated(): void {
    if (!this.boss) return;

    this.enemiesDefeated++;
    this.score += 500 * (1 + this.combo * 0.2);
    this.particles.spawnHitParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#C41E3A');
    this.particles.spawnQiParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 80);
    this.screenShake.shake(15, 1);
    this.blackWhite.activate(0.5);
    this.speedLines.activate(0.5);

    setTimeout(() => {
      this.changeState(GameState.VICTORY);
      this.audio.stopBGM();
    }, 1500);
  }

  private onItemPickedUp(item: Item): void {
    const type = item.getType();
    const scoreValue = item.getScoreValue();

    if (scoreValue > 0) {
      this.score += scoreValue;
      this.audio.playSound('coin');
    } else if (type === ItemType.MANTOU) {
      this.audio.playSound('heal');
      this.itemsCollected.mantou++;
    } else if (type === ItemType.TEA) {
      this.audio.playSound('heal');
      this.itemsCollected.tea++;
    }

    if (type === ItemType.COIN) {
      this.itemsCollected.coin++;
    }

    this.particles.spawnHitParticles(item.x + item.width / 2, item.y + item.height / 2, '#FFD700');
  }

  private spawnItemsFromLevel(): void {
    if (!this.level) return;

    for (const drop of this.level.data.itemDrops) {
      if (Math.random() < drop.chance) {
        const item = new Item(
          this.player.x + (Math.random() - 0.5) * 100,
          this.player.y,
          drop.type
        );
        this.items.push(item);
      }
    }
  }

  private updateCamera(): void {
    if (!this.level) return;

    const levelWidth = this.level.getLevelWidth();
    const targetX = this.player.x - CANVAS_WIDTH / 2 + this.player.width / 2;
    this.cameraTargetX = Math.max(0, Math.min(levelWidth - CANVAS_WIDTH, targetX));
    this.cameraX += (this.cameraTargetX - this.cameraX) * 0.1;
  }

  private checkWaveSpawn(): void {
    if (!this.level) return;

    const activeEnemies = this.enemies.filter(e => !(e as unknown as { isDead: boolean }).isDead).length;
    
    if (activeEnemies === 0 && !this.boss) {
      const waves = this.level.data.waves;
      const spawnedWaves = Math.floor(this.enemiesDefeated / 3);
      
      if (spawnedWaves < waves.length) {
        const nextWave = waves[spawnedWaves];
        if (nextWave && this.gameTime > spawnedWaves * 5) {
          for (const spawn of nextWave.enemies) {
            const enemy = new Enemy(spawn.x, spawn.y, spawn.type);
            this.enemies.push(enemy);
          }
        }
      } else if (!this.boss && spawnedWaves >= waves.length) {
        this.spawnBoss();
      }
    }
  }

  private checkGameEnd(): void {
    if (this.player.health <= 0) {
      this.changeState(GameState.DEFEAT);
      this.audio.stopBGM();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const shakeOffset = this.screenShake.update(1 / 60);

    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    if (this.state === GameState.MENU) {
      this.menu.renderMainMenu(ctx, this.selectedMenuIndex);
      this.particles.render(ctx);
    } else if (this.state === GameState.PAUSED) {
      this.renderGame(ctx);
      this.menu.renderPauseMenu(ctx, this.selectedMenuIndex);
    } else if (this.state === GameState.BOSS_INTRO) {
      this.renderGame(ctx);
      if (this.level) {
        const intro = this.level.getBossIntro();
        this.menu.renderBossIntro(ctx, intro.name, intro.line, this.bossIntroProgress / this.bossIntroDuration);
      }
    } else if (this.state === GameState.PLAYING || this.state === GameState.TRANSITION) {
      this.renderGame(ctx);
    } else if (this.state === GameState.VICTORY) {
      this.renderGame(ctx);
      this.menu.renderVictory(ctx, this.getStats(), this.currentLevelIndex);
    } else if (this.state === GameState.DEFEAT) {
      this.renderGame(ctx);
      this.menu.renderDefeat(ctx, this.getStats());
    }

    ctx.restore();
  }

  private renderGame(ctx: CanvasRenderingContext2D): void {
    if (!this.level) return;

    ctx.fillStyle = this.level.data.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.level.renderBackground(ctx, this.cameraX);
    this.level.renderForeground(ctx, this.cameraX);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    for (const enemy of this.enemies) {
      if ((enemy as unknown as { isDead: boolean }).isDead) continue;
      enemy.render(ctx, null, 1);
    }

    if (this.boss && !(this.boss as unknown as { isDead: boolean }).isDead) {
      this.boss.render(ctx, null, 1);
    }

    for (const item of this.items) {
      item.render(ctx, 1);
    }

    this.afterImage.render(ctx, 1, (c, x, y, _frame, facing, scale) => {
      c.save();
      c.translate(x, y);
      if (facing === -1) {
        c.scale(-1, 1);
        c.translate(-this.player.width, 0);
      }
      c.fillStyle = 'rgba(255, 215, 0, 0.5)';
      c.fillRect(0, 0, this.player.width * scale, this.player.height * scale);
      c.restore();
    });

    this.player.render(ctx, null, 1);

    ctx.restore();

    this.particles.render(ctx);
    this.speedLines.render(ctx);
    this.blackWhite.apply(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    const boss = this.level.getBoss();
    const bossName = boss ? BOSS_NAMES[this.level.data.boss.type] : undefined;

    this.hud.render(
      ctx,
      this.player,
      this.currentLevelIndex,
      Math.floor(this.score),
      this.combo,
      boss !== null,
      boss?.health || 0,
      boss?.maxHealth || 0,
      bossName
    );
  }

  loop(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render(this.ctx);

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  changeState(newState: GameState): void {
    this.state = newState;
    this.selectedMenuIndex = 0;

    if (newState === GameState.MENU) {
      this.particles.spawnSakuraParticles(30);
    }
  }

  nextLevel(): void {
    const nextIndex = this.currentLevelIndex + 1;
    if (nextIndex < LEVELS.length) {
      this.startGame(nextIndex);
    } else {
      this.changeState(GameState.MENU);
      this.audio.stopBGM();
    }
  }

  restart(): void {
    this.startGame(this.currentLevelIndex);
  }

  getStats(): BattleStats {
    return {
      totalDamage: Math.floor(this.totalDamage),
      maxCombo: this.maxCombo,
      enemiesDefeated: this.enemiesDefeated,
      timeElapsed: this.gameTime,
      perfectBonus: !this.hasTakenDamage,
      itemsCollected: { ...this.itemsCollected }
    };
  }

  getScore(): number {
    return Math.floor(this.score);
  }

  getCurrentLevel(): number {
    return this.currentLevelIndex;
  }

  getState(): GameState {
    return this.state;
  }

  destroy(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.input.destroy();
    this.audio.stopBGM();
  }
}
