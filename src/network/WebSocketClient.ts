import type { ClientMessage, ServerMessage } from "../types/messages";
import { useGameStore } from "../store/gameStore";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private playerName = "시민";
  private pendingStart = false;
  private lastUrl = "";

  connect(url?: string): void {
    if (!url) {
      useGameStore.getState().setWsConnected(false);
      console.warn("[WS] URL is not configured — starting without server");
      return;
    }

    this.lastUrl = url;
    try {
      this.ws = new WebSocket(url);
    } catch (error) {
      this.ws = null;
      useGameStore.getState().setWsConnected(false);
      console.warn("[WS] Failed to create connection:", error);
      return;
    }

    this.ws.onopen = () => {
      useGameStore.getState().setWsConnected(true);
      console.log("[WS] Connected to", url);
      if (this.pendingStart) {
        this.pendingStart = false;
        this.startSession();
      }
    };

    this.ws.onclose = () => {
      useGameStore.getState().setWsConnected(false);
      console.log("[WS] Disconnected");
    };

    this.ws.onerror = () => {
      console.warn("[WS] Connection error — server may not be running");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        this.handleMessage(msg);
      } catch {
        console.warn("[WS] Failed to parse message:", event.data);
      }
    };
  }

  startSession(name?: string): void {
    if (name) this.playerName = name;
    this.send({ type: "start_session", payload: { player_name: this.playerName } });
  }

  /** 기존 연결을 끊고 재연결 후 start_session 자동 전송 */
  reconnect(name?: string): void {
    if (name) this.playerName = name;
    this.pendingStart = true;
    this.disconnect();
    this.connect(this.lastUrl);
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(msg: ServerMessage): void {
    const store = useGameStore.getState();

    switch (msg.type) {
      case "welcome":
        console.log("[WS] Server version:", msg.payload.server_version);
        break;

      case "session_started":
        console.log("[WS] Session started:", msg.payload.session_id);
        store.setUiPhase("playing");
        break;

      case "state_snapshot":
        store.applySnapshot(msg.payload);
        break;

      case "shot_result":
        store.setShotResult(msg.payload);
        break;

      case "troop_shot":
        window.dispatchEvent(new CustomEvent("enemy:shot", { detail: msg.payload }));
        break;

      case "pressure_changed":
        store.setPressure(msg.payload.pressure_level, msg.payload.encirclement_level);
        break;

      case "defeat_triggered":
        console.log("[WS] Defeat:", msg.payload.reason);
        break;

      case "session_ended":
        store.setSessionEnded(msg.payload);
        break;

      case "player_died":
        console.log("[WS] Player died at tick", msg.payload.tick);
        break;

      case "scenario_phase_changed":
        console.log("[WS] Phase:", msg.payload.previous_phase, "→", msg.payload.current_phase);
        break;

      case "damage_taken":
        window.dispatchEvent(new CustomEvent("player:hit", { detail: msg.payload }));
        break;

      case "error":
        console.warn("[WS] Server error:", msg.payload.code, msg.payload.message);
        break;

      case "pong":
        break;
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
