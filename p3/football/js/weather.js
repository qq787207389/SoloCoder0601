class WeatherSystem {
    constructor() {
        this.currentWeather = 'SUNNY';
        this.weatherTimer = 0;
        this.weatherDuration = 0;
        this.transitioning = false;
        this.transitionAlpha = 0;
        
        this.raindrops = [];
        this.windForce = 0;
        this.tornadoes = [];
        this.holes = [];
        this.dustParticles = [];
    }

    update(dt, players, ball) {
        this.weatherTimer += dt * 16;
        
        if (this.weatherTimer >= this.weatherDuration && this.weatherDuration > 0) {
            this.changeWeather();
        }
        
        switch(this.currentWeather) {
            case 'RAIN':
                this.updateRain(dt);
                this.applySlipperyEffect(players);
                break;
            case 'WIND':
                this.updateWind(dt);
                break;
            case 'TORNADO':
                this.updateTornadoes(dt, players, ball);
                break;
            case 'EARTHQUAKE':
                this.updateEarthquake(dt, players, ball);
                break;
        }
        
        if (this.transitioning) {
            this.transitionAlpha += dt * 0.05;
            if (this.transitionAlpha >= 1) {
                this.transitioning = false;
                this.transitionAlpha = 0;
            }
        }
    }

    changeWeather() {
        const weathers = Object.keys(WEATHER_TYPES);
        let newWeather;
        do {
            newWeather = weathers[randomInt(0, weathers.length - 1)];
        } while (newWeather === this.currentWeather);
        
        this.currentWeather = newWeather;
        this.weatherTimer = 0;
        this.weatherDuration = random(15000, 45000);
        this.transitioning = true;
        this.transitionAlpha = 0;
        
        this.raindrops = [];
        this.tornadoes = [];
        this.holes = [];
        this.windForce = 0;
        
        if (newWeather === 'EARTHQUAKE') {
            this.createHoles();
        }
    }

    createHoles() {
        const numHoles = randomInt(2, 5);
        for (let i = 0; i < numHoles; i++) {
            this.holes.push({
                x: random(PITCH_X + 150, PITCH_X + PITCH_WIDTH - 150),
                y: random(PITCH_Y + 100, PITCH_Y + PITCH_HEIGHT - 100),
                radius: random(25, 50)
            });
        }
    }

    updateRain(dt) {
        while (this.raindrops.length < 150) {
            this.raindrops.push({
                x: random(PITCH_X, PITCH_X + PITCH_WIDTH),
                y: PITCH_Y - 20,
                speed: random(10, 15),
                length: random(10, 20)
            });
        }
        
        for (let i = this.raindrops.length - 1; i >= 0; i--) {
            const drop = this.raindrops[i];
            drop.y += drop.speed;
            drop.x += 2;
            
            if (drop.y > PITCH_Y + PITCH_HEIGHT) {
                this.raindrops.splice(i, 1);
            }
        }
    }

    applySlipperyEffect(players) {
        for (const player of players) {
            if (player.getSpeed() > 3 && Math.random() < 0.01) {
                player.friction = 0.98;
            } else {
                player.friction = 0.92;
            }
        }
    }

    updateWind(dt) {
        this.windForce = Math.sin(Date.now() * 0.001) * 3;
    }

    updateTornadoes(dt, players, ball) {
        if (this.tornadoes.length === 0) {
            this.tornadoes.push({
                x: random(PITCH_X + 200, PITCH_X + PITCH_WIDTH - 200),
                y: random(PITCH_Y + 200, PITCH_Y + PITCH_HEIGHT - 200),
                radius: 60,
                particles: []
            });
        }
        
        for (const tornado of this.tornadoes) {
            tornado.x += Math.sin(Date.now() * 0.002) * 2;
            tornado.y += Math.cos(Date.now() * 0.0015) * 1.5;
            
            while (tornado.particles.length < 30) {
                const angle = Math.random() * Math.PI * 2;
                tornado.particles.push({
                    angle: angle,
                    radius: random(10, tornado.radius),
                    height: random(0, 80)
                });
            }
            
            for (const p of tornado.particles) {
                p.angle += 0.1;
                p.height += 0.5;
                if (p.height > 80) p.height = 0;
            }
            
            for (const player of players) {
                const dist = distance(player.x, player.y, tornado.x, tornado.y);
                if (dist < tornado.radius) {
                    const angle = Math.atan2(player.y - tornado.y, player.x - tornado.x);
                    player.vx += Math.cos(angle + Math.PI / 2) * 2;
                    player.vy += Math.sin(angle + Math.PI / 2) * 2;
                    if (dist < 30) {
                        player.isFlying = true;
                        player.flyHeight = Math.min(60, player.flyHeight + 2);
                    }
                }
            }
            
            const ballDist = distance(ball.x, ball.y, tornado.x, tornado.y);
            if (ballDist < tornado.radius) {
                const angle = Math.atan2(ball.y - tornado.y, ball.x - tornado.x);
                ball.vx += Math.cos(angle + Math.PI / 2) * 0.5;
                ball.vy += Math.sin(angle + Math.PI / 2) * 0.5;
            }
        }
    }

    updateEarthquake(dt, players, ball) {
        const shake = Math.sin(Date.now() * 0.02) * 2;
        
        for (const hole of this.holes) {
            for (const player of players) {
                const dist = distance(player.x, player.y, hole.x, hole.y);
                if (dist < hole.radius && !player.isFlying) {
                    const angle = Math.atan2(player.y - hole.y, player.x - hole.x);
                    const pushForce = (hole.radius - dist) / hole.radius * 0.5;
                    player.vx += Math.cos(angle) * pushForce;
                    player.vy += Math.sin(angle) * pushForce;
                }
            }
            
            const ballDist = distance(ball.x, ball.y, hole.x, hole.y);
            if (ballDist < hole.radius) {
                ball.vx *= 0.95;
                ball.vy *= 0.95;
            }
        }
        
        return shake;
    }

    getCurrentWeather() {
        return WEATHER_TYPES[this.currentWeather];
    }

    draw(ctx, shakeOffset = { x: 0, y: 0 }) {
        switch(this.currentWeather) {
            case 'RAIN':
                this.drawRain(ctx);
                break;
            case 'WIND':
                this.drawWind(ctx);
                break;
            case 'TORNADO':
                this.drawTornadoes(ctx);
                break;
            case 'EARTHQUAKE':
                this.drawHoles(ctx);
                break;
        }
        
        if (this.transitioning) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - Math.abs(this.transitionAlpha - 0.5) * 2)})`;
            ctx.fillRect(PITCH_X, PITCH_Y, PITCH_WIDTH, PITCH_HEIGHT);
        }
    }

    drawRain(ctx) {
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
        ctx.lineWidth = 1;
        
        for (const drop of this.raindrops) {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x + 2, drop.y + drop.length);
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = random(PITCH_X, PITCH_X + PITCH_WIDTH);
            const y = random(PITCH_Y, PITCH_Y + PITCH_HEIGHT);
            ctx.beginPath();
            ctx.arc(x, y, random(3, 8), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawWind(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 10; i++) {
            const y = PITCH_Y + (i / 10) * PITCH_HEIGHT + Math.sin(Date.now() * 0.01 + i) * 20;
            const x = (Date.now() * 0.1 + i * 150) % (PITCH_WIDTH + 100) + PITCH_X - 50;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 30 + this.windForce * 5, y);
            ctx.stroke();
        }
    }

    drawTornadoes(ctx) {
        for (const tornado of this.tornadoes) {
            const gradient = ctx.createRadialGradient(
                tornado.x, tornado.y, 0,
                tornado.x, tornado.y, tornado.radius
            );
            gradient.addColorStop(0, 'rgba(100, 100, 100, 0.8)');
            gradient.addColorStop(0.5, 'rgba(80, 80, 80, 0.4)');
            gradient.addColorStop(1, 'rgba(60, 60, 60, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(tornado.x, tornado.y, tornado.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
            for (const p of tornado.particles) {
                const px = tornado.x + Math.cos(p.angle) * p.radius;
                const py = tornado.y + Math.sin(p.angle) * p.radius - p.height;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawHoles(ctx) {
        for (const hole of this.holes) {
            const gradient = ctx.createRadialGradient(
                hole.x, hole.y, 0,
                hole.x, hole.y, hole.radius
            );
            gradient.addColorStop(0, 'rgba(30, 20, 10, 1)');
            gradient.addColorStop(0.7, 'rgba(50, 35, 20, 0.9)');
            gradient.addColorStop(1, 'rgba(70, 50, 30, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(100, 70, 40, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
