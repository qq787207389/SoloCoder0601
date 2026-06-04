import { GameState, COURT, Vector2, Player } from './types'
import { createInitialState, resetForNextPoint, checkSetWin, checkMatchWin, swapSides } from './gameState'
import { InputManager } from './input'
import { Renderer } from './renderer'
import { updateBallPhysics, updatePlayerPhysics, checkPlayerBallCollision, performReceive, performSet, performSpike, performBlock } from './physics'
import { updateAI } from './ai'
import { audioManager } from './audio'
import { findNearestPlayer, clamp } from './utils'

class VolleyballGame {
  private canvas: HTMLCanvasElement
  private input: InputManager
  private renderer: Renderer
  private state: GameState
  private lastTime: number = 0
  private animationId: number = 0

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    this.input = new InputManager(this.canvas)
    this.renderer = new Renderer(this.canvas)
    this.state = createInitialState()

    audioManager.init()
    this.setupCanvasEvents()
  }

  private setupCanvasEvents() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      const clickPos: Vector2 = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
      this.switchToNearestPlayer(clickPos)
    })
  }

  private switchToNearestPlayer(pos: Vector2) {
    const leftPlayers = this.state.leftTeam
    const nearest = findNearestPlayer(leftPlayers, pos)

    if (nearest) {
      this.state.leftTeam.forEach(p => p.isControlled = false)
      nearest.isControlled = true
    }
  }

  start() {
    this.lastTime = performance.now()
    this.gameLoop()
  }

  private gameLoop() {
    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 16.67
    this.lastTime = currentTime

    this.update(deltaTime)
    this.renderer.render(this.state)

    this.input.clearFrameState()
    this.animationId = requestAnimationFrame(() => this.gameLoop())
  }

  private update(deltaTime: number) {
    if (this.state.phase === 'end') return

    this.handleInput()
    this.updatePlayers(deltaTime)
    updateAI(this.state, deltaTime)
    updateBallPhysics(this.state, deltaTime)
    this.checkCollisions()
    this.updateEffects()
    this.updateAudience()
    this.updateBallServePosition()
    this.checkWinConditions()
  }

  private updateBallServePosition() {
    if (this.state.phase !== 'serve') return
    const { ball } = this.state
    if (ball.isActive) return

    if (this.state.servingSide === 'left') {
      const server = this.state.leftTeam.find(p => p.position === 'backMiddle') || this.state.leftTeam[3]
      ball.position.x = server.positionOnCourt.x + 20
      ball.position.y = server.positionOnCourt.y - 20
      ball.shadowPosition.x = ball.position.x
      ball.shadowPosition.y = ball.position.y
      ball.height = 30 + Math.sin(Date.now() / 300) * 5
    }
  }

  private handleInput() {
    const controlledPlayer = this.state.leftTeam.find(p => p.isControlled)
    if (!controlledPlayer) return

    const moveVector = this.input.getMovementVector()
    const speed = 5

    if (!controlledPlayer.isDiving) {
      controlledPlayer.targetPosition.x = controlledPlayer.positionOnCourt.x + moveVector.x * speed
      controlledPlayer.targetPosition.y = controlledPlayer.positionOnCourt.y + moveVector.y * speed

      controlledPlayer.targetPosition.x = clamp(
        controlledPlayer.targetPosition.x,
        COURT.LEFT + 20,
        COURT.NET_X - 20
      )
      controlledPlayer.targetPosition.y = clamp(
        controlledPlayer.targetPosition.y,
        COURT.TOP + 20,
        COURT.BOTTOM - 20
      )
    }

    if (this.input.isActionPressed()) {
      this.handleAction(controlledPlayer)
    }

    if (this.input.isSpecialPressed()) {
      this.handleSpecial(controlledPlayer)
    }
  }

  private handleAction(player: Player) {
    const { ball } = this.state

    if (this.state.phase === 'point') return

    if (this.state.phase === 'serve' && this.state.servingSide === 'left') {
      ball.isActive = true
      ball.height = 30
      ball.heightVelocity = 2
      ball.velocity.x = 5
      ball.velocity.y = -3
      ball.lastTouch = 'left'
      ball.touchCount = 1
      this.state.phase = 'rally'
      audioManager.playHit()
      return
    }

    if (this.state.phase === 'serve') return

    const canReach = checkPlayerBallCollision(this.state, player)

    if (canReach && ball.lastTouch !== 'left' && ball.touchCount < ball.maxTouches) {
      const isFrontRow = player.position.includes('front')
      const height = ball.height

      if (ball.touchCount === 0) {
        this.performPlayerReceive(player)
      } else if (ball.touchCount === 1) {
        if (isFrontRow && height > 30) {
          this.performPlayerSpike(player)
        } else {
          this.performPlayerSet(player)
        }
      } else if (ball.touchCount === 2) {
        this.performPlayerSpike(player)
      }
    }

    if (player.positionOnCourt.x > COURT.NET_X - 80 &&
        ball.position.x > COURT.NET_X - 20 &&
        !player.isJumping && ball.isActive) {
      player.isJumping = true
      player.jumpVelocity = 14

      setTimeout(() => {
        if (checkPlayerBallCollision(this.state, player)) {
          performBlock(player, ball, 'left')
          audioManager.playBlock()
          this.addBlockEffect(ball.position)
        }
      }, 200)
    }
  }

  private handleSpecial(player: Player) {
    if (player.specialGauge < player.maxSpecialGauge) return

    const { ball } = this.state

    if (ball.isActive && checkPlayerBallCollision(this.state, player, true)) {
      player.specialGauge = 0
      performSpike(player, ball, 'left', 1.5, true)
      audioManager.playSpecial()
      this.addSpecialEffect(ball.position)
      this.state.rallyCount++
    }
  }

  private performPlayerReceive(player: Player) {
    performReceive(player, this.state.ball, 'left', 0.9)
    audioManager.playReceive()
    this.addHitEffect(this.state.ball.position)
    this.state.rallyCount++
    this.state.phase = 'rally'
  }

  private performPlayerSet(player: Player) {
    performSet(player, this.state.ball, 'left', 0.9)
    audioManager.playSet()
    this.addHitEffect(this.state.ball.position)
    this.state.rallyCount++
  }

  private performPlayerSpike(player: Player) {
    if (!player.isJumping && player.position.includes('front')) {
      player.isJumping = true
      player.jumpVelocity = 12
    }

    setTimeout(() => {
      if (checkPlayerBallCollision(this.state, player)) {
        performSpike(player, this.state.ball, 'left', 1)
        audioManager.playSpike()
        this.addSpikeEffect(this.state.ball.position, this.state.ball.velocity)
        this.state.rallyCount++

        player.specialGauge = Math.min(player.specialGauge + 20, player.maxSpecialGauge)
      }
    }, 150)
  }

  private updatePlayers(deltaTime: number) {
    this.state.leftTeam.forEach(player => updatePlayerPhysics(player, deltaTime))
    this.state.rightTeam.forEach(player => updatePlayerPhysics(player, deltaTime))
  }

  private checkCollisions() {
    const { ball, leftTeam, rightTeam } = this.state

    if (this.state.phase === 'serve' || this.state.phase === 'point') return
    if (!ball.isActive) return

    leftTeam.forEach(player => {
      if (player.isControlled) return
      if (checkPlayerBallCollision(this.state, player) && ball.lastTouch !== 'left') {
        if (ball.touchCount < ball.maxTouches) {
          if (ball.touchCount === 0) {
            performReceive(player, ball, 'left', 0.7)
            audioManager.playReceive()
            this.addHitEffect(ball.position)
          } else if (ball.touchCount === 1) {
            performSet(player, ball, 'left', 0.7)
            audioManager.playSet()
            this.addHitEffect(ball.position)
          }
          this.state.rallyCount++
        }
      }
    })

    rightTeam.forEach(player => {
      if (checkPlayerBallCollision(this.state, player) && ball.lastTouch !== 'right') {
        if (ball.touchCount < ball.maxTouches) {
          if (ball.touchCount === 0) {
            performReceive(player, ball, 'right', 0.7)
            audioManager.playReceive()
            this.addHitEffect(ball.position)
          } else if (ball.touchCount === 1) {
            performSet(player, ball, 'right', 0.7)
            audioManager.playSet()
            this.addHitEffect(ball.position)
          } else if (ball.touchCount === 2 && player.position.includes('front')) {
            performSpike(player, ball, 'right', 0.8)
            audioManager.playSpike()
            this.addSpikeEffect(ball.position, ball.velocity)
          }
          this.state.rallyCount++
        }
      }
    })
  }

  private addHitEffect(position: Vector2) {
    this.state.effects.push({
      type: 'dust',
      position: { ...position },
      lifetime: 20,
      maxLifetime: 20,
      size: 15
    })
  }

  private addSpikeEffect(position: Vector2, velocity: Vector2) {
    this.state.effects.push({
      type: 'flash',
      position: { ...position },
      lifetime: 10,
      maxLifetime: 10
    })

    for (let i = 0; i < 5; i++) {
      this.state.effects.push({
        type: 'speedLine',
        position: { ...position },
        velocity: { x: -velocity.x, y: velocity.y },
        lifetime: 15 + i * 3,
        maxLifetime: 30
      })
    }
  }

  private addBlockEffect(position: Vector2) {
    this.state.effects.push({
      type: 'flash',
      position: { ...position },
      lifetime: 8,
      maxLifetime: 8
    })
  }

  private addSpecialEffect(position: Vector2) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fd2']

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2
      this.state.effects.push({
        type: 'particle',
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * 5,
          y: Math.sin(angle) * 5
        },
        lifetime: 40,
        maxLifetime: 40,
        color: colors[i % colors.length],
        size: 6
      })
    }

    this.state.effects.push({
      type: 'flash',
      position: { ...position },
      lifetime: 15,
      maxLifetime: 15
    })
  }

  private addScoreEffect(winner: 'left' | 'right') {
    const baseX = winner === 'left' ? COURT.LEFT + 200 : COURT.RIGHT - 200
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fd2']

    for (let i = 0; i < 30; i++) {
      this.state.effects.push({
        type: 'confetti',
        position: { x: baseX + Math.random() * 100 - 50, y: COURT.TOP + Math.random() * 50 },
        velocity: { x: (Math.random() - 0.5) * 4, y: -Math.random() * 3 },
        lifetime: 60 + Math.random() * 30,
        maxLifetime: 90,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
  }

  private updateEffects() {
    this.state.effects = this.state.effects.filter(effect => {
      effect.lifetime--

      if (effect.velocity) {
        effect.position.x += effect.velocity.x
        effect.position.y += effect.velocity.y
      }

      return effect.lifetime > 0
    })
  }

  private updateAudience() {
    const excitementBase = 0.3
    const rallyBonus = Math.min(this.state.rallyCount * 0.05, 0.5)
    const scoreDiff = Math.abs(this.state.score.left - this.state.score.right)
    const closeGameBonus = scoreDiff < 3 ? 0.2 : 0

    this.state.audienceExcitement = Math.min(1, excitementBase + rallyBonus + closeGameBonus)
  }

  private checkWinConditions() {
    if (this.state.phase === 'point') {
      this.state.pointTimer--
      return
    }

    const setWinner = checkSetWin(this.state)
    if (setWinner) {
      this.state.sets[setWinner]++
      audioManager.playScore()
      this.addScoreEffect(setWinner)

      const matchWinner = checkMatchWin(this.state)
      if (matchWinner) {
        this.state.phase = 'end'
        setTimeout(() => {
          alert(`比赛结束! ${matchWinner === 'left' ? '红方' : '蓝方'}获胜!`)
          this.resetGame()
        }, 1000)
        return
      }

      this.state.currentSet++
      this.state.score = { left: 0, right: 0 }

      if (this.state.currentSet === 2) {
        swapSides(this.state)
      }

      setTimeout(() => {
        resetForNextPoint(this.state, setWinner)
      }, 2000)
    }
  }

  private resetGame() {
    this.state = createInitialState()
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new VolleyballGame()
  game.start()
})
