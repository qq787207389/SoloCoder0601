import { 
  GameState, Team, CourtType,
  GAME_CONFIG, COURT_CONFIG, PLAYER_CONFIG 
} from '../../types/game';
import { Player } from '../entities/Player';
import { Ball } from '../entities/Ball';
import { Hoop } from '../entities/Hoop';
import { Effect } from '../entities/Effect';
import { Court, CourtFactory } from '../courts/Court';
import { InputSystem } from '../systems/InputSystem';
import { AISystem } from '../systems/AISystem';
import { SpecialSystem } from '../systems/SpecialSystem';
import { ItemSystem } from '../systems/ItemSystem';
import { Vector2Math } from '../physics/Vector2';

export class GameEngine {
  private state: GameState;
  private players: Player[] = [];
  private ball: Ball;
  private hoops: Hoop[] = [];
  private effects: Effect[] = [];
  private court: Court;
  private inputSystem: InputSystem;
  private aiSystem: AISystem;
  private specialSystem: SpecialSystem;
  private itemSystem: ItemSystem;
  private frameCount: number = 0;
  private onStateChange: ((state: GameState) => void) | null = null;
  private scoreResetTimer: number = 0;
  private lastScoringTeam: Team | null = null;

  constructor(selectedCourt: CourtType = 'street', selectedTeam: Team = 'red') {
    this.state = {
      phase: 'countdown',
      time: GAME_CONFIG.MATCH_TIME,
      maxTime: GAME_CONFIG.MATCH_TIME,
      score: { red: 0, blue: 0 },
      countdown: 180,
      selectedCourt,
      selectedTeam,
      screenShake: 0,
    };

    this.inputSystem = new InputSystem();
    this.aiSystem = new AISystem();
    this.specialSystem = new SpecialSystem();
    this.itemSystem = new ItemSystem();
    this.court = CourtFactory.create(selectedCourt);
    
    this.ball = new Ball(COURT_CONFIG.CENTER_X, 300);
    this.hoops = [new Hoop('red'), new Hoop('blue')];
    
    this.initializePlayers(selectedTeam);
  }

