import * as THREE from "three";
import type { InputManager } from "./InputManager";

const SPEED = 8;
const EYE_HEIGHT = 7.0; // 2층 고정

// 2층 내부 이동 가능 범위 (건물 벽 안)
const BOUNDS = {
  xMin: -12.5, xMax: 12.5,
  zMin: -45.0, zMax: -34.5,
};

const _fwd   = new THREE.Vector3();
const _right = new THREE.Vector3();

export class LocalMovement {
  constructor(
    private camera: THREE.Camera,
    private input: InputManager,
  ) {}

  update(delta: number): void {
    const { moveForward, moveBackward, moveLeft, moveRight } = this.input.getKeys();
    const dist = SPEED * delta;

    // 전진: 카메라가 바라보는 방향 (수평 성분만)
    this.camera.getWorldDirection(_fwd);
    _fwd.y = 0;
    _fwd.normalize();

    // 좌우: 카메라 행렬 X열 (항상 정확한 로컬 오른쪽)
    _right.setFromMatrixColumn((this.camera as THREE.PerspectiveCamera).matrixWorld, 0);
    _right.y = 0;
    _right.normalize();

    if (moveForward)  this.camera.position.addScaledVector(_fwd,   dist);
    if (moveBackward) this.camera.position.addScaledVector(_fwd,  -dist);
    if (moveRight)    this.camera.position.addScaledVector(_right,  dist);
    if (moveLeft)     this.camera.position.addScaledVector(_right, -dist);

    // 2층 경계 클램핑
    const p = this.camera.position;
    p.x = Math.max(BOUNDS.xMin, Math.min(BOUNDS.xMax, p.x));
    p.z = Math.max(BOUNDS.zMin, Math.min(BOUNDS.zMax, p.z));
    p.y = EYE_HEIGHT;
  }
}
