import { 
  PlayerState, Team, PlayerStats, ItemType, Vector2,
  PLAYER_CONFIG, GAME_CONFIG, COURT_CONFIG, ITEM_CONFIG 
} from '../../types/game';
import { Entity } from './Entity';
import { Vector2Math } from '../physics/Vector2';
import { Physics } from '../physics/Physics';

export class Player extends Entity {
  state: PlayerState;
  team: Team;
  isAI: boolean;

  constructor(id: string, team: Team, x: number, y: number, isAI: boolean = false) {
    super(id, x, y, PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT);
    this.team = team;
    this.isAI = isAI;
    
    const baseStats: PlayerStats = {
      speed: PLAYER_CONFIG.BASE_SPEED,
      strength: 10,
      jump: PLAYER_CONFIG.BASE_JUMP,
      accuracy: 0.7,
    };
    
    this.state = {
      id,
      team,
      position: this.position,
      velocity: this.velocity,
      stats: baseStats,
      specialGauge: 0,
      isAI,
      isJumping: false,
      isKnockedOut: false,
      knockoutTimer: 0,
      hasBall: false,
      currentItem: null,
      itemTimer: 0,
      animation: 'idle',
      animationFrame: 0,
      facingRight: team === 'red',
      chargePower: 0,
      isCharging: false,
    };
  }

  update(_deltaTime: number): void {
    this.state.position = this.position;
    this.state.velocity = this.velocity;

    if (this.state.isKnockedOut) {
      this.state.knockoutTimer--;
      if (this.state.knockoutTimer <= 0) {
        this.state.isKnockedOut = false;
        this.state.animation = 'idle';
      }
      Physics.applyGravity(this.velocity);
      Physics.updatePosition(this.position, this.velocity);
      Physics.checkGroundCollision(this.position, this.velocity, this.height / 2);
      Physics.checkBoundaryCollision(this.position, this.velocity, this.width);
      return;
    }

    if (this.state.itemTimer > 0) {
      this.state.itemTimer--;
      if (this.state.itemTimer <= 0) {
        this.state.currentItem = null;
      }
    }

    this.state.animationFrame++;
    if (this.state.animationFrame >= 8) {
      this.state.animationFrame = 0;
    }

    if (this.state.isCharging && this.state.hasBall) {
      this.state.chargePower = Math.min(this.state.chargePower + 0.05, 1);
      this.state.animation = 'shooting';
    }

    const speedMultiplier = this.state.currentItem === 'speed' ? 1.5 : 1;
    const moveSpeed = this.state.stats.speed * speedMultiplier;
    
    if (Math.abs(this.velocity.x) > 0.5) {
      this.state.facingRight = this.velocity.x > 0;
      if (!this.state.isCharging) {
        this.state.animation = this.state.isJumping ? 'jumping' : 'running';
      }
    } else if (!this.state.isCharging) {
      this.state.animation = this.state.isJumping ? 'jumping' : 'idle';
    }

    Physics.applyGravity(this.velocity);
    
    const isGrounded = Physics.checkGroundCollision(this.position, this.velocity, this.height / 2);
    if (isGrounded) {
      this.state.isJumping = false;
      this.velocity.x *= 0.85;
    }

    Physics.clampVelocity(this.velocity, moveSpeed * 1.5);
    Physics.updatePosition(this.position, this.velocity);
    Physics.checkBoundaryCollision(this.position, this.velocity, this.width);

    if (this.state.hasBall && Math.abs(this.velocity.x) > 1) {
      this.state.specialGauge = Math.min(this.state.specialGauge + 0.2, GAME_CONFIG.MAX_SPECIAL);
    }
  }

  move(dx: number, dy: number): void {
    if (this.state.isKnockedOut) return;
    
    const speedMultiplier = this.state.currentItem === 'speed' ? 1.5 : 1;
    const moveSpeed = this.state.stats.speed * speedMultiplier;
    
    this.velocity.x = dx * moveSpeed;
    
    if (dy < 0 && !this.state.isJumping) {
      this.jump();
    }
  }

