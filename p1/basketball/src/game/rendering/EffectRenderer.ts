import { Renderer } from './Renderer';
import { Effect } from '../entities/Effect';
import { Ball } from '../entities/Ball';
import { BALL_CONFIG } from '../../types/game';

export class EffectRenderer extends Renderer {
  renderEffects(effects: Effect[], screenShakeX: number = 0, screenShakeY: number = 0): void {
    effects.forEach(effect => {
      if (!effect.active) return;
      
      const x = effect.position.x + screenShakeX;
      const y = effect.position.y + screenShakeY;
      const alpha = effect.getAlpha();
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      
      switch (effect.state.type) {
        case 'fire':
          this.renderFire(x, y, effect.state.size, effect.state.color);
          break;
        case 'spark':
          this.renderSpark(x, y, effect.state.size, effect.state.color);
          break;
        case 'smoke':
          this.renderSmoke(x, y, effect.state.size);
          break;
        case 'star':
          this.renderStar(x, y, effect.state.size, effect.state.color);
          break;
        case 'tornado':
          this.renderTornado(x, y, effect.state.size);
          break;
        case 'meteor':
          this.renderMeteor(x, y, effect.state.size);
          break;
        case 'text':
          this.renderText(x, y, effect.state.text || '', effect.state.color);
          break;
      }
      
      this.ctx.restore();
    });
  }

