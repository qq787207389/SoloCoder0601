import type { Player, PlayerData, Team, Vec2 } from '../game/types';
import { STICK_LENGTH, GOALIE_STICK_LENGTH, PLAYER_RADIUS, MAX_SPECIAL_CHARGE } from '../game/types';

export function createPlayer(id: number, team: Team, data: PlayerData, startPos: Vec2): Player {
  return {
    id,
    team,
    role: data.role,
    name: data.name,
    pos: { ...startPos },
    vel: { x: 0, y: 0 },
    angle: 0,
    stats: { ...data.stats },
    state: 'normal',
    stateTimer: 0,
    special: data.special,
    specialCharge: 0,
    maxSpecialCharge: MAX_SPECIAL_CHARGE,
    hasPuck: false,
    stickAngle: 0,
    stickLength: data.role === 'goalie' ? GOALIE_STICK_LENGTH : STICK_LENGTH,
    bodyRadius: PLAYER_RADIUS,
    colors: { ...data.colors },
    hitPoints: 100,
    maxHitPoints: 100,
    itemTimer: 0,
    activeItem: null,
    goals: 0,
    assists: 0,
    fightTarget: null,
    isControlled: false,
    trailPositions: [],
  };
}

export function resetPlayerPosition(player: Player, team: Team, index: number): void {
  const positions = getFormationPositions(team);
  const pos = positions[index];
  if (pos) {
    player.pos = { ...pos };
  }
  player.vel = { x: 0, y: 0 };
  player.angle = team === 'red' ? 0 : Math.PI;
  player.state = 'normal';
  player.stateTimer = 0;
  player.hasPuck = false;
  player.trailPositions = [];
}

function getFormationPositions(team: Team): Vec2[] {
  const cy = 270;
  if (team === 'red') {
    return [
      { x: 500, y: 180 },
      { x: 450, y: cy },
      { x: 400, y: 360 },
      { x: 200, y: 200 },
      { x: 200, y: 340 },
      { x: 50, y: cy },
    ];
  }
  return [
    { x: 460, y: 180 },
    { x: 510, y: cy },
    { x: 560, y: 360 },
    { x: 760, y: 200 },
    { x: 760, y: 340 },
    { x: 910, y: cy },
  ];
}
