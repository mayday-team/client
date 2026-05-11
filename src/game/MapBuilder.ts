import * as THREE from "three";

export class MapBuilder {
  private readonly BZ = -40;

  // 그을리고 전쟁 피해를 입은 1980년 5월 27일 새벽의 색상
  private readonly matBuilding = new THREE.MeshLambertMaterial({ color: 0x5a5248 });
  private readonly matStone = new THREE.MeshLambertMaterial({ color: 0x3e3a36 });
  private readonly matRoof = new THREE.MeshLambertMaterial({ color: 0x2a3028 });
  private readonly matPlaza = new THREE.MeshLambertMaterial({ color: 0x2a2820 });
  private readonly matRoad = new THREE.MeshLambertMaterial({ color: 0x1a1a18 });
  private readonly matWindow = new THREE.MeshLambertMaterial({ color: 0x0a1018 });
  private readonly matDoor = new THREE.MeshLambertMaterial({ color: 0x080810 });
  private readonly matTrunk = new THREE.MeshLambertMaterial({ color: 0x2e1e0c });
  private readonly matLeaves = new THREE.MeshLambertMaterial({ color: 0x141a0c });
  private readonly matPole = new THREE.MeshLambertMaterial({ color: 0x555555 });
  private readonly matFlag = new THREE.MeshLambertMaterial({ color: 0x6a1010, side: THREE.DoubleSide });
  private readonly matWater = new THREE.MeshLambertMaterial({ color: 0x1a2428, transparent: true, opacity: 0.75 });
  private readonly matSidewalk = new THREE.MeshLambertMaterial({ color: 0x302e2a });
  private readonly matPath = new THREE.MeshLambertMaterial({ color: 0x2c2a24 });
  private readonly matGrass = new THREE.MeshLambertMaterial({ color: 0x1a1e10 });
  private readonly matMark = new THREE.MeshLambertMaterial({ color: 0x888880 });
  private readonly matCurb = new THREE.MeshLambertMaterial({ color: 0x383633 });

  constructor(private scene: THREE.Scene) {
    this.buildGrassPatches();
    this.buildProvincialHall();
    this.buildInterior();
    this.buildSecondFloor();
    this.buildPlaza();
    this.buildFountain();
    this.buildFlagpoles();
    this.buildRoad();
    this.buildTrees();
    this.buildCityBuildings();
    this.buildProtestScene();
    this.addInteriorLights();
    this.addPlazaLights();
  }

  private add(mesh: THREE.Mesh): THREE.Mesh {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  private flat(mesh: THREE.Mesh): THREE.Mesh {
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  private box(
    w: number, h: number, d: number,
    mat: THREE.Material,
    x: number, y: number, z: number,
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return this.add(m);
  }

  private cyl(
    rt: number, rb: number, h: number, segs: number,
    mat: THREE.Material,
    x: number, y: number, z: number,
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
    m.position.set(x, y, z);
    return this.add(m);
  }

  private plane(
    w: number, d: number,
    mat: THREE.Material,
    x: number, y: number, z: number,
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    return this.flat(m);
  }

  private buildGrassPatches(): void {
    this.plane(200, 80, this.matGrass, 0, 0.005, -68);
  }

  private buildProvincialHall(): void {
    const { BZ } = this;

    // ── Main central block ──────────────────────────────────────────────
    this.box(28, 16, 14, this.matBuilding, 0, 8, BZ);
    this.box(28.4, 0.8, 14.4, this.matRoof, 0, 16.4, BZ);

    // ── Wings ──────────────────────────────────────────────────────────
    this.box(20, 10, 12, this.matBuilding, -24, 5, BZ);
    this.box(20.4, 0.8, 12.4, this.matRoof, -24, 10.4, BZ);
    this.box(20, 10, 12, this.matBuilding, 24, 5, BZ);
    this.box(20.4, 0.8, 12.4, this.matRoof, 24, 10.4, BZ);

    // ── Connectors between main block and wings ─────────────────────────
    this.box(5, 12, 13, this.matBuilding, -11, 6, BZ);
    this.box(5, 12, 13, this.matBuilding, 11, 6, BZ);

    // ── Dome ────────────────────────────────────────────────────────────
    this.cyl(5.5, 5.5, 4, 24, this.matBuilding, 0, 18, BZ);
    const domeCap = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      this.matBuilding,
    );
    domeCap.position.set(0, 20, BZ);
    domeCap.castShadow = true;
    this.scene.add(domeCap);
    this.cyl(0.8, 1.2, 2, 8, this.matBuilding, 0, 26.5, BZ);

    // ── Front portico ───────────────────────────────────────────────────
    this.box(22, 1.5, 1, this.matBuilding, 0, 11, BZ + 7.5);   // architrave
    this.box(22, 1.0, 1, this.matStone, 0, 12.3, BZ + 7.5);    // frieze
    this.box(23, 0.8, 1.5, this.matBuilding, 0, 13.1, BZ + 7.5); // cornice

    // 8 columns
    for (let i = 0; i < 8; i++) {
      const cx = -10.5 + i * 3;
      this.box(0.9, 0.5, 0.9, this.matStone, cx, 0.25, BZ + 7.5); // base
      this.cyl(0.35, 0.4, 4.6, 10, this.matBuilding, cx, 2.55, BZ + 7.5); // shaft
      this.box(0.95, 0.5, 0.95, this.matStone, cx, 4.95, BZ + 7.5); // capital
    }

    // ── Steps (6 treads) ────────────────────────────────────────────────
    for (let s = 0; s < 6; s++) {
      this.box(22 - s * 0.4, 0.4, 1.8, this.matStone, 0, (5 - s) * 0.4, BZ + 8.8 + s * 1.7);
    }

    // ── Door ────────────────────────────────────────────────────────────
    const door = new THREE.Mesh(new THREE.BoxGeometry(3, 4.5, 0.2), this.matDoor);
    door.position.set(0, 2.5, BZ + 7.15);
    this.scene.add(door);

    // ── Windows – main block front (3 floors × 5 windows) ───────────────
    for (let floor = 0; floor < 3; floor++) {
      for (let w = -2; w <= 2; w++) {
        if (floor === 0 && w === 0) continue; // door space
        if (floor === 1) continue; // playable second-floor windows stay open
        this.addWindow(w * 4.5, 2.5 + floor * 4.5, BZ + 7.1, 1.5, 2, "z");
      }
    }

    // ── Windows – wings front (2 floors × 5 windows per wing) ───────────
    for (const wx of [-24, 24]) {
      for (let floor = 0; floor < 2; floor++) {
        for (let w = -2; w <= 2; w++) {
          this.addWindow(wx + w * 3.5, 2.5 + floor * 4, BZ + 6.1, 1.4, 2, "z");
        }
      }
    }

    // ── Windows – left/right side faces ─────────────────────────────────
    for (let floor = 0; floor < 2; floor++) {
      for (let d = 0; d < 3; d++) {
        this.addWindow(-34.1, 2.5 + floor * 4, BZ - 3 + d * 3.5, 1.4, 2, "x");
        this.addWindow(34.1, 2.5 + floor * 4, BZ - 3 + d * 3.5, 1.4, 2, "x");
      }
    }
  }

  private addWindow(
    x: number, y: number, z: number,
    w: number, h: number,
    axis: "x" | "z",
  ): void {
    const depth = 0.15;
    const geo = axis === "z"
      ? new THREE.BoxGeometry(w, h, depth)
      : new THREE.BoxGeometry(depth, h, w);
    const m = new THREE.Mesh(geo, this.matWindow);
    m.position.set(x, y, z);
    this.scene.add(m);

    // Arch top — torus arc from corner to corner
    const archGeo = new THREE.TorusGeometry(w / 2, 0.1, 4, 12, Math.PI);
    const arch = new THREE.Mesh(archGeo, this.matBuilding);
    arch.position.set(x, y + h / 2, z);
    if (axis === "x") arch.rotation.y = Math.PI / 2;
    this.scene.add(arch);
  }

  private buildPlaza(): void {
    this.plane(90, 50, this.matPlaza, 0, 0.01, -8);

    // Border strips
    const borderMat = new THREE.MeshLambertMaterial({ color: 0x9a9090 });
    for (const dz of [-24.5, 24.5]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(90, 1.2), borderMat);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(0, 0.015, -8 + dz);
      this.scene.add(strip);
    }

    // Central path from fountain to steps
    this.plane(6, 30, this.matPath, 0, 0.02, -8);
  }

