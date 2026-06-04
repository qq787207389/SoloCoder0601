class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.collected = false;
        this.bobOffset = 0;
        this.rotation = 0;
    }

    update(dt) {
        this.bobOffset = Math.sin(Date.now() * 0.005) * 5;
        this.rotation += 0.02;
    }

    collect() {
        this.collected = true;
        playSound('powerup');
    }

    draw(ctx) {
        if (this.collected) return;
        
        const drawY = this.y + this.bobOffset;
        const info = POWERUP_TYPES[this.type];
        
        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = info.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        switch(this.type) {
            case 'SPEED':
                ctx.fillText('⚡', 0, 0);
                break;
            case 'POWER':
                ctx.fillText('💪', 0, 0);
                break;
            case 'BANANA':
                ctx.fillText('🍌', 0, 0);
                break;
            case 'HEALTH':
                ctx.fillText('💖', 0, 0);
                break;
        }
        
        ctx.restore();
        
        ctx.save();
        const gradient = ctx.createRadialGradient(this.x, drawY, 0, this.x, drawY, this.radius * 2);
        gradient.addColorStop(0, info.color + '80');
        gradient.addColorStop(1, info.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, drawY, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class PowerupManager {
    constructor() {
        this.powerups = [];
        this.spawnTimer = 0;
    }

    update(dt, players) {
        this.spawnTimer += dt * 16;
        if (this.spawnTimer >= POWERUP_SPAWN_INTERVAL) {
            this.spawnTimer = 0;
            this.spawnPowerup();
        }
        
        for (const powerup of this.powerups) {
            powerup.update(dt);
            
            if (!powerup.collected) {
                for (const player of players) {
                    const dist = distance(player.x, player.y, powerup.x, powerup.y);
                    if (dist < player.radius + powerup.radius) {
                        powerup.collect();
                        
                        if (powerup.type === 'BANANA') {
                            player.knockback(Math.random() * Math.PI * 2, 8);
                        } else {
                            player.addPowerup(powerup.type);
                        }
                    }
                }
            }
        }
        
        this.powerups = this.powerups.filter(p => !p.collected);
    }

    spawnPowerup() {
        if (this.powerups.length >= 5) return;
        
        const types = Object.keys(POWERUP_TYPES);
        const type = types[randomInt(0, types.length - 1)];
        
        const x = random(PITCH_X + 100, PITCH_X + PITCH_WIDTH - 100);
        const y = random(PITCH_Y + 100, PITCH_Y + PITCH_HEIGHT - 100);
        
        this.powerups.push(new Powerup(x, y, type));
    }

    draw(ctx) {
        for (const powerup of this.powerups) {
            powerup.draw(ctx);
        }
    }
}
