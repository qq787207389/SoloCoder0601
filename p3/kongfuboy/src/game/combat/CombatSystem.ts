import type { Character, MoveData } from '../types';
import { CharacterState } from '../types';

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AttackType = 'PUNCH' | 'KICK' | 'SPECIAL' | 'THROW';

export interface CombatCharacter extends Character {
  hitstun: number;
  blockStun: number;
  invulnerable: boolean;
  isBlocking: boolean;
}

export function checkHit(
  attacker: Character,
  defender: Character,
  hitbox: Hitbox
): boolean {
  const attackerHitbox = {
    x: attacker.facing === 1 ? attacker.x + attacker.width : attacker.x - hitbox.width,
    y: attacker.y + hitbox.y,
    width: hitbox.width,
    height: hitbox.height
  };

  const defenderBox = {
    x: defender.x,
    y: defender.y,
    width: defender.width,
    height: defender.height
  };

  return (
    attackerHitbox.x < defenderBox.x + defenderBox.width &&
    attackerHitbox.x + attackerHitbox.width > defenderBox.x &&
    attackerHitbox.y < defenderBox.y + defenderBox.height &&
    attackerHitbox.y + attackerHitbox.height > defenderBox.y
  );
}

export function applyDamage(
  attacker: Character,
  defender: CombatCharacter,
  moveData: MoveData
): void {
  if (checkBlock(attacker, defender)) {
    const blockedDamage = moveData.damage * 0.3;
    defender.health = Math.max(0, defender.health - blockedDamage);
    defender.blockStun = moveData.recovery * 0.5;
    buildKi(defender, moveData.kiGain ? moveData.kiGain * 0.5 : 2);
    return;
  }

  if (checkSuperArmor(defender, 'PUNCH')) {
    defender.health = Math.max(0, defender.health - moveData.damage * 0.5);
    applyHitstun(defender, moveData.recovery * 0.3);
  } else {
    defender.health = Math.max(0, defender.health - moveData.damage);
    applyHitstun(defender, moveData.recovery);
    defender.state = CharacterState.HURT;
  }

  const knockbackDirection = attacker.facing;
  const combatDefender = defender as unknown as Character;
  applyKnockbackWrapper(combatDefender, knockbackDirection, moveData.knockback);

  addCombo(attacker);
  buildKi(attacker, moveData.kiGain ?? 5);

  if (defender.health <= 0) {
    defender.state = CharacterState.DEAD;
  }
}

export function addCombo(character: Character): void {
  character.combo = Math.min(character.combo + 1, 999);
}

export function resetCombo(character: Character): void {
  character.combo = 0;
}

export function buildKi(character: Character, amount: number): void {
  character.ki = Math.min(character.maxKi, character.ki + amount);
}

export function consumeKi(character: Character, amount: number): boolean {
  if (character.ki >= amount) {
    character.ki -= amount;
    return true;
  }
  return false;
}

export function applyHitstun(character: CombatCharacter, duration: number): void {
  character.hitstun = duration;
}

export function checkSuperArmor(character: CombatCharacter, attackType: AttackType): boolean {
  if (!character.superArmor) return false;

  const armorBreakThresholds: Record<AttackType, number> = {
    PUNCH: 15,
    KICK: 20,
    SPECIAL: 30,
    THROW: 50
  };

  return character.superArmor && attackType !== 'THROW';
}

export function checkBlock(attacker: Character, defender: CombatCharacter): boolean {
  if (!defender.isBlocking || defender.hitstun > 0) return false;

  const isFacingAttacker = defender.facing !== attacker.facing;
  const isCloseEnough = Math.abs(attacker.x - defender.x) < 150;
  const isGrounded = defender.isGrounded;

  return isFacingAttacker && isCloseEnough && isGrounded;
}

function applyKnockbackWrapper(
  character: Character,
  direction: number,
  force: number
): void {
  character.velocityX = direction * force;
  character.velocityY = -force * 0.5;
  character.isGrounded = false;
}
