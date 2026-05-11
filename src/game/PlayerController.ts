import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

const _euler = new THREE.Euler(0, 0, 0, "YXZ");
const HALF_PI = Math.PI / 2;
const LOOK_SPEED = 0.002;

export class PlayerController {
  readonly controls: PointerLockControls;
  private isLocked = false;
  private lockEnabled = false; // off until "playing" phase

  constructor(
    private camera: THREE.Camera,
    private canvas: HTMLCanvasElement,
  ) {
    this.controls = new PointerLockControls(camera, canvas);

    canvas.addEventListener("click", this.onClick);
    window.addEventListener("mousemove", this.onMouseMove);

    this.controls.addEventListener("lock", () => {
      this.isLocked = true;
    });

    this.controls.addEventListener("unlock", () => {
      this.isLocked = false;
    });
  }

  private onClick = (): void => {
    if (this.lockEnabled && !this.isLocked) this.controls.lock();
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.lockEnabled || this.isLocked) return;

    _euler.setFromQuaternion(this.camera.quaternion);
    _euler.y -= e.movementX * LOOK_SPEED;
    _euler.x -= e.movementY * LOOK_SPEED;
    _euler.x = Math.max(-HALF_PI, Math.min(HALF_PI, _euler.x));
    this.camera.quaternion.setFromEuler(_euler);
  };

  setEnabled(enabled: boolean): void {
    this.lockEnabled = enabled;
    this.controls.enabled = enabled;
    if (!enabled && this.isLocked) this.controls.unlock();
  }

  get locked(): boolean {
    return this.isLocked;
  }

  dispose(): void {
    this.canvas.removeEventListener("click", this.onClick);
    window.removeEventListener("mousemove", this.onMouseMove);
    this.controls.dispose();
  }
}
