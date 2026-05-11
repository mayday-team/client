import * as THREE from "three";

interface Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

interface Tracer {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  life: number;
}

const GEO = new THREE.SphereGeometry(0.06, 4, 4);
const MAT = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
const TRACER_MAT = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.6 });
const SPEED = 80;
const MAX_LIFE = 1.5;

export class BulletManager {
  private bullets: Bullet[] = [];
  private tracers: Tracer[] = [];
  private tracerGeo = new THREE.BoxGeometry(0.05, 0.05, 0.6);

  constructor(private scene: THREE.Scene) {}

  shoot(origin: THREE.Vector3, direction: THREE.Vector3): void {
    // Bullet sphere
    const mesh = new THREE.Mesh(GEO, MAT);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    // Tracer line
    const tracer = new THREE.Mesh(this.tracerGeo, TRACER_MAT);
    tracer.position.copy(origin);
    mesh.add(tracer); // child of bullet so it moves with it

    const vel = direction.clone().multiplyScalar(SPEED);
    // Orient tracer along velocity
    tracer.lookAt(origin.clone().add(vel));

    this.bullets.push({ mesh, velocity: vel, life: MAX_LIFE });
  }

  shootHostile(origin: THREE.Vector3, target: THREE.Vector3): void {
    const delta = target.clone().sub(origin);
    const len = delta.length();
    if (len <= 0.01) return;

    const mat = new THREE.MeshBasicMaterial({
      color: 0xff3a16,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, len), mat);
    mesh.position.copy(origin).addScaledVector(delta, 0.5);
    mesh.lookAt(target);
    this.scene.add(mesh);

    this.tracers.push({ mesh, material: mat, life: 0.28 });
  }

  update(delta: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.mesh.position.addScaledVector(b.velocity, delta);
      b.life -= delta;

      if (b.life <= 0 || b.mesh.position.y < -2) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= delta;
      t.material.opacity = Math.max(0, t.life / 0.28);
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        t.material.dispose();
        t.mesh.geometry.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }

  dispose(): void {
    for (const b of this.bullets) this.scene.remove(b.mesh);
    this.bullets = [];
    for (const t of this.tracers) {
      this.scene.remove(t.mesh);
      t.material.dispose();
      t.mesh.geometry.dispose();
    }
    this.tracers = [];
  }
}
