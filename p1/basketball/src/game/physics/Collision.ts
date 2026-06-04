import { Vector2 } from '../../types/game';
import { Vector2Math } from './Vector2';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export class Collision {
  static rectVsRect(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  static circleVsCircle(a: Circle, b: Circle): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < a.radius + b.radius;
  }

  static rectVsCircle(rect: Rect, circle: Circle): boolean {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy < circle.radius * circle.radius;
  }

  static pointVsRect(point: Vector2, rect: Rect): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  static pointVsCircle(point: Vector2, circle: Circle): boolean {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return dx * dx + dy * dy < circle.radius * circle.radius;
  }

  static getRectRectCollisionNormal(a: Rect, b: Rect): Vector2 {
    const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
    
    if (overlapX < overlapY) {
      return { x: a.x < b.x ? -1 : 1, y: 0 };
    } else {
      return { x: 0, y: a.y < b.y ? -1 : 1 };
    }
  }

  static getCircleCircleCollisionNormal(a: Circle, b: Circle): Vector2 {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return { x: 1, y: 0 };
    return { x: dx / distance, y: dy / distance };
  }

  static resolveCircleCircleCollision(
    a: Circle & { vx: number; vy: number; mass?: number },
    b: Circle & { vx: number; vy: number; mass?: number }
  ): void {
    const normal = Collision.getCircleCircleCollisionNormal(a, b);
    const relativeVelocity = { x: b.vx - a.vx, y: b.vy - a.vy };
    const velocityAlongNormal = Vector2Math.dot(relativeVelocity, normal);
    
    if (velocityAlongNormal > 0) return;
    
    const restitution = 0.6;
    const massA = a.mass || 1;
    const massB = b.mass || 1;
    const impulse = -(1 + restitution) * velocityAlongNormal / (1 / massA + 1 / massB);
    
    a.vx -= impulse * normal.x / massA;
    a.vy -= impulse * normal.y / massA;
    b.vx += impulse * normal.x / massB;
    b.vy += impulse * normal.y / massB;
    
    const overlap = a.radius + b.radius - Vector2Math.distance(
      { x: a.x, y: a.y },
      { x: b.x, y: b.y }
    );
    
    if (overlap > 0) {
      const separation = overlap / 2;
      a.x -= normal.x * separation;
      a.y -= normal.y * separation;
      b.x += normal.x * separation;
      b.y += normal.y * separation;
    }
  }

  static resolveRectCircleCollision(rect: Rect, circle: Circle & { vx: number; vy: number }): void {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    const normalX = dx / distance;
    const normalY = dy / distance;
    
    const velocityAlongNormal = circle.vx * normalX + circle.vy * normalY;
    
    if (velocityAlongNormal < 0) {
      const restitution = 0.8;
      circle.vx -= (1 + restitution) * velocityAlongNormal * normalX;
      circle.vy -= (1 + restitution) * velocityAlongNormal * normalY;
    }
    
    const overlap = circle.radius - distance;
    if (overlap > 0) {
      circle.x += normalX * overlap;
      circle.y += normalY * overlap;
    }
  }
}
