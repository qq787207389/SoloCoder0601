export type GameKey =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'PUNCH'
  | 'KICK'
  | 'SKILL'
  | 'JUMP'
  | 'BLOCK'
  | 'CONFIRM'
  | 'PAUSE';

export type Direction = 'NONE' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

export type MoveCombo = 'DASH_PUNCH' | 'DASH_KICK' | 'UPPERCUT' | 'NONE';

interface KeyState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
}

interface DirectionBufferEntry {
  direction: Direction;
  timestamp: number;
}

const KEY_MAP: Record<string, GameKey> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  KeyW: 'UP',
  KeyS: 'DOWN',
  KeyA: 'LEFT',
  KeyD: 'RIGHT',
  KeyJ: 'PUNCH',
  KeyK: 'KICK',
  KeyL: 'SKILL',
  Space: 'JUMP',
  ShiftLeft: 'BLOCK',
  ShiftRight: 'BLOCK',
  Enter: 'CONFIRM',
  Escape: 'PAUSE',
};

const BUFFER_DURATION = 150;
const COMBO_WINDOW = 200;

export class InputManager {
  private keyStates: Record<GameKey, KeyState>;
  private prevKeyStates: Record<GameKey, KeyState>;
  private directionBuffer: DirectionBufferEntry[];
  private lastAttackTime: number;
  private lastDirection: Direction;

  constructor() {
    this.keyStates = {} as Record<GameKey, KeyState>;
    this.prevKeyStates = {} as Record<GameKey, KeyState>;
    const keys: GameKey[] = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'PUNCH', 'KICK', 'SKILL', 'JUMP', 'BLOCK', 'CONFIRM', 'PAUSE'];
    keys.forEach((key) => {
      this.keyStates[key] = { pressed: false, justPressed: false, justReleased: false };
      this.prevKeyStates[key] = { pressed: false, justPressed: false, justReleased: false };
    });
    this.directionBuffer = [];
    this.lastAttackTime = 0;
    this.lastDirection = 'NONE';
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const gameKey = KEY_MAP[e.code];
    if (gameKey) {
      e.preventDefault();
      this.keyStates[gameKey].pressed = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const gameKey = KEY_MAP[e.code];
    if (gameKey) {
      e.preventDefault();
      this.keyStates[gameKey].pressed = false;
    }
  }

  update(): void {
    const now = performance.now();

    Object.keys(this.keyStates).forEach((key) => {
      const gameKey = key as GameKey;
      const current = this.keyStates[gameKey];
      const prev = this.prevKeyStates[gameKey];
      
      current.justPressed = current.pressed && !prev.pressed;
      current.justReleased = !current.pressed && prev.pressed;
      
      prev.pressed = current.pressed;
    });

    const currentDir = this.getDirection();
    if (currentDir !== 'NONE' && currentDir !== this.lastDirection) {
      this.directionBuffer.push({ direction: currentDir, timestamp: now });
      this.lastDirection = currentDir;
    } else if (currentDir === 'NONE') {
      this.lastDirection = 'NONE';
    }

    this.directionBuffer = this.directionBuffer.filter(
      (entry) => now - entry.timestamp < BUFFER_DURATION
    );

    if (this.isJustPressed('PUNCH') || this.isJustPressed('KICK')) {
      this.lastAttackTime = now;
    }
  }

  isPressed(key: GameKey): boolean {
    return this.keyStates[key].pressed;
  }

  isJustPressed(key: GameKey): boolean {
    return this.keyStates[key].justPressed;
  }

  isJustReleased(key: GameKey): boolean {
    return this.keyStates[key].justReleased;
  }

  getDirection(): Direction {
    if (this.isPressed('LEFT')) return 'LEFT';
    if (this.isPressed('RIGHT')) return 'RIGHT';
    if (this.isPressed('UP')) return 'UP';
    if (this.isPressed('DOWN')) return 'DOWN';
    return 'NONE';
  }

  checkMoveCombo(): MoveCombo {
    const now = performance.now();

    if (now - this.lastAttackTime > COMBO_WINDOW) return 'NONE';

    const recentDirs = this.directionBuffer
      .filter((e) => now - e.timestamp < COMBO_WINDOW)
      .map((e) => e.direction);

    const hasRight = recentDirs.includes('RIGHT');
    const hasLeft = recentDirs.includes('LEFT');
    const hasUp = recentDirs.includes('UP');

    const dashDir = hasRight ? 'RIGHT' : hasLeft ? 'LEFT' : null;

    if (dashDir && this.isJustPressed('PUNCH')) return 'DASH_PUNCH';
    if (dashDir && this.isJustPressed('KICK')) return 'DASH_KICK';
    if (hasUp && this.isJustPressed('PUNCH')) return 'UPPERCUT';

    return 'NONE';
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
