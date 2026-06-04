import type { GameState, InputState, Player, Team, Vec2, Puck } from '../game/types';
import {
  SPECIAL_CHARGE_RATE, MAX_SPECIAL_CHARGE, SHOT_POWER,
  DOWN_TIME,
} from '../game/types';
import { shootPuck } from '../entities/puck';

interface IceWall {
  pos: Vec2;
  width: number;
  height: number;
  timer: number;
  team: Team;
}

interface GoalieClone {
  playerId: number;
  offsetX: number;
  timer: number;
  pos: Vec2;
}

let activeWalls: IceWall[] = [];
let activeClones: GoalieClone[] = [];

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function updateSpecials(
  gameState: GameState,
  inputs: { p1: InputState; p2: InputState },
  dt: number,
): void {
  const { players, puck } = gameState;

  for (const player of players) {
    if (player.state !== 'normal') continue;

    const speed = Math.sqrt(player.vel.x * player.vel.x + player.vel.y * player.vel.y);
    if (speed > 0.5) {
      player.specialCharge += SPECIAL_CHARGE_RATE * dt;
      player.specialCharge = Math.min(player.specialCharge, MAX_SPECIAL_CHARGE);
    }
  }

  for (const player of players) {
    if (!player.isControlled || player.state !== 'normal') continue;

    const input = player.team === 'red' ? inputs.p1 : inputs.p2;
    if (input.specialPressed && player.specialCharge >= MAX_SPECIAL_CHARGE) {
      executeSpecial(player, gameState);
    }
  }

  updateWalls(dt);
  updateClones(gameState, dt);
  checkPuckWallCollision(gameState);
  checkPuckPlayerCollision(gameState);
}

export function checkComboSpecial(gameState: GameState, team: Team): boolean {
  const teamPlayers = gameState.players.filter(p => p.team === team);
  const charged = teamPlayers.filter(p => p.specialCharge >= MAX_SPECIAL_CHARGE && p.state === 'normal');

  if (charged.length < 2) {
    gameState.comboReady[team] = false;
    gameState.comboPlayers[team] = [];
    return false;
  }

  const hasWhirlwind = charged.some(p => p.special === 'whirlwind_slash');
  const hasIceWall = charged.some(p => p.special === 'ice_wall');
  const hasForward = charged.some(p => p.role.startsWith('forward'));

  if (hasWhirlwind && hasForward) {
    gameState.comboReady[team] = true;
    const whirlwindPlayer = charged.find(p => p.special === 'whirlwind_slash')!;
    const forwardPlayer = charged.find(p => p.role.startsWith('forward'))!;
    gameState.comboPlayers[team] = [whirlwindPlayer.id, forwardPlayer.id];
    return true;
  }

  if (hasIceWall && hasForward) {
    gameState.comboReady[team] = true;
    const wallPlayer = charged.find(p => p.special === 'ice_wall')!;
    const forwardPlayer = charged.find(p => p.role.startsWith('forward'))!;
    gameState.comboPlayers[team] = [wallPlayer.id, forwardPlayer.id];
    return true;
  }

  gameState.comboReady[team] = false;
  gameState.comboPlayers[team] = [];
  return false;
}

function executeSpecial(player: Player, gameState: GameState): void {
  const { puck } = gameState;
  player.specialCharge = 0;

  switch (player.special) {
    case 'fire_shot':
      executeFireShot(player, puck);
      break;
    case 'split_shot':
      executeSplitShot(player, puck);
      break;
    case 'curve_shot':
      executeCurveShot(player, puck);
      break;
    case 'ice_wall':
      executeIceWall(player);
      break;
    case 'whirlwind_slash':
      executeWhirlwindSlash(player, gameState);
      break;
    case 'clone_save':
      executeCloneSave(player);
      break;
    default:
      break;
  }
}

function executeFireShot(player: Player, puck: Puck): void {
  if (!player.hasPuck) return;
  shootPuck(puck, player, SHOT_POWER);
  puck.vel.x *= 2.5;
  puck.vel.y *= 2.5;
  puck.state = 'fire';
  puck.stateTimer = 3;
  player.hasPuck = false;
}

function executeSplitShot(player: Player, puck: Puck): void {
  if (!player.hasPuck) return;
  shootPuck(puck, player, SHOT_POWER);
  puck.state = 'split';
  puck.stateTimer = 2;

  const speed = Math.sqrt(puck.vel.x * puck.vel.x + puck.vel.y * puck.vel.y);
  const angle = Math.atan2(puck.vel.y, puck.vel.x);

  puck.splitPucks = [
    {
      pos: { ...puck.pos },
      vel: { x: Math.cos(angle - 0.3) * speed, y: Math.sin(angle - 0.3) * speed },
      angle: angle - 0.3,
      state: 'split',
      holderId: null,
      stateTimer: 2,
    },
    {
      pos: { ...puck.pos },
      vel: { x: Math.cos(angle + 0.3) * speed, y: Math.sin(angle + 0.3) * speed },
      angle: angle + 0.3,
      state: 'split',
      holderId: null,
      stateTimer: 2,
    },
  ];

  player.hasPuck = false;
}

