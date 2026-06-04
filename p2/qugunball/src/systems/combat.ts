import type { GameState, InputState, Player, Vec2 } from '../game/types';
import {
  FIGHT_DAMAGE, DOWN_TIME,
  MAX_SPEED, PLAYER_RADIUS,
} from '../game/types';

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function updateCombat(
  gameState: GameState,
  inputs: { p1: InputState; p2: InputState },
  dt: number,
): void {
  const { players } = gameState;

  for (const player of players) {
    if (!player.isControlled || player.state !== 'normal') continue;

    const input = player.team === 'red' ? inputs.p1 : inputs.p2;
    if (!input.fightPressed) continue;

    const opponent = findNearbyOpponent(player, players);
    if (opponent) {
      initiateFight(player, opponent);
    }
  }

  for (const player of players) {
    if (player.state !== 'normal') continue;
    const speed = Math.sqrt(player.vel.x * player.vel.x + player.vel.y * player.vel.y);
    if (speed > MAX_SPEED * 0.7) {
      const target = checkBodyCheck(player, players);
      if (target) {
        knockDown(target, DOWN_TIME);
        applyKnockback(target, player.vel);
      }
    }
  }

  updateDownedPlayers(players, dt);
}

export function checkBodyCheck(player: Player, targets: Player[]): Player | null {
  const speed = Math.sqrt(player.vel.x * player.vel.x + player.vel.y * player.vel.y);
  if (speed < MAX_SPEED * 0.7) return null;

  for (const target of targets) {
    if (target.team === player.team || target.state !== 'normal') continue;
    const d = dist(player.pos, target.pos);
    if (d < player.bodyRadius + target.bodyRadius + 4) {
      return target;
    }
  }

  return null;
}

export function updateDownedPlayers(players: Player[], dt: number): void {
  for (const player of players) {
    if (player.state === 'normal') continue;

    player.stateTimer -= dt;
    if (player.stateTimer <= 0) {
      player.state = 'normal';
      player.stateTimer = 0;
      player.fightTarget = null;
    }
  }
}

function findNearbyOpponent(player: Player, players: Player[]): Player | null {
  let closest: Player | null = null;
  let closestDist = Infinity;

  for (const opp of players) {
    if (opp.team === player.team || opp.state !== 'normal') continue;
    const d = dist(player.pos, opp.pos);
    const range = player.stickLength + opp.bodyRadius;
    if (d < range && d < closestDist) {
      closestDist = d;
      closest = opp;
    }
  }

  return closest;
}

function initiateFight(attacker: Player, defender: Player): void {
  attacker.hitPoints -= FIGHT_DAMAGE;
  defender.hitPoints -= FIGHT_DAMAGE;

  const attackerPower = attacker.stats.power + Math.random() * 2;
  const defenderPower = defender.stats.power + Math.random() * 2;

  if (attackerPower < defenderPower) {
    knockDown(attacker, DOWN_TIME);
    attacker.fightTarget = defender.id;
  } else {
    knockDown(defender, DOWN_TIME);
    defender.fightTarget = attacker.id;
  }

  attacker.hitPoints = Math.max(0, attacker.hitPoints);
  defender.hitPoints = Math.max(0, defender.hitPoints);
}

function knockDown(player: Player, duration: number): void {
  player.state = 'down';
  player.stateTimer = duration;
  player.vel.x = 0;
  player.vel.y = 0;
  if (player.hasPuck) {
    player.hasPuck = false;
  }
}

function applyKnockback(player: Player, sourceVel: Vec2): void {
  player.vel.x = sourceVel.x * 1.5;
  player.vel.y = sourceVel.y * 1.5;
}
