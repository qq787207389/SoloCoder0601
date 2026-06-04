import { GameState, Player, COURT, TeamSide } from './types'
import { distance, getLeftTeamDefaultPosition, getRightTeamDefaultPosition } from './utils'
import { performReceive, performSet, performSpike, checkPlayerBallCollision } from './physics'

export function updateAI(state: GameState, _deltaTime: number) {
  if (state.phase === 'serve' && state.servingSide === 'right') {
    state.serveTimer++
    if (state.serveTimer > 60) {
      performAIServe(state)
    }
  }

  state.rightTeam.forEach(player => {
    updateAIPlayer(player, state, 'right')
  })

  state.leftTeam.forEach(player => {
    if (!player.isControlled) {
      updateAIPlayer(player, state, 'left')
    }
  })
}

function performAIServe(state: GameState) {
  const { ball } = state
  const server = state.rightTeam.find(p => p.position === 'backMiddle') || state.rightTeam[3]

  ball.isActive = true
  ball.position.x = server.positionOnCourt.x
  ball.position.y = server.positionOnCourt.y
  ball.height = 40
  ball.heightVelocity = 3

  const targetX = COURT.LEFT + 180 + Math.random() * 100
  const targetY = COURT.BOTTOM - 100 + Math.random() * 80
  const dx = targetX - ball.position.x
  const dy = targetY - ball.position.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  ball.velocity.x = (dx / dist) * 7
  ball.velocity.y = (dy / dist) * 3
  ball.lastTouch = 'right'
  ball.touchCount = 1
  state.phase = 'rally'

  state.effects.push({
    type: 'dust',
    position: { ...ball.position },
    lifetime: 20,
    maxLifetime: 20,
    size: 15
  })
}

function updateAIPlayer(player: Player, state: GameState, side: TeamSide) {
  const { ball } = state
  const getDefensive = side === 'left' ? getLeftTeamDefaultPosition : getRightTeamDefaultPosition

  if (state.phase === 'serve') {
    const defPos = getDefensive(player.position)
    player.targetPosition = defPos
    return
  }

  if (!ball.isActive) return

  const isFrontRow = player.position.includes('front')
  const ballOnOurSide = side === 'left'
    ? ball.position.x < COURT.NET_X
    : ball.position.x > COURT.NET_X
  const ballComingToUs = side === 'left'
    ? ball.velocity.x < -1
    : ball.velocity.x > 1

  if (ballOnOurSide || ballComingToUs) {
    if (ball.lastTouch !== side) {
      if (isFrontRow) {
        if (ball.height > 30) {
          player.targetPosition.x = side === 'left' ? COURT.NET_X - 40 : COURT.NET_X + 40
          player.targetPosition.y = ball.position.y

          if (ball.height > 40 && ball.height < 80 && !player.isJumping &&
              Math.abs(player.positionOnCourt.x - (side === 'left' ? COURT.NET_X - 30 : COURT.NET_X + 30)) < 60) {
            player.isJumping = true
            player.jumpVelocity = 12
          }
        } else {
          player.targetPosition.x = ball.position.x
          player.targetPosition.y = ball.position.y
        }
      } else {
        const distToBall = distance(player.positionOnCourt, ball.position)
        if (distToBall < 200) {
          player.targetPosition = { x: ball.position.x, y: ball.position.y }

          if (ball.height < 20 && distToBall < 50 && !player.isDiving) {
            player.isDiving = true
            player.diveTimer = 25
          }
        } else {
          player.targetPosition = getDefensive(player.position)
        }
      }
    } else {
      if (isFrontRow && ball.touchCount === 1) {
        player.targetPosition.x = side === 'left' ? COURT.NET_X - 50 : COURT.NET_X + 50
        player.targetPosition.y = COURT.TOP + 80

        if (!player.isJumping && ball.height > 40 && ball.height < 80) {
          player.isJumping = true
          player.jumpVelocity = 12
        }
      } else if (!isFrontRow && ball.touchCount === 0) {
        player.targetPosition = { x: ball.position.x, y: ball.position.y }
      } else {
        player.targetPosition = getDefensive(player.position)
      }
    }
  } else {
    player.targetPosition = getDefensive(player.position)
  }

  tryAIAction(player, state, side)
}

function tryAIAction(player: Player, state: GameState, side: TeamSide) {
  const { ball } = state
  if (!ball.isActive) return

  if (ball.lastTouch === side && ball.touchCount >= ball.maxTouches) return

  const canReach = checkPlayerBallCollision(state, player)
  if (!canReach) return

  const isOurTeamBall = ball.lastTouch === side

  if (!isOurTeamBall) {
    if (ball.touchCount < ball.maxTouches) {
      performReceive(player, ball, side, 0.75)
      state.effects.push({
        type: 'dust',
        position: { ...ball.position },
        lifetime: 20,
        maxLifetime: 20,
        size: 10
      })
      state.rallyCount++
    }
  } else {
    if (ball.touchCount === 1) {
      performSet(player, ball, side, 0.8)
      state.effects.push({
        type: 'dust',
        position: { ...ball.position },
        lifetime: 20,
        maxLifetime: 20,
        size: 10
      })
      state.rallyCount++
    } else if (ball.touchCount === 2) {
      const isFrontRow = player.position.includes('front')
      if (isFrontRow) {
        performSpike(player, ball, side, 0.85)
        state.effects.push({
          type: 'flash',
          position: { ...ball.position },
          lifetime: 10,
          maxLifetime: 10
        })
      } else {
        performSet(player, ball, side, 0.6)
      }
      state.rallyCount++
    }
  }
}
