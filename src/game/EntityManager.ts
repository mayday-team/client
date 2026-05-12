import * as THREE from "three";
import type { TroopSnapshot } from "../types/game";

interface TroopState {
  group: THREE.Group;
  lastHp: number;
  hitFlash: number;      // 0~1, 피격 직후 빨강 플래시
}

interface DyingTroop {
  group: THREE.Group;
  age: number;
  duration: number;
  materials: THREE.MeshStandardMaterial[];
  originalColors: THREE.Color[];
}

const FADE_DURATION = 0.7;     // 사망 페이드 지속
const HIT_FLASH_DECAY = 4.5;   // 초당 감소율 (1 → 0)

export class EntityManager {
  private troops = new Map<string, TroopState>();
  private dying: DyingTroop[] = [];

  constructor(private scene: THREE.Scene) {
    window.addEventListener("troop:hit", (e) => {
      const id = (e as CustomEvent<{ id: string }>).detail.id;
      const state = this.troops.get(id);
      if (state) state.hitFlash = 1.0;
    });
  }

  updateTroops(snapshots: TroopSnapshot[]): void {
    const activeIds = new Set(snapshots.map((t) => t.id));

    // 사라진 ID는 죽음 처리 (페이드아웃 시작)
    for (const [id, state] of this.troops) {
      if (!activeIds.has(id)) {
        this.beginDeath(state.group);
        this.troops.delete(id);
      }
    }

    for (const troop of snapshots) {
      if (!troop.is_alive) {
        const existing = this.troops.get(troop.id);
        if (existing) {
          this.beginDeath(existing.group);
          this.troops.delete(troop.id);
        }
        continue;
      }

      let state = this.troops.get(troop.id);
      if (!state) {
        const group = this.createTroopMesh();
        this.scene.add(group);
        state = { group, lastHp: troop.hp, hitFlash: 0 };
        this.troops.set(troop.id, state);
      }

      state.group.position.set(troop.position.x, troop.position.y, troop.position.z);
      state.group.rotation.y = troop.yaw;

      // HP 감소 감지 → 피격 플래시
      if (troop.hp < state.lastHp) {
        state.hitFlash = 1.0;
      }
      state.lastHp = troop.hp;
    }
  }

