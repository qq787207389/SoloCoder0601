import { CharacterState } from '../types';
import type { MoveType } from '../types';
import { MOVES, COLORS, MOVE_SPEED, JUMP_FORCE } from '../constants';
import { Character, type Hitbox, type Physics } from './Character';
import type { InputManager } from '../core/Input';

export interface CombatSystem {
  registerHit: (attacker: Player, defender: unknown, damage: number) => void;
  getActiveEnemies: () => unknown[];
}

export class Player extends Character {
  combo: number;
  comboTimer: number;
  readonly COMBO_TIMEOUT = 120;

  constructor(x: number, y: number) {
    super(x, y, 60, 100);
    this.health = 200;
    this.maxHealth = 200;
    this.combo = 0;
    this.comboTimer = 0;
  }

  handleInput(input: InputManager, combatSystem?: CombatSystem): void {
    if (!this.canAct()) return;

    const direction = input.getDirection();
    const combo = input.checkMoveCombo();

    if (direction === 'LEFT') {
      this.velocityX = -MOVE_SPEED;
      this.facing = -1;
    } else if (direction === 'RIGHT') {
      this.velocityX = MOVE_SPEED;
      this.facing = 1;
    }

    if (input.isJustPressed('JUMP') && this.isGrounded) {
      this.velocityY = JUMP_FORCE;
      this.state = CharacterState.JUMP;
      this.isGrounded = false;
    }

    if (direction === 'DOWN' && this.isGrounded && !this.isAttacking()) {
      this.state = CharacterState.CROUCH;
      this.velocityX = 0;
    } else if (direction !== 'DOWN' && this.state === CharacterState.CROUCH) {
      this.state = CharacterState.IDLE;
    }

    if (input.isJustPressed('BLOCK') && this.isGrounded && !this.isAttacking()) {
      this.state = CharacterState.BLOCK;
      this.velocityX = 0;
    } else if (!input.isPressed('BLOCK') && this.state === CharacterState.BLOCK) {
      this.state = CharacterState.IDLE;
    }

    if (combo !== 'NONE') {
      if (combo === 'DASH_PUNCH') {
        this.startAttack('DASH_PUNCH');
      } else if (combo === 'DASH_KICK') {
        this.startAttack('SWEEP');
      } else if (combo === 'UPPERCUT') {
        this.startAttack('UPPERCUT');
      }
      return;
    }

    if (input.isJustPressed('PUNCH')) {
      if (!this.isGrounded) {
        this.startAttack('UPPERCUT');
      } else {
        this.startAttack('PUNCH');
      }
    }

    if (input.isJustPressed('KICK')) {
      if (!this.isGrounded) {
        this.startAttack('FLYING_KICK');
      } else {
        this.startAttack('KICK');
      }
    }

    if (input.isJustPressed('SKILL')) {
      this.trySpecialMove(input);
    }
  }

  update(dt: number, input: InputManager, physics: Physics, combatSystem?: CombatSystem): void {
    super.update(dt, input, physics);

    this.handleInput(input, combatSystem);

    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }

    if (this.isAttackActive() && combatSystem) {
      const hitbox = this.getHitbox();
      if (hitbox) {
        this.checkHits(hitbox, combatSystem);
      }
    }
  }

  trySpecialMove(input: InputManager): boolean {
    if (!this.canAct()) return false;

    const direction = input.getDirection();

    if (this.isKiFull()) {
      this.startAttack('ULTIMATE_COMBO');
      this.ki = 0;
      this.superArmor = true;
      setTimeout(() => {
        this.superArmor = false;
      }, 2000);
      return true;
    }

    if (this.ki >= 50) {
      if (direction === 'LEFT' || direction === 'RIGHT') {
        this.startAttack('QI_WAVE');
        this.ki -= 50;
        return true;
      }
    }

    return false;
  }

  buildKi(amount: number): void {
    this.ki = Math.min(this.maxKi, this.ki + amount);
  }

  resetCombo(): void {
    this.combo = 0;
    this.comboTimer = 0;
  }

  getComboCount(): number {
    return this.combo;
  }

  incrementCombo(): void {
    this.combo++;
    this.comboTimer = this.COMBO_TIMEOUT;
  }

  isKiFull(): boolean {
    return this.ki >= this.maxKi;
  }

  protected drawCharacter(ctx: CanvasRenderingContext2D, scale: number): void {
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;

    ctx.fillStyle = COLORS.CHINA_RED;
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);

    ctx.fillStyle = COLORS.INK_BLACK;
    const headSize = scaledWidth * 0.6;
    const headX = (scaledWidth - headSize) / 2;
    const headY = scaledHeight * 0.05;
    ctx.beginPath();
    ctx.arc(headX + headSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ANCIENT_GOLD;
    const eyeSize = headSize * 0.12;
    const eyeY = headY + headSize * 0.45;
    ctx.beginPath();
    ctx.arc(headX + headSize * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(headX + headSize * 0.65, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.INK_BLACK;
    const beltY = scaledHeight * 0.55;
    const beltHeight = scaledHeight * 0.08;
    ctx.fillRect(0, beltY, scaledWidth, beltHeight);

    if (this.state === CharacterState.PUNCH) {
      const armLength = scaledWidth * 0.8;
      const armY = scaledHeight * 0.35;
      ctx.fillStyle = COLORS.CHINA_RED;
      ctx.fillRect(scaledWidth - scaledWidth * 0.1, armY, armLength, scaledHeight * 0.08);
    } else if (this.state === CharacterState.KICK) {
      const legLength = scaledWidth * 0.9;
      const legY = scaledHeight * 0.75;
      ctx.fillStyle = COLORS.CHINA_RED;
      ctx.fillRect(scaledWidth - scaledWidth * 0.1, legY, legLength, scaledHeight * 0.12);
    }
  }

  private checkHits(hitbox: Hitbox, combatSystem: CombatSystem): void {
    const enemies = combatSystem.getActiveEnemies();
    for (const enemy of enemies) {
      if (this.checkHitboxCollision(hitbox, enemy as { getBodyBox: () => Hitbox })) {
        if (this.moveData) {
          combatSystem.registerHit(this, enemy, this.moveData.damage);
          if (this.moveData.kiGain) {
            this.buildKi(this.moveData.kiGain);
          }
          this.incrementCombo();
        }
      }
    }
  }

  private checkHitboxCollision(hitbox: Hitbox, target: { getBodyBox: () => Hitbox }): boolean {
    const targetBox = target.getBodyBox();
    return (
      hitbox.x < targetBox.x + targetBox.width &&
      hitbox.x + hitbox.width > targetBox.x &&
      hitbox.y < targetBox.y + targetBox.height &&
      hitbox.y + hitbox.height > targetBox.y
    );
  }

  startAttack(moveType: MoveType): void {
    const move = MOVES[moveType];
    if (move.kiCost && this.ki < move.kiCost) return;

    super.startAttack(moveType);

    if (move.kiCost) {
      this.ki -= move.kiCost;
    }
  }

  takeDamage(damage: number, knockback: number, direction: 1 | -1): void {
    if (this.state === CharacterState.BLOCK) {
      damage = Math.floor(damage * 0.3);
      knockback = Math.floor(knockback * 0.5);
      this.buildKi(5);
    }

    super.takeDamage(damage, knockback, direction);
    this.resetCombo();
  }
}
