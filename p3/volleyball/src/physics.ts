import { GameState, Ball, Player, COURT, TeamSide } from './types'
import { clamp, distance, randomRange } from './utils'
import { resetForNextPoint } from './gameState'

const GRAVITY = 0.5
const BALL_RADIUS = 8
const PLAYER_REACH = 35
const NET_HEIGHT = COURT.NET_HEIGHT

export function updateBallPhysics(state: GameState, _deltaTime: number) {
  const { ball } = state

  if (!ball.isActive) return

  ball.velocity.x += state.wind * 0.01

  ball.position.x += ball.velocity.x
  ball.position.y += ball.velocity.y

  ball.heightVelocity -= GRAVITY
  ball.height += ball.heightVelocity

  ball.shadowPosition.x = ball.position.x
  ball.shadowPosition.y = ball.position.y

  if (ball.height <= 0) {
    ball.height = 0
    ball.heightVelocity = 0
    handleBallGroundCollision(state)
  }

  if (ball.position.x < COURT.LEFT || ball.position.x > COURT.RIGHT) {
    ball.velocity.x *= -0.6
    ball.position.x = clamp(ball.position.x, COURT.LEFT + 5, COURT.RIGHT - 5)
  }

  if (ball.position.y < COURT.TOP || ball.position.y > COURT.BOTTOM) {
    ball.velocity.y *= -0.6
    ball.position.y = clamp(ball.position.y, COURT.TOP + 5, COURT.BOTTOM - 5)
  }

  if (Math.abs(ball.position.x - COURT.NET_X) < 12 && ball.height < NET_HEIGHT) {
    if (ball.height < NET_HEIGHT * 0.9) {
      ball.velocity.x *= -0.6
      ball.position.x = ball.position.x < COURT.NET_X ? COURT.NET_X - 13 : COURT.NET_X + 13
      ball.heightVelocity *= 0.5
    }
  }
}

function handleBallGroundCollision(state: GameState) {
  const { ball } = state

  if (state.phase === 'point') return

  const inCourt = ball.position.x > COURT.LEFT && ball.position.x < COURT.RIGHT &&
                  ball.position.y > COURT.TOP && ball.position.y < COURT.BOTTOM

  if (inCourt) {
    const inLeftCourt = ball.position.x < COURT.NET_X
    state.phase = 'point'
    state.pointTimer = 90
    const winner = inLeftCourt ? 'right' : 'left'
    setTimeout(() => {
      resetForNextPoint(state, winner)
    }, 2000)
  }

  ball.velocity.x *= 0.6
  ball.velocity.y *= 0.6
}

export function checkPlayerBallCollision(state: GameState, player: Player, _isSpecial: boolean = false): boolean {
  const { ball } = state
  if (!ball.isActive) return false

  const playerHeight = player.isJumping ? player.jumpHeight : 0
  const dist = distance(ball.position, player.positionOnCourt)
  const heightDiff = Math.abs(ball.height - playerHeight)

  if (dist < PLAYER_REACH + BALL_RADIUS && heightDiff < PLAYER_REACH) {
    return true
  }
  return false
}

export function performReceive(_player: Player, ball: Ball, side: TeamSide, quality: number = 1) {
  const targetX = side === 'left'
    ? COURT.LEFT + 200
    : COURT.RIGHT - 200
  const targetY = COURT.TOP + COURT.HEIGHT / 2

  const dx = targetX - ball.position.x
  const dy = targetY - ball.position.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const power = 6 * quality

  ball.velocity.x = (dx / dist) * power
  ball.velocity.y = (dy / dist) * power * 0.3
  ball.heightVelocity = 5 * quality
  ball.lastTouch = side
  ball.touchCount++
}

export function performSet(_player: Player, ball: Ball, side: TeamSide, quality: number = 1) {
  const frontPositions = side === 'left'
    ? [{ x: COURT.LEFT + 180, y: COURT.TOP + 80 }, { x: COURT.LEFT + 280, y: COURT.TOP + 80 }]
    : [{ x: COURT.RIGHT - 180, y: COURT.TOP + 80 }, { x: COURT.RIGHT - 280, y: COURT.TOP + 80 }]

  const target = frontPositions[Math.floor(Math.random() * frontPositions.length)]

  const dx = target.x - ball.position.x
  const dy = target.y - ball.position.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  ball.velocity.x = (dx / dist) * 4 * quality
  ball.velocity.y = (dy / dist) * 2 * quality
  ball.heightVelocity = 7 * quality
  ball.lastTouch = side
  ball.touchCount++
}

export function performSpike(_player: Player, ball: Ball, side: TeamSide, quality: number = 1, isSpecial: boolean = false) {
  const targetX = side === 'left' ? COURT.RIGHT - 120 : COURT.LEFT + 120
  const targetY = COURT.BOTTOM - 80 + randomRange(-40, 40)

  const dx = targetX - ball.position.x
  const dy = targetY - ball.position.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const power = isSpecial ? 14 : 10 * quality

  ball.velocity.x = (dx / dist) * power
  ball.velocity.y = (dy / dist) * power * 0.5
  ball.heightVelocity = -2
  ball.lastTouch = side
  ball.touchCount++
}

export function performBlock(_player: Player, ball: Ball, side: TeamSide, isSpecial: boolean = false) {
  const reflectFactor = isSpecial ? 0.9 : 0.7
  ball.velocity.x *= -reflectFactor
  ball.velocity.y *= 0.5
  ball.heightVelocity = 4
  ball.lastTouch = side
  ball.touchCount = 1
}

export function updatePlayerPhysics(player: Player, _deltaTime: number) {
  const moveSpeed = 3.5

  const dx = player.targetPosition.x - player.positionOnCourt.x
  const dy = player.targetPosition.y - player.positionOnCourt.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist > 1) {
    const moveX = (dx / dist) * moveSpeed
    const moveY = (dy / dist) * moveSpeed

    player.positionOnCourt.x += moveX
    player.positionOnCourt.y += moveY
  }

  player.positionOnCourt.x = clamp(player.positionOnCourt.x, COURT.LEFT + 20, COURT.RIGHT - 20)
  player.positionOnCourt.y = clamp(player.positionOnCourt.y, COURT.TOP + 20, COURT.BOTTOM - 20)

  if (player.isJumping) {
    player.jumpHeight += player.jumpVelocity
    player.jumpVelocity -= 0.8

    if (player.jumpHeight <= 0) {
      player.jumpHeight = 0
      player.isJumping = false
      player.jumpVelocity = 0
    }
  }

  if (player.isDiving) {
    player.diveTimer--
    if (player.diveTimer <= 0) {
      player.isDiving = false
    }
  }

  player.shadowY = player.positionOnCourt.y
}
