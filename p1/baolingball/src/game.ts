import { GameStateManager } from './gameState';
import { Renderer } from './renderer';
import { PhysicsEngine } from './physics';
import { InputController } from './inputController';
import { SoundManager } from './soundManager';
import type { LaneCondition } from './types';

export class BowlingGame {
  private gameState: GameStateManager;
  private renderer: Renderer;
  private physics: PhysicsEngine;
  private input: InputController;
  private sound: SoundManager;
  private lastTime = 0;
  private resultTimer = 0;
  private previousPinCount = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.gameState = new GameStateManager();
    this.renderer = new Renderer(canvas, this.gameState);
    this.physics = new PhysicsEngine(this.gameState);
    this.input = new InputController(this.gameState);
    this.sound = new SoundManager();

    this.gameState.state = 'menu';
    this.startGameLoop();
  }

  showMenu(): void {
    this.gameState.state = 'menu';
    this.renderMenu();
  }

  renderMenu(): void {
    this.renderer.render();
    const ctx = this.renderer['ctx'];
    const width = this.renderer['width'];
    const height = this.renderer['height'];

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎳 BOWLING MASTER', width / 2, height / 4);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('选择玩家数量', width / 2, height / 3);

    for (let i = 1; i <= 4; i++) {
      const btnX = width / 2 - 150 + (i - 1) * 80;
      const btnY = height / 2.5;
      const btnW = 60;
      const btnH = 50;

      ctx.fillStyle = '#4a90d9';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`${i}人`, btnX + btnW / 2, btnY + btnH / 2 + 8);
    }

    ctx.font = '18px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('球道条件:', width / 2, height / 1.8);

    const conditions: LaneCondition[] = ['normal', 'oiled', 'worn'];
    const conditionLabels = ['普通木地板', '上油球道', '磨损球道'];
    
    conditions.forEach((cond, i) => {
      const btnX = width / 2 - 180 + i * 130;
      const btnY = height / 1.6;
      const btnW = 110;
      const btnH = 40;

      ctx.fillStyle = cond === this.gameState.laneCondition ? '#4caf50' : '#666';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(conditionLabels[i], btnX + btnW / 2, btnY + btnH / 2 + 5);
    });

    ctx.font = '16px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('← → 调整站位 | 空格蓄力投球 | 球滚动时← → 加旋转', width / 2, height - 50);
  }

  setupGame(playerCount: number, laneCondition: LaneCondition): void {
    this.gameState.laneCondition = laneCondition;
    this.gameState.players = [];
    
    for (let i = 0; i < playerCount; i++) {
      this.gameState.addPlayer(`玩家${i + 1}`);
    }

    this.gameState.resetPins();
    this.gameState.resetBall();
    this.gameState.state = 'aiming';
    this.startGameLoop();
  }

  private startGameLoop(): void {
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  private gameLoop(time: number): void {
    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.gameState.state === 'menu') {
      this.renderMenu();
    } else {
      this.update(deltaTime);
      this.renderer.render();
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(deltaTime: number): void {
    this.input.update(deltaTime);

    if (this.gameState.state === 'rolling') {
      this.physics.updateBall();
      const pinsMoving = this.physics.updatePins();

      const currentKnocked = this.gameState.pinsKnockedThisRoll.size;
      if (currentKnocked > this.previousPinCount) {
        this.sound.playPinHit();
        this.previousPinCount = currentKnocked;
      }

      this.resultTimer += deltaTime;

      const ballStopped = !this.gameState.ball.isRolling;
      const timeout = this.resultTimer > 10;
      
      if ((ballStopped && !pinsMoving) || timeout) {
        if (this.resultTimer > 1.5 || timeout) {
          this.processRollResult();
        }
      }
    }
  }

  private processRollResult(): void {
    const player = this.gameState.currentPlayer;
    const frame = player.currentFrame;
    const pinsKnocked = this.gameState.pinsKnockedThisRoll.size;

    if (player.currentRoll === 0) {
      this.gameState.firstRollPins = new Set(this.gameState.pinsKnockedThisRoll);
    }

    if (!player.scores[frame]) {
      player.scores[frame] = [];
    }
    player.scores[frame].push(pinsKnocked);

    const isStrike = player.currentRoll === 0 && pinsKnocked === 10;
    const isSpare = player.currentRoll === 1 && 
      player.scores[frame][0] + pinsKnocked === 10;

    if (isStrike) {
      this.sound.playStrike();
    } else if (isSpare) {
      this.sound.playSpare();
    }

    if (frame === 9) {
      const totalRolls = player.scores[9].length;
      const firstRoll = player.scores[9][0];
      const secondRoll = player.scores[9][1];

      if (totalRolls === 1) {
        if (firstRoll === 10) {
          player.currentRoll = 1;
          this.gameState.resetPins();
        } else {
          player.currentRoll = 1;
        }
      } else if (totalRolls === 2) {
        if (firstRoll === 10) {
          if (secondRoll === 10) {
            player.currentRoll = 2;
            this.gameState.resetPins();
          } else {
            player.currentRoll = 2;
          }
        } else if (firstRoll + secondRoll === 10) {
          player.currentRoll = 2;
          this.gameState.resetPins();
        } else {
          this.nextFrame();
          return;
        }
      } else {
        this.nextFrame();
        return;
      }
    } else {
      if (isStrike || player.currentRoll === 1) {
        this.nextFrame();
        return;
      } else {
        player.currentRoll = 1;
      }
    }

    this.gameState.pinsKnockedThisRoll.clear();
    this.previousPinCount = 0;
    this.resultTimer = 0;
    this.gameState.resetBall();
    this.gameState.state = 'aiming';
  }

  private nextFrame(): void {
    const player = this.gameState.currentPlayer;
    player.currentFrame++;
    player.currentRoll = 0;

    if (this.gameState.isGameOver()) {
      this.gameState.state = 'gameover';
      this.showGameOver();
      return;
    }

    this.gameState.nextPlayer();
    
    this.gameState.resetPins();

    this.gameState.pinsKnockedThisRoll.clear();
    this.previousPinCount = 0;
    this.resultTimer = 0;
    this.gameState.resetBall();
    this.gameState.state = 'aiming';
  }

  private showGameOver(): void {
    const ctx = this.renderer['ctx'];
    const width = this.renderer['width'];
    const height = this.renderer['height'];

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 游戏结束!', width / 2, height / 4);

    ctx.font = '24px Arial';
    const sortedPlayers = [...this.gameState.players].sort((a, b) => b.totalScore - a.totalScore);
    
    sortedPlayers.forEach((player, i) => {
      const isWinner = i === 0;
      ctx.fillStyle = isWinner ? '#ffd700' : '#fff';
      ctx.fillText(
        `${isWinner ? '🏆 ' : ''}${player.name}: ${player.totalScore}分`,
        width / 2,
        height / 3 + i * 45
      );
    });

    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(width / 2 - 80, height - 120, 160, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('再来一局', width / 2, height - 90);
  }

  handleClick(x: number, y: number): void {
    const width = this.renderer['width'];
    const height = this.renderer['height'];

    if (this.gameState.state === 'menu') {
      for (let i = 1; i <= 4; i++) {
        const btnX = width / 2 - 150 + (i - 1) * 80;
        const btnY = height / 2.5;
        if (x >= btnX && x <= btnX + 60 && y >= btnY && y <= btnY + 50) {
          this.setupGame(i, this.gameState.laneCondition);
          return;
        }
      }

      const conditions: LaneCondition[] = ['normal', 'oiled', 'worn'];
      conditions.forEach((cond, i) => {
        const btnX = width / 2 - 180 + i * 130;
        const btnY = height / 1.6;
        if (x >= btnX && x <= btnX + 110 && y >= btnY && y <= btnY + 40) {
          this.gameState.laneCondition = cond;
          this.renderMenu();
        }
      });
    } else if (this.gameState.state === 'gameover') {
      if (x >= width / 2 - 80 && x <= width / 2 + 80 && y >= height - 120 && y <= height - 70) {
        this.gameState = new GameStateManager();
        this.renderer['gameState'] = this.gameState;
        this.physics['gameState'] = this.gameState;
        this.input['gameState'] = this.gameState;
        this.showMenu();
      }
    }
  }
}
