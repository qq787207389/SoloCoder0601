import {
  GameStateData,
  Vector2,
  Effect,
  WIND_STRENGTH,
  WIND_CHANGE_INTERVAL,
  COURT_X,
  COURT_WIDTH,
  COURT_Y,
  COURT_HEIGHT,
  NET_X
} from '../index';

import {
  updateBall,
  checkNetCollision,
  isBallLanded,
  isBallInCourt,
  updatePlayer,
  calculateHitQuality,
  determineShotType,
  hitBall,
  startSwing,
  stunPlayer
} from '../index';

export function updatePhysics(state: GameStateData, playerKeys: any, aiKeys: any, dt: number): void {
  updateWind(state.wind, dt);
  updatePlayer(state.player, playerKeys, dt, true);
  updatePlayer(state.ai, aiKeys, dt, false);

  if (state.ball.isInAir) {
    const prevX = state.ball.position.x;
    updateBall(state.ball, { x: state.wind.x, y: state.wind.y }, dt);
    checkNetCollision(state.ball, prevX);
  }

  updateEffects(state.effects, dt);
}

function updateWind(wind: any, dt: number): void {
  wind.changeTimer -= dt;

  if (wind.changeTimer <= 0) {
    wind.targetX = (Math.random() - 0.5) * WIND_STRENGTH * 2;
    wind.targetY = (Math.random() - 0.5) * WIND_STRENGTH * 0.5;
    wind.changeTimer = WIND_CHANGE_INTERVAL + Math.random() * 4;
  }

  wind.x += (wind.targetX - wind.x) * dt * 0.5;
  wind.y += (wind.targetY - wind.y) * dt * 0.5;
}

function updateEffects(effects: Effect[], dt: number): void {
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.life -= dt;
    effect.position.x += effect.velocity.x * dt;
    effect.position.y += effect.velocity.y * dt;

    if (effect.type === 'dust') {
      effect.velocity.y += 50 * dt;
    } else if (effect.type === 'star') {
      effect.velocity.y -= 30 * dt;
    }

    if (effect.life <= 0) {
      effects.splice(i, 1);
    }
  }
}

export function handlePlayerSwing(state: GameStateData, isSpecial: boolean): boolean {
  if (state.player.isStunned || state.player.isSwinging) return false;
  if (isSpecial && state.player.stamina < 100) return false;

  startSwing(state.player);

  if (!state.ball.isInAir || state.ball.lastHitBy === 'player') return false;

  const quality = calculateHitQuality(state.ball, state.player);
  if (quality === 'miss') return false;

  const shotType = determineShotType(quality, state.ball, state.player, isSpecial);

  if (isSpecial) {
    state.player.stamina = 0;
    stunPlayer(state.player);
    createAfterimageEffect(state.effects, { ...state.ball.position });
  }

  hitBall(state.ball, state.player, shotType, quality, true);
  createHitEffects(state, shotType);

  return true;
}

export function handleAISwing(state: GameStateData): boolean {
  if (state.ai.isStunned || state.ai.isSwinging) return false;
  if (!state.ball.isInAir || state.ball.lastHitBy === 'ai') return false;

  const quality = calculateHitQuality(state.ball, state.ai);
  if (quality === 'miss') return false;

  startSwing(state.ai);
  const shotType = determineShotType(quality, state.ball, state.ai, false);
  hitBall(state.ball, state.ai, shotType, quality, false);
  createHitEffects(state, shotType);

  return true;
}

function createHitEffects(state: GameStateData, shotType: string): void {
  const pos = { ...state.ball.position };

  for (let i = 0; i < 4; i++) {
    state.effects.push({
      type: 'dust',
      position: { ...pos },
      velocity: {
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 60 - 20
      },
      life: 0.3 + Math.random() * 0.3,
      maxLife: 0.6
    });
  }

  if (shotType === 'smash' || shotType === 'special') {
    for (let i = 0; i < 3; i++) {
      state.effects.push({
        type: 'afterimage',
        position: { ...pos },
        velocity: { x: 0, y: 0 },
        life: 0.2,
        maxLife: 0.2,
        data: { index: i }
      });
    }
  }
}

function createAfterimageEffect(effects: Effect[], pos: Vector2): void {
  for (let i = 0; i < 5; i++) {
    effects.push({
      type: 'afterimage',
      position: { ...pos },
      velocity: { x: 0, y: 0 },
      life: 0.15 + i * 0.05,
      maxLife: 0.4,
      data: { index: i }
    });
  }
}

export function createLandingEffects(state: GameStateData): void {
  const pos = { ...state.ball.position };

  for (let i = 0; i < 6; i++) {
    state.effects.push({
      type: 'dust',
      position: { ...pos },
      velocity: {
        x: (Math.random() - 0.5) * 100,
        y: -Math.random() * 80 - 20
      },
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7
    });
  }
}

export function createScoreEffects(state: GameStateData, winner: 'player' | 'ai'): void {
  const baseX = winner === 'player' ? COURT_X + 100 : COURT_X + COURT_WIDTH - 100;

  for (let i = 0; i < 8; i++) {
    state.effects.push({
      type: 'star',
      position: {
        x: baseX + (Math.random() - 0.5) * 100,
        y: COURT_Y + COURT_HEIGHT / 2 + (Math.random() - 0.5) * 100
      },
      velocity: {
        x: (Math.random() - 0.5) * 40,
        y: -Math.random() * 60 - 20
      },
      life: 1.0,
      maxLife: 1.0
    });
  }

  state.effects.push({
    type: 'score',
    position: { x: baseX, y: COURT_Y + COURT_HEIGHT / 2 - 30 },
    velocity: { x: 0, y: -30 },
    life: 1.5,
    maxLife: 1.5,
    data: { winner }
  });
}

export function checkScoring(state: GameStateData): 'player' | 'ai' | null {
  const ball = state.ball;

  if (!ball.isInAir) return null;

  if (isBallLanded(ball)) {
    ball.isInAir = false;
    createLandingEffects(state);

    const inPlayerCourt = ball.position.x < NET_X;
    const inBounds = isBallInCourt(ball);

    if (!inBounds) {
      return ball.lastHitBy === 'player' ? 'ai' : 'player';
    } else if (inPlayerCourt && ball.lastHitBy === 'ai') {
      return 'ai';
    } else if (!inPlayerCourt && ball.lastHitBy === 'player') {
      return 'player';
    } else if (inPlayerCourt && ball.lastHitBy === 'player') {
      return 'ai';
    } else if (!inPlayerCourt && ball.lastHitBy === 'ai') {
      return 'player';
    }
  }

  return null;
}
