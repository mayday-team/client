import * as THREE from "three";

interface EnemyBullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

interface MuzzleFlash {
  light: THREE.PointLight;
  life: number;
}

// 도청 메인 블록 외벽 경계 — 이 안으로 들어온 총알은 제거
const BLDG_MIN = new THREE.Vector3(-13.5, 0,  -47);
const BLDG_MAX = new THREE.Vector3( 13.5, 17, -32);

const ORBIT_RADIUS = 35;
const ORBIT_HEIGHT = 20;
const ORBIT_SPEED = 0.28;
const ORBIT_CENTER = new THREE.Vector3(0, 0, -10);
const FIRE_INTERVAL = 4.0;    // 4초 간격 — 30초 생존 가능
const BULLET_SPEED = 25;       // 느려서 시각적으로 잘 보임
const HIT_RADIUS = 1.0;
const DAMAGE_PER_HIT = 20;

export class HelicopterAI {
  private group = new THREE.Group();
  private mainRotor!: THREE.Group;
  private tailRotor!: THREE.Group;
  private bullets: EnemyBullet[] = [];
  private muzzleFlashes: MuzzleFlash[] = [];
  private spotlight!: THREE.SpotLight;

  onHitPlayer: ((damage: number) => void) | null = null;

  private orbitAngle = 0;
  private fireTimer = 0;

  private readonly bulletGeo = new THREE.SphereGeometry(0.22, 4, 4);
  private readonly bulletMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

  constructor(private scene: THREE.Scene) {
    this.buildMesh();
    this.buildSpotlight();
    scene.add(this.group);

    // Start at orbit position
    this.group.position.set(
      ORBIT_CENTER.x + ORBIT_RADIUS,
      ORBIT_HEIGHT,
      ORBIT_CENTER.z,
    );
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  private buildSpotlight(): void {
    // 서치라이트 — 헬기에서 지상을 훑는 빛
    this.spotlight = new THREE.SpotLight(0xffe8c0, 4.0, 60, 0.28, 0.6);
    this.spotlight.position.set(0, -1.5, 0);
    this.group.add(this.spotlight);

    const target = new THREE.Object3D();
    target.position.set(0, -20, 0);
    this.group.add(target);
    this.spotlight.target = target;

    // 항법등 — 헬기 몸통을 밝혀 어둠 속에서도 식별 가능하게
    const navLight = new THREE.PointLight(0xff4400, 6.0, 25);
    navLight.position.set(0, 0, 0);
    this.group.add(navLight);
  }

  private mesh(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x = 0, y = 0, z = 0,
  ): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    this.group.add(m);
    return m;
  }

