import type { Ball, Pin, Player, GameState, LaneCondition } from './types';
import { CONFIG } from './types';

export class GameStateManager {
  state: GameState = 'menu';
  players: Player[] = [];
  currentPlayerIndex = 0;
  ball: Ball;
  pins: Pin[] = [];
  laneCondition: LaneCondition = 'normal';
  playerPositionX = 0;
  powerLevel = 0;
  powerDirection = 1;
  spinInput = 0;
  pinsKnockedThisRoll: Set<number> = new Set();
  firstRollPins: Set<number> = new Set();

  constructor() {
    this.ball = this.createBall();
    this.pins = this.createPins();
  }

  createBall(): Ball {
    return {
      position: { x: 0, y: CONFIG.ballRadius, z: 1.5 },
      velocity: { x: 0, y: 0, z: 0 },
      spin: 0,
      radius: CONFIG.ballRadius,
      isRolling: false
    };
  }

  createPins(): Pin[] {
    const pins: Pin[] = [];
    const pinSpacing = 0.3048;
    const positions: [number, number][] = [];

    for (let row = 0; row < 4; row++) {
      const pinsInRow = row + 1;
      const rowOffset = (row - 1.5) * pinSpacing * 0.866;
      for (let col = 0; col < pinsInRow; col++) {
        const colOffset = (col - (pinsInRow - 1) / 2) * pinSpacing;
        positions.push([colOffset, -rowOffset]);
      }
    }

    positions.forEach(([x, z], index) => {
      pins.push({
        id: index,
        position: { x, y: CONFIG.pinHeight / 2, z: CONFIG.pinDeckZ + z },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        isStanding: true,
        hasFallen: false,
        fallTimer: 0
      });
    });

    return pins;
  }

  resetPins(): void {
    this.pins = this.createPins();
    this.pinsKnockedThisRoll.clear();
  }

  resetBall(): void {
    this.ball = this.createBall();
    this.ball.position.x = this.playerPositionX;
    this.spinInput = 0;
  }

  addPlayer(name: string): void {
    if (this.players.length < 4) {
      this.players.push({
        id: this.players.length,
        name,
        scores: Array(10).fill(null).map(() => []),
        currentFrame: 0,
        currentRoll: 0,
        totalScore: 0
      });
    }
  }

  get currentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  nextPlayer(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  isGameOver(): boolean {
    return this.players.every(p => p.currentFrame >= 10);
  }

  getLaneFriction(): number {
    switch (this.laneCondition) {
      case 'oiled': return 0.02;
      case 'worn': return 0.08;
      default: return 0.05;
    }
  }

  getSpinEffectiveness(): number {
    switch (this.laneCondition) {
      case 'oiled': return 0.3;
      case 'worn': return 1.5;
      default: return 1.0;
    }
  }
}
