import { Player, PlayerState, Direction, Carryable, InputState, Vector2 } from '../types/game';
import { GAME_CONFIG, PLAYER_WIDTH, PLAYER_HEIGHT } from '../config/constants';
import { Platform } from '../types/game';

export class PlayerEntity implements Player {
  id: string;
  playerId: number;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  isActive: boolean;
  state: PlayerState;
  direction: Direction;
  lives: number;
  health: number;
  maxHealth: number;
  isInvincible: boolean;
  invincibleTimer: number;
  carriedItem: Carryable | null;
  struggleTimer: number;
  animFrame: number;
  animTimer: number;
  isOnGround: boolean;
  color: string;
  colorLight: string;
  tailAngle: number;
  shakeAmount: number;
  struggleProgress: number;

  constructor(playerId: number, startPosition: Vector2, color: string, colorLight: string) {
    this.id = `player_${playerId}`;
    this.playerId = playerId;
    this.position = { ...startPosition };
    this.velocity = { x: 0, y: 0 };
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.isActive = true;
    this.state = PlayerState.IDLE;
    this.direction = Direction.RIGHT;
    this.lives = 3;
    this.health = 100;
    this.maxHealth = 100;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.carriedItem = null;
    this.struggleTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.isOnGround = false;
    this.color = color;
    this.colorLight = colorLight;
    this.tailAngle = 0;
    this.shakeAmount = 0;
    this.struggleProgress = 0;
  }

  update(input: InputState, platforms: Platform[], deltaTime: number): void {
    if (this.state === PlayerState.BEING_CARRIED) {
      this.updateBeingCarried(input, deltaTime);
      return;
    }

    if (this.state === PlayerState.STUNNED) {
      this.updateStunned(deltaTime);
      return;
    }

    this.updateMovement(input);
    this.applyGravity();
    this.handlePlatformCollisions(platforms);
    this.updateState(input);
    this.updateAnimation(deltaTime);
    this.updateInvincibility(deltaTime);

    if (this.carriedItem) {
      this.updateCarriedItem();
    }
  }

  private updateMovement(input: InputState): void {
    if (this.state === PlayerState.THROWING) {
      return;
    }

    if (input.left) {
      this.velocity.x = this.state === PlayerState.LIFTING ? -GAME_CONFIG.playerSpeed * 0.3 : -GAME_CONFIG.playerSpeed;
      this.direction = Direction.LEFT;
    } else if (input.right) {
      this.velocity.x = this.state === PlayerState.LIFTING ? GAME_CONFIG.playerSpeed * 0.3 : GAME_CONFIG.playerSpeed;
      this.direction = Direction.RIGHT;
    } else {
      this.velocity.x *= 0.8;
      if (Math.abs(this.velocity.x) < 0.1) {
        this.velocity.x = 0;
      }
    }

    if (input.jump && this.isOnGround) {
      this.velocity.y = -GAME_CONFIG.jumpForce;
      this.isOnGround = false;
    }
  }

  private applyGravity(): void {
    this.velocity.y += GAME_CONFIG.gravity;
    this.velocity.y = Math.min(this.velocity.y, 15);
  }

  private handlePlatformCollisions(platforms: Platform[]): void {
    this.position.x += this.velocity.x;
    for (const platform of platforms) {
      this.resolveXCollision(platform);
    }

    this.position.y += this.velocity.y;
    this.isOnGround = false;
    for (const platform of platforms) {
      const side = this.resolveYCollision(platform);
      if (side === 'top') {
        this.isOnGround = true;
      }
    }
  }

  private resolveXCollision(platform: Platform): void {
    const entityRect = { x: this.position.x, y: this.position.y, width: this.width, height: this.height };
    if (!(entityRect.x < platform.x + platform.width &&
      entityRect.x + entityRect.width > platform.x &&
      entityRect.y < platform.y + platform.height &&
      entityRect.y + entityRect.height > platform.y)) {
      return;
    }
    if (this.velocity.x > 0) {
      this.position.x = platform.x - this.width;
    } else if (this.velocity.x < 0) {
      this.position.x = platform.x + platform.width;
    }
    this.velocity.x = 0;
  }

