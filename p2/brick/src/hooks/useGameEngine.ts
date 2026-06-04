import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Brick, PowerUp, Particle, PowerUpType } from '@/types/game';
import { LEVELS, BRICK_COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, BRICK_PADDING, BRICK_OFFSET_TOP, BRICK_OFFSET_LEFT } from '@/config/levels';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createBricks = (level: number): Brick[] => {
  const levelConfig = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  const bricks: Brick[] = [];
  const brickWidth = (CANVAS_WIDTH - BRICK_OFFSET_LEFT * 2 - (levelConfig.cols - 1) * BRICK_PADDING) / levelConfig.cols;
  const brickHeight = 25;

  for (let r = 0; r < levelConfig.rows; r++) {
    for (let c = 0; c < levelConfig.cols; c++) {
      const brickType = levelConfig.brickLayout[r]?.[c] || 0;
      if (brickType === 0) continue;

      const type = brickType === 3 ? 'gold' : brickType === 2 ? 'silver' : 'normal';
      const color = type === 'gold' ? '#FFD700' : type === 'silver' ? '#C0C0C0' : BRICK_COLORS[r % BRICK_COLORS.length];

      bricks.push({
        id: generateId(),
        x: BRICK_OFFSET_LEFT + c * (brickWidth + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + r * (brickHeight + BRICK_PADDING),
        width: brickWidth,
        height: brickHeight,
        color,
        type,
        hits: 0,
        maxHits: type === 'gold' ? Infinity : type === 'silver' ? 2 : 1,
        active: true,
      });
    }
  }
  return bricks;
};

const createInitialState = (level: number = 1, score: number = 0, lives: number = 3): GameState => {
  const levelConfig = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  return {
    status: 'idle',
    score,
    lives,
    level,
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      dx: levelConfig.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
      dy: -levelConfig.ballSpeed,
      radius: 8,
      speed: levelConfig.ballSpeed,
      isPiercing: false,
    },
    paddle: {
      x: CANVAS_WIDTH / 2 - 50,
      y: CANVAS_HEIGHT - 30,
      width: 100,
      height: 12,
      speed: 8,
      baseWidth: 100,
    },
    bricks: createBricks(level),
    powerUps: [],
    particles: [],
    keys: { left: false, right: false },
    rescueFlash: false,
  };
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState());
  const animationRef = useRef<number>();
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8): Particle[] => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      particles.push({
        id: generateId(),
        x,
        y,
        dx: Math.cos(angle) * (2 + Math.random() * 3),
        dy: Math.sin(angle) * (2 + Math.random() * 3),
        color,
        size: 3 + Math.random() * 4,
        life: 1,
        maxLife: 1,
      });
    }
    return particles;
  }, []);

  const createPowerUp = useCallback((x: number, y: number): PowerUp | null => {
    const levelConfig = LEVELS[Math.min(gameStateRef.current.level - 1, LEVELS.length - 1)];
    if (Math.random() > levelConfig.powerUpChance) return null;

    const types: PowerUpType[] = ['expand', 'shrink', 'slow', 'pierce', 'life'];
    const weights = [25, 15, 25, 20, 15];
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    let type: PowerUpType = 'expand';
    
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        type = types[i];
        break;
      }
    }

    return {
      id: generateId(),
      x: x - 15,
      y,
      width: 30,
      height: 20,
      type,
      speed: 3,
      active: true,
    };
  }, []);

  const applyPowerUp = useCallback((type: PowerUpType) => {
    setGameState(prev => {
      const newState = { ...prev };
      const paddle = { ...prev.paddle };
      const ball = { ...prev.ball };

      switch (type) {
        case 'expand':
          paddle.width = Math.min(paddle.baseWidth * 1.8, paddle.width + 40);
          break;
        case 'shrink':
          paddle.width = Math.max(paddle.baseWidth * 0.5, paddle.width - 30);
          break;
        case 'slow':
          ball.speed = Math.max(3, ball.speed - 1);
          const angle = Math.atan2(ball.dy, ball.dx);
          ball.dx = Math.cos(angle) * ball.speed;
          ball.dy = Math.sin(angle) * ball.speed;
          break;
        case 'pierce':
          ball.isPiercing = true;
          setTimeout(() => {
            setGameState(p => ({ ...p, ball: { ...p.ball, isPiercing: false } }));
          }, 5000);
          break;
        case 'life':
          newState.lives = Math.min(prev.lives + 1, 5);
          break;
      }

      return { ...newState, paddle, ball };
    });
  }, []);

  const checkBrickCollision = useCallback((ball: typeof gameState.ball, brick: Brick): boolean => {
    return (
      ball.x + ball.radius > brick.x &&
      ball.x - ball.radius < brick.x + brick.width &&
      ball.y + ball.radius > brick.y &&
      ball.y - ball.radius < brick.y + brick.height
    );
  }, []);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current.status !== 'playing') return;

    setGameState(prev => {
      if (prev.status !== 'playing') return prev;

      const newState = { ...prev };
      let ball = { ...prev.ball };
      let paddle = { ...prev.paddle };
      let bricks = [...prev.bricks];
      let powerUps = [...prev.powerUps];
      let particles = [...prev.particles];
      let rescueFlash = false;

      if (prev.keys.left) paddle.x = Math.max(0, paddle.x - paddle.speed);
      if (prev.keys.right) paddle.x = Math.min(CANVAS_WIDTH - paddle.width, paddle.x + paddle.speed);

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= CANVAS_WIDTH) {
        ball.dx = -ball.dx;
        ball.x = ball.x - ball.radius <= 0 ? ball.radius : CANVAS_WIDTH - ball.radius;
      }
      if (ball.y - ball.radius <= 0) {
        ball.dy = -ball.dy;
        ball.y = ball.radius;
      }

      if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
      ) {
        const hitPoint = (ball.x - paddle.x) / paddle.width;
        const angle = (hitPoint - 0.5) * Math.PI * 0.7;
        ball.dy = -Math.abs(ball.speed * Math.cos(angle));
        ball.dx = ball.speed * Math.sin(angle);
        ball.y = paddle.y - ball.radius;

        const distFromEdge = Math.min(hitPoint, 1 - hitPoint);
        if (distFromEdge < 0.15) {
          rescueFlash = true;
        }
      }

      bricks = bricks.map(brick => {
        if (!brick.active) return brick;
        if (!checkBrickCollision(ball, brick)) return brick;

        if (brick.type === 'gold') {
          if (!ball.isPiercing) {
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            if (minOverlapX < minOverlapY) ball.dx = -ball.dx;
            else ball.dy = -ball.dy;
          }
          return brick;
        }

        const newHits = brick.hits + 1;
        if (newHits >= brick.maxHits) {
          const powerUp = createPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
          if (powerUp) powerUps.push(powerUp);
          
          particles = [...particles, ...createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color)];
          newState.score += brick.type === 'silver' ? 20 : 10;
          
          if (!ball.isPiercing) {
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            if (minOverlapX < minOverlapY) ball.dx = -ball.dx;
            else ball.dy = -ball.dy;
          }
          
          return { ...brick, active: false };
        }

        if (!ball.isPiercing) {
          const overlapLeft = ball.x + ball.radius - brick.x;
          const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
          const overlapTop = ball.y + ball.radius - brick.y;
          const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);
          if (minOverlapX < minOverlapY) ball.dx = -ball.dx;
          else ball.dy = -ball.dy;
        }
        
        return { ...brick, hits: newHits, color: '#A0A0A0' };
      });

      powerUps = powerUps.map(pu => {
        if (!pu.active) return pu;
        const newY = pu.y + pu.speed;
        if (
          newY + pu.height >= paddle.y &&
          newY <= paddle.y + paddle.height &&
          pu.x + pu.width >= paddle.x &&
          pu.x <= paddle.x + paddle.width
        ) {
          applyPowerUp(pu.type);
          return { ...pu, active: false };
        }
        if (newY > CANVAS_HEIGHT) {
          return { ...pu, active: false };
        }
        return { ...pu, y: newY };
      }).filter(pu => pu.active);

      particles = particles.map(p => ({
        ...p,
        x: p.x + p.dx,
        y: p.y + p.dy,
        dy: p.dy + 0.1,
        life: p.life - 0.02,
      })).filter(p => p.life > 0);

      const activeBricks = bricks.filter(b => b.active && b.type !== 'gold');
      if (activeBricks.length === 0) {
        return { ...newState, status: 'levelComplete', ball, paddle, bricks, powerUps, particles };
      }

      if (ball.y + ball.radius > CANVAS_HEIGHT) {
        const newLives = prev.lives - 1;
        if (newLives <= 0) {
          return { ...newState, status: 'gameover', ball, paddle, bricks, powerUps, particles };
        }
        const levelConfig = LEVELS[Math.min(prev.level - 1, LEVELS.length - 1)];
        return {
          ...newState,
          lives: newLives,
          ball: {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 80,
            dx: levelConfig.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
            dy: -levelConfig.ballSpeed,
            radius: 8,
            speed: levelConfig.ballSpeed,
            isPiercing: false,
          },
          paddle: {
            ...paddle,
            x: CANVAS_WIDTH / 2 - paddle.width / 2,
            width: paddle.baseWidth,
          },
          status: 'idle',
          powerUps: [],
          particles,
          rescueFlash: false,
        };
      }

      return { ...newState, ball, paddle, bricks, powerUps, particles, rescueFlash };
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [checkBrickCollision, createParticles, createPowerUp, applyPowerUp]);

  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'playing' }));
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: prev.status === 'paused' ? 'playing' : 'paused' }));
  }, []);

  const nextLevel = useCallback(() => {
    const nextLevelNum = gameStateRef.current.level + 1;
    setGameState(prev => createInitialState(nextLevelNum, prev.score, prev.lives));
  }, []);

  const restartGame = useCallback(() => {
    setGameState(createInitialState());
  }, []);

  const setKey = useCallback((key: 'left' | 'right', value: boolean) => {
    setGameState(prev => ({
      ...prev,
      keys: { ...prev.keys, [key]: value },
    }));
  }, []);

  useEffect(() => {
    if (gameState.status === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.status, gameLoop]);

  return {
    gameState,
    startGame,
    pauseGame,
    nextLevel,
    restartGame,
    setKey,
  };
};
