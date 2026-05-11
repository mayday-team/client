import * as THREE from "three";
import { SceneManager } from "./SceneManager";
import { InputManager } from "./InputManager";
import { PlayerController } from "./PlayerController";
import { EntityManager } from "./EntityManager";
import { WebSocketClient } from "../network/WebSocketClient";
import { HUD } from "../ui/HUD";
import { AudioManager } from "./AudioManager";
import { LocalMovement } from "./LocalMovement";
import { BulletManager } from "./BulletManager";
import { HelicopterAI } from "./HelicopterAI";
import { ViewModel } from "./ViewModel";
import { OfflineSoldiers } from "./OfflineSoldiers";
import { useGameStore } from "../store/gameStore";

const WS_URL = import.meta.env.VITE_WS_URL;

export class Game {
  private sceneManager!: SceneManager;
  private inputManager!: InputManager;
  private playerController!: PlayerController;
  private entityManager!: EntityManager;
  private wsClient!: WebSocketClient;
  private hud!: HUD;
  private audioManager!: AudioManager;
  private localMovement!: LocalMovement;
  private bulletManager!: BulletManager;
  private helicopterAI!: HelicopterAI;
  private viewModel!: ViewModel;
  private offlineSoldiers!: OfflineSoldiers;

  private animationId = 0;
  private offlineStartTimer = 0;
  private unsubscribeStore?: () => void;
  private clock = new THREE.Clock();
  private canvas!: HTMLCanvasElement;

  // Server input sequencing
  private inputSeq = 0;
  private shootSeq = 0;

  // 패배 보장 타이머 (서버 미연결 시 fallback)
  private playingElapsed = 0;
  private readonly MAX_PLAY_SECONDS = 900;

  // 엄폐 상태 추적
  private wasInCover = false;

  private _lookDir = new THREE.Vector3();

  // 2층 창문 x 좌표 (MapBuilder WIN_X 와 동일)
  private static readonly WIN_X = [-9, -4.5, 0, 4.5, 9] as const;
  private static readonly WIN_WALL_Z = -33.4;

  private isInCover(pos: THREE.Vector3): boolean {
    // 전면벽 1.5m 이상 안쪽이면 무조건 엄폐
    if (pos.z < Game.WIN_WALL_Z - 1.5) return true;
    // 전면벽 근처지만 창문 사이 벽 앞이면 엄폐
    return !Game.WIN_X.some(wx => Math.abs(pos.x - wx) < 1.3);
  }

  init(): void {
    this.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    if (!this.canvas) throw new Error("#game-canvas not found");

    this.sceneManager = new SceneManager(this.canvas);
    this.inputManager = new InputManager();
    this.playerController = new PlayerController(this.sceneManager.camera, this.canvas);
    this.entityManager = new EntityManager(this.sceneManager.scene);
    this.wsClient = new WebSocketClient();
    this.hud = new HUD();
    this.audioManager = new AudioManager();

    this.localMovement = new LocalMovement(
      this.sceneManager.camera,
      this.inputManager,
    );
    this.bulletManager = new BulletManager(this.sceneManager.scene);
    this.helicopterAI = new HelicopterAI(this.sceneManager.scene);
    this.viewModel = new ViewModel(this.sceneManager.viewmodelScene);
    this.offlineSoldiers = new OfflineSoldiers();

    // 헬기 총알 피격 콜백 — 오프라인 모드에서 클라이언트 HP 감소
    this.helicopterAI.onHitPlayer = (damage) => {
      if (useGameStore.getState().wsConnected) return;
      const store = useGameStore.getState();
      const newHp = store.clientHp - damage;
      store.setClientHp(newHp);
      window.dispatchEvent(new CustomEvent("player:hit"));
      if (newHp <= 0) {
        setTimeout(() => useGameStore.getState().setUiPhase("ending"), 1200);
      }
    };

    this.audioManager.play();
    this.wsClient.connect(WS_URL);

    this.canvas.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("game:restart", this.onRestart);

    // Enable pointer lock only while playing
    const syncPointerLock = (): void => {
      this.playerController.setEnabled(useGameStore.getState().uiPhase === "playing");
    };
    syncPointerLock();
    this.unsubscribeStore = useGameStore.subscribe(syncPointerLock);

    this.clock.start();
    this.loop();
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0 || !this.playerController.locked) return;

    this.sceneManager.camera.getWorldDirection(this._lookDir);
    const origin = this.sceneManager.camera.position.clone();

    // Visual bullet (always)
    this.bulletManager.shoot(origin, this._lookDir);
    this.viewModel.flash();

