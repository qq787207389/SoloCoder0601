import { Enemy, EnemyType, EnemyState, Direction, Vector2, Platform } from '../types/game';
import { GAME_CONFIG } from '../config/constants';
import { checkEntityCollision, distance } from '../utils/physics';
import { PlayerEntity } from './Player';

let enemyIdCounter = 0;

export class EnemyEntity implements Enemy {
  id: string;
  type: EnemyType;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  isActive: boolean;
  state: EnemyState;
  direction: Direction;
  health: number;
  maxHealth: number;
  stunTimer: number;
  speed: number;
  animFrame: number;
  animTimer: number;
  patrolStart: Vector2;
  patrolEnd: Vector2;
  stunStars: { angle: number; dist: number }[];

  constructor(type: EnemyType, position: Vector2, patrolRange: number = 100) {
    this.id = `enemy_${enemyIdCounter++}`;
    this.type = type;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.isActive = true;
    this.state = EnemyState.WALKING;
    this.direction = Direction.RIGHT;
    this.animFrame = 0;
    this.animTimer = 0;
    this.patrolStart = { x: position.x - patrolRange, y: position.y };
    this.patrolEnd = { x: position.x + patrolRange, y: position.y };
    this.stunTimer = 0;
    this.stunStars = [];

    switch (type) {
      case EnemyType.SNAIL:
        this.width = 36;
        this.height = 24;
        this.speed = 0.8;
        this.health = 1;
        this.maxHealth = 1;
        break;
      case EnemyType.BEE:
        this.width = 30;
        this.height = 28;
        this.speed = 1.5;
        this.health = 1;
        this.maxHealth = 1;
        break;
      case EnemyType.ROBOT:
        this.width = 40;
        this.height = 36;
        this.speed = 2;
        this.health = 2;
        this.maxHealth = 2;
        break;
      default:
        this.width = 32;
        this.height = 32;
        this.speed = 1;
        this.health = 1;
        this.maxHealth = 1;
    }
  }

  update(platforms: Platform[], players: PlayerEntity[], deltaTime: number): void {
    if (!this.isActive) return;

    if (this.state === EnemyState.STUNNED) {
      this.updateStunned(deltaTime);
      return;
    }

    if (this.state === EnemyState.DEAD) {
      return;
    }

    this.updateAI(players);
    this.applyPhysics(platforms);
    this.updateAnimation(deltaTime);
  }

  private updateAI(players: PlayerEntity[]): void {
    const nearestPlayer = this.findNearestPlayer(players);
    
    if (nearestPlayer && this.type === EnemyType.BEE) {
      this.chasePlayer(nearestPlayer);
    } else {
      this.patrol();
    }
  }

  private findNearestPlayer(players: PlayerEntity[]): PlayerEntity | null {
    let nearest: PlayerEntity | null = null;
    let minDist = Infinity;

    for (const player of players) {
      if (!player.isActive) continue;
      const dist = distance(this.position, player.position);
      if (dist < minDist && dist < 200) {
        minDist = dist;
        nearest = player;
      }
    }

    return nearest;
  }

  private chasePlayer(player: PlayerEntity): void {
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.velocity.x = (dx / dist) * this.speed;
      this.velocity.y = (dy / dist) * this.speed;
      this.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    }

    this.state = EnemyState.CHASING;
  }

  private patrol(): void {
    if (this.type !== EnemyType.BEE) {
      if (this.position.x <= this.patrolStart.x) {
        this.direction = Direction.RIGHT;
      } else if (this.position.x >= this.patrolEnd.x) {
        this.direction = Direction.LEFT;
      }

      this.velocity.x = this.direction * this.speed;
    } else {
      this.velocity.y = Math.sin(Date.now() / 500) * 0.5;
      if (this.position.x <= this.patrolStart.x) {
        this.direction = Direction.RIGHT;
      } else if (this.position.x >= this.patrolEnd.x) {
        this.direction = Direction.LEFT;
      }
      this.velocity.x = this.direction * this.speed * 0.5;
    }

    this.state = EnemyState.WALKING;
  }

  private applyPhysics(platforms: Platform[]): void {
    if (this.type !== EnemyType.BEE) {
      this.velocity.y += GAME_CONFIG.gravity;
      this.velocity.y = Math.min(this.velocity.y, 10);
    }

    this.position.x += this.velocity.x;
    if (this.type !== EnemyType.BEE) {
      for (const platform of platforms) {
        this.resolveXCollision(platform);
      }
    }

    this.position.y += this.velocity.y;
    if (this.type !== EnemyType.BEE) {
      for (const platform of platforms) {
        this.resolveYCollision(platform);
      }
    }
  }

  private resolveXCollision(platform: Platform): void {
    if (!(this.position.x < platform.x + platform.width &&
      this.position.x + this.width > platform.x &&
      this.position.y < platform.y + platform.height &&
      this.position.y + this.height > platform.y)) {
      return;
    }
    if (this.velocity.x > 0) {
      this.position.x = platform.x - this.width;
    } else if (this.velocity.x < 0) {
      this.position.x = platform.x + platform.width;
    }
    this.velocity.x = 0;
  }

  private resolveYCollision(platform: Platform): void {
    if (!(this.position.x < platform.x + platform.width &&
      this.position.x + this.width > platform.x &&
      this.position.y < platform.y + platform.height &&
      this.position.y + this.height > platform.y)) {
      return;
    }

    const overlapTop = (this.position.y + this.height) - platform.y;
    const overlapBottom = (platform.y + platform.height) - this.position.y;

    if (overlapTop < overlapBottom) {
      this.position.y = platform.y - this.height;
      this.velocity.y = 0;
    } else {
      this.position.y = platform.y + platform.height;
      this.velocity.y = 0;
    }
  }

  private updateAnimation(deltaTime: number): void {
    this.animTimer += deltaTime;
    const frameDuration = 150;

    if (this.animTimer >= frameDuration) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  private updateStunned(deltaTime: number): void {
    this.stunTimer -= deltaTime;
    
    this.stunStars = [
      { angle: Date.now() / 200, dist: 15 },
      { angle: Date.now() / 200 + Math.PI * 2 / 3, dist: 15 },
      { angle: Date.now() / 200 + Math.PI * 4 / 3, dist: 15 }
    ];

    if (this.stunTimer <= 0) {
      this.state = EnemyState.WALKING;
      this.stunStars = [];
    }
  }

  takeDamage(amount: number = 1): void {
    this.health -= amount;
    
    if (this.health <= 0) {
      this.die();
    } else {
      this.stun();
    }
  }

  stun(): void {
    this.state = EnemyState.STUNNED;
    this.stunTimer = GAME_CONFIG.stunDuration;
    this.velocity = { x: 0, y: 0 };
  }

  die(): void {
    this.state = EnemyState.DEAD;
    this.isActive = false;
  }

  checkPlayerCollision(player: PlayerEntity): boolean {
    if (!this.isActive || this.state === EnemyState.DEAD) return false;
    return checkEntityCollision(this, player);
  }
}
