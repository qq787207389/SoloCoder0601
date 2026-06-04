import { CharacterState, BossType, MoveType } from '../types';
import { COLORS, MOVE_SPEED } from '../constants';
import { Character, type Hitbox } from './Character';
import type { Player } from './Player';
import type { Level } from './Enemy';

type BossPhase = 1 | 2 | 3;
type BossAction = 'IDLE' | 'CHASE' | 'ATTACK' | 'SPECIAL' | 'DODGE' | 'BLOCK' | 'INTRO';

interface BossConfig {
  width: number;
  height: number;
  health: number;
  attackRange: number;
  detectionRange: number;
  speed: number;
  phaseThresholds: [number, number];
  introDuration: number;
  victoryLines: string[];
  damageMultiplier: number;
}

export class Boss extends Character {
  bossType: BossType;
  currentPhase: BossPhase;
  aiState: BossAction;
  attackCooldown: number;
  specialCooldown: number;
  dodgeCooldown: number;
  introTimer: number;
  isInvisible: boolean;
  invisibleTimer: number;
  mirroredMove: MoveType | null;
  mirrorCooldown: number;
  config: BossConfig;
  actionTimer: number;
  comboCount: number;
  maxCombo: number;
  isActive: boolean;
  damageMultiplier: number;

  constructor(x: number, y: number, type: BossType) {
    const config = Boss.getConfigByType(type);
    super(x, y, config.width, config.height);

    this.bossType = type;
    this.config = config;
    this.health = config.health;
    this.maxHealth = config.health;
    this.currentPhase = 1;
    this.aiState = 'INTRO';
    this.attackCooldown = 60;
    this.specialCooldown = 0;
    this.dodgeCooldown = 0;
    this.introTimer = config.introDuration;
    this.isInvisible = false;
    this.invisibleTimer = 0;
    this.mirroredMove = null;
    this.mirrorCooldown = 0;
    this.actionTimer = 0;
    this.comboCount = 0;
    this.maxCombo = 3;
    this.superArmor = type === BossType.MONGOL_WRESTLER;
    this.isActive = true;
    this.damageMultiplier = config.damageMultiplier;
  }

  private static getConfigByType(type: BossType): BossConfig {
    const configs: Record<BossType, BossConfig> = {
      [BossType.SHAOLIN_MONK]: {
        width: 65,
        height: 115,
        health: 300,
        attackRange: 120,
        detectionRange: 400,
        speed: MOVE_SPEED * 0.45,
        phaseThresholds: [0.66, 0.33],
        introDuration: 120,
        victoryLines: ['阿弥陀佛...', '施主，你赢了。', '武学之道，永无止境。'],
        damageMultiplier: 0.5
      },
      [BossType.EMEI_NUN]: {
        width: 55,
        height: 100,
        health: 250,
        attackRange: 280,
        detectionRange: 450,
        speed: MOVE_SPEED * 0.7,
        phaseThresholds: [0.6, 0.25],
        introDuration: 100,
        victoryLines: ['好功夫...', '峨眉剑法，还有得学。', '后会有期。'],
        damageMultiplier: 0.45
      },
      [BossType.MONGOL_WRESTLER]: {
        width: 80,
        height: 130,
        health: 400,
        attackRange: 90,
        detectionRange: 300,
        speed: MOVE_SPEED * 0.3,
        phaseThresholds: [0.7, 0.4],
        introDuration: 150,
        victoryLines: ['你...很强...', '蒙古第一勇士，认输了。', '哈哈哈！痛快！'],
        damageMultiplier: 0.6
      },
      [BossType.NINJA]: {
        width: 50,
        height: 95,
        health: 220,
        attackRange: 85,
        detectionRange: 500,
        speed: MOVE_SPEED * 0.8,
        phaseThresholds: [0.65, 0.3],
        introDuration: 80,
        victoryLines: ['忍术...被破解了...', '你是真正的武士。', '暗影之中，再相会。'],
        damageMultiplier: 0.4
      },
      [BossType.OLD_MASTER]: {
        width: 58,
        height: 105,
        health: 280,
        attackRange: 350,
        detectionRange: 500,
        speed: MOVE_SPEED * 0.35,
        phaseThresholds: [0.6, 0.35],
        introDuration: 130,
        victoryLines: ['长江后浪推前浪...', '武学的未来，就靠你们了。', '记住，以柔克刚。'],
        damageMultiplier: 0.5
      },
      [BossType.SENIOR_BROTHER]: {
        width: 60,
        height: 105,
        health: 350,
        attackRange: 100,
        detectionRange: 400,
        speed: MOVE_SPEED * 0.65,
        phaseThresholds: [0.65, 0.35],
        introDuration: 110,
        victoryLines: ['师弟，你进步了。', '师傅的真传，就交给你了。', '我输得心服口服。'],
        damageMultiplier: 0.55
      }
    };
    return configs[type];
  }

