import type {
  Vec2,
  Team,
  Player,
  Puck,
  Item,
  Goal,
  GameState,
  InputState,
  IceTrail,
} from './types';
import {
  RINK,
  PLAYER_RADIUS,
  PUCK_RADIUS,
  STICK_LENGTH,
  GOALIE_STICK_LENGTH,
  FRICTION,
  PUCK_FRICTION,
  ACCELERATION,
  MAX_SPEED,
  SHOT_POWER,
  PASS_POWER,
  SPECIAL_CHARGE_RATE,
  MAX_SPECIAL_CHARGE,
  DOWN_TIME,
  FROZEN_TIME,
  PARALYZE_TIME,
  SPEED_BOOST,
  SPEED_BOOST_DURATION,
  LONG_STICK_BOOST,
  LONG_STICK_DURATION,
  ITEM_SPAWN_INTERVAL,
  MAX_ITEMS,
  FIGHT_DAMAGE,
} from './types';
import { RED_TEAM_PLAYERS, BLUE_TEAM_PLAYERS } from '../data/players';
import { InputManager } from './input';
import { ParticleSystem } from './particles';
import {
  applyFriction,
  applyAcceleration,
  checkCircleCollision,
  resolveCircleCollision,
  checkBoardCollision,
  checkGoalCollision,
  bounceOffBoards,
  distance,
  normalize,
  vec2Sub,
  vec2Add,
  vec2Scale,
  angleToVec2,
  lerp,
  clamp,
} from './physics';

export type RenderFn = (state: GameState) => void;

const ITEM_TYPES: Item['type'][] = ['speed_skates', 'long_stick', 'freeze_ball', 'shock_ball'];

export class GameEngine {
  state: GameState;
  inputManager: InputManager;
  particles: ParticleSystem;
  private running = false;
  private lastTime = 0;
  private rafId = 0;
  private renderFn: RenderFn | null = null;
  private itemSpawnTimer = 0;
  private nextItemId = 0;
  private controlledPlayer: { red: number; blue: number } = { red: 0, blue: 6 };
  _gameOverFired = false;

  constructor() {
    this.inputManager = new InputManager();
    this.particles = new ParticleSystem();
    this.state = this.createEmptyState();
  }

  private createEmptyState(): GameState {
    return {
      players: [],
      puck: this.createPuck(),
      items: [],
      goals: [],
      score: { red: 0, blue: 0 },
      timeRemaining: 0,
      periodLength: 120,
      isPaused: false,
      isGameOver: false,
      faceoff: true,
      faceoffTimer: 2,
      lastGoalTeam: null,
      celebrationTimer: 0,
      particles: [],
      iceTrails: [],
      screenShake: { intensity: 0, duration: 0, timer: 0 },
      comboReady: { red: false, blue: false },
      comboPlayers: { red: [], blue: [] },
    };
  }

  private createPuck(): Puck {
    return {
      pos: { x: RINK.width / 2, y: RINK.height / 2 },
      vel: { x: 0, y: 0 },
      angle: 0,
      state: 'normal',
      holderId: null,
      stateTimer: 0,
    };
  }

  private createPlayer(index: number, team: Team, roleData: typeof RED_TEAM_PLAYERS[0]): Player {
    const isGoalie = roleData.role === 'goalie';
    return {
      id: index,
      team,
      role: roleData.role,
      name: roleData.name,
      pos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      angle: team === 'red' ? 0 : Math.PI,
      stats: { ...roleData.stats },
      state: 'normal',
      stateTimer: 0,
      special: roleData.special,
      specialCharge: 0,
      maxSpecialCharge: MAX_SPECIAL_CHARGE,
      hasPuck: false,
      stickAngle: team === 'red' ? 0 : Math.PI,
      stickLength: isGoalie ? GOALIE_STICK_LENGTH : STICK_LENGTH,
      bodyRadius: PLAYER_RADIUS,
      colors: { ...roleData.colors },
      hitPoints: 100,
      maxHitPoints: 100,
      itemTimer: 0,
      activeItem: null,
      goals: 0,
      assists: 0,
      fightTarget: null,
      isControlled: false,
      trailPositions: [],
    };
  }

