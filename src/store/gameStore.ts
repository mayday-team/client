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
  displayPhase: number;
  phaseTroopsKilled: number;
  phaseTroopsTotal: number;
  pressureLevel: number;
  encirclementLevel: number;

  // Session
  sessionId: string | null;
  sessionEnded: SessionEndedPayload | null;

  // Connection
  wsConnected: boolean;

  // Cover (client-side — 벽에 숨으면 서버 HP 동결)
  inCover: boolean;
  coverHp: number;

  // 오프라인 클라이언트 HP
  clientHp: number;

  // Actions
  setUiPhase: (phase: UIPhase) => void;
  applySnapshot: (payload: StateSnapshotPayload) => void;
  setSessionEnded: (payload: SessionEndedPayload) => void;
  setShotResult: (payload: ShotResultPayload) => void;
  setPressure: (pressure: number, encirclement: number) => void;
  setWsConnected: (connected: boolean) => void;
  setCoverState: (inCover: boolean, hp?: number) => void;
  setClientHp: (hp: number) => void;
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
  displayPhase: 1,
  phaseTroopsKilled: 0,
  phaseTroopsTotal: 0,
  pressureLevel: 0,
  encirclementLevel: 0,
  sessionId: null,
  sessionEnded: null,
  wsConnected: false,
  inCover: false,
  coverHp: 100,
  clientHp: 100,
};

export const useGameStore = createStore<GameState>((set) => ({
  ...initial,

  setUiPhase: (uiPhase) => set({ uiPhase }),

  applySnapshot: (payload) =>
    set({
      player: payload.player,
      troops: payload.troops,
      scenarioPhase: payload.scenario_phase,
      displayPhase: payload.display_phase,
      phaseTroopsKilled: payload.phase_troops_killed,
      phaseTroopsTotal: payload.phase_troops_total,
      pressureLevel: payload.pressure_level,
      encirclementLevel: payload.encirclement_level,
      sessionId: payload.session_id,
    }),

  setSessionEnded: (payload) => set({ sessionEnded: payload, uiPhase: "ending" }),

  setShotResult: (payload) => set({ lastShotResult: payload }),

  setPressure: (pressureLevel, encirclementLevel) => set({ pressureLevel, encirclementLevel }),

  setWsConnected: (wsConnected) => set({ wsConnected }),

  setCoverState: (inCover, hp) => set(inCover ? { inCover: true, coverHp: hp! } : { inCover: false }),

  setClientHp: (hp) => set({ clientHp: Math.max(0, hp) }),

  reset: () => set({ ...initial }),

  quickRestart: () =>
    set({
      ...initial,
      uiPhase: "playing",
      clientHp: 100,
    }),
}));
