import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export class PlayerController {
  readonly controls: PointerLockControls;
  private isLocked = false;

  constructor(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.controls = new PointerLockControls(camera, canvas);

    canvas.addEventListener("click", () => {
      if (!this.isLocked) this.controls.lock();
    });

    this.controls.addEventListener("lock", () => {
      this.isLocked = true;
    });

    this.controls.addEventListener("unlock", () => {
      this.isLocked = false;
    });
  }

  get locked(): boolean {
    return this.isLocked;
  }
}
