import * as THREE from "three";
import type { EnemyState, CivilianState, HelicopterState } from "../types/game";

export class EntityManager {
  private enemyMeshes = new Map<string, THREE.Mesh>();
  private civilianMeshes = new Map<string, THREE.Mesh>();
  private helicopterMesh: THREE.Mesh | null = null;

  constructor(private scene: THREE.Scene) {}

  updateEnemies(enemies: EnemyState[]): void {
    const activeIds = new Set(enemies.map((e) => e.id));

    for (const [id, mesh] of this.enemyMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.enemyMeshes.delete(id);
      }
    }

    for (const enemy of enemies) {
      let mesh = this.enemyMeshes.get(enemy.id);
      if (!mesh) {
        mesh = this.createHumanoidMesh(0xcc2222);
        this.scene.add(mesh);
        this.enemyMeshes.set(enemy.id, mesh);
      }
      mesh.position.set(enemy.position.x, enemy.position.y + 0.9, enemy.position.z);
      mesh.rotation.set(enemy.rotation.x, enemy.rotation.y, enemy.rotation.z);
    }
  }

  updateCivilians(civilians: CivilianState[]): void {
    const activeIds = new Set(civilians.map((c) => c.id));

    for (const [id, mesh] of this.civilianMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.civilianMeshes.delete(id);
      }
    }

    for (const civilian of civilians) {
      let mesh = this.civilianMeshes.get(civilian.id);
      if (!mesh) {
        mesh = this.createHumanoidMesh(0x22aa55);
        this.scene.add(mesh);
        this.civilianMeshes.set(civilian.id, mesh);
      }
      mesh.position.set(civilian.position.x, civilian.position.y + 0.9, civilian.position.z);
      mesh.rotation.set(civilian.rotation.x, civilian.rotation.y, civilian.rotation.z);
    }
  }

  updateHelicopter(state: HelicopterState | undefined): void {
    if (!state) {
      if (this.helicopterMesh) {
        this.scene.remove(this.helicopterMesh);
        this.helicopterMesh = null;
      }
      return;
    }

    if (!this.helicopterMesh) {
      const geo = new THREE.BoxGeometry(4, 1.5, 8);
      const mat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      this.helicopterMesh = new THREE.Mesh(geo, mat);
      this.scene.add(this.helicopterMesh);
    }

    this.helicopterMesh.position.set(state.position.x, state.position.y, state.position.z);
    this.helicopterMesh.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);
  }

  private createHumanoidMesh(color: number): THREE.Mesh {
    const geo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const mat = new THREE.MeshLambertMaterial({ color });
    return new THREE.Mesh(geo, mat);
  }

  dispose(): void {
    for (const mesh of this.enemyMeshes.values()) this.scene.remove(mesh);
    for (const mesh of this.civilianMeshes.values()) this.scene.remove(mesh);
    if (this.helicopterMesh) this.scene.remove(this.helicopterMesh);
    this.enemyMeshes.clear();
    this.civilianMeshes.clear();
    this.helicopterMesh = null;
  }
}
