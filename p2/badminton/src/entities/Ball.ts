import {
  BallState,
  PlayerState,
  ShotType,
  HitQuality,
  Vector2,
  HIT_RADIUS,
  PERFECT_HIT_WINDOW,
  GOOD_HIT_WINDOW,
  SHOT_SPEEDS,
  SHOT_HEIGHTS,
  SHOT_VZ,
  SHOT_ANGLES,
  COURT_X,
  COURT_WIDTH,
  COURT_Y,
  COURT_HEIGHT,
  NET_X,
  NET_HEIGHT,
  GRAVITY,
  AIR_RESISTANCE,
  BALL_RADIUS
} from '../index';

export function calculateHitQuality(ball: BallState, player: PlayerState): HitQuality {
  const dx = ball.position.x - player.position.x;
  const dy = ball.position.y - player.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > HIT_RADIUS) {
    return 'miss';
  }

  const timeSinceHit = (performance.now() / 1000) - ball.hitTimestamp;

  const optimalHitTime = 0.3;
  const timeDiff = Math.abs(timeSinceHit - optimalHitTime);

  const positionScore = dist / HIT_RADIUS;

  if (timeDiff < PERFECT_HIT_WINDOW && positionScore < 0.5) {
    return 'perfect';
  } else if (timeDiff < GOOD_HIT_WINDOW && positionScore < 0.8) {
    return 'good';
  } else {
    return 'poor';
  }
}

export function determineShotType(
  quality: HitQuality,
  ball: BallState,
  player: PlayerState,
  isSpecial: boolean
): ShotType {
  if (isSpecial) {
    return ShotType.SPECIAL;
  }

  const distToNet = Math.abs(player.position.x - NET_X);
  const isNearNet = distToNet < 100;
  const isHighBall = ball.height > 80;

  if (quality === 'perfect') {
    if (isHighBall && !isNearNet) {
      return ShotType.SMASH;
    } else if (isNearNet) {
      return ShotType.DROP;
    } else {
      return ShotType.DRIVE;
    }
  } else if (quality === 'good') {
    if (isNearNet) {
      return ShotType.DROP;
    } else {
      return ShotType.DRIVE;
    }
  } else {
    return ShotType.CLEAR;
  }
}

export function hitBall(
  ball: BallState,
  player: PlayerState,
  shotType: ShotType,
  quality: HitQuality,
  isPlayer: boolean
): void {
  const targetSide = isPlayer ? 1 : -1;

  const speed = SHOT_SPEEDS[shotType];
  const baseAngle = SHOT_ANGLES[shotType];

  let qualityMultiplier = quality === 'perfect' ? 1.15 : quality === 'good' ? 1.0 : 0.8;
  if (shotType === ShotType.SPECIAL) qualityMultiplier = 1.3;

  const randomSpeedFactor = 0.9 + Math.random() * 0.2;
  const finalSpeed = speed * qualityMultiplier * randomSpeedFactor;

  const targetY = COURT_Y + COURT_HEIGHT / 2;
  const dy = targetY - player.position.y;
  const angleOffset = dy * 0.002;
  const randomAngleOffset = (Math.random() - 0.5) * 0.15;
  const finalAngle = baseAngle + angleOffset * targetSide + randomAngleOffset;

  const randomVzFactor = 0.9 + Math.random() * 0.2;
  const randomHeightOffset = (Math.random() - 0.5) * 20;

  ball.velocity.x = Math.cos(finalAngle) * finalSpeed * targetSide;
  ball.velocity.y = Math.sin(finalAngle) * finalSpeed * 0.5;
  ball.vz = SHOT_VZ[shotType] * randomVzFactor;
  ball.height = SHOT_HEIGHTS[shotType] + randomHeightOffset;
  ball.lastHitBy = isPlayer ? 'player' : 'ai';
  ball.shotType = shotType;
  ball.hitTimestamp = performance.now() / 1000;
  ball.trail = [];
}

export function updateBall(ball: BallState, wind: Vector2, dt: number): void {
  if (!ball.isInAir) return;

  ball.trail.push({ x: ball.position.x, y: ball.position.y });
  if (ball.trail.length > 15) {
    ball.trail.shift();
  }

  ball.velocity.x += wind.x * dt;
  ball.velocity.y += wind.y * dt * 0.3;

  ball.position.x += ball.velocity.x * dt;
  ball.position.y += ball.velocity.y * dt;

  ball.vz -= GRAVITY * dt;
  ball.height += ball.vz * dt;

  ball.velocity.x *= AIR_RESISTANCE;
  ball.velocity.y *= AIR_RESISTANCE;
  ball.vz *= 0.998;

  if (ball.height < 0) {
    ball.height = 0;
  }
}

export function checkNetCollision(ball: BallState, prevX: number): boolean {
  if (
    (prevX < NET_X && ball.position.x >= NET_X) ||
    (prevX > NET_X && ball.position.x <= NET_X)
  ) {
    if (ball.height < NET_HEIGHT * 0.7) {
      ball.velocity.x *= -0.3;
      ball.velocity.y *= 0.5;
      ball.vz *= 0.5;
      return true;
    }
  }
  return false;
}

export function isBallInCourt(ball: BallState): boolean {
  return (
    ball.position.x >= COURT_X - BALL_RADIUS &&
    ball.position.x <= COURT_X + COURT_WIDTH + BALL_RADIUS &&
    ball.position.y >= COURT_Y - BALL_RADIUS &&
    ball.position.y <= COURT_Y + COURT_HEIGHT + BALL_RADIUS
  );
}

export function isBallLanded(ball: BallState): boolean {
  return ball.height <= 0 && ball.isInAir;
}

export function getBallLandingPosition(ball: BallState, wind: Vector2): Vector2 | null {
  if (!ball.isInAir || ball.height <= 0) return null;

  let simX = ball.position.x;
  let simY = ball.position.y;
  let simVz = ball.vz;
  let simVx = ball.velocity.x;
  let simVy = ball.velocity.y;
  let simH = ball.height;
  const dt = 1 / 60;

  for (let i = 0; i < 500; i++) {
    simVx += wind.x * dt;
    simVy += wind.y * dt * 0.3;
    simVz -= GRAVITY * dt;
    simH += simVz * dt;
    simX += simVx * dt;
    simY += simVy * dt;
    simVx *= AIR_RESISTANCE;
    simVy *= AIR_RESISTANCE;
    simVz *= 0.998;

    if (simH <= 0) {
      return { x: simX, y: simY };
    }
  }
  return null;
}
