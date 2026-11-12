// DERELICT: SECTOR 9 — Procedural 16-Bit Pixel-Art & Tileset Generator
class PixelArtBank {
  constructor() {
    this.cache = {};
    this.initSprites();
  }

  createCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  // Draws an ASCII pixel grid onto an offscreen canvas at 2x retro pixel scale
  bakeGrid(key, grid, palette, scale = 2) {
    const h = grid.length;
    const w = grid[0].length;
    const c = this.createCanvas(w * scale, h * scale);
    const ctx = c.getContext("2d");
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = grid[y][x];
        if (ch !== "." && palette[ch]) {
          ctx.fillStyle = palette[ch];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    this.cache[key] = c;
    return c;
  }

  initSprites() {
    // 1. PLAYER SPRITE (VANCE — Salvage Containment Suit)
    const playerPal = {
      A: "#2a485e", // Dark armor
      B: "#4e809e", // Mid armor
      C: "#8ecae6", // Highlight
      V: "#38f2ff", // Glowing cyan visor
      G: "#ffb833", // Chest beacon
      W: "#64748b"  // Plasma cannon
    };

    this.bakeGrid("player_idle", [
      "....BBBB....",
      "...BCCCCB...",
      "...BVVVVB...",
      "...BAAAAb...",
      "..ABBBBBBA..",
      ".AABGAAWWA..",
      ".AABBBBBWW..",
      ".AA.BBBB....",
      "....B..B....",
      "...BA..AB...",
      "...BA..AB...",
      "..AAA..AAA.."
    ], playerPal, 3);

    this.bakeGrid("player_run1", [
      "....BBBB....",
      "...BCCCCB...",
      "...BVVVVB...",
      "...BAAAAb...",
      "..ABBBBBBA..",
      ".AABGAAWWA..",
      "..ABBBBBWW..",
      "....BBBB....",
      "..BB....BB..",
      ".BA......AB.",
      "AA........AA",
      "............"
    ], playerPal, 3);

    // 2. ENEMY: MAINTENANCE DRONE
    this.bakeGrid("drone", [
      "...GGGGGG...",
      "..GAAAAAAg..",
      ".GAARRRRAAG.",
      "GAAARRRRAAG.",
      ".GAAAAAAAAG.",
      "..G.G..G.G..",
      ".G........G."
    ], { G: "#64748b", A: "#1e293b", R: "#ff2a4b" }, 3);

    // 3. ENEMY: SPORE CRAWLER
    this.bakeGrid("crawler", [
      "....PPPP....",
      "..PPGGGGPP..",
      ".PGGGGGGGGP.",
      "PGGYYGGYYGGP",
      "PPPPPPPPPPPP",
      ".P..P..P..P.",
      "P..P....P..P"
    ], { P: "#581c87", G: "#4dff7c", Y: "#ffe64d" }, 3);

    // 4. ENEMY: ASSIMILATED CREW MUTANT (HORROR)
    this.bakeGrid("mutant", [
      "...RRRR.....",
      "..RFFFFR....",
      "..RFYYFR....",
      ".RRFFFFRRR..",
      "RR.FFFF.RRR.",
      "R..FFFF..R.R",
      "...F..F.....",
      "..FF..FF....",
      ".FF....FF...",
      "FF......FF.."
    ], { R: "#991b1b", F: "#ef4444", Y: "#fde047" }, 3);

    // 5. ENEMY: CEILING LURKER / STALKER
    this.bakeGrid("lurker", [
      "R..RRRRRR..R",
      ".RRAAAAAArr.",
      "..RAYYYYAR..",
      "...RAAAAR...",
      "..R.RRRR.R..",
      ".R........R.",
      "R..........R"
    ], { R: "#7f1d1d", A: "#18181b", Y: "#ff2a4b" }, 3);

    // 6. SAVE & RECHARGE POD
    this.bakeGrid("save_pod", [
      "..CCCCCCCC..",
      ".CBBBBBBBBC.",
      "CB........BC",
      "CB..GGGG..BC",
      "CB.GGGGGG.BC",
      "CB.GGGGGG.BC",
      "CB..GGGG..BC",
      "CB........BC",
      "CCCCCCCCCCCC",
      "AAAAAAAAAAAA"
    ], { C: "#38f2ff", B: "#164e63", G: "#4dff7c", A: "#334155" }, 4);

    // 7. DATA TERMINAL
    this.bakeGrid("terminal", [
      "..BBBBBB..",
      ".BCCCCCCB.",
      ".BCWWWWCB.",
      ".BCWWWWCB.",
      ".BCCCCCCB.",
      "..BBBBBB..",
      "...BBBB...",
      "..BBBBBB.."
    ], { B: "#334155", C: "#0284c7", W: "#38f2ff" }, 4);

    // 8. POWER BREAKER BOX
    this.bakeGrid("breaker", [
      ".AAAAAAAA.",
      "AYYYYYYYYA",
      "AYRRRRRRYA",
      "AYRRRRRRYA",
      "AYYYYYYYYA",
      ".AAAAAAAA."
    ], { A: "#475569", Y: "#f59e0b", R: "#ff2a4b" }, 4);

    // 9. PICKUP ORB (UPGRADES & TANKS)
    this.bakeGrid("pickup", [
      "...CCCC...",
      ".CCWWWWCC.",
      "CCWWWWWWCC",
      "CWWYYYYWWC",
      "CWWYYYYWWC",
      "CCWWWWWWCC",
      ".CCWWWWCC.",
      "...CCCC..."
    ], { C: "#0284c7", W: "#38f2ff", Y: "#ffffff" }, 3);
  }

  get(key) {
    return this.cache[key] || null;
  }

  // Draws procedural biome tiles with Act I / II / III infection mutations
  drawTile(ctx, type, x, y, size, biome, act) {
    // Biome palettes
    const palettes = {
      cryo:    { base: "#162638", trim: "#386890", hi: "#7dd3fc" },
      hydro:   { base: "#122b22", trim: "#25634b", hi: "#4dff7c" },
      reactor: { base: "#2e1710", trim: "#7c2d12", hi: "#fb923c" },
      hull:    { base: "#181d26", trim: "#475569", hi: "#cbd5e1" },
      biolab:  { base: "#240d18", trim: "#6b1d3a", hi: "#ff2a4b" }
    };
    const pal = palettes[biome] || palettes.cryo;

    if (type === 1) {
      // Solid Hull / Floor Block
      ctx.fillStyle = pal.base;
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = pal.trim;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

      // Rivets
      ctx.fillStyle = pal.hi;
      ctx.fillRect(x + 4, y + 4, 2, 2);
      ctx.fillRect(x + size - 6, y + size - 6, 2, 2);

      // Spreading Infection Overlay in Act II and Act III
      if (act >= 2 && ((x + y) % 64 === 0 || act === 3)) {
        ctx.fillStyle = act === 3 ? "rgba(185, 28, 28, 0.55)" : "rgba(153, 27, 27, 0.32)";
        ctx.fillRect(x, y, size, 6);
        ctx.fillStyle = "#ff2a4b";
        ctx.fillRect(x + 6, y + 2, 4, 4);
        if (act === 3) {
          ctx.fillRect(x + 18, y + 8, 3, 10);
        }
      }
    } else if (type === 2) {
      // One-way Metal Catwalk Platform
      ctx.fillStyle = pal.trim;
      ctx.fillRect(x, y, size, 8);
      ctx.fillStyle = pal.hi;
      ctx.fillRect(x, y, size, 2);
    } else if (type === 3) {
      // Hazard: Acid / Lava / Spore Pool
      ctx.fillStyle = biome === "reactor" ? "#ea580c" : "#16a34a";
      ctx.fillRect(x, y + 8, size, size - 8);
      ctx.fillStyle = biome === "reactor" ? "#fde047" : "#4dff7c";
      ctx.fillRect(x, y + 8, size, 4);
    } else if (type === 4) {
      // Breakable Rusted Grate / Organic Membrane
      ctx.fillStyle = act >= 2 ? "#7f1d1d" : "#78350f";
      ctx.fillRect(x + 2, y, size - 4, size);
      ctx.strokeStyle = act >= 2 ? "#ff2a4b" : "#d97706";
      ctx.strokeRect(x + 4, y + 2, size - 8, size - 4);
    } else if (type === 5) {
      // Laser Security Grid (Requires Phase Dash)
      ctx.fillStyle = "rgba(255, 42, 75, 0.28)";
      ctx.fillRect(x + 10, y, 12, size);
      ctx.fillStyle = "#ff2a4b";
      ctx.fillRect(x + 14, y, 4, size);
    } else if (type === 6) {
      // Mag-Rail Ceiling / Wall (For Mag-Boots)
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = "#38f2ff";
      ctx.fillRect(x + 4, y + 4, size - 8, 4);
    }
  }
}

const ART = new PixelArtBank();
