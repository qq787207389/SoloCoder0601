import { useRef, useEffect } from 'react';
import { GameState } from '@/types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT, POWER_UP_COLORS, POWER_UP_NAMES } from '@/config/levels';

interface GameCanvasProps {
  gameState: GameState;
}

export const GameCanvas = ({ gameState }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<{ x: number; y: number; size: number; brightness: number }[]>([]);

  useEffect(() => {
    const stars: { x: number; y: number; size: number; brightness: number }[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2,
        brightness: Math.random(),
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    starsRef.current.forEach(star => {
      const twinkle = 0.5 + Math.sin(Date.now() * 0.002 + star.brightness * 10) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle * 0.8})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    gameState.bricks.forEach(brick => {
      if (!brick.active) return;

      ctx.save();
      
      if (brick.type === 'gold') {
        const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + brick.width, brick.y + brick.height);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.3, '#FFF8DC');
        gradient.addColorStop(0.6, '#FFD700');
        gradient.addColorStop(1, '#B8860B');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
      } else if (brick.type === 'silver') {
        const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        gradient.addColorStop(0, '#E8E8E8');
        gradient.addColorStop(0.5, '#C0C0C0');
        gradient.addColorStop(1, '#A0A0A0');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#C0C0C0';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = brick.color;
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height / 3);

      ctx.restore();
    });

    gameState.powerUps.forEach(pu => {
      if (!pu.active) return;

      ctx.save();
      const color = POWER_UP_COLORS[pu.type];
      const pulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15 * pulse;

      ctx.beginPath();
      ctx.roundRect(pu.x, pu.y, pu.width, pu.height, 6);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(POWER_UP_NAMES[pu.type], pu.x + pu.width / 2, pu.y + pu.height / 2);

      ctx.restore();
    });

    gameState.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const paddle = gameState.paddle;
    ctx.save();
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    paddleGradient.addColorStop(0, '#00D4FF');
    paddleGradient.addColorStop(0.5, '#0099CC');
    paddleGradient.addColorStop(1, '#006699');
    ctx.fillStyle = paddleGradient;
    ctx.shadowColor = '#00D4FF';
    ctx.shadowBlur = gameState.rescueFlash ? 30 : 15;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();
    ctx.restore();

    const ball = gameState.ball;
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.shadowColor = ball.isPiercing ? '#FFD43B' : 'white';
    ctx.shadowBlur = ball.isPiercing ? 25 : 20;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(ball.x - ball.dx * 0.5, ball.y - ball.dy * 0.5, ball.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(ball.x - ball.dx, ball.y - ball.dy, ball.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border-2 border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20"
    />
  );
};
