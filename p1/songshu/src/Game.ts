import { InputManager } from './core/InputManager';
import { Renderer } from './renderer/Renderer';
import { PlayerEntity } from './entities/Player';
import { BoxEntity, AppleEntity } from './entities/Carryables';
import { EnemyEntity } from './entities/Enemy';
import { ItemEntity } from './entities/Item';
import { createLevels } from './levels/levels';
import { GameState, ItemType, PlayerState, EnemyState, Carryable, LevelData } from './types/game';
import { checkEntityCollision } from './utils/physics';
import { COLORS } from './config/constants';

export class Game {
  private inputManager: InputManager;
  private renderer: Renderer;
  private gameState: GameState;
  private levels: LevelData[];
  private currentLevelIndex: number;
  private players: PlayerEntity[];
  private boxes: BoxEntity[];
  private apples: AppleEntity[];
  private enemies: EnemyEntity[];
  private items: ItemEntity[];
  private score: number;
  private flowerCount: number;
  private lastTime: number;
  private animationId: number | null;

  constructor(canvas: HTMLCanvasElement) {
    this.inputManager = new InputManager();
    this.renderer = new Renderer(canvas);
    this.gameState = GameState.MENU;
    this.levels = createLevels();
    this.currentLevelIndex = 0;
    this.players = [];
    this.boxes = [];
    this.apples = [];
    this.enemies = [];
    this.items = [];
    this.score = 0;
    this.flowerCount = 0;
    this.lastTime = 0;
    this.animationId = null;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') {
        this.handleEnterPress();
      }
    });
  }

  private handleEnterPress(): void {
    switch (this.gameState) {
      case GameState.MENU:
        this.startGame();
        break;
      case GameState.GAME_OVER:
        this.resetGame();
        break;
      case GameState.LEVEL_COMPLETE:
        this.nextLevel();
        break;
    }
  }

  private startGame(): void {
    this.currentLevelIndex = 0;
    this.score = 0;
    this.flowerCount = 0;
    this.loadLevel(this.currentLevelIndex);
    this.gameState = GameState.PLAYING;
  }

  private resetGame(): void {
    this.score = 0;
    this.flowerCount = 0;
    this.currentLevelIndex = 0;
    this.loadLevel(this.currentLevelIndex);
    this.gameState = GameState.PLAYING;
  }

  private nextLevel(): void {
    this.currentLevelIndex++;
    if (this.currentLevelIndex >= this.levels.length) {
      this.currentLevelIndex = 0;
      this.gameState = GameState.MENU;
    } else {
      this.loadLevel(this.currentLevelIndex);
      this.gameState = GameState.PLAYING;
    }
  }

  private loadLevel(levelIndex: number): void {
    const level = this.levels[levelIndex];
    
    this.players = [
      new PlayerEntity(1, level.playerStartPositions[0], COLORS.player1, COLORS.player1Light),
      new PlayerEntity(2, level.playerStartPositions[1], COLORS.player2, COLORS.player2Light)
    ];

    this.boxes = level.boxes.map(b => new BoxEntity(b.position));
    this.apples = level.apples.map(a => new AppleEntity(a.position));
    this.enemies = level.enemies.map(e => new EnemyEntity(e.type, e.position, (e as any).patrolRange || 100));
    this.items = level.items.map(i => new ItemEntity(i.type, i.position));
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    this.inputManager.update();

    if (this.gameState !== GameState.PLAYING) return;

    const level = this.levels[this.currentLevelIndex];

    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      if (!player.isActive) continue;

      if (player.state !== PlayerState.BEING_CARRIED) {
        const input = this.inputManager.getPlayerInput(i + 1);
        player.update(input, level.platforms, deltaTime);
        this.handlePlayerActions(player, i + 1);
      } else {
        const input = this.inputManager.getPlayerInput(i + 1);
        player.update(input, level.platforms, deltaTime);
        if (player.state !== PlayerState.BEING_CARRIED) {
          const carrier = this.players.find(p => 
            p.carriedItem && 'playerId' in p.carriedItem && 
            (p.carriedItem as unknown as PlayerEntity).id === player.id
          );
          if (carrier) {
            carrier.carriedItem = null;
          }
        }
      }
    }

    for (const player of this.players) {
      if (player.carriedItem && 'playerId' in player.carriedItem) {
        const carriedPlayer = player.carriedItem as unknown as PlayerEntity;
        carriedPlayer.position.x = player.position.x + player.width / 2 - carriedPlayer.width / 2;
        carriedPlayer.position.y = player.position.y - carriedPlayer.height - 5;
      }
    }

    for (const box of this.boxes) {
      box.update(level.platforms, deltaTime);
    }

    for (const apple of this.apples) {
      apple.update(level.platforms, deltaTime);
    }

    for (const enemy of this.enemies) {
      enemy.update(level.platforms, this.players, deltaTime);
    }

    for (const item of this.items) {
      item.update(deltaTime);
    }

    this.checkCollisions();
    this.checkGameConditions();
  }

  private handlePlayerActions(player: PlayerEntity, playerId: number): void {
    if (this.inputManager.isActionJustPressed(playerId)) {
      if (player.carriedItem) {
        const thrownItem = player.throwItem();
        
        if (thrownItem && 'playerId' in thrownItem) {
          const thrownPlayer = thrownItem as unknown as PlayerEntity;
          thrownPlayer.state = PlayerState.IDLE;
          thrownPlayer.velocity.x = player.direction * 12;
          thrownPlayer.velocity.y = -8;
        }
      } else {
        this.tryLiftItem(player);
      }
    }
  }

  private tryLiftItem(player: PlayerEntity): void {
    const allCarryables: Carryable[] = [
      ...this.boxes.filter(b => b.isActive && !b.isCarried),
      ...this.apples.filter(a => a.isActive && !a.isCarried)
    ];

    const stunnedEnemies = this.enemies.filter(e => 
      e.isActive && e.state === EnemyState.STUNNED
    );

    for (const enemy of stunnedEnemies) {
      if (this.isNearby(player, enemy, 50)) {
        enemy.isActive = false;
        this.score += 200;
        return;
      }
    }

    for (const item of allCarryables) {
      if (this.isNearby(player, item, 50)) {
        player.liftItem(item);
        return;
      }
    }

    const otherPlayer = this.players.find(p => 
      p !== player && 
      p.isActive && 
      p.state !== PlayerState.BEING_CARRIED &&
      p.state !== PlayerState.STUNNED
    );

    if (otherPlayer && this.isNearby(player, otherPlayer, 60)) {
      const carriedPlayer = otherPlayer as unknown as Carryable;
      carriedPlayer.isCarried = true;
      carriedPlayer.carrierId = player.id;
      player.carriedItem = carriedPlayer;
      otherPlayer.state = PlayerState.BEING_CARRIED;
    }
  }

  private isNearby(a: { position: { x: number; y: number }; width: number; height: number }, 
                   b: { position: { x: number; y: number }; width: number; height: number }, 
                   distance: number): boolean {
    const ax = a.position.x + a.width / 2;
    const ay = a.position.y + a.height / 2;
    const bx = b.position.x + b.width / 2;
    const by = b.position.y + b.height / 2;
    
    return Math.abs(ax - bx) < distance && Math.abs(ay - by) < distance;
  }

  private checkCollisions(): void {
    for (const player of this.players) {
      if (!player.isActive) continue;

      for (const enemy of this.enemies) {
        if (!enemy.isActive || enemy.state === EnemyState.DEAD) continue;

        if (checkEntityCollision(player, enemy)) {
          if (enemy.state === EnemyState.STUNNED) {
            enemy.takeDamage();
            this.score += 100;
          } else if (player.state === PlayerState.BEING_CARRIED) {
            enemy.takeDamage(2);
            this.score += 300;
          } else if (!player.isInvincible) {
            player.takeDamage(25);
            player.velocity.x = player.position.x < enemy.position.x ? -8 : 8;
            player.velocity.y = -5;
          }
        }
      }
    }

    const thrownItems = [
      ...this.boxes.filter(b => b.isThrown),
      ...this.apples.filter(a => a.isThrown)
    ];

    for (const item of thrownItems) {
      for (const enemy of this.enemies) {
        if (!enemy.isActive || enemy.state === EnemyState.DEAD) continue;

        if (checkEntityCollision(item, enemy)) {
          enemy.takeDamage();
          item.resetThrow();
          this.score += 150;
        }
      }
    }

    for (const player of this.players) {
      if (!player.isActive) continue;

      for (const item of this.items) {
        if (!item.isActive || item.collected) continue;

        if (checkEntityCollision(player, item)) {
          this.collectItem(player, item);
        }
      }
    }
  }

  private collectItem(player: PlayerEntity, item: ItemEntity): void {
    item.collect();

    switch (item.type) {
      case ItemType.NUT:
        player.heal(30);
        this.score += 50;
        break;
      case ItemType.FLOWER:
        this.flowerCount++;
        this.score += 100;
        if (this.flowerCount >= 10) {
          player.addLife();
          this.flowerCount = 0;
        }
        break;
      case ItemType.STAR:
        player.isInvincible = true;
        player.invincibleTimer = 10000;
        this.score += 200;
        break;
      case ItemType.LIFE:
        player.addLife();
        this.score += 500;
        break;
    }
  }

  private checkGameConditions(): void {
    const allPlayersDead = this.players.every(p => !p.isActive);
    if (allPlayersDead) {
      this.gameState = GameState.GAME_OVER;
      return;
    }

    const allEnemiesDead = this.enemies.every(e => !e.isActive || e.state === EnemyState.DEAD);
    if (allEnemiesDead) {
      this.gameState = GameState.LEVEL_COMPLETE;
      this.score += 1000;
    }
  }

  private render(): void {
    const level = this.levels[this.currentLevelIndex];

    this.renderer.clear();

    if (this.gameState === GameState.MENU) {
      this.renderer.drawMenu();
      return;
    }

    if (this.gameState === GameState.GAME_OVER) {
      this.renderer.drawBackground(level.background);
      this.renderer.drawGameOver(this.score);
      return;
    }

    this.renderer.drawBackground(level.background);
    this.renderer.updateCamera(this.players, level.width);
    this.renderer.drawPlatforms(level.platforms);

    for (const box of this.boxes) {
      this.renderer.drawBox(box);
    }

    for (const apple of this.apples) {
      this.renderer.drawApple(apple);
    }

    for (const item of this.items) {
      this.renderer.drawItem(item);
    }

    for (const enemy of this.enemies) {
      this.renderer.drawEnemy(enemy);
    }

    for (const player of this.players) {
      this.renderer.drawPlayer(player);
    }

    this.renderer.drawHUD(this.players, level.name, this.score, this.flowerCount);

    if (this.gameState === GameState.LEVEL_COMPLETE) {
      this.renderer.drawLevelComplete(level.name, this.score);
    }
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
