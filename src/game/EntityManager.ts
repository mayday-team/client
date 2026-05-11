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

      // Tint body red when attacking
      const isHostile = HOSTILE_STATES.has(troop.state);
      const body = group.getObjectByName("body") as THREE.Mesh | undefined;
      if (body) {
        (body.material as THREE.MeshLambertMaterial).color.set(
          isHostile ? 0xaa2200 : 0x556644,
        );
      }
    }
  }

  /** @deprecated kept for compat — use updateTroops */
  updateEnemies(_: unknown[]): void {}
  updateCivilians(_: unknown[]): void {}
  updateHelicopter(_: unknown): void {}

  private createTroopMesh(troop: TroopSnapshot): THREE.Group {
    const g = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    const headMat = new THREE.MeshLambertMaterial({ color: 0xc8a882 });
    const helmetMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x222211 });

    // Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.28), bodyMat);
    body.name = "body";
    body.position.y = 1.05;
    body.castShadow = true;
    g.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), headMat);
    head.position.y = 1.62;
    head.castShadow = true;
    g.add(head);

    // Helmet
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
      helmetMat,
    );
    helmet.position.y = 1.72;
    g.add(helmet);

    // Legs
    for (const x of [-0.12, 0.12]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.2), bodyMat);
      leg.position.set(x, 0.47, 0);
      leg.castShadow = true;
      g.add(leg);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), bootMat);
      boot.position.set(x, 0.14, 0.03);
      g.add(boot);
    }

    // Arms
    for (const x of [-0.34, 0.34]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.18), bodyMat);
      arm.position.set(x, 1.0, 0);
      g.add(arm);
    }

    // Rifle (right side)
    const rifle = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x222222 }),
    );
    rifle.position.set(0.38, 1.0, 0.3);
    g.add(rifle);

    void troop; // suppress unused warning
    return g;
  }

  dispose(): void {
    for (const group of this.troopMeshes.values()) this.scene.remove(group);
    this.troopMeshes.clear();
  }
}
