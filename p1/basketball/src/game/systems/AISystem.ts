import { Player } from '../entities/Player';
import { Ball } from '../entities/Ball';
import { COURT_CONFIG } from '../../types/game';
import { Vector2Math } from '../physics/Vector2';

export interface AIDecision {
  moveX: number;
  moveY: number;
  jump: boolean;
  pass: boolean;
  shoot: boolean;
  passTarget?: Player;
}

export class AISystem {
  private difficulty: number = 0.7;

  update(player: Player, teammates: Player[], opponents: Player[], ball: Ball): AIDecision {
    const decision: AIDecision = {
      moveX: 0,
      moveY: 0,
      jump: false,
      pass: false,
      shoot: false,
    };

    if (player.state.isKnockedOut) {
      return decision;
    }

    const ballHolder = this.findBallHolder(teammates, opponents);
    const isOurBall = ballHolder && [...teammates, player].some(p => p.id === ballHolder.id);
    const opponentHoopX = player.team === 'red' ? COURT_CONFIG.RIGHT_HOOP_X : COURT_CONFIG.LEFT_HOOP_X;
    const ourHoopX = player.team === 'red' ? COURT_CONFIG.LEFT_HOOP_X : COURT_CONFIG.RIGHT_HOOP_X;

    if (player.state.hasBall) {
      return this.handleOffense(player, opponents, teammates, ball, opponentHoopX);
    } else if (isOurBall) {
      return this.handleSupport(player, ballHolder!, ball, opponentHoopX);
    } else {
      return this.handleDefense(player, opponents, ball, ballHolder, ourHoopX);
    }
  }

  private findBallHolder(teammates: Player[], opponents: Player[]): Player | null {
    const allPlayers = [...teammates, ...opponents];
    return allPlayers.find(p => p.state.hasBall) || null;
  }

  private handleOffense(player: Player, opponents: Player[], teammates: Player[], _ball: Ball, opponentHoopX: number): AIDecision {
    const decision: AIDecision = { moveX: 0, moveY: 0, jump: false, pass: false, shoot: false };
    
    const distanceToHoop = Math.abs(player.position.x - opponentHoopX);
    const nearestDefender = this.findNearestOpponent(player, opponents);
    const defenderDistance = nearestDefender ? player.distanceTo(nearestDefender) : 999;

    if (player.canUseSpecial() && distanceToHoop < 500) {
      decision.shoot = Math.random() < 0.3;
      return decision;
    }

    if (distanceToHoop < 100 && player.state.isJumping) {
      decision.shoot = true;
      return decision;
    }

    const openTeammate = this.findOpenTeammate(player, teammates, opponents);
    if (openTeammate && defenderDistance < 80 && Math.random() < 0.08) {
      decision.pass = true;
      decision.passTarget = openTeammate;
      return decision;
    }

    if (openTeammate && openTeammate.position.y < player.position.y - 50 && Math.random() < 0.05) {
      decision.pass = true;
      decision.passTarget = openTeammate;
      return decision;
    }

    if (defenderDistance < 60 && Math.random() < 0.05) {
      decision.pass = true;
      if (teammates.length > 0) {
        decision.passTarget = teammates.reduce((nearest, t) => 
          player.distanceTo(t) < player.distanceTo(nearest) ? t : nearest
        );
      }
      return decision;
    }

    if (distanceToHoop < 250 && Math.random() < 0.015) {
      decision.jump = true;
      decision.shoot = true;
      return decision;
    }

    const direction = opponentHoopX > player.position.x ? 1 : -1;
    decision.moveX = direction * this.difficulty;
    
    if (!player.state.isJumping && distanceToHoop < 120 && Math.random() < 0.03) {
      decision.jump = true;
    }

    return decision;
  }

  private findOpenTeammate(player: Player, teammates: Player[], opponents: Player[]): Player | null {
    if (teammates.length === 0) return null;
    
    let bestTeammate: Player | null = null;
    let bestScore = -Infinity;
    
    for (const teammate of teammates) {
      if (teammate.state.isKnockedOut) continue;
      
      const nearestOpponent = this.findNearestOpponent(teammate, opponents);
      const opponentDist = nearestOpponent ? teammate.distanceTo(nearestOpponent) : 999;
      
      const openness = opponentDist - Vector2Math.distance(player.position, teammate.position) * 0.3;
      
      if (openness > bestScore) {
        bestScore = openness;
        bestTeammate = teammate;
      }
    }
    
    return bestScore > 20 ? bestTeammate : null;
  }

  private handleSupport(player: Player, ballHolder: Player, _ball: Ball, opponentHoopX: number): AIDecision {
    const decision: AIDecision = { moveX: 0, moveY: 0, jump: false, pass: false, shoot: false };
    
    const targetX = opponentHoopX > player.position.x 
      ? player.position.x + 100 
      : player.position.x - 100;
    
    const distanceToHolder = Vector2Math.distance(player.position, ballHolder.position);
    
    if (distanceToHolder < 80) {
      decision.moveX = targetX > player.position.x ? 1 : -1;
    } else if (distanceToHolder > 200) {
      decision.moveX = ballHolder.position.x > player.position.x ? 1 : -1;
    }

    if (player.canUseSpecial() && ballHolder.state.isJumping && distanceToHolder < 150) {
      decision.jump = true;
    }

    return decision;
  }

  private handleDefense(
    player: Player, 
    _opponents: Player[], 
    ball: Ball, 
    ballHolder: Player | null,
    ourHoopX: number
  ): AIDecision {
    const decision: AIDecision = { moveX: 0, moveY: 0, jump: false, pass: false, shoot: false };
    
    if (ballHolder) {
      const distanceToHolder = Vector2Math.distance(player.position, ballHolder.position);
      
      if (ballHolder.state.isJumping && ballHolder.state.hasBall) {
        if (distanceToHolder < 80 && !player.state.isJumping && Math.random() < 0.4) {
          decision.jump = true;
          return decision;
        }
      }
      
      const idealPositionX = (ballHolder.position.x + ourHoopX) / 2;
      decision.moveX = idealPositionX > player.position.x ? 1 : -1;
      
      if (distanceToHolder < 50 && Math.random() < 0.05) {
        decision.pass = true;
      }
    } else {
      const distanceToBall = Vector2Math.distance(player.position, ball.position);
      if (distanceToBall > 30) {
        decision.moveX = ball.position.x > player.position.x ? 1 : -1;
        if (ball.position.y < player.position.y - 50 && Math.random() < 0.1) {
          decision.jump = true;
        }
      }
    }

    return decision;
  }

  private findNearestOpponent(player: Player, opponents: Player[]): Player | null {
    if (opponents.length === 0) return null;
    return opponents.reduce((nearest, opponent) => {
      const dist = player.distanceTo(opponent);
      const nearestDist = player.distanceTo(nearest);
      return dist < nearestDist ? opponent : nearest;
    });
  }
}
