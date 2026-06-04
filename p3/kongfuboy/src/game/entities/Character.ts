import { CharacterState } from '../types';
import type { MoveType, MoveData } from '../types';
import { MOVES, GRAVITY } from '../constants';
import type { InputManager } from '../core/Input';

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Physics {
  groundY: number;
}

export abstract class Character {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  health: number;
  maxHealth: number;
  ki: number;
  maxKi: number;
  state: CharacterState;
  facing: 1 | -1;
  isGrounded: boolean;
  superArmor: boolean;

  get isDead(): boolean {
    return this.state === CharacterState.DEAD;
  }

  attackFrame: number;
  hitstun: number;
  currentMove: MoveType | null;
  moveData: MoveData | null;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocityX = 0;
    this.velocityY = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.ki = 0;
    this.maxKi = 100;
    this.state = CharacterState.IDLE;
    this.facing = 1;
    this.isGrounded = false;
    this.superArmor = false;
    this.attackFrame = 0;
    this.hitstun = 0;
    this.currentMove = null;
    this.moveData = null;
  }

  update(dt: number, input: InputManager, physics: Physics): void {
    if (this.hitstun > 0) {
      this.hitstun--;
      if (this.hitstun <= 0) {
        this.state = CharacterState.IDLE;
      }
    }

    if (this.isAttacking()) {
      this.updateAttackFrame();
    }

    this.velocityY += GRAVITY;
    this.x += this.velocityX;
    this.y += this.velocityY;

    if (this.y + this.height >= physics.groundY) {
      this.y = physics.groundY - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
      if (this.state === CharacterState.JUMP) {
        this.state = CharacterState.IDLE;
      }
    } else {
      this.isGrounded = false;
    }

    if (this.velocityX !== 0 && this.state === CharacterState.IDLE && this.isGrounded) {
      this.state = CharacterState.WALK;
    } else if (this.velocityX === 0 && this.state === CharacterState.WALK) {
      this.state = CharacterState.IDLE;
    }

    this.velocityX *= 0.8;
  }

  render(ctx: CanvasRenderingContext2D, sprites: unknown, scale: number): void {
    ctx.save();
    ctx.translate(this.x * scale, this.y * scale);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-this.width * scale, 0);
    }
    this.drawCharacter(ctx, scale);
    ctx.restore();
  }

  protected abstract drawCharacter(ctx: CanvasRenderingContext2D, scale: number): void;

  takeDamage(damage: number, knockback: number, direction: 1 | -1): void {
    if (this.superArmor) return;

    this.health = Math.max(0, this.health - damage);
    this.hitstun = 15;
    this.state = CharacterState.HURT;
    this.velocityX = knockback * direction;
    this.currentMove = null;
    this.moveData = null;
    this.attackFrame = 0;

    if (this.health <= 0) {
      this.state = CharacterState.DEAD;
    }
  }

  startAttack(moveType: MoveType): void {
    if (this.isAttacking() || this.hitstun > 0) return;

    this.currentMove = moveType;
    this.moveData = MOVES[moveType];
    this.attackFrame = 0;

    if (moveType === 'PUNCH') {
      this.state = CharacterState.PUNCH;
    } else if (moveType === 'KICK') {
      this.state = CharacterState.KICK;
    } else {
      this.state = CharacterState.SPECIAL;
    }
  }

  updateAttackFrame(): void {
    if (!this.moveData) return;

    this.attackFrame++;
    const totalFrames = this.moveData.startup + this.moveData.active + this.moveData.recovery;

    if (this.attackFrame >= totalFrames) {
      this.currentMove = null;
      this.moveData = null;
      this.attackFrame = 0;
      this.state = CharacterState.IDLE;
    }
  }

  getHitbox(): Hitbox | null {
    if (!this.isAttackActive() || !this.moveData) return null;

    const hitboxWidth = this.width * 0.8;
    const hitboxHeight = this.height * 0.5;
    const hitboxX = this.facing === 1 ? this.x + this.width : this.x - hitboxWidth;
    const hitboxY = this.y + this.height * 0.2;

    return {
      x: hitboxX,
      y: hitboxY,
      width: hitboxWidth,
      height: hitboxHeight
    };
  }

  getBodyBox(): Hitbox {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  isAttackActive(): boolean {
    if (!this.moveData || !this.isAttacking()) return false;

    const { startup, active } = this.moveData;
    return this.attackFrame >= startup && this.attackFrame < startup + active;
  }

  isAttacking(): boolean {
    return this.state === CharacterState.PUNCH || this.state === CharacterState.KICK || this.state === CharacterState.SPECIAL;
  }

  canAct(): boolean {
    return !this.isAttacking() && this.hitstun <= 0 && this.state !== CharacterState.DEAD;
  }
}
