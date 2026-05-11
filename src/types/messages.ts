import type { Vector3, PlayerSnapshot, TroopSnapshot, ScenarioPhase } from "./game";

// ── Client → Server ──────────────────────────────────────────────────────────

export type ClientMessage =
  | { type: "start_session"; payload: { player_name: string } }
  | {
      type: "player_input";
      payload: {
        seq: number;
        move: { forward: boolean; backward: boolean; left: boolean; right: boolean };
        delta_ms: number;
      };
    }
  | { type: "player_look"; payload: { yaw: number; pitch: number } }
  | {
      type: "shoot";
      payload: { seq: number; origin: Vector3; direction: Vector3; client_time: number };
    }
  | { type: "reload" }
  | { type: "ping"; payload: { client_time: number } };

// ── Server → Client ──────────────────────────────────────────────────────────

export interface StateSnapshotPayload {
  server_tick: number;
  session_id: string;
  scenario_phase: ScenarioPhase;
  pressure_level: number;
  encirclement_level: number;
  player: PlayerSnapshot;
  troops: TroopSnapshot[];
}

export interface SessionEndedPayload {
  session_id: string;
  survived_ms: number;
  final_phase: ScenarioPhase;
  defeat_reason: string;
  shots_fired: number;
  shots_hit: number;
  damage_taken: number;
  troops_neutralized: number;
  events_recorded: number;
}

export interface ShotResultPayload {
  seq: number;
  accepted: boolean;
  reason: string;
  hit_troop_id: string | null;
  hit_distance: number;
  damage_dealt: number;
  troop_killed: boolean;
  ammo_left: number;
}

export type ServerMessage =
  | { type: "welcome"; payload: { server_version: string; server_time: number } }
  | { type: "session_started"; payload: { session_id: string; tick_rate: number; started_at: string } }
  | { type: "state_snapshot"; payload: StateSnapshotPayload }
  | { type: "shot_result"; payload: ShotResultPayload }
  | { type: "damage_taken"; payload: { source: string; source_id: string; damage: number; remaining_hp: number } }
  | { type: "player_died"; payload: { session_id: string; tick: number } }
  | { type: "scenario_phase_changed"; payload: { previous_phase: ScenarioPhase; current_phase: ScenarioPhase; tick: number } }
  | { type: "pressure_changed"; payload: { pressure_level: number; encirclement_level: number } }
  | { type: "defeat_triggered"; payload: { reason: string; tick: number } }
  | { type: "session_ended"; payload: SessionEndedPayload }
  | { type: "pong"; payload: { client_time: number; server_time: number } }
  | { type: "error"; payload: { code: string; message: string } };
