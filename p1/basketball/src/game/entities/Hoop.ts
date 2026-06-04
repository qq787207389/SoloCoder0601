import { HoopState, Team, COURT_CONFIG } from '../../types/game';
import { Entity } from './Entity';

export class Hoop extends Entity {
  state: HoopState;
  team: Team;

  constructor(team: Team) {
    const x = team === 'red' ? COURT_CONFIG.RIGHT_HOOP_X : COURT_CONFIG.LEFT_HOOP_X;
    const y = COURT_CONFIG.HOOP_Y;
    super(`hoop-${team}`, x, y, COURT_CONFIG.HOOP_WIDTH, COURT_CONFIG.HOOP_HEIGHT);
    this.team = team;
    this.state = {
      team,
      x,
      y,
      isBroken: false,
      breakTimer: 0,
      glassPieces: [],
    };
  }

  update(_deltaTime: number): void {
    if (this.state.isBroken) {
      this.state.breakTimer--;
      if (this.state.breakTimer <= 0) {
        this.repair();
      }
      this.updateGlassPieces();
    }
  }

  break(): void {
    if (this.state.isBroken) return;
    
    this.state.isBroken = true;
    this.state.breakTimer = 600;
    
    for (let i = 0; i < 20; i++) {
      this.state.glassPieces.push({
        x: this.position.x + (Math.random() - 0.5) * 80,
        y: this.position.y - 40 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 8 - 2,
        size: 4 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
      });
    }
  }

  private updateGlassPieces(): void {
    this.state.glassPieces = this.state.glassPieces.filter(piece => {
      piece.vy += 0.5;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += 0.2;
      
      if (piece.y > 600) {
        piece.y = 600;
        piece.vy *= -0.3;
        piece.vx *= 0.9;
      }
      
      return piece.y < 700;
    });
  }

  private repair(): void {
    this.state.isBroken = false;
    this.state.glassPieces = [];
  }

  canScore(): boolean {
    return !this.state.isBroken;
  }
}
