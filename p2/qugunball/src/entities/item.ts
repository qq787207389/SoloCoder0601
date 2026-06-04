import type { Item, ItemType, Player, Vec2 } from '../game/types';
import { RINK, SPEED_BOOST_DURATION, LONG_STICK_DURATION, LONG_STICK_BOOST, GOALIE_STICK_LENGTH, STICK_LENGTH } from '../game/types';

export const ITEM_TYPES: ItemType[] = ['speed_skates', 'long_stick', 'freeze_ball', 'shock_ball'];

export function createItem(id: number, pos: Vec2): Item {
  return {
    id,
    type: getRandomItemType(),
    pos: { ...pos },
    collected: false,
    respawnTimer: 0,
  };
}

export function getRandomItemType(): ItemType {
  return ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
}

export function getRandomSpawnPosition(): Vec2 {
  const margin = 80;
  const goalZone = 100;
  const x = goalZone + Math.random() * (RINK.width - goalZone * 2);
  const y = margin + Math.random() * (RINK.height - margin * 2);
  return { x, y };
}

export function applyItemToPlayer(player: Player, item: Item): void {
  player.activeItem = item.type;
  switch (item.type) {
    case 'speed_skates':
      player.itemTimer = SPEED_BOOST_DURATION;
      break;
    case 'long_stick':
      player.itemTimer = LONG_STICK_DURATION;
      player.stickLength *= LONG_STICK_BOOST;
      break;
    case 'freeze_ball':
      player.itemTimer = 15;
      break;
    case 'shock_ball':
      player.itemTimer = 15;
      break;
  }
}

export function updateItemTimers(players: Player[], dt: number): void {
  for (const player of players) {
    if (player.activeItem && player.itemTimer > 0) {
      player.itemTimer -= dt;
      if (player.itemTimer <= 0) {
        removeItemEffect(player);
      }
    }
  }
}

function removeItemEffect(player: Player): void {
  if (player.activeItem === 'long_stick') {
    player.stickLength = player.role === 'goalie' ? GOALIE_STICK_LENGTH : STICK_LENGTH;
  }
  player.activeItem = null;
  player.itemTimer = 0;
}
