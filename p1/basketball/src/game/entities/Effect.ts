import { EffectState } from '../../types/game';
import { Entity } from './Entity';

export class Effect extends Entity {
  state: EffectState;

  constructor(
    id: string,
    type: EffectState['type'],
    x: number,
    y: number,
    size: number = 20,
    color: string = '#FFAA33',
    text?: string
  ) {
    super(id, x, y, size, size);
    this.state = {
      id,
      type,
      position: this.position,
      velocity: { x: 0, y: 0 },
      life: 60,
      maxLife: 60,
      size,
      color,
      text,
    };
  }

  update(_deltaTime: number): void {
    this.state.position = this.position;
    this.state.life--;
    
    switch (this.state.type) {
      case 'fire':
        this.position.y -= 1;
        this.state.size += 0.5;
        break;
      case 'spark':
        this.position.x += this.state.velocity.x;
        this.position.y += this.state.velocity.y;
        this.state.velocity.y += 0.3;
        break;
      case 'smoke':
        this.position.y -= 0.5;
        this.state.size += 0.3;
        break;
      case 'star':
        this.position.y -= 2;
        this.state.size += 0.2;
        break;
      case 'tornado':
        this.state.size += 1;
        break;
      case 'meteor':
        this.position.x += this.state.velocity.x;
        this.position.y += this.state.velocity.y;
        this.state.size += 2;
        break;
      case 'text':
        this.position.y -= 1.5;
        break;
    }
    
    if (this.state.life <= 0) {
      this.active = false;
    }
  }

  getAlpha(): number {
    return this.state.life / this.state.maxLife;
  }

  static createFire(x: number, y: number): Effect {
    return new Effect(`fire-${Date.now()}-${Math.random()}`, 'fire', x, y, 30, '#FF4400');
  }

  static createSpark(x: number, y: number): Effect {
    const effect = new Effect(`spark-${Date.now()}-${Math.random()}`, 'spark', x, y, 8, '#FFFF00');
    effect.state.velocity = {
      x: (Math.random() - 0.5) * 8,
      y: -Math.random() * 5 - 2,
    };
    effect.state.life = 30;
    effect.state.maxLife = 30;
    return effect;
  }

  static createSmoke(x: number, y: number): Effect {
    return new Effect(`smoke-${Date.now()}-${Math.random()}`, 'smoke', x, y, 20, '#888888');
  }

  static createStar(x: number, y: number, color: string = '#FFD700'): Effect {
    return new Effect(`star-${Date.now()}-${Math.random()}`, 'star', x, y, 15, color);
  }

  static createText(x: number, y: number, text: string, color: string = '#FFFFFF'): Effect {
    const effect = new Effect(`text-${Date.now()}-${Math.random()}`, 'text', x, y, 20, color, text);
    effect.state.life = 90;
    effect.state.maxLife = 90;
    return effect;
  }

  static createMeteor(x: number, y: number, vx: number, vy: number): Effect {
    const effect = new Effect(`meteor-${Date.now()}-${Math.random()}`, 'meteor', x, y, 40, '#FF6600');
    effect.state.velocity = { x: vx, y: vy };
    effect.state.life = 120;
    effect.state.maxLife = 120;
    return effect;
  }

  static createTornado(x: number, y: number): Effect {
    const effect = new Effect(`tornado-${Date.now()}-${Math.random()}`, 'tornado', x, y, 50, '#88CCFF');
    effect.state.life = 180;
    effect.state.maxLife = 180;
    return effect;
  }
}
