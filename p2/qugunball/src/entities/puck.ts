import type { Puck, Player, Vec2 } from '../game/types';
import { RINK, PUCK_FRICTION, PUCK_RADIUS } from '../game/types';

export function createPuck(): Puck {
  return {
    pos: { x: RINK.width / 2, y: RINK.height / 2 },
    vel: { x: 0, y: 0 },
    angle: 0,
    state: 'normal',
    holderId: null,
    stateTimer: 0,
  };
}

export function updatePuck(puck: Puck, dt: number): void {
  if (puck.holderId !== null) return;

  puck.vel.x *= (1 - PUCK_FRICTION);
  puck.vel.y *= (1 - PUCK_FRICTION);

  puck.pos.x += puck.vel.x * dt * 60;
  puck.pos.y += puck.vel.y * dt * 60;

  const bx = RINK.boardThickness + PUCK_RADIUS;
  const by = RINK.boardThickness + PUCK_RADIUS;

  if (puck.pos.x < bx) {
    puck.pos.x = bx;
    puck.vel.x = -puck.vel.x * 0.8;
  }
  if (puck.pos.x > RINK.width - bx) {
    puck.pos.x = RINK.width - bx;
    puck.vel.x = -puck.vel.x * 0.8;
  }
  if (puck.pos.y < by) {
    puck.pos.y = by;
    puck.vel.y = -puck.vel.y * 0.8;
  }
  if (puck.pos.y > RINK.height - by) {
    puck.pos.y = RINK.height - by;
    puck.vel.y = -puck.vel.y * 0.8;
  }

  if (puck.stateTimer > 0) {
    puck.stateTimer -= dt;
    if (puck.stateTimer <= 0) {
      puck.state = 'normal';
      puck.stateTimer = 0;
      puck.splitPucks = undefined;
      puck.curveDirection = undefined;
      puck.whirlwindTimer = undefined;
    }
  }

  if (puck.state === 'curve' && puck.curveDirection !== undefined) {
    const curveForce = puck.curveDirection * 0.15;
    const perpX = -puck.vel.y;
    const perpY = puck.vel.x;
    const speed = Math.sqrt(perpX * perpX + perpY * perpY);
    if (speed > 0.1) {
      puck.vel.x += (perpX / speed) * curveForce;
      puck.vel.y += (perpY / speed) * curveForce;
    }
  }
}

export function attachPuckToPlayer(puck: Puck, player: Player): void {
  puck.holderId = player.id;
  const stickTipX = player.pos.x + Math.cos(player.angle) * player.stickLength;
  const stickTipY = player.pos.y + Math.sin(player.angle) * player.stickLength;
  puck.pos.x = stickTipX;
  puck.pos.y = stickTipY;
  puck.vel.x = 0;
  puck.vel.y = 0;
}

export function detachPuck(puck: Puck, vel?: Vec2): void {
  puck.holderId = null;
  if (vel) {
    puck.vel.x = vel.x;
    puck.vel.y = vel.y;
  }
}

export function shootPuck(puck: Puck, player: Player, power: number): void {
  puck.holderId = null;
  const speed = power * (player.stats.shot / 3);
  puck.vel.x = Math.cos(player.angle) * speed;
  puck.vel.y = Math.sin(player.angle) * speed;
  puck.pos.x = player.pos.x + Math.cos(player.angle) * player.stickLength;
  puck.pos.y = player.pos.y + Math.sin(player.angle) * player.stickLength;
}
