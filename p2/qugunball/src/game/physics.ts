import type { Vec2, Player, Puck, Goal, Team, RinkConfig } from './types';
import {
  FRICTION,
  TURN_FACTOR,
  BOUNCE_PLAYER,
  BOUNCE_BOARD,
  RINK,
} from './types';

export function vec2Add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vec2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vec2Scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function angleToVec2(angle: number): Vec2 {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function applyFriction(vel: Vec2, friction: number): Vec2 {
  const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
  if (speed === 0) return { x: 0, y: 0 };
  const newSpeed = Math.max(0, speed - friction);
  const scale = newSpeed / speed;
  return { x: vel.x * scale, y: vel.y * scale };
}

export function applyAcceleration(vel: Vec2, angle: number, amount: number, maxSpeed: number): Vec2 {
  const currentSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
  const turnInfluence = currentSpeed > 0.5
    ? TURN_FACTOR + (1 - TURN_FACTOR) * (1 - currentSpeed / maxSpeed)
    : 1.0;
  const targetAngle = angle;
  const accelVec = angleToVec2(targetAngle);
  const newVel = {
    x: vel.x + accelVec.x * amount * turnInfluence,
    y: vel.y + accelVec.y * amount * turnInfluence,
  };
  const newSpeed = Math.sqrt(newVel.x * newVel.x + newVel.y * newVel.y);
  if (newSpeed > maxSpeed) {
    const scale = maxSpeed / newSpeed;
    newVel.x *= scale;
    newVel.y *= scale;
  }
  return newVel;
}

export function checkCircleCollision(pos1: Vec2, r1: number, pos2: Vec2, r2: number): boolean {
  return distance(pos1, pos2) < r1 + r2;
}

export function resolveCircleCollision(p1: Player, p2: Player): void {
  const diff = vec2Sub(p1.pos, p2.pos);
  const dist = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
  const minDist = p1.bodyRadius + p2.bodyRadius;
  if (dist === 0 || dist >= minDist) return;
  const normal = { x: diff.x / dist, y: diff.y / dist };
  const overlap = minDist - dist;
  p1.pos.x += normal.x * overlap * 0.5;
  p1.pos.y += normal.y * overlap * 0.5;
  p2.pos.x -= normal.x * overlap * 0.5;
  p2.pos.y -= normal.y * overlap * 0.5;
  const relVel = vec2Sub(p1.vel, p2.vel);
  const velAlongNormal = relVel.x * normal.x + relVel.y * normal.y;
  if (velAlongNormal > 0) return;
  const impulse = -(1 + BOUNCE_PLAYER) * velAlongNormal * 0.5;
  p1.vel.x += impulse * normal.x;
  p1.vel.y += impulse * normal.y;
  p2.vel.x -= impulse * normal.x;
  p2.vel.y -= impulse * normal.y;
  const p1Speed = Math.sqrt(p1.vel.x * p1.vel.x + p1.vel.y * p1.vel.y);
  const p2Speed = Math.sqrt(p2.vel.x * p2.vel.x + p2.vel.y * p2.vel.y);
  if (p1Speed > 0.1) {
    p1.vel = applyFriction(p1.vel, FRICTION * 3);
  }
  if (p2Speed > 0.1) {
    p2.vel = applyFriction(p2.vel, FRICTION * 3);
  }
}

export function checkBoardCollision(pos: Vec2, radius: number, rink: RinkConfig): Vec2 {
  const result = { x: pos.x, y: pos.y };
  const left = rink.boardThickness + radius;
  const right = rink.width - rink.boardThickness - radius;
  const top = rink.boardThickness + radius;
  const bottom = rink.height - rink.boardThickness - radius;

  if (result.x < left) {
    result.x = left;
  } else if (result.x > right) {
    result.x = right;
  }
  if (result.y < top) {
    result.y = top;
  } else if (result.y > bottom) {
    result.y = bottom;
  }

  const corners: Vec2[] = [
    { x: rink.boardThickness + rink.cornerRadius, y: rink.boardThickness + rink.cornerRadius },
    { x: rink.width - rink.boardThickness - rink.cornerRadius, y: rink.boardThickness + rink.cornerRadius },
    { x: rink.boardThickness + rink.cornerRadius, y: rink.height - rink.boardThickness - rink.cornerRadius },
    { x: rink.width - rink.boardThickness - rink.cornerRadius, y: rink.height - rink.boardThickness - rink.cornerRadius },
  ];

  for (const corner of corners) {
    const inCornerX = (corner.x < rink.width / 2)
      ? result.x < corner.x
      : result.x > corner.x;
    const inCornerYActual = (corner.y < rink.height / 2)
      ? result.y < corner.y
      : result.y > corner.y;

    if (inCornerX && inCornerYActual) {
      const dist = distance(result, corner);
      const maxDist = rink.cornerRadius - radius;
      if (dist > maxDist && dist > 0) {
        const n = normalize(vec2Sub(result, corner));
        result.x = corner.x + n.x * maxDist;
        result.y = corner.y + n.y * maxDist;
      }
    }
  }

  return result;
}

export function bounceOffBoards(pos: Vec2, vel: Vec2, radius: number, rink: RinkConfig): Vec2 {
  const newVel = { x: vel.x, y: vel.y };
  const left = rink.boardThickness + radius;
  const right = rink.width - rink.boardThickness - radius;
  const top = rink.boardThickness + radius;
  const bottom = rink.height - rink.boardThickness - radius;

  if (pos.x <= left || pos.x >= right) {
    newVel.x = -newVel.x * BOUNCE_BOARD;
  }
  if (pos.y <= top || pos.y >= bottom) {
    newVel.y = -newVel.y * BOUNCE_BOARD;
  }

  const corners: Vec2[] = [
    { x: rink.boardThickness + rink.cornerRadius, y: rink.boardThickness + rink.cornerRadius },
    { x: rink.width - rink.boardThickness - rink.cornerRadius, y: rink.boardThickness + rink.cornerRadius },
    { x: rink.boardThickness + rink.cornerRadius, y: rink.height - rink.boardThickness - rink.cornerRadius },
    { x: rink.width - rink.boardThickness - rink.cornerRadius, y: rink.height - rink.boardThickness - rink.cornerRadius },
  ];

  for (const corner of corners) {
    const inCornerX = (corner.x < rink.width / 2)
      ? pos.x < corner.x
      : pos.x > corner.x;
    const inCornerY = (corner.y < rink.height / 2)
      ? pos.y < corner.y
      : pos.y > corner.y;

    if (inCornerX && inCornerY) {
      const dist = distance(pos, corner);
      const maxDist = rink.cornerRadius - radius;
      if (dist >= maxDist && dist > 0) {
        const n = normalize(vec2Sub(pos, corner));
        const dot = newVel.x * n.x + newVel.y * n.y;
        if (dot > 0) {
          newVel.x -= 2 * dot * n.x;
          newVel.y -= 2 * dot * n.y;
          newVel.x *= BOUNCE_BOARD;
          newVel.y *= BOUNCE_BOARD;
        }
      }
    }
  }

  return newVel;
}

export function checkGoalCollision(puck: Puck, goals: Goal[]): Team | null {
  for (const goal of goals) {
    const goalTop = goal.y - goal.width / 2;
    const goalBottom = goal.y + goal.width / 2;
    const inGoalMouth = puck.pos.y >= goalTop && puck.pos.y <= goalBottom;
    let inGoalDepth = false;
    if (goal.team === 'red') {
      inGoalDepth = puck.pos.x <= RINK.boardThickness + goal.depth;
    } else {
      inGoalDepth = puck.pos.x >= RINK.width - RINK.boardThickness - goal.depth;
    }
    if (inGoalMouth && inGoalDepth) {
      return goal.team;
    }
  }
  return null;
}

export function isInGoalArea(pos: Vec2, team: Team, rink: RinkConfig): boolean {
  if (team === 'red') {
    return pos.x < rink.boardThickness + 80;
  } else {
    return pos.x > rink.width - rink.boardThickness - 80;
  }
}
