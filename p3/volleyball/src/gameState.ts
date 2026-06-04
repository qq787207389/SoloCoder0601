import { GameState, Ball, Player, COURT, COLORS, TeamSide } from './types'
import { getLeftTeamDefaultPosition, getRightTeamDefaultPosition, randomRange } from './utils'

function createPlayer(
  id: string,
  name: string,
  side: TeamSide,
  position: string,
  color: string
): Player {
  const posFn = side === 'left' ? getLeftTeamDefaultPosition : getRightTeamDefaultPosition
  const pos = posFn(position)
  return {
    id,
    name,
    side,
    position: position as Player['position'],
    positionOnCourt: { ...pos },
    targetPosition: { ...pos },
    velocity: { x: 0, y: 0 },
    isJumping: false,
    jumpHeight: 0,
    jumpVelocity: 0,
    isControlled: false,
    isDiving: false,
    diveTimer: 0,
    specialGauge: 0,
    maxSpecialGauge: 100,
    hasSpecial: false,
    color,
    shadowY: pos.y
  }
}

function createBall(side: TeamSide = 'right'): Ball {
  const startX = side === 'right' ? COURT.RIGHT - 120 : COURT.LEFT + 120
  const startY = side === 'right' ? COURT.BOTTOM - 80 : COURT.BOTTOM - 80
  return {
    position: { x: startX, y: startY },
    velocity: { x: 0, y: 0 },
    shadowPosition: { x: startX, y: startY },
    height: 30,
    heightVelocity: 0,
    isActive: false,
    lastTouch: null,
    touchCount: 0,
    maxTouches: 3
  }
}

export function createInitialState(): GameState {
  const leftTeam: Player[] = [
    createPlayer('l1', '主攻手', 'left', 'frontMiddle', COLORS.LEFT_TEAM),
    createPlayer('l2', '副攻手', 'left', 'frontLeft', COLORS.LEFT_TEAM),
    createPlayer('l3', '副攻手', 'left', 'frontRight', COLORS.LEFT_TEAM),
    createPlayer('l4', '二传手', 'left', 'backMiddle', COLORS.LEFT_TEAM),
    createPlayer('l5', '自由人', 'left', 'backLeft', COLORS.LEFT_TEAM),
    createPlayer('l6', '接应', 'left', 'backRight', COLORS.LEFT_TEAM)
  ]

  const rightTeam: Player[] = [
    createPlayer('r1', '主攻手', 'right', 'frontMiddle', COLORS.RIGHT_TEAM),
    createPlayer('r2', '副攻手', 'right', 'frontLeft', COLORS.RIGHT_TEAM),
    createPlayer('r3', '副攻手', 'right', 'frontRight', COLORS.RIGHT_TEAM),
    createPlayer('r4', '二传手', 'right', 'backMiddle', COLORS.RIGHT_TEAM),
    createPlayer('r5', '自由人', 'right', 'backLeft', COLORS.RIGHT_TEAM),
    createPlayer('r6', '接应', 'right', 'backRight', COLORS.RIGHT_TEAM)
  ]

  leftTeam[0].isControlled = true

  const servingSide: TeamSide = 'right'

  return {
    phase: 'serve',
    currentAction: null,
    ball: createBall(servingSide),
    leftTeam,
    rightTeam,
    score: { left: 0, right: 0 },
    sets: { left: 0, right: 0 },
    currentSet: 1,
    servingSide,
    wind: randomRange(-0.5, 0.5),
    rallyCount: 0,
    effects: [],
    audienceExcitement: 0.5,
    serveTimer: 0,
    pointTimer: 0
  }
}

export function resetForNextPoint(state: GameState, winner: TeamSide) {
  state.score[winner]++

  state.ball = createBall(winner)
  state.phase = 'serve'
  state.currentAction = null
  state.rallyCount = 0
  state.effects = []
  state.servingSide = winner
  state.serveTimer = 0
  state.pointTimer = 0

  state.leftTeam.forEach(p => {
    const pos = getLeftTeamDefaultPosition(p.position)
    p.positionOnCourt = { ...pos }
    p.targetPosition = { ...pos }
    p.isJumping = false
    p.jumpHeight = 0
    p.isDiving = false
    p.diveTimer = 0
    p.velocity = { x: 0, y: 0 }
  })

  state.rightTeam.forEach(p => {
    const pos = getRightTeamDefaultPosition(p.position)
    p.positionOnCourt = { ...pos }
    p.targetPosition = { ...pos }
    p.isJumping = false
    p.jumpHeight = 0
    p.isDiving = false
    p.diveTimer = 0
    p.velocity = { x: 0, y: 0 }
  })
}

export function checkSetWin(state: GameState): TeamSide | null {
  const { left, right } = state.score
  const winScore = 15

  if (left >= winScore && left - right >= 2) return 'left'
  if (right >= winScore && right - left >= 2) return 'right'
  return null
}

export function checkMatchWin(state: GameState): TeamSide | null {
  if (state.sets.left >= 2) return 'left'
  if (state.sets.right >= 2) return 'right'
  return null
}

export function swapSides(state: GameState) {
  const tempLeft = state.leftTeam.map(p => ({ ...p }))
  const tempRight = state.rightTeam.map(p => ({ ...p }))

  state.leftTeam = tempRight.map(p => {
    p.side = 'left'
    p.color = COLORS.LEFT_TEAM
    const pos = getLeftTeamDefaultPosition(p.position)
    p.positionOnCourt = { ...pos }
    p.targetPosition = { ...pos }
    return p
  })

  state.rightTeam = tempLeft.map(p => {
    p.side = 'right'
    p.color = COLORS.RIGHT_TEAM
    const pos = getRightTeamDefaultPosition(p.position)
    p.positionOnCourt = { ...pos }
    p.targetPosition = { ...pos }
    return p
  })

  state.leftTeam[0].isControlled = true
  state.rightTeam.forEach(p => p.isControlled = false)

  state.wind = randomRange(-0.5, 0.5)
}
