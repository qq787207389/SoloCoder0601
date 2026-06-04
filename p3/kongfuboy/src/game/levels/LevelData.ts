import { BossType, EnemyType, ItemType } from '../types';
import { GROUND_Y } from '../constants';
import type { LevelData, BackgroundElement } from './Level';

function createBackgroundElements(
  type: string,
  count: number,
  startX: number,
  endX: number,
  y: number,
  width: number,
  height: number,
  randomY = false
): BackgroundElement[] {
  const elements: BackgroundElement[] = [];
  const step = (endX - startX) / count;

  for (let i = 0; i < count; i++) {
    const x = startX + step * i + Math.random() * step * 0.3;
    const actualY = randomY ? y + Math.random() * 50 - 25 : y;
    const actualWidth = width + Math.random() * width * 0.3;
    const actualHeight = height + Math.random() * height * 0.3;

    elements.push({
      x,
      y: actualY,
      width: actualWidth,
      height: actualHeight,
      type
    });
  }

  return elements;
}

const LEVEL_WIDTH = 3000;

export const LEVEL1: LevelData = {
  id: 1,
  name: '少林寺塔林',
  description: '可踢倒石柱砸敌人',
  backgroundColor: '#87CEEB',
  width: LEVEL_WIDTH,
  backgroundLayers: [
    {
      type: 'mountains',
      color: '#6B8E7D',
      scrollSpeed: 0.1,
      elements: createBackgroundElements('mountain', 8, 0, LEVEL_WIDTH, 150, 300, 250)
    },
    {
      type: 'decorations',
      color: '#5D4037',
      scrollSpeed: 0.3,
      elements: [
        ...createBackgroundElements('pagoda', 4, 200, LEVEL_WIDTH - 200, 250, 120, 200),
        ...createBackgroundElements('tree', 10, 100, LEVEL_WIDTH - 100, 350, 80, 150, true)
      ]
    }
  ],
  platforms: [
    { x: 400, y: 450, width: 200, height: 30, type: 'normal' },
    { x: 800, y: 400, width: 180, height: 30, type: 'normal' },
    { x: 1200, y: 500, width: 250, height: 30, type: 'normal' },
    { x: 1800, y: 420, width: 200, height: 30, type: 'normal' },
    { x: 2400, y: 480, width: 220, height: 30, type: 'normal' }
  ],
  waves: [
    {
      delay: 1000,
      enemies: [
        { x: 600, y: GROUND_Y - 90, type: EnemyType.NORMAL }
      ]
    },
    {
      delay: 3000,
      enemies: [
        { x: 900, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 1000, y: GROUND_Y - 90, type: EnemyType.NORMAL }
      ]
    },
    {
      delay: 3000,
      enemies: [
        { x: 1300, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 1400, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 3000,
      enemies: [
        { x: 1800, y: GROUND_Y - 90, type: EnemyType.BRUISER }
      ]
    }
  ],
  interactables: [
    { x: 550, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 950, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 1400, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 800, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 1700, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' }
  ],
  boss: {
    type: BossType.SHAOLIN_MONK,
    x: 2700,
    y: GROUND_Y - 130,
    intro: {
      name: '少林武僧',
      line: '阿弥陀佛，施主请赐教！'
    }
  },
  itemDrops: [
    { x: 0, y: 0, type: ItemType.MANTOU, chance: 0.4 },
    { x: 0, y: 0, type: ItemType.TEA, chance: 0.3 },
    { x: 0, y: 0, type: ItemType.COIN, chance: 0.6 }
  ],
  mechanics: [
    {
      type: 'destructible_objects',
      active: true,
      value: 1
    }
  ]
};

export const LEVEL2: LevelData = {
  id: 2,
  name: '竹林深处',
  description: '砍断竹子形成障碍',
  backgroundColor: '#90EE90',
  width: LEVEL_WIDTH,
  backgroundLayers: [
    {
      type: 'mountains',
      color: '#4A6741',
      scrollSpeed: 0.1,
      elements: createBackgroundElements('mountain', 6, 0, LEVEL_WIDTH, 200, 350, 200)
    },
    {
      type: 'trees',
      color: '#2E7D32',
      scrollSpeed: 0.4,
      elements: [
        ...createBackgroundElements('tree', 15, 50, LEVEL_WIDTH - 50, 280, 60, 250, true),
        ...createBackgroundElements('tree', 20, 0, LEVEL_WIDTH, 320, 40, 180, true)
      ]
    },
    {
      type: 'decorations',
      color: '#388E3C',
      scrollSpeed: 0.6,
      elements: createBackgroundElements('tree', 25, 0, LEVEL_WIDTH, 380, 30, 120, true)
    }
  ],
  platforms: [
    { x: 300, y: 430, width: 180, height: 30, type: 'normal' },
    { x: 700, y: 470, width: 200, height: 30, type: 'normal' },
    { x: 1100, y: 410, width: 150, height: 30, type: 'normal' },
    { x: 1500, y: 460, width: 220, height: 30, type: 'normal' },
    { x: 2000, y: 440, width: 180, height: 30, type: 'normal' },
    { x: 2500, y: 490, width: 200, height: 30, type: 'normal' }
  ],
  waves: [
    {
      delay: 1000,
      enemies: [
        { x: 450, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 550, y: GROUND_Y - 90, type: EnemyType.NORMAL }
      ]
    },
    {
      delay: 2000,
      enemies: [
        { x: 800, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 900, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 1000, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 2000,
      enemies: [
        { x: 1300, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 1450, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 1600, y: GROUND_Y - 90, type: EnemyType.NORMAL }
      ]
    },
    {
      delay: 2500,
      enemies: [
        { x: 2000, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 2100, y: GROUND_Y - 90, type: EnemyType.BRUISER }
      ]
    }
  ],
  interactables: [
    { x: 400, y: GROUND_Y - 200, width: 30, height: 200, type: 'bamboo', health: 60, maxHealth: 60, isDestroyed: false, effect: 'barrier' },
    { x: 650, y: GROUND_Y - 200, width: 30, height: 200, type: 'bamboo', health: 60, maxHealth: 60, isDestroyed: false, effect: 'barrier' },
    { x: 900, y: GROUND_Y - 200, width: 30, height: 200, type: 'bamboo', health: 60, maxHealth: 60, isDestroyed: false, effect: 'barrier' },
    { x: 1200, y: GROUND_Y - 200, width: 30, height: 200, type: 'bamboo', health: 60, maxHealth: 60, isDestroyed: false, effect: 'barrier' },
    { x: 1700, y: GROUND_Y - 200, width: 30, height: 200, type: 'bamboo', health: 60, maxHealth: 60, isDestroyed: false, effect: 'barrier' },
    { x: 2200, y: GROUND_Y - 200, width: 30, height: 200, type: 'bamboo', health: 60, maxHealth: 60, isDestroyed: false, effect: 'barrier' },
    { x: 1000, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 1900, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' }
  ],
  boss: {
    type: BossType.EMEI_NUN,
    x: 2750,
    y: GROUND_Y - 130,
    intro: {
      name: '峨眉师太',
      line: '小小顽童，也敢闯我竹林！'
    }
  },
  itemDrops: [
    { x: 0, y: 0, type: ItemType.MANTOU, chance: 0.35 },
    { x: 0, y: 0, type: ItemType.TEA, chance: 0.4 },
    { x: 0, y: 0, type: ItemType.COIN, chance: 0.65 }
  ],
  mechanics: [
    {
      type: 'destructible_objects',
      active: true,
      value: 1
    }
  ]
};

export const LEVEL3: LevelData = {
  id: 3,
  name: '瀑布山崖',
  description: '湿滑地面滑步变长',
  backgroundColor: '#B0E0E6',
  width: LEVEL_WIDTH,
  backgroundLayers: [
    {
      type: 'mountains',
      color: '#455A64',
      scrollSpeed: 0.1,
      elements: createBackgroundElements('mountain', 7, 0, LEVEL_WIDTH, 100, 400, 350)
    },
    {
      type: 'decorations',
      color: '#607D8B',
      scrollSpeed: 0.3,
      elements: createBackgroundElements('mountain', 5, 100, LEVEL_WIDTH - 100, 250, 250, 200)
    },
    {
      type: 'trees',
      color: '#37474F',
      scrollSpeed: 0.5,
      elements: createBackgroundElements('tree', 8, 50, LEVEL_WIDTH - 50, 350, 70, 150, true)
    }
  ],
  platforms: [
    { x: 350, y: 440, width: 200, height: 30, type: 'slippery' },
    { x: 750, y: 420, width: 180, height: 30, type: 'slippery' },
    { x: 1150, y: 460, width: 220, height: 30, type: 'slippery' },
    { x: 1650, y: 430, width: 200, height: 30, type: 'slippery' },
    { x: 2150, y: 470, width: 180, height: 30, type: 'slippery' },
    { x: 2550, y: 450, width: 200, height: 30, type: 'normal' }
  ],
  waves: [
    {
      delay: 1000,
      enemies: [
        { x: 500, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 600, y: GROUND_Y - 90, type: EnemyType.NORMAL }
      ]
    },
    {
      delay: 2000,
      enemies: [
        { x: 850, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 950, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 2000,
      enemies: [
        { x: 1300, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 1400, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 1500, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 2500,
      enemies: [
        { x: 1800, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 1950, y: GROUND_Y - 90, type: EnemyType.BRUISER }
      ]
    }
  ],
  interactables: [
    { x: 600, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 1100, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 1700, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 2300, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' }
  ],
  boss: {
    type: BossType.MONGOL_WRESTLER,
    x: 2750,
    y: GROUND_Y - 130,
    intro: {
      name: '蒙古摔跤手',
      line: '哈哈哈！来和我摔一跤！'
    }
  },
  itemDrops: [
    { x: 0, y: 0, type: ItemType.MANTOU, chance: 0.45 },
    { x: 0, y: 0, type: ItemType.TEA, chance: 0.35 },
    { x: 0, y: 0, type: ItemType.COIN, chance: 0.55 }
  ],
  mechanics: [
    {
      type: 'wet_ground',
      active: true,
      value: 1.5
    }
  ]
};

export const LEVEL4: LevelData = {
  id: 4,
  name: '暗夜庭院',
  description: '忍者Boss',
  backgroundColor: '#1A237E',
  width: LEVEL_WIDTH,
  backgroundLayers: [
    {
      type: 'mountains',
      color: '#0D1B4C',
      scrollSpeed: 0.1,
      elements: createBackgroundElements('mountain', 6, 0, LEVEL_WIDTH, 180, 350, 280)
    },
    {
      type: 'decorations',
      color: '#1A237E',
      scrollSpeed: 0.3,
      elements: [
        ...createBackgroundElements('pagoda', 3, 300, LEVEL_WIDTH - 300, 280, 100, 180),
        ...createBackgroundElements('tree', 8, 100, LEVEL_WIDTH - 100, 350, 60, 150, true)
      ]
    }
  ],
  platforms: [
    { x: 400, y: 430, width: 180, height: 30, type: 'normal' },
    { x: 800, y: 480, width: 200, height: 30, type: 'normal' },
    { x: 1200, y: 410, width: 160, height: 30, type: 'normal' },
    { x: 1700, y: 450, width: 220, height: 30, type: 'normal' },
    { x: 2200, y: 420, width: 200, height: 30, type: 'normal' },
    { x: 2600, y: 470, width: 180, height: 30, type: 'normal' }
  ],
  waves: [
    {
      delay: 1500,
      enemies: [
        { x: 500, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 650, y: GROUND_Y - 90, type: EnemyType.NORMAL }
      ]
    },
    {
      delay: 2000,
      enemies: [
        { x: 900, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 1000, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 1100, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 2500,
      enemies: [
        { x: 1400, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 1550, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 2500,
      enemies: [
        { x: 1900, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 2000, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 2100, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    }
  ],
  interactables: [
    { x: 550, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 1000, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 1500, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 2000, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 2400, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' }
  ],
  boss: {
    type: BossType.NINJA,
    x: 2750,
    y: GROUND_Y - 130,
    intro: {
      name: '暗影忍者',
      line: '...你能看见我吗？'
    }
  },
  itemDrops: [
    { x: 0, y: 0, type: ItemType.MANTOU, chance: 0.4 },
    { x: 0, y: 0, type: ItemType.TEA, chance: 0.35 },
    { x: 0, y: 0, type: ItemType.COIN, chance: 0.6 }
  ],
  mechanics: [
    {
      type: 'destructible_objects',
      active: true,
      value: 1
    }
  ]
};

export const LEVEL5: LevelData = {
  id: 5,
  name: '道观密室',
  description: '老拳师Boss',
  backgroundColor: '#4A148C',
  width: LEVEL_WIDTH,
  backgroundLayers: [
    {
      type: 'mountains',
      color: '#311B92',
      scrollSpeed: 0.1,
      elements: createBackgroundElements('mountain', 5, 0, LEVEL_WIDTH, 150, 380, 300)
    },
    {
      type: 'decorations',
      color: '#4527A0',
      scrollSpeed: 0.3,
      elements: [
        ...createBackgroundElements('pagoda', 4, 200, LEVEL_WIDTH - 200, 250, 130, 220),
        ...createBackgroundElements('tree', 6, 100, LEVEL_WIDTH - 100, 360, 70, 140, true)
      ]
    }
  ],
  platforms: [
    { x: 300, y: 450, width: 200, height: 30, type: 'normal' },
    { x: 650, y: 420, width: 180, height: 30, type: 'normal' },
    { x: 1000, y: 470, width: 220, height: 30, type: 'normal' },
    { x: 1450, y: 440, width: 200, height: 30, type: 'normal' },
    { x: 1900, y: 460, width: 180, height: 30, type: 'normal' },
    { x: 2350, y: 430, width: 220, height: 30, type: 'normal' }
  ],
  waves: [
    {
      delay: 1500,
      enemies: [
        { x: 450, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 550, y: GROUND_Y - 90, type: EnemyType.NORMAL }
      ]
    },
    {
      delay: 2500,
      enemies: [
        { x: 800, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 900, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 1000, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 2500,
      enemies: [
        { x: 1300, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 1400, y: GROUND_Y - 90, type: EnemyType.NORMAL },
        { x: 1500, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 1600, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 3000,
      enemies: [
        { x: 2000, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 2100, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 2200, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    }
  ],
  interactables: [
    { x: 400, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 850, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 1300, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 1750, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 2200, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 600, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 1500, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 2400, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' }
  ],
  boss: {
    type: BossType.OLD_MASTER,
    x: 2700,
    y: GROUND_Y - 130,
    intro: {
      name: '世外高人',
      line: '年轻人，让我看看你的修行成果！'
    }
  },
  itemDrops: [
    { x: 0, y: 0, type: ItemType.MANTOU, chance: 0.5 },
    { x: 0, y: 0, type: ItemType.TEA, chance: 0.45 },
    { x: 0, y: 0, type: ItemType.COIN, chance: 0.7 }
  ],
  mechanics: [
    {
      type: 'destructible_objects',
      active: true,
      value: 1
    }
  ]
};

export const LEVEL6: LevelData = {
  id: 6,
  name: '金銮大殿',
  description: '最终Boss师兄',
  backgroundColor: '#B71C1C',
  width: LEVEL_WIDTH,
  backgroundLayers: [
    {
      type: 'mountains',
      color: '#880E4F',
      scrollSpeed: 0.1,
      elements: createBackgroundElements('mountain', 4, 0, LEVEL_WIDTH, 120, 450, 330)
    },
    {
      type: 'decorations',
      color: '#D4AF37',
      scrollSpeed: 0.3,
      elements: [
        ...createBackgroundElements('pagoda', 5, 100, LEVEL_WIDTH - 100, 200, 150, 280),
        ...createBackgroundElements('lantern', 10, 50, LEVEL_WIDTH - 50, 150, 25, 40, true)
      ]
    }
  ],
  platforms: [
    { x: 250, y: 440, width: 220, height: 30, type: 'normal' },
    { x: 600, y: 470, width: 200, height: 30, type: 'normal' },
    { x: 950, y: 420, width: 180, height: 30, type: 'normal' },
    { x: 1300, y: 460, width: 220, height: 30, type: 'normal' },
    { x: 1700, y: 430, width: 200, height: 30, type: 'normal' },
    { x: 2050, y: 450, width: 220, height: 30, type: 'normal' },
    { x: 2450, y: 470, width: 200, height: 30, type: 'normal' }
  ],
  waves: [
    {
      delay: 2000,
      enemies: [
        { x: 400, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 500, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 600, y: GROUND_Y - 90, type: EnemyType.BRUISER }
      ]
    },
    {
      delay: 3000,
      enemies: [
        { x: 800, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 900, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 1000, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 1100, y: GROUND_Y - 90, type: EnemyType.NORMAL }
      ]
    },
    {
      delay: 3000,
      enemies: [
        { x: 1400, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 1500, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 1600, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 1700, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    },
    {
      delay: 3500,
      enemies: [
        { x: 1900, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 2000, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 2100, y: GROUND_Y - 90, type: EnemyType.BRUISER }
      ]
    },
    {
      delay: 3500,
      enemies: [
        { x: 2300, y: GROUND_Y - 90, type: EnemyType.ARCHER },
        { x: 2400, y: GROUND_Y - 90, type: EnemyType.BRUISER },
        { x: 2500, y: GROUND_Y - 90, type: EnemyType.ARCHER }
      ]
    }
  ],
  interactables: [
    { x: 450, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 850, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 1250, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 1650, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 2100, y: GROUND_Y - 120, width: 50, height: 120, type: 'pillar', health: 100, maxHealth: 100, isDestroyed: false, effect: 'damage' },
    { x: 700, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 1400, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 1900, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' },
    { x: 2350, y: GROUND_Y - 100, width: 30, height: 50, type: 'lantern', health: 30, maxHealth: 30, isDestroyed: false, effect: 'item_drop' }
  ],
  boss: {
    type: BossType.SENIOR_BROTHER,
    x: 2700,
    y: GROUND_Y - 130,
    intro: {
      name: '大师兄',
      line: '师弟，你终于来了。今日我们便一决高下！'
    }
  },
  itemDrops: [
    { x: 0, y: 0, type: ItemType.MANTOU, chance: 0.55 },
    { x: 0, y: 0, type: ItemType.TEA, chance: 0.5 },
    { x: 0, y: 0, type: ItemType.COIN, chance: 0.75 }
  ],
  mechanics: [
    {
      type: 'destructible_objects',
      active: true,
      value: 1
    }
  ]
};

export const LEVELS: LevelData[] = [LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5, LEVEL6];
