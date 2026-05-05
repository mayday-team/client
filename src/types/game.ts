export type GamePhase = "prologue" | "playing" | "ending";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Euler {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  position: Vector3;
  rotation: Euler;
  hp: number;
  ammo: number;
}

export interface EnemyState {
  id: string;
  position: Vector3;
  rotation: Euler;
  hp: number;
  animation: string;
}

export interface CivilianState {
  id: string;
  position: Vector3;
  rotation: Euler;
  animation: string;
}

export interface HelicopterState {
  position: Vector3;
  rotation: Euler;
}
