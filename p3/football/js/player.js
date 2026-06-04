class Player extends PhysicsBody {
    constructor(x, y, team, playerIndex, isGoalkeeper = false, isHuman = false) {
        super(x, y, PLAYER_RADIUS, 1.5);
        this.team = team;
        this.playerIndex = playerIndex;
        this.name = PLAYER_NAMES[playerIndex % PLAYER_NAMES.length];
        this.isGoalkeeper = isGoalkeeper;
        this.isHuman = isHuman;
        this.friction = 0.92;
        
        this.state = PLAYER_STATES.IDLE;
        this.stateTimer = 0;
        this.direction = 0;
        
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRegen = 0.15;
        
        this.hasBall = false;
        this.kickCooldown = 0;
        this.tackleCooldown = 0;
        
        this.powerups = [];
        this.speedMultiplier = 1;
        this.powerMultiplier = 1;
        
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.rotation = 0;
        this.isFlying = false;
        this.flyHeight = 0;
        this.flyRotation = 0;
        
        this.consecutiveGoalsAgainst = 0;
        this.isEnraged = false;
        
        this.chargeTime = 0;
        this.isCharging = false;
        this.specialMoveType = null;
    }

    update(dt, game) {
        this.updatePowerups(dt);
        this.regenerateStamina(dt);
        
        if (this.kickCooldown > 0) this.kickCooldown -= dt;
        if (this.tackleCooldown > 0) this.tackleCooldown -= dt;
        
        if (this.stateTimer > 0) {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.recoverFromState();
            }
        }
        
        if (this.isFlying) {
            this.flyHeight = Math.max(0, this.flyHeight - 2);
            this.flyRotation += 0.3;
            if (this.flyHeight <= 0) {
                this.isFlying = false;
                this.flyRotation = 0;
            }
        }
        
        if (this.isCharging && this.state === PLAYER_STATES.CHARGING) {
            this.chargeTime += dt;
            this.stamina = Math.max(0, this.stamina - 0.2);
        }
        
        if (this.state !== PLAYER_STATES.FALLEN && 
            this.state !== PLAYER_STATES.PETRIFIED &&
            this.state !== PLAYER_STATES.CELEBRATING) {
            super.update(dt, 0);
        }
        
        this.updateAnimation(dt);
        this.checkBoundaries();
        
        if (this.isGoalkeeper && !this.isEnraged) {
            this.stayInGoal();
        }
    }

    updatePowerups(dt) {
        this.speedMultiplier = 1;
        this.powerMultiplier = 1;
        
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.remainingTime -= dt;
            
            if (powerup.remainingTime <= 0) {
                this.powerups.splice(i, 1);
                continue;
            }
            
            if (powerup.type === 'SPEED') {
                this.speedMultiplier = 1.8;
            } else if (powerup.type === 'POWER') {
                this.powerMultiplier = 2;
            }
        }
    }

    regenerateStamina(dt) {
        if (this.state !== PLAYER_STATES.CHARGING) {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
        }
    }

    move(dx, dy) {
        if (this.state === PLAYER_STATES.FALLEN || 
            this.state === PLAYER_STATES.PETRIFIED ||
            this.state === PLAYER_STATES.CELEBRATING) return;
        
        const speed = PLAYER_SPEED * this.speedMultiplier;
        const nx = dx * speed;
        const ny = dy * speed;
        
        this.vx += nx * 0.3;
        this.vy += ny * 0.3;
        
        const maxSpeed = PLAYER_MAX_SPEED * this.speedMultiplier;
        const currentSpeed = this.getSpeed();
        if (currentSpeed > maxSpeed) {
            const ratio = maxSpeed / currentSpeed;
            this.vx *= ratio;
            this.vy *= ratio;
        }
        
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            this.direction = Math.atan2(dy, dx);
            if (this.state !== PLAYER_STATES.CHARGING) {
                this.state = PLAYER_STATES.RUNNING;
            }
        } else if (this.state === PLAYER_STATES.RUNNING) {
            this.state = PLAYER_STATES.IDLE;
        }
    }

    kick(ball, isSpecial = false, specialType = null) {
        if (this.kickCooldown > 0 || this.state === PLAYER_STATES.FALLEN) return false;
        
        const dist = distance(this.x, this.y, ball.x, ball.y);
        if (dist > this.radius + ball.radius + 25) return false;
        
        const goalX = this.team === 0 ? PITCH_X + PITCH_WIDTH : PITCH_X;
        const goalY = PITCH_Y + PITCH_HEIGHT / 2;
        let kickAngle = angle(this.x, this.y, goalX, goalY);
        
        if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
            kickAngle = Math.atan2(this.vy, this.vx);
        }
        
        if (isSpecial) {
            if (this.stamina < SPECIAL_MOVES[specialType].cost) return false;
            this.stamina -= SPECIAL_MOVES[specialType].cost;
            this.specialMoveType = specialType;
            
            const power = KICK_POWER * this.powerMultiplier * SPECIAL_MOVES[specialType].power;
            ball.vx = Math.cos(kickAngle) * power;
            ball.vy = Math.sin(kickAngle) * power;
            ball.lastKicker = this;
            
            this.state = PLAYER_STATES.KICKING;
            this.stateTimer = 30;
            this.kickCooldown = 40;
            playSound('special');
            return true;
        }
        
        const power = KICK_POWER * this.powerMultiplier;
        
        ball.vx = Math.cos(kickAngle) * power;
        ball.vy = Math.sin(kickAngle) * power;
        ball.lastKicker = this;
        
        this.state = PLAYER_STATES.KICKING;
        this.stateTimer = 15;
        this.kickCooldown = 20;
        
        playSound('kick');
        return true;
    }

    tackle(target) {
        if (this.tackleCooldown > 0 || this.state === PLAYER_STATES.FALLEN) return;
        
        const dist = distance(this.x, this.y, target.x, target.y);
        if (dist > this.radius + target.radius + 30) return;
        
        this.state = PLAYER_STATES.TACKLING;
        this.stateTimer = 25;
        this.tackleCooldown = 45;
        
        const tackleAngle = angle(this.x, this.y, target.x, target.y);
        target.knockback(tackleAngle, TACKLE_POWER);
        target.vx = -target.vx * 0.5;
        target.vy = -target.vy * 0.5;
        
        playSound('tackle');
    }

    knockback(fromAngle, power) {
        this.vx += Math.cos(fromAngle) * power * 0.8;
        this.vy += Math.sin(fromAngle) * power * 0.8;
        this.state = PLAYER_STATES.FALLEN;
        this.stateTimer = 60;
        this.isFlying = true;
        this.flyHeight = 40;
        this.flyRotation = 0;
        playSound('hit');
    }

    startCharge() {
        if (this.state === PLAYER_STATES.FALLEN || this.stamina < 20) return;
        this.state = PLAYER_STATES.CHARGING;
        this.isCharging = true;
        this.chargeTime = 0;
    }

    releaseCharge(ball) {
        if (!this.isCharging) return;
        
        this.isCharging = false;
        
        if (this.chargeTime > 30) {
            const moveTypes = ['FIRE_SHOT', 'PHANTOM_SHOT', 'METEOR_SHOT'];
            const selectedMove = moveTypes[this.playerIndex % moveTypes.length];
            this.kick(ball, true, selectedMove);
        }
        
        this.chargeTime = 0;
        this.state = PLAYER_STATES.IDLE;
    }

    recoverFromState() {
        if (this.state === PLAYER_STATES.FALLEN) {
            this.state = PLAYER_STATES.IDLE;
        } else if (this.state === PLAYER_STATES.CELEBRATING) {
            this.state = PLAYER_STATES.IDLE;
        }
    }

    celebrate() {
        this.state = PLAYER_STATES.CELEBRATING;
        this.stateTimer = 120;
    }

    petrify() {
        this.state = PLAYER_STATES.PETRIFIED;
        this.stateTimer = 90;
    }

    stayInGoal() {
        const goalX = this.team === 0 ? PITCH_X + 30 : PITCH_X + PITCH_WIDTH - 30;
        const goalY = PITCH_Y + PITCH_HEIGHT / 2;
        
        if (Math.abs(this.x - goalX) > 100) {
            this.x = lerp(this.x, goalX, 0.1);
        }
        this.y = clamp(this.y, goalY - GOAL_HEIGHT / 2 + 30, goalY + GOAL_HEIGHT / 2 - 30);
    }

    checkBoundaries() {
        CollisionResolver.constrainToPitch(this);
    }

    updateAnimation(dt) {
        this.animTimer += dt;
        if (this.animTimer > 5) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    addPowerup(type) {
        const powerupInfo = POWERUP_TYPES[type];
        if (powerupInfo.duration > 0) {
            this.powerups.push({
                type: type,
                remainingTime: powerupInfo.duration / 16
            });
        } else if (type === 'HEALTH') {
            this.stamina = this.maxStamina;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - this.flyHeight);
        
        if (this.isFlying) {
            ctx.rotate(this.flyRotation);
        }
        
        if (this.state === PLAYER_STATES.PETRIFIED) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#888';
            this.drawBody(ctx, '#888', '#666');
            ctx.restore();
            return;
        }
        
        const teamColor = TEAMS[this.team];
        const jerseyColor = this.isGoalkeeper ? '#000' : teamColor.color;
        const shortsColor = teamColor.secondary;
        
        this.drawBody(ctx, jerseyColor, shortsColor);
        
        if (this.isCharging) {
            this.drawChargeEffect(ctx);
        }
        
        ctx.restore();
        this.drawPowerupIndicators(ctx);
    }

    drawBody(ctx, jerseyColor, shortsColor) {
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 5;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(-8, 10, 6, 12 + legOffset);
        ctx.fillRect(2, 10, 6, 12 - legOffset);
        
        ctx.fillStyle = jerseyColor;
        ctx.beginPath();
        ctx.ellipse(0, 5, 14, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = shortsColor;
        ctx.fillRect(-12, 12, 24, 8);
        
        ctx.fillStyle = '#ffd5b5';
        ctx.beginPath();
        ctx.arc(0, -12, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, -12, 14, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(-8, -14, 5, 4);
        ctx.fillRect(3, -14, 5, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(-6, -13, 3, 2);
        ctx.fillRect(5, -13, 3, 2);
        
        ctx.fillStyle = '#000';
        if (this.state === PLAYER_STATES.TACKLING || this.state === PLAYER_STATES.KICKING) {
            ctx.fillRect(-4, -6, 8, 3);
        } else {
            ctx.fillRect(-3, -6, 6, 2);
        }
        
        if (this.isGoalkeeper) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-12, -2, 24, 4);
        }
        
        if (this.isEnraged) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-12, -24);
            ctx.lineTo(-8, -28);
            ctx.lineTo(-4, -24);
            ctx.moveTo(4, -24);
            ctx.lineTo(8, -28);
            ctx.lineTo(12, -24);
            ctx.stroke();
        }
    }

    drawChargeEffect(ctx) {
        const chargeRadius = 20 + this.chargeTime * 0.3;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, chargeRadius);
        gradient.addColorStop(0, 'rgba(255, 217, 61, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, chargeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.rotate(this.chargeTime * 0.1);
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 3);
            ctx.fillStyle = `rgba(255, 217, 61, ${0.5 + Math.sin(this.chargeTime * 0.2 + i) * 0.3})`;
            ctx.fillRect(chargeRadius - 5, -2, 10, 4);
            ctx.restore();
        }
        ctx.restore();
    }

    drawPowerupIndicators(ctx) {
        if (this.powerups.length === 0) return;
        
        let y = this.y - 50;
        for (const powerup of this.powerups) {
            const info = POWERUP_TYPES[powerup.type];
            ctx.fillStyle = info.color;
            ctx.fillRect(this.x - 8, y, 16, 8);
            y -= 12;
        }
    }
}
