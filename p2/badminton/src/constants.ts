import { AIStyle, ShotType } from './types';

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

export const COURT_WIDTH = 800;
export const COURT_HEIGHT = 480;
export const COURT_X = 80;
export const COURT_Y = 80;
export const NET_X = COURT_X + COURT_WIDTH / 2;
export const NET_HEIGHT = 60;

export const PLAYER_SPEED = 220;
export const PLAYER_SIZE = 16;
export const MAX_STAMINA = 100;
export const STAMINA_REGEN = 8;
export const SPECIAL_COST = 100;
export const STUN_DURATION = 1.2;
export const SWING_DURATION = 0.2;

export const GRAVITY = 350;
export const AIR_RESISTANCE = 0.992;
export const WIND_STRENGTH = 40;
export const WIND_CHANGE_INTERVAL = 8;
export const BALL_RADIUS = 4;

export const HIT_RADIUS = 45;
export const PERFECT_HIT_WINDOW = 0.12;
export const GOOD_HIT_WINDOW = 0.25;

export const POINTS_TO_WIN = 15;
export const GAMES_TO_WIN = 2;

export const SHOT_SPEEDS: Record<ShotType, number> = {
  [ShotType.CLEAR]: 280,
  [ShotType.DRIVE]: 420,
  [ShotType.DROP]: 180,
  [ShotType.SMASH]: 520,
  [ShotType.SPECIAL]: 680
};

export const SHOT_HEIGHTS: Record<ShotType, number> = {
  [ShotType.CLEAR]: 180,
  [ShotType.DRIVE]: 50,
  [ShotType.DROP]: 30,
  [ShotType.SMASH]: 10,
  [ShotType.SPECIAL]: 5
};

export const SHOT_VZ: Record<ShotType, number> = {
  [ShotType.CLEAR]: 380,
  [ShotType.DRIVE]: 200,
  [ShotType.DROP]: 150,
  [ShotType.SMASH]: -150,
  [ShotType.SPECIAL]: -250
};

export const SHOT_ANGLES: Record<ShotType, number> = {
  [ShotType.CLEAR]: -0.8,
  [ShotType.DRIVE]: -0.15,
  [ShotType.DROP]: -0.4,
  [ShotType.SMASH]: -0.05,
  [ShotType.SPECIAL]: -0.02
};

export const AI_STYLES: AIStyle[] = [AIStyle.DEFENSIVE, AIStyle.AGGRESSIVE, AIStyle.NET];

export const AI_REACTION_TIME = {
  [AIStyle.DEFENSIVE]: 0.15,
  [AIStyle.AGGRESSIVE]: 0.1,
  [AIStyle.NET]: 0.08
};

export const AI_POSITION_BIAS = {
  [AIStyle.DEFENSIVE]: { x: 0, y: 0.3 },
  [AIStyle.AGGRESSIVE]: { x: 0, y: -0.2 },
  [AIStyle.NET]: { x: 0, y: -0.4 }
};

export const COLORS = {
  COURT: '#1a4d2e',
  COURT_DARK: '#143d24',
  LINE: '#ffffff',
  PLAYER: '#e74c3c',
  PLAYER_DARK: '#c0392b',
  AI: '#3498db',
  AI_DARK: '#2980b9',
  BALL: '#f1c40f',
  BALL_DARK: '#f39c12',
  NET: '#bdc3c7',
  NET_DARK: '#7f8c8d',
  SHADOW: 'rgba(0, 0, 0, 0.3)',
  STAMINA_FILL: '#2ecc71',
  STAMINA_BG: '#2c3e50',
  HUD_TEXT: '#ffffff',
  MENU_BG: 'rgba(0, 0, 0, 0.85)',
  DUST: '#95a5a6',
  STAR: '#f1c40f'
};

export const PIXEL_FONT = "'Press Start 2P', monospace";
