import { GAME_CONFIG } from '../../types/game';

export abstract class Renderer {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.width = GAME_CONFIG.WIDTH;
    this.height = GAME_CONFIG.HEIGHT;
    this.ctx.imageSmoothingEnabled = false;
  }

  protected drawPixelRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  protected drawPixelCircle(x: number, y: number, r: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(Math.floor(x), Math.floor(y), r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  protected drawPixelText(text: string, x: number, y: number, size: number, color: string, centered: boolean = false): void {
    this.ctx.font = `bold ${size}px "Press Start 2P", monospace`;
    this.ctx.fillStyle = color;
    this.ctx.textBaseline = 'top';
    
    if (centered) {
      const metrics = this.ctx.measureText(text);
      x -= metrics.width / 2;
    }
    
    this.ctx.fillText(text, Math.floor(x), Math.floor(y));
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillText(text, Math.floor(x) + 2, Math.floor(y) + 2);
  }

  protected drawPixelLine(x1: number, y1: number, x2: number, y2: number, color: string, thickness: number = 2): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = thickness;
    this.ctx.beginPath();
    this.ctx.moveTo(Math.floor(x1), Math.floor(y1));
    this.ctx.lineTo(Math.floor(x2), Math.floor(y2));
    this.ctx.stroke();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
