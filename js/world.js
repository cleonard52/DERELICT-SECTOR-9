// DERELICT: SECTOR 9 - Interconnected Ship World, Biomes & 3-Act Infection Mutations
const TILE_SIZE = 32;
const ROOM_COLS = 30; // 960px
const ROOM_ROWS = 17; // 544px

const BIOMES = {
  cryo: {
    name: "CRYO-DECK // DECK A",
    color: "#5cc8ff",
    bgTop: "#06101c",
    bgBot: "#0b1e30",
    wall: "#1e3a52",
    trim: "#4682a8",
    hazard: "#ff3b5c",
    darkDefault: false
  },
  hydro: {
    name: "OVERGROWN HYDROPONICS // DECK B",
    color: "#4dff7c",
    bgTop: "#05140d",
    bgBot: "#0c291b",
    wall: "#17422c",
    trim: "#368f5d",
    hazard: "#7cff4d",
    darkDefault: false
  },
  reactor: {
    name: "MAGMA REACTOR CORE // DECK C",
    color: "#ff8c33",
    bgTop: "#1a0904",
    bgBot: "#331207",
    wall: "#471f12",
    trim: "#b84e1d",
    hazard: "#ff6600",
    darkDefault: false
  },
  hull: {
    name: "ZERO-G EXTERIOR HULL // OUTER RING",
    color: "#b8c7d9",
    bgTop: "#010205",
    bgBot: "#050914",
    wall: "#2d3748",
    trim: "#718096",
    hazard: "#38f2ff",
    lowGrav: true,
    darkDefault: false
  },
  biolab: {
    name: "SUB-LEVEL BIO-LABS // SECTOR 9",
    color: "#ff2a4b",
    bgTop: "#120307",
    bgBot: "#24060e",
    wall: "#3d0c19",
    trim: "#8f1d38",
    hazard: "#ff1a40",
    darkDefault: true
  }
};

class WorldManager {
  constructor() {
    this.rooms = {};
    this.visited = new Set();
    this.collectedItems = new Set();
    this.defeatedBosses = new Set();
    this.breakersFixed = new Set();
    this.infectionAct = 1;
    this.buildShipArchitecture();
  }

