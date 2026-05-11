import * as THREE from "three";
import { MapBuilder } from "./MapBuilder";

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  // 뷰모델(손/총) 전용 별도 씬 + 카메라
  readonly viewmodelScene: THREE.Scene;
  private readonly viewmodelCam: THREE.PerspectiveCamera;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    // 1980년 5월 27일 새벽 4시 — 어둡지만 표적은 읽히는 정도
    this.scene.background = new THREE.Color(0x100d0a);
    this.scene.fog = new THREE.Fog(0x100d0a, 32, 115);

    const aspect = window.innerWidth / window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500);
    // 2층 내부, 광장을 향해 (1층 천장 5.3 + 눈높이 1.7 = 7.0)
    this.camera.position.set(0, 7.0, -36);
    this.camera.rotation.order = 'YXZ'; // PointerLockControls 호환
    this.camera.rotation.y = Math.PI;

    // 뷰모델 씬: 손·총만 존재, depth 분리 렌더링
    this.viewmodelScene = new THREE.Scene();
    this.viewmodelCam = new THREE.PerspectiveCamera(65, aspect, 0.005, 5);
    // 뷰모델 조명 (랜턴 빛 느낌)
    this.viewmodelScene.add(new THREE.AmbientLight(0xff7733, 0.6));
    this.viewmodelScene.add(new THREE.PointLight(0xff6622, 2.5, 3));

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.autoClear = false; // 수동 clear 제어

    this.buildLights();
    this.buildGround();
    new MapBuilder(this.scene);

    window.addEventListener("resize", this.onResize);
  }

  private buildLights(): void {
    // 희미한 주변광 — 새벽 어둠, 화재 빛이 간접적으로 반사되는 수준
    const ambient = new THREE.AmbientLight(0x2c2118, 0.42);
    const skyFill = new THREE.HemisphereLight(0x2f3a55, 0x2a1a10, 0.55);

    // 차갑고 희미한 달빛
    const moon = new THREE.DirectionalLight(0xd0d4ff, 0.22);
    moon.position.set(-20, 60, -30);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.near = 0.5;
    moon.shadow.camera.far = 200;
    moon.shadow.camera.left = -60;
    moon.shadow.camera.right = 60;
    moon.shadow.camera.top = 60;
    moon.shadow.camera.bottom = -60;

    // 원거리 화재 — 도시 전체가 타오르는 빛의 반사
    const distantFire = new THREE.PointLight(0xff3a10, 0.65, 240);
    distantFire.position.set(40, 15, 60);

    this.scene.add(ambient, skyFill, moon, distantFire);
  }

  private buildGround(): void {
    const geo = new THREE.PlaneGeometry(200, 200, 40, 40);
    // 재와 먼지로 덮인 어두운 땅
    const mat = new THREE.MeshLambertMaterial({
      color: 0x27231c,
      emissive: new THREE.Color(0x0b0704),
      emissiveIntensity: 0.45,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private onResize = (): void => {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.viewmodelCam.aspect = aspect;
    this.viewmodelCam.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  render(): void {
    // 1) 메인 씬 렌더
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // 2) depth buffer 초기화 후 뷰모델 씬 렌더 (항상 화면 위에 고정)
    // 뷰모델 카메라는 identity 회전 유지 → 총이 화면에 고정됨
    this.renderer.clearDepth();
    this.renderer.render(this.viewmodelScene, this.viewmodelCam);
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
  }
}
