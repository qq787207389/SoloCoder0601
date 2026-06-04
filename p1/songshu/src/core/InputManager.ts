import { InputState } from '../types/game';
import { KEY_BINDINGS } from '../config/constants';

export class InputManager {
  private player1Input: InputState;
  private player2Input: InputState;
  private keysPressed: Set<string>;
  private actionJustPressed: Set<string>;

  constructor() {
    this.player1Input = this.createEmptyInput();
    this.player2Input = this.createEmptyInput();
    this.keysPressed = new Set();
    this.actionJustPressed = new Set();

    this.setupEventListeners();
  }

  private createEmptyInput(): InputState {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      action: false
    };
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
    });
  }

  update(): void {
    this.player1Input = this.getInputForPlayer(1);
    this.player2Input = this.getInputForPlayer(2);
  }

  private getInputForPlayer(playerNum: 1 | 2): InputState {
    const bindings = playerNum === 1 ? KEY_BINDINGS.player1 : KEY_BINDINGS.player2;
    return {
      left: this.keysPressed.has(bindings.left),
      right: this.keysPressed.has(bindings.right),
      up: this.keysPressed.has(bindings.up),
      down: this.keysPressed.has(bindings.down),
      jump: this.keysPressed.has(bindings.jump),
      action: this.keysPressed.has(bindings.action)
    };
  }

  getPlayerInput(playerId: number): InputState {
    return playerId === 1 ? this.player1Input : this.player2Input;
  }

  isKeyJustPressed(keyCode: string): boolean {
    const isPressed = this.keysPressed.has(keyCode);
    if (isPressed && !this.actionJustPressed.has(keyCode)) {
      this.actionJustPressed.add(keyCode);
      return true;
    }
    if (!isPressed) {
      this.actionJustPressed.delete(keyCode);
    }
    return false;
  }

  isActionJustPressed(playerId: number): boolean {
    const bindings = playerId === 1 ? KEY_BINDINGS.player1 : KEY_BINDINGS.player2;
    return this.isKeyJustPressed(bindings.action);
  }

  isJumpJustPressed(playerId: number): boolean {
    const bindings = playerId === 1 ? KEY_BINDINGS.player1 : KEY_BINDINGS.player2;
    return this.isKeyJustPressed(bindings.jump);
  }
}
