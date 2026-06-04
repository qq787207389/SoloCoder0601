import { GameStateManager } from './gameState';
import { CONFIG } from './types';

export class InputController {
  private keys: Set<string> = new Set();
  private gameState: GameStateManager;

  constructor(gameState: GameStateManager) {
    this.gameState = gameState;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.handleKeyDown(e.code);
    });

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.handleKeyUp(e.code);
    });
  }

  private handleKeyDown(code: string): void {
    if (this.gameState.state === 'aiming') {
      if (code === 'Space') {
        this.startPowerCharge();
      }
    }
  }

  private handleKeyUp(code: string): void {
    if (this.gameState.state === 'power' && code === 'Space') {
      this.releaseBall();
    }
  }

  private startPowerCharge(): void {
    this.gameState.state = 'power';
    this.gameState.powerLevel = 0;
    this.gameState.powerDirection = 1;
  }

  private releaseBall(): void {
    const power = this.gameState.powerLevel;
    let speed: number;
    let hasOverflow = false;

    if (power <= 20) {
      speed = 3;
    } else if (power <= 85) {
      speed = 5 + (power - 20) / 65 * 3;
    } else {
      speed = 8 + (power - 85) / 15 * 2;
      hasOverflow = power > 95;
    }

    this.gameState.ball.velocity.z = speed;
    
    if (hasOverflow) {
      const overflowAmount = (power - 95) / 5;
      this.gameState.ball.velocity.x = (Math.random() - 0.5) * overflowAmount * 3;
    }

    this.gameState.ball.isRolling = true;
    this.gameState.state = 'rolling';
  }

  update(deltaTime: number): void {
    if (this.gameState.state === 'aiming') {
      const moveSpeed = 1.5 * deltaTime;
      if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) {
        this.gameState.playerPositionX = Math.max(
          -CONFIG.laneWidth / 2 + CONFIG.ballRadius,
          this.gameState.playerPositionX - moveSpeed
        );
      }
      if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) {
        this.gameState.playerPositionX = Math.min(
          CONFIG.laneWidth / 2 - CONFIG.ballRadius,
          this.gameState.playerPositionX + moveSpeed
        );
      }
      this.gameState.ball.position.x = this.gameState.playerPositionX;
    }

    if (this.gameState.state === 'power') {
      const chargeSpeed = 180 * deltaTime;
      this.gameState.powerLevel += chargeSpeed * this.gameState.powerDirection;
      
      if (this.gameState.powerLevel >= 100) {
        this.gameState.powerLevel = 100;
        this.gameState.powerDirection = -1;
      } else if (this.gameState.powerLevel <= 0) {
        this.gameState.powerLevel = 0;
        this.gameState.powerDirection = 1;
      }
    }

    if (this.gameState.state === 'rolling' && this.gameState.ball.isRolling) {
      const spinSpeed = 3 * deltaTime;
      if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) {
        this.gameState.ball.spin = Math.max(-5, this.gameState.ball.spin - spinSpeed);
      } else if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) {
        this.gameState.ball.spin = Math.min(5, this.gameState.ball.spin + spinSpeed);
      }
    }
  }
}
