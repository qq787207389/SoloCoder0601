import type { Ball, Pin } from './types';
import { CONFIG } from './types';
import { GameStateManager } from './gameState';

export class PhysicsEngine {
  private gravity = 9.81;
  private dt = 1 / 60;
  private gameState: GameStateManager;

  constructor(gameState: GameStateManager) {
    this.gameState = gameState;
  }

  updateBall(): void {
    const ball = this.gameState.ball;
    if (!ball.isRolling) return;

    const friction = this.gameState.getLaneFriction();
    const spinEffectiveness = this.gameState.getSpinEffectiveness();

    const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.z ** 2);
    
    if (speed > 0) {
      ball.velocity.x -= ball.velocity.x * friction * this.dt * 10;
      ball.velocity.z -= ball.velocity.z * friction * this.dt * 10;

      const spinForce = ball.spin * speed * spinEffectiveness * 0.5;
      const perpendicularX = ball.velocity.z / speed;
      const perpendicularZ = -ball.velocity.x / speed;
      
      if (ball.position.z > 10) {
        ball.velocity.x += perpendicularX * spinForce * this.dt;
        ball.velocity.z += perpendicularZ * spinForce * this.dt;
      }
    }

    ball.position.x += ball.velocity.x * this.dt;
    ball.position.z += ball.velocity.z * this.dt;

    const halfLane = CONFIG.laneWidth / 2;
    if (ball.position.x < -halfLane || ball.position.x > halfLane) {
      ball.velocity.y = -5;
      ball.isRolling = false;
    }

    if (ball.position.z > CONFIG.pinDeckZ + 1) {
      ball.isRolling = false;
    }

    if (speed < 0.1 && ball.position.z > CONFIG.pinDeckZ - 1) {
      ball.isRolling = false;
    }

    this.checkCollisions();
  }

  checkCollisions(): void {
    const ball = this.gameState.ball;
    
    this.gameState.pins.forEach(pin => {
      if (!pin.isStanding) return;

      const dx = ball.position.x - pin.position.x;
      const dz = ball.position.z - pin.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const minDistance = ball.radius + CONFIG.pinRadius;

      if (distance < minDistance) {
        this.handleBallPinCollision(ball, pin, dx, dz, distance);
      }
    });

    this.checkPinCollisions();
  }

  handleBallPinCollision(ball: Ball, pin: Pin, dx: number, dz: number, distance: number): void {
    const nx = dx / distance;
    const nz = dz / distance;

    const relativeVelocityX = ball.velocity.x;
    const relativeVelocityZ = ball.velocity.z;
    const impactVelocity = relativeVelocityX * nx + relativeVelocityZ * nz;

    if (impactVelocity > 0) {
      const massRatio = 0.15;
      const impulse = impactVelocity * massRatio;

      pin.velocity.x += nx * impulse * 20;
      pin.velocity.z += nz * impulse * 20;
      pin.velocity.y = 2;

      pin.angularVelocity.x = (Math.random() - 0.5) * 15;
      pin.angularVelocity.z = (Math.random() - 0.5) * 15;

      pin.isStanding = false;
      this.gameState.pinsKnockedThisRoll.add(pin.id);
    }
  }

  checkPinCollisions(): void {
    const pins = this.gameState.pins;

    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const pinA = pins[i];
        const pinB = pins[j];

        if (pinA.isStanding && pinB.isStanding) continue;
        if (pinA.hasFallen && pinB.hasFallen) continue;

        const dx = pinA.position.x - pinB.position.x;
        const dz = pinA.position.z - pinB.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const minDistance = CONFIG.pinRadius * 2;

        if (distance < minDistance && distance > 0) {
          this.handlePinPinCollision(pinA, pinB, dx, dz, distance);
        }
      }
    }
  }

  handlePinPinCollision(pinA: Pin, pinB: Pin, dx: number, dz: number, distance: number): void {
    const nx = dx / distance;
    const nz = dz / distance;

    const relVelX = pinA.velocity.x - pinB.velocity.x;
    const relVelZ = pinA.velocity.z - pinB.velocity.z;
    const impactVelocity = relVelX * nx + relVelZ * nz;

    if (impactVelocity > 0) {
      const restitution = 0.6;
      const impulse = impactVelocity * restitution;

      pinA.velocity.x -= nx * impulse * 0.5;
      pinA.velocity.z -= nz * impulse * 0.5;
      pinB.velocity.x += nx * impulse * 0.5;
      pinB.velocity.z += nz * impulse * 0.5;

      if (pinA.isStanding) {
        pinA.isStanding = false;
        pinA.velocity.y = 1.5;
        pinA.angularVelocity.x = (Math.random() - 0.5) * 10;
        pinA.angularVelocity.z = (Math.random() - 0.5) * 10;
        this.gameState.pinsKnockedThisRoll.add(pinA.id);
      }
      if (pinB.isStanding) {
        pinB.isStanding = false;
        pinB.velocity.y = 1.5;
        pinB.angularVelocity.x = (Math.random() - 0.5) * 10;
        pinB.angularVelocity.z = (Math.random() - 0.5) * 10;
        this.gameState.pinsKnockedThisRoll.add(pinB.id);
      }
    }
  }

  updatePins(): boolean {
    let anyMoving = false;

    this.gameState.pins.forEach(pin => {
      if (pin.hasFallen) return;

      if (!pin.isStanding) {
        pin.velocity.y -= this.gravity * this.dt;

        pin.position.x += pin.velocity.x * this.dt;
        pin.position.y += pin.velocity.y * this.dt;
        pin.position.z += pin.velocity.z * this.dt;

        pin.rotation.x += pin.angularVelocity.x * this.dt;
        pin.rotation.z += pin.angularVelocity.z * this.dt;

        if (pin.position.y < CONFIG.pinHeight / 2) {
          pin.position.y = CONFIG.pinHeight / 2;
          pin.velocity.y *= -0.3;
          pin.velocity.x *= 0.8;
          pin.velocity.z *= 0.8;
          pin.angularVelocity.x *= 0.9;
          pin.angularVelocity.z *= 0.9;
        }

        pin.velocity.x *= 0.99;
        pin.velocity.z *= 0.99;

        const totalRotation = Math.abs(pin.rotation.x) + Math.abs(pin.rotation.z);
        if (totalRotation > 1.5) {
          pin.fallTimer += this.dt;
          if (pin.fallTimer > 1.5) {
            pin.hasFallen = true;
          }
        }

        const speed = Math.sqrt(pin.velocity.x ** 2 + pin.velocity.z ** 2);
        if (speed > 0.01 || Math.abs(pin.velocity.y) > 0.01) {
          anyMoving = true;
        }
      }
    });

    return anyMoving;
  }
}
