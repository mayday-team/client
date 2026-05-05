import type { PlayerState, EnemyState, CivilianState, HelicopterState, GamePhase } from "./game";

export type ClientMessage =
  | {
      type: "player_input";
      payload: {
        moveForward: boolean;
        moveBackward: boolean;
        moveLeft: boolean;
        moveRight: boolean;
        shooting: boolean;
        yaw: number;
        pitch: number;
      };
    }
  | {
      type: "restart_game";
    };

export type ServerMessage =
  | {
      type: "game_snapshot";
      payload: {
        player: PlayerState;
        enemies: EnemyState[];
        civilians: CivilianState[];
        helicopter?: HelicopterState;
        phase: GamePhase;
        elapsedTime: number;
      };
    }
  | {
      type: "game_over";
      payload: {
        reason: "player_dead" | "historical_event";
        survivalTime: number;
        protectedCivilians: number;
        endingText: string;
      };
    };