  // Tile Legend:
  // '.' = empty, '#' = solid bulkhead, '=' = one-way platform, '^' = hazard spikes/acid/lava
  // 'V' = breakable organic/rusted barrier (Plasma Cutter / Overcharge)
  // 'L' = laser grid (requires Phase Dash)
  // 'M' = magma jet (can be frozen solid with Cryo-Blaster)
  // 'D' = clearance locked door (1, 2, 3)
  // 'S' = Save & Recharge Pod, 'T' = Crew Black-Box Terminal, 'B' = Power Breaker
  buildShipArchitecture() {
    const layoutSpecs = [
      // ================= CRYO-DECK (Hub - Grid Y: 0..2, X: 2..6) =================
      { id: "cryo_01", gx: 4, gy: 0, biome: "cryo", title: "CRYO-POD BAY 01",
        exits: { right: "cryo_02" },
        savePod: { x: 160, y: 448 },
        terminals: [{ x: 340, y: 448, logId: 0 }],
        enemies: [{ type: "drone", x: 640, y: 380 }],
        act2Enemies: [{ type: "mutant", x: 600, y: 448 }],
        act3Enemies: [{ type: "stalker_spawn", x: 550, y: 448 }],
        template: "hub_start"
      },
      { id: "cryo_02", gx: 5, gy: 0, biome: "cryo", title: "CENTRAL ELEVATOR UPPER",
        exits: { left: "cryo_01", right: "cryo_03", down: "cryo_05" },
        terminals: [{ x: 480, y: 256, logId: 1 }],
        enemies: [{ type: "drone", x: 300, y: 200 }, { type: "turret", x: 820, y: 128 }],
        template: "shaft_upper"
      },
      { id: "cryo_03", gx: 6, gy: 0, biome: "cryo", title: "OBSERVATION AIRLOCK",
        exits: { left: "cryo_02", right: "hull_01" },
        gateRight: { req: "thruster", label: "ZERO-G AIRLOCK [THRUSTER / KEY LV.2]" },
        items: [{ id: "etank_cryo1", type: "etank", x: 780, y: 160, req: "mag" }],
        enemies: [{ type: "crawler", x: 500, y: 448 }],
        template: "corridor_high"
      },
      { id: "cryo_04", gx: 3, gy: 1, biome: "cryo", title: "CREW QUARTERS WEST",
        exits: { right: "cryo_05", left: "hydro_01" },
        terminals: [{ x: 240, y: 448, logId: 2 }],
        items: [{ id: "mod_rapid", type: "module", mod: "rapid", name: "RAPID CAPACITOR", x: 140, y: 192, req: "dash" }],
        enemies: [{ type: "corpse_ambush", x: 450, y: 448 }, { type: "drone", x: 680, y: 220 }],
        template: "quarters"
      },
      { id: "cryo_05", gx: 4, gy: 1, biome: "cryo", title: "MAIN JUNCTION SHAFT",
        exits: { up: "cryo_02", left: "cryo_04", right: "cryo_06", down: "reactor_01" },
        savePod: { x: 480, y: 448 },
        enemies: [{ type: "crawler", x: 260, y: 320 }],
        template: "junction_cross"
      },
      { id: "cryo_06", gx: 5, gy: 1, biome: "cryo", title: "SECURITY ARMORY",
        exits: { left: "cryo_05", right: "cryo_07" },
        terminals: [{ x: 620, y: 448, logId: 3 }],
        items: [{ id: "key_1", type: "key", level: 1, name: "SECURITY KEYCARD LV.1", x: 760, y: 448 }],
        enemies: [{ type: "turret", x: 480, y: 96 }, { type: "mutant", x: 660, y: 448 }],
        template: "armory"
      },
      { id: "cryo_07", gx: 6, gy: 1, biome: "cryo", title: "ESCAPE SHUTTLE HANGAR",
        exits: { left: "cryo_06" },
        isShuttle: true,
        terminals: [{ x: 520, y: 448, logId: 19 }],
        enemies: [],
        template: "hangar"
      },

      // ================= OVERGROWN HYDROPONICS (Grid X: 0..2, Y: 1..3) =================
      { id: "hydro_01", gx: 2, gy: 1, biome: "hydro", title: "BIODOME ENTRY ATRIUM",
        exits: { right: "cryo_04", left: "hydro_02", down: "hydro_04" },
        terminals: [{ x: 460, y: 448, logId: 4 }],
        enemies: [{ type: "crawler", x: 350, y: 448 }, { type: "spitter", x: 700, y: 256 }],
        template: "hydro_atrium"
      },
      { id: "hydro_02", gx: 1, gy: 1, biome: "hydro", title: "CANOPY WALKWAYS",
        exits: { right: "hydro_01", left: "hydro_03" },
        items: [{ id: "etank_hydro1", type: "etank", x: 220, y: 160 }],
        enemies: [{ type: "spitter", x: 420, y: 192 }, { type: "drone", x: 620, y: 320 }],
        template: "canopy"
      },
      { id: "hydro_03", gx: 0, gy: 1, biome: "hydro", title: "ROOT-MAW BIODOME",
        exits: { right: "hydro_02", down: "hydro_06" },
        boss: { id: "boss_rootmaw", name: "THE ROOT-MAW", reward: "dash", rewardName: "PHASE DASH MODULE", triggersAct: 2 },
        savePod: { x: 820, y: 448 },
        template: "boss_arena"
      },
      { id: "hydro_04", gx: 2, gy: 2, biome: "hydro", title: "IRRIGATION RESERVOIR",
        exits: { up: "hydro_01", left: "hydro_05", right: "reactor_02" },
        terminals: [{ x: 500, y: 288, logId: 5 }],
        enemies: [{ type: "crawler", x: 320, y: 448 }, { type: "spitter", x: 680, y: 448 }],
        template: "acid_basins"
      },
      { id: "hydro_05", gx: 1, gy: 2, biome: "hydro", title: "SPORE VENTILATION SHAFT",
        exits: { right: "hydro_04", left: "hydro_06" },
        items: [{ id: "mod_wide", type: "module", mod: "wide", name: "WIDE-ARC DIFFUSER", x: 480, y: 192, req: "dash" }],
        enemies: [{ type: "mutant", x: 340, y: 448 }, { type: "spitter", x: 640, y: 192 }],
        template: "laser_gauntlet"
      },
      { id: "hydro_06", gx: 0, gy: 2, biome: "hydro", title: "DEEP BOTANICAL VAULT",
        exits: { up: "hydro_03", right: "hydro_05" },
        terminals: [{ x: 300, y: 448, logId: 6 }],
        items: [{ id: "etank_hydro2", type: "etank", x: 180, y: 448 }],
        enemies: [{ type: "corpse_ambush", x: 520, y: 448 }],
        template: "vault_room"
      },

      // ================= MAGMA REACTOR CORE (Grid X: 3..6, Y: 2..3) =================
      { id: "reactor_01", gx: 4, gy: 2, biome: "reactor", title: "THERMAL EXCHANGE UPPER",
        exits: { up: "cryo_05", left: "reactor_02", right: "reactor_03", down: "reactor_05" },
        terminals: [{ x: 300, y: 448, logId: 7 }],
        enemies: [{ type: "turret", x: 200, y: 128 }, { type: "mutant", x: 650, y: 448 }],
        template: "reactor_hub"
      },
      { id: "reactor_02", gx: 3, gy: 2, biome: "reactor", title: "COOLANT CONDUIT WEST",
        exits: { left: "hydro_04", right: "reactor_01" },
        breakerId: "brk_reactor_west",
        terminals: [{ x: 480, y: 288, logId: 8 }],
        enemies: [{ type: "drone", x: 360, y: 200 }, { type: "mutant", x: 700, y: 448 }],
        template: "magma_bridge"
      },
      { id: "reactor_03", gx: 5, gy: 2, biome: "reactor", title: "PLASMA TURBINE GALLERY",
        exits: { left: "reactor_01", right: "reactor_04" },
        items: [{ id: "etank_reac1", type: "etank", x: 480, y: 160, req: "dash" }],
        enemies: [{ type: "turret", x: 300, y: 96 }, { type: "turret", x: 660, y: 96 }, { type: "mutant", x: 520, y: 448 }],
        template: "laser_gauntlet"
      },
      { id: "reactor_04", gx: 6, gy: 2, biome: "reactor", title: "FOUNDRY CHAMBER 09",
        exits: { left: "reactor_03", down: "reactor_07" },
        boss: { id: "boss_cauterizer", name: "CAUTERIZER-09", reward: "cryo", rewardName: "CRYO-BLASTER", triggersAct: 0 },
        savePod: { x: 140, y: 448 },
        template: "boss_arena"
      },
      { id: "reactor_05", gx: 4, gy: 3, biome: "reactor", title: "LOWER FUSION INTAKE",
        exits: { up: "reactor_01", left: "reactor_06", right: "reactor_07", down: "biolab_01" },
        gateDown: { req: "cryo", label: "SUPERHEATED HATCH [CRYO-BLASTER REQUIRED]" },
        terminals: [{ x: 600, y: 448, logId: 9 }],
        enemies: [{ type: "crawler", x: 320, y: 448 }, { type: "mutant", x: 720, y: 448 }],
        template: "magma_shaft"
      },
      { id: "reactor_06", gx: 3, gy: 3, biome: "reactor", title: "AUXILIARY POWER SUBSTATION",
        exits: { right: "reactor_05" },
        terminals: [{ x: 260, y: 448, logId: 10 }],
        items: [{ id: "key_2", type: "key", level: 2, name: "COMMAND KEYCARD LV.2", x: 160, y: 256 }],
        enemies: [{ type: "corpse_ambush", x: 460, y: 448 }, { type: "turret", x: 760, y: 128 }],
        template: "substation"
      },
      { id: "reactor_07", gx: 5, gy: 3, biome: "reactor", title: "OVERFLOW MAGMA VENT",
        exits: { up: "reactor_04", left: "reactor_05" },
        items: [{ id: "mod_thermal", type: "module", mod: "thermal", name: "THERMAL & BATTERY CORE", x: 760, y: 448, req: "cryo" }],
        enemies: [{ type: "spitter", x: 400, y: 256 }],
        template: "magma_bridge"
      },

      // ================= ZERO-G EXTERIOR HULL (Grid X: 7..10, Y: 0..1) =================
      { id: "hull_01", gx: 7, gy: 0, biome: "hull", title: "PORT HULL CATWALK",
        exits: { left: "cryo_03", right: "hull_02" },
        terminals: [{ x: 320, y: 448, logId: 11 }],
        enemies: [{ type: "drone", x: 480, y: 220 }, { type: "drone", x: 720, y: 300 }],
        template: "hull_walk"
      },
      { id: "hull_02", gx: 8, gy: 0, biome: "hull", title: "SOLAR ARRAY SCAFFOLD",
        exits: { left: "hull_01", right: "hull_03", down: "hull_04" },
        items: [{ id: "etank_hull1", type: "etank", x: 480, y: 128 }],
        enemies: [{ type: "turret", x: 640, y: 160 }, { type: "stalker_spawn", x: 520, y: 448 }],
        template: "hull_gaps"
      },
      { id: "hull_03", gx: 9, gy: 0, biome: "hull", title: "VOID-LEECH BREACH POINT",
        exits: { left: "hull_02", down: "hull_05" },
        boss: { id: "boss_leviathan", name: "THE VOID-LEECH LEVIATHAN", reward: "thruster", rewardName: "THRUSTER PACK", triggersAct: 3 },
        savePod: { x: 140, y: 448 },
        template: "boss_arena"
      },
      { id: "hull_04", gx: 8, gy: 1, biome: "hull", title: "OBSERVATORY DOME",
        exits: { up: "hull_02", right: "hull_05" },
        terminals: [{ x: 460, y: 448, logId: 12 }, { x: 640, y: 448, logId: 13 }],
        items: [{ id: "mod_radar", type: "module", mod: "radar", name: "DEEP-SCAN RADAR & ARMOR", x: 200, y: 224 }],
        enemies: [{ type: "mutant", x: 520, y: 448 }],
        template: "observatory"
      },
      { id: "hull_05", gx: 9, gy: 1, biome: "hull", title: "STARBOARD SENSOR MAST",
        exits: { up: "hull_03", left: "hull_04" },
        items: [{ id: "etank_hull2", type: "etank", x: 780, y: 160, req: "thruster" }],
        terminals: [{ x: 340, y: 448, logId: 14 }],
        enemies: [{ type: "drone", x: 420, y: 180 }, { type: "stalker_spawn", x: 680, y: 448 }],
        template: "hull_gaps"
      },

      // ================= SUB-LEVEL BIO-LABS (Grid X: 3..6, Y: 4..5) =================
      { id: "biolab_01", gx: 4, gy: 4, biome: "biolab", title: "QUARANTINE AIRLOCK 09",
        exits: { up: "reactor_05", left: "biolab_02", right: "biolab_03" },
        savePod: { x: 480, y: 448 },
        terminals: [{ x: 300, y: 448, logId: 15 }],
        enemies: [{ type: "stalker_spawn", x: 700, y: 448 }],
        template: "biolab_entry"
      },
      { id: "biolab_02", gx: 3, gy: 4, biome: "biolab", title: "SPECIMEN CONTAINMENT",
        exits: { right: "biolab_01", down: "biolab_04" },
        terminals: [{ x: 420, y: 448, logId: 16 }],
        items: [{ id: "etank_bio1", type: "etank", x: 160, y: 192 }],
        enemies: [{ type: "mutant", x: 320, y: 448 }, { type: "corpse_ambush", x: 620, y: 448 }],
        template: "quarters"
      },
      { id: "biolab_03", gx: 5, gy: 4, biome: "biolab", title: "DARKNESS ISOLATION WARD",
        exits: { left: "biolab_01", right: "biolab_05" },
        boss: { id: "boss_stalker", name: "THE STALKER (PATIENT ZERO)", reward: "mag", rewardName: "MAG-BOOTS", triggersAct: 0 },
        terminals: [{ x: 780, y: 448, logId: 17 }],
        template: "boss_arena"
      },
      { id: "biolab_04", gx: 3, gy: 5, biome: "biolab", title: "GENETIC ARCHIVE VAULT",
        exits: { up: "biolab_02", right: "biolab_06" },
        breakerId: "brk_biolab_core",
        items: [{ id: "etank_bio2", type: "etank", x: 180, y: 448 }, { id: "key_3", type: "key", level: 3, name: "OMEGA CORE KEY LV.3", x: 480, y: 224 }],
        enemies: [{ type: "stalker_spawn", x: 540, y: 448 }, { type: "spitter", x: 740, y: 224 }],
        template: "vault_room"
      },
      { id: "biolab_05", gx: 6, gy: 4, biome: "biolab", title: "NEURAL CONDUIT SHAFT",
        exits: { left: "biolab_03", down: "biolab_07" },
        items: [{ id: "mod_omega", type: "module", mod: "omega", name: "OMEGA BEAM AMPLIFIER", x: 760, y: 160, req: "mag" }],
        enemies: [{ type: "turret", x: 480, y: 96 }, { type: "stalker_spawn", x: 520, y: 448 }],
        template: "shaft_upper"
      },
      { id: "biolab_06", gx: 4, gy: 5, biome: "biolab", title: "AMALGAM ANTECHAMBER",
        exits: { left: "biolab_04", right: "biolab_07" },
        savePod: { x: 480, y: 448 },
        terminals: [{ x: 640, y: 448, logId: 18 }],
        enemies: [{ type: "mutant", x: 260, y: 448 }, { type: "stalker_spawn", x: 740, y: 448 }],
        template: "biolab_entry"
      },
      { id: "biolab_07", gx: 5, gy: 5, biome: "biolab", title: "M.O.T.H.E.R.-9 CENTRAL CORE",
        exits: { up: "biolab_05", left: "biolab_06" },
        boss: { id: "boss_amalgam", name: "THE ACHERON AMALGAM", reward: "escape", rewardName: "CORE DESTABILIZED", triggersAct: 3 },
        template: "boss_arena"
      }
    ];

    layoutSpecs.forEach(spec => {
      spec.grid = this.generateTileGrid(spec);
      this.rooms[spec.id] = spec;
    });
  }

