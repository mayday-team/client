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

    // ── 상체 (몸통) ─────────────────────────────────────────────────────────
    const body = mesh(new THREE.BoxGeometry(0.44, 0.62, 0.26), uniformMat, 0, 1.21, 0);
    body.name = "body";

    // 목 (짧게)
    mesh(new THREE.BoxGeometry(0.14, 0.10, 0.14), skinMat, 0, 1.57, 0);

    // ── 머리 ──────────────────────────────────────────────────────────────
    mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), skinMat, 0, 1.73, 0);

    // 헬멧 (M1 스타일 — 납작한 반원 형태)
    const helmetGeo = new THREE.SphereGeometry(0.18, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.52);
    mesh(helmetGeo, helmetMat, 0, 1.82, 0);
    // 헬멧 챙 (앞뒤로 약간 넓게)
    mesh(new THREE.BoxGeometry(0.38, 0.03, 0.42), helmetMat, 0, 1.68, 0.02);

    // ── 허리 (벨트 + 탄통) ────────────────────────────────────────────────
    mesh(new THREE.BoxGeometry(0.46, 0.06, 0.28), beltMat, 0, 0.90, 0);
    // 탄창 파우치 (왼쪽 허리)
    mesh(new THREE.BoxGeometry(0.08, 0.10, 0.07), beltMat, -0.18, 0.87, 0.12);
    mesh(new THREE.BoxGeometry(0.08, 0.10, 0.07), beltMat, -0.10, 0.87, 0.12);

    // ── 하체 (바지 — 상하 두 파트) ────────────────────────────────────────
    for (const x of [-0.13, 0.13]) {
      // 허벅지
      mesh(new THREE.BoxGeometry(0.17, 0.40, 0.20), uniformMat, x, 0.65, 0);
      // 종아리
      mesh(new THREE.BoxGeometry(0.15, 0.38, 0.18), uniformMat, x, 0.26, 0);
      // 군화 (발목 부분)
      mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), bootMat, x, 0.08, 0.03);
    }

    // ── 팔 ────────────────────────────────────────────────────────────────
    // 왼팔 — 몸통 옆에 붙어있게
    mesh(new THREE.BoxGeometry(0.13, 0.36, 0.15), uniformMat, -0.29, 1.22, 0);
    mesh(new THREE.BoxGeometry(0.11, 0.28, 0.13), uniformMat, -0.30, 0.90, 0.06);
    // 오른팔 — 소총 방향으로 앞으로 내밀기
    mesh(new THREE.BoxGeometry(0.13, 0.36, 0.15), uniformMat, 0.28, 1.20, 0.04);
    mesh(new THREE.BoxGeometry(0.11, 0.28, 0.13), uniformMat, 0.27, 0.90, 0.12);

    // ── M16 소총 ──────────────────────────────────────────────────────────
    // 개머리판 (목재)
    mesh(new THREE.BoxGeometry(0.04, 0.07, 0.22), woodMat, 0.32, 1.05, -0.18);
    // 리시버
    mesh(new THREE.BoxGeometry(0.04, 0.07, 0.30), rifleMat, 0.32, 1.08, 0.08);
    // 탄창
    mesh(new THREE.BoxGeometry(0.03, 0.14, 0.06), rifleMat, 0.32, 0.98, 0.10);
    // 총열
    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.52, 6);
    const barrel = new THREE.Mesh(barrelGeo, rifleMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.32, 1.09, 0.44);
    barrel.castShadow = true;
    g.add(barrel);

    void troop;
    return g;
  }

  dispose(): void {
    for (const group of this.troopMeshes.values()) this.scene.remove(group);
    this.troopMeshes.clear();
  }
}
