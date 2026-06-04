import {
  GamePhase,
  GameStateData,
  ShotType,
  createInitialState,
  startGame,
  resetForNextServe,
  serveBall,
  InputManager,
  AudioManager,
  AIController,
  Renderer,
  updatePhysics,
  handlePlayerSwing,
  handleAISwing,
  checkScoring,
  createScoreEffects,
  SPECIAL_COST
} from './index';

export class Game {
  private canvas: HTMLCanvasElement;
  private state: GameStateData;
  private input: InputManager;
  private audio: AudioManager;
  private ai: AIController;
  private renderer: Renderer;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas element ${canvasId} not found`);
    }

    this.canvas = canvas;
    this.state = createInitialState();
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.ai = new AIController();
    this.renderer = new Renderer(canvas);

    this.setupClickHandler();
  }

  private setupClickHandler(): void {
    this.canvas.addEventListener('click', () => {
      this.audio.resume();
    });
  }

  start(): void {
    this.audio.init();
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(currentTime: number): void {
    if (!this.running) return;

    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.renderer.render(this.state, dt);

    requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number): void {
    if (this.state.phase === GamePhase.MENU) {
      this.state.menuTimer += dt;
      if (this.input.consumeKeyPress('swing')) {
        this.audio.resume();
        startGame(this.state);
        this.ai.setStyle(this.state.aiStyle);
        this.audio.playScore();
      }
      return;
    }

    if (this.state.phase === GamePhase.GAME_OVER) {
      if (this.input.consumeKeyPress('swing')) {
        startGame(this.state);
        this.ai.setStyle(this.state.aiStyle);
        this.audio.playScore();
      }
      return;
    }

    if (this.state.phase === GamePhase.SCORE) {
      this.state.scoreTimer -= dt;
      if (this.state.scoreTimer <= 0) {
        this.state.phase = GamePhase.PLAYING;
        serveBall(this.state, this.state.server);
      }
      return;
    }

    if (this.state.phase === GamePhase.PLAYING) {
      const playerKeys = this.input.getKeys();
      const aiKeys = this.ai.update(this.state, dt);

      updatePhysics(this.state, playerKeys, aiKeys, dt);

      if (this.input.consumeKeyPress('special') && this.state.player.stamina >= SPECIAL_COST) {
        const hit = handlePlayerSwing(this.state, true);
        if (hit) {
          this.audio.playSpecial();
        }
      } else if (this.input.consumeKeyPress('swing')) {
        const hit = handlePlayerSwing(this.state, false);
        if (hit) {
          const shotType = this.state.ball.shotType;
          if (shotType === ShotType.SMASH) {
            this.audio.playSmash();
          } else {
            this.audio.playHit();
          }
        } else {
          this.audio.playMiss(0.1);
        }
      }

      if (aiKeys.swing) {
        const hit = handleAISwing(this.state);
        if (hit) {
          const shotType = this.state.ball.shotType;
          if (shotType === ShotType.SMASH) {
            this.audio.playSmash(0.3);
          } else {
            this.audio.playHit(0.25);
          }
        }
      }

      const winner = checkScoring(this.state);
      if (winner) {
        createScoreEffects(this.state, winner);
        this.audio.playScore();
        resetForNextServe(this.state, winner);
        this.ai.setStyle(this.state.aiStyle);
      }
    }

    this.input.resetPressedKeys();
  }

  destroy(): void {
    this.running = false;
    this.input.destroy();
  }
}