  generateTileGrid(spec) {
    // Build a 30x17 tile matrix with open doorways matching exits
    const g = Array.from({ length: ROOM_ROWS }, () => Array(ROOM_COLS).fill("."));

    // Outer hull walls
    for (let c = 0; c < ROOM_COLS; c++) {
      g[0][c] = "#";
      g[ROOM_ROWS - 1][c] = "#";
    }
    for (let r = 0; r < ROOM_ROWS; r++) {
      g[r][0] = "#";
      g[r][ROOM_COLS - 1] = "#";
    }

    // Carve Exits
    if (spec.exits.left) {
      for (let r = 11; r <= 14; r++) g[r][0] = ".";
    }
    if (spec.exits.right) {
      for (let r = 11; r <= 14; r++) g[r][ROOM_COLS - 1] = ".";
    }
    if (spec.exits.up) {
      for (let c = 13; c <= 16; c++) g[0][c] = ".";
    }
    if (spec.exits.down) {
      for (let c = 13; c <= 16; c++) g[ROOM_ROWS - 1][c] = ".";
    }

    // Add biome-flavored platforms & obstacles
    const t = spec.template;
    if (t === "hub_start") {
      for (let c = 18; c <= 24; c++) g[11][c] = "=";
      for (let c = 10; c <= 15; c++) g[8][c] = "=";
    } else if (t === "shaft_upper" || t === "junction_cross") {
      for (let c = 4; c <= 11; c++) g[12][c] = "=";
      for (let c = 18; c <= 25; c++) g[12][c] = "=";
      for (let c = 9; c <= 20; c++) g[8][c] = "=";
      for (let c = 5; c <= 11; c++) g[4][c] = "=";
      for (let c = 18; c <= 24; c++) g[4][c] = "=";
    } else if (t === "corridor_high" || t === "quarters" || t === "armory" || t === "hangar") {
      for (let c = 4; c <= 10; c++) g[11][c] = "=";
      for (let c = 19; c <= 25; c++) g[11][c] = "=";
      for (let c = 11; c <= 18; c++) g[7][c] = "=";
      if (t === "corridor_high") {
        for (let c = 22; c <= 27; c++) g[6][c] = "#";
      }
    } else if (t === "hydro_atrium" || t === "canopy") {
      for (let c = 5; c <= 11; c++) g[12][c] = "=";
      for (let c = 14; c <= 20; c++) g[9][c] = "=";
      for (let c = 6; c <= 12; c++) g[6][c] = "=";
      for (let c = 11; c <= 17; c++) g[ROOM_ROWS - 1][c] = "^";
    } else if (t === "acid_basins" || t === "magma_bridge" || t === "magma_shaft") {
      for (let c = 6; c <= 11; c++) g[ROOM_ROWS - 1][c] = "^";
      for (let c = 18; c <= 23; c++) g[ROOM_ROWS - 1][c] = "^";
      for (let c = 5; c <= 12; c++) g[12][c] = "=";
      for (let c = 17; c <= 24; c++) g[12][c] = "=";
      for (let c = 11; c <= 18; c++) g[8][c] = "=";
      if (t === "magma_bridge") {
        g[11][14] = "M"; g[12][14] = "M"; g[13][14] = "M"; g[14][14] = "M";
      }
    } else if (t === "laser_gauntlet") {
      for (let c = 6; c <= 23; c++) g[10][c] = "=";
      for (let r = 11; r <= 15; r++) g[r][11] = "L";
      for (let r = 11; r <= 15; r++) g[r][19] = "L";
    } else if (t === "hull_walk" || t === "hull_gaps" || t === "observatory") {
      for (let c = 8; c <= 12; c++) g[ROOM_ROWS - 1][c] = ".";
      for (let c = 17; c <= 21; c++) g[ROOM_ROWS - 1][c] = ".";
      for (let c = 7; c <= 13; c++) g[11][c] = "=";
      for (let c = 16; c <= 22; c++) g[11][c] = "=";
      for (let c = 11; c <= 18; c++) g[6][c] = "=";
    } else if (t === "boss_arena") {
      for (let c = 4; c <= 9; c++) g[11][c] = "=";
      for (let c = 20; c <= 25; c++) g[11][c] = "=";
      for (let c = 11; c <= 18; c++) g[8][c] = "=";
    } else {
      for (let c = 6; c <= 12; c++) g[11][c] = "=";
      for (let c = 17; c <= 23; c++) g[11][c] = "=";
      for (let c = 11; c <= 18; c++) g[7][c] = "=";
    }

    return g;
  }

