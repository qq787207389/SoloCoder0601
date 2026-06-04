import { Vector2 } from '../../types/game';
import { GAME_CONFIG, BALL_CONFIG, PLAYER_CONFIG, COURT_CONFIG } from '../../types/game';
import { Vector2Math } from './Vector2';

export class Physics {
  static gravity = GAME_CONFIG.GRAVITY;
  static groundY = GAME_CONFIG.GROUND_Y;

  static updatePosition(pos: Vector2, vel: Vector2, dt: number = 1): void {
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
  }

  static applyGravity(vel: Vector2, scale: number = 1): void {
    vel.y += Physics.gravity * scale;
  }

  static applyFriction(vel: Vector2, isGrounded: boolean): void {
    if (isGrounded) {
      vel.x *= BALL_CONFIG.FRICTION;
    } else {
      vel.x *= BALL_CONFIG.AIR_RESISTANCE;
      vel.y *= BALL_CONFIG.AIR_RESISTANCE;
    }
  }

  static checkGroundCollision(pos: Vector2, vel: Vector2, radius: number = 0): boolean {
    if (pos.y + radius >= Physics.groundY) {
      pos.y = Physics.groundY - radius;
      if (vel.y > 0) {
        vel.y = -vel.y * BALL_CONFIG.BOUNCE;
        if (Math.abs(vel.y) < 1) vel.y = 0;
      }
      return true;
    }
    return false;
  }

  static checkBoundaryCollision(pos: Vector2, vel: Vector2, width: number = 0): void {
    if (pos.x - width / 2 < COURT_CONFIG.LEFT_BOUND) {
      pos.x = COURT_CONFIG.LEFT_BOUND + width / 2;
      vel.x = Math.abs(vel.x) * 0.5;
    }
    if (pos.x + width / 2 > COURT_CONFIG.RIGHT_BOUND) {
      pos.x = COURT_CONFIG.RIGHT_BOUND - width / 2;
      vel.x = -Math.abs(vel.x) * 0.5;
    }
    if (pos.y < 0) {
      pos.y = 0;
      vel.y = Math.abs(vel.y) * 0.5;
    }
  }

  static checkHoopCollision(
    ballPos: Vector2,
    ballVel: Vector2,
    hoopX: number,
    hoopY: number
  ): { scored: boolean; hitRim: boolean; hitBackboard: boolean } {
    const hoopWidth = COURT_CONFIG.HOOP_WIDTH;
    const hoopLeft = hoopX - hoopWidth / 2;
    const hoopRight = hoopX + hoopWidth / 2;
    const hoopTop = hoopY;
    const hoopBottom = hoopY + 10;
    
    const scored = 
      ballPos.x > hoopLeft && 
      ballPos.x < hoopRight && 
      ballPos.y > hoopTop && 
      ballPos.y < hoopBottom &&
      ballVel.y > 0;
    
    const hitRim = !scored && 
      ballPos.y > hoopY - 20 && 
      ballPos.y < hoopY + 20 &&
      (Math.abs(ballPos.x - hoopLeft) < 15 || Math.abs(ballPos.x - hoopRight) < 15);
    
    const hitBackboard = 
      ballPos.x > hoopX - 60 && 
      ballPos.x < hoopX + 60 &&
      ballPos.y > hoopY - 60 && 
      ballPos.y < hoopY + 40 &&
      Math.abs(ballPos.x - (hoopX - 50)) < 15;
    
    if (hitRim) {
      const rimX = Math.abs(ballPos.x - hoopLeft) < 15 ? hoopLeft : hoopRight;
      const dx = ballPos.x - rimX;
      const dy = ballPos.y - hoopY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        ballVel.x = (dx / dist) * Math.abs(ballVel.x) * 0.8;
        ballVel.y = (dy / dist) * Math.abs(ballVel.y) * 0.8;
      }
    }
    
    if (hitBackboard) {
      ballVel.x = -ballVel.x * 0.8;
    }
    
    return { scored, hitRim, hitBackboard };
  }

  static calculateJumpVelocity(jumpPower: number): number {
    return -Math.sqrt(2 * Physics.gravity * jumpPower);
  }

  static calculateShotTrajectory(
    startPos: Vector2,
    targetPos: Vector2,
    power: number,
    isDunk: boolean = false
  ): Vector2 {
    if (isDunk) {
      const direction = Vector2Math.normalize(Vector2Math.subtract(targetPos, startPos));
      return Vector2Math.multiply(direction, 15);
    }
    
    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const baseAngle = Math.atan2(dy - 50, dx);
    const angleAdjustment = Math.min(distance / 400, 0.5) * 0.3;
    const angle = baseAngle - angleAdjustment;
    
    const baseSpeed = 10 + power * 8;
    const distanceFactor = Math.min(distance / 500, 1);
    const speed = baseSpeed * (0.8 + distanceFactor * 0.4);
    
    return {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed - 5,
    };
  }

  static calculatePassTrajectory(
    startPos: Vector2,
    targetPos: Vector2,
    power: number = 1
  ): Vector2 {
    const direction = Vector2Math.normalize(Vector2Math.subtract(targetPos, startPos));
    const speed = PLAYER_CONFIG.PASS_SPEED * power;
    return Vector2Math.multiply(direction, speed);
  }

  static knockback(
    pos: Vector2,
    vel: Vector2,
    fromPos: Vector2,
    strength: number,
    upward: number = 8
  ): void {
    const direction = Vector2Math.normalize(Vector2Math.subtract(pos, fromPos));
    vel.x = direction.x * strength;
    vel.y = -upward;
  }

  static clampVelocity(vel: Vector2, maxSpeed: number): void {
    const speed = Vector2Math.magnitude(vel);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      vel.x *= scale;
      vel.y *= scale;
    }
  }
}
