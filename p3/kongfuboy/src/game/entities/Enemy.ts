import { CharacterState, EnemyType } from '../types';
import type { MoveType } from '../types';
import { COLORS, MOVE_SPEED } from '../constants';
import { Character, type Hitbox } from './Character';
import type { Player } from './Player';

type AIAction = 'PATROL' | 'CHASE' | 'ATTACK' | 'DODGE' | 'BLOCK' | 'IDLE';

export interface Level {
  groundY: number;
  leftBound: number;
  rightBound: number;
}

export class Enemy extends Character {
  enemyType: EnemyType;
  patrolDirection: 1 | -1;
  patrolTimer: number;
  aiState: AIAction;
  actionTimer: number;
  attackRange: number;
  detectionRange: number;
  attackCooldown: number;
  dodgeCooldown: number;
  blockChance: number;
  dodgeChance: number;
  speed: number;
  damageMultiplier: number;

  constructor(x: number, y: number, type: EnemyType) {
    const config = Enemy.getConfigByType(type);
    super(x, y, config.width, config.height);

    this.enemyType = type;
    this.health = config.health;
    this.maxHealth = config.health;
    this.patrolDirection = Math.random() > 0.5 ? 1 : -1;
    this.patrolTimer = 0;
    this.aiState = 'PATROL';
    this.actionTimer = 0;
    this.attackRange = config.attackRange;
    this.detectionRange = config.detectionRange;
    this.attackCooldown = Math.random() * 60;
    this.dodgeCooldown = 0;
    this.blockChance = config.blockChance;
    this.dodgeChance = config.dodgeChance;
    this.speed = config.speed;
    this.damageMultiplier = config.damageMultiplier;
  }

  private static getConfigByType(type: EnemyType) {
    const configs: Record<EnemyType, {
      width: number;
      height: number;
      health: number;
      attackRange: number;
      detectionRange: number;
      blockChance: number;
      dodgeChance: number;
      speed: number;
      damageMultiplier: number;
    }> = {
      [EnemyType.NORMAL]: {
        width: 50,
        height: 90,
        health: 60,
        attackRange: 70,
        detectionRange: 250,
        blockChance: 0.1,
        dodgeChance: 0.05,
        speed: MOVE_SPEED * 0.5,
        damageMultiplier: 0.4
      },
      [EnemyType.ARCHER]: {
        width: 45,
        height: 85,
        health: 40,
        attackRange: 300,
        detectionRange: 400,
        blockChance: 0.05,
        dodgeChance: 0.2,
        speed: MOVE_SPEED * 0.4,
        damageMultiplier: 0.3
      },
      [EnemyType.BRUISER]: {
        width: 70,
        height: 110,
        health: 120,
        attackRange: 85,
        detectionRange: 200,
        blockChance: 0.3,
        dodgeChance: 0.02,
        speed: MOVE_SPEED * 0.35,
        damageMultiplier: 0.5
      }
    };
    return configs[type];
  }

  updateAI(dt: number, player: Player, level: Level): void {
    if (this.state === CharacterState.DEAD) return;

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;

    const distance = this.getDistanceToPlayer(player);
    const playerDirection = player.x > this.x ? 1 : -1;

    this.facing = playerDirection;

    if (this.hitstun > 0 || this.isAttacking()) {
      this.updatePhysics(dt, level);
      return;
    }

    this.decideAction(player, distance);

    switch (this.aiState) {
      case 'PATROL':
        this.doPatrol(level);
        break;
      case 'CHASE':
        this.doChase(playerDirection);
        break;
      case 'ATTACK':
        this.tryAttack(player);
        break;
      case 'DODGE':
        this.tryDodge(player);
        break;
      case 'BLOCK':
        this.tryBlock(player);
        break;
      case 'IDLE':
        this.velocityX = 0;
        break;
    }

    this.updatePhysics(dt, level);
  }

  decideAction(player: Player, distance: number): void {
    if (player.isAttacking() && player.isAttackActive()) {
      const attackComing = this.isPlayerAttackIncoming(player);
      if (attackComing) {
        if (this.dodgeCooldown <= 0 && Math.random() < this.dodgeChance) {
          this.aiState = 'DODGE';
          return;
        }
        if (Math.random() < this.blockChance) {
          this.aiState = 'BLOCK';
          return;
        }
      }
    }

    if (distance > this.detectionRange) {
      this.aiState = 'PATROL';
      return;
    }

    if (distance <= this.attackRange) {
      if (this.attackCooldown <= 0) {
        this.aiState = 'ATTACK';
      } else {
        this.aiState = 'IDLE';
      }
    } else {
      this.aiState = 'CHASE';
    }
  }

  tryAttack(player: Player): boolean {
    if (!this.canAct() || this.attackCooldown > 0) return false;

    const distance = this.getDistanceToPlayer(player);
    if (distance > this.attackRange) return false;

    let moveType: MoveType;
    if (this.enemyType === EnemyType.ARCHER) {
      moveType = 'PUNCH';
      this.attackCooldown = 150;
    } else if (this.enemyType === EnemyType.BRUISER) {
      moveType = Math.random() > 0.7 ? 'KICK' : 'PUNCH';
      this.attackCooldown = 180;
    } else {
      moveType = Math.random() > 0.8 ? 'KICK' : 'PUNCH';
      this.attackCooldown = 120;
    }

    this.startAttack(moveType);
    return true;
  }

