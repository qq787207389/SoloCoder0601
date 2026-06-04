export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  BOSS_INTRO = 'BOSS_INTRO',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
  TRANSITION = 'TRANSITION'
}

export enum CharacterState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  PUNCH = 'PUNCH',
  KICK = 'KICK',
  SPECIAL = 'SPECIAL',
  HURT = 'HURT',
  BLOCK = 'BLOCK',
  DEAD = 'DEAD'
}

export type MoveType =
  | 'PUNCH'
  | 'KICK'
  | 'DASH_PUNCH'
  | 'UPPERCUT'
  | 'SWEEP'
  | 'FLYING_KICK'
  | 'ULTIMATE_COMBO'
  | 'QI_WAVE';

export interface MoveData {
  damage: number;
  startup: number;
  active: number;
  recovery: number;
  knockback: number;
  kiGain?: number;
  kiCost?: number;
}

export interface Character {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  health: number;
  maxHealth: number;
  state: CharacterState;
  facing: 1 | -1;
  isGrounded: boolean;
  superArmor: boolean;
  ki: number;
  maxKi: number;
  combo: number;
}

export enum EnemyType {
  NORMAL = 'NORMAL',
  ARCHER = 'ARCHER',
  BRUISER = 'BRUISER'
}

export enum BossType {
  SHAOLIN_MONK = 'SHAOLIN_MONK',
  EMEI_NUN = 'EMEI_NUN',
  MONGOL_WRESTLER = 'MONGOL_WRESTLER',
  NINJA = 'NINJA',
  OLD_MASTER = 'OLD_MASTER',
  SENIOR_BROTHER = 'SENIOR_BROTHER'
}

export enum ItemType {
  MANTOU = 'MANTOU',
  TEA = 'TEA',
  COIN = 'COIN'
}
