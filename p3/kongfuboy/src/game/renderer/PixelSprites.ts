export type SpriteType = HTMLCanvasElement;

export type PlayerAnimation = 'idle' | 'walk' | 'punch' | 'kick' | 'jump' | 'hurt';

export type EnemyType = 'grunt' | 'archer' | 'brute';

export type BossType = 'shaolin' | 'emei' | 'mongol' | 'ninja' | 'master' | 'senior';

export type ItemType = 'bamboo' | 'pillar' | 'lantern' | 'health' | 'qi' | 'coin';

export type Facing = 'left' | 'right';

interface PixelColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

const PALETTE = {
  skin: { r: 255, g: 205, b: 148 },
  skinDark: { r: 220, g: 170, b: 120 },
  hairBlack: { r: 30, g: 25, b: 25 },
  hairBrown: { r: 100, g: 65, b: 40 },
  white: { r: 255, g: 255, b: 255 },
  black: { r: 20, g: 20, b: 25 },
  darkGray: { r: 70, g: 70, b: 80 },
  gray: { r: 120, g: 120, b: 130 },
  lightGray: { r: 180, g: 180, b: 190 },
  red: { r: 200, g: 50, b: 50 },
  darkRed: { r: 150, g: 30, b: 30 },
  yellow: { r: 255, g: 210, b: 80 },
  gold: { r: 220, g: 170, b: 50 },
  orange: { r: 240, g: 140, b: 60 },
  blue: { r: 60, g: 120, b: 200 },
  darkBlue: { r: 40, g: 80, b: 160 },
  lightBlue: { r: 100, g: 180, b: 240 },
  green: { r: 70, g: 160, b: 70 },
  darkGreen: { r: 40, g: 120, b: 50 },
  lightGreen: { r: 120, g: 200, b: 100 },
  purple: { r: 140, g: 70, b: 160 },
  brown: { r: 130, g: 90, b: 50 },
  darkBrown: { r: 90, g: 60, b: 30 },
  cream: { r: 255, g: 240, b: 210 },
  shadow: { r: 0, g: 0, b: 0, a: 0.3 },
} as const;

type PaletteKey = keyof typeof PALETTE;

const SPRITE_SIZE = 16;
const SPRITE_SCALE = 4;

class PixelSprites {
  private canvasCache: Map<string, SpriteType> = new Map();

