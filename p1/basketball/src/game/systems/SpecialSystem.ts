import { Player } from '../entities/Player';
import { Ball } from '../entities/Ball';
import { SpecialType, COURT_CONFIG, PLAYER_CONFIG } from '../../types/game';
import { Effect } from '../entities/Effect';
import { Vector2Math } from '../physics/Vector2';

export class SpecialSystem {
  executeSpecial(
    shooter: Player,
    type: SpecialType,
    ball: Ball,
    allPlayers: Player[]
  ): Effect[] {
    const effects: Effect[] = [];
    
    if (!shooter.useSpecial()) {
      return effects;
    }

    const targetHoopX = shooter.team === 'red' ? COURT_CONFIG.RIGHT_HOOP_X : COURT_CONFIG.LEFT_HOOP_X;
    const targetHoopY = COURT_CONFIG.HOOP_Y;

    switch (type) {
      case 'meteor':
        effects.push(...this.executeMeteor(shooter, ball, targetHoopX, targetHoopY));
        break;
      case 'tornado':
        effects.push(...this.executeTornado(shooter, ball, allPlayers));
        break;
      case 'dunk':
        effects.push(...this.executeDunk(shooter, ball, targetHoopX, targetHoopY));
        break;
      case 'block':
        effects.push(...this.executeBlock(shooter, ball, allPlayers));
        break;
      case 'shield':
        effects.push(...this.executeShield(shooter));
        break;
      case 'combo':
        effects.push(...this.executeCombo(shooter, ball, allPlayers, targetHoopX, targetHoopY));
        break;
    }

    return effects;
  }

  private executeMeteor(shooter: Player, ball: Ball, targetX: number, targetY: number): Effect[] {
    const effects: Effect[] = [];
    
    const direction = Vector2Math.normalize({
      x: targetX - shooter.position.x,
      y: targetY - shooter.position.y - 50,
    });
    
    const velocity = Vector2Math.multiply(direction, 18);
    ball.shoot(velocity, true, 'meteor');
    
    effects.push(Effect.createMeteor(
      shooter.position.x,
      shooter.position.y - 30,
      velocity.x,
      velocity.y
    ));
    
    effects.push(Effect.createText(shooter.position.x, shooter.position.y - 80, '燃烧流星!', '#FF4400'));
    
    return effects;
  }

  private executeTornado(shooter: Player, ball: Ball, allPlayers: Player[]): Effect[] {
    const effects: Effect[] = [];
    
    const direction = shooter.team === 'red' ? 1 : -1;
    ball.shoot({ x: direction * 12, y: -3 }, true, 'tornado');
    
    effects.push(Effect.createTornado(shooter.position.x, shooter.position.y - 30));
    effects.push(Effect.createText(shooter.position.x, shooter.position.y - 80, '龙卷风暴!', '#44AAFF'));
    
    allPlayers.forEach(player => {
      if (player.team !== shooter.team && !player.state.isKnockedOut) {
        const distance = Vector2Math.distance(player.position, shooter.position);
        if (distance < 150) {
          player.velocity.y = -15;
          player.velocity.x = (player.position.x - shooter.position.x) * 0.1;
          player.state.isJumping = true;
          effects.push(Effect.createStar(player.position.x, player.position.y - 40, '#88CCFF'));
        }
      }
    });
    
    return effects;
  }

  private executeDunk(shooter: Player, ball: Ball, targetX: number, targetY: number): Effect[] {
    const effects: Effect[] = [];
    
    shooter.position.x = targetX + (shooter.team === 'red' ? -20 : 20);
    shooter.position.y = targetY - 60;
    shooter.velocity.y = 20;
    shooter.state.animation = 'dunking';
    
    ball.position.x = shooter.position.x;
    ball.position.y = shooter.position.y - 10;
    ball.shoot({ x: 0, y: 15 }, true, 'dunk');
    
    for (let i = 0; i < 5; i++) {
      effects.push(Effect.createFire(shooter.position.x, shooter.position.y + 20));
    }
    effects.push(Effect.createText(shooter.position.x, shooter.position.y - 100, '暴力灌篮!', '#FF8800'));
    
    return effects;
  }

