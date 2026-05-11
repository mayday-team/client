import * as THREE from "three";
import { MapBuilder } from "./MapBuilder";

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8bb0d4);
    this.scene.fog = new THREE.Fog(0x8bb0d4, 30, 150);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      500,
    );
    // Inside the building, facing the plaza through the windows
    this.camera.position.set(0, 1.7, -36);
    this.camera.rotation.y = Math.PI;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this.buildLights();
    this.buildGround();
    new MapBuilder(this.scene);

    window.addEventListener("resize", this.onResize);
  }

  private buildLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sun.position.set(20, 40, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;

    this.scene.add(ambient, sun);
  }

  private buildGround(): void {
    const geo = new THREE.PlaneGeometry(200, 200, 40, 40);
    const mat = new THREE.MeshLambertMaterial({ color: 0x4a5c3a });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    (grid.material as THREE.LineBasicMaterial).opacity = 0.08;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    this.scene.add(grid);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
  }
}
