import { Item } from '../entities/Item';
import { Player } from '../entities/Player';
import { ItemType, COURT_CONFIG, GAME_CONFIG, ITEM_CONFIG } from '../../types/game';
import { Vector2Math } from '../physics/Vector2';
import { Effect } from '../entities/Effect';

export class ItemSystem {
  private items: Item[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 600;
  private maxItems: number = 3;
  private bananaPeels: { position: { x: number; y: number }; active: boolean }[] = [];

  update(players: Player[], deltaTime: number): Effect[] {
    const effects: Effect[] = [];
    
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval && this.items.filter(i => i.active).length < this.maxItems) {
      this.spawnItem();
      this.spawnTimer = 0;
    }

    this.items.forEach(item => {
      if (!item.active) return;
      item.update(deltaTime);
      
      players.forEach(player => {
        if (player.state.isKnockedOut) return;
        
        const distance = Vector2Math.distance(player.position, item.position);
        if (distance < 40) {
          const itemType = item.pickup();
          if (itemType) {
            if (itemType === 'banana') {
              this.placeBananaPeel(player.position.x, player.position.y);
              effects.push(Effect.createText(player.position.x, player.position.y - 60, '放置香蕉皮!', ITEM_CONFIG.banana.color));
            } else {
              player.pickupItem(itemType);
              effects.push(Effect.createText(player.position.x, player.position.y - 60, this.getItemName(itemType), ITEM_CONFIG[itemType].color));
            }
            effects.push(Effect.createStar(player.position.x, player.position.y - 40, ITEM_CONFIG[itemType].color));
          }
        }
      });
    });

    this.bananaPeels.forEach(peel => {
      if (!peel.active) return;
      
      players.forEach(player => {
        if (player.state.isKnockedOut) return;
        
        const distance = Vector2Math.distance(player.position, peel.position);
        if (distance < 30 && !player.state.isJumping) {
          player.state.isKnockedOut = true;
          player.state.knockoutTimer = 45;
          player.state.animation = 'knockedout';
          player.velocity.x = (Math.random() - 0.5) * 10;
          player.velocity.y = -8;
          peel.active = false;
          
          effects.push(Effect.createText(player.position.x, player.position.y - 60, '滑倒了!', '#FFFF00'));
          effects.push(Effect.createSpark(player.position.x, player.position.y));
        }
      });
    });

    this.items = this.items.filter(i => i.active);
    this.bananaPeels = this.bananaPeels.filter(p => p.active);
    
    return effects;
  }

  private spawnItem(): void {
    const types: ItemType[] = ['speed', 'jump', 'magnet', 'pan', 'banana'];
    const weights = [3, 3, 2, 2, 2];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let type: ItemType = 'speed';
    
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        type = types[i];
        break;
      }
    }
    
    const x = COURT_CONFIG.LEFT_BOUND + 100 + Math.random() * (COURT_CONFIG.RIGHT_BOUND - COURT_CONFIG.LEFT_BOUND - 200);
    const y = GAME_CONFIG.GROUND_Y - 40;
    
    this.items.push(new Item(`item-${Date.now()}-${Math.random()}`, type, x, y));
  }

  private placeBananaPeel(x: number, _y: number): void {
    this.bananaPeels.push({
      position: { x, y: GAME_CONFIG.GROUND_Y - 10 },
      active: true,
    });
  }

  private getItemName(type: ItemType): string {
    const names: Record<ItemType, string> = {
      speed: '加速鞋带!',
      jump: '弹跳饮料!',
      magnet: '磁铁手套!',
      pan: '平底锅盖!',
      banana: '香蕉皮!',
    };
    return names[type];
  }

  getItems(): Item[] {
    return this.items.filter(i => i.active);
  }

  getBananaPeels(): { position: { x: number; y: number }; active: boolean }[] {
    return this.bananaPeels.filter(p => p.active);
  }

  reset(): void {
    this.items = [];
    this.bananaPeels = [];
    this.spawnTimer = 0;
  }
}
