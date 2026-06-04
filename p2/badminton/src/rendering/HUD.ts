import {
  GameStateData,
  WindState,
  AIStyle,
  COLORS,
  PIXEL_FONT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COURT_X,
  COURT_Y,
  COURT_WIDTH,
  COURT_HEIGHT,
  MAX_STAMINA
} from '../index';

export function drawHUD(ctx: CanvasRenderingContext2D, state: GameStateData): void {
  drawScore(ctx, state);
  drawStamina(ctx, state.player.stamina);
  drawWind(ctx, state.wind);
  drawGameInfo(ctx, state);
  drawAIStyle(ctx, state.aiStyle);
}

function drawScore(ctx: CanvasRenderingContext2D, state: GameStateData): void {
  ctx.font = `bold 32px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#000000';
  ctx.fillText(`${state.player.score}`, COURT_X + 60 + 2, COURT_Y - 50 + 2);
  ctx.fillStyle = COLORS.PLAYER;
  ctx.fillText(`${state.player.score}`, COURT_X + 60, COURT_Y - 50);

  ctx.fillStyle = '#000000';
  ctx.fillText(`${state.ai.score}`, COURT_X + COURT_WIDTH - 60 + 2, COURT_Y - 50 + 2);
  ctx.fillStyle = COLORS.AI;
  ctx.fillText(`${state.ai.score}`, COURT_X + COURT_WIDTH - 60, COURT_Y - 50);

  ctx.font = `12px ${PIXEL_FONT}`;
  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('VS', CANVAS_WIDTH / 2, COURT_Y - 45);

  ctx.font = `10px ${PIXEL_FONT}`;
  const gamesText = `GAMES: ${state.player.gamesWon} - ${state.ai.gamesWon}`;
  ctx.fillText(gamesText, CANVAS_WIDTH / 2, COURT_Y - 25);
}

function drawStamina(ctx: CanvasRenderingContext2D, stamina: number): void {
  const barWidth = 150;
  const barHeight = 12;
  const x = COURT_X + 20;
  const y = COURT_Y + COURT_HEIGHT + 20;

  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 1, y + 1, barWidth, barHeight);

  ctx.fillStyle = COLORS.STAMINA_BG;
  ctx.fillRect(x, y, barWidth, barHeight);

  const fillWidth = (stamina / MAX_STAMINA) * barWidth;
  ctx.fillStyle = stamina >= MAX_STAMINA ? '#f1c40f' : COLORS.STAMINA_FILL;
  ctx.fillRect(x, y, fillWidth, barHeight);

  ctx.font = `8px ${PIXEL_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('STAMINA', x, y - 10);

  if (stamina >= MAX_STAMINA) {
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('SHIFT: SPECIAL!', x + 80, y - 10);
  }
}

function drawWind(ctx: CanvasRenderingContext2D, wind: WindState): void {
  const centerX = CANVAS_WIDTH / 2;
  const y = 30;

  ctx.font = `10px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('WIND', centerX, y);

  const windStrength = Math.sqrt(wind.x * wind.x + wind.y * wind.y);
  const angle = Math.atan2(wind.y, wind.x);

  const arrowLength = 15 + windStrength * 0.3;
  const endX = centerX + Math.cos(angle) * arrowLength;
  const endY = y + 20 + Math.sin(angle) * arrowLength * 0.5;

  ctx.strokeStyle = windStrength > 20 ? '#e74c3c' : windStrength > 10 ? '#f39c12' : '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, y + 20);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const headLen = 5;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLen * Math.cos(angle - Math.PI / 6),
    endY - headLen * Math.sin(angle - Math.PI / 6) * 0.5
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLen * Math.cos(angle + Math.PI / 6),
    endY - headLen * Math.sin(angle + Math.PI / 6) * 0.5
  );
  ctx.stroke();
}

function drawGameInfo(ctx: CanvasRenderingContext2D, state: GameStateData): void {
  ctx.font = `10px ${PIXEL_FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText(`GAME ${state.currentGame}`, COURT_X + COURT_WIDTH - 20, COURT_Y + COURT_HEIGHT + 20);

  if (state.server) {
    ctx.textAlign = 'left';
    const serverText = state.server === 'player' ? 'SERVING' : 'OPPONENT SERVING';
    const serverColor = state.server === 'player' ? COLORS.PLAYER : COLORS.AI;
    ctx.fillStyle = serverColor;
    ctx.fillText(serverText, COURT_X + 20, COURT_Y + COURT_HEIGHT + 40);
  }
}

function drawAIStyle(ctx: CanvasRenderingContext2D, style: AIStyle): void {
  ctx.font = `8px ${PIXEL_FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#95a5a6';

  let styleText = '';
  switch (style) {
    case AIStyle.DEFENSIVE:
      styleText = 'AI: DEFENSIVE';
      break;
    case AIStyle.AGGRESSIVE:
      styleText = 'AI: AGGRESSIVE';
      break;
    case AIStyle.NET:
      styleText = 'AI: NET PLAYER';
      break;
  }
  ctx.fillText(styleText, COURT_X + COURT_WIDTH - 20, COURT_Y + COURT_HEIGHT + 38);
}

export function drawMenu(ctx: CanvasRenderingContext2D, timer: number): void {
  ctx.fillStyle = COLORS.MENU_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.font = `bold 48px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleY = CANVAS_HEIGHT / 3;
  ctx.fillStyle = '#000000';
  ctx.fillText('BADMINTON', CANVAS_WIDTH / 2 + 3, titleY + 3);
  ctx.fillStyle = '#2ecc71';
  ctx.fillText('BADMINTON', CANVAS_WIDTH / 2, titleY);

  ctx.font = `bold 36px ${PIXEL_FONT}`;
  ctx.fillStyle = '#000000';
  ctx.fillText('BATTLE', CANVAS_WIDTH / 2 + 3, titleY + 50 + 3);
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('BATTLE', CANVAS_WIDTH / 2, titleY + 50);

  const showPrompt = Math.floor(timer * 2) % 2 === 0;
  if (showPrompt) {
    ctx.font = `14px ${PIXEL_FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PRESS SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }

  ctx.font = `10px ${PIXEL_FONT}`;
  ctx.fillStyle = '#95a5a6';
  ctx.textAlign = 'left';

  const instructions = [
    'CONTROLS:',
    'WASD / ARROWS - Move',
    'SPACE - Swing',
    'SHIFT (Full Stamina) - Special Smash',
    '',
    'RULES:',
    'Best of 3 games',
    'First to 15 points (win by 2)'
  ];

  instructions.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2 - 180, CANVAS_HEIGHT / 2 + 100 + i * 18);
  });

  drawPixelPlayer(ctx, CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 - 30, true);
  drawPixelPlayer(ctx, CANVAS_WIDTH / 2 + 100, CANVAS_HEIGHT / 2 - 30, false);
}

function drawPixelPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, isPlayer: boolean): void {
  const color = isPlayer ? COLORS.PLAYER : COLORS.AI;
  const colorDark = isPlayer ? COLORS.PLAYER_DARK : COLORS.AI_DARK;

  ctx.fillStyle = '#e0b090';
  ctx.fillRect(x - 4, y - 12, 8, 6);

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(x - 5, y - 12, 10, 2);

  ctx.fillStyle = colorDark;
  ctx.fillRect(x - 6, y - 6, 12, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x - 5, y - 5, 10, 8);

  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(x - 5, y + 4, 4, 8);
  ctx.fillRect(x + 1, y + 4, 4, 8);

  ctx.fillStyle = '#e0b090';
  ctx.fillRect(x - 8, y - 4, 3, 6);
  ctx.fillRect(x + 5, y - 4, 3, 6);

  ctx.fillStyle = '#8b4513';
  ctx.fillRect(x + 7, y - 6, 2, 8);
}

export function drawGameOver(ctx: CanvasRenderingContext2D, state: GameStateData): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const playerWon = state.player.gamesWon >= state.ai.gamesWon;

  ctx.font = `bold 36px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#000000';
  const title = playerWon ? 'YOU WIN!' : 'GAME OVER';
  ctx.fillText(title, CANVAS_WIDTH / 2 + 3, CANVAS_HEIGHT / 3 + 3);
  ctx.fillStyle = playerWon ? '#2ecc71' : '#e74c3c';
  ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

  ctx.font = `16px ${PIXEL_FONT}`;
  ctx.fillStyle = '#ffffff';
  const scoreText = `${state.player.gamesWon} - ${state.ai.gamesWon}`;
  ctx.fillText(scoreText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = `12px ${PIXEL_FONT}`;
  ctx.fillStyle = '#95a5a6';
  ctx.fillText('PRESS SPACE TO PLAY AGAIN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

export function drawReferee(ctx: CanvasRenderingContext2D, state: GameStateData): void {
  const x = COURT_X - 30;
  const y = COURT_Y + COURT_HEIGHT / 2;

  let armAngle = 0;
  if (state.phase === 'score') {
    const progress = 1 - state.scoreTimer / 2;
    if (progress < 0.3) {
      armAngle = (progress / 0.3) * -Math.PI / 2;
    } else if (progress < 0.7) {
      armAngle = -Math.PI / 2;
    } else {
      armAngle = -Math.PI / 2 * (1 - (progress - 0.7) / 0.3);
    }
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(x - 5, y - 15, 10, 6);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 4, y - 14, 8, 4);

  ctx.fillStyle = '#34495e';
  ctx.fillRect(x - 6, y - 9, 12, 12);

  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(x - 4, y + 3, 3, 10);
  ctx.fillRect(x + 1, y + 3, 3, 10);

  ctx.save();
  ctx.translate(x + 6, y - 5);
  ctx.rotate(armAngle);
  ctx.fillStyle = '#e0b090';
  ctx.fillRect(0, -2, 12, 4);
  ctx.restore();

  ctx.fillStyle = '#e0b090';
  ctx.fillRect(x - 8, y - 7, 3, 6);
}
