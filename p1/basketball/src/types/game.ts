export type GamePhase = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover';
export type Team = 'red' | 'blue';
export type ItemType = 'speed' | 'jump' | 'magnet' | 'pan' | 'banana';
export type SpecialType = 'meteor' | 'tornado' | 'dunk' | 'block' | 'shield' | 'combo';
export type CourtType = 'beach' | 'street' | 'highway';
export type PlayerAnimation = 'idle' | 'running' | 'jumping' | 'shooting' | 'passing' | 'knockedout' | 'dunking' | 'blocking';

export interface Vector2 {
  x: number;
  y: number;
}

export interface GameState {
  phase: GamePhase;
  time: number;
  maxTime: number;
  score: {
    red: number;
    blue: number;
  };
  countdown: number;
  selectedCourt: CourtType;
  selectedTeam: Team;
  screenShake: number;
}

export interface PlayerStats {
  speed: number;
  strength: number;
  jump: number;
  accuracy: number;
}

export interface PlayerState {
  id: string;
  team: Team;
  position: Vector2;
  velocity: Vector2;
  stats: PlayerStats;
  specialGauge: number;
  isAI: boolean;
  isJumping: boolean;
  isKnockedOut: boolean;
  knockoutTimer: number;
  hasBall: boolean;
  currentItem: ItemType | null;
  itemTimer: number;
  animation: PlayerAnimation;
  animationFrame: number;
  facingRight: boolean;
  chargePower: number;
  isCharging: boolean;
}

export interface BallState {
  position: Vector2;
  velocity: Vector2;
  isHeld: boolean;
  holderId: string | null;
  isSpecialShot: boolean;
  specialType: SpecialType | null;
  rotation: number;
  isInTruck: boolean;
}

export interface ItemState {
  id: string;
  type: ItemType;
  position: Vector2;
  isPickedUp: boolean;
  duration: number;
  bobOffset: number;
}

export interface HoopState {
  team: Team;
  x: number;
  y: number;
  isBroken: boolean;
  breakTimer: number;
  glassPieces: GlassPiece[];
}

export interface GlassPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
}

export interface EffectState {
  id: string;
  type: 'fire' | 'spark' | 'smoke' | 'star' | 'tornado' | 'meteor' | 'text';
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  text?: string;
}

export interface TruckState {
  x: number;
  y: number;
  active: boolean;
  speed: number;
  hasBall: boolean;
  warningTimer: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  pass: boolean;
  shoot: boolean;
}

export interface AIDecision {
  moveX: number;
  moveY: number;
  jump: boolean;
  pass: boolean;
  shoot: boolean;
}

export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  FPS: 60,
  MATCH_TIME: 180,
  MAX_SPECIAL: 100,
  GRAVITY: 0.5,
  GROUND_Y: 600,
} as const;

export const COURT_CONFIG = {
  LEFT_HOOP_X: 150,
  RIGHT_HOOP_X: 1130,
  HOOP_Y: 280,
  THREE_POINT_LINE: 350,
  CENTER_X: 640,
  LEFT_BOUND: 50,
  RIGHT_BOUND: 1230,
  HOOP_WIDTH: 80,
  HOOP_HEIGHT: 120,
} as const;

export const PLAYER_CONFIG = {
  WIDTH: 40,
  HEIGHT: 60,
  BASE_SPEED: 4,
  BASE_JUMP: 12,
  KNOCKOUT_TIME: 60,
  PASS_SPEED: 12,
  SHOOT_POWER_MAX: 15,
  DUNK_DISTANCE: 100,
} as const;

export const BALL_CONFIG = {
  RADIUS: 12,
  BOUNCE: 0.6,
  FRICTION: 0.98,
  AIR_RESISTANCE: 0.995,
} as const;

export const ITEM_CONFIG: Record<ItemType, { color: string; duration: number; icon: string }> = {
  speed: { color: '#44CC44', duration: 600, icon: '⚡' },
  jump: { color: '#44AAFF', duration: 480, icon: '🦘' },
  magnet: { color: '#FF44FF', duration: 720, icon: '🧲' },
  pan: { color: '#AAAAAA', duration: 360, icon: '🍳' },
  banana: { color: '#FFDD44', duration: -1, icon: '🍌' },
} as const;

export const SPECIAL_CONFIG: Record<SpecialType, { name: string; cost: number; description: string }> = {
  meteor: { name: '燃烧流星', cost: 100, description: '球化作燃烧的流星直轰篮筐' },
  tornado: { name: '龙卷风暴', cost: 100, description: '球旋转成龙卷风卷飞防守者' },
  dunk: { name: '暴力灌篮', cost: 100, description: '连人带球一起灌入篮筐' },
  block: { name: '空中拦截', cost: 100, description: '跳得比篮板还高拦截必杀' },
  shield: { name: '双臂格挡', cost: 80, description: '用双臂格挡把球弹飞' },
  combo: { name: '双人连携', cost: 150, description: '空中接力扣篮' },
} as const;
