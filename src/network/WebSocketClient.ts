import type { ClientMessage, ServerMessage } from "../types/messages";
import { useGameStore } from "../store/gameStore";

export class WebSocketClient {
  private ws: WebSocket | null = null;

  connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      useGameStore.getState().setWsConnected(true);
      console.log("[WS] Connected to", url);
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

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(msg: ServerMessage): void {
    const store = useGameStore.getState();
    if (msg.type === "game_snapshot") {
      store.setSnapshot(msg.payload);
    } else if (msg.type === "game_over") {
      store.setGameOver(msg.payload);
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
