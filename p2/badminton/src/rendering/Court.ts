import {
  COLORS,
  COURT_X,
  COURT_Y,
  COURT_WIDTH,
  COURT_HEIGHT,
  NET_X,
  NET_HEIGHT
} from '../index';

export function drawCourt(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.fillStyle = COLORS.COURT;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const stripeCount = 8;
  const stripeHeight = COURT_HEIGHT / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    if (i % 2 === 1) {
      ctx.fillStyle = COLORS.COURT_DARK;
      ctx.fillRect(
        COURT_X,
        COURT_Y + i * stripeHeight,
        COURT_WIDTH,
        stripeHeight
      );
    }
  }

  ctx.strokeStyle = COLORS.LINE;
  ctx.lineWidth = 2;

  ctx.strokeRect(COURT_X, COURT_Y, COURT_WIDTH, COURT_HEIGHT);

  ctx.beginPath();
  ctx.moveTo(NET_X, COURT_Y);
  ctx.lineTo(NET_X, COURT_Y + COURT_HEIGHT);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(COURT_X, COURT_Y + COURT_HEIGHT / 2);
  ctx.lineTo(COURT_X + COURT_WIDTH / 2 - 5, COURT_Y + COURT_HEIGHT / 2);
  ctx.moveTo(COURT_X + COURT_WIDTH / 2 + 5, COURT_Y + COURT_HEIGHT / 2);
  ctx.lineTo(COURT_X + COURT_WIDTH, COURT_Y + COURT_HEIGHT / 2);
  ctx.stroke();

  const serviceLineY = COURT_Y + 80;
  ctx.beginPath();
  ctx.moveTo(COURT_X, serviceLineY);
  ctx.lineTo(COURT_X + COURT_WIDTH / 2, serviceLineY);
  ctx.moveTo(COURT_X + COURT_WIDTH / 2, serviceLineY);
  ctx.lineTo(COURT_X + COURT_WIDTH, serviceLineY);
  ctx.stroke();

  const serviceLineY2 = COURT_Y + COURT_HEIGHT - 80;
  ctx.beginPath();
  ctx.moveTo(COURT_X, serviceLineY2);
  ctx.lineTo(COURT_X + COURT_WIDTH / 2, serviceLineY2);
  ctx.moveTo(COURT_X + COURT_WIDTH / 2, serviceLineY2);
  ctx.lineTo(COURT_X + COURT_WIDTH, serviceLineY2);
  ctx.stroke();

  drawNet(ctx, time);
}

function drawNet(ctx: CanvasRenderingContext2D, time: number): void {
  const netTop = COURT_Y - NET_HEIGHT;
  const netBottom = COURT_Y + COURT_HEIGHT + 10;

  ctx.fillStyle = COLORS.NET_DARK;
  ctx.fillRect(NET_X - 4, netTop - 8, 8, 8);
  ctx.fillRect(NET_X - 4, COURT_Y + COURT_HEIGHT, 8, 8);

  ctx.strokeStyle = COLORS.NET;
  ctx.lineWidth = 1;

  const waveOffset = Math.sin(time * 2) * 2;
  const verticalLines = 15;
  for (let i = 0; i <= verticalLines; i++) {
    const y = netTop + (netBottom - netTop) * (i / verticalLines);
    const wave = Math.sin(time * 3 + i * 0.5) * 1.5;
    ctx.beginPath();
    ctx.moveTo(NET_X + wave, y);
    ctx.lineTo(NET_X + waveOffset, y + (netBottom - netTop) / verticalLines);
    ctx.stroke();
  }

  const horizontalLines = 5;
  for (let i = 0; i <= horizontalLines; i++) {
    const y = netTop + (netBottom - netTop) * (i / horizontalLines);
    ctx.beginPath();
    ctx.moveTo(NET_X - 2 + Math.sin(time * 2 + i) * 1, y);
    ctx.lineTo(NET_X + 2 + Math.sin(time * 2 + i + 0.5) * 1, y);
    ctx.stroke();
  }
}

export function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, height: number): void {
  const shadowScale = 1 - height / 200;
  const shadowRadius = radius * Math.max(0.3, shadowScale);
  const alpha = 0.3 * Math.max(0.3, shadowScale);

  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, shadowRadius * 1.5, shadowRadius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
}