  private buildFountain(): void {
    // Base platform
    this.box(14, 0.5, 14, this.matStone, 0, 0.25, 5);

    // Basin wall
    this.cyl(6.5, 6.5, 1, 32, this.matStone, 0, 0.75, 5);

    // Water surface
    const water = new THREE.Mesh(new THREE.CircleGeometry(6, 32), this.matWater);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.85, 5);
    this.scene.add(water);

    // Center pedestal
    this.cyl(0.8, 1.0, 4, 12, this.matStone, 0, 2.5, 5);

    // Upper bowl
    this.cyl(2.0, 0.5, 0.6, 16, this.matStone, 0, 4.8, 5);
  }

  private buildFlagpoles(): void {
    for (const x of [-20, 20]) {
      this.cyl(0.7, 0.8, 0.9, 8, this.matPole, x, 0.45, 8);  // base
      this.cyl(0.1, 0.15, 14, 8, this.matPole, x, 7, 8);     // pole
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), this.matFlag);
      flag.position.set(x + 1.25, 13.5, 8);
      this.scene.add(flag);
    }
  }

  private buildRoad(): void {
    this.plane(120, 14, this.matRoad, 0, 0.02, 22);

    // Center line dashes
    for (let i = -6; i <= 6; i++) {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3.5), this.matMark);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(i * 9, 0.03, 22);
      this.scene.add(mark);
    }

    // Sidewalks
    this.plane(120, 5, this.matSidewalk, 0, 0.015, 16.5);
    this.plane(120, 5, this.matSidewalk, 0, 0.015, 27.5);

    // Curbs
    this.box(120, 0.15, 0.3, this.matCurb, 0, 0.075, 15);
    this.box(120, 0.15, 0.3, this.matCurb, 0, 0.075, 29);
  }

  private buildTrees(): void {
    const positions: [number, number][] = [
      [-40, -25], [-40, -15], [-40, -5], [-40, 5], [-40, 15],
      [40, -25], [40, -15], [40, -5], [40, 5], [40, 15],
      [-35, -28], [-20, -28], [0, -28], [20, -28], [35, -28],
      [-35, 14], [-20, 14], [-5, 14], [10, 14], [25, 14], [38, 14],
      [-35, 30], [-20, 30], [-5, 30], [10, 30], [25, 30], [38, 30],
    ];

    const leafColors = [0x2d5a1b, 0x3a6a25, 0x265018];
    positions.forEach(([x, z], i) => {
      const trunkH = 3 + (i % 3) * 0.6;
      const leafR = 1.8 + (i % 2) * 0.7;
      this.cyl(0.18, 0.25, trunkH, 6, this.matTrunk, x, trunkH / 2, z);
      const lMat = new THREE.MeshLambertMaterial({ color: leafColors[i % 3] });
      const add = (r: number, dx: number, dy: number, dz: number) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), lMat);
        s.position.set(x + dx, trunkH + dy, z + dz);
        s.castShadow = true;
        this.scene.add(s);
      };
      add(leafR,       0,           leafR * 0.7,  0);
      add(leafR * 0.7, leafR * 0.6, leafR * 0.4,  leafR * 0.3);
      add(leafR * 0.6, -leafR * 0.5, leafR * 0.5, -leafR * 0.4);
    });
  }

  // ── Interior ─────────────────────────────────────────────────────────────

  /**
   * Builds the inside of the main block:
   * - Front wall panels with actual window openings (DoubleSide)
   * - Interior floor, ceiling, back wall, side walls
   * - Sandbag barricades under each window
   *
   * Why DoubleSide panels instead of the exterior solid box:
   * The exterior BoxGeometry uses FrontSide culling, so its inner face is
   * invisible from inside.  Separate DoubleSide panels placed just inside
   * that face are visible from both directions, and leaving gaps where the
   * windows are creates real transparent openings.
   */
  private buildInterior(): void {
    const { BZ } = this;

    // Window geometry matches buildProvincialHall() addWindow() calls:
    //   x centers: ±9, ±4.5, 0  —  width 1.5m, height 2m
    //   y centers per floor: 2.5, 7.0, 11.5  →  y ranges [1.5-3.5], [6-8], [10.5-12.5]
    const WIN_X   = [-9, -4.5, 0, 4.5, 9] as const;
    const WIN_W   = 1.5;
    const WIN_FLOORS = [
      { yLo: 1.5, yHi: 3.5 },
      { yLo: 6.0, yHi: 8.0 },
      { yLo: 10.5, yHi: 12.5 },
    ] as const;

    const WALL_Z  = BZ + 6.6;   // slightly inset from the exterior face (BZ+7)
    const WALL_T  = 0.45;
    const WALL_W  = 28;
    const WALL_H  = 16;

    const iMat = new THREE.MeshLambertMaterial({ color: 0xc8b89a, side: THREE.DoubleSide });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x8a7550, side: THREE.DoubleSide });
    const ceilMat  = new THREE.MeshLambertMaterial({ color: 0xb8a888, side: THREE.DoubleSide });

    // ── Front wall panels with openings ──────────────────────────────────

    // Solid x-segments (the wall between / outside the windows)
    const solidX: [number, number][] = [];
    let px = -WALL_W / 2;
    for (const wx of WIN_X) {
      const wl = wx - WIN_W / 2;
      const wr = wx + WIN_W / 2;
      if (px < wl) solidX.push([px, wl]);
      px = wr;
    }
    if (px < WALL_W / 2) solidX.push([px, WALL_W / 2]);

    // Solid y-bands that span full width (below / between / above windows)
    const solidY: [number, number][] = [
      [0, WIN_FLOORS[0].yLo],
      [WIN_FLOORS[0].yHi, WIN_FLOORS[1].yLo],
      [WIN_FLOORS[1].yHi, WIN_FLOORS[2].yLo],
      [WIN_FLOORS[2].yHi, WALL_H],
    ];
    for (const [y0, y1] of solidY) {
      this.panel(iMat, -WALL_W / 2, WALL_W / 2, y0, y1, WALL_Z, WALL_T);
    }

    // Window-level y-bands: only solid x-segments
    for (const { yLo, yHi } of WIN_FLOORS) {
      for (const [xs, xe] of solidX) {
        this.panel(iMat, xs, xe, yLo, yHi, WALL_Z, WALL_T);
      }
    }

    // Window sill ledges (visible from inside, protrude toward player)
    const sillMat = new THREE.MeshLambertMaterial({ color: 0xd0c0a0 });
    for (const { yLo } of WIN_FLOORS) {
      for (const wx of WIN_X) {
        const sill = new THREE.Mesh(
          new THREE.BoxGeometry(WIN_W + 0.3, 0.1, WALL_T + 0.25),
          sillMat,
        );
        sill.position.set(wx, yLo - 0.05, WALL_Z);
        sill.receiveShadow = true;
        this.scene.add(sill);
      }
    }

    // ── Interior shell (back, sides, floor, ceiling) ──────────────────────

    const depth = 14; // matches exterior box depth

    // Ground floor
    const iFloor = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, depth), floorMat);
    iFloor.rotation.x = -Math.PI / 2;
    iFloor.position.set(0, 0.03, BZ);
    iFloor.receiveShadow = true;
    this.scene.add(iFloor);

    // First floor ceiling / ground floor ceiling
    const iCeil = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, depth), ceilMat);
    iCeil.rotation.x = Math.PI / 2;
    iCeil.position.set(0, 5.3, BZ);
    this.scene.add(iCeil);

    // Back wall (DoubleSide so visible from inside)
    this.panel(iMat, -WALL_W / 2, WALL_W / 2, 0, WALL_H, BZ - 7 + 0.3, WALL_T);

    // Side walls
    for (const sx of [-WALL_W / 2 + 0.3, WALL_W / 2 - 0.3] as const) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, WALL_H, depth), iMat);
      sw.position.set(sx, WALL_H / 2, BZ);
      sw.castShadow = true;
      this.scene.add(sw);
    }

    // ── Sandbag barricades under each ground-floor window ─────────────────
    const sandbagMat = new THREE.MeshLambertMaterial({ color: 0x7a6840 });

    WIN_X.forEach((wx, i) => {
      for (let r = 0; r < 2; r++) {
        const g = new THREE.Group();
        g.position.set(wx, 0.14 + r * 0.27, WALL_Z + 0.52);
        g.rotation.y = (i % 3 - 1) * 0.12;
        const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.9, 4, 8), sandbagMat);
        bag.rotation.z = Math.PI / 2;
        bag.castShadow = true;
        g.add(bag);
        this.scene.add(g);
      }
      // Top bag, staggered
      const g2 = new THREE.Group();
      g2.position.set(wx + 0.1, 0.68, WALL_Z + 0.48);
      g2.rotation.y = (i % 2) * 0.2 - 0.1;
      const top = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.78, 4, 8), sandbagMat);
      top.rotation.z = Math.PI / 2;
      top.castShadow = true;
      g2.add(top);
      this.scene.add(g2);
    });
  }

  // ── 2층 내부 (메인 무대) ───────────────────────────────────────────────────

  private buildSecondFloor(): void {
    const { BZ } = this;
    const FLOOR_Y  = 5.30;  // 1층 천장 = 2층 바닥
    const CEIL_Y   = 10.60;
    const WALL_Z   = BZ + 6.6;  // 전면 내벽 (1층과 동일)
    const WALL_W   = 28;
    const WALL_T   = 0.45;
    const DEPTH    = 14;

    // 2층 창문 위치 — 1층과 동일 x, floor 1 (yLo=6.0, yHi=8.0)
    const WIN_X  = [-9, -4.5, 0, 4.5, 9] as const;
    const WIN_W  = 1.5;
    const WIN_YLO = 6.0;
    const WIN_YHI = 8.0;

    const wallMat  = new THREE.MeshLambertMaterial({ color: 0x6a5e50, side: THREE.DoubleSide,
      emissive: new THREE.Color(0x2a1e14), emissiveIntensity: 0.8 });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x5a4832,
      emissive: new THREE.Color(0x221808), emissiveIntensity: 0.9 });
    const ceilMat  = new THREE.MeshLambertMaterial({ color: 0x5a5248, side: THREE.DoubleSide,
      emissive: new THREE.Color(0x1e1a16), emissiveIntensity: 0.8 });

    // ── 바닥 ─────────────────────────────────────────────────────────────
    const floor2 = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, DEPTH), floorMat);
    floor2.rotation.x = -Math.PI / 2;
    floor2.position.set(0, FLOOR_Y + 0.02, BZ);
    floor2.receiveShadow = true;
    this.scene.add(floor2);

    // ── 천장 ──────────────────────────────────────────────────────────────
    const ceil2 = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, DEPTH), ceilMat);
    ceil2.rotation.x = Math.PI / 2;
    ceil2.position.set(0, CEIL_Y, BZ);
    this.scene.add(ceil2);

    // ── 전면 벽 (창문 개구부 포함) ────────────────────────────────────────
    const solidX: [number, number][] = [];
    let px = -WALL_W / 2;
    for (const wx of WIN_X) {
      const wl = wx - WIN_W / 2;
      const wr = wx + WIN_W / 2;
      if (px < wl) solidX.push([px, wl]);
      px = wr;
    }
    if (px < WALL_W / 2) solidX.push([px, WALL_W / 2]);

    // 창문 아래/위 수평 띠
    this.panel(wallMat, -WALL_W/2, WALL_W/2, FLOOR_Y, WIN_YLO, WALL_Z, WALL_T);
    this.panel(wallMat, -WALL_W/2, WALL_W/2, WIN_YHI, CEIL_Y,  WALL_Z, WALL_T);
    // 창문 사이 수직 기둥
    for (const [xs, xe] of solidX) {
      this.panel(wallMat, xs, xe, WIN_YLO, WIN_YHI, WALL_Z, WALL_T);
    }

    // ── 후면·측면 벽 ──────────────────────────────────────────────────────
    this.panel(wallMat, -WALL_W/2, WALL_W/2, FLOOR_Y, CEIL_Y, BZ - 7 + 0.3, WALL_T);
    for (const sx of [-WALL_W/2 + 0.3, WALL_W/2 - 0.3] as const) {
      const sw = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_T, CEIL_Y - FLOOR_Y, DEPTH), wallMat,
      );
      sw.position.set(sx, (FLOOR_Y + CEIL_Y) / 2, BZ);
      sw.castShadow = true;
      this.scene.add(sw);
    }

    // ── 창틀 턱 (2층) ────────────────────────────────────────────────────
    const sillMat = new THREE.MeshLambertMaterial({ color: 0x6a5a48,
      emissive: new THREE.Color(0x241c10), emissiveIntensity: 0.9 });
    for (const wx of WIN_X) {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(WIN_W + 0.3, 0.10, WALL_T + 0.3), sillMat);
      sill.position.set(wx, WIN_YLO - 0.05, WALL_Z);
      sill.receiveShadow = true;
      this.scene.add(sill);
    }

    // ── 2층 창문 모래주머니 ────────────────────────────────────────────────
    const sbMat = new THREE.MeshLambertMaterial({ color: 0x5a4820,
      emissive: new THREE.Color(0x1a1408), emissiveIntensity: 0.7 });
    WIN_X.forEach((wx, i) => {
      for (let r = 0; r < 2; r++) {
        const g = new THREE.Group();
        g.position.set(wx, FLOOR_Y + 0.08 + r * 0.18, WALL_Z + 0.55);
        g.rotation.y = (i % 3 - 1) * 0.12;
        const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.65, 4, 8), sbMat);
        bag.rotation.z = Math.PI / 2;
        bag.castShadow = true;
        g.add(bag);
        this.scene.add(g);
      }
      const g2 = new THREE.Group();
      g2.position.set(wx + 0.1, FLOOR_Y + 0.48, WALL_Z + 0.50);
      g2.rotation.y = (i % 2) * 0.2 - 0.1;
      const top = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.55, 4, 8), sbMat);
      top.rotation.z = Math.PI / 2;
      top.castShadow = true;
      g2.add(top);
      this.scene.add(g2);
    });

    // ── 2층 전용 조명 (랜턴 6개, 화염 반사 4개) ───────────────────────────
    const lightY = FLOOR_Y + 2.2; // 바닥에서 2.2m 위 (눈높이 근처)

    // 창문 쪽 화염 반사 (앞쪽)
    const fireRefl = new THREE.PointLight(0xff4400, 2.5, 18);
    fireRefl.position.set(0, lightY, WALL_Z + 1.5);
    this.scene.add(fireRefl);

    // 중앙 랜턴
    const center = new THREE.PointLight(0xff7733, 2.0, 20);
    center.position.set(0, lightY, BZ);
    this.scene.add(center);

    // 좌우 랜턴
    for (const x of [-7, 7]) {
      const l = new THREE.PointLight(0xff6622, 1.6, 16);
      l.position.set(x, lightY, BZ);
      this.scene.add(l);
    }

    // 후방 랜턴 2개
    for (const x of [-4, 4]) {
      const l = new THREE.PointLight(0xff5511, 1.2, 14);
      l.position.set(x, lightY, BZ - 3.5);
      this.scene.add(l);
    }

    // ── 가구·소품 ────────────────────────────────────────────────────────
    this.buildSecondFloorProps(FLOOR_Y, BZ);
  }

  private buildSecondFloorProps(fy: number, BZ: number): void {
    const woodMat  = new THREE.MeshLambertMaterial({ color: 0x2e1c0c,
      emissive: new THREE.Color(0x0e0804), emissiveIntensity: 0.8 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2820,
      emissive: new THREE.Color(0x080807), emissiveIntensity: 0.9 });
    const creteMat = new THREE.MeshLambertMaterial({ color: 0x3a3530,
      emissive: new THREE.Color(0x0e0c0b), emissiveIntensity: 0.7 });
    const sbMat    = new THREE.MeshLambertMaterial({ color: 0x5a4820,
      emissive: new THREE.Color(0x1a1408), emissiveIntensity: 0.7 });
    const paperMat = new THREE.MeshLambertMaterial({ color: 0x9a9070,
      emissive: new THREE.Color(0x28261e), emissiveIntensity: 0.8 });

    // 뒤집힌 책상들 (엄폐물)
    const desks: Array<{ x: number; z: number; ry: number }> = [
      { x: -10.5, z: BZ - 1.2, ry:  0.30 },
      { x:  -5.5, z: BZ - 2.0, ry: -0.20 },
      { x:   5.5, z: BZ - 1.8, ry:  0.15 },
      { x:  10.5, z: BZ - 1.0, ry: -0.38 },
      { x:   0,   z: BZ - 3.0, ry:  0.10 },
    ];
    for (const d of desks) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 0.75), woodMat);
      top.position.set(d.x, fy + 0.52, d.z);
      top.rotation.y = d.ry;
      top.castShadow = true;
      this.scene.add(top);
      for (const [lx, lz] of [[-0.58, -0.32], [0.58, -0.32], [-0.58, 0.32], [0.58, 0.32]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.05), metalMat);
        const cos = Math.cos(d.ry), sin = Math.sin(d.ry);
        leg.position.set(
          d.x + lx * cos - lz * sin,
          fy + 0.26,
          d.z + lx * sin + lz * cos,
        );
        this.scene.add(leg);
      }
    }

    // 철제 캐비닛 (무거운 엄폐물)
    const cabinets: Array<{ x: number; z: number }> = [
      { x: -11.5, z: BZ + 1.5 },
      { x:  11.5, z: BZ + 1.5 },
      { x:  -6.5, z: BZ - 1.0 },
      { x:   6.5, z: BZ - 1.0 },
      { x:  -2.5, z: BZ + 1.0 },
    ];
    for (const c of cabinets) {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.25, 0.45), metalMat);
      cab.position.set(c.x, fy + 0.625, c.z);
      cab.castShadow = true;
      this.scene.add(cab);
      // 서랍 선
      const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.02, 0.42), creteMat);
      drawer.position.set(c.x, fy + 0.45, c.z + 0.015);
      this.scene.add(drawer);
    }

    // 탄약 상자 / 보급 박스
    const crateMat2 = new THREE.MeshLambertMaterial({ color: 0x2e3a1c,
      emissive: new THREE.Color(0x0a0e08), emissiveIntensity: 0.8 });
    const crates: Array<{ x: number; z: number; ry?: number }> = [
      { x: -3, z: BZ - 2.5 },
      { x:  3, z: BZ - 2.5 },
      { x:  0, z: BZ - 3.5, ry: 0.25 },
      { x: -8, z: BZ - 2.0, ry: -0.1 },
      { x:  8, z: BZ - 2.0 },
    ];
    for (const c of crates) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.35), crateMat2);
      crate.position.set(c.x, fy + 0.19, c.z);
      crate.rotation.y = c.ry ?? 0;
      crate.castShadow = true;
      this.scene.add(crate);
    }

    // 모래주머니 추가 엄폐물 (복도 중간)
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      g.position.set(-5 + i * 2.5, fy + 0.14, BZ + 2.5);
      g.rotation.y = i * 0.3;
      const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.85, 4, 8), sbMat);
      bag.rotation.z = Math.PI / 2;
      bag.castShadow = true;
      g.add(bag);
      this.scene.add(g);
    }

    // 바닥에 흩어진 문서·종이
    for (let i = 0; i < 18; i++) {
      const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28 + (i % 3) * 0.12, 0.20 + (i % 2) * 0.10),
        paperMat,
      );
      paper.rotation.x = -Math.PI / 2;
      paper.rotation.z = i * 0.72;
      paper.position.set(-9 + i * 1.08, fy + 0.015, BZ - 0.5 + (i % 5) * 0.9);
      this.scene.add(paper);
    }

    // 계단 (단순 박스 계단, 오른쪽 모서리)
    this.buildStaircase(fy, BZ);
  }

  private buildStaircase(topFloorY: number, BZ: number): void {
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x3a3228,
      emissive: new THREE.Color(0x100e0c), emissiveIntensity: 0.7 });
    const railMat = new THREE.MeshLambertMaterial({ color: 0x1e1a14,
      emissive: new THREE.Color(0x080604), emissiveIntensity: 0.9 });

    const steps = 8;
    const stepH = topFloorY / steps;
    const stepD = 0.65;
    const startZ = BZ + 5.0;
    const stairX = 11.0;

    for (let i = 0; i < steps; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, stepH, stepD),
        stepMat,
      );
      step.position.set(stairX, stepH * (i + 0.5), startZ - i * stepD);
      step.castShadow = true;
      this.scene.add(step);
    }

    // 난간 기둥
    for (let i = 0; i <= steps; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, topFloorY * 0.55, 6), railMat);
      post.position.set(stairX - 1.3, stepH * i + topFloorY * 0.275, startZ - i * stepD + 0.2);
      this.scene.add(post);
    }
    // 난간 가로대
    const railing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, stepD * steps + 0.5), railMat);
    railing.rotation.x = Math.atan2(-topFloorY, stepD * steps);
    railing.position.set(stairX - 1.3, topFloorY * 0.6, startZ - (steps * stepD) / 2 + 0.2);
    this.scene.add(railing);
  }

  /**
   * Helper: creates a BoxGeometry panel spanning [x0,x1] × [y0,y1] at depth z.
   */
  private panel(
    mat: THREE.Material,
    x0: number, x1: number,
    y0: number, y1: number,
    z: number,
    thickness: number,
  ): void {
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, thickness), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.scene.add(m);
  }

  // ── Gwangju City Buildings (1980 금남로 일대) ─────────────────────────────

  private buildCityBuildings(): void {
    // Buildings on both sides of 금남로, running along x-axis at z ≈ 38-50
    const specs: Array<{ x: number; z: number; w: number; h: number; d: number; color: number }> = [
      // West side (negative x)
      { x: -58, z:  35, w: 18, h: 22, d: 14, color: 0x9a9280 }, // tall office building
      { x: -58, z:  55, w: 18, h: 14, d: 12, color: 0xb4a890 }, // commercial
      { x: -58, z:  72, w: 18, h:  9, d: 12, color: 0x8c8474 }, // shorter shop
      { x: -46, z:  40, w:  8, h: 18, d:  8, color: 0xa09888 }, // narrow building
      { x: -46, z:  60, w:  8, h: 12, d:  8, color: 0x9c9484 },
      // East side (positive x)
      { x:  58, z:  35, w: 20, h: 26, d: 14, color: 0x8e8878 }, // tall bank-style
      { x:  58, z:  56, w: 20, h: 16, d: 12, color: 0xb0a898 },
      { x:  58, z:  74, w: 20, h: 10, d: 12, color: 0xa8a090 },
      { x:  46, z:  43, w:  9, h: 20, d:  9, color: 0x9a9282 },
      { x:  46, z:  62, w:  9, h: 13, d:  9, color: 0x969080 },
      // Buildings behind the building (back side)
      { x: -55, z: -68, w: 22, h: 12, d: 14, color: 0x8a8274 },
      { x:  55, z: -68, w: 22, h: 12, d: 14, color: 0x909080 },
    ];

    const winMat = new THREE.MeshLambertMaterial({ color: 0x2a3a50 });

    for (const s of specs) {
      const bMat = new THREE.MeshLambertMaterial({ color: s.color });
      const body = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), bMat);
      body.position.set(s.x, s.h / 2, s.z);
      body.castShadow = true;
      body.receiveShadow = true;
      this.scene.add(body);

      // Horizontal window strips per floor
      const floors = Math.floor(s.h / 3.2);
      for (let f = 1; f < floors; f++) {
        // Front face strip
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(s.w - 1, 0.85, 0.18),
          winMat,
        );
        strip.position.set(s.x, f * 3.2 + 0.5, s.z + s.d / 2);
        this.scene.add(strip);
      }

      // Rooftop parapet
      const parapet = new THREE.Mesh(
        new THREE.BoxGeometry(s.w + 0.3, 0.6, s.d + 0.3),
        new THREE.MeshLambertMaterial({ color: (s.color & 0xfefefe) - 0x101010 }),
      );
      parapet.position.set(s.x, s.h + 0.3, s.z);
      this.scene.add(parapet);
    }

    // Ground-floor shop awnings / signage strips
    const awningColors = [0x8b1a1a, 0x1a3a5c, 0x2a4a1a, 0x4a3a1a];
    specs.slice(0, 8).forEach((s, i) => {
      const aw = new THREE.Mesh(
        new THREE.BoxGeometry(s.w, 0.4, 1.2),
        new THREE.MeshLambertMaterial({ color: awningColors[i % 4] }),
      );
      aw.position.set(s.x, 3.2, s.z + s.d / 2 + 0.5);
      this.scene.add(aw);
    });
  }

  // ── 5.18 Protest Scene (1980.5.27 새벽) ──────────────────────────────────

  private buildProtestScene(): void {
    this.buildVehicleBarricades();
    this.buildDebrisAndFurniture();
    this.buildProtestBanners();
    this.buildFires();
    this.buildMilitaryVehicles();
  }

  private buildVehicleBarricades(): void {
    // Overturned/burned civilian buses and trucks blocking 금남로

    const busColor  = new THREE.MeshLambertMaterial({ color: 0x5a4a30 }); // charred
    const truckMat  = new THREE.MeshLambertMaterial({ color: 0x4a5038 }); // civilian truck
    const glassMat  = new THREE.MeshLambertMaterial({ color: 0x1a2820, transparent: true, opacity: 0.4 });

    // City bus 1 — overturned on its side blocking western half
    this.overturnedBus(-18, 0, 17, busColor, glassMat, 0.08);

    // City bus 2 — partially across road
    this.overturnedBus(10, 0, 19, busColor, glassMat, -0.12);

    // Truck sideways
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.8, 2.4), truckMat);
    t1.position.set(-4, 1.4, 21);
    t1.rotation.y = Math.PI / 2 + 0.15;
    t1.castShadow = true;
    this.scene.add(t1);

    // Taxi crushed
    const taxi = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 1.8), new THREE.MeshLambertMaterial({ color: 0x6a3a1a }));
    taxi.position.set(22, 0.75, 18);
    taxi.rotation.y = 0.6;
    taxi.castShadow = true;
    this.scene.add(taxi);

    // Sandbag walls flanking plaza entry
    const sbMat = new THREE.MeshLambertMaterial({ color: 0x7a6840 });
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      g.position.set(-38 + i * 1.05, 0.14 + Math.floor(i / 4) * 0.27, 14.5);
      g.rotation.y = (i % 3) * 0.25;
      const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.92, 4, 8), sbMat);
      bag.rotation.z = Math.PI / 2;
      bag.castShadow = true;
      g.add(bag);
      this.scene.add(g);
    }
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      g.position.set(38 - i * 1.05, 0.14 + Math.floor(i / 4) * 0.27, 14.5);
      g.rotation.y = -(i % 3) * 0.25;
      const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.92, 4, 8), sbMat);
      bag.rotation.z = Math.PI / 2;
      bag.castShadow = true;
      g.add(bag);
      this.scene.add(g);
    }
  }

  private overturnedBus(
    x: number, y: number, z: number,
    mat: THREE.MeshLambertMaterial,
    glassMat: THREE.MeshLambertMaterial,
    tilt: number,
  ): void {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 10.5), mat);
    body.position.set(x, y + 1.6, z);
    body.rotation.z = tilt + Math.PI / 2; // on its side
    body.castShadow = true;
    this.scene.add(body);

    // Wheel remnants
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    for (const dz of [-3.5, 3.5]) {
      for (const side of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x + side * (1.5 + 0.15), y + 0.5, z + dz);
        this.scene.add(wheel);
      }
    }
  }

  private buildDebrisAndFurniture(): void {
    // Overturned desks, chairs, concrete blocks used as barricades
    const concMat = new THREE.MeshLambertMaterial({ color: 0x888880 });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x6a4a28 });

    const debrisItems: Array<{ x: number; z: number; w: number; h: number; d: number; mat: THREE.MeshLambertMaterial; ry: number }> = [
      { x: -12, z: 15.5, w: 0.6, h: 0.7, d: 1.2, mat: woodMat, ry: 0.3 },  // desk
      { x:  -8, z: 16.0, w: 0.5, h: 0.5, d: 0.5, mat: woodMat, ry: -0.5 }, // chair
      { x:  -5, z: 14.8, w: 1.5, h: 0.5, d: 0.5, mat: concMat, ry: 0.1 },  // concrete block
      { x:   2, z: 15.5, w: 1.5, h: 0.5, d: 0.5, mat: concMat, ry: -0.2 },
      { x:   8, z: 14.5, w: 0.6, h: 0.7, d: 1.2, mat: woodMat, ry: 0.7 },
      { x:  14, z: 15.8, w: 1.5, h: 0.5, d: 0.5, mat: concMat, ry: 0.4 },
      { x: -25, z: 15.0, w: 1.2, h: 0.4, d: 0.5, mat: concMat, ry: -0.1 },
      { x:  26, z: 15.2, w: 1.2, h: 0.4, d: 0.5, mat: concMat, ry: 0.5 },
    ];

    for (const d of debrisItems) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), d.mat);
      m.position.set(d.x, d.h / 2, d.z);
      m.rotation.y = d.ry;
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
    }

    // Broken glass scattered on ground (dark thin planes)
    const glMat = new THREE.MeshBasicMaterial({ color: 0x334444, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 18; i++) {
      const shard = new THREE.Mesh(new THREE.PlaneGeometry(0.3 + (i % 4) * 0.2, 0.2 + (i % 3) * 0.15), glMat);
      shard.rotation.x = -Math.PI / 2;
      shard.rotation.z = i * 0.7;
      shard.position.set(-30 + i * 3.5, 0.02, 16 + (i % 3) * 1.5);
      this.scene.add(shard);
    }
  }

  private buildProtestBanners(): void {
    const bannerData: Array<{ x: number; y: number; z: number; w: number; ry: number; color: number; text?: boolean }> = [
      { x:  0,  y: 8,  z: 15,  w: 22, ry: 0,            color: 0xcc1111 }, // red banner across road
      { x:  0,  y: 5,  z: 14,  w: 18, ry: 0,            color: 0xeeeecc }, // white banner
      { x: -43, y: 7,  z: 20,  w: 12, ry: Math.PI / 2,  color: 0xcc1111 }, // on left building
      { x:  43, y: 7,  z: 20,  w: 12, ry: -Math.PI / 2, color: 0x112244 }, // on right building
      { x: -20, y: 3.5,z: 14,  w:  8, ry: 0,            color: 0xeeeecc },
      { x:  20, y: 3.5,z: 14,  w:  8, ry: 0,            color: 0xcc1111 },
    ];

    const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });

    for (const b of bannerData) {
      const bMat = mat.clone();
      bMat.color.setHex(b.color);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(b.w, 0.75), bMat);
      mesh.position.set(b.x, b.y, b.z);
      mesh.rotation.y = b.ry;
      this.scene.add(mesh);

      // Banner hanging rope (thin box)
      const rope = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, 0.05, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x554433 }),
      );
      rope.position.set(b.x, b.y + 0.4, b.z);
      rope.rotation.y = b.ry;
      this.scene.add(rope);
    }

    // Flags on plaza lamp posts / poles
    const flagMat = new THREE.MeshLambertMaterial({ color: 0xcc2222, side: THREE.DoubleSide });
    for (const x of [-35, -25, 25, 35]) {
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), flagMat);
      flag.position.set(x, 5, 15.5);
      this.scene.add(flag);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 5.5, 6),
        new THREE.MeshLambertMaterial({ color: 0x888888 }),
      );
      pole.position.set(x, 2.75, 15.5);
      this.scene.add(pole);
    }
  }

  private buildFires(): void {
    // 화재 위치 대폭 확대 — 도청 광장 앞까지 불길이 번진 상태
    const firePositions: Array<{ x: number; z: number; scale?: number }> = [
      { x: -18, z: 17, scale: 1.8 },   // bus 1 — 크게 타오름
      { x:  10, z: 19, scale: 1.5 },   // bus 2
      { x:  -4, z: 21, scale: 1.2 },   // truck
      { x:  24, z: 22, scale: 1.0 },   // debris
      { x: -30, z: 28, scale: 1.3 },   // background left
      { x:  30, z: 26, scale: 1.1 },   // background right
      { x:   0, z: 12, scale: 0.9 },   // 광장 입구 바리케이드
      { x: -10, z:  8, scale: 0.7 },   // 도청 계단 앞 잔해
    ];

    for (const { x, z, scale = 1 } of firePositions) {
      this.addFire(x, z, scale);
    }
  }

  private addFire(x: number, z: number, scale = 1): void {
    const fire1 = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const fire2 = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const fire3 = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.5 * scale, 7, 5), fire1);
    f1.position.set(x, 2.2 * scale, z);
    this.scene.add(f1);

    const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.0 * scale, 6, 4), fire2);
    f2.position.set(x, 3.8 * scale, z);
    this.scene.add(f2);

    const f3 = new THREE.Mesh(new THREE.SphereGeometry(0.6 * scale, 5, 4), fire3);
    f3.position.set(x, 5.2 * scale, z);
    this.scene.add(f3);

    // 강렬한 화재 포인트라이트 — 어두운 밤에 주요 광원 역할
    const light = new THREE.PointLight(0xff3300, 5.0 * scale, 22);
    light.position.set(x, 3.0, z);
    this.scene.add(light);

    // 더 짙은 연기 기둥
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x222222, transparent: true, opacity: 0.55, depthWrite: false,
    });
    for (let i = 0; i < 8; i++) {
      const sm = new THREE.Mesh(
        new THREE.SphereGeometry((1.5 + i * 1.2) * scale, 7, 5),
        smokeMat.clone(),
      );
      (sm.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, 0.55 - i * 0.06);
      sm.position.set(x + (i % 3 - 1) * 1.2, 6 + i * 3.5, z + (i % 2) * 0.8);
      this.scene.add(sm);
    }
  }

  private buildMilitaryVehicles(): void {
    // Army APCs and trucks visible south of the road (approaching)
    const armyMat = new THREE.MeshLambertMaterial({ color: 0x3a4a28 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222820 });

    // 탱크와 APC가 도청을 향해 진격 중 — 훨씬 가까이
    const formations: Array<{ x: number; z: number }> = [
      { x: -25, z: 38 },
      { x:   0, z: 40 },
      { x:  25, z: 38 },
      { x: -12, z: 50 },
      { x:  12, z: 50 },
    ];

    for (const { x, z } of formations) {
      // APC hull
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 5), armyMat);
      hull.position.set(x, 0.9, z);
      hull.castShadow = true;
      this.scene.add(hull);

      // Turret — cylinder base + hemisphere dome
      const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 0.45, 12), armyMat);
      turretBase.position.set(x, 1.98, z);
      this.scene.add(turretBase);
      const turretDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.68, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        armyMat,
      );
      turretDome.position.set(x, 2.21, z);
      this.scene.add(turretDome);

      // Gun barrel
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2, 6),
        darkMat,
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(x, 2.3, z - 1.5);
      this.scene.add(barrel);

      // Tracks
      for (const side of [-1.5, 1.5]) {
        const track = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 5.2), darkMat);
        track.position.set(x + side, 0.5, z);
        this.scene.add(track);
      }

      // Headlight glow
      const light = new THREE.PointLight(0xffe8b0, 0.6, 8);
      light.position.set(x, 1.5, z - 3);
      this.scene.add(light);
    }

    // 탱크 — 도청 코앞까지 진격
    const tankMat = new THREE.MeshLambertMaterial({ color: 0x2e3a20 });
    const tank = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.6, 7), tankMat);
    tank.position.set(5, 0.8, 45);
    tank.castShadow = true;
    this.scene.add(tank);

    // Tank turret — cylinder base + hemisphere dome
    const tTurretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.22, 0.55, 16), tankMat);
    tTurretBase.position.set(5, 1.88, 45);
    this.scene.add(tTurretBase);
    const tTurretDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      tankMat,
    );
    tTurretDome.position.set(5, 2.16, 45);
    this.scene.add(tTurretDome);

    const tBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8),
      darkMat,
    );
    tBarrel.rotation.x = Math.PI / 2;
    tBarrel.position.set(5, 2.2, 40);
    this.scene.add(tBarrel);
  }

  // 광장과 도청 진입로 조명 — 불빛으로 방향을 알 수 있게
  private addPlazaLights(): void {
    const { BZ } = this;

    // 도청 계단 앞 불꽃 — 진입 경로 표시
    this.addFire(-5, BZ + 9.5, 0.5);
    this.addFire(5, BZ + 9.5, 0.5);

    // 광장 중앙로 가로등 역할 불꽃들
    const pathLights: Array<[number, number]> = [
      [0, -5], [0, 0], [0, 5],
    ];
    for (const [x, z] of pathLights) {
      const l = new THREE.PointLight(0xff5500, 1.4, 15);
      l.position.set(x, 3, z);
      this.scene.add(l);
    }
  }

  private addInteriorLights(): void {
    const { BZ } = this;

    // 비상 랜턴 — 중앙홀 (더 밝게)
    const hall = new THREE.PointLight(0xff6600, 1.2, 25);
    hall.position.set(0, 3.0, BZ);
    this.scene.add(hall);

    // 창문 너머 화염 반사 — 광장 쪽 창가
    const fireReflect = new THREE.PointLight(0xff4400, 1.8, 20);
    fireReflect.position.set(0, 2.5, BZ + 5);
    this.scene.add(fireReflect);

    // 왼쪽 날개 복도 랜턴
    const lanternL = new THREE.PointLight(0xff8833, 0.9, 14);
    lanternL.position.set(-10, 2.0, BZ);
    this.scene.add(lanternL);

    // 오른쪽 날개 복도 랜턴
    const lanternR = new THREE.PointLight(0xff8833, 0.9, 14);
    lanternR.position.set(10, 2.0, BZ);
    this.scene.add(lanternR);

    // 입구 복도 (전면 출입구 안쪽)
    const entrance = new THREE.PointLight(0xff5500, 1.0, 14);
    entrance.position.set(0, 2.0, BZ + 5.5);
    this.scene.add(entrance);

    // 후방 복도
    const back = new THREE.PointLight(0xff6622, 0.6, 12);
    back.position.set(0, 2.0, BZ - 4);
    this.scene.add(back);
  }
}
