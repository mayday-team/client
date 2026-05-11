import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { MapBuilder } from "./MapBuilder";
import { makeNoiseTexture } from "./textures";

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  readonly viewmodelScene: THREE.Scene;
  private readonly viewmodelCam: THREE.PerspectiveCamera;

  private composer!: EffectComposer;
  private renderWidth = 0;
  private renderHeight = 0;
  private mapBuilder!: MapBuilder;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e0b09);
    this.scene.fog = new THREE.FogExp2(0x110d0a, 0.0185);

    const aspect = window.innerWidth / window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500);
    this.camera.position.set(0, 7.0, -36);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = Math.PI;

    this.viewmodelScene = new THREE.Scene();
    this.viewmodelCam = new THREE.PerspectiveCamera(65, aspect, 0.005, 5);
    this.viewmodelScene.add(new THREE.AmbientLight(0xff7733, 0.6));
    this.viewmodelScene.add(new THREE.PointLight(0xff6622, 2.5, 3));

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,            // 내장 MSAA로 안티앨리어싱 처리 (SMAA보다 가벼움)
      powerPreference: "high-performance",
      stencil: false,
    });

    // 픽셀비 캡 — 4K/레티나 디스플레이에서 GPU 폭주 방지
    // 1.5 면 충분히 선명하면서 픽셀 수는 devicePixelRatio=2 대비 절반 이하
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.autoClear = false;

    this.buildLights();
    this.buildGround();
    this.mapBuilder = new MapBuilder(this.scene);

    this.setupPostProcessing();
    this.clock.start();

    window.addEventListener("resize", this.onResize);
  }

  private setupPostProcessing(): void {
    // 블룸 전용 저해상도 타깃 — 블러 효과라 풀해상도가 필요 없음
    // 화면 픽셀의 절반 크기로 렌더해서 비용 1/4로 절감
    this.renderWidth = window.innerWidth;
    this.renderHeight = window.innerHeight;
    const bloomW = Math.floor(this.renderWidth * 0.5);
    const bloomH = Math.floor(this.renderHeight * 0.5);

    this.composer = new EffectComposer(this.renderer);
    // 컴포저는 픽셀비 1로 — 블룸 패스가 곱연산되면 비용 폭주
    this.composer.setPixelRatio(1);
    this.composer.setSize(this.renderWidth, this.renderHeight);

    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // 부드러운 블룸 — 화염·랜턴의 발광만 잡고, 일반 표면엔 영향 최소화
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(bloomW, bloomH),
      0.55, // strength
      0.9,  // radius
      0.85, // threshold — 이 밝기 이상만 블룸
    );
    this.composer.addPass(bloom);

    this.composer.addPass(new OutputPass());
  }

  private buildLights(): void {
    const ambient = new THREE.AmbientLight(0x2c2118, 0.40);
    const skyFill = new THREE.HemisphereLight(0x2f3a55, 0x2a1a10, 0.52);

    const moon = new THREE.DirectionalLight(0xd0d4ff, 0.28);
    moon.position.set(-20, 60, -30);
    moon.castShadow = true;
    // 그림자 해상도 2048 — 4096은 GPU·VRAM에 부담, 2048도 충분히 부드러움
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.near = 0.5;
    moon.shadow.camera.far = 200;
    moon.shadow.camera.left = -60;
    moon.shadow.camera.right = 60;
    moon.shadow.camera.top = 60;
    moon.shadow.camera.bottom = -60;
    moon.shadow.bias = -0.0005;
    moon.shadow.normalBias = 0.04;
    moon.shadow.radius = 2.5;

    const distantFire = new THREE.PointLight(0xff3a10, 0.70, 240);
    distantFire.position.set(40, 15, 60);

    this.scene.add(ambient, skyFill, moon, distantFire);
  }

  private buildGround(): void {
    const geo = new THREE.PlaneGeometry(200, 200, 40, 40);

    const tex = makeNoiseTexture(512, "ash");
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    tex.anisotropy = 4;

    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2620,
      map: tex,
      roughness: 0.95,
      metalness: 0.02,
      emissive: new THREE.Color(0x0b0704),
      emissiveIntensity: 0.32,
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
    this.renderWidth = window.innerWidth;
    this.renderHeight = window.innerHeight;
    this.composer.setSize(this.renderWidth, this.renderHeight);
  };

  render(): void {
    // 불꽃 깜박임 애니메이션
    this.mapBuilder.flickerFires(this.clock.getElapsedTime());

    this.renderer.clear();
    this.composer.render();
    this.renderer.clearDepth();
    this.renderer.render(this.viewmodelScene, this.viewmodelCam);
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.composer.dispose();
    this.renderer.dispose();
  }
}
