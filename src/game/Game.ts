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
import { useGameStore } from "../store/gameStore";

const WS_URL = import.meta.env.VITE_WS_URL;
const EYE_HEIGHT = 1.7;

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

  private animationId = 0;
  private clock = new THREE.Clock();
  private canvas!: HTMLCanvasElement;

  // Server input sequencing
  private inputSeq = 0;
  private shootSeq = 0;

  private _lookDir = new THREE.Vector3();

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

    this.audioManager.play();
    this.wsClient.connect(WS_URL);

    this.canvas.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("game:restart", this.onRestart);

    // Enable pointer lock only while playing
    useGameStore.subscribe((state) => {
      this.playerController.setEnabled(state.uiPhase === "playing");
    });

    this.clock.start();
    this.loop();
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0 || !this.playerController.locked) return;

    this.sceneManager.camera.getWorldDirection(this._lookDir);
    const origin = this.sceneManager.camera.position.clone();

    // Visual bullet (always)
    this.bulletManager.shoot(origin, this._lookDir);

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
  };

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const deltaMs = Math.round(delta * 1000);

    const { player, troops, wsConnected } = useGameStore.getState();

    // ── Player movement ───────────────────────────────────────────────────
    if (player && wsConnected) {
      this.sceneManager.camera.position.set(
        player.position.x,
        player.position.y + EYE_HEIGHT,
        player.position.z,
      );
    } else {
      this.localMovement.update(delta);
    }

    // ── Send input to server ──────────────────────────────────────────────
    if (this.playerController.locked && wsConnected) {
      const keys = this.inputManager.getKeys();
      this.sceneManager.camera.getWorldDirection(this._lookDir);

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
    }

    // ── Update entities ───────────────────────────────────────────────────
    this.entityManager.updateTroops(troops);

    // ── Client-side systems ───────────────────────────────────────────────
    this.bulletManager.update(delta);
    this.helicopterAI.update(delta, this.sceneManager.camera.position);

    this.sceneManager.render();
  };

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("game:restart", this.onRestart);
    this.sceneManager.dispose();
    this.inputManager.dispose();
    this.entityManager.dispose();
    this.wsClient.disconnect();
    this.audioManager.dispose();
    this.bulletManager.dispose();
    this.helicopterAI.dispose();
  }
}
