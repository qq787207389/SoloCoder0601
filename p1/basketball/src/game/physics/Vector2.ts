import { Vector2 } from '../../types/game';

export class Vector2Math {
  static create(x: number = 0, y: number = 0): Vector2 {
    return { x, y };
  }

  static add(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  static subtract(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  static multiply(v: Vector2, scalar: number): Vector2 {
    return { x: v.x * scalar, y: v.y * scalar };
  }

  static divide(v: Vector2, scalar: number): Vector2 {
    if (scalar === 0) return { x: 0, y: 0 };
    return { x: v.x / scalar, y: v.y / scalar };
  }

  static magnitude(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  static normalize(v: Vector2): Vector2 {
    const mag = Vector2Math.magnitude(v);
    if (mag === 0) return { x: 0, y: 0 };
    return Vector2Math.divide(v, mag);
  }

  static distance(a: Vector2, b: Vector2): number {
    return Vector2Math.magnitude(Vector2Math.subtract(a, b));
  }

  static dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  }

  static reflect(v: Vector2, normal: Vector2): Vector2 {
    const dot = Vector2Math.dot(v, normal);
    return {
      x: v.x - 2 * dot * normal.x,
      y: v.y - 2 * dot * normal.y,
    };
  }

  static rotate(v: Vector2, angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
    };
  }

  static clamp(v: Vector2, min: Vector2, max: Vector2): Vector2 {
    return {
      x: Math.max(min.x, Math.min(max.x, v.x)),
      y: Math.max(min.y, Math.min(max.y, v.y)),
    };
  }

  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  static random(minX: number, maxX: number, minY: number, maxY: number): Vector2 {
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    };
  }
}