  renderBall(ball: Ball, screenShakeX: number = 0, screenShakeY: number = 0): void {
    const x = ball.position.x + screenShakeX;
    const y = ball.position.y + screenShakeY;
    
    if (ball.state.isHeld || ball.state.isInTruck) {
      return;
    }
    
    this.ctx.save();
    
    if (ball.state.isSpecialShot) {
      if (ball.state.specialType === 'meteor') {
        for (let i = 0; i < 5; i++) {
          const trailX = x - ball.velocity.x * i * 0.5;
          const trailY = y - ball.velocity.y * i * 0.5;
          const alpha = 1 - i * 0.15;
          this.ctx.globalAlpha = alpha;
          this.drawPixelCircle(trailX, trailY, BALL_CONFIG.RADIUS + i * 2, 
            i % 2 === 0 ? '#FF6600' : '#FFAA00');
        }
        this.ctx.globalAlpha = 1;
        
        this.drawPixelCircle(x, y, BALL_CONFIG.RADIUS + 5, '#FFFF00');
        this.drawPixelCircle(x, y, BALL_CONFIG.RADIUS, '#FF4400');
      } else if (ball.state.specialType === 'tornado') {
        const time = Date.now() * 0.01;
        for (let i = 0; i < 8; i++) {
          const angle = time + i * Math.PI / 4;
          const radius = 30 + i * 5;
          const spiralX = x + Math.cos(angle) * radius;
          const spiralY = y + Math.sin(angle) * radius;
          this.ctx.globalAlpha = 0.8 - i * 0.1;
          this.drawPixelCircle(spiralX, spiralY, 8, i % 2 === 0 ? '#88CCFF' : '#AAEEFF');
        }
        this.ctx.globalAlpha = 1;
        this.drawPixelCircle(x, y, BALL_CONFIG.RADIUS + 3, '#00FFFF');
      } else if (ball.state.specialType === 'dunk') {
        for (let i = 0; i < 3; i++) {
          this.ctx.globalAlpha = 0.7 - i * 0.2;
          this.drawPixelCircle(x, y + i * 15, BALL_CONFIG.RADIUS + i * 3, '#FF8800');
        }
        this.ctx.globalAlpha = 1;
        this.drawPixelCircle(x, y, BALL_CONFIG.RADIUS, '#FF4400');
      }
    } else {
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(ball.state.rotation);
      
      this.drawPixelCircle(0, 0, BALL_CONFIG.RADIUS, '#FF8800');
      this.drawPixelCircle(0, 0, BALL_CONFIG.RADIUS - 2, '#FFAA33');
      
      this.drawPixelLine(-BALL_CONFIG.RADIUS + 2, 0, BALL_CONFIG.RADIUS - 2, 0, '#000000', 2);
      this.drawPixelLine(0, -BALL_CONFIG.RADIUS + 2, 0, BALL_CONFIG.RADIUS - 2, '#000000', 2);
      
      this.ctx.beginPath();
      this.ctx.arc(0, 0, BALL_CONFIG.RADIUS - 4, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      this.ctx.restore();
    }
    
    this.ctx.restore();
  }

  private renderFire(x: number, y: number, size: number, color: string): void {
    const time = Date.now() * 0.01;
    
    for (let i = 0; i < 3; i++) {
      const offsetY = Math.sin(time + i) * 5;
      const s = size * (1 - i * 0.2);
      const c = i === 0 ? '#FFFF00' : i === 1 ? '#FF8800' : color;
      
      this.drawPixelCircle(x + Math.sin(time + i * 2) * 3, y - offsetY, s, c);
    }
  }

  private renderSpark(x: number, y: number, size: number, color: string): void {
    this.drawPixelRect(x - size / 2, y - size / 2, size, size, color);
    
    this.drawPixelLine(x - size, y, x + size, y, color, 2);
    this.drawPixelLine(x, y - size, x, y + size, color, 2);
  }

  private renderSmoke(x: number, y: number, size: number): void {
    for (let i = 0; i < 3; i++) {
      const offsetX = Math.sin(Date.now() * 0.005 + i) * 10;
      const alpha = 0.3 + i * 0.1;
      this.ctx.globalAlpha = alpha;
      this.drawPixelCircle(x + offsetX, y + i * 5, size + i * 5, '#888888');
    }
    this.ctx.globalAlpha = 1;
  }

  private renderStar(x: number, y: number, size: number, color: string): void {
    const time = Date.now() * 0.005;
    const pulse = 1 + Math.sin(time) * 0.3;
    const s = size * pulse;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(time);
    
    for (let i = 0; i < 4; i++) {
      this.ctx.rotate(Math.PI / 2);
      this.drawPixelRect(-2, -s, 4, s * 2, color);
    }
    
    this.drawPixelCircle(0, 0, s * 0.5, color);
    
    this.ctx.restore();
  }

  private renderTornado(x: number, y: number, size: number): void {
    const time = Date.now() * 0.01;
    
    for (let i = 0; i < 5; i++) {
      const angle = time + i * Math.PI / 2.5;
      const radius = size * (0.3 + i * 0.15);
      const spiralX = x + Math.cos(angle) * radius;
      const spiralY = y + Math.sin(angle) * radius - i * 10;
      
      const colors = ['#88CCFF', '#AAEEFF', '#FFFFFF', '#88CCFF', '#AAEEFF'];
      this.drawPixelCircle(spiralX, spiralY, 10 - i, colors[i]);
    }
    
    for (let i = 0; i < 10; i++) {
      const angle = time * 2 + i * Math.PI / 5;
      const radius = size * 0.8;
      const leafX = x + Math.cos(angle) * radius;
      const leafY = y + Math.sin(angle) * radius - 30;
      
      this.drawPixelRect(leafX - 3, leafY - 3, 6, 6, '#44AA44');
    }
  }

  private renderMeteor(x: number, y: number, size: number): void {
    const time = Date.now() * 0.01;
    
    for (let i = 0; i < 8; i++) {
      const trailX = x + Math.cos(time + i) * i * 3;
      const trailY = y + i * 5;
      const alpha = 1 - i * 0.1;
      this.ctx.globalAlpha = alpha;
      
      const colors = ['#FFFF00', '#FFAA00', '#FF6600', '#FF4400', '#FF2200'];
      this.drawPixelCircle(trailX, trailY, size * (1 - i * 0.1), colors[i % 5]);
    }
    
    this.ctx.globalAlpha = 1;
    this.drawPixelCircle(x, y, size, '#FFFFFF');
    this.drawPixelCircle(x, y, size * 0.7, '#FFFF00');
    
    for (let i = 0; i < 6; i++) {
      const angle = time * 3 + i * Math.PI / 3;
      const rayX = x + Math.cos(angle) * size * 1.5;
      const rayY = y + Math.sin(angle) * size * 1.5;
      this.drawPixelLine(x, y, rayX, rayY, '#FFFF00', 3);
    }
  }

  private renderText(x: number, y: number, text: string, color: string): void {
    const bounce = Math.sin(Date.now() * 0.01) * 3;
    this.drawPixelText(text, x, y + bounce, 16, color, true);
    
    if (Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
      this.drawPixelText(text, x, y + bounce, 18, '#FFFFFF', true);
      this.ctx.globalAlpha = 1;
    }
  }

  renderCountdown(count: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    const text = count > 0 ? count.toString() : 'GO!';
    const color = count > 0 ? '#FFFF00' : '#00FF00';
    const size = count > 0 ? 120 : 100;
    
    const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.1;
    
    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(pulse, pulse);
    
    this.drawPixelText(text, 0, -size / 2, size, color, true);
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.005;
      const radius = 150;
      const starX = Math.cos(angle) * radius;
      const starY = Math.sin(angle) * radius;
      this.drawPixelText('★', starX - 10, starY - 10, 20, '#FFAA00');
    }
    
    this.ctx.restore();
  }
}
