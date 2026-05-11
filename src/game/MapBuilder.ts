import * as THREE from "three";

export class MapBuilder {
  private readonly BZ = -40;

  private readonly matBuilding = new THREE.MeshLambertMaterial({ color: 0xd4c5a9 });
  private readonly matStone = new THREE.MeshLambertMaterial({ color: 0xb8aa95 });
  private readonly matRoof = new THREE.MeshLambertMaterial({ color: 0x6a7a6a });
  private readonly matPlaza = new THREE.MeshLambertMaterial({ color: 0xc8c0b0 });
  private readonly matRoad = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
  private readonly matWindow = new THREE.MeshLambertMaterial({ color: 0x2a3a50 });
  private readonly matDoor = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  private readonly matTrunk = new THREE.MeshLambertMaterial({ color: 0x5c3d1a });
  private readonly matLeaves = new THREE.MeshLambertMaterial({ color: 0x2d5a1b });
  private readonly matPole = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
  private readonly matFlag = new THREE.MeshLambertMaterial({ color: 0xcd2e3a, side: THREE.DoubleSide });
  private readonly matWater = new THREE.MeshLambertMaterial({ color: 0x4488aa, transparent: true, opacity: 0.75 });
  private readonly matSidewalk = new THREE.MeshLambertMaterial({ color: 0xa8a098 });
  private readonly matPath = new THREE.MeshLambertMaterial({ color: 0xd0c8b8 });
  private readonly matGrass = new THREE.MeshLambertMaterial({ color: 0x4a6830 });
  private readonly matMark = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private readonly matCurb = new THREE.MeshLambertMaterial({ color: 0x888888 });

  constructor(private scene: THREE.Scene) {
    this.buildGrassPatches();
    this.buildProvincialHall();
    this.buildInterior();
    this.buildPlaza();
    this.buildFountain();
    this.buildFlagpoles();
    this.buildRoad();
    this.buildTrees();
    this.buildCityBuildings();
    this.buildProtestScene();
    this.addInteriorLights();
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
      this.cyl(0.35, 0.4, 10, 10, this.matBuilding, cx, 5, BZ + 7.5); // shaft
      this.box(0.95, 0.5, 0.95, this.matStone, cx, 10.25, BZ + 7.5); // capital
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
    // Burning vehicles / debris — emissive orange glow + smoke
    const firePositions: Array<{ x: number; z: number }> = [
      { x: -18, z: 17 },  // bus 1
      { x:  10, z: 19 },  // bus 2
      { x:  -4, z: 21 },  // truck
      { x:  24, z: 22 },  // debris
      { x: -30, z: 28 },  // background
    ];

    for (const { x, z } of firePositions) {
      this.addFire(x, z);
    }
  }

  private addFire(x: number, z: number): void {
    // Base glow
    const fire1 = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    const fire2 = new THREE.MeshBasicMaterial({ color: 0xff8800 });

    const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 7, 5), fire1);
    f1.position.set(x, 2.2, z);
    this.scene.add(f1);

    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), fire2);
    f2.position.set(x, 3.2, z);
    this.scene.add(f2);

    const f3 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffdd00 }));
    f3.position.set(x, 4.0, z);
    this.scene.add(f3);

    // Point light for glow effect
    const light = new THREE.PointLight(0xff4400, 1.5, 10);
    light.position.set(x, 2.5, z);
    this.scene.add(light);

    // Smoke column
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x444444, transparent: true, opacity: 0.22, depthWrite: false,
    });
    for (let i = 0; i < 6; i++) {
      const sm = new THREE.Mesh(
        new THREE.SphereGeometry(1.2 + i * 0.9, 7, 5),
        smokeMat.clone(),
      );
      (sm.material as THREE.MeshBasicMaterial).opacity = 0.22 - i * 0.03;
      sm.position.set(x + (i % 3 - 1) * 0.8, 5 + i * 2.8, z + (i % 2) * 0.6);
      this.scene.add(sm);
    }
  }

  private buildMilitaryVehicles(): void {
    // Army APCs and trucks visible south of the road (approaching)
    const armyMat = new THREE.MeshLambertMaterial({ color: 0x3a4a28 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222820 });

    const formations: Array<{ x: number; z: number }> = [
      { x: -25, z: 50 },
      { x:   0, z: 52 },
      { x:  25, z: 50 },
      { x: -12, z: 62 },
      { x:  12, z: 62 },
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

    // Tank further back
    const tankMat = new THREE.MeshLambertMaterial({ color: 0x2e3a20 });
    const tank = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.6, 7), tankMat);
    tank.position.set(5, 0.8, 78);
    tank.castShadow = true;
    this.scene.add(tank);

    // Tank turret — cylinder base + hemisphere dome
    const tTurretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.22, 0.55, 16), tankMat);
    tTurretBase.position.set(5, 1.88, 78);
    this.scene.add(tTurretBase);
    const tTurretDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      tankMat,
    );
    tTurretDome.position.set(5, 2.16, 78);
    this.scene.add(tTurretDome);

    const tBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8),
      darkMat,
    );
    tBarrel.rotation.x = Math.PI / 2;
    tBarrel.position.set(5, 2.2, 73);
    this.scene.add(tBarrel);
  }

  private addInteriorLights(): void {
    const { BZ } = this;
    // Warm dim light inside the main hall
    const hall = new THREE.PointLight(0xfff0d0, 0.6, 22);
    hall.position.set(0, 4.5, BZ);
    this.scene.add(hall);

    // Cooler blue light near windows (simulates outside sky)
    const win = new THREE.PointLight(0xd0e8ff, 0.3, 14);
    win.position.set(0, 2.5, BZ + 5);
    this.scene.add(win);
  }
}
