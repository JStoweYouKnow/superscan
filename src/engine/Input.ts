export class Input {
  private keys = new Map<string, boolean>();
  private pressed = new Map<string, boolean>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.get(e.code)) {
        this.pressed.set(e.code, true);
      }
      this.keys.set(e.code, true);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });
  }

  isDown(code: string): boolean {
    return this.keys.get(code) ?? false;
  }

  wasPressed(code: string): boolean {
    return this.pressed.get(code) ?? false;
  }

  endFrame(): void {
    this.pressed.clear();
  }

  get left(): boolean {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get right(): boolean {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get jump(): boolean {
    return this.wasPressed('ArrowUp') || this.wasPressed('KeyW') || this.wasPressed('Space');
  }

  get jumpHeld(): boolean {
    return this.isDown('ArrowUp') || this.isDown('KeyW') || this.isDown('Space');
  }

  get attack(): boolean {
    return this.wasPressed('KeyZ') || this.wasPressed('KeyX') || this.wasPressed('ShiftLeft');
  }

  get start(): boolean {
    return this.wasPressed('Enter') || this.wasPressed('Space');
  }
}