  getRoom(id) {
    return this.rooms[id];
  }

  advanceInfectionAct(newAct) {
    if (newAct <= this.infectionAct) return false;
    this.infectionAct = newAct;
    SFX.setActAtmosphere(newAct);

    // Mutate earlier rooms dynamically as the outside infection breaches deeper
    Object.values(this.rooms).forEach(room => {
      if (newAct >= 2 && (room.biome === "cryo" || room.biome === "hydro")) {
        // Acid spore pools & organic growths appear in previously safe corridors
        if (room.id === "cryo_02" || room.id === "cryo_04") {
          room.grid[ROOM_ROWS - 1][10] = "^";
          room.grid[ROOM_ROWS - 1][11] = "^";
        }
      }
      if (newAct >= 3 && room.biome !== "hull") {
        // Power failures plunge early sectors into horror darkness
        room.act3Dark = true;
      }
    });
    return true;
  }
}
const WORLD = new WorldManager();
const SHIP_WORLD = {};

Object.values(WORLD.rooms).forEach((room) => {
  const rx = room.gx - 4;
  const ry = room.gy;
  const key = `${rx},${ry}`;
  room.name = room.title || room.id.toUpperCase();
  room.tiles = room.grid;
  room.save = room.savePod || null;
  room.pickups = room.items || [];
  room.doors = {
    left: !!(room.exits && room.exits.left),
    right: !!(room.exits && room.exits.right),
    up: !!(room.exits && room.exits.up),
    down: !!(room.exits && room.exits.down)
  };
  room.dark = !!(room.act3Dark || (BIOMES[room.biome] && BIOMES[room.biome].darkDefault));
  room.collidesRect = function(x, y, w, h) {
    const T = 32;
    const x1 = Math.floor(x / T), x2 = Math.floor((x + w - 0.1) / T);
    const y1 = Math.floor(y / T), y2 = Math.floor((y + h - 0.1) / T);
    for (let ty = y1; ty <= y2; ty++) {
      for (let tx = x1; tx <= x2; tx++) {
        if (!room.tiles[ty] || room.tiles[ty][tx] === undefined) return true;
        const t = room.tiles[ty][tx];
        if (t && t !== "." && t !== 0 && t !== "A" && t !== "^") return true;
      }
    }
    return false;
  };
  SHIP_WORLD[key] = room;
});

function getMutatedRoom(rx, ry, act, breakerFixed) {
  WORLD.advanceInfectionAct(act);
  const key = `${rx},${ry}`;
  const room = SHIP_WORLD[key] || SHIP_WORLD["0,0"];
  if (!room) return null;
  room.tiles = room.grid;
  room.dark = !!(room.act3Dark || (BIOMES[room.biome] && BIOMES[room.biome].darkDefault));
  return room;
}
