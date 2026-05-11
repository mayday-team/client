export interface KeyState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  shooting: boolean;
}

export class InputManager {
  private keys: Record<string, boolean> = {};
  private shooting = false;
  private reloadRequested = false;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys[e.code] = true;
    if (e.code === "KeyR" && !e.repeat) {
      this.reloadRequested = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) this.shooting = true;
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.shooting = false;
  };

  getKeys(): KeyState {
    return {
      moveForward: !!this.keys["KeyW"] || !!this.keys["ArrowUp"],
      moveBackward: !!this.keys["KeyS"] || !!this.keys["ArrowDown"],
      moveLeft: !!this.keys["KeyA"] || !!this.keys["ArrowLeft"],
      moveRight: !!this.keys["KeyD"] || !!this.keys["ArrowRight"],
      shooting: this.shooting,
    };
  }

  consumeReload(): boolean {
    const requested = this.reloadRequested;
    this.reloadRequested = false;
    return requested;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
  }
}
