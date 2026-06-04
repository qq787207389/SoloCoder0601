export type Team = 'red' | 'blue';

export type PlayerRole = 'forward_speed' | 'forward_tech' | 'forward_power' | 'defender_wall' | 'defender_steal' | 'goalie';

export type PlayerState = 'normal' | 'down' | 'frozen' | 'paralyzed' | 'celebrating' | 'angry' | 'charging_special';

export type PuckState = 'normal' | 'fire' | 'split' | 'curve' | 'whirlwind';

export type ItemType = 'speed_skates' | 'long_stick' | 'freeze_ball' | 'shock_ball';

export type SpecialType = 'fire_shot' | 'split_shot' | 'curve_shot' | 'ice_wall' | 'whirlwind_slash' | 'clone_save' | 'combo_spin' | 'combo_bounce';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerStats {
  speed: number;
  power: number;
  shot: number;
  pass: number;
}

export interface PlayerData {
  role: PlayerRole;
  name: string;
  stats: PlayerStats;
  special: SpecialType;
  colors: { body: string; stripe: string; helmet: string };
}

export interface Player {
  id: number;
  team: Team;
  role: PlayerRole;
  name: string;
  pos: Vec2;
  vel: Vec2;
  angle: number;
  stats: PlayerStats;
  state: PlayerState;
  stateTimer: number;
  special: SpecialType;
  specialCharge: number;
  maxSpecialCharge: number;
  hasPuck: boolean;
  stickAngle: number;
  stickLength: number;
  bodyRadius: number;
  colors: { body: string; stripe: string; helmet: string };
  hitPoints: number;
  maxHitPoints: number;
  itemTimer: number;
  activeItem: ItemType | null;
  goals: number;
  assists: number;
  fightTarget: number | null;
  isControlled: boolean;
  trailPositions: Vec2[];
}

export interface Puck {
  pos: Vec2;
  vel: Vec2;
  angle: number;
  state: PuckState;
  holderId: number | null;
  stateTimer: number;
  splitPucks?: Puck[];
  curveDirection?: number;
  whirlwindTimer?: number;
}

export interface Item {
  id: number;
  type: ItemType;
  pos: Vec2;
  collected: boolean;
  respawnTimer: number;
}

export interface Goal {
  team: Team;
  x: number;
  y: number;
  width: number;
  depth: number;
  scored: boolean;
  shakeTimer: number;
}

export interface RinkConfig {
  width: number;
  height: number;
  boardThickness: number;
  cornerRadius: number;
  centerCircleRadius: number;
  goalWidth: number;
  goalDepth: number;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  type: 'ice' | 'spark' | 'star' | 'confetti' | 'fire' | 'whirlwind' | 'snow';
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

export interface IceTrail {
  points: Vec2[];
  team: Team;
  alpha: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  timer: number;
}

export interface GameState {
  players: Player[];
  puck: Puck;
  items: Item[];
  goals: Goal[];
  score: { red: number; blue: number };
  timeRemaining: number;
  periodLength: number;
  isPaused: boolean;
  isGameOver: boolean;
  faceoff: boolean;
  faceoffTimer: number;
  lastGoalTeam: Team | null;
  celebrationTimer: number;
  particles: Particle[];
  iceTrails: IceTrail[];
  screenShake: ScreenShake;
  comboReady: { red: boolean; blue: boolean };
  comboPlayers: { red: number[]; blue: number[] };
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pass: boolean;
  shoot: boolean;
  fight: boolean;
  special: boolean;
  item: boolean;
  passPressed: boolean;
  shootPressed: boolean;
  fightPressed: boolean;
  specialPressed: boolean;
  itemPressed: boolean;
}

export const RINK: RinkConfig = {
  width: 960,
  height: 540,
  boardThickness: 12,
  cornerRadius: 60,
  centerCircleRadius: 60,
  goalWidth: 100,
  goalDepth: 30,
};

export const PLAYER_RADIUS = 12;
export const PUCK_RADIUS = 6;
export const ITEM_RADIUS = 10;
export const STICK_LENGTH = 22;
export const GOALIE_STICK_LENGTH = 18;

export const FRICTION = 0.02;
export const BRAKE_FRICTION = 0.08;
export const PUCK_FRICTION = 0.005;
export const ACCELERATION = 0.8;
export const MAX_SPEED = 6.0;
export const TURN_FACTOR = 0.7;
export const BOUNCE_PLAYER = 0.6;
export const BOUNCE_BOARD = 0.8;
export const SHOT_POWER = 12;
export const PASS_POWER = 8;
export const SPECIAL_CHARGE_RATE = 0.3;
export const MAX_SPECIAL_CHARGE = 100;
export const FIGHT_DAMAGE = 15;
export const DOWN_TIME = 3.0;
export const FROZEN_TIME = 3.0;
export const PARALYZE_TIME = 1.5;
export const SPEED_BOOST = 1.8;
export const SPEED_BOOST_DURATION = 8;
export const LONG_STICK_BOOST = 1.5;
export const LONG_STICK_DURATION = 10;
export const ITEM_SPAWN_INTERVAL = 8;
export const MAX_ITEMS = 4;
