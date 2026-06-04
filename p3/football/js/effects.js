class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class EffectsManager {
    constructor() {
        this.particles = [];
        this.speedLines = [];
        this.screenShake = 0;
        this.flashEffect = 0;
    }

    update(dt) {
        this.particles = this.particles.filter(p => p.update(dt));
        
        if (this.screenShake > 0) {
            this.screenShake -= dt * 0.5;
        }
        
        if (this.flashEffect > 0) {
            this.flashEffect -= dt * 0.1;
        }
    }

    addParticles(x, y, count, color, speed, size = 4) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = random(speed * 0.5, speed);
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                color,
                size,
                random(30, 60)
            ));
        }
    }

    addExplosion(x, y, colors = ['#ff6b6b', '#ffd93d', '#fff']) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = random(2, 8);
            const color = colors[randomInt(0, colors.length - 1)];
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                color,
                random(3, 8),
                random(40, 80)
            ));
        }
        this.screenShake = 20;
        this.flashEffect = 1;
    }

    addDust(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(
                x + random(-10, 10),
                y,
                random(-1, 1),
                random(-2, -0.5),
                'rgba(150, 120, 80, 0.6)',
                random(2, 5),
                random(20, 40)
            ));
        }
    }

    addSpeedLines(x, y, angle, length) {
        this.speedLines.push({
            x, y, angle, length,
            life: 10
        });
    }

    addGoalEffect(goalX, goalY) {
        this.addExplosion(goalX, goalY, ['#ffd93d', '#ff6b6b', '#fff', '#4ecdc4']);
        this.flashEffect = 1.5;
        this.screenShake = 30;
    }

    getShakeOffset() {
        if (this.screenShake <= 0) return { x: 0, y: 0 };
        return {
            x: random(-this.screenShake, this.screenShake),
            y: random(-this.screenShake, this.screenShake)
        };
    }

    draw(ctx) {
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
        
        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const line = this.speedLines[i];
            line.life--;
            
            if (line.life <= 0) {
                this.speedLines.splice(i, 1);
                continue;
            }
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${line.life / 10 * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(
                line.x + Math.cos(line.angle) * line.length,
                line.y + Math.sin(line.angle) * line.length
            );
            ctx.stroke();
        }
        
        if (this.flashEffect > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(this.flashEffect, 0.3)})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }
}

class UIEffects {
    static drawConcentratedLines(ctx, x, y, radius, count, intensity) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const innerRadius = radius * 0.5;
            const outerRadius = radius;
            
            ctx.beginPath();
            ctx.moveTo(
                x + Math.cos(angle) * outerRadius,
                y + Math.sin(angle) * outerRadius
            );
            ctx.lineTo(
                x + Math.cos(angle) * innerRadius,
                y + Math.sin(angle) * innerRadius
            );
            ctx.stroke();
        }
    }

    static drawMotionBlur(ctx, x, y, vx, vy, color, radius) {
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < 2) return;
        
        const blurLength = Math.min(speed * 3, 30);
        const angle = Math.atan2(-vy, -vx);
        
        ctx.globalAlpha = 0.3;
        for (let i = 1; i <= 3; i++) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                x + Math.cos(angle) * i * (blurLength / 4),
                y + Math.sin(angle) * i * (blurLength / 4),
                radius * (1 - i * 0.2),
                0, Math.PI * 2
            );
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
