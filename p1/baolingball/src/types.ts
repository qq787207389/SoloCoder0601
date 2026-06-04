export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Ball {
  position: Vector3;
  velocity: Vector3;
  spin: number;
  radius: number;
  isRolling: boolean;
}

export interface Pin {
  id: number;
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
  angularVelocity: Vector3;
  isStanding: boolean;
  hasFallen: boolean;
  fallTimer: number;
}

export type LaneCondition = 'normal' | 'oiled' | 'worn';

export interface Player {
  id: number;
  name: string;
  scores: number[][];
  currentFrame: number;
  currentRoll: number;
  totalScore: number;
}

export type GameState = 'menu' | 'setup' | 'aiming' | 'power' | 'rolling' | 'result' | 'gameover';

export interface GameConfig {
  laneLength: number;
  laneWidth: number;
  pinDeckZ: number;
  gutterWidth: number;
  ballRadius: number;
  pinHeight: number;
  pinRadius: number;
}

export const CONFIG: GameConfig = {
  laneLength: 15,
  laneWidth: 1.067,
  pinDeckZ: 12,
  gutterWidth: 0.25,
  ballRadius: 0.1075,
  pinHeight: 0.38,
  pinRadius: 0.06
};
