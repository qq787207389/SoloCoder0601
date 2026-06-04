import { PlayerData, SpecialType } from '../game/types';

export const RED_TEAM_PLAYERS: PlayerData[] = [
  {
    role: 'forward_speed',
    name: '闪电',
    stats: { speed: 5, power: 2, shot: 4, pass: 3 },
    special: 'fire_shot',
    colors: { body: '#FF2D2D', stripe: '#FFD700', helmet: '#CC0000' },
  },
  {
    role: 'forward_tech',
    name: '魔术师',
    stats: { speed: 4, power: 2, shot: 3, pass: 5 },
    special: 'split_shot',
    colors: { body: '#FF2D2D', stripe: '#FFFFFF', helmet: '#CC0000' },
  },
  {
    role: 'forward_power',
    name: '铁锤',
    stats: { speed: 3, power: 5, shot: 4, pass: 2 },
    special: 'curve_shot',
    colors: { body: '#FF2D2D', stripe: '#FF6600', helmet: '#CC0000' },
  },
  {
    role: 'defender_wall',
    name: '冰壁',
    stats: { speed: 3, power: 4, shot: 2, pass: 3 },
    special: 'ice_wall',
    colors: { body: '#CC1111', stripe: '#8888FF', helmet: '#990000' },
  },
  {
    role: 'defender_steal',
    name: '旋风',
    stats: { speed: 4, power: 3, shot: 3, pass: 4 },
    special: 'whirlwind_slash',
    colors: { body: '#CC1111', stripe: '#44DD44', helmet: '#990000' },
  },
  {
    role: 'goalie',
    name: '铁门',
    stats: { speed: 2, power: 4, shot: 1, pass: 2 },
    special: 'clone_save',
    colors: { body: '#AA0000', stripe: '#FFDD00', helmet: '#880000' },
  },
];

export const BLUE_TEAM_PLAYERS: PlayerData[] = [
  {
    role: 'forward_speed',
    name: '疾风',
    stats: { speed: 5, power: 2, shot: 4, pass: 3 },
    special: 'fire_shot',
    colors: { body: '#2D7BFF', stripe: '#FFD700', helmet: '#0055CC' },
  },
  {
    role: 'forward_tech',
    name: '幻影',
    stats: { speed: 4, power: 2, shot: 3, pass: 5 },
    special: 'split_shot',
    colors: { body: '#2D7BFF', stripe: '#FFFFFF', helmet: '#0055CC' },
  },
  {
    role: 'forward_power',
    name: '重炮',
    stats: { speed: 3, power: 5, shot: 4, pass: 2 },
    special: 'curve_shot',
    colors: { body: '#2D7BFF', stripe: '#FF6600', helmet: '#0055CC' },
  },
  {
    role: 'defender_wall',
    name: '磐石',
    stats: { speed: 3, power: 4, shot: 2, pass: 3 },
    special: 'ice_wall',
    colors: { body: '#1155DD', stripe: '#8888FF', helmet: '#0044AA' },
  },
  {
    role: 'defender_steal',
    name: '猎鹰',
    stats: { speed: 4, power: 3, shot: 3, pass: 4 },
    special: 'whirlwind_slash',
    colors: { body: '#1155DD', stripe: '#44DD44', helmet: '#0044AA' },
  },
  {
    role: 'goalie',
    name: '铜墙',
    stats: { speed: 2, power: 4, shot: 1, pass: 2 },
    special: 'clone_save',
    colors: { body: '#0044BB', stripe: '#FFDD00', helmet: '#003399' },
  },
];

export const SPECIAL_NAMES: Record<SpecialType, string> = {
  fire_shot: '火焰射门',
  split_shot: '分裂射门',
  curve_shot: '弧线射门',
  ice_wall: '冰墙防御',
  whirlwind_slash: '旋风铲',
  clone_save: '分身扑救',
  combo_spin: '旋风连携',
  combo_bounce: '反弹连携',
};

export const SPECIAL_DESCRIPTIONS: Record<SpecialType, string> = {
  fire_shot: '球速极快变成火球直冲球门！',
  split_shot: '球分裂为三个，守门员扑错方向！',
  curve_shot: '球在空中划出弧线绕开防守！',
  ice_wall: '滑铲形成一堵冰墙封堵射门路线！',
  whirlwind_slash: '360度旋转滑铲，把周围所有人卷开！',
  clone_save: '分身成两个同时扑向左右两侧！',
  combo_spin: '旋转传球后凌空抽射，旋风卷开所有人！',
  combo_bounce: '重炮传球撞墙反弹射门！',
};