  updateAI(dt: number, player: Player, level: Level): void {
    if (this.state === CharacterState.DEAD) return;

    this.updatePhase();

    if (this.introTimer > 0) {
      this.introTimer--;
      this.playIntroAnimation();
      this.updatePhysics(dt, level);
      return;
    }

    if (this.aiState === 'INTRO') {
      this.aiState = 'IDLE';
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this.mirrorCooldown > 0) this.mirrorCooldown--;

    if (this.isInvisible) {
      this.invisibleTimer--;
      if (this.invisibleTimer <= 0) {
        this.isInvisible = false;
      }
    }

    if (this.bossType === BossType.NINJA && this.currentPhase >= 2 && !this.isInvisible && this.specialCooldown <= 0) {
      if (Math.random() < 0.02) {
        this.activateInvisibility();
      }
    }

    if (this.bossType === BossType.SENIOR_BROTHER && this.mirrorCooldown <= 0 && player.isAttacking()) {
      this.mirroredMove = player.currentMove;
      this.mirrorCooldown = 90;
    }

    const distance = this.getDistanceToPlayer(player);
    const playerDirection = player.x > this.x ? 1 : -1;
    this.facing = playerDirection;

    if (this.hitstun > 0 || this.isAttacking()) {
      if (this.comboCount > 0 && this.attackCooldown <= 0) {
        this.comboCount = 0;
      }
      this.updatePhysics(dt, level);
      return;
    }

    this.decideBossAction(player, distance);

    switch (this.aiState) {
      case 'CHASE':
        this.velocityX = playerDirection * this.config.speed;
        break;
      case 'ATTACK':
        this.tryAttack(player);
        break;
      case 'SPECIAL':
        this.doSpecialAttack(player);
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

  private decideBossAction(player: Player, distance: number): void {
    if (player.isAttacking() && player.isAttackActive()) {
      const attackComing = this.isPlayerAttackIncoming(player);
      if (attackComing) {
        if (this.bossType === BossType.EMEI_NUN && this.dodgeCooldown <= 0 && Math.random() < 0.4) {
          this.aiState = 'DODGE';
          return;
        }
        if (this.bossType !== BossType.MONGOL_WRESTLER && Math.random() < 0.25) {
          this.aiState = 'BLOCK';
          return;
        }
      }
    }

    if (this.specialCooldown <= 0 && this.shouldUseSpecial(distance)) {
      this.aiState = 'SPECIAL';
      return;
    }

    if (distance > this.config.attackRange) {
      this.aiState = 'CHASE';
    } else {
      if (this.attackCooldown <= 0) {
        this.aiState = 'ATTACK';
      } else {
        this.aiState = 'IDLE';
      }
    }
  }

  private shouldUseSpecial(distance: number): boolean {
    const healthPercent = this.health / this.maxHealth;
    const baseChance = 0.01 + (1 - healthPercent) * 0.03;

    switch (this.bossType) {
      case BossType.EMEI_NUN:
        return distance > 150 && distance < 300 && Math.random() < baseChance * 2;
      case BossType.OLD_MASTER:
        return distance > 100 && Math.random() < baseChance * 1.5;
      case BossType.NINJA:
        return this.comboCount >= this.maxCombo && Math.random() < baseChance;
      case BossType.MONGOL_WRESTLER:
        return distance < 100 && healthPercent < 0.5 && Math.random() < baseChance;
      case BossType.SHAOLIN_MONK:
        return distance < 130 && this.currentPhase >= 2 && Math.random() < baseChance;
      case BossType.SENIOR_BROTHER:
        return this.mirroredMove !== null && Math.random() < baseChance * 2;
      default:
        return Math.random() < baseChance;
    }
  }

  enterPhase(phase: BossPhase): void {
    this.currentPhase = phase;
    this.specialCooldown = 0;
    this.attackCooldown = 0;

    if (phase === 2) {
      this.maxCombo = 4;
    } else if (phase === 3) {
      this.maxCombo = 5;
      this.superArmor = true;
    }
  }

  private updatePhase(): void {
    const healthPercent = this.health / this.maxHealth;
    const [phase2Threshold, phase3Threshold] = this.config.phaseThresholds;

    if (this.currentPhase === 1 && healthPercent <= phase2Threshold) {
      this.enterPhase(2);
    } else if (this.currentPhase === 2 && healthPercent <= phase3Threshold) {
      this.enterPhase(3);
    }
  }

  getAttackPattern(): MoveType {
    const patterns = this.getAttackPatternsByPhase();
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private getAttackPatternsByPhase(): MoveType[] {
    const basePatterns: MoveType[] = ['PUNCH', 'KICK'];

    if (this.currentPhase >= 2) {
      basePatterns.push('UPPERCUT', 'SWEEP');
    }

    if (this.currentPhase >= 3) {
      basePatterns.push('DASH_PUNCH', 'FLYING_KICK');
    }

    return basePatterns;
  }

  tryAttack(player: Player): boolean {
    if (!this.canAct() || this.attackCooldown > 0) return false;

    const distance = this.getDistanceToPlayer(player);
    if (distance > this.config.attackRange) return false;

    let moveType: MoveType;

    if (this.bossType === BossType.SENIOR_BROTHER && this.mirroredMove) {
      moveType = this.mirroredMove;
      this.mirroredMove = null;
    } else if (this.bossType === BossType.NINJA) {
      moveType = this.getAttackPattern();
      this.comboCount++;
    } else if (this.bossType === BossType.SHAOLIN_MONK) {
      moveType = this.currentPhase >= 2 ? 'FLYING_KICK' : 'KICK';
    } else {
      moveType = this.getAttackPattern();
    }

    this.startAttack(moveType);

    const cooldownMultiplier = this.bossType === BossType.SHAOLIN_MONK ? 2.0 :
                               this.bossType === BossType.NINJA ? 1.0 :
                               this.bossType === BossType.SENIOR_BROTHER ? 1.2 : 1.5;

    if (this.comboCount >= this.maxCombo) {
      this.attackCooldown = Math.floor(120 * cooldownMultiplier);
      this.comboCount = 0;
    } else {
      this.attackCooldown = Math.floor(70 * cooldownMultiplier);
    }

    return true;
  }

  doSpecialAttack(player?: Player): boolean {
    if (!this.canAct() || this.specialCooldown > 0) return false;

    let success = false;

    switch (this.bossType) {
      case BossType.SHAOLIN_MONK:
        success = this.doShaolinSpecial();
        break;
      case BossType.EMEI_NUN:
        success = this.doEmeiSpecial();
        break;
      case BossType.MONGOL_WRESTLER:
        success = this.doMongolSpecial();
        break;
      case BossType.NINJA:
        success = this.doNinjaSpecial();
        break;
      case BossType.OLD_MASTER:
        success = this.doOldMasterSpecial();
        break;
      case BossType.SENIOR_BROTHER:
        success = this.doSeniorBrotherSpecial(player);
        break;
    }

    if (success) {
      this.specialCooldown = 180;
    }

    return success;
  }

  private doShaolinSpecial(): boolean {
    this.startAttack('ULTIMATE_COMBO');
    this.velocityX = this.facing * 8;
    return true;
  }

  private doEmeiSpecial(): boolean {
    this.startAttack('QI_WAVE');
    return true;
  }

  private doMongolSpecial(): boolean {
    this.startAttack('UPPERCUT');
    this.superArmor = true;
    setTimeout(() => {
      this.superArmor = this.bossType === BossType.MONGOL_WRESTLER;
    }, 3000);
    return true;
  }

  private doNinjaSpecial(): boolean {
    this.activateInvisibility();
    this.startAttack('SWEEP');
    return true;
  }

  private doOldMasterSpecial(): boolean {
    this.startAttack('QI_WAVE');
    this.ki = 100;
    return true;
  }

  private doSeniorBrotherSpecial(player?: Player): boolean {
    if (!player) return false;

    if (player.currentMove) {
      this.startAttack(player.currentMove);
    } else {
      this.startAttack('ULTIMATE_COMBO');
    }
    return true;
  }

  private activateInvisibility(): void {
    this.isInvisible = true;
    this.invisibleTimer = 120;
    this.specialCooldown = 240;
  }

  tryDodge(attacker: Character): boolean {
    if (this.dodgeCooldown > 0 || !this.isGrounded) return false;

    this.state = CharacterState.JUMP;
    const dodgeDirection = attacker.x > this.x ? -1 : 1;
    const dodgeMultiplier = this.bossType === BossType.EMEI_NUN ? 2.5 : 1.8;
    this.velocityX = dodgeDirection * this.config.speed * dodgeMultiplier;
    this.velocityY = -10;
    this.isGrounded = false;
    this.dodgeCooldown = this.bossType === BossType.EMEI_NUN ? 30 : 60;
    this.aiState = 'IDLE';
    return true;
  }

  tryBlock(attacker: Character): boolean {
    if (!this.canAct() || !this.isGrounded) return false;
    if (this.bossType === BossType.MONGOL_WRESTLER) return false;

    this.state = CharacterState.BLOCK;
    this.velocityX = 0;
    this.facing = attacker.x > this.x ? 1 : -1;
    this.aiState = 'IDLE';
    return true;
  }

  private playIntroAnimation(): void {
    this.velocityX = 0;
    if (this.introTimer % 30 < 15) {
      this.state = CharacterState.IDLE;
    } else {
      this.state = CharacterState.PUNCH;
    }
  }

  getVictoryLine(): string {
    const lines = this.config.victoryLines;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  private getDistanceToPlayer(player: Player): number {
    return Math.abs(player.x - this.x);
  }

  private isPlayerAttackIncoming(player: Player): boolean {
    const hitbox = player.getHitbox();
    if (!hitbox) return false;

    const bodyBox = this.getBodyBox();
    const buffer = 60;

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

    this.velocityX *= 0.85;

    if (this.isAttacking()) {
      this.updateAttackFrame();
    }
  }

  takeDamage(damage: number, knockback: number, direction: 1 | -1): void {
    if (this.bossType === BossType.MONGOL_WRESTLER && this.currentPhase === 1) {
      damage = Math.floor(damage * 0.3);
      knockback = 0;
    }

    if (this.state === CharacterState.BLOCK) {
      damage = Math.floor(damage * 0.3);
      knockback = Math.floor(knockback * 0.4);
    }

    if (this.isInvisible) {
      damage = Math.floor(damage * 0.5);
    }

    super.takeDamage(damage, knockback, direction);
  }

  protected drawCharacter(ctx: CanvasRenderingContext2D, scale: number): void {
    if (this.isInvisible) {
      ctx.globalAlpha = 0.2;
    }

    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;

    const color = this.getBossColor();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);

    this.drawBossFeatures(ctx, scaledWidth, scaledHeight);

    if (this.state === CharacterState.PUNCH || this.state === CharacterState.KICK || this.state === CharacterState.SPECIAL) {
      this.drawAttackEffect(ctx, scaledWidth, scaledHeight);
    }

    ctx.globalAlpha = 1;
  }

  private drawBossFeatures(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = COLORS.INK_BLACK;
    const headSize = w * 0.55;
    const headX = (w - headSize) / 2;
    const headY = h * 0.05;
    ctx.beginPath();
    ctx.arc(headX + headSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.HIGHLIGHT;
    const eyeSize = headSize * 0.12;
    const eyeY = headY + headSize * 0.45;
    ctx.beginPath();
    ctx.arc(headX + headSize * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(headX + headSize * 0.65, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    switch (this.bossType) {
      case BossType.SHAOLIN_MONK:
        ctx.fillStyle = COLORS.ANCIENT_GOLD;
        ctx.fillRect(w * 0.1, h * 0.55, w * 0.8, h * 0.1);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(w * 0.05, h * 0.3, w * 0.9, h * 0.06);
        break;

      case BossType.EMEI_NUN:
        ctx.fillStyle = '#9370DB';
        ctx.fillRect(w * 0.15, h * 0.5, w * 0.7, h * 0.15);
        ctx.fillStyle = COLORS.INK_BLACK;
        ctx.beginPath();
        ctx.arc(headX + headSize / 2, headY + headSize * 0.7, headSize * 0.4, 0, Math.PI, false);
        ctx.fill();
        break;

      case BossType.MONGOL_WRESTLER:
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(w * 0.05, h * 0.5, w * 0.9, h * 0.18);
        ctx.fillStyle = COLORS.ANCIENT_GOLD;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.58, w * 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;

      case BossType.NINJA:
        ctx.fillStyle = COLORS.INK_BLACK;
        ctx.fillRect(headX, headY + headSize * 0.3, headSize, headSize * 0.5);
        ctx.fillStyle = COLORS.CHINA_RED;
        ctx.fillRect(w * 0.1, h * 0.55, w * 0.8, h * 0.06);
        break;

      case BossType.OLD_MASTER:
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(w * 0.1, h * 0.15, w * 0.8, h * 0.1);
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(w * 0.1, h * 0.5, w * 0.8, h * 0.35);
        break;

      case BossType.SENIOR_BROTHER:
        ctx.fillStyle = COLORS.CHINA_RED;
        ctx.fillRect(w * 0.1, h * 0.55, w * 0.8, h * 0.12);
        ctx.fillStyle = COLORS.ANCIENT_GOLD;
        ctx.fillRect(w * 0.4, h * 0.56, w * 0.2, h * 0.1);
        break;
    }
  }

  private drawAttackEffect(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const color = this.getBossColor();
    ctx.fillStyle = color;

    if (this.bossType === BossType.SHAOLIN_MONK) {
      const staffLength = w * 1.5;
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(w - w * 0.1, h * 0.3, staffLength, h * 0.05);
    } else if (this.bossType === BossType.NINJA) {
      const chainLength = w * 1.2;
      ctx.fillStyle = COLORS.INK_BLACK;
      ctx.fillRect(w - w * 0.1, h * 0.35, chainLength, h * 0.04);
      ctx.beginPath();
      ctx.arc(w + chainLength, h * 0.37, w * 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.state === CharacterState.PUNCH) {
      const armLength = w * 0.9;
      ctx.fillRect(w - w * 0.1, h * 0.35, armLength, h * 0.08);
    } else if (this.state === CharacterState.KICK || this.state === CharacterState.SPECIAL) {
      const legLength = w * 1.0;
      ctx.fillRect(w - w * 0.1, h * 0.72, legLength, h * 0.12);
    }
  }

  private getBossColor(): string {
    const colors: Record<BossType, string> = {
      [BossType.SHAOLIN_MONK]: '#DAA520',
      [BossType.EMEI_NUN]: '#9370DB',
      [BossType.MONGOL_WRESTLER]: '#8B4513',
      [BossType.NINJA]: '#2F2F2F',
      [BossType.OLD_MASTER]: '#F5F5DC',
      [BossType.SENIOR_BROTHER]: '#CD5C5C'
    };
    return colors[this.bossType];
  }

  getAttackHitbox(): Hitbox | null {
    if (!this.isAttackActive() || !this.moveData) return null;

    let rangeMultiplier = 1;
    if (this.bossType === BossType.SHAOLIN_MONK) rangeMultiplier = 1.8;
    if (this.bossType === BossType.OLD_MASTER) rangeMultiplier = 2.5;

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

  getName(): string {
    const names: Record<BossType, string> = {
      [BossType.SHAOLIN_MONK]: '少林棍僧',
      [BossType.EMEI_NUN]: '峨眉女侠',
      [BossType.MONGOL_WRESTLER]: '蒙古摔跤手',
      [BossType.NINJA]: '暗影忍者',
      [BossType.OLD_MASTER]: '老拳师',
      [BossType.SENIOR_BROTHER]: '大师兄'
    };
    return names[this.bossType];
  }
}
