import { ItemState, ItemType, ITEM_CONFIG, COURT_CONFIG, GAME_CONFIG } from '../../types/game';
import { Entity } from './Entity';

export class Item extends Entity {
  state: ItemState;
  type: ItemType;

  constructor(id: string, type: ItemType, x: number, y: number) {
    super(id, x, y, 32, 32);
    this.type = type;
    this.state = {
      id,
      type,
      position: this.position,
      isPickedUp: false,
      duration: ITEM_CONFIG[type].duration,
      bobOffset: 0,
    };
  }

  update(_deltaTime: number): void {
    if (this.state.isPickedUp) return;
    
    this.state.position = this.position;
    this.state.bobOffset = Math.sin(Date.now() * 0.005) * 5;
  }

  pickup(): ItemType | null {
    if (this.state.isPickedUp) return null;
    this.state.isPickedUp = true;
    this.active = false;
    return this.type;
  }

  getDisplayPosition() {
    return {
      x: this.position.x,
      y: this.position.y + this.state.bobOffset,
    };
  }

  static createRandom(id: string): Item {
    const types: ItemType[] = ['speed', 'jump', 'magnet', 'pan', 'banana'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = COURT_CONFIG.LEFT_BOUND + 100 + Math.random() * (COURT_CONFIG.RIGHT_BOUND - COURT_CONFIG.LEFT_BOUND - 200);
    const y = GAME_CONFIG.GROUND_Y - 40;
    return new Item(id, type, x, y);
  }
}
