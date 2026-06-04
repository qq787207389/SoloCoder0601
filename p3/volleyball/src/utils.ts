import { Vector2, COURT, Player } from './types'

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function distance(a: Vector2, b: Vector2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x ** 2 + v.y ** 2)
  if (len === 0) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function getDefaultPosition(side: 'left' | 'right', position: string): Vector2 {
  const baseX = side === 'left' ? COURT.LEFT + 100 : COURT.RIGHT - 100
  const offsetX = side === 'left' ? 0 : COURT.WIDTH - 200
  
  switch (position) {
    case 'frontLeft':
      return { x: COURT.LEFT + 120 + offsetX * (side === 'right' ? 0 : 0), y: COURT.TOP + 80 }
    case 'frontMiddle':
      return { x: COURT.LEFT + 200 + offsetX * (side === 'right' ? 0 : 0), y: COURT.TOP + 60 }
    case 'frontRight':
      return { x: COURT.LEFT + 280 + offsetX * (side === 'right' ? 0 : 0), y: COURT.TOP + 80 }
    case 'backLeft':
      return { x: COURT.LEFT + 120 + offsetX * (side === 'right' ? 0 : 0), y: COURT.BOTTOM - 60 }
    case 'backMiddle':
      return { x: COURT.LEFT + 200 + offsetX * (side === 'right' ? 0 : 0), y: COURT.BOTTOM - 40 }
    case 'backRight':
      return { x: COURT.LEFT + 280 + offsetX * (side === 'right' ? 0 : 0), y: COURT.BOTTOM - 60 }
    default:
      return { x: baseX, y: COURT.TOP + COURT.HEIGHT / 2 }
  }
}

export function getLeftTeamDefaultPosition(position: string): Vector2 {
  switch (position) {
    case 'frontLeft':
      return { x: COURT.LEFT + 120, y: COURT.TOP + 100 }
    case 'frontMiddle':
      return { x: COURT.LEFT + 200, y: COURT.TOP + 80 }
    case 'frontRight':
      return { x: COURT.LEFT + 280, y: COURT.TOP + 100 }
    case 'backLeft':
      return { x: COURT.LEFT + 120, y: COURT.BOTTOM - 80 }
    case 'backMiddle':
      return { x: COURT.LEFT + 200, y: COURT.BOTTOM - 60 }
    case 'backRight':
      return { x: COURT.LEFT + 280, y: COURT.BOTTOM - 80 }
    default:
      return { x: COURT.LEFT + 200, y: COURT.TOP + COURT.HEIGHT / 2 }
  }
}

export function getRightTeamDefaultPosition(position: string): Vector2 {
  switch (position) {
    case 'frontLeft':
      return { x: COURT.RIGHT - 120, y: COURT.TOP + 100 }
    case 'frontMiddle':
      return { x: COURT.RIGHT - 200, y: COURT.TOP + 80 }
    case 'frontRight':
      return { x: COURT.RIGHT - 280, y: COURT.TOP + 100 }
    case 'backLeft':
      return { x: COURT.RIGHT - 120, y: COURT.BOTTOM - 80 }
    case 'backMiddle':
      return { x: COURT.RIGHT - 200, y: COURT.BOTTOM - 60 }
    case 'backRight':
      return { x: COURT.RIGHT - 280, y: COURT.BOTTOM - 80 }
    default:
      return { x: COURT.RIGHT - 200, y: COURT.TOP + COURT.HEIGHT / 2 }
  }
}

export function findNearestPlayer(players: Player[], target: Vector2): Player | null {
  if (players.length === 0) return null
  return players.reduce((nearest, player) => {
    const distToCurrent = distance(player.positionOnCourt, target)
    const distToNearest = distance(nearest.positionOnCourt, target)
    return distToCurrent < distToNearest ? player : nearest
  })
}

export function predictBallLanding(ballPos: Vector2, ballVel: Vector2, height: number): Vector2 {
  const gravity = 0.5
  let h = height
  let vy = ballVel.y
  let vx = ballVel.x
  let x = ballPos.x
  let y = ballPos.y
  
  while (h > 0) {
    h += vy
    vy -= gravity * 0.1
    x += vx
    y += vy * 0.1
    if (h <= 0) break
  }
  
  return { x, y }
}
