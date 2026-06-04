import { Rect, Vector2 } from '../types/game';

export function checkCollision(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getEntityRect(entity: { position: Vector2; width: number; height: number }): Rect {
  return {
    x: entity.position.x,
    y: entity.position.y,
    width: entity.width,
    height: entity.height
  };
}

export function checkEntityCollision(
  a: { position: Vector2; width: number; height: number },
  b: { position: Vector2; width: number; height: number }
): boolean {
  return checkCollision(getEntityRect(a), getEntityRect(b));
}

export function getCollisionSide(
  entity: { position: Vector2; width: number; height: number; velocity: Vector2 },
  platform: Rect
): 'top' | 'bottom' | 'left' | 'right' | null {
  const entityRect = getEntityRect(entity);
  
  if (!checkCollision(entityRect, platform)) {
    return null;
  }

  const overlapLeft = (entityRect.x + entityRect.width) - platform.x;
  const overlapRight = (platform.x + platform.width) - entityRect.x;
  const overlapTop = (entityRect.y + entityRect.height) - platform.y;
  const overlapBottom = (platform.y + platform.height) - entityRect.y;

  const minOverlapX = Math.min(overlapLeft, overlapRight);
  const minOverlapY = Math.min(overlapTop, overlapBottom);

  if (minOverlapY < minOverlapX) {
    if (overlapTop < overlapBottom && entity.velocity.y > 0) {
      return 'top';
    } else if (entity.velocity.y < 0) {
      return 'bottom';
    }
  } else {
    if (overlapLeft < overlapRight && entity.velocity.x > 0) {
      return 'left';
    } else if (entity.velocity.x < 0) {
      return 'right';
    }
  }

  return null;
}

export function resolveCollision(
  entity: { position: Vector2; velocity: Vector2; width: number; height: number },
  platform: Rect
): 'top' | 'bottom' | 'left' | 'right' | null {
  const side = getCollisionSide(entity, platform);
  
  if (!side) return null;

  const entityRect = getEntityRect(entity);

  switch (side) {
    case 'top':
      entity.position.y = platform.y - entityRect.height;
      entity.velocity.y = 0;
      break;
    case 'bottom':
      entity.position.y = platform.y + platform.height;
      entity.velocity.y = 0;
      break;
    case 'left':
      entity.position.x = platform.x - entityRect.width;
      entity.velocity.x = 0;
      break;
    case 'right':
      entity.position.x = platform.x + platform.width;
      entity.velocity.x = 0;
      break;
  }

  return side;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
