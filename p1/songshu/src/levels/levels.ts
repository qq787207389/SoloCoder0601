import { LevelData, EnemyType, ItemType } from '../types/game';

export const createLevels = (): LevelData[] => {
  const levels: LevelData[] = [];

  levels.push({
    id: 1,
    name: '树洞之家',
    background: 'treehouse',
    width: 1920,
    height: 540,
    platforms: [
      { x: 0, y: 480, width: 1920, height: 60, type: 'ground' },
      { x: 200, y: 380, width: 120, height: 20, type: 'platform' },
      { x: 400, y: 320, width: 150, height: 20, type: 'platform' },
      { x: 650, y: 260, width: 100, height: 20, type: 'platform' },
      { x: 850, y: 380, width: 180, height: 20, type: 'platform' },
      { x: 1100, y: 300, width: 140, height: 20, type: 'platform' },
      { x: 1350, y: 240, width: 120, height: 20, type: 'platform' },
      { x: 1550, y: 350, width: 200, height: 20, type: 'platform' },
      { x: 300, y: 480, width: 80, height: 20, type: 'platform' },
      { x: 1600, y: 160, width: 100, height: 20, type: 'platform' }
    ],
    boxes: [
      { position: { x: 100, y: 440 } },
      { position: { x: 150, y: 440 } },
      { position: { x: 500, y: 440 } },
      { position: { x: 900, y: 440 } },
      { position: { x: 1200, y: 440 } },
      { position: { x: 1400, y: 440 } }
    ],
    apples: [
      { position: { x: 350, y: 440 } },
      { position: { x: 750, y: 440 } },
      { position: { x: 1100, y: 440 } }
    ],
    enemies: [
      { type: EnemyType.SNAIL, position: { x: 450, y: 450 }, patrolRange: 80 },
      { type: EnemyType.SNAIL, position: { x: 800, y: 450 }, patrolRange: 100 },
      { type: EnemyType.BEE, position: { x: 600, y: 200 }, patrolRange: 150 },
      { type: EnemyType.SNAIL, position: { x: 1300, y: 450 }, patrolRange: 120 }
    ],
    items: [
      { type: ItemType.NUT, position: { x: 230, y: 340 } },
      { type: ItemType.FLOWER, position: { x: 680, y: 220 } },
      { type: ItemType.NUT, position: { x: 1150, y: 260 } },
      { type: ItemType.STAR, position: { x: 1630, y: 120 } },
      { type: ItemType.LIFE, position: { x: 450, y: 280 } }
    ],
    playerStartPositions: [
      { x: 50, y: 400 },
      { x: 100, y: 400 }
    ]
  });

  levels.push({
    id: 2,
    name: '花园水管',
    background: 'garden',
    width: 1920,
    height: 540,
    platforms: [
      { x: 0, y: 480, width: 400, height: 60, type: 'ground' },
      { x: 500, y: 480, width: 300, height: 60, type: 'ground' },
      { x: 900, y: 480, width: 400, height: 60, type: 'ground' },
      { x: 1400, y: 480, width: 520, height: 60, type: 'ground' },
      { x: 300, y: 380, width: 80, height: 20, type: 'platform' },
      { x: 420, y: 320, width: 80, height: 20, type: 'platform' },
      { x: 550, y: 380, width: 100, height: 20, type: 'platform' },
      { x: 750, y: 350, width: 80, height: 20, type: 'platform' },
      { x: 850, y: 280, width: 80, height: 20, type: 'platform' },
      { x: 1000, y: 350, width: 120, height: 20, type: 'platform' },
      { x: 1200, y: 280, width: 100, height: 20, type: 'platform' },
      { x: 1350, y: 200, width: 80, height: 20, type: 'platform' },
      { x: 1500, y: 350, width: 150, height: 20, type: 'platform' },
      { x: 1700, y: 280, width: 120, height: 20, type: 'platform' }
    ],
    boxes: [
      { position: { x: 100, y: 440 } },
      { position: { x: 200, y: 440 } },
      { position: { x: 550, y: 440 } },
      { position: { x: 650, y: 440 } },
      { position: { x: 950, y: 440 } },
      { position: { x: 1050, y: 440 } },
      { position: { x: 1500, y: 440 } },
      { position: { x: 1600, y: 440 } }
    ],
    apples: [
      { position: { x: 150, y: 440 } },
      { position: { x: 600, y: 440 } },
      { position: { x: 1000, y: 440 } },
      { position: { x: 1550, y: 440 } }
    ],
    enemies: [
      { type: EnemyType.SNAIL, position: { x: 200, y: 450 }, patrolRange: 100 },
      { type: EnemyType.BEE, position: { x: 500, y: 250 }, patrolRange: 200 },
      { type: EnemyType.BEE, position: { x: 900, y: 200 }, patrolRange: 150 },
      { type: EnemyType.SNAIL, position: { x: 1100, y: 450 }, patrolRange: 100 },
      { type: EnemyType.ROBOT, position: { x: 1600, y: 440 }, patrolRange: 150 }
    ],
    items: [
      { type: ItemType.NUT, position: { x: 450, y: 280 } },
      { type: ItemType.FLOWER, position: { x: 880, y: 240 } },
      { type: ItemType.NUT, position: { x: 1230, y: 240 } },
      { type: ItemType.STAR, position: { x: 1380, y: 160 } },
      { type: ItemType.LIFE, position: { x: 1730, y: 240 } },
      { type: ItemType.FLOWER, position: { x: 780, y: 310 } }
    ],
    playerStartPositions: [
      { x: 50, y: 400 },
      { x: 100, y: 400 }
    ]
  });

  levels.push({
    id: 3,
    name: '阁楼仓库',
    background: 'attic',
    width: 1920,
    height: 540,
    platforms: [
      { x: 0, y: 480, width: 300, height: 60, type: 'ground' },
      { x: 400, y: 480, width: 250, height: 60, type: 'ground' },
      { x: 750, y: 480, width: 350, height: 60, type: 'ground' },
      { x: 1200, y: 480, width: 300, height: 60, type: 'ground' },
      { x: 1600, y: 480, width: 320, height: 60, type: 'ground' },
      { x: 150, y: 380, width: 100, height: 20, type: 'platform' },
      { x: 300, y: 300, width: 80, height: 20, type: 'platform' },
      { x: 450, y: 380, width: 120, height: 20, type: 'platform' },
      { x: 600, y: 300, width: 100, height: 20, type: 'platform' },
      { x: 800, y: 380, width: 80, height: 20, type: 'platform' },
      { x: 950, y: 280, width: 120, height: 20, type: 'platform' },
      { x: 1100, y: 380, width: 80, height: 20, type: 'platform' },
      { x: 1250, y: 300, width: 100, height: 20, type: 'platform' },
      { x: 1400, y: 200, width: 120, height: 20, type: 'platform' },
      { x: 1550, y: 350, width: 100, height: 20, type: 'platform' },
      { x: 1700, y: 250, width: 120, height: 20, type: 'platform' },
      { x: 200, y: 180, width: 80, height: 20, type: 'platform' },
      { x: 500, y: 150, width: 80, height: 20, type: 'platform' },
      { x: 850, y: 150, width: 80, height: 20, type: 'platform' }
    ],
    boxes: [
      { position: { x: 50, y: 440 } },
      { position: { x: 120, y: 440 } },
      { position: { x: 450, y: 440 } },
      { position: { x: 520, y: 440 } },
      { position: { x: 800, y: 440 } },
      { position: { x: 880, y: 440 } },
      { position: { x: 960, y: 440 } },
      { position: { x: 1250, y: 440 } },
      { position: { x: 1350, y: 440 } },
      { position: { x: 1650, y: 440 } },
      { position: { x: 1750, y: 440 } }
    ],
    apples: [
      { position: { x: 100, y: 440 } },
      { position: { x: 500, y: 440 } },
      { position: { x: 850, y: 440 } },
      { position: { x: 1300, y: 440 } },
      { position: { x: 1700, y: 440 } }
    ],
    enemies: [
      { type: EnemyType.ROBOT, position: { x: 200, y: 440 }, patrolRange: 80 },
      { type: EnemyType.BEE, position: { x: 400, y: 200 }, patrolRange: 200 },
      { type: EnemyType.ROBOT, position: { x: 850, y: 440 }, patrolRange: 120 },
      { type: EnemyType.BEE, position: { x: 1000, y: 150 }, patrolRange: 250 },
      { type: EnemyType.ROBOT, position: { x: 1400, y: 440 }, patrolRange: 100 },
      { type: EnemyType.ROBOT, position: { x: 1700, y: 440 }, patrolRange: 100 },
      { type: EnemyType.SNAIL, position: { x: 1300, y: 450 }, patrolRange: 60 }
    ],
    items: [
      { type: ItemType.NUT, position: { x: 180, y: 340 } },
      { type: ItemType.NUT, position: { x: 630, y: 260 } },
      { type: ItemType.FLOWER, position: { x: 980, y: 240 } },
      { type: ItemType.STAR, position: { x: 230, y: 140 } },
      { type: ItemType.LIFE, position: { x: 530, y: 110 } },
      { type: ItemType.STAR, position: { x: 1430, y: 160 } },
      { type: ItemType.FLOWER, position: { x: 880, y: 110 } },
      { type: ItemType.LIFE, position: { x: 1730, y: 210 } }
    ],
    playerStartPositions: [
      { x: 50, y: 400 },
      { x: 100, y: 400 }
    ]
  });

  return levels;
};
