import { Vector2 } from '../../types/game';
import { Vector2Math } from '../physics/Vector2';

export abstract class Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  active: boolean = true;

  constructor(id: string, x: number, y: number, width: number, height: number) {
    this.id = id;
    this.position = Vector2Math.create(x, y);
    this.velocity = Vector2Math.create(0, 0);
    this.width = width;
    this.height = height;
  }

  abstract update(deltaTime: number): void;

  getBounds() {
    return {
      left: this.position.x - this.width / 2,
      right: this.position.x + this.width / 2,
      top: this.position.y - this.height,
      bottom: this.position.y,
    };
  }

  distanceTo(other: Entity): number {
    return Vector2Math.distance(this.position, other.position);
  }
}