  // 매 프레임 호출 — 피격 플래시 감쇠 + 사망 페이드아웃
  tick(delta: number): void {
    // 피격 플래시 적용
    for (const state of this.troops.values()) {
      if (state.hitFlash > 0) {
        state.hitFlash = Math.max(0, state.hitFlash - delta * HIT_FLASH_DECAY);
        this.applyHitTint(state.group, state.hitFlash);
      }
    }

    // 사망 페이드아웃
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const d = this.dying[i];
      d.age += delta;
      const t = Math.min(1, d.age / d.duration);
      // 빨강으로 밀고 알파 감소 + 살짝 가라앉음
      const redMix = Math.min(1, t * 1.8);
      const alpha = 1 - t;
      for (let mi = 0; mi < d.materials.length; mi++) {
        const m = d.materials[mi];
        const orig = d.originalColors[mi];
        m.color.copy(orig).lerp(new THREE.Color(0xaa1010), redMix);
        m.emissive.set(0x441010);
        m.emissiveIntensity = 2.0 + t * 2.5;
        m.opacity = alpha;
      }
      d.group.position.y -= delta * 0.25; // 천천히 가라앉음
      if (t >= 1) {
        this.scene.remove(d.group);
        this.dying.splice(i, 1);
      }
    }
  }

  private beginDeath(group: THREE.Group): void {
    // 모든 머티리얼 수집 + 원래 색 저장 + 투명 설정
    const materials: THREE.MeshStandardMaterial[] = [];
    const originalColors: THREE.Color[] = [];
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const m = obj.material as THREE.MeshStandardMaterial;
        m.transparent = true;
        m.depthWrite = true;
        materials.push(m);
        originalColors.push(m.color.clone());
      }
    });
    this.dying.push({
      group,
      age: 0,
      duration: FADE_DURATION,
      materials,
      originalColors,
    });
  }

  // 피격 플래시: 빨강 강조 + 발광 강화 (몸통 머티리얼만)
  private applyHitTint(group: THREE.Group, intensity: number): void {
    const body = group.getObjectByName("body") as THREE.Mesh | undefined;
    if (!body) return;
    const mat = body.material as THREE.MeshStandardMaterial;
    // 평소 색에서 빨강으로 보간
    const baseColor = new THREE.Color(0x4a5238);
    mat.color.copy(baseColor).lerp(new THREE.Color(0xff2010), intensity);
    mat.emissive.set(0x6a1808);
    mat.emissiveIntensity = 1.9 + intensity * 3.5;
  }

  /** @deprecated */
  updateEnemies(_: unknown[]): void {}
  updateCivilians(_: unknown[]): void {}
  updateHelicopter(_: unknown): void {}

  // ── 군인 모델 ──────────────────────────────────────────────────────────────

  private createTroopMesh(): THREE.Group {
    const g = new THREE.Group();

    // 1980년 한국 계엄군 군복 — 평시 녹색 위장
    const uniformMat = new THREE.MeshStandardMaterial({
      color: 0x4a5238, roughness: 0.85, metalness: 0.02,
      emissive: new THREE.Color(0x1e2214), emissiveIntensity: 1.9,
    });
    const helmetMat  = new THREE.MeshStandardMaterial({
      color: 0x333d25, roughness: 0.45, metalness: 0.55,
      emissive: new THREE.Color(0x141a0e), emissiveIntensity: 1.9,
    });
    const skinMat    = new THREE.MeshStandardMaterial({
      color: 0xc8a070, roughness: 0.75, metalness: 0,
      emissive: new THREE.Color(0x5a3a18), emissiveIntensity: 1.4,
    });
    const bootMat    = new THREE.MeshStandardMaterial({
      color: 0x1a1410, roughness: 0.55, metalness: 0.1,
      emissive: new THREE.Color(0x0a0806), emissiveIntensity: 1.3,
    });
    const beltMat    = new THREE.MeshStandardMaterial({
      color: 0x3a3020, roughness: 0.6, metalness: 0.1,
      emissive: new THREE.Color(0x141008), emissiveIntensity: 1.4,
    });
    const rifleMat   = new THREE.MeshStandardMaterial({
      color: 0x1e1e18, roughness: 0.35, metalness: 0.75,
      emissive: new THREE.Color(0x0c0c08), emissiveIntensity: 1.4,
    });
    const woodMat    = new THREE.MeshStandardMaterial({
      color: 0x3c2210, roughness: 0.85, metalness: 0.04,
      emissive: new THREE.Color(0x180e06), emissiveIntensity: 1.4,
    });
    const darkAccent = new THREE.MeshStandardMaterial({
      color: 0x0a0a08, roughness: 0.6, metalness: 0.2,
      emissive: new THREE.Color(0x040402), emissiveIntensity: 1.5,
    });
    const insigniaMat = new THREE.MeshStandardMaterial({
      color: 0x8a7440, roughness: 0.7, metalness: 0.3,
      emissive: new THREE.Color(0x2a2010), emissiveIntensity: 1.6,
    });
    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0x9a8a40, roughness: 0.3, metalness: 0.85,
      emissive: new THREE.Color(0x2a2010), emissiveIntensity: 1.4,
    });
    const packMat = new THREE.MeshStandardMaterial({
      color: 0x3a3422, roughness: 0.85, metalness: 0.05,
      emissive: new THREE.Color(0x141008), emissiveIntensity: 1.5,
    });
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x2a2418, roughness: 0.7, metalness: 0.05,
      emissive: new THREE.Color(0x0a0806), emissiveIntensity: 1.3,
    });

    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x=0, y=0, z=0): THREE.Mesh => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };

    // ── 상체 (몸통) ─────────────────────────────────────────────────────────
    const body = mesh(new THREE.BoxGeometry(0.44, 0.62, 0.28), uniformMat, 0, 1.21, 0);
    body.name = "body";

    // X자 멜빵 (양 어깨에서 허리 버클로) — 정면 식별 핵심
    const strapL = mesh(new THREE.BoxGeometry(0.045, 0.55, 0.025), strapMat, -0.10, 1.16, 0.14);
    strapL.rotation.z = 0.18;
    const strapR = mesh(new THREE.BoxGeometry(0.045, 0.55, 0.025), strapMat,  0.10, 1.16, 0.14);
    strapR.rotation.z = -0.18;

    // 가슴 휘장
    mesh(new THREE.BoxGeometry(0.11, 0.05, 0.022), insigniaMat, -0.13, 1.38, 0.145);
    // 계급장 (오른쪽 가슴)
    mesh(new THREE.BoxGeometry(0.06, 0.035, 0.022), insigniaMat, 0.13, 1.40, 0.145);

    // 군복 단추 줄
    for (const y of [1.40, 1.28, 1.16, 1.04]) {
      mesh(new THREE.BoxGeometry(0.025, 0.025, 0.025), darkAccent, 0, y, 0.145);
    }
    // 가슴 주머니 (좌우)
    mesh(new THREE.BoxGeometry(0.13, 0.10, 0.018), uniformMat, -0.12, 1.30, 0.148);
    mesh(new THREE.BoxGeometry(0.13, 0.10, 0.018), uniformMat,  0.12, 1.30, 0.148);
    // 주머니 덮개 윗선
    mesh(new THREE.BoxGeometry(0.13, 0.012, 0.020), darkAccent, -0.12, 1.36, 0.149);
    mesh(new THREE.BoxGeometry(0.13, 0.012, 0.020), darkAccent,  0.12, 1.36, 0.149);

    // ── 배낭 (등) ──────────────────────────────────────────────────────────
    const pack = mesh(new THREE.BoxGeometry(0.36, 0.42, 0.18), packMat, 0, 1.22, -0.20);
    pack.castShadow = true;
    // 배낭 끈 (위)
    mesh(new THREE.BoxGeometry(0.04, 0.04, 0.10), strapMat, -0.12, 1.44, -0.13);
    mesh(new THREE.BoxGeometry(0.04, 0.04, 0.10), strapMat,  0.12, 1.44, -0.13);
    // 수통 (배낭 옆)
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 8), darkAccent, -0.21, 1.05, -0.18);

    // 목
    mesh(new THREE.BoxGeometry(0.14, 0.10, 0.14), skinMat, 0, 1.57, 0);

    // ── 머리 ──────────────────────────────────────────────────────────────
    mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), skinMat, 0, 1.73, 0);

    // 눈 두 개
    mesh(new THREE.BoxGeometry(0.04, 0.025, 0.02), darkAccent, -0.06, 1.76, 0.122);
    mesh(new THREE.BoxGeometry(0.04, 0.025, 0.02), darkAccent,  0.06, 1.76, 0.122);
    // 눈썹 (눈 위 짙은 띠)
    mesh(new THREE.BoxGeometry(0.05, 0.012, 0.018), darkAccent, -0.06, 1.79, 0.121);
    mesh(new THREE.BoxGeometry(0.05, 0.012, 0.018), darkAccent,  0.06, 1.79, 0.121);
    // 입
    mesh(new THREE.BoxGeometry(0.07, 0.012, 0.015), darkAccent, 0, 1.68, 0.122);
    // 코 (살짝 돌출)
    mesh(new THREE.BoxGeometry(0.025, 0.045, 0.025), skinMat, 0, 1.72, 0.13);

    // 헬멧
    const helmetGeo = new THREE.SphereGeometry(0.18, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52);
    mesh(helmetGeo, helmetMat, 0, 1.82, 0);
    // 헬멧 챙 — 앞쪽 돌출
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.025, 0.10), helmetMat);
    brim.position.set(0, 1.685, 0.13);
    brim.castShadow = true;
    g.add(brim);
    // 헬멧 띠 (정면 가로띠)
    mesh(new THREE.BoxGeometry(0.36, 0.025, 0.025), darkAccent, 0, 1.71, 0.14);
    // 헬멧 네트 패턴 (위·옆 작은 강조)
    for (const [hx, hy, hz] of [[-0.12, 1.92, 0.05], [0.12, 1.92, 0.05], [0, 1.95, -0.08], [-0.08, 1.88, 0.12], [0.08, 1.88, 0.12]] as const) {
      mesh(new THREE.BoxGeometry(0.025, 0.012, 0.025), darkAccent, hx, hy, hz);
    }
    // 턱끈
    mesh(new THREE.BoxGeometry(0.022, 0.13, 0.022), strapMat, -0.11, 1.66, 0.05);
    mesh(new THREE.BoxGeometry(0.022, 0.13, 0.022), strapMat,  0.11, 1.66, 0.05);

    // ── 허리 + 버클 ──────────────────────────────────────────────────────
    mesh(new THREE.BoxGeometry(0.46, 0.06, 0.28), beltMat, 0, 0.90, 0);
    // 버클 (정면) — 금속
    const buckle = mesh(new THREE.BoxGeometry(0.08, 0.07, 0.025), buckleMat, 0, 0.90, 0.148);
    buckle.castShadow = true;
    // 탄창 파우치 3개 (좌측)
    mesh(new THREE.BoxGeometry(0.07, 0.11, 0.07), beltMat, -0.22, 0.86, 0.13);
    mesh(new THREE.BoxGeometry(0.07, 0.11, 0.07), beltMat, -0.13, 0.86, 0.14);
    // 수류탄 (우측 허리)
    const grenadeBody = mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.08, 8), darkAccent, 0.18, 0.86, 0.13);
    grenadeBody.castShadow = true;
    // 수류탄 핀
    mesh(new THREE.BoxGeometry(0.025, 0.025, 0.012), buckleMat, 0.18, 0.92, 0.13);
    // 칼집 (좌측 허벅지)
    mesh(new THREE.BoxGeometry(0.05, 0.18, 0.025), darkAccent, -0.20, 0.75, 0.10);

    // ── 하체 ──────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const x = side * 0.13;
      // 허벅지
      mesh(new THREE.BoxGeometry(0.17, 0.40, 0.20), uniformMat, x, 0.65, 0);
      // 무릎 패드 (어두운 작은 박스)
      mesh(new THREE.BoxGeometry(0.16, 0.06, 0.022), darkAccent, x, 0.46, 0.10);
      // 종아리
      mesh(new THREE.BoxGeometry(0.15, 0.38, 0.18), uniformMat, x, 0.26, 0);
      // 군화
      mesh(new THREE.BoxGeometry(0.16, 0.16, 0.34), bootMat, x, 0.08, 0.06);
      // 군화 끈 (가로 줄 3개)
      for (const ly of [0.13, 0.10, 0.07]) {
        mesh(new THREE.BoxGeometry(0.165, 0.012, 0.025), darkAccent, x, ly, 0.18);
      }
    }

    // ── 팔 ────────────────────────────────────────────────────────────────
    // 왼팔 (몸 옆)
    mesh(new THREE.BoxGeometry(0.13, 0.36, 0.15), uniformMat, -0.29, 1.22, 0);
    mesh(new THREE.BoxGeometry(0.11, 0.28, 0.13), uniformMat, -0.30, 0.90, 0.06);
    // 왼손 (스킨)
    mesh(new THREE.BoxGeometry(0.10, 0.10, 0.10), skinMat, -0.30, 0.72, 0.10);
    // 손목 시계
    mesh(new THREE.BoxGeometry(0.10, 0.025, 0.10), darkAccent, -0.30, 0.78, 0.10);

    // 오른팔 (소총 잡는 자세 — 앞으로)
    mesh(new THREE.BoxGeometry(0.13, 0.36, 0.15), uniformMat, 0.28, 1.20, 0.06);
    mesh(new THREE.BoxGeometry(0.11, 0.28, 0.13), uniformMat, 0.27, 0.90, 0.16);
    // 오른손 (소총 잡음)
    mesh(new THREE.BoxGeometry(0.10, 0.10, 0.10), skinMat, 0.30, 0.85, 0.32);

    // 어깨 견장
    mesh(new THREE.BoxGeometry(0.12, 0.025, 0.13), insigniaMat, -0.27, 1.43, 0.02);
    mesh(new THREE.BoxGeometry(0.12, 0.025, 0.13), insigniaMat,  0.27, 1.43, 0.02);

    // ── M16 소총 ─────────────────────────────────────────────────────────
    // 개머리판
    mesh(new THREE.BoxGeometry(0.045, 0.08, 0.24), woodMat, 0.32, 1.05, -0.10);
    // 개머리판 어깨 패드
    mesh(new THREE.BoxGeometry(0.05, 0.10, 0.04), darkAccent, 0.32, 1.05, -0.23);
    // 리시버
    mesh(new THREE.BoxGeometry(0.045, 0.08, 0.32), rifleMat, 0.32, 1.08, 0.18);
    // 손잡이 (피스톨 그립)
    mesh(new THREE.BoxGeometry(0.04, 0.10, 0.04), rifleMat, 0.32, 1.00, 0.06);
    // 탄창
    mesh(new THREE.BoxGeometry(0.035, 0.16, 0.07), rifleMat, 0.32, 0.96, 0.20);
    // 총열
    const barrelGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.58, 10);
    const barrel = new THREE.Mesh(barrelGeo, rifleMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.32, 1.09, 0.58);
    barrel.castShadow = true;
    g.add(barrel);
    // 가늠쇠
    mesh(new THREE.BoxGeometry(0.018, 0.035, 0.018), rifleMat, 0.32, 1.12, 0.82);
    // 가늠자 (리시버 뒤)
    mesh(new THREE.BoxGeometry(0.022, 0.025, 0.015), rifleMat, 0.32, 1.135, 0.20);
    // 멜빵 (총→어깨)
    const sling = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.55, 0.012), strapMat);
    sling.position.set(0.32, 1.05, 0.20);
    sling.rotation.x = 0.6;
    g.add(sling);

    return g;
  }

  dispose(): void {
    for (const state of this.troops.values()) this.scene.remove(state.group);
    for (const d of this.dying) this.scene.remove(d.group);
    this.troops.clear();
    this.dying = [];
  }
}
