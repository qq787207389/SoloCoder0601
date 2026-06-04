import type { GameState, Player, Team, Vec2 } from '../game/types';
import {
  ACCELERATION, FRICTION, MAX_SPEED, SPEED_BOOST, RINK,
  SHOT_POWER, PASS_POWER,
} from '../game/types';
import { shootPuck, detachPuck } from '../entities/puck';

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function getOpponentGoalX(team: Team): number {
  return team === 'red' ? RINK.width - RINK.boardThickness : RINK.boardThickness;
}

function getOwnGoalX(team: Team): number {
  return team === 'red' ? RINK.boardThickness : RINK.width - RINK.boardThickness;
}

export function updateAI(gameState: GameState, dt: number): void {
  const { players, puck } = gameState;

  for (const player of players) {
    if (player.isControlled || player.state !== 'normal') continue;

    const targetPos = getTargetPosition(player, gameState);
    moveTowardTarget(player, targetPos, dt);
    faceTowardPoint(player, puck.pos);

    if (player.hasPuck) {
      handlePuckCarrierAI(player, gameState);
    }

    maybeStartFight(player, gameState);
  }
}

function getTargetPosition(player: Player, gameState: GameState): Vec2 {
  const { puck } = gameState;
  const puckPos = puck.pos;
  const ownGoalX = getOwnGoalX(player.team);
  const oppGoalX = getOpponentGoalX(player.team);
  const ownGoalY = RINK.height / 2;

  if (player.role === 'goalie') {
    return getGoalieTarget(player, puckPos, ownGoalX, ownGoalY);
  }

  if (player.role.startsWith('defender')) {
    return getDefenderTarget(player, puckPos, ownGoalX, ownGoalY);
  }

  return getForwardTarget(player, puckPos, oppGoalX, puck.holderId);
}

function getGoalieTarget(player: Player, puckPos: Vec2, ownGoalX: number, ownGoalY: number): Vec2 {
  const baseX = player.team === 'red' ? ownGoalX + 40 : ownGoalX - 40;
  const puckDist = Math.abs(puckPos.x - ownGoalX);

  let challengeX = baseX;
  if (puckDist < 150 && Math.random() < 0.01) {
    challengeX = player.team === 'red' ? ownGoalX + 80 : ownGoalX - 80;
  }

  const targetY = puckPos.y;
  const clampedY = Math.max(ownGoalY - RINK.goalWidth / 2, Math.min(ownGoalY + RINK.goalWidth / 2, targetY));

  return { x: challengeX, y: clampedY };
}

function getDefenderTarget(player: Player, puckPos: Vec2, ownGoalX: number, ownGoalY: number): Vec2 {
  const midX = (puckPos.x + ownGoalX) / 2;
  const midY = (puckPos.y + ownGoalY) / 2;

  const puckDist = dist(player.pos, puckPos);
  if (puckDist < 180) {
    return { x: puckPos.x, y: puckPos.y };
  }

  return { x: midX, y: midY };
}

function getForwardTarget(player: Player, puckPos: Vec2, oppGoalX: number, puckHolderId: number | null): Vec2 {
  const puckDist = dist(player.pos, puckPos);
  const oppGoalPos = { x: oppGoalX, y: RINK.height / 2 };

  if (puckHolderId === null && puckDist < 200) {
    return { x: puckPos.x, y: puckPos.y };
  }

  const offsetIndex = player.id % 3;
  const yOffsets = [-80, 0, 80];
  const offsetY = yOffsets[offsetIndex] ?? 0;

  return { x: oppGoalPos.x + (player.team === 'red' ? -150 : 150), y: RINK.height / 2 + offsetY };
}

function moveTowardTarget(player: Player, target: Vec2, dt: number): void {
  const dx = target.x - player.pos.x;
  const dy = target.y - player.pos.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d < 5) return;

  const dir = normalize({ x: dx, y: dy });

  const speedMult = player.stats.speed / 3;
  player.vel.x += dir.x * ACCELERATION * speedMult;
  player.vel.y += dir.y * ACCELERATION * speedMult;

  player.vel.x *= (1 - FRICTION);
  player.vel.y *= (1 - FRICTION);

  const maxSpd = player.activeItem === 'speed_skates' ? MAX_SPEED * SPEED_BOOST : MAX_SPEED;
  const speed = Math.sqrt(player.vel.x * player.vel.x + player.vel.y * player.vel.y);
  if (speed > maxSpd) {
    player.vel.x = (player.vel.x / speed) * maxSpd;
    player.vel.y = (player.vel.y / speed) * maxSpd;
  }

  player.pos.x += player.vel.x;
  player.pos.y += player.vel.y;

  clampToRink(player);
}

function clampToRink(player: Player): void {
  const margin = RINK.boardThickness + player.bodyRadius;
  player.pos.x = Math.max(margin, Math.min(RINK.width - margin, player.pos.x));
  player.pos.y = Math.max(margin, Math.min(RINK.height - margin, player.pos.y));
}

function faceTowardPoint(player: Player, point: Vec2): void {
  const dx = point.x - player.pos.x;
  const dy = point.y - player.pos.y;
  player.angle = Math.atan2(dy, dx);
}

function handlePuckCarrierAI(player: Player, gameState: GameState): void {
  const { puck } = gameState;
  const oppGoalX = getOpponentGoalX(player.team);
  const oppGoalPos = { x: oppGoalX, y: RINK.height / 2 };
  const distToGoal = dist(player.pos, oppGoalPos);

  if (distToGoal < 250) {
    shootPuck(puck, player, SHOT_POWER);
    player.hasPuck = false;
    return;
  }

  const teammate = findOpenTeammate(player, gameState);
  if (teammate && distToGoal > 350) {
    const dir = normalize({ x: teammate.pos.x - player.pos.x, y: teammate.pos.y - player.pos.y });
    detachPuck(puck, { x: dir.x * PASS_POWER, y: dir.y * PASS_POWER });
    player.hasPuck = false;
  }
}

function findOpenTeammate(player: Player, gameState: GameState): Player | null {
  const oppGoalX = getOpponentGoalX(player.team);
  let best: Player | null = null;
  let bestDistToGoal = Infinity;

  for (const p of gameState.players) {
    if (p.id === player.id || p.team !== player.team || p.state !== 'normal') continue;
    const dGoal = Math.abs(p.pos.x - oppGoalX);
    const hasDefender = gameState.players.some(
      opp => opp.team !== player.team && opp.state === 'normal' && dist(opp.pos, p.pos) < 60
    );
    if (!hasDefender && dGoal < bestDistToGoal) {
      bestDistToGoal = dGoal;
      best = p;
    }
  }

  return best;
}

function maybeStartFight(player: Player, gameState: GameState): void {
  if (Math.random() > 0.002) return;

  for (const opp of gameState.players) {
    if (opp.team === player.team || opp.state !== 'normal') continue;
    if (dist(player.pos, opp.pos) < player.stickLength + opp.bodyRadius) {
      player.fightTarget = opp.id;
      break;
    }
  }
}