  private initializePlayers(selectedTeam: Team): void {
    const isPlayer1Red = selectedTeam === 'red';
    
    this.players = [
      new Player('player1', isPlayer1Red ? 'red' : 'blue', 300, GAME_CONFIG.GROUND_Y, false),
      new Player('player2', isPlayer1Red ? 'red' : 'blue', 500, GAME_CONFIG.GROUND_Y, true),
      new Player('player3', isPlayer1Red ? 'blue' : 'red', 800, GAME_CONFIG.GROUND_Y, true),
      new Player('player4', isPlayer1Red ? 'blue' : 'red', 1000, GAME_CONFIG.GROUND_Y, false),
    ];
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  update(deltaTime: number = 1): void {
    this.frameCount++;
    
    if (this.state.phase === 'countdown') {
      this.updateCountdown();
      return;
    }
    
    if (this.state.phase === 'gameover') {
      return;
    }

    if (this.state.screenShake > 0) {
      this.state.screenShake--;
    }

    if (this.state.phase === 'paused' && this.scoreResetTimer > 0) {
      this.checkScore();
      this.updateEffects(deltaTime);
      this.effects = this.effects.filter(e => e.active);
      if (this.frameCount % 60 === 0) {
        this.notifyStateChange();
      }
      return;
    }

    if (this.state.phase !== 'playing') {
      return;
    }

    this.state.time -= 1 / 60;
    if (this.state.time <= 0) {
      this.state.time = 0;
      this.state.phase = 'gameover';
      this.notifyStateChange();
      return;
    }

    this.handleInput();
    this.updateAI();
    this.updateEntities(deltaTime);
    this.checkCollisions();
    this.checkScore();
    this.updateEffects(deltaTime);
    
    const courtEffects = this.court.update(this.players, this.ball, deltaTime);
    this.effects.push(...courtEffects);
    
    const itemEffects = this.itemSystem.update(this.players, deltaTime);
    this.effects.push(...itemEffects);

    this.applyCourtSpeedModifiers();

    this.effects = this.effects.filter(e => e.active);
    
    if (this.frameCount % 60 === 0) {
      this.notifyStateChange();
    }
  }

  private updateCountdown(): void {
    this.state.countdown--;
    
    if (this.state.countdown <= 0) {
      this.state.phase = 'playing';
      this.startJumpBall();
    }
    
    this.notifyStateChange();
  }

  private startJumpBall(): void {
    this.ball.reset(COURT_CONFIG.CENTER_X, 300);
    this.ball.velocity.y = -8;
    
    this.players[0].position.x = COURT_CONFIG.CENTER_X - 50;
    this.players[0].position.y = GAME_CONFIG.GROUND_Y;
    this.players[2].position.x = COURT_CONFIG.CENTER_X + 50;
    this.players[2].position.y = GAME_CONFIG.GROUND_Y;
  }

  private handleInput(): void {
    const player1Input = this.inputSystem.getPlayerInput(1);
    const player2Input = this.inputSystem.getPlayerInput(2);
    
    const player1 = this.players.find(p => p.id === 'player1')!;
    const player4 = this.players.find(p => p.id === 'player4')!;
    
    this.applyInputToPlayer(player1, player1Input);
    this.applyInputToPlayer(player4, player2Input);
  }

  private applyInputToPlayer(player: Player, input: any): void {
    if (player.state.isKnockedOut) return;
    
    let moveX = 0;
    let moveY = 0;
    
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;
    if (input.up) moveY -= 1;
    if (input.down) moveY += 1;
    
    if (moveX !== 0 || moveY !== 0) {
      player.move(moveX, moveY);
    }
    
    if (input.jump && !player.state.isJumping) {
      player.jump();
    }
    
    if (input.pass) {
      if (player.state.hasBall) {
        const teammates = this.players.filter(p => p.team === player.team && p.id !== player.id);
        if (teammates.length > 0) {
          const target = teammates.reduce((nearest, t) => 
            player.distanceTo(t) < player.distanceTo(nearest) ? t : nearest
          );
          const velocity = player.pass(target.position);
          this.ball.shoot(velocity);
          this.effects.push(Effect.createSpark(player.position.x, player.position.y - 30));
        }
      } else {
        const opponents = this.players.filter(p => p.team !== player.team);
        opponents.forEach(opponent => {
          if (player.steal(opponent)) {
            if (this.ball.state.holderId === opponent.id) {
              this.ball.setHeld(null);
            }
            this.ball.setHeld(player.id);
            player.state.hasBall = true;
            this.effects.push(Effect.createStar(player.position.x, player.position.y - 50, '#FFFF00'));
          }
        });
      }
    }
    
    if (input.shoot) {
      if (player.state.hasBall) {
        if (player.canUseSpecial()) {
          const specialType = this.specialSystem.getAutoSpecialType(player);
          if (specialType) {
            const effects = this.specialSystem.executeSpecial(player, specialType, this.ball, this.players);
            this.effects.push(...effects);
            this.addScreenShake(20);
          }
        } else {
          if (!player.state.isCharging) {
            player.state.isCharging = true;
            player.state.chargePower = 0;
          }
        }
      } else {
        const opponents = this.players.filter(p => p.team !== player.team);
        opponents.forEach(opponent => {
          if (player.block(opponent)) {
            if (this.ball.state.holderId === opponent.id) {
              this.ball.setHeld(null);
              this.ball.velocity.x = (player.state.facingRight ? 1 : -1) * 8;
              this.ball.velocity.y = -6;
            }
            this.effects.push(Effect.createStar(player.position.x, player.position.y - 50, '#44FF44'));
            this.addScreenShake(10);
          }
        });
      }
    } else if (player.state.isCharging && player.state.hasBall) {
      const velocity = player.shoot(player.state.chargePower);
      this.ball.shoot(velocity);
      player.state.isCharging = false;
      
      if (player.state.chargePower > 0.8) {
        const targetHoop = this.hoops.find(h => h.team !== player.team)!;
        const distance = Math.abs(player.position.x - targetHoop.position.x);
        
        if (distance < PLAYER_CONFIG.DUNK_DISTANCE && player.state.isJumping) {
          targetHoop.break();
          this.addScreenShake(30);
          for (let i = 0; i < 10; i++) {
            this.effects.push(Effect.createFire(targetHoop.position.x, targetHoop.position.y));
          }
          this.effects.push(Effect.createText(targetHoop.position.x, targetHoop.position.y - 80, 'SHATTERED!', '#FF0000'));
        }
      }
    }
  }

  private updateAI(): void {
    this.players.filter(p => p.isAI).forEach(player => {
      const teammates = this.players.filter(p => p.team === player.team && p.id !== player.id);
      const opponents = this.players.filter(p => p.team !== player.team);
      
      const decision = this.aiSystem.update(player, teammates, opponents, this.ball);
      
      if (decision.moveX !== 0 || decision.moveY !== 0) {
        player.move(decision.moveX, decision.moveY);
      }
      
      if (decision.jump && !player.state.isJumping) {
        player.jump();
      }
      
      if (decision.pass && player.state.hasBall) {
        const target = decision.passTarget || (teammates.length > 0 ? teammates[0] : null);
        if (target) {
          const velocity = player.pass(target.position);
          this.ball.shoot(velocity);
          this.effects.push(Effect.createSpark(player.position.x, player.position.y - 30));
        }
      }
      
      if (decision.shoot && player.state.hasBall) {
        if (player.canUseSpecial()) {
          const specialType = this.specialSystem.getAutoSpecialType(player);
          if (specialType) {
            const effects = this.specialSystem.executeSpecial(player, specialType, this.ball, this.players);
            this.effects.push(...effects);
            this.addScreenShake(20);
          }
        } else {
          const velocity = player.shoot(0.6);
          this.ball.shoot(velocity);
        }
      }
    });
  }

  private updateEntities(deltaTime: number): void {
    this.players.forEach(player => player.update(deltaTime));
    this.ball.update(deltaTime);
    this.hoops.forEach(hoop => hoop.update(deltaTime));
    
    if (this.ball.state.isHeld && this.ball.state.holderId) {
      const holder = this.players.find(p => p.id === this.ball.state.holderId);
      if (holder) {
        if (holder.state.isKnockedOut || !holder.state.hasBall) {
          this.ball.setHeld(null);
          this.ball.velocity.x = (Math.random() - 0.5) * 5;
          this.ball.velocity.y = -5;
        } else {
          const offsetX = holder.state.facingRight ? 20 : -20;
          this.ball.position.x = holder.position.x + offsetX;
          this.ball.position.y = holder.position.y - 50;
        }
      } else {
        this.ball.setHeld(null);
      }
    }

    this.ensureBallOnScreen();
  }

  private ensureBallOnScreen(): void {
    if (this.ball.state.isHeld || this.ball.state.isInTruck) return;

    const margin = 200;
    const outOfBounds = 
      this.ball.position.x < COURT_CONFIG.LEFT_BOUND - margin ||
      this.ball.position.x > COURT_CONFIG.RIGHT_BOUND + margin ||
      this.ball.position.y < -margin ||
      this.ball.position.y > GAME_CONFIG.HEIGHT + margin;

    if (outOfBounds) {
      this.ball.reset(COURT_CONFIG.CENTER_X, 300);
      this.ball.velocity.y = -5;
    }
  }

  private checkCollisions(): void {
    this.players.forEach(player => {
      if (player.state.isKnockedOut || this.ball.state.isHeld) return;
      
      const distance = Vector2Math.distance(player.position, this.ball.position);
      const pickupRange = player.state.currentItem === 'magnet' ? 80 : 40;
      
      if (distance < pickupRange && !this.ball.state.isInTruck) {
        if (player.state.currentItem === 'magnet' && distance > 30) {
          const pullDir = Vector2Math.normalize(Vector2Math.subtract(player.position, this.ball.position));
          this.ball.velocity.x += pullDir.x * 0.5;
          this.ball.velocity.y += pullDir.y * 0.5;
        } else if (distance < 30) {
          this.ball.setHeld(player.id);
          player.state.hasBall = true;
        }
      }
    });

    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const p1 = this.players[i];
        const p2 = this.players[j];
        
        if (p1.state.isKnockedOut || p2.state.isKnockedOut) continue;
        
        const distance = Vector2Math.distance(p1.position, p2.position);
        if (distance < PLAYER_CONFIG.WIDTH) {
          const overlap = PLAYER_CONFIG.WIDTH - distance;
          const normal = Vector2Math.normalize(Vector2Math.subtract(p2.position, p1.position));
          
          p1.position.x -= normal.x * overlap / 2;
          p2.position.x += normal.x * overlap / 2;
          
          const relVel = p2.velocity.x - p1.velocity.x;
          if (relVel < 0) {
            p1.velocity.x += relVel * 0.3;
            p2.velocity.x -= relVel * 0.3;
          }
        }
      }
    }
  }

  private checkScore(): void {
    if (this.scoreResetTimer > 0) {
      this.scoreResetTimer--;
      if (this.scoreResetTimer <= 0 && this.lastScoringTeam) {
        this.resetAfterScore(this.lastScoringTeam);
        this.lastScoringTeam = null;
      }
      return;
    }

    const scoringTeam = this.ball.checkScore();
    
    if (scoringTeam) {
      const targetHoop = this.hoops.find(h => h.team !== scoringTeam)!;
      
      if (!targetHoop.canScore()) {
        return;
      }
      
      const points = this.ball.isThreePointer(scoringTeam) ? 3 : 2;
      this.state.score[scoringTeam] += points;
      
      this.ball.setHeld(null);
      this.ball.velocity.x = 0;
      this.ball.velocity.y = 0;
      this.players.forEach(p => { p.state.hasBall = false; p.state.isCharging = false; });
      
      this.effects.push(Effect.createText(
        targetHoop.position.x, 
        targetHoop.position.y - 100, 
        `+${points}!`, 
        scoringTeam === 'red' ? '#FF4444' : '#4488FF'
      ));
      
      for (let i = 0; i < 5; i++) {
        this.effects.push(Effect.createStar(
          targetHoop.position.x + (Math.random() - 0.5) * 100,
          targetHoop.position.y + Math.random() * 50,
          scoringTeam === 'red' ? '#FF6600' : '#6688FF'
        ));
      }
      
      this.addScreenShake(15);
      
      this.scoreResetTimer = 90;
      this.lastScoringTeam = scoringTeam;
      this.state.phase = 'paused';
      this.notifyStateChange();
    }
  }

  private resetAfterScore(scoringTeam: Team): void {
    this.ball.reset(COURT_CONFIG.CENTER_X, 300);
    
    this.players.forEach((player, index) => {
      const baseX = player.team === scoringTeam ? 400 : 900;
      player.position.x = baseX + (index % 2) * 100;
      player.position.y = GAME_CONFIG.GROUND_Y;
      player.velocity.x = 0;
      player.velocity.y = 0;
      player.state.hasBall = false;
      player.state.isJumping = false;
      player.state.isKnockedOut = false;
      player.state.knockoutTimer = 0;
    });
    
    const nonScoringTeam = scoringTeam === 'red' ? 'blue' : 'red';
    const startingPlayer = this.players.find(p => p.team === nonScoringTeam && !p.isAI);
    if (startingPlayer) {
      this.ball.setHeld(startingPlayer.id);
      startingPlayer.state.hasBall = true;
    }
    
    this.state.phase = 'playing';
    this.notifyStateChange();
  }

  private updateEffects(deltaTime: number): void {
    this.effects.forEach(effect => effect.update(deltaTime));
  }

  private applyCourtSpeedModifiers(): void {
    this.players.forEach(player => {
      const modifier = this.court.applySpeedModifier(player);
      if (modifier < 1.0) {
        player.velocity.x *= modifier;
      }
    });
  }

  private addScreenShake(amount: number): void {
    this.state.screenShake = Math.min(this.state.screenShake + amount, 30);
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  getPlayers(): Player[] {
    return this.players;
  }

  getBall(): Ball {
    return this.ball;
  }

  getHoops(): Hoop[] {
    return this.hoops;
  }

  getEffects(): Effect[] {
    return this.effects;
  }

  getCourt(): Court {
    return this.court;
  }

  getItemSystem(): ItemSystem {
    return this.itemSystem;
  }

  getScreenShake(): { x: number; y: number } {
    if (this.state.screenShake <= 0) return { x: 0, y: 0 };
    const intensity = this.state.screenShake * 0.5;
    return {
      x: (Math.random() - 0.5) * intensity,
      y: (Math.random() - 0.5) * intensity,
    };
  }

  getCountdownDisplay(): number {
    return Math.ceil(this.state.countdown / 60);
  }

  pause(): void {
    if (this.state.phase === 'playing') {
      this.state.phase = 'paused';
      this.notifyStateChange();
    }
  }

  resume(): void {
    if (this.state.phase === 'paused') {
      this.state.phase = 'playing';
      this.notifyStateChange();
    }
  }

  reset(): void {
    this.state = {
      phase: 'countdown',
      time: GAME_CONFIG.MATCH_TIME,
      maxTime: GAME_CONFIG.MATCH_TIME,
      score: { red: 0, blue: 0 },
      countdown: 180,
      selectedCourt: this.state.selectedCourt,
      selectedTeam: this.state.selectedTeam,
      screenShake: 0,
    };
    
    this.ball.reset(COURT_CONFIG.CENTER_X, 300);
    this.itemSystem.reset();
    this.effects = [];
    this.scoreResetTimer = 0;
    this.lastScoringTeam = null;
    
    this.players.forEach((player, index) => {
      const isRed = this.state.selectedTeam === 'red' ? index < 2 : index >= 2;
      const baseX = isRed ? 300 : 900;
      player.position.x = baseX + (index % 2) * 100;
      player.position.y = GAME_CONFIG.GROUND_Y;
      player.velocity.x = 0;
      player.velocity.y = 0;
      player.state.hasBall = false;
      player.state.specialGauge = 0;
      player.state.currentItem = null;
      player.state.itemTimer = 0;
      player.state.isKnockedOut = false;
      player.state.knockoutTimer = 0;
    });
    
    this.hoops.forEach(hoop => {
      hoop.state.isBroken = false;
      hoop.state.breakTimer = 0;
      hoop.state.glassPieces = [];
    });
    
    this.notifyStateChange();
  }

  destroy(): void {
    this.inputSystem.destroy();
  }
}
