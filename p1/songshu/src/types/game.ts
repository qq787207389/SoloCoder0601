export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum Direction {
  LEFT = -1,
  RIGHT = 1
}

export enum PlayerState {
  IDLE = 'idle',
  WALKING = 'walking',
  JUMPING = 'jumping',
  LIFTING = 'lifting',
  CARRYING = 'carrying',
  THROWING = 'throwing',
  STUNNED = 'stunned',
  BEING_CARRIED = 'being_carried'
}

export enum EnemyState {
  IDLE = 'idle',
  WALKING = 'walking',
  CHASING = 'chasing',
  STUNNED = 'stunned',
  DEAD = 'dead'
}

export enum EnemyType {
  SNAIL = 'snail',
  BEE = 'bee',
  ROBOT = 'robot'
}

export enum ItemType {
  NUT = 'nut',
  FLOWER = 'flower',
  STAR = 'star',
  LIFE = 'life'
}

export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  LEVEL_COMPLETE = 'level_complete'
}

export interface Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  isActive: boolean;
}

export interface Player extends Entity {
  playerId: number;
  state: PlayerState;
  direction: Direction;
  lives: number;
  health: number;
  maxHealth: number;
  isInvincible: boolean;
  invincibleTimer: number;
  carriedItem: Carryable | null;
  struggleTimer: number;
  animFrame: number;
  animTimer: number;
  isOnGround: boolean;
}

export interface Carryable extends Entity {
  isCarried: boolean;
  carrierId: string | null;
  isThrown: boolean;
  throwVelocity: Vector2;
}

export interface Box extends Carryable {
  type: 'box';
}

export interface Apple extends Carryable {
  type: 'apple';
}

export interface Enemy extends Entity {
  type: EnemyType;
  state: EnemyState;
  direction: Direction;
  health: number;
  maxHealth: number;
  stunTimer: number;
  speed: number;
  animFrame: number;
  animTimer: number;
}

export interface Item extends Entity {
  type: ItemType;
  collected: boolean;
}

export interface Platform extends Rect {
  type: 'ground' | 'platform' | 'box_stack';
}

export interface LevelData {
  id: number;
  name: string;
  background: string;
  platforms: Platform[];
  boxes: { position: Vector2 }[];
  apples: { position: Vector2 }[];
  enemies: { type: EnemyType; position: Vector2; patrolRange?: number }[];
  items: { type: ItemType; position: Vector2 }[];
  playerStartPositions: Vector2[];
  width: number;
  height: number;
}

export interface GameConfig {
  gravity: number;
  playerSpeed: number;
  jumpForce: number;
  throwForce: number;
  stunDuration: number;
  invincibleDuration: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  action: boolean;
}
