export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  speed: number;
  isPiercing: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  baseWidth: number;
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'normal' | 'silver' | 'gold';
  hits: number;
  maxHits: number;
  active: boolean;
}

export type PowerUpType = 'expand' | 'shrink' | 'slow' | 'pierce' | 'life';

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  speed: number;
  active: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'gameover' | 'levelComplete';
  score: number;
  lives: number;
  level: number;
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
  powerUps: PowerUp[];
  particles: Particle[];
  keys: {
    left: boolean;
    right: boolean;
  };
  rescueFlash: boolean;
}

export interface LevelConfig {
  rows: number;
  cols: number;
  brickLayout: number[][];
  ballSpeed: number;
  powerUpChance: number;
}
