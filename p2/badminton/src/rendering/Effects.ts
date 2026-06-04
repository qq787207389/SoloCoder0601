import {
  Effect,
  COLORS,
  PIXEL_FONT
} from '../index';

export function drawEffects(ctx: CanvasRenderingContext2D, effects: Effect[]): void {
  for (const effect of effects) {
    const alpha = effect.life / effect.maxLife;

    switch (effect.type) {
      case 'dust':
        drawDust(ctx, effect, alpha);
        break;
      case 'star':
        drawStar(ctx, effect, alpha);
        break;
      case 'afterimage':
        drawAfterimage(ctx, effect, alpha);
        break;
      case 'score':
        drawScorePopup(ctx, effect, alpha);
        break;
    }
  }
}

function drawDust(ctx: CanvasRenderingContext2D, effect: Effect, alpha: number): void {
  const size = 2 + Math.random() * 2;
  ctx.fillStyle = `rgba(149, 165, 166, ${alpha * 0.8})`;
  ctx.fillRect(
    Math.floor(effect.position.x - size / 2),
    Math.floor(effect.position.y - size / 2),
    size,
    size
  );
}

function drawStar(ctx: CanvasRenderingContext2D, effect: Effect, alpha: number): void {
  const size = 4 + Math.sin(effect.life * 10) * 2;
  const x = effect.position.x;
  const y = effect.position.y;

  ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;

  ctx.fillRect(Math.floor(x - size / 2), Math.floor(y - 1), size, 2);
  ctx.fillRect(Math.floor(x - 1), Math.floor(y - size / 2), 2, size);

  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
  ctx.fillRect(Math.floor(x - 1), Math.floor(y - 1), 2, 2);
}

function drawAfterimage(ctx: CanvasRenderingContext2D, effect: Effect, alpha: number): void {
  const index = effect.data?.index || 0;
  const size = 5 + index * 2;
  const offset = index * 8;

  ctx.fillStyle = `rgba(241, 196, 15, ${alpha * 0.6})`;

  ctx.fillRect(
    Math.floor(effect.position.x - size / 2 + offset),
    Math.floor(effect.position.y - size / 2),
    size,
    size
  );
}

function drawScorePopup(ctx: CanvasRenderingContext2D, effect: Effect, alpha: number): void {
  const winner = effect.data?.winner as 'player' | 'ai';
  const color = winner === 'player' ? COLORS.PLAYER : COLORS.AI;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `bold 24px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#000000';
  ctx.fillText('+1', effect.position.x + 2, effect.position.y + 2);

  ctx.fillStyle = color;
  ctx.fillText('+1', effect.position.x, effect.position.y);

  ctx.restore();
}

export function drawBallTrail(ctx: CanvasRenderingContext2D, trail: { x: number; y: number }[], height: number): void {
  if (trail.length < 2) return;

  for (let i = 1; i < trail.length; i++) {
    const alpha = (i / trail.length) * 0.5;
    const size = 2 + (i / trail.length) * 2;

    ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
    ctx.fillRect(
      Math.floor(trail[i].x - size / 2),
      Math.floor(trail[i].y - size / 2 - height * (i / trail.length) * 0.5),
      size,
      size
    );
  }
}

export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, shotType: string | null): void {
  const drawY = y - height * 0.5;
  const size = shotType === 'special' ? 6 : shotType === 'smash' ? 5 : 4;

  if (shotType === 'special' || shotType === 'smash') {
    ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
    ctx.fillRect(
      Math.floor(x - size),
      Math.floor(drawY - size),
      size * 2,
      size * 2
    );
  }

  ctx.fillStyle = COLORS.BALL_DARK;
  ctx.fillRect(
    Math.floor(x - size / 2 + 1),
    Math.floor(drawY - size / 2 + 1),
    size,
    size
  );

  ctx.fillStyle = COLORS.BALL;
  ctx.fillRect(
    Math.floor(x - size / 2),
    Math.floor(drawY - size / 2),
    size,
    size
  );

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(
    Math.floor(x - size / 2),
    Math.floor(drawY - size / 2),
    2,
    2
  );
}
