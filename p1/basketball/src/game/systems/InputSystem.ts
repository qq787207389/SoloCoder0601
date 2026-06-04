import { InputState } from '../../types/game';

export class InputSystem {
  private player1Input: InputState;
  private player2Input: InputState;
  private keyMap: Map<string, { player: number; action: keyof InputState }>;

  constructor() {
    this.player1Input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      pass: false,
      shoot: false,
    };

    this.player2Input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      pass: false,
      shoot: false,
    };

    this.keyMap = new Map([
      ['KeyA', { player: 1, action: 'left' }],
      ['KeyD', { player: 1, action: 'right' }],
      ['KeyW', { player: 1, action: 'up' }],
      ['KeyS', { player: 1, action: 'down' }],
      ['KeyK', { player: 1, action: 'jump' }],
      ['KeyJ', { player: 1, action: 'pass' }],
      ['KeyL', { player: 1, action: 'shoot' }],
      ['ArrowLeft', { player: 2, action: 'left' }],
      ['ArrowRight', { player: 2, action: 'right' }],
      ['ArrowUp', { player: 2, action: 'up' }],
      ['ArrowDown', { player: 2, action: 'down' }],
      ['Numpad2', { player: 2, action: 'jump' }],
      ['Digit2', { player: 2, action: 'jump' }],
      ['Numpad1', { player: 2, action: 'pass' }],
      ['Digit1', { player: 2, action: 'pass' }],
      ['Numpad3', { player: 2, action: 'shoot' }],
      ['Digit3', { player: 2, action: 'shoot' }],
    ]);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const mapping = this.keyMap.get(e.code);
    if (mapping) {
      e.preventDefault();
      const input = mapping.player === 1 ? this.player1Input : this.player2Input;
      input[mapping.action] = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const mapping = this.keyMap.get(e.code);
    if (mapping) {
      e.preventDefault();
      const input = mapping.player === 1 ? this.player1Input : this.player2Input;
      input[mapping.action] = false;
    }
  }

  getPlayerInput(player: 1 | 2): InputState {
    const input = player === 1 ? this.player1Input : this.player2Input;
    return { ...input };
  }

  reset(): void {
    for (const key of Object.keys(this.player1Input) as (keyof InputState)[]) {
      this.player1Input[key] = false;
      this.player2Input[key] = false;
    }
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