  tryDodge(attacker: Character): boolean {
    if (this.dodgeCooldown > 0 || !this.isGrounded) return false;

    this.state = CharacterState.JUMP;
    const dodgeDirection = attacker.x > this.x ? -1 : 1;
    this.velocityX = dodgeDirection * this.speed * 2;
    this.velocityY = -8;
    this.isGrounded = false;
    this.dodgeCooldown = 60;
    this.aiState = 'IDLE';
    return true;
  }

  tryBlock(attacker: Character): boolean {
    if (!this.canAct() || !this.isGrounded) return false;

    this.state = CharacterState.BLOCK;
    this.velocityX = 0;
    this.facing = attacker.x > this.x ? 1 : -1;
    this.aiState = 'IDLE';
    return true;
  }

  private doPatrol(level: Level): void {
    this.patrolTimer++;

    if (this.patrolTimer > 120 || this.x <= level.leftBound || this.x >= level.rightBound) {
      this.patrolDirection = (this.patrolDirection * -1) as 1 | -1;
      this.patrolTimer = 0;
    }

    this.velocityX = this.patrolDirection * this.speed * 0.5;
  }

  private doChase(direction: 1 | -1): void {
    this.velocityX = direction * this.speed;
  }

  private getDistanceToPlayer(player: Player): number {
    return Math.abs(player.x - this.x);
  }

  private isPlayerAttackIncoming(player: Player): boolean {
    const hitbox = player.getHitbox();
    if (!hitbox) return false;

    const bodyBox = this.getBodyBox();
    const buffer = 50;

    return (
      hitbox.x < bodyBox.x + bodyBox.width + buffer &&
      hitbox.x + hitbox.width > bodyBox.x - buffer
    );
  }

  private updatePhysics(dt: number, level: Level): void {
    this.velocityY += 0.8;
    this.x += this.velocityX;
    this.y += this.velocityY;

    if (this.y + this.height >= level.groundY) {
      this.y = level.groundY - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
      if (this.state === CharacterState.JUMP) {
        this.state = CharacterState.IDLE;
      }
    } else {
      this.isGrounded = false;
    }

    this.x = Math.max(level.leftBound, Math.min(level.rightBound, this.x));

    if (this.state === CharacterState.BLOCK) {
      this.state = CharacterState.IDLE;
    }

    this.velocityX *= 0.8;

    if (this.isAttacking()) {
      this.updateAttackFrame();
    }
  }

  takeDamage(damage: number, knockback: number, direction: 1 | -1): void {
    if (this.state === CharacterState.BLOCK) {
      damage = Math.floor(damage * 0.4);
      knockback = Math.floor(knockback * 0.5);
    }

    super.takeDamage(damage, knockback, direction);
  }

  protected drawCharacter(ctx: CanvasRenderingContext2D, scale: number): void {
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;

    const color = this.getEnemyColor();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);

    ctx.fillStyle = COLORS.INK_BLACK;
    const headSize = scaledWidth * 0.6;
    const headX = (scaledWidth - headSize) / 2;
    const headY = scaledHeight * 0.05;
    ctx.beginPath();
    ctx.arc(headX + headSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    const eyeSize = headSize * 0.15;
    const eyeY = headY + headSize * 0.45;
    ctx.beginPath();
    ctx.arc(headX + headSize * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(headX + headSize * 0.65, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    if (this.enemyType === EnemyType.ARCHER) {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(scaledWidth * 0.1, scaledHeight * 0.3, scaledWidth * 0.15, scaledHeight * 0.5);
    }

    if (this.enemyType === EnemyType.BRUISER) {
      ctx.fillStyle = COLORS.INK_BLACK;
      const beltY = scaledHeight * 0.6;
      const beltHeight = scaledHeight * 0.12;
      ctx.fillRect(0, beltY, scaledWidth, beltHeight);
    }

    if (this.state === CharacterState.PUNCH) {
      const armLength = scaledWidth * 0.7;
      const armY = scaledHeight * 0.35;
      ctx.fillStyle = color;
      ctx.fillRect(scaledWidth - scaledWidth * 0.1, armY, armLength, scaledHeight * 0.08);
    } else if (this.state === CharacterState.KICK || this.state === CharacterState.SPECIAL) {
      const legLength = scaledWidth * 0.8;
      const legY = scaledHeight * 0.75;
      ctx.fillStyle = color;
      ctx.fillRect(scaledWidth - scaledWidth * 0.1, legY, legLength, scaledHeight * 0.12);
    }
  }

  private getEnemyColor(): string {
    const colors: Record<EnemyType, string> = {
      [EnemyType.NORMAL]: '#4A6741',
      [EnemyType.ARCHER]: '#6B4423',
      [EnemyType.BRUISER]: '#5C4033'
    };
    return colors[this.enemyType];
  }

  getAttackHitbox(): Hitbox | null {
    if (!this.isAttackActive() || !this.moveData) return null;

    const rangeMultiplier = this.enemyType === EnemyType.ARCHER ? 2 : 1;
    const hitboxWidth = this.width * 0.8 * rangeMultiplier;
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
}
