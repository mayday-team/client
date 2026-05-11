import * as THREE from "three";
import type { InputManager } from "./InputManager";

const SPEED = 8;
const EYE_HEIGHT = 1.7;

const _dir   = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up    = new THREE.Vector3(0, 1, 0);

export class LocalMovement {
  constructor(
    private camera: THREE.Camera,
    private input: InputManager,
  ) {}

  update(delta: number): void {
    const { moveForward, moveBackward, moveLeft, moveRight } = this.input.getKeys();
    const dist = SPEED * delta;

    // Always derive forward/right from the actual camera world direction —
    // independent of initial rotation or PointerLockControls internals.
    this.camera.getWorldDirection(_dir);
    _dir.y = 0;
    _dir.normalize();
    _right.crossVectors(_dir, _up).normalize();

    if (moveForward)  this.camera.position.addScaledVector(_dir,   dist);
    if (moveBackward) this.camera.position.addScaledVector(_dir,  -dist);
    if (moveRight)    this.camera.position.addScaledVector(_right,  dist);
    if (moveLeft)     this.camera.position.addScaledVector(_right, -dist);

    this.camera.position.y = EYE_HEIGHT;
  }
}
