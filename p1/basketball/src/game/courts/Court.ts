import { CourtType, GAME_CONFIG, COURT_CONFIG, TruckState } from '../../types/game';
import { Player } from '../entities/Player';
import { Ball } from '../entities/Ball';

import { Effect } from '../entities/Effect';

export abstract class Court {
  type: CourtType;
  name: string;
  backgroundColor: string;
  groundColor: string;
  lineColor: string;

  constructor(type: CourtType, name: string, bgColor: string, groundColor: string, lineColor: string) {
    this.type = type;
    this.name = name;
    this.backgroundColor = bgColor;
    this.groundColor = groundColor;
    this.lineColor = lineColor;
  }

  abstract update(players: Player[], ball: Ball, deltaTime: number): Effect[];
  abstract applySpeedModifier(player: Player): number;

  isInSlowZone(_x: number, _y: number): boolean {
    return false;
  }

  checkHazardCollision(_player: Player): boolean {
    return false;
  }
}

export class BeachCourt extends Court {
  private sandZone: { x: number; y: number; width: number; height: number }[];

  constructor() {
    super('beach', '海滨球场', '#87CEEB', '#F4D03F', '#FFFFFF');
    
    this.sandZone = [
      { x: COURT_CONFIG.LEFT_BOUND, y: GAME_CONFIG.GROUND_Y - 30, width: 200, height: 30 },
      { x: COURT_CONFIG.RIGHT_BOUND - 200, y: GAME_CONFIG.GROUND_Y - 30, width: 200, height: 30 },
    ];
  }

  update(players: Player[], _ball: Ball, _deltaTime: number): Effect[] {
    const effects: Effect[] = [];
    
    players.forEach(player => {
      if (this.isInSlowZone(player.position.x, player.position.y) && !player.state.isJumping) {
        if (Math.random() < 0.1 && Math.abs(player.velocity.x) > 1) {
          effects.push(Effect.createSmoke(player.position.x, player.position.y - 10));
        }
      }
    });
    
    return effects;
  }

  applySpeedModifier(player: Player): number {
    if (this.isInSlowZone(player.position.x, player.position.y) && !player.state.isJumping) {
      return 0.7;
    }
    return 1.0;
  }

  isInSlowZone(x: number, y: number): boolean {
    return this.sandZone.some(zone => 
      x > zone.x && x < zone.x + zone.width && y > zone.y
    );
  }

  getSandZones() {
    return this.sandZone;
  }
}

export class StreetCourt extends Court {
  private electricFence: { x: number; y: number; width: number; height: number; active: boolean; timer: number }[];

  constructor() {
    super('street', '街头球场', '#2C3E50', '#34495E', '#E74C3C');
    
    this.electricFence = [
      { x: COURT_CONFIG.LEFT_BOUND - 20, y: 200, width: 20, height: 400, active: false, timer: 0 },
      { x: COURT_CONFIG.RIGHT_BOUND, y: 200, width: 20, height: 400, active: false, timer: 0 },
    ];
  }

  update(players: Player[], _ball: Ball, _deltaTime: number): Effect[] {
    const effects: Effect[] = [];
    
    this.electricFence.forEach(fence => {
      fence.timer++;
      if (fence.timer > 180) {
        fence.active = !fence.active;
        fence.timer = 0;
        if (fence.active) {
          effects.push(Effect.createSpark(fence.x + 10, fence.y + 200));
          effects.push(Effect.createSpark(fence.x + 10, fence.y + 300));
        }
      }
    });

    players.forEach(player => {
      if (player.state.isKnockedOut) return;
      
      if (this.checkHazardCollision(player)) {
        player.state.isKnockedOut = true;
        player.state.knockoutTimer = 60;
        player.state.animation = 'knockedout';
        player.velocity.x = player.position.x < COURT_CONFIG.CENTER_X ? -8 : 8;
        player.velocity.y = -10;
        
        effects.push(Effect.createText(player.position.x, player.position.y - 60, '触电了!', '#FFFF00'));
        for (let i = 0; i < 5; i++) {
          effects.push(Effect.createSpark(player.position.x, player.position.y - 30));
        }
      }
    });
    
    return effects;
  }

