import { Item, ItemType, Vector2 } from '../types/game';

let itemIdCounter = 0;

export class ItemEntity implements Item {
  id: string;
  type: ItemType;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  isActive: boolean;
  collected: boolean;
  bobOffset: number;
  rotationAngle: number;

  constructor(type: ItemType, position: Vector2) {
    this.id = `item_${itemIdCounter++}`;
    this.type = type;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.isActive = true;
    this.collected = false;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.rotationAngle = 0;

    switch (type) {
      case ItemType.NUT:
        this.width = 20;
        this.height = 20;
        break;
      case ItemType.FLOWER:
        this.width = 24;
        this.height = 24;
        break;
      case ItemType.STAR:
        this.width = 28;
        this.height = 28;
        break;
      case ItemType.LIFE:
        this.width = 26;
        this.height = 26;
        break;
      default:
        this.width = 20;
        this.height = 20;
    }
  }

  update(deltaTime: number): void {
    if (this.collected || !this.isActive) return;

    this.bobOffset += deltaTime * 0.003;
    
    if (this.type === ItemType.STAR) {
      this.rotationAngle += deltaTime * 0.005;
    }
  }

  collect(): void {
    this.collected = true;
    this.isActive = false;
  }

  getBobAmount(): number {
    return Math.sin(this.bobOffset) * 4;
  }
}
