import type { Character } from '../types';
import { GRAVITY } from '../constants';

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function checkAABB(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function applyPhysics(
  character: Character,
  dt: number,
  groundY: number,
  platforms: Platform[] = []
): void {
  character.velocityY += GRAVITY * dt;

  character.x += character.velocityX * dt;
  character.y += character.velocityY * dt;

  checkGroundCollision(character, groundY);

  for (const platform of platforms) {
    checkPlatformCollision(character, platform);
  }
}

export function checkGroundCollision(character: Character, groundY: number): void {
  const characterBottom = character.y + character.height;

  if (characterBottom >= groundY) {
    character.y = groundY - character.height;
    character.velocityY = 0;
    character.isGrounded = true;
  } else {
    character.isGrounded = false;
  }
}

export function checkPlatformCollision(character: Character, platform: Platform): void {
  const characterBottom = character.y + character.height;
  const characterPrevBottom = characterBottom - character.velocityY;
  const platformTop = platform.y;

  if (
    character.velocityY >= 0 &&
    characterPrevBottom <= platformTop &&
    characterBottom >= platformTop &&
    character.x + character.width > platform.x &&
    character.x < platform.x + platform.width
  ) {
    character.y = platformTop - character.height;
    character.velocityY = 0;
    character.isGrounded = true;
  }
}

export function applyKnockback(
  character: Character,
  direction: number,
  force: number
): void {
  character.velocityX = direction * force;
  character.velocityY = -force * 0.5;
  character.isGrounded = false;
}

export function clampToBounds(character: Character, bounds: Bounds): void {
  character.x = Math.max(bounds.minX, Math.min(bounds.maxX - character.width, character.x));
  character.y = Math.max(bounds.minY, Math.min(bounds.maxY - character.height, character.y));

  if (character.x <= bounds.minX || character.x >= bounds.maxX - character.width) {
    character.velocityX = 0;
  }
}
