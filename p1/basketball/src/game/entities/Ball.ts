import { BallState, SpecialType, BALL_CONFIG, GAME_CONFIG, COURT_CONFIG } from '../../types/game';
import { Entity } from './Entity';
import { Physics } from '../physics/Physics';

export class Ball extends Entity {
  state: BallState;
  radius: number = BALL_CONFIG.RADIUS;

  constructor(x: number, y: number) {
    super('ball', x, y, BALL_CONFIG.RADIUS * 2, BALL_CONFIG.RADIUS * 2);
    this.state = {
      position: this.position,
      velocity: this.velocity,
      isHeld: false,
      holderId: null,
      isSpecialShot: false,
      specialType: null,
      rotation: 0,
      isInTruck: false,
    };
  }

  update(_deltaTime: number): void {
    this.state.position = this.position;
    this.state.velocity = this.velocity;

    if (this.state.isHeld || this.state.isInTruck) {
      return;
    }

    if (this.state.isSpecialShot) {
      this.updateSpecialShot();
    } else {
      Physics.applyGravity(this.velocity);
      Physics.applyFriction(this.velocity, this.isGrounded());
    }

    Physics.clampVelocity(this.velocity, 25);
    Physics.updatePosition(this.position, this.velocity);

    this.state.rotation += this.velocity.x * 0.05;

    Physics.checkGroundCollision(this.position, this.velocity, this.radius);
    Physics.checkBoundaryCollision(this.position, this.velocity, this.radius * 2);

    if (!this.state.isSpecialShot) {
      for (const hoopX of [COURT_CONFIG.LEFT_HOOP_X, COURT_CONFIG.RIGHT_HOOP_X]) {
        const result = Physics.checkHoopCollision(
          this.position,
          this.velocity,
          hoopX,
          COURT_CONFIG.HOOP_Y
        );
        
        if (result.hitRim || result.hitBackboard) {
          break;
        }
      }
    }
  }

  private updateSpecialShot(): void {
    switch (this.state.specialType) {
      case 'meteor':
        this.velocity.x *= 1.02;
        this.velocity.y += 0.2;
        break;
      case 'tornado':
        this.position.y -= 0.5;
        this.velocity.x *= 0.995;
        break;
      case 'dunk':
        this.velocity.y = Math.min(this.velocity.y + 2, 20);
        break;
    }
  }

  isGrounded(): boolean {
    return this.position.y + this.radius >= GAME_CONFIG.GROUND_Y - 1;
  }

  setHeld(holderId: string | null): void {
    this.state.isHeld = holderId !== null;
    this.state.holderId = holderId;
    if (holderId) {
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.state.isSpecialShot = false;
      this.state.specialType = null;
    }
  }

  shoot(velocity: { x: number; y: number }, isSpecial: boolean = false, specialType?: SpecialType): void {
    this.velocity.x = velocity.x;
    this.velocity.y = velocity.y;
    this.state.isHeld = false;
    this.state.holderId = null;
    this.state.isSpecialShot = isSpecial;
    this.state.specialType = specialType || null;
  }

  reset(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.state.isHeld = false;
    this.state.holderId = null;
    this.state.isSpecialShot = false;
    this.state.specialType = null;
    this.state.isInTruck = false;
    this.state.rotation = 0;
  }

  checkScore(): 'red' | 'blue' | null {
    if (this.state.isSpecialShot && this.state.specialType === 'tornado') {
      if (this.position.y > COURT_CONFIG.HOOP_Y && this.position.y < COURT_CONFIG.HOOP_Y + 50) {
        if (this.position.x > COURT_CONFIG.LEFT_HOOP_X - 40 && this.position.x < COURT_CONFIG.LEFT_HOOP_X + 40) {
          return 'blue';
        }
        if (this.position.x > COURT_CONFIG.RIGHT_HOOP_X - 40 && this.position.x < COURT_CONFIG.RIGHT_HOOP_X + 40) {
          return 'red';
        }
      }
      return null;
    }

    if (this.position.y > COURT_CONFIG.HOOP_Y && this.position.y < COURT_CONFIG.HOOP_Y + 20) {
      if (this.position.x > COURT_CONFIG.LEFT_HOOP_X - 30 && this.position.x < COURT_CONFIG.LEFT_HOOP_X + 30) {
        if (this.velocity.y > 0 || this.state.isSpecialShot) {
          return 'blue';
        }
      }
      if (this.position.x > COURT_CONFIG.RIGHT_HOOP_X - 30 && this.position.x < COURT_CONFIG.RIGHT_HOOP_X + 30) {
        if (this.velocity.y > 0 || this.state.isSpecialShot) {
          return 'red';
        }
      }
    }
    return null;
  }

  isThreePointer(scoringTeam: 'red' | 'blue'): boolean {
    const hoopX = scoringTeam === 'red' ? COURT_CONFIG.RIGHT_HOOP_X : COURT_CONFIG.LEFT_HOOP_X;
    const shotX = this.position.x - this.velocity.x * 10;
    return Math.abs(shotX - hoopX) > COURT_CONFIG.THREE_POINT_LINE;
  }
}
