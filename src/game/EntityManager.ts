import * as THREE from "three";
import type { TroopSnapshot } from "../types/game";

const HOSTILE_STATES = new Set(["ATTACK", "CHASE", "FLANK", "SUPPRESS", "ADVANCE"]);

export class EntityManager {
  private troopMeshes = new Map<string, THREE.Group>();

  constructor(private scene: THREE.Scene) {}

  updateTroops(troops: TroopSnapshot[]): void {
    const activeIds = new Set(troops.map((t) => t.id));

    for (const [id, group] of this.troopMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.troopMeshes.delete(id);
      }
    }

    for (const troop of troops) {
      if (!troop.is_alive) {
        const existing = this.troopMeshes.get(troop.id);
        if (existing) {
          this.scene.remove(existing);
          this.troopMeshes.delete(troop.id);
        }
        continue;
      }

      let group = this.troopMeshes.get(troop.id);
      if (!group) {
        group = this.createTroopMesh(troop);
        this.scene.add(group);
        this.troopMeshes.set(troop.id, group);
      }

      group.position.set(troop.position.x, troop.position.y, troop.position.z);
      group.rotation.y = troop.yaw;

      // Tint body red when attacking, emissive도 함께 업데이트
      const isHostile = HOSTILE_STATES.has(troop.state);
      const body = group.getObjectByName("body") as THREE.Mesh | undefined;
      if (body) {
        const mat = body.material as THREE.MeshStandardMaterial;
        if (isHostile) {
          mat.color.set(0xaa2200);
          mat.emissive.set(0x6a1000);
          mat.emissiveIntensity = 2.4;
        } else {
          mat.color.set(0x556644);
          mat.emissive.set(0x2a3818);
          mat.emissiveIntensity = 1.9;
        }
      }
    }
  }

  /** @deprecated kept for compat — use updateTroops */
  updateEnemies(_: unknown[]): void {}
  updateCivilians(_: unknown[]): void {}
  updateHelicopter(_: unknown): void {}

  private createTroopMesh(troop: TroopSnapshot): THREE.Group {
    const g = new THREE.Group();

    // 1980년 한국 계엄군 군복 색상 — 거칠기/금속성으로 표면 차별화
    const uniformMat = new THREE.MeshStandardMaterial({
      color: 0x4a5238, roughness: 0.85, metalness: 0.02,
      emissive: new THREE.Color(0x1e2214), emissiveIntensity: 1.9,
    });
    const helmetMat  = new THREE.MeshStandardMaterial({
      color: 0x333d25, roughness: 0.45, metalness: 0.55, // 강철 헬멧
      emissive: new THREE.Color(0x141a0e), emissiveIntensity: 1.9,
    });
    const skinMat    = new THREE.MeshStandardMaterial({
      color: 0xc8a070, roughness: 0.75, metalness: 0,
      emissive: new THREE.Color(0x5a3a18), emissiveIntensity: 1.4,
    });
    const bootMat    = new THREE.MeshStandardMaterial({
      color: 0x2a2018, roughness: 0.55, metalness: 0.1, // 가죽
      emissive: new THREE.Color(0x0e0c08), emissiveIntensity: 1.5,
    });
    const beltMat    = new THREE.MeshStandardMaterial({
      color: 0x3a3020, roughness: 0.6, metalness: 0.1,
      emissive: new THREE.Color(0x141008), emissiveIntensity: 1.5,
    });
    const rifleMat   = new THREE.MeshStandardMaterial({
      color: 0x1e1e18, roughness: 0.35, metalness: 0.75, // 강철 총신
      emissive: new THREE.Color(0x0c0c08), emissiveIntensity: 1.5,
    });
    const woodMat    = new THREE.MeshStandardMaterial({
      color: 0x3c2210, roughness: 0.85, metalness: 0.04,
      emissive: new THREE.Color(0x180e06), emissiveIntensity: 1.5,
    });

    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x=0, y=0, z=0): THREE.Mesh => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };

    // 정면 식별용 머티리얼 — 어두운 띠/눈/벨트 버클
    const darkAccent = new THREE.MeshStandardMaterial({
      color: 0x0a0a08, roughness: 0.6, metalness: 0.2,
      emissive: new THREE.Color(0x040402), emissiveIntensity: 1.5,
    });
    // 가슴 휘장 — 약간 밝아서 멀리서도 보임
    const insigniaMat = new THREE.MeshStandardMaterial({
      color: 0x8a7440, roughness: 0.7, metalness: 0.3,
      emissive: new THREE.Color(0x2a2010), emissiveIntensity: 1.6,
    });

    // ── 상체 (몸통) ─────────────────────────────────────────────────────────
    // +z가 정면 — 몸통은 앞뒤 두께를 좀 더 차이나게
    const body = mesh(new THREE.BoxGeometry(0.44, 0.62, 0.28), uniformMat, 0, 1.21, 0);
    body.name = "body";

    // 가슴 휘장 (정면 식별) — 군복 위 왼쪽 가슴
    mesh(new THREE.BoxGeometry(0.10, 0.04, 0.02), insigniaMat, -0.10, 1.36, 0.14);
    // 가슴 단추 줄 (정면 중앙)
    for (const y of [1.40, 1.28, 1.16, 1.04]) {
      mesh(new THREE.BoxGeometry(0.03, 0.03, 0.025), darkAccent, 0, y, 0.14);
    }

    // 목
    mesh(new THREE.BoxGeometry(0.14, 0.10, 0.14), skinMat, 0, 1.57, 0);

    // ── 머리 ──────────────────────────────────────────────────────────────
    mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), skinMat, 0, 1.73, 0);

    // 얼굴 정면 디테일 — 눈 두 개 (어두운 점)
    mesh(new THREE.BoxGeometry(0.04, 0.025, 0.02), darkAccent, -0.06, 1.76, 0.12);
    mesh(new THREE.BoxGeometry(0.04, 0.025, 0.02), darkAccent,  0.06, 1.76, 0.12);
    // 입 (어두운 가로 띠)
    mesh(new THREE.BoxGeometry(0.07, 0.012, 0.015), darkAccent, 0, 1.68, 0.122);

    // 헬멧 (M1 스타일)
    const helmetGeo = new THREE.SphereGeometry(0.18, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52);
    mesh(helmetGeo, helmetMat, 0, 1.82, 0);
    // 헬멧 챙 — 앞쪽으로 더 돌출시켜 방향 명확히
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.025, 0.10), helmetMat);
    brim.position.set(0, 1.685, 0.13);
    brim.castShadow = true;
    g.add(brim);
    // 헬멧 띠 (정면 가로띠 — 어둠 강조)
    mesh(new THREE.BoxGeometry(0.36, 0.025, 0.025), darkAccent, 0, 1.71, 0.14);

    // ── 허리 (벨트 + 버클) ────────────────────────────────────────────────
    mesh(new THREE.BoxGeometry(0.46, 0.06, 0.28), beltMat, 0, 0.90, 0);
    // 버클 (정면 중앙) — 금속 광택
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.06, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0x9a8a40, roughness: 0.3, metalness: 0.85,
        emissive: new THREE.Color(0x2a2010), emissiveIntensity: 1.4,
      }),
    );
    buckle.position.set(0, 0.90, 0.145);
    buckle.castShadow = true;
    g.add(buckle);
    // 탄창 파우치 (왼쪽 허리, 정면 쪽)
    mesh(new THREE.BoxGeometry(0.08, 0.10, 0.07), beltMat, -0.18, 0.87, 0.13);
    mesh(new THREE.BoxGeometry(0.08, 0.10, 0.07), beltMat, -0.10, 0.87, 0.13);

    // ── 하체 ──────────────────────────────────────────────────────────────
    for (const x of [-0.13, 0.13]) {
      mesh(new THREE.BoxGeometry(0.17, 0.40, 0.20), uniformMat, x, 0.65, 0);
      mesh(new THREE.BoxGeometry(0.15, 0.38, 0.18), uniformMat, x, 0.26, 0);
      // 군화 — 앞쪽으로 더 길게 (발끝이 정면 방향)
      mesh(new THREE.BoxGeometry(0.16, 0.16, 0.32), bootMat, x, 0.08, 0.05);
    }

    // ── 팔 ────────────────────────────────────────────────────────────────
    // 왼팔
    mesh(new THREE.BoxGeometry(0.13, 0.36, 0.15), uniformMat, -0.29, 1.22, 0);
    mesh(new THREE.BoxGeometry(0.11, 0.28, 0.13), uniformMat, -0.30, 0.90, 0.06);
    // 오른팔 — 소총 잡는 자세 (앞으로)
    mesh(new THREE.BoxGeometry(0.13, 0.36, 0.15), uniformMat, 0.28, 1.20, 0.06);
    mesh(new THREE.BoxGeometry(0.11, 0.28, 0.13), uniformMat, 0.27, 0.90, 0.16);

    // 어깨 견장 (정면 좌우 어깨 위)
    mesh(new THREE.BoxGeometry(0.12, 0.025, 0.13), insigniaMat, -0.27, 1.43, 0.02);
    mesh(new THREE.BoxGeometry(0.12, 0.025, 0.13), insigniaMat,  0.27, 1.43, 0.02);

    // ── M16 소총 — 정면 쪽으로 더 돌출 ────────────────────────────────────
    mesh(new THREE.BoxGeometry(0.04, 0.07, 0.22), woodMat, 0.32, 1.05, -0.10);
    mesh(new THREE.BoxGeometry(0.04, 0.07, 0.30), rifleMat, 0.32, 1.08, 0.16);
    mesh(new THREE.BoxGeometry(0.03, 0.14, 0.06), rifleMat, 0.32, 0.98, 0.18);
    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8);
    const barrel = new THREE.Mesh(barrelGeo, rifleMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.32, 1.09, 0.54);
    barrel.castShadow = true;
    g.add(barrel);
    // 가늠쇠 (총구 위 — 정면 방향 강조)
    mesh(new THREE.BoxGeometry(0.015, 0.025, 0.015), rifleMat, 0.32, 1.11, 0.78);

    void troop;
    return g;
  }

  dispose(): void {
    for (const group of this.troopMeshes.values()) this.scene.remove(group);
    this.troopMeshes.clear();
  }
}