  applySpeedModifier(_player: Player): number {
    return 1.0;
  }

  checkHazardCollision(player: Player): boolean {
    return this.electricFence.some(fence => {
      if (!fence.active) return false;
      return player.position.x > fence.x - 10 && 
             player.position.x < fence.x + fence.width + 10 &&
             player.position.y > fence.y &&
             player.position.y < fence.y + fence.height;
    });
  }

  getElectricFences() {
    return this.electricFence;
  }
}

export class HighwayCourt extends Court {
  private truck: TruckState;
  private truckSpawnTimer: number;

  constructor() {
    super('highway', '高速公路球场', '#1A1A2E', '#4A4A4A', '#FFD700');
    
    this.truck = {
      x: -300,
      y: GAME_CONFIG.GROUND_Y - 100,
      active: false,
      speed: 8,
      hasBall: false,
      warningTimer: 0,
    };
    this.truckSpawnTimer = 600;
  }

  update(players: Player[], ball: Ball, _deltaTime: number): Effect[] {
    const effects: Effect[] = [];
    
    this.truckSpawnTimer--;
    if (this.truckSpawnTimer <= 0 && !this.truck.active) {
      this.truck.active = true;
      this.truck.warningTimer = 120;
      this.truck.x = -300;
      this.truckSpawnTimer = 900 + Math.random() * 600;
      
      effects.push(Effect.createText(COURT_CONFIG.CENTER_X, 100, '卡车警告!', '#FF0000'));
    }

    if (this.truck.active) {
      if (this.truck.warningTimer > 0) {
        this.truck.warningTimer--;
        if (this.truck.warningTimer % 15 === 0) {
          effects.push(Effect.createText(COURT_CONFIG.CENTER_X, 150, '!!!', '#FF0000'));
        }
      } else {
        this.truck.x += this.truck.speed;
        
        players.forEach(player => {
          if (player.state.isKnockedOut) return;
          
          if (player.position.x > this.truck.x - 50 && 
              player.position.x < this.truck.x + 150 &&
              player.position.y > this.truck.y - 80) {
            player.state.isKnockedOut = true;
            player.state.knockoutTimer = 90;
            player.state.animation = 'knockedout';
            player.velocity.x = 15;
            player.velocity.y = -12;
            
            effects.push(Effect.createText(player.position.x, player.position.y - 60, '被撞飞了!', '#FF4444'));
            for (let i = 0; i < 8; i++) {
              effects.push(Effect.createSpark(player.position.x, player.position.y));
            }
          }
        });

        if (!ball.state.isHeld && !this.truck.hasBall) {
          if (ball.position.x > this.truck.x + 20 && 
              ball.position.x < this.truck.x + 120 &&
              ball.position.y > this.truck.y - 60 &&
              ball.position.y < this.truck.y + 20) {
            ball.state.isInTruck = true;
            this.truck.hasBall = true;
            ball.velocity.x = 0;
            ball.velocity.y = 0;
            
            effects.push(Effect.createText(COURT_CONFIG.CENTER_X, 200, '球被卡车带走了!', '#FFAA00'));
          }
        }

        if (this.truck.hasBall) {
          ball.position.x = this.truck.x + 70;
          ball.position.y = this.truck.y - 30;
        }

        if (this.truck.x > GAME_CONFIG.WIDTH + 300) {
          if (this.truck.hasBall) {
            ball.state.isInTruck = false;
            ball.position.x = COURT_CONFIG.CENTER_X;
            ball.position.y = 300;
            ball.velocity.x = 0;
            ball.velocity.y = 0;
            this.truck.hasBall = false;
            
            effects.push(Effect.createText(COURT_CONFIG.CENTER_X, 200, '球掉下来了!', '#44FF44'));
          }
          this.truck.active = false;
        }
      }
    }
    
    return effects;
  }

  applySpeedModifier(_player: Player): number {
    return 1.0;
  }

  getTruck() {
    return this.truck;
  }
}

export class CourtFactory {
  static create(type: CourtType): Court {
    switch (type) {
      case 'beach':
        return new BeachCourt();
      case 'street':
        return new StreetCourt();
      case 'highway':
        return new HighwayCourt();
      default:
        return new StreetCourt();
    }
  }
}
