import { create } from "zustand";
import type { PlayerState, EnemyState, CivilianState, HelicopterState, GamePhase } from "../types/game";

interface GameOverState {
  reason: "player_dead" | "historical_event";
  survivalTime: number;
  protectedCivilians: number;
  endingText: string;
}

interface GameState {
  player: PlayerState | null;
  enemies: EnemyState[];
  civilians: CivilianState[];
  helicopter: HelicopterState | undefined;
  phase: GamePhase;
  elapsedTime: number;
  wsConnected: boolean;
  gameOver: GameOverState | null;

  setSnapshot: (payload: {
    player: PlayerState;
    enemies: EnemyState[];
    civilians: CivilianState[];
    helicopter?: HelicopterState;
    phase: GamePhase;
    elapsedTime: number;
  }) => void;
  setGameOver: (payload: GameOverState) => void;
  setWsConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  player: null,
  enemies: [],
  civilians: [],
  helicopter: undefined,
  phase: "prologue",
  elapsedTime: 0,
  wsConnected: false,
  gameOver: null,

  setSnapshot: (payload) =>
    set({
      player: payload.player,
      enemies: payload.enemies,
      civilians: payload.civilians,
      helicopter: payload.helicopter,
      phase: payload.phase,
      elapsedTime: payload.elapsedTime,
    }),

  setGameOver: (payload) => set({ gameOver: payload }),

  setWsConnected: (connected) => set({ wsConnected: connected }),

  reset: () =>
    set({
      player: null,
      enemies: [],
      civilians: [],
      helicopter: undefined,
      phase: "prologue",
      elapsedTime: 0,
      gameOver: null,
    }),
}));
