import {
  GameStateData,
  PlayerState,
  COLORS,
  PLAYER_SIZE
} from '../index';

import { drawCourt, drawShadow } from './Court';
import { drawEffects, drawBallTrail, drawBall } from './Effects';
import { drawHUD, drawMenu, drawGameOver, drawReferee } from './HUD';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(state: GameStateData, dt: number): void {
    this.time += dt;

    drawCourt(this.ctx, this.time);

    if (state.phase !== 'menu' && state.phase !== 'game_over') {
      drawShadow(
        this.ctx,
        state.ai.position.x,
        state.ai.position.y,
        PLAYER_SIZE / 2,
        0
      );
      drawShadow(
        this.ctx,
        state.player.position.x,
        state.player.position.y,
        PLAYER_SIZE / 2,
        0
      );

      if (state.ball.isInAir) {
        drawShadow(
          this.ctx,
          state.ball.position.x,
          state.ball.position.y,
          6,
          state.ball.height
        );
      }
      drawPlayer(this.ctx, state.ai, this.time, false);
      drawPlayer(this.ctx, state.player, this.time, true);

      if (state.ball.isInAir) {
        drawBallTrail(this.ctx, state.ball.trail, state.ball.height);
        drawBall(
          this.ctx,
          state.ball.position.x,
          state.ball.position.y,
          state.ball.height,
          state.ball.shotType
        );
      }

      drawEffects(this.ctx, state.effects);
      drawReferee(this.ctx, state);
      drawHUD(this.ctx, state);
    }

    if (state.phase === 'menu') {
      drawMenu(this.ctx, state.menuTimer);
    } else if (state.phase === 'game_over') {
      drawGameOver(this.ctx, state);
    }
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number,
  isPlayer: boolean
): void {
  const x = Math.floor(player.position.x);
  const y = Math.floor(player.position.y);

  const color = isPlayer ? COLORS.PLAYER : COLORS.AI;
  const colorDark = isPlayer ? COLORS.PLAYER_DARK : COLORS.AI_DARK;

  if (player.isStunned) {
    ctx.globalAlpha = 0.5 + Math.sin(time * 20) * 0.3;
  }

  const legOffset = player.velocity.x !== 0 || player.velocity.y !== 0
    ? Math.sin(time * 15) * 2
    : 0;

  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(x - 5, y + 4, 4, 8 + legOffset);
  ctx.fillRect(x + 1, y + 4, 4, 8 - legOffset);

  ctx.fillStyle = colorDark;
  ctx.fillRect(x - 6, y - 6, 12, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x - 5, y - 5, 10, 8);

  ctx.fillStyle = '#e0b090';
  ctx.fillRect(x - 4, y - 12, 8, 6);

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(x - 5, y - 12, 10, 2);

  ctx.fillStyle = '#000000';
  ctx.fillRect(x - 3, y - 10, 2, 2);
  ctx.fillRect(x + 1, y - 10, 2, 2);

  const armSwing = player.isSwinging ? Math.sin(time * 30) * 6 : 0;

  ctx.fillStyle = '#e0b090';
  ctx.fillRect(x - 8, y - 4, 3, 6);

  if (isPlayer) {
    ctx.fillRect(x + 5, y - 4 + armSwing, 3, 6);

    ctx.save();
    ctx.translate(x + 8, y - 2 + armSwing);
    ctx.rotate(player.isSwinging ? -0.8 + Math.sin(time * 30) * 0.5 : 0.3);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, -1, 10, 2);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(8, -4, 6, 8);
    ctx.restore();
  } else {
    ctx.fillRect(x + 5, y - 4 - armSwing, 3, 6);

    ctx.save();
    ctx.translate(x - 8, y - 2 - armSwing);
    ctx.rotate(player.isSwinging ? Math.PI + 0.8 - Math.sin(time * 30) * 0.5 : Math.PI - 0.3);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, -1, 10, 2);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(8, -4, 6, 8);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}
