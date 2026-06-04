import type { InputState } from './types';

const EMPTY_INPUT: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  pass: false,
  shoot: false,
  fight: false,
  special: false,
  item: false,
  passPressed: false,
  shootPressed: false,
  fightPressed: false,
  specialPressed: false,
  itemPressed: false,
};

const P1_KEYS: Record<string, keyof InputState> = {
  KeyW: 'up',
  KeyA: 'left',
  KeyS: 'down',
  KeyD: 'right',
  KeyQ: 'pass',
  KeyE: 'shoot',
  Space: 'fight',
  KeyR: 'special',
  KeyF: 'item',
};

const P2_KEYS: Record<string, keyof InputState> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Slash: 'pass',
  Period: 'shoot',
  ShiftRight: 'fight',
  Semicolon: 'special',
  Quote: 'item',
};

const ACTION_KEYS = new Set<string>([
  'pass', 'shoot', 'fight', 'special', 'item',
]);

export class InputManager {
  private p1Held: Set<string> = new Set();
  private p1JustPressed: Set<string> = new Set();
  private p2Held: Set<string> = new Set();
  private p2JustPressed: Set<string> = new Set();
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
  }

  init(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    const isP1Key = code in P1_KEYS;
    const isP2Key = code in P2_KEYS;
    if (!isP1Key && !isP2Key) return;
    e.preventDefault();

    if (P1_KEYS[code]) {
      const action = P1_KEYS[code];
      if (!this.p1Held.has(action)) {
        this.p1Held.add(action);
        if (ACTION_KEYS.has(action)) {
          this.p1JustPressed.add(action);
        }
      }
    }

    if (P2_KEYS[code]) {
      const action = P2_KEYS[code];
      if (!this.p2Held.has(action)) {
        this.p2Held.add(action);
        if (ACTION_KEYS.has(action)) {
          this.p2JustPressed.add(action);
        }
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const code = e.code;

    if (P1_KEYS[code]) {
      this.p1Held.delete(P1_KEYS[code]);
    }

    if (P2_KEYS[code]) {
      this.p2Held.delete(P2_KEYS[code]);
    }
  }

  getInput(player: 1 | 2): InputState {
    const input = { ...EMPTY_INPUT };

    if (player === 1) {
      input.up = this.p1Held.has('up');
      input.down = this.p1Held.has('down');
      input.left = this.p1Held.has('left');
      input.right = this.p1Held.has('right');
      input.pass = this.p1Held.has('pass');
      input.shoot = this.p1Held.has('shoot');
      input.fight = this.p1Held.has('fight');
      input.special = this.p1Held.has('special');
      input.item = this.p1Held.has('item');
      input.passPressed = this.p1JustPressed.has('pass');
      input.shootPressed = this.p1JustPressed.has('shoot');
      input.fightPressed = this.p1JustPressed.has('fight');
      input.specialPressed = this.p1JustPressed.has('special');
      input.itemPressed = this.p1JustPressed.has('item');
      this.p1JustPressed.clear();
    } else {
      input.up = this.p2Held.has('up');
      input.down = this.p2Held.has('down');
      input.left = this.p2Held.has('left');
      input.right = this.p2Held.has('right');
      input.pass = this.p2Held.has('pass');
      input.shoot = this.p2Held.has('shoot');
      input.fight = this.p2Held.has('fight');
      input.special = this.p2Held.has('special');
      input.item = this.p2Held.has('item');
      input.passPressed = this.p2JustPressed.has('pass');
      input.shootPressed = this.p2JustPressed.has('shoot');
      input.fightPressed = this.p2JustPressed.has('fight');
      input.specialPressed = this.p2JustPressed.has('special');
      input.itemPressed = this.p2JustPressed.has('item');
      this.p2JustPressed.clear();
    }

    return input;
  }
}
