import { createStore } from "zustand/vanilla";
import type { PlayerSnapshot, TroopSnapshot, ScenarioPhase, UIPhase } from "../types/game";
import type { SessionEndedPayload, ShotResultPayload, StateSnapshotPayload } from "../types/messages";

interface GameState {
  // UI state
  uiPhase: UIPhase;

  // Player
  player: PlayerSnapshot | null;
  lastShotResult: ShotResultPayload | null;

  // World
  troops: TroopSnapshot[];
  scenarioPhase: ScenarioPhase | null;
  pressureLevel: number;
  encirclementLevel: number;

  // Session
  sessionId: string | null;
  sessionEnded: SessionEndedPayload | null;

  // Connection
  wsConnected: boolean;

  // Actions
  setUiPhase: (phase: UIPhase) => void;
  applySnapshot: (payload: StateSnapshotPayload) => void;
  setSessionEnded: (payload: SessionEndedPayload) => void;
  setShotResult: (payload: ShotResultPayload) => void;
  setPressure: (pressure: number, encirclement: number) => void;
  setWsConnected: (connected: boolean) => void;
  reset: () => void;
  /** 재시작 시 사용: 프롤로그 스킵하고 playing 상태로 바로 초기화 */
  quickRestart: () => void;
}

const initial = {
  uiPhase: "prologue" as UIPhase,
  player: null,
  lastShotResult: null,
  troops: [] as TroopSnapshot[],
  scenarioPhase: null,
  pressureLevel: 0,
  encirclementLevel: 0,
  sessionId: null,
  sessionEnded: null,
  wsConnected: false,
};

export const useGameStore = createStore<GameState>((set) => ({
  ...initial,

  setUiPhase: (uiPhase) => set({ uiPhase }),

  applySnapshot: (payload) =>
    set({
      player: payload.player,
      troops: payload.troops,
      scenarioPhase: payload.scenario_phase,
      pressureLevel: payload.pressure_level,
      encirclementLevel: payload.encirclement_level,
      sessionId: payload.session_id,
    }),

  setSessionEnded: (payload) => set({ sessionEnded: payload, uiPhase: "ending" }),

  setShotResult: (payload) => set({ lastShotResult: payload }),

  setPressure: (pressureLevel, encirclementLevel) => set({ pressureLevel, encirclementLevel }),

  setWsConnected: (wsConnected) => set({ wsConnected }),

  reset: () => set({ ...initial }),

  quickRestart: () =>
    set({
      ...initial,
      uiPhase: "playing",
    }),
}));