  private executeBlock(shooter: Player, ball: Ball, allPlayers: Player[]): Effect[] {
    const effects: Effect[] = [];
    
    shooter.velocity.y = -25;
    shooter.state.isJumping = true;
    
    const opponents = allPlayers.filter(p => p.team !== shooter.team);
    opponents.forEach(opponent => {
      if (opponent.state.hasBall && shooter.position.y < opponent.position.y) {
        const distance = Vector2Math.distance(shooter.position, opponent.position);
        if (distance < 100) {
          opponent.state.hasBall = false;
          if (ball.state.holderId === opponent.id) {
            ball.setHeld(null);
            ball.velocity.x = (shooter.state.facingRight ? 1 : -1) * 10;
            ball.velocity.y = -8;
          }
          shooter.knockout(opponent, 12);
        }
      }
    });
    
    effects.push(Effect.createText(shooter.position.x, shooter.position.y - 80, '空中拦截!', '#44FF44'));
    effects.push(Effect.createStar(shooter.position.x, shooter.position.y - 40, '#44FF44'));
    
    return effects;
  }

  private executeShield(shooter: Player): Effect[] {
    const effects: Effect[] = [];
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      effects.push(Effect.createSpark(
        shooter.position.x + Math.cos(angle) * 30,
        shooter.position.y - 30 + Math.sin(angle) * 30
      ));
    }
    
    effects.push(Effect.createText(shooter.position.x, shooter.position.y - 80, '双臂格挡!', '#FFFF00'));
    
    return effects;
  }

  private executeCombo(
    shooter: Player, 
    ball: Ball, 
    allPlayers: Player[],
    targetX: number, 
    targetY: number
  ): Effect[] {
    const effects: Effect[] = [];
    
    const teammates = allPlayers.filter(p => p.team === shooter.team && p.id !== shooter.id);
    if (teammates.length === 0) return effects;
    
    const partner = teammates[0];
    partner.position.x = targetX + (shooter.team === 'red' ? -30 : 30);
    partner.position.y = targetY - 80;
    partner.velocity.y = -10;
    partner.state.isJumping = true;
    
    const passVel = Vector2Math.subtract(partner.position, shooter.position);
    const passDir = Vector2Math.normalize(passVel);
    ball.shoot(Vector2Math.multiply(passDir, 15), false);

    ball.position.x = partner.position.x;
    ball.position.y = partner.position.y - 10;
    ball.shoot({ x: 0, y: 18 }, true, 'dunk');
    
    effects.push(Effect.createFire(partner.position.x, partner.position.y));
    effects.push(Effect.createText(partner.position.x, partner.position.y - 100, '双人连携!', '#FF00FF'));
    
    return effects;
  }

  getAvailableSpecials(player: Player): SpecialType[] {
    const specials: SpecialType[] = [];
    
    if (!player.canUseSpecial()) return specials;
    
    if (player.state.hasBall) {
      specials.push('meteor', 'tornado');
      
      const targetX = player.team === 'red' ? COURT_CONFIG.RIGHT_HOOP_X : COURT_CONFIG.LEFT_HOOP_X;
      if (Math.abs(player.position.x - targetX) < PLAYER_CONFIG.DUNK_DISTANCE + 50) {
        specials.push('dunk');
      }
    } else {
      specials.push('block', 'shield');
    }
    
    return specials;
  }

  getAutoSpecialType(player: Player): SpecialType | null {
    const available = this.getAvailableSpecials(player);
    if (available.length === 0) return null;
    
    if (available.includes('dunk')) return 'dunk';
    if (available.includes('meteor')) return 'meteor';
    if (available.includes('block')) return 'block';
    return available[0];
  }
}
