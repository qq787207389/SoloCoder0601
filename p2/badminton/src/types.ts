export enum GamePhase {
  MENU = 'menu',
  PLAYING = 'playing',
  SCORE = 'score',
  GAME_OVER = 'game_over'
}

export enum ShotType {
  CLEAR = 'clear',
  DRIVE = 'drive',
  DROP = 'drop',
  SMASH = 'smash',
  SPECIAL = 'special'
}

export enum AIStyle {
  DEFENSIVE = 'defensive',
  AGGRESSIVE = 'aggressive',
  NET = 'net'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Vector2;
  velocity: Vector2;
  stamina: number;
  isStunned: boolean;
  stunTimer: number;
  isSwinging: boolean;
  swingTimer: number;
  score: number;
  gamesWon: number;
  isPlayer: boolean;
}

export interface BallState {
  position: Vector2;
  velocity: Vector2;
  vz: number;
  height: number;
  isInAir: boolean;
  lastHitBy: 'player' | 'ai' | null;
  shotType: ShotType | null;
  trail: Vector2[];
  hitTimestamp: number;
}

export interface Effect {
  type: 'dust' | 'star' | 'afterimage' | 'score';
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  data?: any;
}

export interface WindState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  changeTimer: number;
}

export interface RefereeState {
  animation: 'idle' | 'raising' | 'holding' | 'lowering';
  animationTimer: number;
  displayScore: string;
}

export interface GameStateData {
  phase: GamePhase;
  currentGame: number;
  server: 'player' | 'ai';
  player: PlayerState;
  ai: PlayerState;
  ball: BallState;
  wind: WindState;
  effects: Effect[];
  referee: RefereeState;
  aiStyle: AIStyle;
  scoreTimer: number;
  menuTimer: number;
}

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  swing: boolean;
  special: boolean;
}

export type HitQuality = 'perfect' | 'good' | 'poor' | 'miss';
