import type { Goal, Team, Vec2 } from '../game/types';
import { RINK } from '../game/types';

export function createGoals(): Goal[] {
  return [
    {
      team: 'red',
      x: RINK.boardThickness,
      y: RINK.height / 2,
      width: RINK.goalWidth,
      depth: RINK.goalDepth,
      scored: false,
      shakeTimer: 0,
    },
    {
      team: 'blue',
      x: RINK.width - RINK.boardThickness,
      y: RINK.height / 2,
      width: RINK.goalWidth,
      depth: RINK.goalDepth,
      scored: false,
      shakeTimer: 0,
    },
  ];
}

export function getFaceoffPositions(): { red: Vec2[]; blue: Vec2[] } {
  const cy = RINK.height / 2;
  return {
    red: [
      { x: 500, y: 180 },
      { x: 450, y: cy },
      { x: 400, y: 360 },
      { x: 200, y: 200 },
      { x: 200, y: 340 },
      { x: 50, y: cy },
    ],
    blue: [
      { x: 460, y: 180 },
      { x: 510, y: cy },
      { x: 560, y: 360 },
      { x: 760, y: 200 },
      { x: 760, y: 340 },
      { x: 910, y: cy },
    ],
  };
}

export function isInGoalArea(pos: Vec2, team: Team): boolean {
  const goalY = RINK.height / 2;
  const halfWidth = RINK.goalWidth / 2 + 20;
  const extraDepth = RINK.goalDepth + 20;

  if (team === 'red') {
    const goalX = RINK.boardThickness;
    return pos.x < goalX + extraDepth && Math.abs(pos.y - goalY) < halfWidth;
  }
  const goalX = RINK.width - RINK.boardThickness;
  return pos.x > goalX - extraDepth && Math.abs(pos.y - goalY) < halfWidth;
}
