export interface Vector2 {
  x: number
  y: number
}

export type PlayerPosition = 'frontLeft' | 'frontMiddle' | 'frontRight' | 'backLeft' | 'backMiddle' | 'backRight'

export type TeamSide = 'left' | 'right'

export type GamePhase = 'serve' | 'receive' | 'set' | 'spike' | 'block' | 'rally' | 'point' | 'end'

export type ActionType = 'receive' | 'set' | 'spike' | 'block' | 'dive'

export interface Player {
  id: string
  name: string
  side: TeamSide
  position: PlayerPosition
  positionOnCourt: Vector2
  targetPosition: Vector2
  velocity: Vector2
  isJumping: boolean
  jumpHeight: number
  jumpVelocity: number
  isControlled: boolean
  isDiving: boolean
  diveTimer: number
  specialGauge: number
  maxSpecialGauge: number
  hasSpecial: boolean
  color: string
  shadowY: number
}

export interface Ball {
  position: Vector2
  velocity: Vector2
  shadowPosition: Vector2
  height: number
  heightVelocity: number
  isActive: boolean
  lastTouch: TeamSide | null
  touchCount: number
  maxTouches: number
}

export interface GameState {
  phase: GamePhase
  currentAction: ActionType | null
  ball: Ball
  leftTeam: Player[]
  rightTeam: Player[]
  score: { left: number; right: number }
  sets: { left: number; right: number }
  currentSet: number
  servingSide: TeamSide
  wind: number
  rallyCount: number
  effects: Effect[]
  audienceExcitement: number
  serveTimer: number
  pointTimer: number
}

export interface Effect {
  type: 'flash' | 'speedLine' | 'dust' | 'particle' | 'confetti'
  position: Vector2
  velocity?: Vector2
  lifetime: number
  maxLifetime: number
  color?: string
  size?: number
}

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  action: boolean
  special: boolean
  mousePos: Vector2
}

export const COURT = {
  WIDTH: 800,
  HEIGHT: 400,
  NET_X: 400,
  NET_HEIGHT: 80,
  TOP: 120,
  BOTTOM: 520,
  LEFT: 80,
  RIGHT: 880,
} as const

export const COLORS = {
  COURT: '#4a90d9',
  COURT_LINES: '#ffffff',
  NET: '#ffffff',
  BALL: '#f5f5f5',
  LEFT_TEAM: '#e74c3c',
  RIGHT_TEAM: '#3498db',
  BACKGROUND: '#1a1a2e',
  GROUND: '#2d5a87',
} as const
