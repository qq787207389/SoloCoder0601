class Ball extends PhysicsBody {
    constructor(x, y) {
        super(x, y, BALL_RADIUS, 0.8);
        this.friction = BALL_FRICTION;
        this.bounciness = 0.5;
        this.trail = [];
        this.isSpecial = false;
        this.specialType = null;
        this.specialTimer = 0;
        this.phantomBalls = [];
        this.lastKicker = null;
        this.controller = null;
    }

    update(dt, weather) {
        if (this.isSpecial) {
            this.specialTimer -= dt;
            if (this.specialTimer <= 0) {
                this.endSpecial();
            }
        }
        
        if (weather && weather.effect === 'wind') {
            this.vx += weather.windForce * 0.02;
        }
        
        super.update(dt, GRAVITY * 0.1);
        this.checkBoundaries();
        
        if (this.getSpeed() > 3) {
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            if (this.trail.length > 15) this.trail.shift();
        }
        
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].alpha -= 0.07;
            if (this.trail[i].alpha <= 0) {
                this.trail.splice(i, 1);
            }
        }
        
        for (const phantom of this.phantomBalls) {
            phantom.x += phantom.vx;
            phantom.y += phantom.vy;
            phantom.life -= dt;
        }
        this.phantomBalls = this.phantomBalls.filter(p => p.life > 0);
    }

    checkBoundaries() {
        const left = PITCH_X + this.radius;
        const right = PITCH_X + PITCH_WIDTH - this.radius;
        const top = PITCH_Y + this.radius;
        const bottom = PITCH_Y + PITCH_HEIGHT - this.radius;
        
        const goalTop = PITCH_Y + PITCH_HEIGHT / 2 - GOAL_HEIGHT / 2;
        const goalBottom = PITCH_Y + PITCH_HEIGHT / 2 + GOAL_HEIGHT / 2;
        const inGoalY = this.y > goalTop && this.y < goalBottom;

        if (this.x < left && !inGoalY) {
            this.x = left;
            this.vx = Math.abs(this.vx) * this.bounciness;
        }
        if (this.x > right && !inGoalY) {
            this.x = right;
            this.vx = -Math.abs(this.vx) * this.bounciness;
        }
        if (this.y < top) {
            this.y = top;
            this.vy = Math.abs(this.vy) * this.bounciness;
        }
        if (this.y > bottom) {
            this.y = bottom;
            this.vy = -Math.abs(this.vy) * this.bounciness;
        }
    }

    setSpecial(type) {
        this.isSpecial = true;
        this.specialType = type;
        this.specialTimer = 120;
        
        switch(type) {
            case 'PHANTOM_SHOT':
                this.createPhantomBalls();
                break;
        }
    }

    endSpecial() {
        this.isSpecial = false;
        this.specialType = null;
        this.phantomBalls = [];
    }

    createPhantomBalls() {
        const baseAngle = Math.atan2(this.vy, this.vx);
        for (let i = -1; i <= 1; i++) {
            if (i === 0) continue;
            const angle = baseAngle + i * 0.3;
            this.phantomBalls.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * this.getSpeed(),
                vy: Math.sin(angle) * this.getSpeed(),
                life: 60
            });
        }
    }

    applySpin(spinX, spinY) {
        this.spinX = spinX;
        this.spinY = spinY;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.trail = [];
        this.isSpecial = false;
        this.specialType = null;
        this.phantomBalls = [];
        this.lastKicker = null;
    }

    draw(ctx) {
        for (const point of this.trail) {
            const alpha = point.alpha * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        for (const phantom of this.phantomBalls) {
            ctx.globalAlpha = phantom.life / 60 * 0.5;
            ctx.fillStyle = '#88ccff';
            ctx.beginPath();
            ctx.arc(phantom.x, phantom.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        if (this.isSpecial) {
            this.drawSpecialEffect(ctx);
        }
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + this.x * 0.01;
            const px = this.x + Math.cos(angle) * this.radius * 0.5;
            const py = this.y + Math.sin(angle) * this.radius * 0.5;
            ctx.beginPath();
            ctx.arc(px, py, this.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawSpecialEffect(ctx) {
        switch(this.specialType) {
            case 'FIRE_SHOT':
                this.drawFireEffect(ctx);
                break;
            case 'METEOR_SHOT':
                this.drawMeteorEffect(ctx);
                break;
            case 'PHANTOM_SHOT':
                this.drawPhantomEffect(ctx);
                break;
        }
    }

    drawFireEffect(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2.5
        );
        gradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.7)');
        gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        for (let i = 0; i < 5; i++) {
            const offset = (Date.now() * 0.01 + i * 20) % 30;
            const angle = Math.atan2(-this.vy, -this.vx);
            const fx = this.x + Math.cos(angle) * offset;
            const fy = this.y + Math.sin(angle) * offset;
            ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${1 - offset / 30})`;
            ctx.beginPath();
            ctx.arc(fx, fy, this.radius * (0.8 - offset / 50), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMeteorEffect(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 3
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(150, 100, 200, 0.8)');
        gradient.addColorStop(0.6, 'rgba(100, 50, 150, 0.5)');
        gradient.addColorStop(1, 'rgba(50, 0, 100, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.005;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(angle) * this.radius * 4,
                this.y + Math.sin(angle) * this.radius * 4
            );
            ctx.stroke();
        }
    }

    drawPhantomEffect(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2
        );
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(50, 150, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
