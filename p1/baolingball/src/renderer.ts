import type { Vector3 } from './types';
import { CONFIG } from './types';
import { GameStateManager } from './gameState';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private cameraPos: Vector3 = { x: 0, y: 1.8, z: -2 };
  private fov = 75 * Math.PI / 180;
  private gameState: GameStateManager;

  constructor(canvas: HTMLCanvasElement, gameState: GameStateManager) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.gameState = gameState;
  }

  project(point: Vector3): { x: number; y: number; scale: number } | null {
    const relX = point.x - this.cameraPos.x;
    const relY = point.y - this.cameraPos.y;
    const relZ = point.z - this.cameraPos.z;

    if (relZ <= 0.1) return null;

    const fovFactor = 1 / Math.tan(this.fov / 2);
    const aspect = this.width / this.height;

    const screenX = (relX * fovFactor / relZ / aspect + 1) * this.width / 2;
    const screenY = (-relY * fovFactor / relZ + 1) * this.height / 2;
    const scale = fovFactor / relZ;

    return { x: screenX, y: screenY, scale };
  }

  render(): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawLane();
    this.drawPins();
    this.drawBall();
    this.drawPowerBar();
    this.drawScoreboard();
  }

  drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#2d1b0e');
    gradient.addColorStop(0.3, '#4a2c1a');
    gradient.addColorStop(1, '#1a0f08');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < 5; i++) {
      const x = this.width * (0.1 + i * 0.2);
      const glowGradient = this.ctx.createRadialGradient(x, 20, 0, x, 20, 150);
      glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
      glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
      this.ctx.fillStyle = glowGradient;
      this.ctx.fillRect(0, 0, this.width, 200);
    }
  }

  drawLane(): void {
    const halfWidth = CONFIG.laneWidth / 2;
    const gutterWidth = CONFIG.gutterWidth;

    const points: Vector3[] = [
      { x: -halfWidth - gutterWidth, y: 0, z: 0 },
      { x: halfWidth + gutterWidth, y: 0, z: 0 },
      { x: halfWidth + gutterWidth, y: 0, z: CONFIG.laneLength },
      { x: -halfWidth - gutterWidth, y: 0, z: CONFIG.laneLength },
    ];

    const projected = points.map(p => this.project(p)).filter(p => p !== null);
    if (projected.length < 4) return;

    this.ctx.fillStyle = '#8B0000';
    this.ctx.beginPath();
    this.ctx.moveTo(projected[0]!.x, projected[0]!.y);
    for (let i = 1; i < 4; i++) {
      this.ctx.lineTo(projected[i]!.x, projected[i]!.y);
    }
    this.ctx.closePath();
    this.ctx.fill();

    const lanePoints: Vector3[] = [
      { x: -halfWidth, y: 0.001, z: 0 },
      { x: halfWidth, y: 0.001, z: 0 },
      { x: halfWidth, y: 0.001, z: CONFIG.laneLength },
      { x: -halfWidth, y: 0.001, z: CONFIG.laneLength },
    ];

    const laneProjected = lanePoints.map(p => this.project(p)).filter(p => p !== null);
    if (laneProjected.length < 4) return;

    const laneGradient = this.ctx.createLinearGradient(
      laneProjected[0]!.x, laneProjected[0]!.y,
      laneProjected[2]!.x, laneProjected[2]!.y
    );
    laneGradient.addColorStop(0, '#d4a574');
    laneGradient.addColorStop(0.5, '#c4956a');
    laneGradient.addColorStop(1, '#b08050');

    this.ctx.fillStyle = laneGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(laneProjected[0]!.x, laneProjected[0]!.y);
    for (let i = 1; i < 4; i++) {
      this.ctx.lineTo(laneProjected[i]!.x, laneProjected[i]!.y);
    }
    this.ctx.closePath();
    this.ctx.fill();

    this.drawLaneMarkings();
    this.drawLaneReflection();
  }

  drawLaneMarkings(): void {
    const halfWidth = CONFIG.laneWidth / 2;
    
    for (let z = 0; z < CONFIG.laneLength; z += 1.219) {
      const left = this.project({ x: -halfWidth, y: 0.002, z });
      const right = this.project({ x: halfWidth, y: 0.002, z });
      if (left && right) {
        this.ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(left.x, left.y);
        this.ctx.lineTo(right.x, right.y);
        this.ctx.stroke();
      }
    }

    for (let i = 0; i < 7; i++) {
      const x = -0.5 + i * 0.1667;
      const arrowZ = 4.572;
      const pos = this.project({ x, y: 0.002, z: arrowZ });
      if (pos) {
        this.ctx.fillStyle = 'rgba(50, 30, 10, 0.4)';
        this.ctx.beginPath();
        const size = 5 * pos.scale;
        this.ctx.moveTo(pos.x, pos.y - size);
        this.ctx.lineTo(pos.x - size * 0.7, pos.y + size * 0.5);
        this.ctx.lineTo(pos.x + size * 0.7, pos.y + size * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }

  drawLaneReflection(): void {
    const ball = this.gameState.ball;
    if (ball.position.z < 0 || ball.position.z > CONFIG.laneLength) return;

    const reflectionPos = this.project({
      x: ball.position.x,
      y: 0.01,
      z: ball.position.z
    });

    if (reflectionPos) {
      const gradient = this.ctx.createRadialGradient(
        reflectionPos.x, reflectionPos.y, 0,
        reflectionPos.x, reflectionPos.y, 30 * reflectionPos.scale
      );
      gradient.addColorStop(0, 'rgba(50, 30, 20, 0.3)');
      gradient.addColorStop(1, 'rgba(50, 30, 20, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.ellipse(
        reflectionPos.x, reflectionPos.y,
        30 * reflectionPos.scale, 10 * reflectionPos.scale, 0, 0, Math.PI * 2
      );
      this.ctx.fill();
    }
  }

  drawPins(): void {
    this.gameState.pins.forEach(pin => {
      if (pin.hasFallen) return;

      const basePos = this.project({
        x: pin.position.x,
        y: 0,
        z: pin.position.z
      });

      const topPos = this.project({
        x: pin.position.x + Math.sin(pin.rotation.z) * CONFIG.pinHeight,
        y: CONFIG.pinHeight + Math.sin(pin.rotation.x) * CONFIG.pinHeight * 0.5,
        z: pin.position.z
      });

      if (!basePos || !topPos) return;

      const pinWidth = CONFIG.pinRadius * 2 * basePos.scale;
      const pinHeight = Math.abs(topPos.y - basePos.y);

      this.ctx.save();
      this.ctx.translate(basePos.x, basePos.y);
      this.ctx.rotate(pin.rotation.z);

      const gradient = this.ctx.createLinearGradient(-pinWidth, 0, pinWidth, 0);
      gradient.addColorStop(0, '#e8e8e8');
      gradient.addColorStop(0.3, '#ffffff');
      gradient.addColorStop(0.7, '#ffffff');
      gradient.addColorStop(1, '#d0d0d0');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.moveTo(-pinWidth * 0.6, 0);
      this.ctx.quadraticCurveTo(-pinWidth * 0.8, -pinHeight * 0.3, -pinWidth * 0.4, -pinHeight * 0.8);
      this.ctx.quadraticCurveTo(0, -pinHeight * 1.1, pinWidth * 0.4, -pinHeight * 0.8);
      this.ctx.quadraticCurveTo(pinWidth * 0.8, -pinHeight * 0.3, pinWidth * 0.6, 0);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#c41e3a';
      this.ctx.fillRect(-pinWidth * 0.5, -pinHeight * 0.4, pinWidth, pinHeight * 0.1);
      this.ctx.fillRect(-pinWidth * 0.5, -pinHeight * 0.65, pinWidth, pinHeight * 0.05);

      this.ctx.restore();
    });
  }

  drawBall(): void {
    const ball = this.gameState.ball;
    const pos = this.project(ball.position);
    if (!pos) return;

    const radius = ball.radius * pos.scale * this.width / 2;

    const shadowPos = this.project({
      x: ball.position.x,
      y: 0.01,
      z: ball.position.z
    });

    if (shadowPos) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.ellipse(
        shadowPos.x, shadowPos.y,
        radius * 1.2, radius * 0.4, 0, 0, Math.PI * 2
      );
      this.ctx.fill();
    }

    const gradient = this.ctx.createRadialGradient(
      pos.x - radius * 0.3, pos.y - radius * 0.3, 0,
      pos.x, pos.y, radius
    );
    gradient.addColorStop(0, '#4a90d9');
    gradient.addColorStop(0.5, '#1e3a5f');
    gradient.addColorStop(1, '#0a1929');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    const holePositions = [
      { x: -radius * 0.3, y: -radius * 0.1 },
      { x: radius * 0.1, y: -radius * 0.3 },
      { x: radius * 0.15, y: radius * 0.1 }
    ];

    holePositions.forEach(hole => {
      this.ctx.fillStyle = '#0a0a0a';
      this.ctx.beginPath();
      this.ctx.arc(pos.x + hole.x, pos.y + hole.y, radius * 0.15, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(
      pos.x - radius * 0.3, pos.y - radius * 0.3,
      radius * 0.2, radius * 0.15, -0.5, 0, Math.PI * 2
    );
    this.ctx.fill();
  }

  drawPowerBar(): void {
    if (this.gameState.state !== 'power') return;

    const barWidth = 300;
    const barHeight = 30;
    const x = (this.width - barWidth) / 2;
    const y = this.height - 80;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, '#4caf50');
    gradient.addColorStop(0.5, '#ff9800');
    gradient.addColorStop(0.8, '#f44336');
    gradient.addColorStop(1, '#900');

    this.ctx.fillStyle = gradient;
    const powerWidth = (this.gameState.powerLevel / 100) * barWidth;
    this.ctx.fillRect(x, y, powerWidth, barHeight);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('POWER', x + barWidth / 2, y - 10);
  }

  drawScoreboard(): void {
    if (this.gameState.players.length === 0) return;
    if (this.gameState.state === 'menu' || this.gameState.state === 'setup') return;

    const cellWidth = 50;
    const cellHeight = 30;
    const startX = 20;
    const startY = 10;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(startX - 5, startY - 5, 10 + cellWidth * 12, 10 + cellHeight * (this.gameState.players.length + 1));

    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      if (i < 10) {
        this.ctx.fillText(`${i + 1}`, startX + cellWidth * i + cellWidth / 2, startY + 12);
      } else {
        this.ctx.fillText('TOT', startX + cellWidth * 10 + cellWidth / 2, startY + 12);
      }
      this.ctx.beginPath();
      this.ctx.moveTo(startX + cellWidth * i, startY);
      this.ctx.lineTo(startX + cellWidth * i, startY + cellHeight * (this.gameState.players.length + 1));
      this.ctx.stroke();
    }

    this.gameState.players.forEach((player, pIndex) => {
      const rowY = startY + cellHeight * (pIndex + 1);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(player.name, startX - 40, rowY + 18);

      const frameScores = this.calculateFrameScores(player);

      for (let f = 0; f < 10; f++) {
        const frame = player.scores[f];
        const cellX = startX + cellWidth * f;

        this.ctx.strokeRect(cellX, rowY, cellWidth, cellHeight);

        this.ctx.beginPath();
        this.ctx.moveTo(cellX + cellWidth * 0.6, rowY);
        this.ctx.lineTo(cellX + cellWidth * 0.6, rowY + cellHeight * 0.4);
        this.ctx.lineTo(cellX + cellWidth, rowY + cellHeight * 0.4);
        this.ctx.stroke();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';

        if (frame && frame.length > 0) {
          if (f === 9) {
            if (frame[0] === 10) {
              this.ctx.fillText('X', cellX + cellWidth * 0.3, rowY + 10);
              if (frame.length > 1) {
                this.ctx.fillText(frame[1] === 10 ? 'X' : frame[1].toString(), cellX + cellWidth * 0.8, rowY + 10);
              }
              if (frame.length > 2) {
                const thirdRollText = frame[2] === 10 ? 'X' : (frame[1] !== 10 && frame[1] + frame[2] === 10 ? '/' : frame[2].toString());
                this.ctx.fillText(thirdRollText, cellX + cellWidth / 2, rowY + 25);
              }
            } else if (frame.length >= 2 && frame[0] + frame[1] === 10) {
              this.ctx.fillText(frame[0].toString(), cellX + cellWidth * 0.3, rowY + 10);
              this.ctx.fillText('/', cellX + cellWidth * 0.8, rowY + 10);
              if (frame.length > 2) {
                this.ctx.fillText(frame[2] === 10 ? 'X' : frame[2].toString(), cellX + cellWidth / 2, rowY + 25);
              }
            } else {
              this.ctx.fillText(frame[0]?.toString() || '', cellX + cellWidth * 0.3, rowY + 10);
              this.ctx.fillText(frame[1]?.toString() || '', cellX + cellWidth * 0.8, rowY + 10);
            }
          } else {
            if (frame[0] === 10) {
              this.ctx.fillText('X', cellX + cellWidth * 0.8, rowY + 10);
            } else {
              this.ctx.fillText(frame[0].toString(), cellX + cellWidth * 0.3, rowY + 10);
              if (frame.length > 1) {
                if (frame[0] + frame[1] === 10) {
                  this.ctx.fillText('/', cellX + cellWidth * 0.8, rowY + 10);
                } else {
                  this.ctx.fillText(frame[1].toString(), cellX + cellWidth * 0.8, rowY + 10);
                }
              }
            }
          }
        }

        const frameScore = frameScores[f];
        if (frameScore !== null && frameScore !== undefined) {
          this.ctx.fillStyle = '#4caf50';
          this.ctx.font = 'bold 12px Arial';
          this.ctx.fillText(frameScore.toString(), cellX + cellWidth / 2, rowY + 26);
        }
      }

      this.ctx.fillStyle = '#4caf50';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.fillText(player.totalScore.toString(), startX + cellWidth * 10 + cellWidth / 2, rowY + 20);
    });
  }

  calculateFrameScores(player: any): (number | null)[] {
    const scores: (number | null)[] = [];
    let total = 0;

    for (let f = 0; f < 10; f++) {
      const frame = player.scores[f];
      if (!frame || frame.length === 0) {
        scores.push(null);
        continue;
      }

      if (f === 9) {
        if (frame.length >= 2) {
          const frameScore = frame.reduce((a: number, b: number) => a + b, 0);
          total += frameScore;
          scores.push(total);
        } else {
          scores.push(null);
        }
      } else if (frame[0] === 10) {
        const next1 = this.getNextRoll(player, f, 1);
        const next2 = this.getNextRoll(player, f, 2);
        if (next1 !== null && next2 !== null) {
          total += 10 + next1 + next2;
          scores.push(total);
        } else {
          scores.push(null);
        }
      } else if (frame.length >= 2) {
        if (frame[0] + frame[1] === 10) {
          const next1 = this.getNextRoll(player, f, 1);
          if (next1 !== null) {
            total += 10 + next1;
            scores.push(total);
          } else {
            scores.push(null);
          }
        } else {
          total += frame[0] + frame[1];
          scores.push(total);
        }
      } else {
        scores.push(null);
      }
    }

    player.totalScore = total;
    return scores;
  }

  getNextRoll(player: any, frameIndex: number, offset: number): number | null {
    let count = 0;
    for (let f = frameIndex; f < 10; f++) {
      const frame = player.scores[f];
      if (!frame) continue;
      for (let r = (f === frameIndex ? 1 : 0); r < frame.length; r++) {
        count++;
        if (count === offset) return frame[r];
      }
    }
    return null;
  }
}
