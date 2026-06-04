import { Renderer } from './Renderer';
import { Court, BeachCourt, StreetCourt, HighwayCourt } from '../courts/Court';
import { Hoop } from '../entities/Hoop';
import { GAME_CONFIG, COURT_CONFIG, ITEM_CONFIG } from '../../types/game';
import { Item } from '../entities/Item';

export class CourtRenderer extends Renderer {
  render(court: Court, hoops: Hoop[], items: Item[], bananaPeels: { position: { x: number; y: number }; active: boolean }[]): void {
    this.renderBackground(court);
    this.renderCourtLines(court);
    this.renderHoops(hoops);
    this.renderCourtFeatures(court);
    this.renderItems(items);
    this.renderBananaPeels(bananaPeels);
    this.renderGround(court);
  }

  private renderBackground(court: Court): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.HEIGHT);
    gradient.addColorStop(0, court.backgroundColor);
    gradient.addColorStop(0.7, court.backgroundColor);
    gradient.addColorStop(1, court.groundColor);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    if (court.type === 'beach') {
      for (let i = 0; i < 5; i++) {
        const cloudX = (Date.now() * 0.02 + i * 300) % (this.width + 200) - 100;
        const cloudY = 50 + i * 30;
        this.drawPixelCircle(cloudX, cloudY, 25, 'rgba(255,255,255,0.8)');
        this.drawPixelCircle(cloudX + 20, cloudY + 5, 20, 'rgba(255,255,255,0.8)');
        this.drawPixelCircle(cloudX - 20, cloudY + 5, 18, 'rgba(255,255,255,0.8)');
      }
    }
    
    if (court.type === 'street') {
      for (let i = 0; i < 20; i++) {
        const x = i * 70 + 30;
        const y = 100 + (i % 3) * 50;
        this.drawPixelText('★', x, y, 12, 'rgba(255,255,255,0.1)');
      }
    }
    
    if (court.type === 'highway') {
      for (let i = 0; i < 10; i++) {
        const x = (Date.now() * 0.3 + i * 150) % this.width;
        this.drawPixelRect(x, 350, 40, 4, '#FFFFFF');
        this.drawPixelRect(x, 450, 40, 4, '#FFFFFF');
      }
    }
  }

  private renderCourtLines(court: Court): void {
    const lineColor = court.lineColor;
    
    this.drawPixelRect(COURT_CONFIG.LEFT_BOUND, GAME_CONFIG.GROUND_Y - 2, COURT_CONFIG.RIGHT_BOUND - COURT_CONFIG.LEFT_BOUND, 4, lineColor);
    
    this.drawPixelRect(COURT_CONFIG.CENTER_X - 2, 200, 4, GAME_CONFIG.GROUND_Y - 200, lineColor);
    
    this.drawPixelCircle(COURT_CONFIG.CENTER_X, GAME_CONFIG.GROUND_Y - 100, 80, lineColor);
    this.ctx.strokeStyle = lineColor;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(COURT_CONFIG.CENTER_X, GAME_CONFIG.GROUND_Y - 100, 80, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.drawPixelRect(COURT_CONFIG.LEFT_HOOP_X - 100, GAME_CONFIG.GROUND_Y - 250, 4, 250, lineColor);
    this.drawPixelRect(COURT_CONFIG.LEFT_HOOP_X - 100, GAME_CONFIG.GROUND_Y - 250, 100, 4, lineColor);
    
    this.drawPixelRect(COURT_CONFIG.RIGHT_HOOP_X, GAME_CONFIG.GROUND_Y - 250, 4, 250, lineColor);
    this.drawPixelRect(COURT_CONFIG.RIGHT_HOOP_X, GAME_CONFIG.GROUND_Y - 250, 100, 4, lineColor);
    
    this.ctx.setLineDash([10, 10]);
    this.drawPixelRect(COURT_CONFIG.LEFT_HOOP_X - COURT_CONFIG.THREE_POINT_LINE, GAME_CONFIG.GROUND_Y - 250, 4, 250, lineColor);
    this.drawPixelRect(COURT_CONFIG.RIGHT_HOOP_X + COURT_CONFIG.THREE_POINT_LINE - 4, GAME_CONFIG.GROUND_Y - 250, 4, 250, lineColor);
    this.ctx.setLineDash([]);
  }

  private renderHoops(hoops: Hoop[]): void {
    hoops.forEach(hoop => {
      const x = hoop.position.x;
      const y = hoop.position.y;
      
      if (!hoop.state.isBroken) {
        this.drawPixelRect(x - 55, y - 60, 8, 120, '#FFFFFF');
        this.drawPixelRect(x - 55, y - 60, 80, 60, 'rgba(255,255,255,0.3)');
        this.drawPixelRect(x - 55, y - 60, 80, 60, 'rgba(200,200,255,0.5)');
        
        this.drawPixelRect(x - 55, y - 60, 80, 4, '#FF0000');
        this.drawPixelRect(x - 55, y - 4, 80, 4, '#FF0000');
        this.drawPixelRect(x - 55, y - 60, 4, 60, '#FF0000');
        this.drawPixelRect(x + 21, y - 60, 4, 60, '#FF0000');
      } else {
        this.drawPixelRect(x - 55, y - 60, 8, 120, '#FFFFFF');
        
        hoop.state.glassPieces.forEach(piece => {
          this.ctx.save();
          this.ctx.translate(piece.x, piece.y);
          this.ctx.rotate(piece.rotation);
          this.drawPixelRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size, 'rgba(200,220,255,0.7)');
          this.ctx.restore();
        });
      }
      
      this.drawPixelRect(x - 35, y - 4, 70, 8, '#FF6600');
      
      for (let i = 0; i < 6; i++) {
        const netX = x - 30 + i * 12;
        this.drawPixelLine(netX, y + 4, netX - 5 + i * 2, y + 40, '#FFFFFF', 2);
      }
      
      this.drawPixelLine(x - 30, y + 4, x + 30, y + 4, '#FFFFFF', 2);
      this.drawPixelLine(x - 25, y + 20, x + 25, y + 20, '#FFFFFF', 2);
      this.drawPixelLine(x - 18, y + 35, x + 18, y + 35, '#FFFFFF', 2);
      
      if (hoop.state.isBroken) {
        this.drawPixelText('BROKEN!', x - 35, y - 80, 12, '#FF0000');
      }
    });
  }

  private renderCourtFeatures(court: Court): void {
    if (court.type === 'beach') {
      const beachCourt = court as BeachCourt;
      beachCourt.getSandZones().forEach(zone => {
        this.drawPixelRect(zone.x, zone.y, zone.width, zone.height, 'rgba(244, 208, 63, 0.5)');
        
        for (let i = 0; i < zone.width; i += 10) {
          this.drawPixelRect(zone.x + i, zone.y + 5, 2, 2, 'rgba(200, 180, 50, 0.6)');
        }
      });
      
      for (let i = 0; i < 8; i++) {
        const palmX = COURT_CONFIG.LEFT_BOUND - 30 + i * 180;
        this.drawPixelRect(palmX, 350, 10, 200, '#8B4513');
        for (let j = 0; j < 5; j++) {
          const leafAngle = (j / 5) * Math.PI - Math.PI / 2;
          const leafX = palmX + 5 + Math.cos(leafAngle) * 30;
          const leafY = 340 + Math.sin(leafAngle) * 15;
          this.drawPixelRect(leafX - 15, leafY, 30, 8, '#228B22');
        }
      }
    }
    
    if (court.type === 'street') {
      const streetCourt = court as StreetCourt;
      streetCourt.getElectricFences().forEach(fence => {
        const color = fence.active ? '#FFFF00' : '#666666';
        
        this.drawPixelRect(fence.x, fence.y, fence.width, fence.height, color);
        
        for (let i = 0; i < fence.height; i += 20) {
          this.drawPixelRect(fence.x - 5, fence.y + i, fence.width + 10, 4, '#444444');
        }
        
        if (fence.active) {
          for (let i = 0; i < 3; i++) {
            const sparkX = fence.x + Math.random() * fence.width;
            const sparkY = fence.y + Math.random() * fence.height;
            this.drawPixelRect(sparkX, sparkY, 3, 3, '#FFFFFF');
          }
        }
      });
      
      this.drawPixelText('NO RULES', COURT_CONFIG.CENTER_X - 50, 150, 16, 'rgba(255,0,0,0.3)');
    }
    
    if (court.type === 'highway') {
      const highwayCourt = court as HighwayCourt;
      const truck = highwayCourt.getTruck();
      
      this.drawPixelRect(0, 300, this.width, 300, '#333333');
      
      for (let i = 0; i < this.width; i += 80) {
        this.drawPixelRect(i, 448, 40, 4, '#FFFFFF');
        this.drawPixelRect(i, 548, 40, 4, '#FFFFFF');
      }
      
      if (truck.active && truck.warningTimer <= 0) {
        this.drawPixelRect(truck.x, truck.y - 80, 150, 100, '#CC0000');
        this.drawPixelRect(truck.x + 100, truck.y - 100, 50, 40, '#880000');
        
        this.drawPixelRect(truck.x + 110, truck.y - 90, 30, 25, '#88CCFF');
        
        this.drawPixelCircle(truck.x + 30, truck.y + 20, 20, '#222222');
        this.drawPixelCircle(truck.x + 30, truck.y + 20, 12, '#666666');
        this.drawPixelCircle(truck.x + 120, truck.y + 20, 20, '#222222');
        this.drawPixelCircle(truck.x + 120, truck.y + 20, 12, '#666666');
        
        if (truck.hasBall) {
          this.drawPixelCircle(truck.x + 70, truck.y - 30, 12, '#FF8800');
        }
      }
    }
  }

  private renderItems(items: Item[]): void {
    items.forEach(item => {
      const pos = item.getDisplayPosition();
      const config = ITEM_CONFIG[item.type];
      
      this.drawPixelCircle(pos.x, pos.y, 18, config.color);
      this.drawPixelCircle(pos.x, pos.y, 14, 'rgba(255,255,255,0.3)');
      
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(config.icon, pos.x, pos.y + 6);
      
      if (Math.floor(Date.now() / 200) % 2 === 0) {
        this.drawPixelCircle(pos.x, pos.y, 22, 'rgba(255,255,255,0.2)');
      }
    });
  }

  private renderBananaPeels(peels: { position: { x: number; y: number }; active: boolean }[]): void {
    peels.forEach(peel => {
      if (peel.active) {
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🍌', peel.position.x, peel.position.y + 6);
      }
    });
  }

  private renderGround(court: Court): void {
    this.drawPixelRect(COURT_CONFIG.LEFT_BOUND, GAME_CONFIG.GROUND_Y, 
      COURT_CONFIG.RIGHT_BOUND - COURT_CONFIG.LEFT_BOUND, 120, court.groundColor);
    
    this.drawPixelRect(COURT_CONFIG.LEFT_BOUND, GAME_CONFIG.GROUND_Y, 
      COURT_CONFIG.RIGHT_BOUND - COURT_CONFIG.LEFT_BOUND, 4, court.lineColor);
  }
}