  private createOffscreenCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
    return canvas;
  }

  private getColor(key: PaletteKey): string {
    const color = PALETTE[key] as PixelColor;
    const alpha = color.a !== undefined ? color.a : 1;
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  private drawPixel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colorKey: PaletteKey,
    scale: number = 1
  ): void {
    ctx.fillStyle = this.getColor(colorKey);
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }

  private drawPixelData(
    ctx: CanvasRenderingContext2D,
    data: (PaletteKey | null)[][],
    offsetX: number = 0,
    offsetY: number = 0,
    scale: number = 1
  ): void {
    for (let y = 0; y < data.length; y++) {
      for (let x = 0; x < data[y].length; x++) {
        const colorKey = data[y][x];
        if (colorKey !== null) {
          this.drawPixel(ctx, x + offsetX, y + offsetY, colorKey, scale);
        }
      }
    }
  }

  private createSpriteFromData(data: (PaletteKey | null)[][]): SpriteType {
    const width = data[0]?.length || SPRITE_SIZE;
    const height = data.length;
    const canvas = this.createOffscreenCanvas(width * SPRITE_SCALE, height * SPRITE_SCALE);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      this.drawPixelData(ctx, data, 0, 0, SPRITE_SCALE);
    }
    return canvas;
  }

  private getOrCreateSprite(key: string, factory: () => SpriteType): SpriteType {
    if (this.canvasCache.has(key)) {
      return this.canvasCache.get(key)!;
    }
    const sprite = factory();
    this.canvasCache.set(key, sprite);
    return sprite;
  }

  private createPlayerIdle(frame: number): (PaletteKey | null)[][] {
    const phase = frame % 4;
    const bobOffset = phase < 2 ? 0 : 1;
    
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','hairBlack','skin','skin','hairBlack','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,null,'skin','skin','darkBrown','darkBrown','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'red','red','darkRed','darkRed','red','red',null,null,null,null,null,null],
      [null,null,null,'red','red','red','darkRed','darkRed','red','red','red',null,null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,null,'red','red','red','red','red','red',null,null,null,null,null,null],
      [null,null,null,null,null,'skin','skin',null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,null,'skin','skin',null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,null,'darkBlue','darkBlue',null,'darkBlue','darkBlue',null,null,null,null,null,null],
      [null,null,null,null,null,'darkBlue','darkBlue',null,'darkBlue','darkBlue',null,null,null,null,null,null],
      [null,null,null,null,null,'black','black',null,'black','black',null,null,null,null,null,null],
    ].map((row, y) => 
      y < 6 ? row : row.map((cell, x) => 
        bobOffset === 1 && (x === 5 || x === 6 || x === 8 || x === 9) && y >= 11 ? null : cell
      )
    ) as (PaletteKey | null)[][];
  }

  private createPlayerWalk(frame: number): (PaletteKey | null)[][] {
    const phase = frame % 8;
    const legOffset = Math.floor(phase / 2) % 2;
    
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','hairBlack','skin','skin','hairBlack','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,null,'skin','skin','darkBrown','darkBrown','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'red','red','darkRed','darkRed','red','red',null,null,null,null,null,null],
      [null,null,'red','red','red','red','darkRed','darkRed','red','red','red','red',null,null,null,null],
      [null,null,'red','red','red','red','red','red','red','red','red','red',null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,null,'red','red','red','red','red','red',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,legOffset === 0 ? 'skin' : null,'skin','skin',null,null,'skin','skin',legOffset === 1 ? 'skin' : null,null,null,null,null,null],
      [null,null,'darkBlue','darkBlue','darkBlue','darkBlue',null,null,'darkBlue','darkBlue','darkBlue','darkBlue',null,null,null,null],
      [null,null,'darkBlue','darkBlue',null,null,null,null,null,null,'darkBlue','darkBlue',null,null,null,null],
      [null,null,'black','black',null,null,null,null,null,null,'black','black',null,null,null,null],
    ];
  }

  private createPlayerPunch(frame: number): (PaletteKey | null)[][] {
    const phase = frame % 6;
    const armExtend = phase < 3 ? phase : 5 - phase;
    
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','hairBlack','skin','skin','hairBlack','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,null,'skin','skin','darkBrown','darkBrown','skin','skin','skin','skin','skin',null,null,null],
      [null,null,null,null,'red','red','darkRed','darkRed','red','red','red','red','red',null,null,null],
      [null,null,'red','red','red','red','darkRed','darkRed','red','red','red','red','red','red','red',null],
      [null,null,'red','red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,null,'red','red','red','red','red','red',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'darkBlue','darkBlue',null,null,'darkBlue','darkBlue',null,null,null,null,null,null],
      [null,null,null,null,'darkBlue','darkBlue',null,null,'darkBlue','darkBlue',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
    ].map((row, y) => 
      y === 5 || y === 6 || y === 7 ? row.map((cell, x) => {
        if (x >= 10 && armExtend > 0) {
          if (x === 10 + armExtend && cell === null) return 'skin';
          if (x === 10 + armExtend + 1) return 'red';
        }
        return cell;
      }) : row
    ) as (PaletteKey | null)[][];
  }

  private createPlayerKick(frame: number): (PaletteKey | null)[][] {
    const phase = frame % 8;
    const kickExtend = phase < 4 ? phase : 7 - phase;
    
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','hairBlack','skin','skin','hairBlack','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,null,'skin','skin','darkBrown','darkBrown','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'red','red','darkRed','darkRed','red','red',null,null,null,null,null,null],
      [null,null,null,'red','red','red','darkRed','darkRed','red','red','red',null,null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,null,'red','red','red','red','red','red',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,'skin','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,'skin','skin','darkBlue','darkBlue',null,null,null,null,null],
      [null,null,null,null,'darkBlue','darkBlue',null,'darkBlue','darkBlue','darkBlue','darkBlue','darkBlue',null,null,null,null],
      [null,null,null,null,'darkBlue','darkBlue',null,null,null,null,'darkBlue','darkBlue','darkBlue',null,null,null],
      [null,null,null,null,'black','black',null,null,null,null,'black','black','black',null,null,null],
    ].map((row, y) => 
      y === 13 || y === 14 ? row.map((cell, x) => {
        if (x >= 9 && kickExtend > 0) {
          const kickX = 9 + kickExtend;
          if (x === kickX && y === 13) return 'darkBlue';
          if (x === kickX && y === 14) return 'darkBlue';
          if (x === kickX + 1 && y === 14) return 'black';
        }
        return cell;
      }) : row
    ) as (PaletteKey | null)[][];
  }

  private createPlayerJump(frame: number): (PaletteKey | null)[][] {
    const phase = frame % 8;
    const jumpPhase = phase < 4 ? phase : 7 - phase;
    const yOffset = jumpPhase < 2 ? 0 : -1;
    
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','hairBlack','skin','skin','hairBlack','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,'skin','skin','skin','skin','darkBrown','darkBrown','skin','skin','skin','skin',null,null,null,null],
      [null,null,'red','red','red','red','darkRed','darkRed','red','red','red','red',null,null,null,null],
      [null,null,'red','red','red','red','darkRed','darkRed','red','red','red','red',null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,null,'red','red','red','red','red','red',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,'darkBlue','darkBlue','darkBlue',null,null,'darkBlue','darkBlue','darkBlue',null,null,null,null,null],
      [null,null,null,'darkBlue','darkBlue',null,null,null,null,'darkBlue','darkBlue',null,null,null,null,null],
      [null,null,null,'black',null,null,null,null,null,null,'black',null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    ].map((row: (PaletteKey | null)[]) => {
      const offsetRow = new Array(16).fill(null) as (PaletteKey | null)[];
      for (let i = 0; i < row.length; i++) {
        const targetY = i + yOffset;
        if (targetY >= 0 && targetY < 16) {
          offsetRow[targetY] = row[i];
        }
      }
      return offsetRow;
    }) as (PaletteKey | null)[][];
  }

  private createPlayerHurt(frame: number): (PaletteKey | null)[][] {
    const phase = frame % 4;
    const flash = phase % 2 === 0;
    
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack',flash ? 'white' : 'skin',flash ? 'white' : 'skin',flash ? 'white' : 'skin',flash ? 'white' : 'skin',flash ? 'white' : 'skin',flash ? 'white' : 'skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack',flash ? 'white' : 'skin','hairBlack',flash ? 'white' : 'skin',flash ? 'white' : 'skin','hairBlack',flash ? 'white' : 'skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack',flash ? 'white' : 'skin',flash ? 'white' : 'skin',flash ? 'white' : 'skin',flash ? 'white' : 'skin',flash ? 'white' : 'skin',flash ? 'white' : 'skin','hairBlack',null,null,null,null,null],
      [null,null,null,null,flash ? 'white' : 'skin',flash ? 'white' : 'skin','darkBrown','darkBrown',flash ? 'white' : 'skin',flash ? 'white' : 'skin',null,null,null,null,null,null],
      [null,null,null,null,flash ? 'white' : 'red',flash ? 'white' : 'red','darkRed','darkRed',flash ? 'white' : 'red',flash ? 'white' : 'red',null,null,null,null,null,null],
      [null,null,null,flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red','darkRed','darkRed',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',null,null,null,null,null],
      [null,null,null,flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',null,null,null,null,null],
      [null,null,null,flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',null,null,null,null,null],
      [null,null,null,null,flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',flash ? 'white' : 'red',null,null,null,null,null,null],
      [null,null,null,null,flash ? 'white' : 'skin',flash ? 'white' : 'skin',null,null,flash ? 'white' : 'skin',flash ? 'white' : 'skin',null,null,null,null,null,null],
      [null,null,null,null,flash ? 'white' : 'skin',flash ? 'white' : 'skin',null,null,flash ? 'white' : 'skin',null,null,null,null,null,null,null],
      [null,null,null,null,flash ? 'white' : 'darkBlue',flash ? 'white' : 'darkBlue',null,null,flash ? 'white' : 'darkBlue',null,null,null,null,null,null,null],
      [null,null,null,null,flash ? 'white' : 'darkBlue',flash ? 'white' : 'darkBlue',null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,flash ? 'white' : 'black',flash ? 'white' : 'black',null,null,null,null,null,null,null,null,null,null,null],
    ];
  }

  createPlayerSprites(): Record<PlayerAnimation, SpriteType[]> {
    return {
      idle: [0, 1, 2, 3].map(f => this.getOrCreateSprite(`player_idle_${f}`, () => 
        this.createSpriteFromData(this.createPlayerIdle(f))
      )),
      walk: [0, 1, 2, 3, 4, 5, 6, 7].map(f => this.getOrCreateSprite(`player_walk_${f}`, () => 
        this.createSpriteFromData(this.createPlayerWalk(f))
      )),
      punch: [0, 1, 2, 3, 4, 5].map(f => this.getOrCreateSprite(`player_punch_${f}`, () => 
        this.createSpriteFromData(this.createPlayerPunch(f))
      )),
      kick: [0, 1, 2, 3, 4, 5, 6, 7].map(f => this.getOrCreateSprite(`player_kick_${f}`, () => 
        this.createSpriteFromData(this.createPlayerKick(f))
      )),
      jump: [0, 1, 2, 3, 4, 5, 6, 7].map(f => this.getOrCreateSprite(`player_jump_${f}`, () => 
        this.createSpriteFromData(this.createPlayerJump(f))
      )),
      hurt: [0, 1, 2, 3].map(f => this.getOrCreateSprite(`player_hurt_${f}`, () => 
        this.createSpriteFromData(this.createPlayerHurt(f))
      )),
    };
  }

  private createGruntEnemy(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,'hairBrown','hairBrown','hairBrown','hairBrown','hairBrown','hairBrown',null,null,null,null,null,null],
      [null,null,null,'hairBrown','hairBrown','hairBrown','hairBrown','hairBrown','hairBrown','hairBrown','hairBrown',null,null,null,null,null],
      [null,null,null,'hairBrown','skin','skin','skin','skin','skin','skin','hairBrown',null,null,null,null,null],
      [null,null,null,'hairBrown','skin','black','skin','skin','black','skin','hairBrown',null,null,null,null,null],
      [null,null,null,'hairBrown','skin','skin','darkBrown','darkBrown','skin','skin','hairBrown',null,null,null,null,null],
      [null,null,null,null,'skin','skin','darkBrown','darkBrown','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'darkGray','darkGray','gray','gray','darkGray','darkGray',null,null,null,null,null,null],
      [null,null,'darkGray','darkGray','darkGray','darkGray','gray','gray','darkGray','darkGray','darkGray','darkGray',null,null,null,null],
      [null,null,'darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray',null,null,null,null],
      [null,null,null,'darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray',null,null,null,null,null],
      [null,null,null,null,'darkGray','darkGray','darkGray','darkGray','darkGray','darkGray',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'brown','brown',null,null,'brown','brown',null,null,null,null,null,null],
      [null,null,null,null,'brown','brown',null,null,'brown','brown',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
    ];
  }

  private createArcherEnemy(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','black','skin','skin','black','skin','hairBlack','brown',null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack','brown',null,null,null,null],
      [null,null,null,null,'skin','skin','darkBrown','darkBrown','skin','skin','brown','brown',null,null,null,null],
      [null,null,null,null,'green','green','darkGreen','darkGreen','green','green','brown',null,null,null,null,null],
      [null,null,'green','green','green','green','darkGreen','darkGreen','green','green','green','brown',null,null,null,null],
      [null,null,'green','green','green','green','green','green','green','green','green','brown',null,null,null,null],
      [null,null,null,'green','green','green','green','green','green','green','green','brown',null,null,null,null],
      [null,null,null,null,'green','green','green','green','green','green','brown',null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'darkGreen','darkGreen',null,null,'darkGreen','darkGreen',null,null,null,null,null,null],
      [null,null,null,null,'darkGreen','darkGreen',null,null,'darkGreen','darkGreen',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
    ];
  }

  private createBruteEnemy(): (PaletteKey | null)[][] {
    return [
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null],
      [null,null,'hairBlack','skin','skin','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null],
      [null,null,'hairBlack','skin','black','skin','skin','skin','skin','black','skin','hairBlack',null,null,null,null],
      [null,null,'hairBlack','skin','skin','skin','darkBrown','darkBrown','skin','skin','skin','hairBlack',null,null,null,null],
      [null,null,null,'skin','skin','skin','darkBrown','darkBrown','skin','skin','skin',null,null,null,null,null],
      [null,'skin','skin','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','skin','skin',null,null,null],
      [null,'skin','skin','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','skin','skin',null,null,null],
      ['skin','skin','skin','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','skin','skin','skin',null,null],
      ['skin','skin','skin','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','skin','skin','skin',null,null],
      [null,'skin','skin','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','skin','skin',null,null,null],
      [null,null,null,'skin','skin','skin',null,null,'skin','skin','skin',null,null,null,null,null],
      [null,null,null,'skin','skin','skin',null,null,'skin','skin','skin',null,null,null,null,null],
      [null,null,null,'brown','brown','brown',null,null,'brown','brown','brown',null,null,null,null,null],
      [null,null,null,'brown','brown','brown',null,null,'brown','brown','brown',null,null,null,null,null],
      [null,null,null,'black','black','black',null,null,'black','black','black',null,null,null,null,null],
    ];
  }

  createEnemySprites(type: EnemyType): SpriteType {
    const spriteData = {
      grunt: this.createGruntEnemy(),
      archer: this.createArcherEnemy(),
      brute: this.createBruteEnemy(),
    }[type];
    
    return this.getOrCreateSprite(`enemy_${type}`, () => 
      this.createSpriteFromData(spriteData)
    );
  }

  private createShaolinBoss(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,'yellow','yellow','yellow','yellow','yellow','yellow',null,null,null,null,null,null],
      [null,null,null,'yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow',null,null,null,null,null],
      [null,null,null,'yellow','skin','skin','skin','skin','skin','skin','yellow',null,null,null,null,null],
      [null,null,null,'yellow','skin','black','skin','skin','black','skin','yellow',null,null,null,null,null],
      [null,null,null,'yellow','skin','skin','skin','skin','skin','skin','yellow',null,null,null,null,null],
      [null,null,null,null,'skin','skin','darkBrown','darkBrown','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'orange','orange','red','red','orange','orange','brown',null,null,null,null,null],
      [null,null,'orange','orange','orange','orange','red','red','orange','orange','orange','orange','brown',null,null,null],
      [null,null,'orange','orange','orange','orange','orange','orange','orange','orange','orange','orange','brown','brown',null,null],
      [null,null,null,'orange','orange','orange','orange','orange','orange','orange','orange','orange','brown','brown',null,null],
      [null,null,null,null,'orange','orange','orange','orange','orange','orange','orange','orange',null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'orange','orange',null,null,'orange','orange',null,null,null,null,null,null],
      [null,null,null,null,'orange','orange',null,null,'orange','orange',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
    ];
  }

  private createEmeiBoss(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,'purple','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','purple',null,null,null,null],
      [null,null,'purple','hairBlack','skin','skin','skin','skin','skin','skin','hairBlack','purple',null,null,null,null],
      [null,null,null,'hairBlack','skin','black','skin','skin','black','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,null,'skin','skin','purple','purple','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'lightBlue','lightBlue','purple','purple','lightBlue','lightBlue',null,null,null,null,null,null],
      [null,null,'lightBlue','lightBlue','lightBlue','lightBlue','purple','purple','lightBlue','lightBlue','lightBlue','lightBlue',null,null,null,null],
      [null,null,'lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue',null,null,null,null],
      [null,null,null,'lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue',null,null,null,null,null],
      [null,null,null,null,'lightBlue','lightBlue','lightBlue','lightBlue','lightBlue','lightBlue',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'lightBlue','lightBlue',null,null,'lightBlue','lightBlue',null,null,null,null,null,null],
      [null,null,null,null,'lightBlue','lightBlue',null,null,'lightBlue','lightBlue',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
    ];
  }

  private createMongolBoss(): (PaletteKey | null)[][] {
    return [
      [null,null,null,'darkRed','darkRed','darkRed','darkRed','darkRed','darkRed','darkRed','darkRed',null,null,null,null,null],
      [null,null,'darkRed','darkRed','darkRed','darkRed','darkRed','darkRed','darkRed','darkRed','darkRed','darkRed',null,null,null,null],
      [null,null,'darkRed','skin','skin','skin','skin','skin','skin','skin','skin','darkRed',null,null,null,null],
      [null,null,'darkRed','skin','black','skin','skin','skin','black','skin','skin','darkRed',null,null,null,null],
      [null,null,'darkRed','skin','skin','skin','darkBrown','darkBrown','skin','skin','skin','darkRed',null,null,null,null],
      [null,null,null,'skin','skin','skin','darkBrown','darkBrown','skin','skin','skin',null,null,null,null,null],
      [null,'skin','skin','brown','brown','brown','darkBrown','darkBrown','brown','brown','brown','skin','skin',null,null,null],
      [null,'skin','skin','brown','brown','brown','darkBrown','darkBrown','brown','brown','brown','skin','skin',null,null,null],
      ['skin','skin','skin','brown','brown','brown','brown','brown','brown','brown','brown','skin','skin','skin',null,null],
      ['skin','skin','skin','brown','brown','brown','brown','brown','brown','brown','brown','skin','skin','skin',null,null],
      [null,'skin','skin','brown','brown','brown','brown','brown','brown','brown','brown','skin','skin',null,null,null],
      [null,null,null,'skin','skin','skin',null,null,'skin','skin','skin',null,null,null,null,null],
      [null,null,null,'skin','skin','skin',null,null,'skin','skin','skin',null,null,null,null,null],
      [null,null,null,'brown','brown','brown',null,null,'brown','brown','brown',null,null,null,null,null],
      [null,null,null,'brown','brown','brown',null,null,'brown','brown','brown',null,null,null,null,null],
      [null,null,null,'black','black','black',null,null,'black','black','black',null,null,null,null,null],
    ];
  }

  private createNinjaBoss(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,'black','black','black','black','black','black',null,null,null,null,null,null],
      [null,null,null,'black','black','black','black','black','black','black','black',null,null,null,null,null],
      [null,null,null,'black','black','black','black','black','black','black','black',null,null,null,null,null],
      [null,null,null,'black','skin','red','skin','skin','red','skin','black',null,null,null,null,null],
      [null,null,null,'black','black','black','black','black','black','black','black',null,null,null,null,null],
      [null,null,null,null,'black','black','black','black','black','black',null,null,null,null,null,null],
      [null,null,null,null,'black','black','darkGray','darkGray','black','black',null,null,null,null,null,null],
      [null,null,'black','black','black','black','darkGray','darkGray','black','black','black','black',null,null,null,null],
      [null,null,'black','black','black','black','black','black','black','black','black','black',null,null,null,null],
      [null,null,null,'black','black','black','black','black','black','black','black',null,null,null,null,null],
      [null,null,null,null,'black','black','black','black','black','black',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
      [null,null,null,null,'darkGray','darkGray',null,null,'darkGray','darkGray',null,null,null,null,null,null],
    ];
  }

  private createMasterBoss(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,'white','white','white','white','white','white',null,null,null,null,null,null],
      [null,null,null,'white','white','white','white','white','white','white','white',null,null,null,null,null],
      [null,null,null,'white','skin','skin','skin','skin','skin','skin','white',null,null,null,null,null],
      [null,null,null,'white','skin','black','skin','skin','black','skin','white',null,null,null,null,null],
      [null,null,null,'white','skin','skin','white','white','skin','skin','white',null,null,null,null,null],
      [null,null,null,null,'skin','skin','white','white','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'cream','cream','white','white','cream','cream',null,null,null,null,null,null],
      [null,null,'cream','cream','cream','cream','white','white','cream','cream','cream','cream',null,null,null,null],
      [null,null,'cream','cream','cream','cream','cream','cream','cream','cream','cream','cream',null,null,null,null],
      [null,null,null,'cream','cream','cream','cream','cream','cream','cream','cream',null,null,null,null,null],
      [null,null,null,null,'cream','cream','cream','cream','cream','cream',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'darkBlue','darkBlue',null,null,'darkBlue','darkBlue',null,null,null,null,null,null],
      [null,null,null,null,'darkBlue','darkBlue',null,null,'darkBlue','darkBlue',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
    ];
  }

  private createSeniorBoss(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null,null],
      [null,null,null,'hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','black','skin','skin','black','skin','hairBlack',null,null,null,null,null],
      [null,null,null,'hairBlack','skin','skin','skin','skin','skin','skin','hairBlack',null,null,null,null,null],
      [null,null,null,null,'skin','skin','darkBrown','darkBrown','skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'blue','blue','darkBlue','darkBlue','blue','blue',null,null,null,null,null,null],
      [null,null,'blue','blue','blue','blue','darkBlue','darkBlue','blue','blue','blue','blue',null,null,null,null],
      [null,null,'blue','blue','blue','blue','blue','blue','blue','blue','blue','blue',null,null,null,null],
      [null,null,null,'blue','blue','blue','blue','blue','blue','blue','blue',null,null,null,null,null],
      [null,null,null,null,'blue','blue','blue','blue','blue','blue',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'skin','skin',null,null,'skin','skin',null,null,null,null,null,null],
      [null,null,null,null,'blue','blue',null,null,'blue','blue',null,null,null,null,null,null],
      [null,null,null,null,'blue','blue',null,null,'blue','blue',null,null,null,null,null,null],
      [null,null,null,null,'black','black',null,null,'black','black',null,null,null,null,null,null],
    ];
  }

  createBossSprites(type: BossType): SpriteType {
    const spriteData = {
      shaolin: this.createShaolinBoss(),
      emei: this.createEmeiBoss(),
      mongol: this.createMongolBoss(),
      ninja: this.createNinjaBoss(),
      master: this.createMasterBoss(),
      senior: this.createSeniorBoss(),
    }[type];
    
    return this.getOrCreateSprite(`boss_${type}`, () => 
      this.createSpriteFromData(spriteData)
    );
  }

  private createBamboo(): (PaletteKey | null)[][] {
    return [
      [null,null,'lightGreen','lightGreen',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'darkGreen','darkGreen',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'darkGreen','darkGreen',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'darkGreen','darkGreen',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'darkGreen','darkGreen',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'green','green',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'darkBrown','darkBrown',null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,'darkBrown','darkBrown',null,null,null,null,null,null,null,null,null,null,null,null],
    ];
  }

  private createPillar(): (PaletteKey | null)[][] {
    return [
      [null,'gray','gray','gray','gray','gray','gray','gray','gray','gray','gray',null,null,null,null,null],
      [null,'lightGray','gray','gray','gray','gray','gray','gray','gray','gray','lightGray',null,null,null,null,null],
      [null,'gray','lightGray','gray','gray','gray','gray','gray','gray','lightGray','gray',null,null,null,null,null],
      [null,'gray','gray','lightGray','gray','gray','gray','gray','lightGray','gray','gray',null,null,null,null,null],
      [null,'gray','gray','gray','lightGray','gray','gray','lightGray','gray','gray','gray',null,null,null,null,null],
      [null,'gray','gray','gray','gray','lightGray','lightGray','gray','gray','gray','gray',null,null,null,null,null],
      [null,'gray','gray','gray','gray','gray','gray','gray','gray','gray','gray',null,null,null,null,null],
      [null,'gray','gray','gray','lightGray','gray','gray','lightGray','gray','gray','gray',null,null,null,null,null],
      [null,'gray','gray','lightGray','gray','gray','gray','gray','lightGray','gray','gray',null,null,null,null,null],
      [null,'gray','lightGray','gray','gray','gray','gray','gray','gray','lightGray','gray',null,null,null,null,null],
      [null,'lightGray','gray','gray','gray','gray','gray','gray','gray','gray','lightGray',null,null,null,null,null],
      [null,'gray','gray','gray','gray','gray','gray','gray','gray','gray','gray',null,null,null,null,null],
      [null,'gray','lightGray','gray','gray','gray','gray','gray','gray','lightGray','gray',null,null,null,null,null],
      [null,'gray','gray','lightGray','gray','gray','gray','gray','lightGray','gray','gray',null,null,null,null,null],
      ['darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray',null,null,null,null],
      ['darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray','darkGray',null,null,null,null],
    ];
  }

  private createLantern(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,null,'darkBrown','darkBrown',null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,'darkBrown','darkBrown',null,null,null,null,null,null,null,null,null],
      [null,null,null,'darkBrown','darkBrown','darkBrown','darkBrown','darkBrown','darkBrown',null,null,null,null,null,null,null],
      [null,null,'darkBrown','red','red','red','red','red','red','darkBrown',null,null,null,null,null,null],
      [null,'darkBrown','red','yellow','red','red','red','red','yellow','red','darkBrown',null,null,null,null,null],
      ['darkBrown','red','red','red','gold','gold','gold','gold','red','red','red','darkBrown',null,null,null,null],
      ['darkBrown','red','red','gold','yellow','yellow','yellow','yellow','gold','red','red','darkBrown',null,null,null,null],
      ['darkBrown','red','red','gold','yellow','gold','gold','yellow','gold','red','red','darkBrown',null,null,null,null],
      ['darkBrown','red','red','gold','yellow','yellow','yellow','yellow','gold','red','red','darkBrown',null,null,null,null],
      ['darkBrown','red','red','red','gold','gold','gold','gold','red','red','red','darkBrown',null,null,null,null],
      [null,'darkBrown','red','yellow','red','red','red','red','yellow','red','darkBrown',null,null,null,null,null],
      [null,null,'darkBrown','red','red','red','red','red','red','darkBrown',null,null,null,null,null,null],
      [null,null,null,'darkBrown','darkBrown','darkBrown','darkBrown','darkBrown','darkBrown',null,null,null,null,null,null,null],
      [null,null,null,null,null,'darkBrown','darkBrown',null,null,null,null,null,null,null,null,null],
      [null,null,null,null,'darkBrown','darkBrown','darkBrown','darkBrown',null,null,null,null,null,null,null,null],
      [null,null,null,null,'darkBrown',null,null,'darkBrown',null,null,null,null,null,null,null,null],
    ];
  }

  private createHealthItem(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,'red','red',null,null,'red','red',null,null,null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,'red','red','red','red','red','red','red','red','red','red',null,null,null,null],
      [null,null,'red','red','red','red','red','red','red','red','red','red',null,null,null,null],
      [null,null,'red','red','white','red','red','red','red','white','red','red',null,null,null,null],
      [null,null,'red','red','red','red','red','red','red','red','red','red',null,null,null,null],
      [null,null,null,'red','red','red','red','red','red','red','red',null,null,null,null,null],
      [null,null,null,null,'red','red','red','red','red','red',null,null,null,null,null,null],
      [null,null,null,null,null,'red','red','red','red',null,null,null,null,null,null,null],
      [null,null,null,null,null,null,'red','red',null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    ];
  }

  private createQiItem(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,null,'lightBlue','lightBlue',null,null,null,null,null,null,null,null,null],
      [null,null,null,null,'lightBlue','blue','blue','lightBlue',null,null,null,null,null,null,null,null],
      [null,null,null,'lightBlue','blue','white','white','blue','lightBlue',null,null,null,null,null,null,null],
      [null,null,'lightBlue','blue','white','lightBlue','lightBlue','white','blue','lightBlue',null,null,null,null,null,null],
      [null,null,'lightBlue','blue','lightBlue','blue','blue','lightBlue','blue','lightBlue',null,null,null,null,null,null],
      [null,null,'lightBlue','blue','white','blue','blue','white','blue','lightBlue',null,null,null,null,null,null],
      [null,null,null,'lightBlue','blue','white','white','blue','lightBlue',null,null,null,null,null,null,null],
      [null,null,null,null,'lightBlue','blue','blue','lightBlue',null,null,null,null,null,null,null,null],
      [null,null,null,null,null,'lightBlue','lightBlue',null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    ];
  }

  private createCoinItem(): (PaletteKey | null)[][] {
    return [
      [null,null,null,null,null,'gold','gold','gold','gold',null,null,null,null,null,null,null],
      [null,null,null,'gold','gold','yellow','yellow','yellow','yellow','gold','gold',null,null,null,null,null],
      [null,null,'gold','yellow','yellow','gold','yellow','yellow','gold','yellow','yellow','gold',null,null,null,null],
      [null,'gold','yellow','yellow','yellow','yellow','gold','gold','yellow','yellow','yellow','yellow','gold',null,null,null],
      [null,'gold','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','gold',null,null,null],
      ['gold','yellow','gold','yellow','yellow','yellow','gold','gold','yellow','yellow','yellow','gold','yellow','gold',null,null],
      ['gold','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','gold',null,null],
      ['gold','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','gold',null,null],
      ['gold','yellow','gold','yellow','yellow','yellow','gold','gold','yellow','yellow','yellow','gold','yellow','gold',null,null],
      [null,'gold','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','gold',null,null,null],
      [null,'gold','yellow','yellow','yellow','yellow','gold','gold','yellow','yellow','yellow','yellow','gold',null,null,null],
      [null,null,'gold','yellow','yellow','gold','yellow','yellow','gold','yellow','yellow','gold',null,null,null,null],
      [null,null,null,'gold','gold','yellow','yellow','yellow','yellow','gold','gold',null,null,null,null,null],
      [null,null,null,null,null,'gold','gold','gold','gold',null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    ];
  }

  createItemSprites(type: ItemType): SpriteType {
    const spriteData = {
      bamboo: this.createBamboo(),
      pillar: this.createPillar(),
      lantern: this.createLantern(),
      health: this.createHealthItem(),
      qi: this.createQiItem(),
      coin: this.createCoinItem(),
    }[type];
    
    return this.getOrCreateSprite(`item_${type}`, () => 
      this.createSpriteFromData(spriteData)
    );
  }

  drawPixelCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    sprite: SpriteType,
    facing: Facing = 'right',
    scale: number = 1
  ): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    const width = sprite.width * scale;
    const height = sprite.height * scale;
    
    if (facing === 'left') {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, width, height);
    } else {
      ctx.drawImage(sprite, x, y, width, height);
    }
    
    ctx.restore();
  }

  clearCache(): void {
    this.canvasCache.clear();
  }

  getCacheSize(): number {
    return this.canvasCache.size;
  }
}

export const pixelSprites = new PixelSprites();

export default PixelSprites;