  private buildMesh(): void {
    const olive = new THREE.MeshLambertMaterial({ color: 0x3d4a2d, emissive: new THREE.Color(0x1e2616), emissiveIntensity: 2.0 });
    const dark  = new THREE.MeshLambertMaterial({ color: 0x1e2616, emissive: new THREE.Color(0x0e1208), emissiveIntensity: 2.0 });
    const glass = new THREE.MeshLambertMaterial({ color: 0x5a8a9a, transparent: true, opacity: 0.55, emissive: new THREE.Color(0x1a2a30), emissiveIntensity: 1.5 });
    const metal = new THREE.MeshLambertMaterial({ color: 0x555544, emissive: new THREE.Color(0x181814), emissiveIntensity: 2.0 });
    const black = new THREE.MeshLambertMaterial({ color: 0x111111, emissive: new THREE.Color(0x080808), emissiveIntensity: 2.0 });

    // ── Fuselage ────────────────────────────────────────────────────────
    this.mesh(new THREE.BoxGeometry(2.2, 1.4, 5.5), olive, 0, 0, -0.5);

    // ── Cockpit bubble ──────────────────────────────────────────────────
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 8), glass);
    cockpit.scale.set(1.05, 0.85, 1.3);
    cockpit.position.set(0, 0.1, 2.6);
    this.group.add(cockpit);

    // Cockpit frame
    this.mesh(new THREE.BoxGeometry(2.2, 1.4, 0.8), olive, 0, 0, 2.1);

    // ── Tail boom ───────────────────────────────────────────────────────
    this.mesh(new THREE.BoxGeometry(0.8, 0.7, 4.5), olive, 0, -0.1, -4.2);

    // Vertical stabilizer
    this.mesh(new THREE.BoxGeometry(0.14, 1.5, 1.2), dark, 0, 0.6, -6.2);

    // Horizontal stabilizer
    this.mesh(new THREE.BoxGeometry(3.0, 0.12, 0.8), dark, 0, 0.2, -6.0);

    // ── Exhaust ports ───────────────────────────────────────────────────
    for (const x of [-0.85, 0.85]) {
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.6, 6), dark);
      ex.rotation.z = Math.PI / 2;
      ex.position.set(x, 0.85, 0.3);
      this.group.add(ex);
    }

    // ── Chin gun ────────────────────────────────────────────────────────
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 6), black);
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, -0.65, 3.3);
    this.group.add(gunBarrel);

    // Gun housing
    this.mesh(new THREE.BoxGeometry(0.4, 0.35, 0.5), dark, 0, -0.55, 2.6);

    // ── Weapon pylons ───────────────────────────────────────────────────
    for (const x of [-1.5, 1.5]) {
      this.mesh(new THREE.BoxGeometry(0.15, 0.15, 1.2), dark, x, -0.4, 0.2);
      // Rocket pod
      this.mesh(new THREE.BoxGeometry(0.45, 0.35, 0.9), dark, x * 1.35, -0.55, 0.2);
    }

    // ── Main rotor mast ─────────────────────────────────────────────────
    this.mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.7, 8), dark, 0, 0.85, 0.2);

    // ── Main rotor (spinning) ───────────────────────────────────────────
    this.mainRotor = new THREE.Group();
    this.mainRotor.position.set(0, 1.3, 0.2);

    for (let i = 0; i < 2; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(9.5, 0.07, 0.55),
        black,
      );
      blade.rotation.y = i * (Math.PI / 2);
      this.mainRotor.add(blade);
    }
    this.group.add(this.mainRotor);

    // ── Tail rotor (spinning) ───────────────────────────────────────────
    this.tailRotor = new THREE.Group();
    this.tailRotor.position.set(0.52, 0.15, -6.2);

    for (let i = 0; i < 2; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 1.9, 0.28),
        black,
      );
      blade.rotation.z = i * (Math.PI / 2);
      this.tailRotor.add(blade);
    }
    this.group.add(this.tailRotor);

    // ── Skids ────────────────────────────────────────────────────────────
    for (const x of [-1.0, 1.0]) {
      this.mesh(new THREE.BoxGeometry(0.1, 0.1, 4.8), metal, x, -1.05, 0);

      // Front strut
      const sf = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), metal);
      sf.rotation.x = 0.18;
      sf.position.set(x, -0.58, 1.5);
      this.group.add(sf);

      // Rear strut
      const sr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), metal);
      sr.rotation.x = -0.18;
      sr.position.set(x, -0.58, -1.5);
      this.group.add(sr);
    }
  }

  update(delta: number, playerPos: THREE.Vector3): void {
    // ── Orbit ────────────────────────────────────────────────────────────
    this.orbitAngle += ORBIT_SPEED * delta;
    this.group.position.set(
      ORBIT_CENTER.x + Math.cos(this.orbitAngle) * ORBIT_RADIUS,
      ORBIT_HEIGHT,
      ORBIT_CENTER.z + Math.sin(this.orbitAngle) * ORBIT_RADIUS,
    );

    // Face travel direction + slight bank
    this.group.rotation.y = -this.orbitAngle - Math.PI / 2;
    this.group.rotation.z = -0.1;

    // ── Rotor spin ───────────────────────────────────────────────────────
    this.mainRotor.rotation.y += 9 * delta;
    this.tailRotor.rotation.z += 14 * delta;

    // ── Fire at player ───────────────────────────────────────────────────
    this.fireTimer += delta;
    if (this.fireTimer >= FIRE_INTERVAL) {
      this.fireTimer = 0;
      this.fireAt(playerPos);
    }

    // ── Update enemy bullets ─────────────────────────────────────────────
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.velocity.y -= 12 * delta; // gravity
      b.mesh.position.addScaledVector(b.velocity, delta);
      b.life -= delta;

      const p = b.mesh.position;
      const hitBuilding =
        p.x > BLDG_MIN.x && p.x < BLDG_MAX.x &&
        p.y > BLDG_MIN.y && p.y < BLDG_MAX.y &&
        p.z > BLDG_MIN.z && p.z < BLDG_MAX.z;

      // 플레이어 히트박스: 노출 상태에서만 피격
      const distToPlayer = p.distanceTo(playerPos);
      const hitPlayer = distToPlayer < HIT_RADIUS && this.isExposed(playerPos);

      if (b.life <= 0 || p.y < 0 || hitBuilding || hitPlayer) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        if (hitPlayer) this.onHitPlayer?.(DAMAGE_PER_HIT);
      }
    }

    // ── Update muzzle flashes ────────────────────────────────────────────
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const f = this.muzzleFlashes[i];
      f.life -= delta;
      if (f.life <= 0) {
        this.scene.remove(f.light);
        this.muzzleFlashes.splice(i, 1);
      }
    }
  }

  // 2층 창문 x 좌표 (MapBuilder WIN_X 와 일치)
  private static readonly WIN_X = [-9, -4.5, 0, 4.5, 9] as const;
  private static readonly WIN_WALL_Z = -33.4; // 전면 내벽 z

  /** 플레이어가 창문 앞에 노출돼 있는지 확인 */
  private isExposed(playerPos: THREE.Vector3): boolean {
    if (playerPos.z < HelicopterAI.WIN_WALL_Z - 1.5) return false; // 벽 뒤 깊숙이
    return HelicopterAI.WIN_X.some(wx => Math.abs(playerPos.x - wx) < 1.3);
  }

  /** 가장 가까운 창문 위치 반환 */
  private nearestWindow(playerPos: THREE.Vector3): THREE.Vector3 {
    let best = HelicopterAI.WIN_X[0] as number;
    let bestDist = Infinity;
    for (const wx of HelicopterAI.WIN_X) {
      const d = Math.abs(playerPos.x - wx);
      if (d < bestDist) { bestDist = d; best = wx; }
    }
    return new THREE.Vector3(best, 7.0, HelicopterAI.WIN_WALL_Z);
  }

  private fireAt(target: THREE.Vector3): void {
    // 엄폐 중이면 가장 가까운 창문으로 사격 (벽에 맞게)
    const aimTarget = this.isExposed(target) ? target : this.nearestWindow(target);

    const origin = this.group.position.clone();
    origin.y -= 0.6;

    const dir = new THREE.Vector3().subVectors(aimTarget, origin).normalize();
    const mesh = new THREE.Mesh(this.bulletGeo, this.bulletMat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.bullets.push({
      mesh,
      velocity: dir.multiplyScalar(BULLET_SPEED),
      life: 4,
    });

    // 총구 화염 플래시
    const flash = new THREE.PointLight(0xff4400, 8.0, 15);
    flash.position.copy(origin);
    this.scene.add(flash);
    this.muzzleFlashes.push({ light: flash, life: 0.08 });
  }

  dispose(): void {
    this.scene.remove(this.group);
    for (const b of this.bullets) this.scene.remove(b.mesh);
    for (const f of this.muzzleFlashes) this.scene.remove(f.light);
    this.bullets = [];
    this.muzzleFlashes = [];
  }
}
