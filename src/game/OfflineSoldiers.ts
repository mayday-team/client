import type { TroopSnapshot, TroopFSMState } from "../types/game";

interface SoldierAgent {
  id: string;
  x: number;
  z: number;
  yaw: number;
  state: TroopFSMState;
  hp: number;
  // patrol waypoints
  waypointX: number;
  waypointZ: number;
}

// 광장 앞 대기 → 건물 방향으로 전진 패턴
const SPAWN_POSITIONS: [number, number][] = [
  [-12, 10], [-6, 14], [0, 12], [6, 14], [12, 10],
  [-10, 5],  [0, 6],   [10, 5],
  [-8, 20],  [8, 20],
  [-4, 25],  [4, 25],
];

export class OfflineSoldiers {
  private agents: SoldierAgent[] = [];
  private elapsed = 0;

  constructor() {
    SPAWN_POSITIONS.forEach(([x, z], i) => {
      this.agents.push({
        id: `offline_${i}`,
        x,
        z,
        yaw: Math.PI, // 건물 방향(−Z)으로 향함
        state: i < 8 ? "ADVANCE" : "PATROL",
        hp: 100,
        waypointX: x + (Math.random() - 0.5) * 8,
        waypointZ: Math.max(z - 40, -30),
      });
    });
  }

  update(delta: number): TroopSnapshot[] {
    this.elapsed += delta;
    const SPEED = 1.4;

    for (const a of this.agents) {
      // ADVANCE: 건물 쪽으로 서서히 전진
      if (a.state === "ADVANCE") {
        const dx = a.waypointX - a.x;
        const dz = a.waypointZ - a.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.5) {
          a.x += (dx / dist) * SPEED * delta;
          a.z += (dz / dist) * SPEED * delta;
          a.yaw = Math.atan2(dx, dz);
        } else {
          // 목적지 도착하면 공격 모드
          a.state = "ATTACK";
        }
      } else if (a.state === "ATTACK") {
        // 건물 앞 일정 거리에서 좌우로 흔들리며 사격 자세
        a.x += Math.sin(this.elapsed * 1.5 + parseInt(a.id.split("_")[1])) * 0.3 * delta;
      } else {
        // PATROL: 천천히 좌우 이동
        a.x += Math.sin(this.elapsed + parseInt(a.id.split("_")[1]) * 0.7) * 0.4 * delta;
      }
    }

    return this.agents.map((a) => ({
      id: a.id,
      position: { x: a.x, y: 0, z: a.z },
      yaw: a.yaw,
      hp: a.hp,
      max_hp: 100,
      state: a.state,
      is_alive: true,
      squad_id: "offline",
    }));
  }
}
