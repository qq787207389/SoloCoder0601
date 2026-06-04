import {
  GameStateData,
  PlayerState,
  BallState,
  AIStyle,
  KeyState,
  ShotType,
  HitQuality,
  Vector2,
  COURT_X,
  COURT_WIDTH,
  COURT_Y,
  COURT_HEIGHT,
  NET_X,
  AI_REACTION_TIME,
  AI_POSITION_BIAS,
  HIT_RADIUS,
  PERFECT_HIT_WINDOW,
  GOOD_HIT_WINDOW
} from '../index';

import { getBallLandingPosition, getDistance } from '../index';

interface AIDecision {
  targetPosition: Vector2;
  shouldSwing: boolean;
  shotType: ShotType | null;
}

export class AIController {
  private decision: AIDecision;
  private reactionTimer: number;
  private style: AIStyle;

  constructor() {
    this.decision = {
      targetPosition: { x: 0, y: 0 },
      shouldSwing: false,
      shotType: null
    };
    this.reactionTimer = 0;
    this.style = AIStyle.DEFENSIVE;
  }

  setStyle(style: AIStyle): void {
    this.style = style;
  }

  update(state: GameStateData, dt: number): KeyState {
    const keys: KeyState = {
      up: false,
      down: false,
      left: false,
      right: false,
      swing: false,
      special: false
    };

    this.reactionTimer -= dt;
    if (this.reactionTimer <= 0) {
      this.makeDecision(state);
      this.reactionTimer = AI_REACTION_TIME[this.style];
    }

    const ai = state.ai;
    const target = this.decision.targetPosition;

    const dx = target.x - ai.position.x;
    const dy = target.y - ai.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const moveSpeed = 0.9;
      if (Math.abs(dx) > 3) {
        keys.left = dx < -moveSpeed;
        keys.right = dx > moveSpeed;
      }
      if (Math.abs(dy) > 3) {
        keys.up = dy < -moveSpeed;
        keys.down = dy > moveSpeed;
      }
    }

    if (this.decision.shouldSwing) {
      keys.swing = true;
      this.decision.shouldSwing = false;
    }

    return keys;
  }

  private makeDecision(state: GameStateData): void {
    const ball = state.ball;
    const ai = state.ai;
    const wind = { x: state.wind.x, y: state.wind.y };

    const aiMinX = COURT_X + COURT_WIDTH / 2 + 20;
    const aiMaxX = COURT_X + COURT_WIDTH - 20;
    const aiMinY = COURT_Y + 20;
    const aiMaxY = COURT_Y + COURT_HEIGHT - 20;

    const bias = AI_POSITION_BIAS[this.style];
    const baseX = aiMinX + (aiMaxX - aiMinX) * (0.5 + bias.x * 0.3);
    const baseY = aiMinY + (aiMaxY - aiMinY) * (0.5 + bias.y * 0.3);

    if (ball.isInAir && ball.lastHitBy === 'player') {
      const landingPos = getBallLandingPosition(ball, wind);

      if (landingPos && landingPos.x > NET_X) {
        let targetX = landingPos.x;
        let targetY = landingPos.y;

        if (this.style === AIStyle.DEFENSIVE) {
          targetX = Math.max(baseX - 50, Math.min(baseX + 50, targetX));
        } else if (this.style === AIStyle.NET) {
          targetX = Math.max(NET_X + 60, targetX - 30);
        }

        this.decision.targetPosition = {
          x: Math.max(aiMinX, Math.min(aiMaxX, targetX)),
          y: Math.max(aiMinY, Math.min(aiMaxY, targetY))
        };

        const distToBall = getDistance(ai.position, ball.position);
        if (distToBall < HIT_RADIUS * 0.9) {
          const timeSinceHit = (performance.now() / 1000) - ball.hitTimestamp;
          const optimalHitTime = 0.3;
          const timeDiff = Math.abs(timeSinceHit - optimalHitTime);

          let shouldSwingNow = false;
          if (this.style === AIStyle.AGGRESSIVE) {
            shouldSwingNow = timeDiff < GOOD_HIT_WINDOW;
          } else if (this.style === AIStyle.NET) {
            shouldSwingNow = timeDiff < PERFECT_HIT_WINDOW * 1.5;
          } else {
            shouldSwingNow = timeDiff < GOOD_HIT_WINDOW * 1.2;
          }

          if (shouldSwingNow) {
            this.decision.shouldSwing = true;
            this.decision.shotType = this.chooseShotType(state, ball);
          }
        }
      } else {
        this.decision.targetPosition = { x: baseX, y: baseY };
      }
    } else {
      this.decision.targetPosition = { x: baseX, y: baseY };
    }
  }

  private chooseShotType(state: GameStateData, ball: BallState): ShotType {
    const ai = state.ai;
    const quality = this.estimateHitQuality(ball, ai);
    const distToNet = Math.abs(ai.position.x - NET_X);
    const isNearNet = distToNet < 120;
    const isHighBall = ball.height > 70;

    if (this.style === AIStyle.AGGRESSIVE) {
      if (isHighBall && quality === 'perfect') {
        return ShotType.SMASH;
      } else if (isNearNet && quality !== 'poor') {
        return Math.random() < 0.7 ? ShotType.DROP : ShotType.DRIVE;
      } else if (quality === 'poor') {
        return ShotType.CLEAR;
      } else {
        return ShotType.DRIVE;
      }
    } else if (this.style === AIStyle.NET) {
      if (isNearNet && quality !== 'poor') {
        return Math.random() < 0.8 ? ShotType.DROP : ShotType.DRIVE;
      } else if (isHighBall && quality === 'perfect') {
        return ShotType.SMASH;
      } else if (quality === 'poor') {
        return ShotType.CLEAR;
      } else {
        return ShotType.DRIVE;
      }
    } else {
      if (quality === 'poor') {
        return ShotType.CLEAR;
      } else if (isHighBall && quality === 'perfect' && Math.random() < 0.4) {
        return ShotType.SMASH;
      } else if (isNearNet && Math.random() < 0.3) {
        return ShotType.DROP;
      } else {
        return Math.random() < 0.6 ? ShotType.DRIVE : ShotType.CLEAR;
      }
    }
  }

  private estimateHitQuality(ball: BallState, player: PlayerState): HitQuality {
    const dist = getDistance(ball.position, player.position);
    if (dist > HIT_RADIUS) return 'miss';

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
}
