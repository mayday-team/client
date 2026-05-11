import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export class PlayerController {
  readonly controls: PointerLockControls;
  private isLocked = false;
  private lockEnabled = false; // off until "playing" phase

  constructor(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.controls = new PointerLockControls(camera, canvas);

    canvas.addEventListener("click", () => {
      if (this.lockEnabled && !this.isLocked) this.controls.lock();
    });

    this.controls.addEventListener("lock", () => {
      this.isLocked = true;
    });

    this.controls.addEventListener("unlock", () => {
      this.isLocked = false;
    });
  }

  setEnabled(enabled: boolean): void {
    this.lockEnabled = enabled;
    if (!enabled && this.isLocked) this.controls.unlock();
  }

  get locked(): boolean {
    return this.isLocked;
  }
}
