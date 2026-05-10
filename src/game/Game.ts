import * as THREE from "three";
import { SceneManager } from "./SceneManager";
import { InputManager } from "./InputManager";
import { PlayerController } from "./PlayerController";
import { EntityManager } from "./EntityManager";
import { WebSocketClient } from "../network/WebSocketClient";
import { HUD } from "../ui/HUD";
import { AudioManager } from "./AudioManager";
import { useGameStore } from "../store/gameStore";

const WS_URL = "ws://localhost:8080";
const EYE_HEIGHT = 1.7;

export class Game {
  private sceneManager!: SceneManager;
  private inputManager!: InputManager;
  private playerController!: PlayerController;
  private entityManager!: EntityManager;
  private wsClient!: WebSocketClient;
  private hud!: HUD;
  private audioManager!: AudioManager;
  private animationId = 0;
  private _dir = new THREE.Vector3();

  init(): void {
    const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("#game-canvas not found");

    this.sceneManager = new SceneManager(canvas);
    this.inputManager = new InputManager();
    this.playerController = new PlayerController(this.sceneManager.camera, canvas);
    this.entityManager = new EntityManager(this.sceneManager.scene);
    this.wsClient = new WebSocketClient();
    this.hud = new HUD();

    this.audioManager = new AudioManager();
    this.audioManager.play();

    this.wsClient.connect(WS_URL);
    window.addEventListener("game:restart", this.onRestart);
    this.loop();
  }

  private onRestart = (): void => {
    this.wsClient.send({ type: "restart_game" });
  };

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);

    const { player, enemies, civilians, helicopter } = useGameStore.getState();

    // Apply server-authoritative player position
    if (player) {
      this.sceneManager.camera.position.set(
        player.position.x,
        player.position.y + EYE_HEIGHT,
        player.position.z,
      );
    }

    // Send input to server while pointer is locked
    if (this.playerController.locked) {
      const keys = this.inputManager.getKeys();
      this.sceneManager.camera.getWorldDirection(this._dir);
      const yaw = Math.atan2(this._dir.x, this._dir.z);
      const pitch = Math.atan2(
        this._dir.y,
        Math.sqrt(this._dir.x * this._dir.x + this._dir.z * this._dir.z),
      );
      this.wsClient.send({ type: "player_input", payload: { ...keys, yaw, pitch } });
    }

    // Update entity meshes from latest snapshot
    this.entityManager.updateEnemies(enemies);
    this.entityManager.updateCivilians(civilians);
    this.entityManager.updateHelicopter(helicopter);

    this.sceneManager.render();
  };

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("game:restart", this.onRestart);
    this.sceneManager.dispose();
    this.inputManager.dispose();
    this.entityManager.dispose();
    this.wsClient.disconnect();
    this.audioManager.dispose();
  }
}
