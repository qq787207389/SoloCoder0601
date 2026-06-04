import { KeyState } from '../types';

export class InputManager {
  private keys: KeyState;
  private keyPressed: KeyState;

  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      swing: false,
      special: false
    };
    this.keyPressed = { ...this.keys };
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = true;
        this.keyPressed.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = true;
        this.keyPressed.down = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = true;
        this.keyPressed.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = true;
        this.keyPressed.right = true;
        break;
      case 'Space':
        e.preventDefault();
        this.keys.swing = true;
        this.keyPressed.swing = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.special = true;
        this.keyPressed.special = true;
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.swing = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.special = false;
        break;
    }
  }

  getKeys(): KeyState {
    return { ...this.keys };
  }

  consumeKeyPress(key: keyof KeyState): boolean {
    if (this.keyPressed[key]) {
      this.keyPressed[key] = false;
      return true;
    }
    return false;
  }

  resetPressedKeys(): void {
    this.keyPressed = {
      up: false,
      down: false,
      left: false,
      right: false,
      swing: false,
      special: false
    };
  }

  destroy(): void {
    window.removeEventListener('keydown', (e) => this.onKeyDown(e));
    window.removeEventListener('keyup', (e) => this.onKeyUp(e));
  }
}
