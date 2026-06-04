import type { MoveData, MoveType } from './types';

export const GRAVITY = 0.8;
export const MOVE_SPEED = 5;
export const JUMP_FORCE = -15;
export const GROUND_Y = 600;

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const MOVES: Record<MoveType, MoveData> = {
  PUNCH: {
    damage: 10,
    startup: 5,
    active: 8,
    recovery: 10,
    knockback: 5,
    kiGain: 5
  },
  KICK: {
    damage: 15,
    startup: 8,
    active: 10,
    recovery: 15,
    knockback: 10,
    kiGain: 8
  },
  DASH_PUNCH: {
    damage: 20,
    startup: 10,
    active: 6,
    recovery: 20,
    knockback: 15,
    kiGain: 10
  },
  UPPERCUT: {
    damage: 25,
    startup: 12,
    active: 8,
    recovery: 25,
    knockback: 12,
    kiGain: 12
  },
  SWEEP: {
    damage: 18,
    startup: 15,
    active: 10,
    recovery: 20,
    knockback: 20,
    kiGain: 10
  },
  FLYING_KICK: {
    damage: 30,
    startup: 20,
    active: 12,
    recovery: 30,
    knockback: 25,
    kiGain: 15
  },
  ULTIMATE_COMBO: {
    damage: 50,
    startup: 30,
    active: 60,
    recovery: 40,
    knockback: 30,
    kiCost: 100
  },
  QI_WAVE: {
    damage: 35,
    startup: 25,
    active: 20,
    recovery: 35,
    knockback: 40,
    kiCost: 50
  }
};

export const COLORS = {
  CHINA_RED: '#C41E3A',
  INK_BLACK: '#1A1A1A',
  ANCIENT_GOLD: '#D4AF37',
  UI_BG: '#2D2D2D',
  UI_BORDER: '#D4AF37',
  HEALTH_BG: '#4A0E0E',
  HEALTH_FILL: '#C41E3A',
  KI_BG: '#0E2A4A',
  KI_FILL: '#4A90D9',
  TEXT_PRIMARY: '#F5F5DC',
  TEXT_SECONDARY: '#A0A0A0',
  HIGHLIGHT: '#FFD700',
  SHADOW: 'rgba(0, 0, 0, 0.7)'
} as const;

export const LEVEL_NAMES = [
  '第一关：少室山脚',
  '第二关：竹林深处',
  '第三关：古刹门前',
  '第四关：藏经阁',
  '第五关：达摩院',
  '第六关：大雄宝殿',
  '第七关：思过崖',
  '第八关：华山之巅',
  '第九关：紫禁之巅',
  '第十关：武道巅峰'
];

export const BOSS_NAMES = [
  '少林武僧',
  '峨眉师太',
  '蒙古摔跤手',
  '暗影忍者',
  '世外高人',
  '大师兄'
];
