import {
  GamePhase,
  GameStateData,
  PlayerState,
  BallState,
  WindState,
  RefereeState,
  AIStyle,
  AI_STYLES,
  COURT_X,
  COURT_WIDTH,
  COURT_Y,
  COURT_HEIGHT,
  MAX_STAMINA,
  POINTS_TO_WIN,
  GAMES_TO_WIN
} from '../index';

function createPlayer(isPlayer: boolean): PlayerState {
  const baseX = COURT_X + COURT_WIDTH / 4;
  return {
    position: {
      x: isPlayer ? baseX : COURT_X + COURT_WIDTH - baseX,
      y: COURT_Y + COURT_HEIGHT / 2
    },
    velocity: { x: 0, y: 0 },
    stamina: MAX_STAMINA,
    isStunned: false,
    stunTimer: 0,
    isSwinging: false,
    swingTimer: 0,
    score: 0,
    gamesWon: 0,
    isPlayer
  };
}

function createBall(): BallState {
  return {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    vz: 0,
    height: 0,
    isInAir: false,
    lastHitBy: null,
    shotType: null,
    trail: [],
    hitTimestamp: 0
  };
}

function createWind(): WindState {
  return {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    changeTimer: 0
  };
}

function createReferee(): RefereeState {
  return {
    animation: 'idle',
    animationTimer: 0,
    displayScore: ''
  };
}

export function createInitialState(): GameStateData {
  return {
    phase: GamePhase.MENU,
    currentGame: 1,
    server: 'player',
    player: createPlayer(true),
    ai: createPlayer(false),
    ball: createBall(),
    wind: createWind(),
    effects: [],
    referee: createReferee(),
    aiStyle: AIStyle.DEFENSIVE,
    scoreTimer: 0,
    menuTimer: 0
  };
}

export function resetForNextServe(state: GameStateData, winner: 'player' | 'ai'): void {
  state.server = winner;
  state.ball = createBall();
  state.player.velocity = { x: 0, y: 0 };
  state.ai.velocity = { x: 0, y: 0 };
  state.player.isSwinging = false;
  state.ai.isSwinging = false;
  state.player.swingTimer = 0;
  state.ai.swingTimer = 0;

  const baseX = COURT_X + COURT_WIDTH / 4;
  state.player.position = {
    x: baseX,
    y: COURT_Y + COURT_HEIGHT / 2
  };
  state.ai.position = {
    x: COURT_X + COURT_WIDTH - baseX,
    y: COURT_Y + COURT_HEIGHT / 2
  };

  if (winner === 'player') {
    state.player.score++;
  } else {
    state.ai.score++;
  }

  if (state.player.score >= POINTS_TO_WIN || state.ai.score >= POINTS_TO_WIN) {
    const diff = Math.abs(state.player.score - state.ai.score);
    if (diff >= 2 || state.player.score >= 21 || state.ai.score >= 21) {
      if (state.player.score > state.ai.score) {
        state.player.gamesWon++;
      } else {
        state.ai.gamesWon++;
      }

      if (state.player.gamesWon >= GAMES_TO_WIN || state.ai.gamesWon >= GAMES_TO_WIN) {
        state.phase = GamePhase.GAME_OVER;
        return;
      }

      state.currentGame++;
      state.player.score = 0;
      state.ai.score = 0;
      state.aiStyle = AI_STYLES[(state.currentGame - 1) % AI_STYLES.length];
    }
  }

  state.phase = GamePhase.SCORE;
  state.scoreTimer = 2;
}

export function startGame(state: GameStateData): void {
  state.phase = GamePhase.PLAYING;
  state.currentGame = 1;
  state.player.score = 0;
  state.ai.score = 0;
  state.player.gamesWon = 0;
  state.ai.gamesWon = 0;
  state.aiStyle = AIStyle.DEFENSIVE;
  state.server = 'player';
  state.wind = createWind();
  state.effects = [];

  const baseX = COURT_X + COURT_WIDTH / 4;
  state.player.position = {
    x: baseX,
    y: COURT_Y + COURT_HEIGHT / 2
  };
  state.ai.position = {
    x: COURT_X + COURT_WIDTH - baseX,
    y: COURT_Y + COURT_HEIGHT / 2
  };
  state.player.stamina = MAX_STAMINA;
  state.ai.stamina = MAX_STAMINA;

  serveBall(state, state.server);
}

export function serveBall(state: GameStateData, server: 'player' | 'ai'): void {
  const ball = state.ball;
  const serverPos = server === 'player' ? state.player.position : state.ai.position;

  const randomXOffset = (Math.random() - 0.5) * 30;
  const randomYOffset = (Math.random() - 0.5) * 20;
  const randomSpeed = 170 + Math.random() * 40;
  const randomVz = 260 + Math.random() * 60;
  const randomHeight = 50 + Math.random() * 30;
  const randomYVel = -60 + Math.random() * 40;

  ball.position = {
    x: serverPos.x + randomXOffset,
    y: serverPos.y - 30 + randomYOffset
  };
  ball.velocity = {
    x: server === 'player' ? randomSpeed : -randomSpeed,
    y: randomYVel
  };
  ball.vz = randomVz;
  ball.height = randomHeight;
  ball.isInAir = true;
  ball.lastHitBy = server;
  ball.shotType = null;
  ball.trail = [];
  ball.hitTimestamp = performance.now() / 1000;
}
