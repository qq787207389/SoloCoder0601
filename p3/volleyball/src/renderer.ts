import { GameState, COURT, COLORS, Player, Ball, Effect } from './types'

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.width = canvas.width
    this.height = canvas.height
  }

  clear() {
    this.ctx.fillStyle = COLORS.BACKGROUND
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  render(state: GameState) {
    this.clear()
    this.renderAudience(state)
    this.renderCourt()
    this.renderNet()
    this.renderWindIndicator(state)
    this.renderTeam(state.rightTeam)
    this.renderTeam(state.leftTeam)
    this.renderBallShadow(state.ball)
    this.renderBall(state.ball)
    this.renderEffects(state.effects)
    this.renderUI(state)
  }

  private renderCourt() {
    this.ctx.fillStyle = COLORS.COURT
    this.ctx.fillRect(COURT.LEFT, COURT.TOP, COURT.WIDTH, COURT.HEIGHT)

    this.ctx.strokeStyle = COLORS.COURT_LINES
    this.ctx.lineWidth = 3

    this.ctx.strokeRect(COURT.LEFT, COURT.TOP, COURT.WIDTH, COURT.HEIGHT)
    this.ctx.beginPath()
    this.ctx.moveTo(COURT.NET_X, COURT.TOP)
    this.ctx.lineTo(COURT.NET_X, COURT.BOTTOM)
    this.ctx.stroke()

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 1
    
    for (let i = 1; i < 8; i++) {
      const x = COURT.LEFT + (COURT.WIDTH / 8) * i
      this.ctx.beginPath()
      this.ctx.moveTo(x, COURT.TOP)
      this.ctx.lineTo(x, COURT.BOTTOM)
      this.ctx.stroke()
    }
  }

  private renderNet() {
    this.ctx.strokeStyle = COLORS.NET
    this.ctx.lineWidth = 4
    this.ctx.beginPath()
    this.ctx.moveTo(COURT.NET_X, COURT.TOP - 10)
    this.ctx.lineTo(COURT.NET_X, COURT.TOP + COURT.NET_HEIGHT)
    this.ctx.stroke()

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    this.ctx.lineWidth = 1
    
    for (let i = 0; i < 16; i++) {
      const y = COURT.TOP - 5 + i * 6
      this.ctx.beginPath()
      this.ctx.moveTo(COURT.NET_X - 3, y)
      this.ctx.lineTo(COURT.NET_X + 3, y)
      this.ctx.stroke()
    }
  }

  private renderAudience(state: GameState) {
    const excitement = state.audienceExcitement
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fd2']
    
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 40; i++) {
        const x = 40 + i * 22
        const y = 40 + row * 20 + Math.sin(Date.now() / 200 + i) * excitement * 5
        
        this.ctx.fillStyle = colors[(i + row) % colors.length]
        this.ctx.fillRect(x, y, 8, 12)
        
        this.ctx.fillStyle = '#ffd1a9'
        this.ctx.fillRect(x + 2, y - 6, 4, 6)
        
        if (Math.random() < excitement * 0.3) {
          this.ctx.fillStyle = colors[(i + 2) % colors.length]
          this.ctx.fillRect(x - 4, y - 2, 4, 2)
        }
      }
    }

    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 40; i++) {
        const x = 40 + i * 22
        const y = COURT.BOTTOM + 30 + row * 20 + Math.sin(Date.now() / 200 + i) * excitement * 5
        
        this.ctx.fillStyle = colors[(i + row + 2) % colors.length]
        this.ctx.fillRect(x, y, 8, 12)
        
        this.ctx.fillStyle = '#ffd1a9'
        this.ctx.fillRect(x + 2, y - 6, 4, 6)
      }
    }

    const coachX = 20
    const coachY = COURT.TOP + COURT.HEIGHT / 2
    const walkOffset = Math.sin(Date.now() / 500) * 10
    
    this.ctx.fillStyle = '#2c3e50'
    this.ctx.fillRect(coachX + walkOffset, coachY, 12, 20)
    this.ctx.fillStyle = '#ffd1a9'
    this.ctx.fillRect(coachX + walkOffset + 2, coachY - 10, 8, 10)
  }

  private renderTeam(players: Player[]) {
    players.forEach(player => this.renderPlayer(player))
  }

  private renderPlayer(player: Player) {
    const { x, y } = player.positionOnCourt
    const jumpOffset = player.jumpHeight
    const size = 16

    if (player.isDiving) {
      this.ctx.save()
      this.ctx.translate(x, y)
      this.ctx.rotate(player.diveTimer > 20 ? 0.5 : 0)
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      this.ctx.fillRect(-size / 2 - 5, size / 2 - 4, size + 15, 4)
      
      this.ctx.fillStyle = player.color
      this.ctx.fillRect(-size / 2 - 5, -size / 2, size + 15, size - 4)
      
      this.ctx.fillStyle = '#ffd1a9'
      this.ctx.fillRect(size / 2 + 5, -size / 2 - 4, 8, 8)
      
      this.ctx.restore()
    } else {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      this.ctx.beginPath()
      this.ctx.ellipse(x, y + size / 2 - jumpOffset / 2, size / 2, size / 4, 0, 0, Math.PI * 2)
      this.ctx.fill()
    }

    const drawY = y - jumpOffset

    if (!player.isDiving) {
      this.ctx.fillStyle = player.color
      this.ctx.fillRect(x - size / 2, drawY - size / 2, size, size + 4)

      this.ctx.fillStyle = '#ffd1a9'
      this.ctx.fillRect(x - size / 2 + 2, drawY - size / 2 - 10, size - 4, 10)
    }

    if (player.isControlled) {
      this.ctx.strokeStyle = '#ffff00'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(x, drawY, size + 4, 0, Math.PI * 2)
      this.ctx.stroke()

      this.ctx.fillStyle = '#ffff00'
      this.ctx.beginPath()
      this.ctx.moveTo(x, drawY - size - 15)
      this.ctx.lineTo(x - 6, drawY - size - 8)
      this.ctx.lineTo(x + 6, drawY - size - 8)
      this.ctx.closePath()
      this.ctx.fill()
    }

    if (player.hasSpecial && player.specialGauge >= player.maxSpecialGauge) {
      this.ctx.strokeStyle = `hsl(${(Date.now() / 10) % 360}, 100%, 50%)`
      this.ctx.lineWidth = 3
      this.ctx.setLineDash([5, 5])
      this.ctx.beginPath()
      this.ctx.arc(x, drawY, size + 8, 0, Math.PI * 2)
      this.ctx.stroke()
      this.ctx.setLineDash([])
    }
  }

  private renderBallShadow(ball: Ball) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    this.ctx.beginPath()
    this.ctx.ellipse(
      ball.shadowPosition.x,
      ball.shadowPosition.y + ball.height / 2,
      8 - ball.height / 20,
      4 - ball.height / 40,
      0, 0, Math.PI * 2
    )
    this.ctx.fill()
  }

  private renderBall(ball: Ball) {
    const drawY = ball.position.y - ball.height

    this.ctx.fillStyle = COLORS.BALL
    this.ctx.beginPath()
    this.ctx.arc(ball.position.x, drawY, 8, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.strokeStyle = '#888'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    this.ctx.arc(ball.position.x, drawY, 6, 0, Math.PI)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(ball.position.x - 6, drawY)
    this.ctx.lineTo(ball.position.x + 6, drawY)
    this.ctx.stroke()

    if (ball.isActive && (ball.velocity.x > 8 || ball.velocity.x < -8)) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      this.ctx.lineWidth = 2

      for (let i = 0; i < 3; i++) {
        const offsetY = (i - 1) * 6
        this.ctx.beginPath()
        this.ctx.moveTo(ball.position.x - ball.velocity.x * 0.5, drawY + offsetY)
        this.ctx.lineTo(ball.position.x - ball.velocity.x * 1.5, drawY + offsetY)
        this.ctx.stroke()
      }
    }
  }

  private renderEffects(effects: Effect[]) {
    effects.forEach(effect => {
      const alpha = effect.lifetime / effect.maxLifetime

      switch (effect.type) {
        case 'flash':
          this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
          this.ctx.fillRect(0, 0, this.width, this.height)
          break

        case 'speedLine':
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
          this.ctx.lineWidth = 3
          this.ctx.beginPath()
          this.ctx.moveTo(effect.position.x, effect.position.y)
          this.ctx.lineTo(
            effect.position.x - (effect.velocity?.x || 10) * 3,
            effect.position.y - (effect.velocity?.y || 0) * 3
          )
          this.ctx.stroke()
          break

        case 'dust':
          this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2
            const dist = (1 - alpha) * 30
            this.ctx.beginPath()
            this.ctx.arc(
              effect.position.x + Math.cos(angle) * dist,
              effect.position.y + Math.sin(angle) * dist,
              (effect.size || 10) * alpha,
              0, Math.PI * 2
            )
            this.ctx.fill()
          }
          break

        case 'particle':
          this.ctx.fillStyle = effect.color || '#ffffff'
          this.ctx.globalAlpha = alpha
          this.ctx.beginPath()
          this.ctx.arc(effect.position.x, effect.position.y, (effect.size || 4) * alpha, 0, Math.PI * 2)
          this.ctx.fill()
          this.ctx.globalAlpha = 1
          break

        case 'confetti':
          this.ctx.fillStyle = effect.color || '#ff6b6b'
          this.ctx.globalAlpha = alpha
          this.ctx.save()
          this.ctx.translate(effect.position.x, effect.position.y)
          this.ctx.rotate(Date.now() / 100)
          this.ctx.fillRect(-3, -3, 6, 6)
          this.ctx.restore()
          this.ctx.globalAlpha = 1
          break
      }
    })
  }

  private renderWindIndicator(state: GameState) {
    const windX = this.width / 2
    const windY = 70
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('风向', windX, windY - 15)

    const arrowSize = 20
    this.ctx.strokeStyle = '#ffffff'
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    
    if (state.wind > 0.1) {
      this.ctx.moveTo(windX - arrowSize, windY)
      this.ctx.lineTo(windX + arrowSize, windY)
      this.ctx.lineTo(windX + arrowSize - 8, windY - 5)
      this.ctx.moveTo(windX + arrowSize, windY)
      this.ctx.lineTo(windX + arrowSize - 8, windY + 5)
    } else if (state.wind < -0.1) {
      this.ctx.moveTo(windX + arrowSize, windY)
      this.ctx.lineTo(windX - arrowSize, windY)
      this.ctx.lineTo(windX - arrowSize + 8, windY - 5)
      this.ctx.moveTo(windX - arrowSize, windY)
      this.ctx.lineTo(windX - arrowSize + 8, windY + 5)
    } else {
      this.ctx.arc(windX, windY, 8, 0, Math.PI * 2)
    }
    this.ctx.stroke()
  }

  private renderUI(state: GameState) {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 24px monospace'
    this.ctx.textAlign = 'center'

    this.ctx.fillStyle = COLORS.LEFT_TEAM
    this.ctx.fillRect(this.width / 2 - 150, 550, 100, 30)
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText(`${state.score.left}`, this.width / 2 - 100, 575)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText('VS', this.width / 2, 575)

    this.ctx.fillStyle = COLORS.RIGHT_TEAM
    this.ctx.fillRect(this.width / 2 + 50, 550, 100, 30)
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText(`${state.score.right}`, this.width / 2 + 100, 575)

    this.ctx.font = '14px monospace'
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText(`第 ${state.currentSet} 局`, this.width / 2, 545)
    this.ctx.fillText(`局分: ${state.sets.left} - ${state.sets.right}`, this.width / 2, 615)

    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.fillText('连击: ' + state.rallyCount, 30, 570)

    const controlledPlayer = state.leftTeam.find(p => p.isControlled)
    if (controlledPlayer) {
      const gaugeWidth = 80
      const gaugeHeight = 8
      const gaugeX = 30
      const gaugeY = 590

      this.ctx.fillStyle = '#333'
      this.ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight)

      this.ctx.fillStyle = controlledPlayer.specialGauge >= controlledPlayer.maxSpecialGauge
        ? '#ffd700'
        : '#4a90d9'
      this.ctx.fillRect(
        gaugeX, gaugeY,
        (controlledPlayer.specialGauge / controlledPlayer.maxSpecialGauge) * gaugeWidth,
        gaugeHeight
      )

      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillText('必杀技', gaugeX, gaugeY - 5)
    }

    this.ctx.textAlign = 'right'
    this.ctx.fillText('回合: ' + state.ball.touchCount + '/3', this.width - 30, 570)

    if (state.phase === 'serve') {
      this.ctx.textAlign = 'center'
      this.ctx.font = '20px monospace'
      this.ctx.fillStyle = '#ffff00'
      if (state.servingSide === 'left') {
        this.ctx.fillText('按空格键发球!', this.width / 2, COURT.TOP - 20)
      } else {
        this.ctx.fillText('对方发球中...', this.width / 2, COURT.TOP - 20)
      }
    }
  }
}
