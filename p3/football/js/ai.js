class AIController {
    constructor(player, team) {
        this.player = player;
        this.team = team;
        this.decisionTimer = 0;
        this.currentTarget = null;
        this.behavior = 'balanced';
    }

    update(dt, game) {
        if (this.player.state === PLAYER_STATES.FALLEN || 
            this.player.state === PLAYER_STATES.PETRIFIED ||
            this.player.state === PLAYER_STATES.CELEBRATING) return;
        
        this.decisionTimer -= dt;
        if (this.decisionTimer <= 0) {
            this.makeDecision(game);
            this.decisionTimer = random(10, 30);
        }
        
        this.executeBehavior(game);
    }

    makeDecision(game) {
        const ball = game.ball;
        const hasBall = this.isTeamHasBall(game);
        const distToBall = distance(this.player.x, this.player.y, ball.x, ball.y);
        
        if (hasBall) {
            if (this.player.isGoalkeeper) {
                this.behavior = 'defend';
            } else if (distToBall < 50) {
                this.behavior = 'attack';
            } else {
                this.behavior = 'support';
            }
        } else {
            if (this.player.isGoalkeeper) {
                this.behavior = 'defend';
            } else {
                this.behavior = 'chase';
            }
        }
    }

    isTeamHasBall(game) {
        for (const player of game.players) {
            if (player.team === this.team && player.hasBall) {
                return true;
            }
        }
        return false;
    }

    executeBehavior(game) {
        const ball = game.ball;
        const ownGoalX = this.team === 0 ? PITCH_X : PITCH_X + PITCH_WIDTH;
        const enemyGoalX = this.team === 0 ? PITCH_X + PITCH_WIDTH : PITCH_X;
        const goalY = PITCH_Y + PITCH_HEIGHT / 2;
        
        switch(this.behavior) {
            case 'chase':
                this.chaseBall(ball);
                break;
            case 'attack':
                this.attack(ball, enemyGoalX, goalY);
                break;
            case 'defend':
                this.defend(ball, ownGoalX, goalY);
                break;
            case 'support':
                this.support(game);
                break;
        }
    }

    chaseBall(ball) {
        const dx = ball.x - this.player.x;
        const dy = ball.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            this.player.move(dx / dist, dy / dist);
        }
        
        if (dist < this.player.radius + ball.radius + 20) {
            this.player.kick(ball);
        }
    }

    attack(ball, goalX, goalY) {
        const distToBall = distance(this.player.x, this.player.y, ball.x, ball.y);
        const distToGoal = Math.abs(this.player.x - goalX);
        
        const dx = goalX - this.player.x;
        const dy = goalY - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (distToBall < 50) {
            if (dist > 5) {
                this.player.move(dx / dist * 0.7, dy / dist * 0.3);
            }
            
            if (distToGoal < 350 && this.player.stamina > 30 && Math.random() < 0.03) {
                this.player.startCharge();
                const gameRef = game;
                setTimeout(() => {
                    this.player.releaseCharge(ball);
                    if (this.player.specialMoveType && gameRef.specialMoveSystem) {
                        gameRef.specialMoveSystem.executeSpecialMove(
                            this.player, ball, this.player.specialMoveType
                        );
                    }
                }, 400);
            } else if (distToGoal < 500 && Math.random() < 0.08) {
                this.player.kick(ball);
            }
        } else {
            this.chaseBall(ball);
        }
    }

    defend(ball, goalX, goalY) {
        const distToBall = distance(this.player.x, this.player.y, ball.x, ball.y);
        
        let targetX, targetY;
        if (this.player.isGoalkeeper) {
            targetX = goalX + (this.team === 0 ? 30 : -30);
            targetY = clamp(ball.y, goalY - GOAL_HEIGHT / 2 + 30, goalY + GOAL_HEIGHT / 2 - 30);
        } else {
            const ballToGoalX = goalX - ball.x;
            const ballToGoalY = goalY - ball.y;
            const ballToGoalDist = Math.sqrt(ballToGoalX * ballToGoalX + ballToGoalY * ballToGoalY);
            
            targetX = ball.x - (ballToGoalX / ballToGoalDist) * 50;
            targetY = ball.y - (ballToGoalY / ballToGoalDist) * 50;
        }
        
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            this.player.move(dx / dist, dy / dist);
        }
        
        if (!this.player.isGoalkeeper && distToBall < 50 && Math.random() < 0.1) {
            this.player.tackle(this.getClosestEnemy(game));
        }
    }

    support(game) {
        const teamMates = game.players.filter(p => p.team === this.team && p !== this.player);
        if (teamMates.length === 0) {
            this.chaseBall(game.ball);
            return;
        }
        
        let closestTeamMate = teamMates[0];
        let minDist = Infinity;
        for (const mate of teamMates) {
            const dist = distance(this.player.x, this.player.y, mate.x, mate.y);
            if (dist < minDist) {
                minDist = dist;
                closestTeamMate = mate;
            }
        }
        
        const enemyGoalX = this.team === 0 ? PITCH_X + PITCH_WIDTH : PITCH_X;
        const supportX = closestTeamMate.x + (enemyGoalX > closestTeamMate.x ? 50 : -50);
        const supportY = closestTeamMate.y + random(-50, 50);
        
        const dx = supportX - this.player.x;
        const dy = supportY - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
            this.player.move(dx / dist, dy / dist);
        }
    }

    getClosestEnemy(game) {
        let closest = null;
        let minDist = Infinity;
        
        for (const player of game.players) {
            if (player.team !== this.team) {
                const dist = distance(this.player.x, this.player.y, player.x, player.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = player;
                }
            }
        }
        
        return closest;
    }
}
