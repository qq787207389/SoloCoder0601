import { Box, Apple, Vector2 } from '../types/game';
import { BOX_SIZE, APPLE_SIZE, GAME_CONFIG } from '../config/constants';
import { Platform } from '../types/game';

let boxIdCounter = 0;
let appleIdCounter = 0;

function resolveEntityXCollision(
  entity: { position: Vector2; velocity: Vector2; width: number; height: number },
  platform: Platform
): void {
  if (!(entity.position.x < platform.x + platform.width &&
    entity.position.x + entity.width > platform.x &&
    entity.position.y < platform.y + platform.height &&
    entity.position.y + entity.height > platform.y)) {
    return;
  }
  if (entity.velocity.x > 0) {
    entity.position.x = platform.x - entity.width;
  } else if (entity.velocity.x < 0) {
    entity.position.x = platform.x + platform.width;
  }
  entity.velocity.x = 0;
}

function resolveEntityYCollision(
  entity: { position: Vector2; velocity: Vector2; width: number; height: number },
  platform: Platform
): 'top' | 'bottom' | null {
  if (!(entity.position.x < platform.x + platform.width &&
    entity.position.x + entity.width > platform.x &&
    entity.position.y < platform.y + platform.height &&
    entity.position.y + entity.height > platform.y)) {
    return null;
  }

  const overlapTop = (entity.position.y + entity.height) - platform.y;
  const overlapBottom = (platform.y + platform.height) - entity.position.y;

  if (overlapTop < overlapBottom) {
    entity.position.y = platform.y - entity.height;
    entity.velocity.y = 0;
    return 'top';
  } else {
    entity.position.y = platform.y + platform.height;
    entity.velocity.y = 0;
    return 'bottom';
  }
}

export class BoxEntity implements Box {
  id: string;
  type: 'box';
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  isActive: boolean;
  isCarried: boolean;
  carrierId: string | null;
  isThrown: boolean;
  throwVelocity: Vector2;
  throwGraceTimer: number;

  constructor(position: Vector2) {
    this.id = `box_${boxIdCounter++}`;
    this.type = 'box';
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.width = BOX_SIZE;
    this.height = BOX_SIZE;
    this.isActive = true;
    this.isCarried = false;
    this.carrierId = null;
    this.isThrown = false;
    this.throwVelocity = { x: 0, y: 0 };
    this.throwGraceTimer = 0;
  }

  update(platforms: Platform[], _deltaTime: number): void {
    if (this.isCarried) return;

    if (this.throwGraceTimer > 0) {
      this.throwGraceTimer -= 16;
    }

    this.applyGravity();

    if (this.isThrown) {
      this.position.x += this.velocity.x;
      for (const platform of platforms) {
        resolveEntityXCollision(this, platform);
      }

      this.position.y += this.velocity.y;
      
      if (this.throwGraceTimer <= 0) {
        for (const platform of platforms) {
          const side = resolveEntityYCollision(this, platform);
          if (side === 'top') {
            this.isThrown = false;
            this.velocity = { x: 0, y: 0 };
          }
        }
      }

      this.velocity.x *= 0.98;
    } else {
      this.position.y += this.velocity.y;
      for (const platform of platforms) {
        resolveEntityYCollision(this, platform);
      }
    }
  }

  private applyGravity(): void {
    this.velocity.y += GAME_CONFIG.gravity;
    this.velocity.y = Math.min(this.velocity.y, 15);
  }

  resetThrow(): void {
    this.isThrown = false;
    this.velocity = { x: 0, y: 0 };
  }
}

export class AppleEntity implements Apple {
  id: string;
  type: 'apple';
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  isActive: boolean;
  isCarried: boolean;
  carrierId: string | null;
  isThrown: boolean;
  throwVelocity: Vector2;
  bobOffset: number;
  throwGraceTimer: number;

  constructor(position: Vector2) {
    this.id = `apple_${appleIdCounter++}`;
    this.type = 'apple';
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.width = APPLE_SIZE;
    this.height = APPLE_SIZE;
    this.isActive = true;
    this.isCarried = false;
    this.carrierId = null;
    this.isThrown = false;
    this.throwVelocity = { x: 0, y: 0 };
    this.bobOffset = Math.random() * Math.PI * 2;
    this.throwGraceTimer = 0;
  }

  update(platforms: Platform[], _deltaTime: number): void {
    if (this.isCarried) return;

    if (this.throwGraceTimer > 0) {
      this.throwGraceTimer -= 16;
    }

    this.applyGravity();

    if (this.isThrown) {
      this.position.x += this.velocity.x;
      for (const platform of platforms) {
        resolveEntityXCollision(this, platform);
      }

      this.position.y += this.velocity.y;
      
      if (this.throwGraceTimer <= 0) {
        for (const platform of platforms) {
          const side = resolveEntityYCollision(this, platform);
          if (side === 'top') {
            this.isThrown = false;
            this.velocity = { x: 0, y: 0 };
          }
        }
      }

      this.velocity.x *= 0.95;
    } else {
      this.position.y += this.velocity.y;
      for (const platform of platforms) {
        resolveEntityYCollision(this, platform);
      }
    }
  }

  private applyGravity(): void {
    this.velocity.y += GAME_CONFIG.gravity;
    this.velocity.y = Math.min(this.velocity.y, 15);
  }

  resetThrow(): void {
    this.isThrown = false;
    this.velocity = { x: 0, y: 0 };
  }
}
