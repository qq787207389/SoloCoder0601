import { LevelConfig } from '@/types/game';

export const BRICK_COLORS = [
  '#FF6B6B',
  '#FFA94D',
  '#FFD43B',
  '#69DB7C',
  '#339AF0',
  '#9775FA',
];

export const POWER_UP_COLORS: Record<string, string> = {
  expand: '#339AF0',
  shrink: '#FF6B6B',
  slow: '#69DB7C',
  pierce: '#FFD43B',
  life: '#9775FA',
};

export const POWER_UP_NAMES: Record<string, string> = {
  expand: '变长',
  shrink: '变短',
  slow: '减速',
  pierce: '穿透',
  life: '加命',
};

const generateLayout = (rows: number, cols: number, pattern: number): number[][] => {
  const layout: number[][] = [];
  
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (pattern === 1) {
        row.push(Math.random() > 0.3 ? 1 : 0);
      } else if (pattern === 2) {
        row.push((r + c) % 3 === 0 ? 2 : (Math.random() > 0.2 ? 1 : 0));
      } else if (pattern === 3) {
        if (c === 0 || c === cols - 1 || r === rows - 1) {
          row.push(Math.random() > 0.5 ? 2 : 1);
        } else if (r === 0 && (c === Math.floor(cols / 2) - 1 || c === Math.floor(cols / 2))) {
          row.push(3);
        } else {
          row.push(Math.random() > 0.4 ? 1 : 0);
        }
      } else if (pattern === 4) {
        const center = Math.floor(cols / 2);
        if (Math.abs(c - center) <= rows - r) {
          row.push(r < 2 ? (Math.random() > 0.7 ? 2 : 1) : 1);
        } else {
          row.push(0);
        }
      } else {
        row.push(c < r || c >= cols - r ? 0 : (r < 2 && c > 2 && c < cols - 3 ? 2 : 1));
      }
    }
    layout.push(row);
  }
  return layout;
};

export const LEVELS: LevelConfig[] = [
  {
    rows: 4,
    cols: 10,
    brickLayout: generateLayout(4, 10, 1),
    ballSpeed: 3,
    powerUpChance: 0.2,
  },
  {
    rows: 5,
    cols: 11,
    brickLayout: generateLayout(5, 11, 2),
    ballSpeed: 3.5,
    powerUpChance: 0.25,
  },
  {
    rows: 5,
    cols: 12,
    brickLayout: generateLayout(5, 12, 3),
    ballSpeed: 4,
    powerUpChance: 0.3,
  },
  {
    rows: 6,
    cols: 12,
    brickLayout: generateLayout(6, 12, 4),
    ballSpeed: 4.5,
    powerUpChance: 0.3,
  },
  {
    rows: 7,
    cols: 13,
    brickLayout: generateLayout(7, 13, 5),
    ballSpeed: 5,
    powerUpChance: 0.35,
  },
];

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const BRICK_PADDING = 4;
export const BRICK_OFFSET_TOP = 60;
export const BRICK_OFFSET_LEFT = 35;
