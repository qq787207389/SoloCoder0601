import { Renderer } from './Renderer';
import { Player } from '../entities/Player';
import { PLAYER_CONFIG, ITEM_CONFIG } from '../../types/game';

export class PlayerRenderer extends Renderer {
  render(player: Player, screenShakeX: number = 0, screenShakeY: number = 0): void {
    const x = player.position.x + screenShakeX;
    const y = player.position.y + screenShakeY;
    const teamColor = player.team === 'red' ? '#FF4444' : '#4488FF';
    const teamDarkColor = player.team === 'red' ? '#CC2222' : '#2266CC';
    
    const isFacingRight = player.state.facingRight;
    const animationFrame = player.state.animationFrame;
    
    this.ctx.save();
    
    if (player.state.isKnockedOut) {
      this.renderKnockedOut(x, y, teamColor);
      this.ctx.restore();
      return;
    }
    
    const bodyY = y - PLAYER_CONFIG.HEIGHT;
    const headY = bodyY;
    const bodyBottom = y;
    
    this.drawPixelRect(x - 15, headY, 30, 30, '#FFCC99');
    this.drawPixelRect(x - 15, headY, 30, 4, '#333333');
    
    const eyeX = isFacingRight ? x + 3 : x - 7;
    this.drawPixelRect(eyeX, headY + 12, 4, 4, '#000000');
    
    this.drawPixelRect(x - 18, headY + 28, 36, 20, teamColor);
    this.drawPixelRect(x - 18, headY + 28, 36, 4, teamDarkColor);
    
    this.drawPixelText(player.team === 'red' ? 'R' : 'B', x - 4, headY + 32, 10, '#FFFFFF');
    
    const legOffset = player.state.animation === 'running' 
      ? Math.sin(animationFrame * 0.8) * 8 
      : 0;
    
    this.drawPixelRect(x - 14, bodyBottom - 12, 10, 12, teamDarkColor);
    this.drawPixelRect(x + 4, bodyBottom - 12, 10, 12, teamDarkColor);
    
    if (player.state.animation === 'running') {
      this.drawPixelRect(x - 14 + legOffset, bodyBottom - 4, 10, 4, '#333333');
      this.drawPixelRect(x + 4 - legOffset, bodyBottom - 4, 10, 4, '#333333');
    } else {
      this.drawPixelRect(x - 14, bodyBottom - 4, 10, 4, '#333333');
      this.drawPixelRect(x + 4, bodyBottom - 4, 10, 4, '#333333');
    }
    
    const armAngle = player.state.animation === 'shooting' ? -0.8 : 0;
    const armX = isFacingRight ? x + 15 : x - 23;
    const armY = headY + 30 + Math.sin(armAngle) * 10;
    
    this.drawPixelRect(armX, armY, 8, 20, '#FFCC99');
    
    if (player.state.hasBall) {
      const ballX = isFacingRight ? x + 25 : x - 25;
      const ballY = armY + 5;
      this.drawPixelCircle(ballX, ballY, 12, '#FF8800');
      this.drawPixelLine(ballX - 10, ballY, ballX + 10, ballY, '#000000', 2);
      this.drawPixelLine(ballX, ballY - 10, ballX, ballY + 10, '#000000', 2);
    }
    
    if (player.state.isCharging && player.state.chargePower > 0) {
      const barWidth = 40;
      const barHeight = 6;
      const barX = x - barWidth / 2;
      const barY = bodyY - 25;
      
      this.drawPixelRect(barX, barY, barWidth, barHeight, '#333333');
      this.drawPixelRect(barX, barY, barWidth * player.state.chargePower, barHeight, 
        player.state.chargePower > 0.7 ? '#FF4444' : '#FFFF00');
    }
    
    if (player.state.currentItem && player.state.currentItem !== 'banana') {
      const itemConfig = ITEM_CONFIG[player.state.currentItem];
      const itemX = isFacingRight ? x + 20 : x - 20;
      const itemY = bodyY + 10;
      
      this.drawPixelCircle(itemX, itemY, 10, itemConfig.color);
      this.drawPixelRect(itemX - 8, itemY - 8, 16, 4, 'rgba(255,255,255,0.5)');
    }
    
    if (player.state.specialGauge >= 100) {
      this.drawPixelText('!', x - 3, bodyY - 45, 16, '#FFFF00');
      if (animationFrame % 4 === 0) {
        this.drawPixelCircle(x, bodyY - 35, 25, 'rgba(255,255,0,0.2)');
      }
    }
    
    if (!player.state.isAI) {
      this.drawPixelText('P', x - 4, bodyY - 55, 10, '#FFFF00');
    }
    
    this.ctx.restore();
  }

  private renderKnockedOut(x: number, y: number, teamColor: string): void {
    const rotation = (Date.now() * 0.01) % (Math.PI * 2);
    
    this.ctx.save();
    this.ctx.translate(x, y - 30);
    this.ctx.rotate(rotation * 0.3);
    
    this.drawPixelRect(-15, -15, 30, 30, '#FFCC99');
    this.drawPixelText('X', -6, -8, 14, '#000000');
    
    this.drawPixelRect(-18, 15, 36, 15, teamColor);
    
    for (let i = 0; i < 3; i++) {
      const starX = Math.sin(Date.now() * 0.01 + i) * 25;
      const starY = -30 + Math.cos(Date.now() * 0.01 + i) * 10;
      this.drawPixelText('★', starX - 5, starY, 10, '#FFFF00');
    }
    
    this.ctx.restore();
  }
}
