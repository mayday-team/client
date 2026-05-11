import * as THREE from "three";

interface Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

const GEO = new THREE.SphereGeometry(0.06, 4, 4);
const MAT = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
const TRACER_MAT = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.6 });
const SPEED = 80;
const MAX_LIFE = 1.5;

export class BulletManager {
  private bullets: Bullet[] = [];
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
  }

  dispose(): void {
    for (const b of this.bullets) this.scene.remove(b.mesh);
    this.bullets = [];
  }
}
