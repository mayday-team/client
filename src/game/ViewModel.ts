import * as THREE from "three";

// 1인칭 뷰모델: 소총만 화면 우하단에 자연스럽게
// 뷰모델 씬은 카메라가 (0,0,0) identity → 총이 화면에 고정
// 좌표계: +X=우, +Y=상, -Z=전방(화면 안쪽)
export class ViewModel {
  private readonly group = new THREE.Group();
  private readonly muzzleLight: THREE.PointLight;

  constructor(scene: THREE.Scene) {
    // 총 그룹 전체 위치 및 각도 조정
    // 우하단에, 약간 안쪽으로, 총구가 좌상 방향 (자연스러운 어깨에 댄 자세)
    this.group.position.set(0.16, -0.30, -0.50);
    this.group.rotation.set(0.05, 0.10, -0.08); // 미세 틸트

    this.buildRifle();

    // 총구 플래시 라이트
    this.muzzleLight = new THREE.PointLight(0xff8800, 0, 1.2);
    this.muzzleLight.position.set(0.10, -0.22, -0.90);
    scene.add(this.muzzleLight);

    scene.add(this.group);
  }

  flash(): void {
    this.muzzleLight.intensity = 5;
    setTimeout(() => { this.muzzleLight.intensity = 0; }, 70);
  }

  private add(geo: THREE.BufferGeometry, color: number, emissive: number, isMetal = false): THREE.Mesh {
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color,
        roughness: isMetal ? 0.32 : 0.78,
        metalness: isMetal ? 0.85 : 0.05,
        emissive: new THREE.Color(emissive),
        emissiveIntensity: 0.65,
      }),
    );
    this.group.add(mesh);
    return mesh;
  }

  private buildRifle(): void {
    // 모든 좌표는 group 로컬 기준 (group 자체가 우하단에 위치)
    // -Z 방향이 총구 쪽 (화면 안쪽)

    const wood  = 0x28180a;
    const wE    = 0x0c0804;
    const metal = 0x202220;
    const mE    = 0x080808;

    // 개머리판 — 가장 카메라 가까운 쪽, 화면 아래쪽에 묻힘
    const stock = this.add(new THREE.BoxGeometry(0.042, 0.065, 0.34), wood, wE);
    stock.position.set(0, 0, 0.12);

    // 리시버 (총 몸통 중앙)
    const recv = this.add(new THREE.BoxGeometry(0.038, 0.074, 0.28), metal, mE, true);
    recv.position.set(0, 0.004, -0.16);

    // 탄창
    const mag = this.add(new THREE.BoxGeometry(0.026, 0.118, 0.062), metal, mE, true);
    mag.position.set(0, -0.088, -0.13);

    // 방아쇠 울
    const guard = this.add(new THREE.BoxGeometry(0.008, 0.040, 0.065), metal, mE, true);
    guard.position.set(0, -0.052, -0.08);

    // 전방 목재 (fore-end)
    const fore = this.add(new THREE.BoxGeometry(0.033, 0.050, 0.27), wood, wE);
    fore.position.set(-0.010, -0.010, -0.40);

    // 총열 (barrel)
    const barrelGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.55, 7);
    const barrel = this.add(barrelGeo, metal, mE, true);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(-0.010, -0.007, -0.66);

    // 총구
    const muzzleGeo = new THREE.CylinderGeometry(0.015, 0.013, 0.036, 6);
    const muzzle = this.add(muzzleGeo, metal, mE, true);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(-0.010, -0.007, -0.94);

    // 가늠쇠
    const fSight = this.add(new THREE.BoxGeometry(0.014, 0.024, 0.015), metal, mE, true);
    fSight.position.set(-0.010, 0.018, -0.91);

    // 가늠자
    const rSight = this.add(new THREE.BoxGeometry(0.016, 0.018, 0.010), metal, mE, true);
    rSight.position.set(0, 0.044, -0.30);
  }
}