  jump(): void {
    if (this.state.isKnockedOut || this.state.isJumping) return;
    
    const jumpMultiplier = this.state.currentItem === 'jump' ? 1.8 : 1;
    const jumpPower = this.state.stats.jump * jumpMultiplier;
    
    this.velocity.y = Physics.calculateJumpVelocity(jumpPower * 3);
    this.state.isJumping = true;
    this.state.specialGauge = Math.min(this.state.specialGauge + 2, GAME_CONFIG.MAX_SPECIAL);
  }

  shoot(power: number = 0.5): Vector2 {
    if (!this.state.hasBall) return Vector2Math.create(0, 0);
    
    this.state.animation = 'shooting';
    this.state.hasBall = false;
    this.state.isCharging = false;
    
    const targetX = this.team === 'red' ? COURT_CONFIG.RIGHT_HOOP_X : COURT_CONFIG.LEFT_HOOP_X;
    const targetY = COURT_CONFIG.HOOP_Y;
    
    const isDunk = this.state.isJumping && 
      Math.abs(this.position.x - targetX) < PLAYER_CONFIG.DUNK_DISTANCE &&
      this.position.y < COURT_CONFIG.HOOP_Y + 50;
    
    const trajectory = Physics.calculateShotTrajectory(
      this.position,
      { x: targetX, y: targetY },
      power,
      isDunk
    );
    
    this.state.specialGauge = Math.min(this.state.specialGauge + 5, GAME_CONFIG.MAX_SPECIAL);
    this.state.chargePower = 0;
    
    return trajectory;
  }

  pass(targetPos: Vector2): Vector2 {
    if (!this.state.hasBall) return Vector2Math.create(0, 0);
    
    this.state.animation = 'passing';
    this.state.hasBall = false;
    this.state.specialGauge = Math.min(this.state.specialGauge + 8, GAME_CONFIG.MAX_SPECIAL);
    
    return Physics.calculatePassTrajectory(this.position, targetPos, 1);
  }

  steal(target: Player): boolean {
    if (this.state.isKnockedOut) return false;
    
    const stealRange = this.state.currentItem === 'magnet' ? 80 : 50;
    const distance = this.distanceTo(target);
    
    if (distance < stealRange && target.state.hasBall) {
      const success = Math.random() < 0.6;
      if (success) {
        target.state.hasBall = false;
        this.knockout(target);
        return true;
      }
    }
    return false;
  }

  block(attacker: Player): boolean {
    if (this.state.isKnockedOut || !this.state.isJumping) return false;
    
    const blockRange = this.state.currentItem === 'pan' ? 100 : 60;
    const distance = this.distanceTo(attacker);
    
    if (distance < blockRange && attacker.state.hasBall) {
      const success = Math.random() < 0.7;
      if (success) {
        attacker.state.hasBall = false;
        this.knockout(attacker, 15);
        return true;
      }
    }
    return false;
  }

  knockout(target: Player, strength: number = 10): void {
    target.state.isKnockedOut = true;
    target.state.knockoutTimer = PLAYER_CONFIG.KNOCKOUT_TIME;
    target.state.animation = 'knockedout';
    target.state.hasBall = false;
    target.state.isCharging = false;
    target.state.chargePower = 0;
    
    Physics.knockback(
      target.position,
      target.velocity,
      this.position,
      strength + this.state.stats.strength,
      10
    );
  }

  pickupItem(item: ItemType): void {
    this.state.currentItem = item;
    const config = ITEM_CONFIG[item];
    if (config.duration > 0) {
      this.state.itemTimer = config.duration;
    }
    this.state.specialGauge = Math.min(this.state.specialGauge + 10, GAME_CONFIG.MAX_SPECIAL);
  }

  canUseSpecial(): boolean {
    return this.state.specialGauge >= GAME_CONFIG.MAX_SPECIAL && !this.state.isKnockedOut;
  }

  useSpecial(): boolean {
    if (!this.canUseSpecial()) return false;
    this.state.specialGauge = 0;
    return true;
  }

  getOpponentHoop(): Vector2 {
    return {
      x: this.team === 'red' ? COURT_CONFIG.RIGHT_HOOP_X : COURT_CONFIG.LEFT_HOOP_X,
      y: COURT_CONFIG.HOOP_Y,
    };
  }
}