function executeCurveShot(player: Player, puck: Puck): void {
  if (!player.hasPuck) return;
  shootPuck(puck, player, SHOT_POWER);
  puck.state = 'curve';
  puck.stateTimer = 2;
  puck.curveDirection = (player.team === 'red' ? 1 : -1) * (Math.random() > 0.5 ? 1 : -1);
  player.hasPuck = false;
}

function executeIceWall(player: Player): void {
  const wallX = player.team === 'red'
    ? player.pos.x + 60
    : player.pos.x - 60;

  activeWalls.push({
    pos: { x: wallX, y: player.pos.y },
    width: 20,
    height: 120,
    timer: 3,
    team: player.team,
  });
}

function executeWhirlwindSlash(player: Player, gameState: GameState): void {
  gameState.puck.state = 'whirlwind';
  gameState.puck.whirlwindTimer = 1;

  for (const opp of gameState.players) {
    if (opp.team === player.team || opp.state !== 'normal') continue;
    const d = dist(player.pos, opp.pos);
    if (d < 100) {
      const angle = Math.atan2(opp.pos.y - player.pos.y, opp.pos.x - player.pos.x);
      opp.vel.x = Math.cos(angle) * 8;
      opp.vel.y = Math.sin(angle) * 8;
      opp.state = 'down';
      opp.stateTimer = DOWN_TIME;
      if (opp.hasPuck) {
        opp.hasPuck = false;
      }
    }
  }
}

function executeCloneSave(player: Player): void {
  if (player.role !== 'goalie') return;

  const offset = player.team === 'red' ? 30 : -30;
  activeClones.push({
    playerId: player.id,
    offsetX: offset,
    timer: 4,
    pos: { x: player.pos.x + offset, y: player.pos.y },
  });
}

function updateWalls(dt: number): void {
  for (let i = activeWalls.length - 1; i >= 0; i--) {
    activeWalls[i].timer -= dt;
    if (activeWalls[i].timer <= 0) {
      activeWalls.splice(i, 1);
    }
  }
}

function updateClones(gameState: GameState, dt: number): void {
  for (let i = activeClones.length - 1; i >= 0; i--) {
    const clone = activeClones[i];
    clone.timer -= dt;

    const player = gameState.players.find(p => p.id === clone.playerId);
    if (player) {
      clone.pos.x = player.pos.x + clone.offsetX;
      clone.pos.y = player.pos.y;
    }

    if (clone.timer <= 0) {
      activeClones.splice(i, 1);
    }
  }
}

function checkPuckWallCollision(gameState: GameState): void {
  const { puck } = gameState;
  if (puck.holderId !== null) return;

  for (const wall of activeWalls) {
    const halfW = wall.width / 2;
    const halfH = wall.height / 2;

    if (
      puck.pos.x > wall.pos.x - halfW &&
      puck.pos.x < wall.pos.x + halfW &&
      puck.pos.y > wall.pos.y - halfH &&
      puck.pos.y < wall.pos.y + halfH
    ) {
      puck.vel.x = -puck.vel.x * 0.8;
      puck.vel.y = -puck.vel.y * 0.8;

      const dx = puck.pos.x - wall.pos.x;
      if (dx > 0) {
        puck.pos.x = wall.pos.x + halfW + 1;
      } else {
        puck.pos.x = wall.pos.x - halfW - 1;
      }
    }
  }
}

function checkPuckPlayerCollision(gameState: GameState): void {
  const { puck, players } = gameState;
  if (puck.state !== 'fire') return;
  if (puck.holderId !== null) return;

  for (const player of players) {
    if (player.state !== 'normal') continue;
    const d = dist(puck.pos, player.pos);
    if (d < player.bodyRadius + 6) {
      player.hitPoints -= 20;
      player.hitPoints = Math.max(0, player.hitPoints);
      player.state = 'down';
      player.stateTimer = DOWN_TIME;
      if (player.hasPuck) {
        player.hasPuck = false;
      }
      puck.state = 'normal';
      puck.stateTimer = 0;
      puck.vel.x *= 0.3;
      puck.vel.y *= 0.3;
      break;
    }
  }
}

export function getActiveWalls(): IceWall[] {
  return activeWalls;
}

export function getActiveClones(): GoalieClone[] {
  return activeClones;
}

export function resetSpecials(): void {
  activeWalls = [];
  activeClones = [];
}
