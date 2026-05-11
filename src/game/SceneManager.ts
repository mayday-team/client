import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { MapBuilder } from "./MapBuilder";
import { makeNoiseTexture } from "./textures";

// 하늘 돔 — 천정은 짙은 자줏빛 밤하늘, 지평선은 도시 화재로 인한 주황 광채
const SkyShader = {
  uniforms: {
    uTop:     { value: new THREE.Color(0x0a0a14) },
    uMid:     { value: new THREE.Color(0x1a1208) },
    uHorizon: { value: new THREE.Color(0x4a1a08) }, // 멀리 도시가 타는 빛
    uTime:    { value: 0 },
  },
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uTop;
    uniform vec3 uMid;
    uniform vec3 uHorizon;
    uniform float uTime;
    varying vec3 vWorldPos;

    // 의사난수 — 별·연기 노이즈
    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
    }

    void main() {
      vec3 dir = normalize(vWorldPos);
      // 0=수평선, 1=천정
      float h = clamp(dir.y, 0.0, 1.0);
      // 천정↔중간↔지평선 3단 보간
      vec3 col;
      if (h < 0.35) {
        col = mix(uHorizon, uMid, h / 0.35);
      } else {
        col = mix(uMid, uTop, (h - 0.35) / 0.65);
      }

      // 별 — 위쪽에만, 매우 작은 점 + 깜박임
      if (h > 0.25) {
        vec2 sphereUv = vec2(atan(dir.z, dir.x), dir.y);
        float n = hash(floor(sphereUv * 220.0));
        if (n > 0.997) {
          float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + n * 47.0);
          col += vec3(0.85, 0.88, 1.0) * twinkle * (h - 0.25) * 1.2;
        }
      }

      // 지평선 쪽 화재 글로우 — 정면(+z) 방향에 강조
      float horizonGlow = pow(1.0 - h, 6.0) * smoothstep(-0.3, 1.0, dir.z);
      col += vec3(0.6, 0.18, 0.04) * horizonGlow * 0.55;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

// 비네팅 + 미세 푸른 그림자 강조 — 그레인·색수차 없이 깨끗하게
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uStrength:{ value: 0.35 },
    uSize:    { value: 0.78 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform float uSize;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float r = dot(d, d);
      float v = smoothstep(uSize, uSize - 0.45, r * 2.0);
      // 가장자리 어둡고 미세하게 푸른 톤 → 새벽 분위기
      c.rgb *= mix(1.0 - uStrength, 1.0, v);
      c.rgb = mix(c.rgb, c.rgb * vec3(0.92, 0.95, 1.05), (1.0 - v) * 0.35);
      gl_FragColor = c;
    }
  `,
};

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
  private skyUniforms!: typeof SkyShader.uniforms;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
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
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.autoClear = false;

    this.buildSky();
    this.buildLights();
    this.buildGround();
    this.mapBuilder = new MapBuilder(this.scene);

    this.setupPostProcessing();
    this.clock.start();

    window.addEventListener("resize", this.onResize);
  }

  private buildSky(): void {
    // 카메라보다 큰 구체 안쪽에 셰이더 머티리얼 — 그라데이션 + 별
    const skyMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(SkyShader.uniforms),
      vertexShader: SkyShader.vertexShader,
      fragmentShader: SkyShader.fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyUniforms = skyMat.uniforms as typeof SkyShader.uniforms;
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat);
    sky.renderOrder = -1;
    this.scene.add(sky);
  }

  private setupPostProcessing(): void {
    this.renderWidth = window.innerWidth;
    this.renderHeight = window.innerHeight;
    const bloomW = Math.floor(this.renderWidth * 0.5);
    const bloomH = Math.floor(this.renderHeight * 0.5);

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(1);
    this.composer.setSize(this.renderWidth, this.renderHeight);

    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(bloomW, bloomH),
      0.55, 0.9, 0.85,
    );
    this.composer.addPass(bloom);

    // 비네팅 — 가벼운 fragment, 화면 가장자리 어둡게
    this.composer.addPass(new ShaderPass(VignetteShader));

    this.composer.addPass(new OutputPass());
  }

  private buildLights(): void {
    const ambient = new THREE.AmbientLight(0x2c2118, 0.40);
    const skyFill = new THREE.HemisphereLight(0x2f3a55, 0x2a1a10, 0.52);

    const moon = new THREE.DirectionalLight(0xd0d4ff, 0.28);
    moon.position.set(-20, 60, -30);
    moon.castShadow = true;
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
    const t = this.clock.getElapsedTime();
    this.skyUniforms.uTime.value = t;
    this.mapBuilder.flickerFires(t);

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
