export type UIPhase = "prologue" | "playing" | "ending";

export type ScenarioPhase =
  | "INITIAL_CONTACT"
  | "ESCALATION"
  | "REINFORCEMENT"
  | "ENCIRCLEMENT"
  | "FINAL_STAND"
  | "DEFEAT";

export type TroopFSMState =
  | "PATROL"
  | "ADVANCE"
  | "CHASE"
  | "ATTACK"
  | "SUPPRESS"
  | "FLANK"
  | "BLOCK_EXIT"
  | "CALL_REINFORCEMENT"
  | "TAKE_COVER"
  | "DEAD";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerSnapshot {
  id: string;
  name: string;
  position: Vector3;
  yaw: number;
  pitch: number;
  hp: number;
  max_hp: number;
  ammo: number;
  max_ammo: number;
  is_alive: boolean;
  last_processed_input_seq: number;
  survival_time_ms: number;
  morale: number;
}

export interface TroopSnapshot {
  id: string;
  position: Vector3;
  yaw: number;
  hp: number;
  max_hp: number;
  state: TroopFSMState;
  is_alive: boolean;
  squad_id: string;
}
