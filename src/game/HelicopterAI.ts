import * as THREE from "three";

interface EnemyBullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

const ORBIT_RADIUS = 50;
const ORBIT_HEIGHT = 30;
const ORBIT_SPEED = 0.22;      // rad/s
const ORBIT_CENTER = new THREE.Vector3(0, 0, -10);
const FIRE_INTERVAL = 3.5;     // seconds between shots
const BULLET_SPEED = 28;

export class HelicopterAI {
  private group = new THREE.Group();
  private mainRotor!: THREE.Group;
  private tailRotor!: THREE.Group;
  private bullets: EnemyBullet[] = [];

  private orbitAngle = 0;
  private fireTimer = 0;

  private readonly bulletGeo = new THREE.SphereGeometry(0.18, 4, 4);
  private readonly bulletMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

  constructor(private scene: THREE.Scene) {
    this.buildMesh();
    scene.add(this.group);

    // Start at orbit position
    this.group.position.set(
      ORBIT_CENTER.x + ORBIT_RADIUS,
      ORBIT_HEIGHT,
      ORBIT_CENTER.z,
    );
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
    const olive = new THREE.MeshLambertMaterial({ color: 0x3d4a2d });
    const dark = new THREE.MeshLambertMaterial({ color: 0x1e2616 });
    const glass = new THREE.MeshLambertMaterial({ color: 0x5a8a9a, transparent: true, opacity: 0.55 });
    const metal = new THREE.MeshLambertMaterial({ color: 0x555544 });
    const black = new THREE.MeshLambertMaterial({ color: 0x111111 });

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

      if (b.life <= 0 || b.mesh.position.y < 0) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }

  private fireAt(target: THREE.Vector3): void {
    const origin = this.group.position.clone();
    origin.y -= 0.6;

    const dir = new THREE.Vector3().subVectors(target, origin).normalize();
    const mesh = new THREE.Mesh(this.bulletGeo, this.bulletMat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.bullets.push({
      mesh,
      velocity: dir.multiplyScalar(BULLET_SPEED),
      life: 4,
    });
  }

  dispose(): void {
    this.scene.remove(this.group);
    for (const b of this.bullets) this.scene.remove(b.mesh);
    this.bullets = [];
  }
}
