import { InputState, Vector2 } from './types'

export class InputManager {
  private state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
    special: false,
    mousePos: { x: 0, y: 0 }
  }
  
  private actionPressedThisFrame: boolean = false
  private specialPressedThisFrame: boolean = false

  constructor(private canvas: HTMLCanvasElement) {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e))
    window.addEventListener('keyup', (e) => this.handleKeyUp(e))
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
  }

  private handleKeyDown(e: KeyboardEvent) {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.state.up = true
        break
      case 's':
      case 'arrowdown':
        this.state.down = true
        break
      case 'a':
      case 'arrowleft':
        this.state.left = true
        break
      case 'd':
      case 'arrowright':
        this.state.right = true
        break
      case ' ':
        if (!this.state.action) {
          this.actionPressedThisFrame = true
        }
        this.state.action = true
        e.preventDefault()
        break
      case 'e':
        if (!this.state.special) {
          this.specialPressedThisFrame = true
        }
        this.state.special = true
        break
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.state.up = false
        break
      case 's':
      case 'arrowdown':
        this.state.down = false
        break
      case 'a':
      case 'arrowleft':
        this.state.left = false
        break
      case 'd':
      case 'arrowright':
        this.state.right = false
        break
      case ' ':
        this.state.action = false
        break
      case 'e':
        this.state.special = false
        break
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    this.state.mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  getState(): InputState {
    return { ...this.state }
  }

  isActionPressed(): boolean {
    return this.actionPressedThisFrame
  }

  isSpecialPressed(): boolean {
    return this.specialPressedThisFrame
  }

  clearFrameState() {
    this.actionPressedThisFrame = false
    this.specialPressedThisFrame = false
  }

  getMovementVector(): Vector2 {
    return {
      x: (this.state.right ? 1 : 0) - (this.state.left ? 1 : 0),
      y: (this.state.down ? 1 : 0) - (this.state.up ? 1 : 0)
    }
  }
}