    // Server shoot message (when connected)
    if (useGameStore.getState().wsConnected) {
      this.wsClient.send({
        type: "shoot",
        payload: {
          seq: ++this.shootSeq,
          origin: { x: origin.x, y: origin.y, z: origin.z },
          direction: { x: this._lookDir.x, y: this._lookDir.y, z: this._lookDir.z },
          client_time: Date.now(),
        },
      });
    }
  };

  private onRestart = (): void => {
    this.wsClient.reconnect();
    clearTimeout(this.offlineStartTimer);
    this.offlineStartTimer = window.setTimeout(() => {
      const store = useGameStore.getState();
      if (!store.wsConnected && store.uiPhase !== "playing") {
        store.setUiPhase("playing");
      }
    }, 800);
  };

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const deltaMs = Math.round(delta * 1000);

    const { player, troops, wsConnected, uiPhase } = useGameStore.getState();

    // ── Player movement (2층 y 고정) ─────────────────────────────────────
    const SECOND_FLOOR_EYE = 7.0;
    const FLOOR_BOUNDS = { xMin: -12.5, xMax: 12.5, zMin: -45.0, zMax: -34.5 };
    const cam = this.sceneManager.camera;
    if (player && wsConnected) {
      const serverX = player.position.x;
      const serverZ = player.position.z;
      const dx = serverX - cam.position.x;
      const dz = serverZ - cam.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > 625) {
        cam.position.set(serverX, SECOND_FLOOR_EYE, serverZ);
      } else if (distSq > 0.04) {
        const correction = Math.min(1, delta * 4);
        cam.position.x += dx * correction;
        cam.position.z += dz * correction;
      }
    }
    this.localMovement.update(delta);
    // 항상 2층 내부로 클램핑 (서버 위치 무시하고 강제 고정)
    cam.position.x = Math.max(FLOOR_BOUNDS.xMin, Math.min(FLOOR_BOUNDS.xMax, cam.position.x));
    cam.position.z = Math.max(FLOOR_BOUNDS.zMin, Math.min(FLOOR_BOUNDS.zMax, cam.position.z));
    cam.position.y = SECOND_FLOOR_EYE;

    // ── 엄폐 감지 — 창문이 아닌 벽 뒤면 서버 HP 동결 ──────────────────────
    const nowInCover = this.isInCover(cam.position);
    if (nowInCover !== this.wasInCover) {
      if (nowInCover) {
        // 엄폐 진입: 현재 HP를 동결값으로 저장
        useGameStore.getState().setCoverState(true, player?.hp ?? 100);
      } else {
        // 엄폐 해제: 실제 서버 HP 복원
        useGameStore.getState().setCoverState(false);
      }
      this.wasInCover = nowInCover;
    }

    // ── Send input to server ──────────────────────────────────────────────
    if (uiPhase === "playing" && wsConnected) {
      const keys = this.inputManager.getKeys();
      this.sceneManager.camera.getWorldDirection(this._lookDir);

      this.wsClient.send({
        type: "player_look",
        payload: {
          yaw: Math.atan2(this._lookDir.x, this._lookDir.z),
          pitch: Math.atan2(
            this._lookDir.y,
            Math.sqrt(this._lookDir.x ** 2 + this._lookDir.z ** 2),
          ),
        },
      });

      this.wsClient.send({
        type: "player_input",
        payload: {
          seq: ++this.inputSeq,
          move: {
            forward: keys.moveForward,
            backward: keys.moveBackward,
            left: keys.moveLeft,
            right: keys.moveRight,
          },
          delta_ms: deltaMs,
        },
      });
    }

    // ── 패배 보장 타이머 (서버 없이도 추모 경험이 끝나도록) ───────────────────
    if (uiPhase === "playing") {
      this.playingElapsed += delta;
      if (this.playingElapsed >= this.MAX_PLAY_SECONDS) {
        useGameStore.getState().setUiPhase("ending");
      }
    } else {
      this.playingElapsed = 0;
    }

    // ── Update entities ───────────────────────────────────────────────────
    // 서버 미연결 시 오프라인 데모 병사 사용
    const activeTroops = wsConnected && troops.length > 0
      ? troops
      : this.offlineSoldiers.update(delta);
    this.entityManager.updateTroops(activeTroops);

    // ── Client-side systems ───────────────────────────────────────────────
    this.bulletManager.update(delta);
    this.helicopterAI.update(delta, this.sceneManager.camera.position);

    this.sceneManager.render();
  };

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    clearTimeout(this.offlineStartTimer);
    this.unsubscribeStore?.();
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("game:restart", this.onRestart);
    this.playerController.dispose();
    this.sceneManager.dispose();
    this.inputManager.dispose();
    this.entityManager.dispose();
    this.wsClient.disconnect();
    this.audioManager.dispose();
    this.bulletManager.dispose();
    this.helicopterAI.dispose();
  }
}