  initGame(periodLength: number): void {
    this.state = this.createEmptyState();
    this.state.periodLength = periodLength;
    this.state.timeRemaining = periodLength;

    const players: Player[] = [];
    let id = 0;

    for (let i = 0; i < RED_TEAM_PLAYERS.length; i++) {
      players.push(this.createPlayer(id, 'red', RED_TEAM_PLAYERS[i]));
      id++;
    }
    for (let i = 0; i < BLUE_TEAM_PLAYERS.length; i++) {
      players.push(this.createPlayer(id, 'blue', BLUE_TEAM_PLAYERS[i]));
      id++;
    }

    this.state.players = players;

    this.state.goals = [
      {
        team: 'red',
        x: RINK.boardThickness,
        y: RINK.height / 2,
        width: RINK.goalWidth,
        depth: RINK.goalDepth,
        scored: false,
        shakeTimer: 0,
      },
      {
        team: 'blue',
        x: RINK.width - RINK.boardThickness,
        y: RINK.height / 2,
        width: RINK.goalWidth,
        depth: RINK.goalDepth,
        scored: false,
        shakeTimer: 0,
      },
    ];

    this.controlledPlayer = { red: 0, blue: 6 };
    this.setControlledPlayers();
    this.setFaceoffPositions();
    this.state.faceoff = true;
    this.state.faceoffTimer = 2;
    this.itemSpawnTimer = ITEM_SPAWN_INTERVAL;
  }

  private setControlledPlayers(): void {
    for (const p of this.state.players) {
      p.isControlled = false;
    }
    const redCtrl = this.state.players.find(p => p.id === this.controlledPlayer.red);
    if (redCtrl) redCtrl.isControlled = true;
    const blueCtrl = this.state.players.find(p => p.id === this.controlledPlayer.blue);
    if (blueCtrl) blueCtrl.isControlled = true;
  }

  private setFaceoffPositions(): void {
    const cx = RINK.width / 2;
    const cy = RINK.height / 2;

    const redPositions: Vec2[] = [
      { x: cx - 60, y: cy },
      { x: cx - 100, y: cy - 80 },
      { x: cx - 100, y: cy + 80 },
      { x: RINK.boardThickness + 120, y: cy - 70 },
      { x: RINK.boardThickness + 120, y: cy + 70 },
      { x: RINK.boardThickness + 40, y: cy },
    ];

    const bluePositions: Vec2[] = [
      { x: cx + 60, y: cy },
      { x: cx + 100, y: cy - 80 },
      { x: cx + 100, y: cy + 80 },
      { x: RINK.width - RINK.boardThickness - 120, y: cy - 70 },
      { x: RINK.width - RINK.boardThickness - 120, y: cy + 70 },
      { x: RINK.width - RINK.boardThickness - 40, y: cy },
    ];

    let ri = 0;
    let bi = 0;
    for (const p of this.state.players) {
      p.vel = { x: 0, y: 0 };
      if (p.team === 'red') {
        p.pos = { ...redPositions[ri] };
        p.angle = 0;
        p.stickAngle = 0;
        ri++;
      } else {
        p.pos = { ...bluePositions[bi] };
        p.angle = Math.PI;
        p.stickAngle = Math.PI;
        bi++;
      }
      p.state = 'normal';
      p.stateTimer = 0;
      p.hasPuck = false;
      p.trailPositions = [];
    }

    this.state.puck.pos = { x: cx, y: cy };
    this.state.puck.vel = { x: 0, y: 0 };
    this.state.puck.holderId = null;
    this.state.puck.state = 'normal';
    this.state.puck.stateTimer = 0;
  }

