import type { GameState, Player, Vec2 } from '../game/types';
import { ITEM_SPAWN_INTERVAL, MAX_ITEMS, ITEM_RADIUS, FROZEN_TIME, PARALYZE_TIME } from '../game/types';
import { createItem, getRandomSpawnPosition, applyItemToPlayer, updateItemTimers } from '../entities/item';

let spawnTimer = ITEM_SPAWN_INTERVAL;
let nextItemId = 0;

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function updateItems(gameState: GameState, dt: number): void {
  const { players, items, puck } = gameState;

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTimer = ITEM_SPAWN_INTERVAL;
    const activeItems = items.filter(i => !i.collected);
    if (activeItems.length < MAX_ITEMS) {
      const pos = getRandomSpawnPosition();
      items.push(createItem(nextItemId++, pos));
    }
  }

  for (const item of items) {
    if (item.collected) continue;

    for (const player of players) {
      if (player.state !== 'normal') continue;
      const d = dist(player.pos, item.pos);
      if (d < player.bodyRadius + ITEM_RADIUS) {
        item.collected = true;
        applyItemToPlayer(player, item);
        break;
      }
    }
  }

  for (const player of players) {
    if (player.hasPuck && player.activeItem && (player.activeItem === 'freeze_ball' || player.activeItem === 'shock_ball')) {
      if (puck.holderId === null) {
        applyProjectileEffect(player, gameState);
      }
    }
  }

  updateItemTimers(players, dt);

  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].collected) {
      items[i].respawnTimer -= dt;
      if (items[i].respawnTimer <= 0) {
        items.splice(i, 1);
      }
    }
  }
}

function applyProjectileEffect(shooter: Player, gameState: GameState): void {
  const { puck, players } = gameState;
  if (puck.holderId !== null) return;

  for (const player of players) {
    if (player.team === shooter.team || player.state !== 'normal') continue;
    const d = dist(puck.pos, player.pos);
    if (d < player.bodyRadius + 6) {
      if (shooter.activeItem === 'freeze_ball') {
        player.state = 'frozen';
        player.stateTimer = FROZEN_TIME;
      } else if (shooter.activeItem === 'shock_ball') {
        player.state = 'paralyzed';
        player.stateTimer = PARALYZE_TIME;
      }
      if (player.hasPuck) {
        player.hasPuck = false;
      }
      shooter.activeItem = null;
      shooter.itemTimer = 0;
      break;
    }
  }
}

export function resetItemSystem(): void {
  spawnTimer = ITEM_SPAWN_INTERVAL;
  nextItemId = 0;
}
