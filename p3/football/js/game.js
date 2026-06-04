class FootballGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = CANVAS_WIDTH;
        this.height = CANVAS_HEIGHT;
        
        this.players = [];
        this.aiControllers = [];
        this.ball = null;
        this.powerupManager = null;
        this.weatherSystem = null;
        this.effects = null;
        this.specialMoveSystem = null;
        
        this.scores = [0, 0];
        this.gameTime = GAME_DURATION;
        this.isRunning = false;
        this.isPaused = false;
        this.gameMode = '2v2';
        this.selectedTeams = [0, 1];
        
        this.goalAnimation = false;
        this.goalScorer = null;
        this.goalTimer = 0;
        
        this.input = {};
        this.lastTime = 0;
        
        this.shakeOffset = { x: 0, y: 0 };
    }

    init(gameMode = '2v2', selectedTeams = [0, 1]) {
        this.gameMode = gameMode;
        this.selectedTeams = selectedTeams;
        this.scores = [0, 0];
        this.gameTime = GAME_DURATION;
        this.goalAnimation = false;
        
        this.players = [];
        this.aiControllers = [];
        
        const centerX = PITCH_X + PITCH_WIDTH / 2;
        const centerY = PITCH_Y + PITCH_HEIGHT / 2;
        
        this.ball = new Ball(centerX, centerY);
        this.powerupManager = new PowerupManager();
        this.weatherSystem = new WeatherSystem();
        this.effects = new EffectsManager();
        this.specialMoveSystem = new SpecialMoveSystem(this);
        
        this.createPlayers();
        this.updateUI();
    }

    createPlayers() {
        const team0 = this.selectedTeams[0];
        const team1 = this.selectedTeams[1];
        
        const team0Positions = [
            { x: PITCH_X + 100, y: PITCH_Y + PITCH_HEIGHT / 2, isGK: true },
            { x: PITCH_X + 300, y: PITCH_Y + PITCH_HEIGHT / 2 - 80, isGK: false },
            { x: PITCH_X + 300, y: PITCH_Y + PITCH_HEIGHT / 2 + 80, isGK: false },
            { x: PITCH_X + 500, y: PITCH_Y + PITCH_HEIGHT / 2, isGK: false }
        ];
        
        const team1Positions = [
            { x: PITCH_X + PITCH_WIDTH - 100, y: PITCH_Y + PITCH_HEIGHT / 2, isGK: true },
            { x: PITCH_X + PITCH_WIDTH - 300, y: PITCH_Y + PITCH_HEIGHT / 2 - 80, isGK: false },
            { x: PITCH_X + PITCH_WIDTH - 300, y: PITCH_Y + PITCH_HEIGHT / 2 + 80, isGK: false },
            { x: PITCH_X + PITCH_WIDTH - 500, y: PITCH_Y + PITCH_HEIGHT / 2, isGK: false }
        ];
        
        let playerIndex = 0;
        
        for (let i = 0; i < team0Positions.length; i++) {
            const pos = team0Positions[i];
            const isHuman = i === 1;
            const player = new Player(pos.x, pos.y, team0, playerIndex, pos.isGK, isHuman);
            this.players.push(player);
            
            if (!isHuman) {
                this.aiControllers.push(new AIController(player, 0));
            }
            playerIndex++;
        }
        
        for (let i = 0; i < team1Positions.length; i++) {
            const pos = team1Positions[i];
            const isHuman = i === 1 && this.gameMode === '2v2';
            const player = new Player(pos.x, pos.y, team1, playerIndex, pos.isGK, isHuman);
            this.players.push(player);
            
            if (!isHuman) {
                this.aiControllers.push(new AIController(player, 1));
            }
            playerIndex++;
        }
        
        if (this.gameMode === '4p') {
            this.players[3].isHuman = true;
            this.players[5].isHuman = true;
            
            this.aiControllers = this.aiControllers.filter(ai => 
                ai.player !== this.players[3] && ai.player !== this.players[5]
            );
        }
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) return;
        
        const currentTime = performance.now();
        const dt = Math.min((currentTime - this.lastTime) / 16.67, 3);
        this.lastTime = currentTime;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(dt) {
        if (this.goalAnimation) {
            this.goalTimer -= dt;
            if (this.goalTimer <= 0) {
                this.goalAnimation = false;
                this.resetPositions();
            }
            return;
        }
        
        this.gameTime -= dt / 60;
        if (this.gameTime <= 0) {
            this.gameTime = 0;
            this.endGame();
            return;
        }
        
        this.handleInput();
        
        for (const ai of this.aiControllers) {
            ai.update(dt, this);
        }
        
        for (const player of this.players) {
            player.update(dt, this);
        }
        
        const weatherInfo = this.weatherSystem.getCurrentWeather();
        this.ball.update(dt, weatherInfo.effect === 'wind' ? { effect: 'wind', windForce: this.weatherSystem.windForce } : null);
        
        this.checkPlayerCollisions();
        this.checkBallPlayerCollision();
        this.powerupManager.update(dt, this.players);
        this.weatherSystem.update(dt, this.players, this.ball);
        this.specialMoveSystem.update(dt);
        this.effects.update(dt);
        
        const goal = CollisionResolver.checkGoal(this.ball);
        if (goal) {
            this.scoreGoal(goal);
        }
        
        if (weatherInfo.effect === 'holes') {
            const shake = Math.sin(Date.now() * 0.02) * 1;
            this.shakeOffset = { x: shake, y: -shake };
        } else {
            this.shakeOffset = this.effects.getShakeOffset();
        }
        
        this.updateUI();
    }

    handleInput() {
        const humanPlayers = this.players.filter(p => p.isHuman);
        
        if (humanPlayers[0]) {
            this.controlPlayer(humanPlayers[0], 'p1');
        }
        if (humanPlayers[1]) {
            this.controlPlayer(humanPlayers[1], 'p2');
        }
        if (humanPlayers[2]) {
            this.controlPlayer(humanPlayers[2], 'p3');
        }
        if (humanPlayers[3]) {
            this.controlPlayer(humanPlayers[3], 'p4');
        }
    }

    controlPlayer(player, playerId) {
        let dx = 0, dy = 0;
        
        const keys = this.getPlayerKeys(playerId);
        
        if (this.input[keys.up]) dy -= 1;
        if (this.input[keys.down]) dy += 1;
        if (this.input[keys.left]) dx -= 1;
        if (this.input[keys.right]) dx += 1;
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            player.move(dx / len, dy / len);
        }
        
        if (this.input[keys.kick] && !player.kickPressed) {
            player.kickPressed = true;
            player.kick(this.ball);
        }
        if (!this.input[keys.kick]) {
            player.kickPressed = false;
        }
        
        if (this.input[keys.tackle] && !player.tacklePressed) {
            player.tacklePressed = true;
            const closestEnemy = this.getClosestEnemy(player);
            if (closestEnemy) {
                player.tackle(closestEnemy);
            }
        }
        if (!this.input[keys.tackle]) {
            player.tacklePressed = false;
        }
        
        if (this.input[keys.special]) {
            if (!player.isCharging) {
                player.startCharge();
            }
        } else if (player.isCharging) {
            player.releaseCharge(this.ball);
            if (player.specialMoveType) {
                this.specialMoveSystem.executeSpecialMove(player, this.ball, player.specialMoveType);
            }
        }
    }

    getPlayerKeys(playerId) {
        const keySets = {
            p1: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', kick: 'KeyJ', tackle: 'KeyK', special: 'KeyL' },
            p2: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', kick: 'Numpad1', tackle: 'Numpad2', special: 'Numpad3' },
            p3: { up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH', kick: 'KeyB', tackle: 'KeyN', special: 'KeyM' },
            p4: { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6', kick: 'Numpad7', tackle: 'Numpad9', special: 'Slash' }
        };
        return keySets[playerId];
    }

    getClosestEnemy(player) {
        let closest = null;
        let minDist = Infinity;
        
        for (const p of this.players) {
            if (p.team !== player.team) {
                const dist = distance(player.x, player.y, p.x, p.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = p;
                }
            }
        }
        
        return closest;
    }

    checkPlayerCollisions() {
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                const p1 = this.players[i];
                const p2 = this.players[j];
                
                if (circleCollision(p1.x, p1.y, p1.radius, p2.x, p2.y, p2.radius)) {
                    CollisionResolver.circleCollision(p1, p2);
                }
            }
        }
    }

    checkBallPlayerCollision() {
        let closestPlayer = null;
        let minDist = Infinity;
        
        for (const player of this.players) {
            const dist = distance(player.x, player.y, this.ball.x, this.ball.y);
            if (dist < player.radius + this.ball.radius + 10 && dist < minDist) {
                minDist = dist;
                closestPlayer = player;
            }
        }
        
        for (const player of this.players) {
            player.hasBall = (player === closestPlayer);
        }
        
        if (closestPlayer) {
            const dist = distance(closestPlayer.x, closestPlayer.y, this.ball.x, this.ball.y);
            if (dist < closestPlayer.radius + this.ball.radius) {
                CollisionResolver.circleCollision(closestPlayer, this.ball);
                this.ball.vx *= 0.6;
                this.ball.vy *= 0.6;
            }
        }
    }

    scoreGoal(side) {
        const scoringTeam = side === 'left' ? 1 : 0;
        this.scores[scoringTeam]++;
        
        this.goalAnimation = true;
        this.goalTimer = 180;
        this.goalScorer = this.ball.lastKicker ? this.ball.lastKicker.name : 'Unknown';
        
        this.effects.addGoalEffect(
            side === 'left' ? PITCH_X : PITCH_X + PITCH_WIDTH,
            PITCH_Y + PITCH_HEIGHT / 2
        );
        
        playSound('goal');
        
        for (const player of this.players) {
            if (player.team === scoringTeam) {
                player.celebrate();
            } else {
                player.petrify();
                if (player.isGoalkeeper) {
                    player.consecutiveGoalsAgainst++;
                    if (player.consecutiveGoalsAgainst >= 2) {
                        player.isEnraged = true;
                    }
                }
            }
        }
        
        this.showGoalScreen();
    }

    resetPositions() {
        const centerX = PITCH_X + PITCH_WIDTH / 2;
        const centerY = PITCH_Y + PITCH_HEIGHT / 2;
        this.ball.reset(centerX, centerY);
        
        const team0 = this.selectedTeams[0];
        const team1 = this.selectedTeams[1];
        
        const positions = [
            { x: PITCH_X + 100, y: PITCH_Y + PITCH_HEIGHT / 2 },
            { x: PITCH_X + 300, y: PITCH_Y + PITCH_HEIGHT / 2 - 80 },
            { x: PITCH_X + 300, y: PITCH_Y + PITCH_HEIGHT / 2 + 80 },
            { x: PITCH_X + 500, y: PITCH_Y + PITCH_HEIGHT / 2 },
            { x: PITCH_X + PITCH_WIDTH - 100, y: PITCH_Y + PITCH_HEIGHT / 2 },
            { x: PITCH_X + PITCH_WIDTH - 300, y: PITCH_Y + PITCH_HEIGHT / 2 - 80 },
            { x: PITCH_X + PITCH_WIDTH - 300, y: PITCH_Y + PITCH_HEIGHT / 2 + 80 },
            { x: PITCH_X + PITCH_WIDTH - 500, y: PITCH_Y + PITCH_HEIGHT / 2 }
        ];
        
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const pos = positions[i];
            player.x = pos.x;
            player.y = pos.y;
            player.vx = 0;
            player.vy = 0;
            player.state = PLAYER_STATES.IDLE;
            player.stateTimer = 0;
        }
    }

    endGame() {
        this.isRunning = false;
        this.showEndScreen();
    }

    showGoalScreen() {
        const goalScreen = document.getElementById('goalScreen');
        const goalScorer = document.getElementById('goalScorer');
        goalScorer.textContent = `${this.goalScorer} 进球!`;
        goalScreen.classList.remove('hidden');
        
        setTimeout(() => {
            goalScreen.classList.add('hidden');
        }, 1500);
    }

    showEndScreen() {
        const pauseScreen = document.getElementById('pauseScreen');
        pauseScreen.classList.remove('hidden');
        const title = pauseScreen.querySelector('.title');
        if (this.scores[0] > this.scores[1]) {
            title.textContent = `${TEAMS[this.selectedTeams[0]].name} 获胜!`;
        } else if (this.scores[1] > this.scores[0]) {
            title.textContent = `${TEAMS[this.selectedTeams[1]].name} 获胜!`;
        } else {
            title.textContent = '平局!';
        }
    }

    updateUI() {
        document.getElementById('score1').textContent = this.scores[0];
        document.getElementById('score2').textContent = this.scores[1];
        document.getElementById('team1Name').textContent = TEAMS[this.selectedTeams[0]].name;
        document.getElementById('team2Name').textContent = TEAMS[this.selectedTeams[1]].name;
        
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const weather = this.weatherSystem.getCurrentWeather();
        document.getElementById('weatherIndicator').textContent = `${weather.icon} ${weather.name}`;
        
        this.updateStaminaBars();
    }

    updateStaminaBars() {
        const container = document.getElementById('staminaBars');
        const humanPlayers = this.players.filter(p => p.isHuman);
        
        container.innerHTML = '';
        for (const player of humanPlayers) {
            const bar = document.createElement('div');
            bar.className = 'stamina-bar';
            bar.innerHTML = `
                <span class="stamina-label">${player.name}</span>
                <div class="stamina-fill">
                    <div class="stamina-inner" style="width: ${player.stamina}%"></div>
                </div>
            `;
            container.appendChild(bar);
        }
    }

    render() {
        this.ctx.save();
        this.ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
        
        this.drawPitch();
        this.powerupManager.draw(this.ctx);
        this.weatherSystem.draw(this.ctx);
        
        for (const player of this.players) {
            player.draw(this.ctx);
        }
        
        this.specialMoveSystem.draw(this.ctx);
        this.ball.draw(this.ctx);
        this.effects.draw(this.ctx);
        
        this.ctx.restore();
    }

    drawPitch() {
        this.ctx.fillStyle = '#2d5a27';
        this.ctx.fillRect(PITCH_X, PITCH_Y, PITCH_WIDTH, PITCH_HEIGHT);
        
        this.ctx.fillStyle = '#3a7a33';
        for (let i = 0; i < PITCH_WIDTH; i += 40) {
            for (let j = 0; j < PITCH_HEIGHT; j += 40) {
                if ((i + j) % 80 === 0) {
                    this.ctx.fillRect(PITCH_X + i, PITCH_Y + j, 40, 40);
                }
            }
        }
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        
        this.ctx.strokeRect(PITCH_X, PITCH_Y, PITCH_WIDTH, PITCH_HEIGHT);
        
        this.ctx.beginPath();
        this.ctx.moveTo(PITCH_X + PITCH_WIDTH / 2, PITCH_Y);
        this.ctx.lineTo(PITCH_X + PITCH_WIDTH / 2, PITCH_Y + PITCH_HEIGHT);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(PITCH_X + PITCH_WIDTH / 2, PITCH_Y + PITCH_HEIGHT / 2, 60, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.drawGoal(PITCH_X - GOAL_DEPTH, PITCH_Y + PITCH_HEIGHT / 2 - GOAL_HEIGHT / 2, true);
        this.drawGoal(PITCH_X + PITCH_WIDTH, PITCH_Y + PITCH_HEIGHT / 2 - GOAL_HEIGHT / 2, false);
        
        this.ctx.fillStyle = '#4a6a47';
        this.ctx.fillRect(PITCH_X - GOAL_DEPTH, PITCH_Y, GOAL_DEPTH, PITCH_HEIGHT);
        this.ctx.fillRect(PITCH_X + PITCH_WIDTH, PITCH_Y, GOAL_DEPTH, PITCH_HEIGHT);
    }

    drawGoal(x, y, isLeft) {
        this.ctx.fillStyle = isLeft ? '#8b4513' : '#8b4513';
        this.ctx.fillRect(x, y, GOAL_DEPTH, GOAL_HEIGHT);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= GOAL_HEIGHT; i += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + i);
            this.ctx.lineTo(x + GOAL_DEPTH, y + i);
            this.ctx.stroke();
        }
        for (let i = 0; i <= GOAL_DEPTH; i += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + i, y);
            this.ctx.lineTo(x + i, y + GOAL_HEIGHT);
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x, y, GOAL_DEPTH, GOAL_HEIGHT);
    }
}