  init(renderFn: RenderFn): void {
    this.renderFn = renderFn;
    this.inputManager.init();
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private loop = (time: number): void => {
    if (!this.running) return;
    const rawDt = (time - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 1 / 30);
    this.lastTime = time;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  update(dt: number): void {
    if (this.state.isGameOver || this.state.isPaused) return;

    this.updateTimers(dt);
    this.updateInput();

    if (this.state.faceoff) {
      this.state.faceoffTimer -= dt;
      if (this.state.faceoffTimer <= 0) {
        this.state.faceoff = false;
      }
      return;
    }

    if (this.state.celebrationTimer > 0) {
      this.state.celebrationTimer -= dt;
      if (this.state.celebrationTimer <= 0) {
        this.state.celebrationTimer = 0;
        this.state.faceoff = true;
        this.state.faceoffTimer = 2;
        this.setFaceoffPositions();
      }
      this.particles.update(dt);
      this.state.particles = this.particles.particles;
      return;
    }

    this.updatePhysics(dt);
    this.updateAI(dt);
    this.updateCombat(dt);
    this.updateSpecials(dt);
    this.updateItems(dt);
    this.updatePuck(dt);
    this.checkGoals();
    this.particles.update(dt);
    this.state.particles = this.particles.particles;
    this.updateIceTrails(dt);
    this.updateScreenShake(dt);
    this.spawnAmbientSnow();
  }

  render(): void {
    if (this.renderFn) {
      this.renderFn(this.state);
    }
  }

  private updateTimers(dt: number): void {
    this.state.timeRemaining -= dt;
    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      this.state.isGameOver = true;
    }

    for (const p of this.state.players) {
      if (p.stateTimer > 0) {
        p.stateTimer -= dt;
        if (p.stateTimer <= 0) {
          if (p.state === 'down' || p.state === 'frozen' || p.state === 'paralyzed' || p.state === 'celebrating' || p.state === 'angry') {
            p.state = 'normal';
          }
          p.stateTimer = 0;
        }
      }

      if (p.itemTimer > 0) {
        p.itemTimer -= dt;
        if (p.itemTimer <= 0) {
          p.itemTimer = 0;
          p.activeItem = null;
          p.stickLength = p.role === 'goalie' ? GOALIE_STICK_LENGTH : STICK_LENGTH;
        }
      }

      if (p.hasPuck && p.state === 'normal') {
        p.specialCharge = Math.min(p.maxSpecialCharge, p.specialCharge + SPECIAL_CHARGE_RATE * dt);
      }

      if (p.state === 'charging_special') {
        p.specialCharge += SPECIAL_CHARGE_RATE * 3 * dt;
      }
    }

    if (this.state.puck.stateTimer > 0) {
      this.state.puck.stateTimer -= dt;
      if (this.state.puck.stateTimer <= 0) {
        if (this.state.puck.state !== 'normal') {
          this.state.puck.state = 'normal';
          this.state.puck.splitPucks = undefined;
          this.state.puck.curveDirection = undefined;
          this.state.puck.whirlwindTimer = undefined;
        }
        this.state.puck.stateTimer = 0;
      }
    }

    for (const goal of this.state.goals) {
      if (goal.shakeTimer > 0) {
        goal.shakeTimer -= dt;
      }
    }
  }

  private updateInput(): void {
    const p1Input = this.inputManager.getInput(1);
    const p2Input = this.inputManager.getInput(2);

    this.applyPlayerInput(this.controlledPlayer.red, p1Input);
    this.applyPlayerInput(this.controlledPlayer.blue, p2Input);

    if (p1Input.passPressed) {
      this.switchControlledPlayer('red');
    }
    if (p2Input.passPressed) {
      this.switchControlledPlayer('blue');
    }
  }

  private applyPlayerInput(playerId: number, input: InputState): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.state !== 'normal') return;

    let moveAngle = -1;
    if (input.up && !input.down && !input.left && !input.right) moveAngle = -Math.PI / 2;
    else if (input.down && !input.up && !input.left && !input.right) moveAngle = Math.PI / 2;
    else if (input.left && !input.right && !input.up && !input.down) moveAngle = Math.PI;
    else if (input.right && !input.left && !input.up && !input.down) moveAngle = 0;
    else if (input.up && input.left) moveAngle = -Math.PI * 3 / 4;
    else if (input.up && input.right) moveAngle = -Math.PI / 4;
    else if (input.down && input.left) moveAngle = Math.PI * 3 / 4;
    else if (input.down && input.right) moveAngle = Math.PI / 4;

    const speedMult = player.activeItem === 'speed_skates' ? SPEED_BOOST : 1;
    const maxSpd = MAX_SPEED * (0.6 + player.stats.speed * 0.1) * speedMult;

    if (moveAngle !== -1) {
      player.vel = applyAcceleration(player.vel, moveAngle, ACCELERATION, maxSpd);
      player.angle = moveAngle;
      player.stickAngle = moveAngle;
    }

    if (input.shootPressed && player.hasPuck) {
      this.shootPuck(player, SHOT_POWER * (0.6 + player.stats.shot * 0.1));
    }

    if (input.fightPressed) {
      this.initiateFight(player);
    }

    if (input.specialPressed && player.specialCharge >= player.maxSpecialCharge) {
      this.activateSpecial(player);
    }

