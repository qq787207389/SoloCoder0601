class SpecialMoveSystem {
    constructor(game) {
        this.game = game;
        this.activeMoves = [];
    }

    executeSpecialMove(player, ball, moveType) {
        const move = SPECIAL_MOVES[moveType];
        if (!move || player.stamina < move.cost) return false;
        
        player.stamina -= move.cost;
        
        const angleToGoal = this.getAngleToGoal(player, ball);
        const power = KICK_POWER * move.power * player.powerMultiplier;
        
        switch(moveType) {
            case 'FIRE_SHOT':
                this.fireShot(player, ball, angleToGoal, power);
                break;
            case 'PHANTOM_SHOT':
                this.phantomShot(player, ball, angleToGoal, power);
                break;
            case 'METEOR_SHOT':
                this.meteorShot(player, ball, angleToGoal, power);
                break;
            case 'COMBINATION':
                this.combinationShot(player, ball, angleToGoal, power);
                break;
        }
        
        ball.lastKicker = player;
        ball.setSpecial(moveType);
        this.game.effects.addExplosion(ball.x, ball.y);
        
        return true;
    }

    getAngleToGoal(player, ball) {
        const goalX = player.team === 0 ? PITCH_X + PITCH_WIDTH : PITCH_X;
        const goalY = PITCH_Y + PITCH_HEIGHT / 2;
        return angle(ball.x, ball.y, goalX, goalY);
    }

    fireShot(player, ball, angle, power) {
        ball.vx = Math.cos(angle) * power;
        ball.vy = Math.sin(angle) * power;
        ball.lastKicker = player;
        this.activeMoves.push({
            type: 'FIRE_SHOT',
            ball: ball,
            timer: 120,
            trail: []
        });
    }

    phantomShot(player, ball, angle, power) {
        ball.vx = Math.cos(angle) * power;
        ball.vy = Math.sin(angle) * power;
        ball.lastKicker = player;
        
        for (let i = -1; i <= 1; i += 2) {
            const phantomAngle = angle + i * 0.25;
            const phantom = {
                x: ball.x,
                y: ball.y,
                vx: Math.cos(phantomAngle) * power * 0.9,
                vy: Math.sin(phantomAngle) * power * 0.9,
                radius: BALL_RADIUS,
                life: 90,
                isReal: false
            };
            this.activeMoves.push({
                type: 'PHANTOM_BALL',
                phantom: phantom,
                timer: 90
            });
        }
    }

    meteorShot(player, ball, angle, power) {
        ball.vx = Math.cos(angle) * power * 0.7;
        ball.vy = -8;
        ball.lastKicker = player;
        
        const gameRef = this.game;
        setTimeout(() => {
            if (ball && gameRef.ball === ball) {
                ball.vx = Math.cos(angle) * power * 1.5;
                ball.vy = Math.sin(angle) * power * 0.3 + 8;
            }
        }, 600);
    }

    combinationShot(player, ball, angle, power) {
        const teamMates = this.game.players.filter(p => 
            p.team === player.team && 
            p !== player && 
            distance(p.x, p.y, player.x, player.y) < 100
        );
        
        if (teamMates.length > 0) {
            const mate = teamMates[0];
            const combinedPower = power * 1.5;
            ball.vx = Math.cos(angle) * combinedPower;
            ball.vy = Math.sin(angle) * combinedPower;
            
            this.game.effects.addExplosion((player.x + mate.x) / 2, (player.y + mate.y) / 2);
        } else {
            ball.vx = Math.cos(angle) * power;
            ball.vy = Math.sin(angle) * power;
        }
        ball.lastKicker = player;
    }

    update(dt) {
        for (let i = this.activeMoves.length - 1; i >= 0; i--) {
            const move = this.activeMoves[i];
            move.timer -= dt;
            
            if (move.type === 'PHANTOM_BALL') {
                move.phantom.x += move.phantom.vx;
                move.phantom.y += move.phantom.vy;
                move.phantom.vx *= 0.99;
                move.phantom.vy *= 0.99;
            }
            
            if (move.timer <= 0) {
                this.activeMoves.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const move of this.activeMoves) {
            if (move.type === 'PHANTOM_BALL') {
                ctx.globalAlpha = move.timer / 90 * 0.6;
                ctx.fillStyle = '#88ccff';
                ctx.beginPath();
                ctx.arc(move.phantom.x, move.phantom.y, move.phantom.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    }

    checkPhantomBallCollision(player) {
        for (const move of this.activeMoves) {
            if (move.type === 'PHANTOM_BALL') {
                const dist = distance(
                    player.x, player.y,
                    move.phantom.x, move.phantom.y
                );
                if (dist < player.radius + move.phantom.radius) {
                    player.knockback(
                        angle(move.phantom.x, move.phantom.y, player.x, player.y),
                        5
                    );
                }
            }
        }
    }
}