  private resolveYCollision(platform: Platform): 'top' | 'bottom' | null {
    if (!(this.position.x < platform.x + platform.width &&
      this.position.x + this.width > platform.x &&
      this.position.y < platform.y + platform.height &&
      this.position.y + this.height > platform.y)) {
      return null;
    }

    const overlapTop = (this.position.y + this.height) - platform.y;
    const overlapBottom = (platform.y + platform.height) - this.position.y;

    if (overlapTop < overlapBottom) {
      this.position.y = platform.y - this.height;
      this.velocity.y = 0;
      return 'top';
    } else {
      this.position.y = platform.y + platform.height;
      this.velocity.y = 0;
      return 'bottom';
    }
  }

  private updateState(_input: InputState): void {
    if (this.state === PlayerState.LIFTING) {
      this.animTimer += 16;
      if (this.animTimer > 300) {
        this.state = PlayerState.CARRYING;
        this.animTimer = 0;
      }
      return;
    }

    if (this.state === PlayerState.THROWING) {
      this.animTimer += 16;
      if (this.animTimer > 200) {
        this.state = PlayerState.IDLE;
        this.animTimer = 0;
      }
      return;
    }

    if (this.carriedItem) {
      this.state = PlayerState.CARRYING;
      this.shakeAmount = 2;
    } else if (!this.isOnGround) {
      this.state = PlayerState.JUMPING;
      this.shakeAmount = 0;
    } else if (Math.abs(this.velocity.x) > 0.5) {
      this.state = PlayerState.WALKING;
      this.shakeAmount = 0;
    } else {
      this.state = PlayerState.IDLE;
      this.shakeAmount = 0;
    }
  }

  private updateAnimation(deltaTime: number): void {
    this.animTimer += deltaTime;
    const frameDuration = this.state === PlayerState.WALKING ? 100 : 200;

    if (this.animTimer >= frameDuration) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    if (this.state === PlayerState.WALKING) {
      this.tailAngle = Math.sin(Date.now() / 100) * 0.3;
    } else {
      this.tailAngle = Math.sin(Date.now() / 300) * 0.1;
    }
  }

  private updateInvincibility(deltaTime: number): void {
    if (this.isInvincible) {
      this.invincibleTimer -= deltaTime;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
      }
    }
  }

  private updateCarriedItem(): void {
    if (!this.carriedItem) return;

    this.carriedItem.position.x = this.position.x + this.width / 2 - this.carriedItem.width / 2;
    this.carriedItem.position.y = this.position.y - this.carriedItem.height - 5;
  }

  private updateStunned(deltaTime: number): void {
    this.struggleTimer -= deltaTime;
    if (this.struggleTimer <= 0) {
      this.state = PlayerState.IDLE;
    }
  }

  private updateBeingCarried(input: InputState, deltaTime: number): void {
    this.struggleProgress += deltaTime * 0.001;
    
    if (input.left || input.right || input.jump || input.action) {
      this.struggleProgress += deltaTime * 0.003;
    }

    if (this.struggleProgress >= 1) {
      this.struggleProgress = 0;
      this.state = PlayerState.IDLE;
    }
  }

  liftItem(item: Carryable): boolean {
    if (this.carriedItem || this.state === PlayerState.LIFTING || this.state === PlayerState.THROWING) {
      return false;
    }

    this.state = PlayerState.LIFTING;
    this.animTimer = 0;
    this.carriedItem = item;
    item.isCarried = true;
    item.carrierId = this.id;
    item.isThrown = false;
    return true;
  }

  throwItem(): Carryable | null {
    if (!this.carriedItem || this.state === PlayerState.THROWING) {
      return null;
    }

    const item = this.carriedItem;
    this.state = PlayerState.THROWING;
    this.animTimer = 0;
    this.carriedItem = null;
    item.isCarried = false;
    item.carrierId = null;
    item.isThrown = true;
    item.throwVelocity = {
      x: this.direction * GAME_CONFIG.throwForce,
      y: -GAME_CONFIG.throwForce * 0.6
    };
    item.velocity = { ...item.throwVelocity };

    if ('throwGraceTimer' in item) {
      (item as any).throwGraceTimer = 150;
    }

    return item;
  }

  takeDamage(amount: number): void {
    if (this.isInvincible) return;

    this.health -= amount;
    this.isInvincible = true;
    this.invincibleTimer = GAME_CONFIG.invincibleDuration;

    if (this.health <= 0) {
      this.loseLife();
    }
  }

  loseLife(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.isActive = false;
    } else {
      this.health = this.maxHealth;
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  addLife(): void {
    this.lives++;
  }

  stun(duration: number): void {
    this.state = PlayerState.STUNNED;
    this.struggleTimer = duration;
  }
}
