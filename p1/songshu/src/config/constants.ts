import { GameConfig } from '../types/game';

export const GAME_CONFIG: GameConfig = {
  gravity: 0.6,
  playerSpeed: 4,
  jumpForce: 12,
  throwForce: 10,
  stunDuration: 3000,
  invincibleDuration: 2000
};

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 40;

export const BOX_SIZE = 40;
export const APPLE_SIZE = 28;

export const COLORS = {
  player1: '#E67E22',
  player2: '#9B59B6',
  player1Light: '#F39C12',
  player2Light: '#8E44AD',
  box: '#8B4513',
  boxLight: '#A0522D',
  apple: '#FF6B6B',
  appleLeaf: '#4CAF50',
  ground: '#654321',
  grass: '#228B22',
  sky: '#87CEEB',
  enemy: {
    snail: '#FFB347',
    bee: '#FFD700',
    robot: '#708090'
  }
};

export const KEY_BINDINGS = {
  player1: {
    left: 'KeyA',
    right: 'KeyD',
    up: 'KeyW',
    down: 'KeyS',
    jump: 'Space',
    action: 'KeyF'
  },
  player2: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    down: 'ArrowDown',
    jump: 'Enter',
    action: 'ShiftRight'
  }
};