    if (input.itemPressed && player.activeItem) {
      this.useItem(player);
    }
  }

  private switchControlledPlayer(team: Team): void {
    const teamPlayers = this.state.players.filter(p => p.team === team && p.state === 'normal' && p.role !== 'goalie');
    if (teamPlayers.length === 0) return;

    const currentId = this.controlledPlayer[team];
    const currentIdx = teamPlayers.findIndex(p => p.id === currentId);
    const nextIdx = (currentIdx + 1) % teamPlayers.length;
    this.controlledPlayer[team] = teamPlayers[nextIdx].id;
    this.setControlledPlayers();
  }

  private shootPuck(player: Player, power: number): void {
    if (!player.hasPuck) return;
    player.hasPuck = false;

    const dir = angleToVec2(player.stickAngle);
    this.state.puck.vel = vec2Scale(dir, power);
    this.state.puck.holderId = null;
    this.state.puck.pos = vec2Add(player.pos, vec2Scale(dir, player.stickLength + PUCK_RADIUS + 2));
    this.state.puck.angle = player.stickAngle;

    player.specialCharge = Math.min(player.maxSpecialCharge, player.specialCharge + 10);
  }

  private passPuck(player: Player): void {
    if (!player.hasPuck) return;

    const teammates = this.state.players.filter(p => p.team === player.team && p.id !== player.id);
    if (teammates.length === 0) return;

    let best: Player | null = null;
    let bestDist = Infinity;
    for (const t of teammates) {
      const d = distance(player.pos, t.pos);
      if (d < bestDist) {
        bestDist = d;
        best = t;
      }
    }
    if (!best) return;

    player.hasPuck = false;
    const dir = normalize(vec2Sub(best.pos, player.pos));
    const passPower = PASS_POWER * (0.6 + player.stats.pass * 0.1);
    this.state.puck.vel = vec2Scale(dir, passPower);
    this.state.puck.holderId = null;
    this.state.puck.pos = vec2Add(player.pos, vec2Scale(dir, player.stickLength + PUCK_RADIUS + 2));
  }

  private initiateFight(player: Player): void {
    const opponents = this.state.players.filter(
      p => p.team !== player.team && p.state === 'normal' && distance(p.pos, player.pos) < player.bodyRadius * 3
    );
    if (opponents.length === 0) return;

    const target = opponents.reduce((a, b) => distance(a.pos, player.pos) < distance(b.pos, player.pos) ? a : b);
    player.fightTarget = target.id;
    player.state = 'angry';
    player.stateTimer = 0.5;

    const damage = FIGHT_DAMAGE * (0.5 + player.stats.power * 0.1);
    target.hitPoints -= damage;

    this.particles.spawnSparkParticles(
      { x: (player.pos.x + target.pos.x) / 2, y: (player.pos.y + target.pos.y) / 2 },
      8
    );

    if (target.hitPoints <= 0) {
      target.hitPoints = 0;
      target.state = 'down';
      target.stateTimer = DOWN_TIME;
      target.hasPuck = false;
      this.particles.spawnStarParticles(target.pos, 5);
    }
  }

  private activateSpecial(player: Player): void {
    player.specialCharge = 0;

    if (player.hasPuck) {
      switch (player.special) {
        case 'fire_shot':
          this.state.puck.state = 'fire';
          this.state.puck.stateTimer = 2;
          this.shootPuck(player, SHOT_POWER * 2);
          this.particles.spawnFireParticles(player.pos, 15);
          this.state.screenShake = { intensity: 5, duration: 0.3, timer: 0.3 };
          break;
        case 'split_shot':
          this.state.puck.state = 'split';
          this.state.puck.stateTimer = 2;
          this.shootPuck(player, SHOT_POWER * 1.5);
          break;
        case 'curve_shot':
          this.state.puck.state = 'curve';
          this.state.puck.stateTimer = 2;
          this.state.puck.curveDirection = player.team === 'red' ? 1 : -1;
          this.shootPuck(player, SHOT_POWER * 1.3);
          break;
        case 'whirlwind_slash':
          player.state = 'charging_special';
          player.stateTimer = 0.8;
          this.particles.spawnWhirlwindParticles(player.pos, 20);
          const nearby = this.state.players.filter(
            p => p.id !== player.id && distance(p.pos, player.pos) < 80
          );
          for (const n of nearby) {
            const pushDir = normalize(vec2Sub(n.pos, player.pos));
            n.vel = vec2Scale(pushDir, 8);
            n.hitPoints -= FIGHT_DAMAGE * 0.5;
            if (n.hitPoints <= 0) {
              n.state = 'down';
              n.stateTimer = DOWN_TIME;
              n.hasPuck = false;
            }
          }
          break;
        case 'ice_wall':
          player.state = 'charging_special';
          player.stateTimer = 1.0;
          this.particles.spawnIceParticles(player.pos, 20);
          break;
        case 'clone_save':
          player.state = 'charging_special';
          player.stateTimer = 1.5;
          this.particles.spawnIceParticles(player.pos, 15);
          break;
        default:
          this.shootPuck(player, SHOT_POWER * 1.5);
      }
    } else {
      switch (player.special) {
        case 'whirlwind_slash':
          this.particles.spawnWhirlwindParticles(player.pos, 20);
          const nearby = this.state.players.filter(
            p => p.id !== player.id && distance(p.pos, player.pos) < 80
          );
          for (const n of nearby) {
            const pushDir = normalize(vec2Sub(n.pos, player.pos));
            n.vel = vec2Scale(pushDir, 8);
            n.hitPoints -= FIGHT_DAMAGE * 0.5;
            if (n.hitPoints <= 0) {
              n.state = 'down';
              n.stateTimer = DOWN_TIME;
              n.hasPuck = false;
            }
          }
          break;
        default:
          this.particles.spawnIceParticles(player.pos, 10);
      }
    }
  }

  private useItem(player: Player): void {
    if (!player.activeItem) return;

    switch (player.activeItem) {
      case 'speed_skates':
        player.activeItem = null;
        player.itemTimer = SPEED_BOOST_DURATION;
        player.activeItem = 'speed_skates';
        break;
      case 'long_stick':
        player.stickLength = STICK_LENGTH * LONG_STICK_BOOST;
        player.activeItem = 'long_stick';
        player.itemTimer = LONG_STICK_DURATION;
        break;
      case 'freeze_ball':
        player.activeItem = null;
        const puckHolder = this.state.puck.holderId !== null
          ? this.state.players.find(p => p.id === this.state.puck.holderId)
          : null;
        const target = puckHolder ?? this.state.puck;
        if ('state' in target && 'stateTimer' in target && 'team' in target) {
          const t = target as Player;
          t.state = 'frozen';
          t.stateTimer = FROZEN_TIME;
          t.hasPuck = false;
          this.particles.spawnIceParticles(t.pos, 15);
        } else {
          this.particles.spawnIceParticles(target.pos, 10);
        }
        break;
      case 'shock_ball':
        player.activeItem = null;
        const nearby = this.state.players.filter(
          p => p.team !== player.team && distance(p.pos, player.pos) < 100 && p.state === 'normal'
        );
        for (const n of nearby) {
          n.state = 'paralyzed';
          n.stateTimer = PARALYZE_TIME;
          this.particles.spawnSparkParticles(n.pos, 5);
        }
        break;
    }
  }

  private updatePhysics(dt: number): void {
    for (const player of this.state.players) {
      if (player.state === 'down' || player.state === 'frozen' || player.state === 'paralyzed') {
        player.vel = applyFriction(player.vel, FRICTION * 4);
      } else if (player.state === 'normal' || player.state === 'angry' || player.state === 'charging_special') {
        player.vel = applyFriction(player.vel, FRICTION);
      }

      player.pos.x += player.vel.x;
      player.pos.y += player.vel.y;

      const newPos = checkBoardCollision(player.pos, player.bodyRadius, RINK);
      if (newPos.x !== player.pos.x || newPos.y !== player.pos.y) {
        player.vel = bounceOffBoards(newPos, player.vel, player.bodyRadius, RINK);
        player.pos = newPos;
      }

      player.trailPositions.unshift({ x: player.pos.x, y: player.pos.y });
      if (player.trailPositions.length > 10) {
        player.trailPositions.pop();
      }
    }

    for (let i = 0; i < this.state.players.length; i++) {
      for (let j = i + 1; j < this.state.players.length; j++) {
        const p1 = this.state.players[i];
        const p2 = this.state.players[j];
        if (checkCircleCollision(p1.pos, p1.bodyRadius, p2.pos, p2.bodyRadius)) {
          resolveCircleCollision(p1, p2);
          if (p1.vel.x * p1.vel.x + p1.vel.y * p1.vel.y > 4) {
            this.particles.spawnIceParticles({ x: (p1.pos.x + p2.pos.x) / 2, y: (p1.pos.y + p2.pos.y) / 2 }, 3);
          }
        }
      }
    }

    if (this.state.puck.holderId === null) {
      this.state.puck.vel = applyFriction(this.state.puck.vel, PUCK_FRICTION);
      this.state.puck.pos.x += this.state.puck.vel.x;
      this.state.puck.pos.y += this.state.puck.vel.y;

      const puckPos = checkBoardCollision(this.state.puck.pos, PUCK_RADIUS, RINK);
      if (puckPos.x !== this.state.puck.pos.x || puckPos.y !== this.state.puck.pos.y) {
        this.state.puck.vel = bounceOffBoards(puckPos, this.state.puck.vel, PUCK_RADIUS, RINK);
        this.state.puck.pos = puckPos;
      }

      if (this.state.puck.state === 'curve' && this.state.puck.curveDirection !== undefined) {
        const perpAngle = Math.atan2(this.state.puck.vel.y, this.state.puck.vel.x) + Math.PI / 2;
        this.state.puck.vel.x += Math.cos(perpAngle) * this.state.puck.curveDirection * 0.15;
        this.state.puck.vel.y += Math.sin(perpAngle) * this.state.puck.curveDirection * 0.15;
      }

      if (this.state.puck.state === 'fire') {
        this.particles.spawnFireParticles(this.state.puck.pos, 2);
      }

      if (this.state.puck.splitPucks) {
        for (const sp of this.state.puck.splitPucks) {
          sp.pos.x += sp.vel.x;
          sp.pos.y += sp.vel.y;
        }
      }
    }
  }

  private updateAI(dt: number): void {
    for (const player of this.state.players) {
      if (player.isControlled) continue;
      if (player.state !== 'normal') continue;

      const isRed = player.team === 'red';
      const puck = this.state.puck;
      const myGoal = this.state.goals.find(g => g.team === player.team);
      const oppGoal = this.state.goals.find(g => g.team !== player.team);

      let targetX = puck.pos.x;
      let targetY = puck.pos.y;

      switch (player.role) {
        case 'forward_speed':
        case 'forward_tech':
        case 'forward_power':
          if (player.hasPuck && oppGoal) {
            targetX = oppGoal.x;
            targetY = oppGoal.y;
          } else if (puck.holderId === null) {
            targetX = puck.pos.x;
            targetY = puck.pos.y;
          } else {
            const holder = this.state.players.find(p => p.id === puck.holderId);
            if (holder && holder.team !== player.team) {
              targetX = puck.pos.x;
              targetY = puck.pos.y;
            } else {
              const offsetX = isRed ? 80 : -80;
              targetX = puck.pos.x + offsetX;
              targetY = puck.pos.y + (player.role === 'forward_speed' ? -50 : player.role === 'forward_power' ? 50 : 0);
            }
          }
          break;
        case 'defender_wall':
        case 'defender_steal':
          if (puck.holderId !== null) {
            const holder = this.state.players.find(p => p.id === puck.holderId);
            if (holder && holder.team !== player.team) {
              targetX = puck.pos.x;
              targetY = puck.pos.y;
            } else {
              const baseX = isRed ? 180 : RINK.width - 180;
              targetX = lerp(baseX, puck.pos.x, 0.3);
              targetY = lerp(RINK.height / 2, puck.pos.y, 0.5);
            }
          } else {
            const baseX = isRed ? 180 : RINK.width - 180;
            targetX = lerp(baseX, puck.pos.x, 0.4);
            targetY = lerp(RINK.height / 2, puck.pos.y, 0.4);
          }
          break;
        case 'goalie':
          if (myGoal) {
            targetX = myGoal.x + (isRed ? 30 : -30);
            targetY = clamp(puck.pos.y, myGoal.y - RINK.goalWidth / 2 + 15, myGoal.y + RINK.goalWidth / 2 - 15);
          }
          break;
      }

      const dx = targetX - player.pos.x;
      const dy = targetY - player.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        const targetAngle = Math.atan2(dy, dx);
        player.vel = applyAcceleration(player.vel, targetAngle, ACCELERATION * 0.7, MAX_SPEED * 0.7);
        player.angle = targetAngle;
        player.stickAngle = targetAngle;
      } else {
        player.vel = applyFriction(player.vel, FRICTION * 2);
      }

      if (!player.hasPuck && puck.holderId === null && dist < player.stickLength + PUCK_RADIUS + 5) {
        this.pickUpPuck(player);
      }

      if (player.hasPuck && player.role !== 'goalie') {
        if (oppGoal) {
          const goalDist = distance(player.pos, oppGoal);
          if (goalDist < 250 && Math.random() < 0.02) {
            this.shootPuck(player, SHOT_POWER * (0.6 + player.stats.shot * 0.1));
          } else if (Math.random() < 0.005) {
            this.passPuck(player);
          }
        }
      }

      if (player.hasPuck && player.specialCharge >= player.maxSpecialCharge && Math.random() < 0.01) {
        this.activateSpecial(player);
      }
    }
  }

  private updateCombat(_dt: number): void {
    for (const player of this.state.players) {
      if (player.state === 'angry' && player.fightTarget !== null) {
        const target = this.state.players.find(p => p.id === player.fightTarget);
        if (target && target.state === 'normal') {
          const dist = distance(player.pos, target.pos);
          if (dist > player.bodyRadius * 2) {
            const dir = normalize(vec2Sub(target.pos, player.pos));
            player.vel = vec2Scale(dir, MAX_SPEED * 0.8);
          }
        }
        player.fightTarget = null;
      }
    }
  }

  private updateSpecials(dt: number): void {
    if (this.state.puck.state === 'split' && this.state.puck.splitPucks === undefined) {
      const mainVel = this.state.puck.vel;
      const mainAngle = Math.atan2(mainVel.y, mainVel.x);
      const speed = Math.sqrt(mainVel.x * mainVel.x + mainVel.y * mainVel.y);

      this.state.puck.splitPucks = [
        {
          pos: { ...this.state.puck.pos },
          vel: { x: Math.cos(mainAngle - 0.3) * speed, y: Math.sin(mainAngle - 0.3) * speed },
          angle: mainAngle - 0.3,
          state: 'split',
          holderId: null,
          stateTimer: this.state.puck.stateTimer,
        },
        {
          pos: { ...this.state.puck.pos },
          vel: { x: Math.cos(mainAngle + 0.3) * speed, y: Math.sin(mainAngle + 0.3) * speed },
          angle: mainAngle + 0.3,
          state: 'split',
          holderId: null,
          stateTimer: this.state.puck.stateTimer,
        },
      ];
    }

    for (const player of this.state.players) {
      if (player.hasPuck && player.state === 'normal') {
        this.checkCombo(player);
      }
    }
  }

  private checkCombo(player: Player): void {
    const team = player.team;
    const nearby = this.state.players.filter(
      p => p.team === team && p.id !== player.id && p.state === 'normal' && distance(p.pos, player.pos) < 100
    );
    if (nearby.length >= 1) {
      this.state.comboPlayers[team] = [player.id, nearby[0].id];
      this.state.comboReady[team] = player.specialCharge >= player.maxSpecialCharge * 0.7;
    } else {
      this.state.comboReady[team] = false;
      this.state.comboPlayers[team] = [];
    }
  }

  private updateItems(dt: number): void {
    this.itemSpawnTimer -= dt;
    if (this.itemSpawnTimer <= 0 && this.state.items.filter(i => !i.collected).length < MAX_ITEMS) {
      this.spawnItem();
      this.itemSpawnTimer = ITEM_SPAWN_INTERVAL;
    }

    for (const item of this.state.items) {
      if (item.collected) {
        item.respawnTimer -= dt;
        if (item.respawnTimer <= 0) {
          item.collected = false;
          item.pos = this.randomRinkPosition(80);
        }
      }
    }

    for (const player of this.state.players) {
      if (player.activeItem !== null) continue;
      for (const item of this.state.items) {
        if (item.collected) continue;
        if (distance(player.pos, item.pos) < player.bodyRadius + 10) {
          item.collected = true;
          item.respawnTimer = ITEM_SPAWN_INTERVAL;
          player.activeItem = item.type;
          player.itemTimer = item.type === 'speed_skates' ? SPEED_BOOST_DURATION : LONG_STICK_DURATION;
          this.particles.spawnStarParticles(item.pos, 5);
        }
      }
    }
  }

  private spawnItem(): void {
    const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    this.state.items.push({
      id: this.nextItemId++,
      type,
      pos: this.randomRinkPosition(80),
      collected: false,
      respawnTimer: 0,
    });
  }

  private randomRinkPosition(margin: number): Vec2 {
    return {
      x: RINK.boardThickness + margin + Math.random() * (RINK.width - RINK.boardThickness * 2 - margin * 2),
      y: RINK.boardThickness + margin + Math.random() * (RINK.height - RINK.boardThickness * 2 - margin * 2),
    };
  }

  private updatePuck(dt: number): void {
    if (this.state.puck.holderId !== null) {
      const holder = this.state.players.find(p => p.id === this.state.puck.holderId);
      if (holder) {
        const dir = angleToVec2(holder.stickAngle);
        this.state.puck.pos = vec2Add(holder.pos, vec2Scale(dir, holder.stickLength * 0.8));
        this.state.puck.vel = { x: 0, y: 0 };

        if (holder.state === 'down' || holder.state === 'frozen') {
          holder.hasPuck = false;
          this.state.puck.holderId = null;
          this.state.puck.vel = { x: holder.vel.x * 0.5, y: holder.vel.y * 0.5 };
        }
      } else {
        this.state.puck.holderId = null;
      }
    } else {
      for (const player of this.state.players) {
        if (player.state !== 'normal') continue;
        if (player.hasPuck) continue;

        const puckDist = distance(player.pos, this.state.puck.pos);
        const reach = player.bodyRadius + player.stickLength + PUCK_RADIUS;
        if (puckDist < reach) {
          this.pickUpPuck(player);
          break;
        }
      }
    }
  }

  private pickUpPuck(player: Player): void {
    const currentHolder = this.state.puck.holderId;
    if (currentHolder !== null) {
      const old = this.state.players.find(p => p.id === currentHolder);
      if (old) old.hasPuck = false;
    }
    player.hasPuck = true;
    this.state.puck.holderId = player.id;
    this.state.puck.vel = { x: 0, y: 0 };
  }

  private checkGoals(): void {
    const scoredTeam = checkGoalCollision(this.state.puck, this.state.goals);
    if (scoredTeam) {
      const scoringTeam = scoredTeam === 'red' ? 'blue' : 'red';
      this.state.score[scoringTeam]++;

      const scorer = this.state.puck.holderId !== null
        ? this.state.players.find(p => p.id === this.state.puck.holderId)
        : null;
      if (scorer) {
        scorer.goals++;
        scorer.state = 'celebrating';
        scorer.stateTimer = 2;
      }

      this.state.lastGoalTeam = scoringTeam;
      this.state.celebrationTimer = 3;
      this.state.screenShake = { intensity: 8, duration: 0.5, timer: 0.5 };

      const goalObj = this.state.goals.find(g => g.team === scoredTeam);
      if (goalObj) {
        goalObj.scored = true;
        goalObj.shakeTimer = 0.5;
      }

      this.particles.spawnConfetti(this.state.puck.pos, 40);

      this.state.puck.holderId = null;
      for (const p of this.state.players) {
        p.hasPuck = false;
      }
    }
  }

  private updateIceTrails(dt: number): void {
    for (const player of this.state.players) {
      const speed = Math.sqrt(player.vel.x * player.vel.x + player.vel.y * player.vel.y);
      if (speed > 1.5) {
        let trail = this.state.iceTrails.find(t => t.team === player.team && t.points.length > 0);
        if (!trail) {
          trail = { points: [], team: player.team, alpha: 1 };
          this.state.iceTrails.push(trail);
        }
        trail.points.push({ x: player.pos.x, y: player.pos.y });
        if (trail.points.length > 30) {
          trail.points.shift();
        }
      }
    }

    for (let i = this.state.iceTrails.length - 1; i >= 0; i--) {
      this.state.iceTrails[i].alpha -= dt * 0.3;
      if (this.state.iceTrails[i].alpha <= 0) {
        this.state.iceTrails.splice(i, 1);
      }
    }
  }

  private updateScreenShake(dt: number): void {
    if (this.state.screenShake.timer > 0) {
      this.state.screenShake.timer -= dt;
      if (this.state.screenShake.timer <= 0) {
        this.state.screenShake.timer = 0;
        this.state.screenShake.intensity = 0;
        this.state.screenShake.duration = 0;
      }
    }
  }

  private spawnAmbientSnow(): void {
    if (Math.random() < 0.1) {
      this.particles.spawnSnowParticles(1);
    }
  }
}
