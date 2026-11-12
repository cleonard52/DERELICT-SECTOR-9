// Main Game Engine, Physics, Flashlight Shader, Auto-Map & Save System
class DerelictEngine {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.mapCanvas = document.getElementById("mapCanvas");
    this.mapCtx = this.mapCanvas.getContext("2d");

    this.lightCanvas = document.createElement("canvas");
    this.lightCanvas.width = 960;
    this.lightCanvas.height = 540;
    this.lightCtx = this.lightCanvas.getContext("2d");

    this.keys = {};
    this.justPressed = {};
    this.state = "TITLE"; // TITLE, PLAYING, LOG, MAP, PAUSE, END
    this.lastTime = 0;

    this.resetGameState();
    this.bindEvents();
    this.checkSavedSignal();
    requestAnimationFrame((t) => this.loop(t));
  }

  resetGameState() {
    this.act = 1;
    this.playtime = 0;
    this.escapeActive = false;
    this.escapeTimer = 120.0;
    this.breakerFixed = false;

    this.visitedRooms = new Set(["0,0"]);
    this.collectedIds = new Set();
    this.readLogs = new Set();
    this.defeatedBosses = new Set();
    this.roomEnemies = {};
    this.roomProjectiles = [];
    this.particles = [];
    this.activeBoss = null;

    this.player = {
      rx: 0,
      ry: 0,
      x: 160,
      y: 380,
      w: 22,
      h: 36,
      vx: 0,
      vy: 0,
      dir: 1,
      aimY: 0,
      onGround: false,
      onWall: 0,
      onCeiling: false,
      jumpsUsed: 0,
      hp: 100,
      maxHp: 100,
      battery: 100,
      flashlightOn: true,
      weapon: "PLASMA", // PLASMA or CRYO
      plasmaLevel: 1,
      fireCooldown: 0,
      dashTimer: 0,
      dashCooldown: 0,
      invuln: 0,
      frame: 0,
      animTimer: 0,
      upgrades: {
        dash: false,
        cryo: false,
        thrust: false,
        mag: false,
        thermal: false,
        voidArmor: false,
        radarBoost: false,
        clearance: 0
      }
    };

    this.currentRoom = null;
    this.loadRoom(0, 0, 160, 380);
  }

  bindEvents() {
    window.addEventListener("keydown", (e) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;
      this.handleGlobalKeys(e.code);
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    document.getElementById("btn-new-game").onclick = () => {
      SFX.init();
      this.resetGameState();
      this.state = "PLAYING";
      document.getElementById("title-screen").classList.add("hidden");
      this.openLog("log_01");
    };

    document.getElementById("btn-continue").onclick = () => {
      SFX.init();
      if (this.loadFromLocal()) {
        this.state = "PLAYING";
        document.getElementById("title-screen").classList.add("hidden");
      }
    };

    document.getElementById("btn-close-log").onclick = () => this.closeModal("log-modal");
    document.getElementById("btn-close-map").onclick = () => this.closeModal("map-modal");
    document.getElementById("btn-resume").onclick = () => this.closeModal("pause-modal");

    document.getElementById("btn-quit-title").onclick = () => {
      this.closeModal("pause-modal");
      this.state = "TITLE";
      document.getElementById("title-screen").classList.remove("hidden");
      this.checkSavedSignal();
    };

    document.getElementById("btn-end-title").onclick = () => {
      document.getElementById("end-modal").classList.add("hidden");
      this.state = "TITLE";
      document.getElementById("title-screen").classList.remove("hidden");
      this.checkSavedSignal();
    };

    document.getElementById("btn-reload-save").onclick = () => {
      document.getElementById("end-modal").classList.add("hidden");
      if (this.loadFromLocal()) {
        this.state = "PLAYING";
      } else {
        this.resetGameState();
        this.state = "PLAYING";
      }
    };

    document.getElementById("btn-export-save").onclick = () => this.exportSaveFile();
    document.getElementById("btn-import-title").onclick = () => {
      document.getElementById("import-file-input").click();
    };
    document.getElementById("import-file-input").onchange = (e) => this.importSaveFile(e);
  }

  handleGlobalKeys(code) {
    if (this.state === "PLAYING") {
      if (code === "KeyM" || code === "Tab") {
        this.openMap();
      } else if (code === "Escape") {
        this.openPause();
      } else if (code === "KeyF") {
        this.player.flashlightOn = !this.player.flashlightOn;
        SFX.playTone(this.player.flashlightOn ? 720 : 320, 480, 0.06, "sine", 0.08);
      } else if (code === "KeyK" || code === "KeyX") {
        if (this.player.upgrades.cryo) {
          this.player.weapon = this.player.weapon === "PLASMA" ? "CRYO" : "PLASMA";
          SFX.playTone(600, 800, 0.07, "triangle", 0.08);
        }
      }
    } else if (this.state === "LOG") {
      if (code === "KeyE" || code === "Enter" || code === "Escape") {
        this.closeModal("log-modal");
      }
    } else if (this.state === "MAP") {
      if (code === "KeyM" || code === "Tab" || code === "Escape") {
        this.closeModal("map-modal");
      }
    } else if (this.state === "PAUSE") {
      if (code === "Escape") {
        this.closeModal("pause-modal");
      }
    }
  }

  closeModal(id) {
    document.getElementById(id).classList.add("hidden");
    this.state = "PLAYING";
  }

  openLog(logId, customTitle = null, customMeta = null, customBody = null) {
    this.state = "LOG";
    const entry = typeof CREW_LOGS !== "undefined" ? CREW_LOGS[logId] : null;
    if (entry) {
      this.readLogs.add(logId);
      document.getElementById("log-header").textContent = entry.title;
      document.getElementById("log-meta").textContent = `${entry.author} // ${entry.time}`;
      document.getElementById("log-body").textContent = entry.text;
    } else {
      document.getElementById("log-header").textContent = customTitle || "SYSTEM TRANSMISSION";
      document.getElementById("log-meta").textContent = customMeta || "USCSS ACHERON";
      document.getElementById("log-body").textContent = customBody || "";
    }
    document.getElementById("log-modal").classList.remove("hidden");
  }

  openMap() {
    this.state = "MAP";
    this.renderFullMap();
    const itemPct = Math.min(100, Math.round((this.collectedIds.size / 22) * 100));
    document.getElementById("map-stats").textContent =
      `PLAYTIME: ${this.formatTime(this.playtime)} | ITEMS: ${this.collectedIds.size}/22 (${itemPct}%) | LOGS: ${this.readLogs.size}/20`;
    document.getElementById("map-modal").classList.remove("hidden");
  }

  openPause() {
    this.state = "PAUSE";
    const p = this.player;
    document.getElementById("pause-summary").textContent =
      `CURRENT ACT: ACT ${this.act}\n` +
      `PLAYTIME: ${this.formatTime(this.playtime)}\n` +
      `SUIT INTEGRITY: ${Math.ceil(p.hp)} / ${p.maxHp}\n` +
      `PLASMA LEVEL: LV.${p.plasmaLevel} | CLEARANCE: LV.${p.upgrades.clearance}\n` +
      `BOSSES NEUTRALIZED: ${this.defeatedBosses.size} / 5\n` +
      `ROOMS EXPLORED: ${this.visitedRooms.size} / ${Object.keys(SHIP_WORLD).length}`;
    document.getElementById("pause-modal").classList.remove("hidden");
  }

  loadRoom(rx, ry, spawnX = null, spawnY = null) {
    const key = `${rx},${ry}`;
    const room = getMutatedRoom(rx, ry, this.act, this.breakerFixed);
    if (!room) return;

    this.player.rx = rx;
    this.player.ry = ry;
    this.currentRoom = room;
    this.visitedRooms.add(key);
    this.roomProjectiles = [];
    this.particles = [];

    if (spawnX !== null) this.player.x = spawnX;
    if (spawnY !== null) this.player.y = spawnY;

    // Spawn enemies for this room
    this.roomEnemies[key] = (room.enemies || []).map((e) => createEnemy(e.type, e.x, e.y, this.act));

    // Check for sector boss
    this.activeBoss = null;
    const bossHud = document.getElementById("boss-hud");
    if (room.boss && !this.defeatedBosses.has(room.boss)) {
      this.activeBoss = createBoss(room.boss);
      document.getElementById("boss-name").textContent = this.activeBoss.name;
      bossHud.classList.remove("hidden");
      SFX.playBossRoar();
    } else {
      bossHud.classList.add("hidden");
    }

    // Update HUD sector banner
    document.getElementById("sector-name").textContent = `${room.biome} // ${room.name}`;
    this.updateActBanner();
  }

  updateActBanner() {
    const el = document.getElementById("act-indicator");
    el.className = "";
    if (this.act === 1) {
      el.textContent = "ACT I: CONTAINMENT BREACH";
    } else if (this.act === 2) {
      el.textContent = "ACT II: STRUCTURAL COLLAPSE";
      el.classList.add("act-2");
    } else {
      el.textContent = "ACT III: TOTAL ASSIMILATION";
      el.classList.add("act-3");
    }
    SFX.setActAtmosphere(this.act);
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0.016);
    this.lastTime = timestamp;

    if (this.state === "PLAYING") {
      this.update(dt);
      this.render();
    }

    this.justPressed = {};
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.playtime += dt;
    const p = this.player;
    const room = this.currentRoom;
    if (!room) return;

    // Self-destruct escape countdown
    if (this.escapeActive) {
      this.escapeTimer -= dt;
      document.getElementById("escape-timer").textContent = this.formatEscape(this.escapeTimer);
      if (this.escapeTimer <= 0) {
        this.triggerGameOver("REACTOR DETONATED", "The USCSS Acheron vaporized before you reached the Cryo-Deck escape shuttle.");
        return;
      }
      // Check if player reached starting escape pod room (0,0)
      if (p.rx === 0 && p.ry === 0 && p.x < 180) {
        this.triggerVictory();
        return;
      }
    }

    // Environmental heat hazard in Reactor Core without thermal shield
    if (room.hazard === "HEAT" && !p.upgrades.thermal) {
      p.hp -= 4.5 * dt;
    }

    // Battery drain & recharge
    if (p.flashlightOn && room.dark) {
      p.battery = Math.max(0, p.battery - 1.6 * dt);
      if (p.battery === 0) p.flashlightOn = false;
    } else {
      p.battery = Math.min(100, p.battery + 3.2 * dt);
    }

    // Movement input
    const left = this.keys["KeyA"] || this.keys["ArrowLeft"];
    const right = this.keys["KeyD"] || this.keys["ArrowRight"];
    const up = this.keys["KeyW"] || this.keys["ArrowUp"];
    const down = this.keys["KeyS"] || this.keys["ArrowDown"];
    const jumpPressed = this.justPressed["Space"] || this.justPressed["KeyW"] || this.justPressed["ArrowUp"];
    const jumpHeld = this.keys["Space"] || this.keys["KeyW"] || this.keys["ArrowUp"];
    const fireHeld = this.keys["KeyJ"] || this.keys["KeyZ"];
    const dashPressed = this.justPressed["ShiftLeft"] || this.justPressed["ShiftRight"] || this.justPressed["KeyL"] || this.justPressed["KeyC"];
    const interactPressed = this.justPressed["KeyE"] || this.justPressed["Enter"];

    p.aimY = up ? -1 : down && !p.onGround ? 1 : 0;

    // Dash logic
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (dashPressed && p.upgrades.dash && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      p.dashTimer = 0.22;
      p.dashCooldown = 0.65;
      p.invuln = 0.26;
      p.vy = 0;
      SFX.playDash();
    }

    const grav = room.lowGrav ? 420 : 1120;
    const moveSpeed = 235;

    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = p.dir * 620;
      this.spawnParticle(p.x + p.w / 2, p.y + p.h / 2, "#38f2ff", 0.2);
    } else {
      if (left) {
        p.vx = -moveSpeed;
        p.dir = -1;
      } else if (right) {
        p.vx = moveSpeed;
        p.dir = 1;
      } else {
        p.vx *= 0.72;
        if (Math.abs(p.vx) < 8) p.vx = 0;
      }

      // Mag-Boots wall/ceiling cling
      if (p.upgrades.mag && p.onWall !== 0 && !p.onGround && (left || right)) {
        p.vy = up ? -160 : down ? 180 : 0;
        p.jumpsUsed = 0;
      } else if (p.upgrades.mag && p.onCeiling && up) {
        p.vy = 0;
        p.jumpsUsed = 0;
      } else {
        p.vy += grav * dt;
        // Thruster hover
        if (p.upgrades.thrust && jumpHeld && p.vy > 70 && p.jumpsUsed >= 2) {
          p.vy = 70;
          this.spawnParticle(p.x + p.w / 2, p.y + p.h, "#ffb833", 0.15);
        }
      }

      // Jump & Double Jump
      const maxJumps = p.upgrades.thrust ? 2 : 1;
      if (jumpPressed && (p.onGround || p.onWall !== 0 || p.onCeiling || p.jumpsUsed < maxJumps)) {
        p.vy = room.lowGrav ? -360 : -470;
        if (p.onWall !== 0 && !p.onGround) {
          p.vx = -p.onWall * 280;
        }
        p.onGround = false;
        p.onCeiling = false;
        p.jumpsUsed++;
        SFX.playJump();
      }
    }

    // Move & Tile Collisions
    this.moveAndCollidePlayer(dt);

    // Animation frame
    if (Math.abs(p.vx) > 20) {
      p.animTimer += dt;
      if (p.animTimer > 0.12) {
        p.animTimer = 0;
        p.frame = (p.frame + 1) % 4;
      }
    } else {
      p.frame = 0;
    }

    // Weapon Firing
    if (p.fireCooldown > 0) p.fireCooldown -= dt;
    if (fireHeld && p.fireCooldown <= 0) {
      this.firePlayerWeapon();
    }

    if (p.invuln > 0) p.invuln -= dt;

    // Room Transitions at screen edges
    this.checkRoomTransitions();

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Enemies & Boss
    this.updateEnemiesAndBoss(dt);

    // Update Particles
    this.particles = this.particles.filter((pt) => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      return pt.life > 0;
    });

    // Check Interactables (Save Pods, Logs, Pickups, Breakers)
    this.checkInteractables(interactPressed);

    // Update Motion Tracker & HUD
    this.updateMotionTracker();
    this.updateHUD();

    if (p.hp <= 0) {
      this.triggerGameOver("SUIT INTEGRITY CRITICAL", "The infection claimed another host aboard the USCSS Acheron.");
    }
  }

  moveAndCollidePlayer(dt) {
    const p = this.player;
    const T = 32;
    p.onWall = 0;
    p.onCeiling = false;

    // Horizontal
    p.x += p.vx * dt;
    this.resolveTileCollisions(true);

    // Vertical
    p.onGround = false;
    p.y += p.vy * dt;
    this.resolveTileCollisions(false);
  }

  resolveTileCollisions(horizontal) {
    const p = this.player;
    const grid = this.currentRoom.tiles;
    const T = 32;

    const leftTile = Math.floor(p.x / T);
    const rightTile = Math.floor((p.x + p.w - 0.1) / T);
    const topTile = Math.floor(p.y / T);
    const bottomTile = Math.floor((p.y + p.h - 0.1) / T);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (ty < 0 || ty >= grid.length || tx < 0 || tx >= grid[0].length) continue;
        const tile = grid[ty][tx];
        if (!tile || tile === ".") continue;

        // Hazard tiles (Acid / Lava / Spores)
        if (tile === "A" || tile === "L") {
          if (tile === "L" && p.upgrades.thermal) {
            // Thermal shield protects against lava heat, still solid floor
          } else {
            this.damagePlayer(14);
          }
        }

        // Solid & Gate tiles
        if (this.isTileSolid(tile)) {
          if (horizontal) {
            if (p.vx > 0) {
              p.x = tx * T - p.w;
              p.onWall = 1;
            } else if (p.vx < 0) {
              p.x = (tx + 1) * T;
              p.onWall = -1;
            }
            p.vx = 0;
          } else {
            if (p.vy > 0) {
              p.y = ty * T - p.h;
              p.onGround = true;
              p.jumpsUsed = 0;
            } else if (p.vy < 0) {
              p.y = (ty + 1) * T;
              p.onCeiling = true;
            }
            p.vy = 0;
          }
        }
      }
    }
  }

  isTileSolid(tile) {
    if (["#", "M", "B", "F", "1", "2", "3", "R"].includes(tile)) return true;
    // Laser barrier ("G") can be phased through during Phase Dash
    if (tile === "G") return this.player.dashTimer <= 0;
    return false;
  }

  firePlayerWeapon() {
    const p = this.player;
    const isCryo = p.weapon === "CRYO";
    p.fireCooldown = isCryo ? 0.28 : Math.max(0.11, 0.24 - p.plasmaLevel * 0.035);

    let vx = p.dir * 580;
    let vy = 0;
    if (p.aimY !== 0) {
      vy = p.aimY * 580;
      if (!this.keys["KeyA"] && !this.keys["KeyD"] && !this.keys["ArrowLeft"] && !this.keys["ArrowRight"]) {
        vx = 0;
      }
    }

    const dmg = isCryo ? 12 : 14 + p.plasmaLevel * 8;
    this.roomProjectiles.push({
      x: p.x + p.w / 2 + p.dir * 10,
      y: p.y + p.h * 0.42,
      vx,
      vy,
      r: isCryo ? 6 : 4 + p.plasmaLevel,
      dmg,
      isCryo,
      fromPlayer: true,
      life: 1.1
    });

    SFX.playShoot(isCryo);
  }

  updateProjectiles(dt) {
    const grid = this.currentRoom.tiles;
    const T = 32;
    const key = `${this.player.rx},${this.player.ry}`;
    const enemies = this.roomEnemies[key] || [];

    this.roomProjectiles = this.roomProjectiles.filter((proj) => {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      const tx = Math.floor(proj.x / T);
      const ty = Math.floor(proj.y / T);
      if (ty >= 0 && ty < grid.length && tx >= 0 && tx < grid[0].length) {
        const tile = grid[ty][tx];
        // Breakable organic/cracked wall ("B")
        if (tile === "B" && proj.fromPlayer) {
          grid[ty][tx] = ".";
          SFX.playHit();
          for (let i = 0; i < 8; i++) this.spawnParticle(proj.x, proj.y, "#ff2a4b", 0.35);
          return false;
        }
        // Freeze superheated vents/lava ("R") into solid ice platforms ("F")
        if (tile === "R" && proj.fromPlayer && proj.isCryo) {
          grid[ty][tx] = "F";
          SFX.playHit();
          return false;
        }
        if (tile && tile !== "." && tile !== "A") {
          this.spawnParticle(proj.x, proj.y, proj.isCryo ? "#38f2ff" : "#4dff7c", 0.15);
          return false;
        }
      }

      if (proj.fromPlayer) {
        // Hit standard enemies
        for (const en of enemies) {
          if (en.hp > 0 && this.rectOverlap(proj.x - proj.r, proj.y - proj.r, proj.r * 2, proj.r * 2, en.x, en.y, en.w, en.h)) {
            if (proj.isCryo) {
              en.frozen = 3.5;
            }
            en.hp -= proj.dmg;
            SFX.playHit();
            this.spawnParticle(proj.x, proj.y, proj.isCryo ? "#80f5ff" : "#ff4d6d", 0.25);
            return false;
          }
        }
        // Hit active boss
        if (this.activeBoss && this.activeBoss.hp > 0) {
          const b = this.activeBoss;
          if (this.rectOverlap(proj.x - proj.r, proj.y - proj.r, proj.r * 2, proj.r * 2, b.x, b.y, b.w, b.h)) {
            b.hp -= proj.dmg;
            if (proj.isCryo) b.slowTimer = 1.5;
            SFX.playHit();
            this.spawnParticle(proj.x, proj.y, "#ff2a4b", 0.25);
            return false;
          }
        }
      } else {
        // Enemy projectile hitting player
        const p = this.player;
        if (this.rectOverlap(proj.x - proj.r, proj.y - proj.r, proj.r * 2, proj.r * 2, p.x, p.y, p.w, p.h)) {
          this.damagePlayer(proj.dmg);
          return false;
        }
      }

      return proj.life > 0;
    });
  }

  updateEnemiesAndBoss(dt) {
    const key = `${this.player.rx},${this.player.ry}`;
    const enemies = this.roomEnemies[key] || [];
    const p = this.player;

    for (const en of enemies) {
      if (en.hp <= 0) continue;
      updateEnemy(en, p, this.currentRoom, dt, (proj) => this.roomProjectiles.push(proj));

      // Frozen enemies act as solid stepping platforms!
      if (en.frozen > 0) {
        if (p.vy >= 0 && p.y + p.h <= en.y + 12 && p.y + p.h + p.vy * dt >= en.y && p.x + p.w > en.x && p.x < en.x + en.w) {
          p.y = en.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.jumpsUsed = 0;
        }
      } else if (this.rectOverlap(p.x, p.y, p.w, p.h, en.x, en.y, en.w, en.h)) {
        this.damagePlayer(en.dmg || 12);
      }
    }

    // Active Boss logic
    if (this.activeBoss) {
      const b = this.activeBoss;
      if (b.hp > 0) {
        updateBoss(b, p, dt, (proj) => this.roomProjectiles.push(proj));
        document.getElementById("boss-hp-fill").style.width = `${Math.max(0, (b.hp / b.maxHp) * 100)}%`;

        if (this.rectOverlap(p.x, p.y, p.w, p.h, b.x, b.y, b.w, b.h)) {
          this.damagePlayer(b.dmg || 18);
        }
      } else {
        this.handleBossDefeated(b);
      }
    }
  }

  handleBossDefeated(b) {
    this.defeatedBosses.add(b.id);
    this.activeBoss = null;
    document.getElementById("boss-hud").classList.add("hidden");
    SFX.playPickup();

    // Grant boss upgrade & trigger Act progression
    if (b.id === "ROOT_MAW") {
      this.player.upgrades.dash = true;
      this.act = 2;
      document.getElementById("alarm-overlay").classList.add("active");
      this.openLog(null, "UPGRADE ACQUIRED: PHASE DASH", "WARNING: HULL INTEGRITY COMPROMISED — ACT II",
        "Press [SHIFT] or [L] to execute a high-speed phase burst, passing safely through laser security grids and enemy attacks.\n\nALERT: Outer tendrils have breached the upper decks. The infection is spreading.");
    } else if (b.id === "CAUTERIZER") {
      this.player.upgrades.cryo = true;
      this.player.weapon = "CRYO";
      this.openLog(null, "UPGRADE ACQUIRED: CRYO-BLASTER", "PRESS [K] OR [X] TO SWITCH BEAMS",
        "Sub-zero plasma projectiles freeze hostile organisms solid—turning them into elevated platforms—and cool superheated plasma vents.");
    } else if (b.id === "LEVIATHAN") {
      this.player.upgrades.thrust = true;
      this.act = 3;
      this.openLog(null, "UPGRADE ACQUIRED: THRUSTER PACK", "CRITICAL ALERT: TOTAL ASSIMILATION — ACT III",
        "Double-jump in midair and hold [SPACE] to hover across deep chasms.\n\nWARNING: Ship life-support failing. Biological growth has overtaken 70% of the vessel.");
    } else if (b.id === "STALKER") {
      this.player.upgrades.mag = true;
      this.openLog(null, "UPGRADE ACQUIRED: MAG-BOOTS", "ELECTROMAGNETIC ADHESION ONLINE",
        "Hold directional keys against metallic walls and ceilings to climb vertical shafts into the deepest quarantine core.");
    } else if (b.id === "AMALGAM") {
      this.escapeActive = true;
      this.escapeTimer = 120.0;
      document.getElementById("escape-hud").classList.remove("hidden");
      this.openLog(null, "M.O.T.H.E.R.-9 CORE DESTROYED", "SELF-DESTRUCT SEQUENCE INITIATED — 02:00.00",
        "The central hive-mind is collapsing! Race back up to the CRYO-DECK ESCAPE SHUTTLE (Room 0,0) before the reactor detonates!");
    }

    this.updateActBanner();
    this.saveToLocal();
  }

  checkRoomTransitions() {
    const p = this.player;
    if (p.x < 0) {
      this.loadRoom(p.rx - 1, p.ry, 920, p.y);
    } else if (p.x + p.w > 960) {
      this.loadRoom(p.rx + 1, p.ry, 18, p.y);
    } else if (p.y < 0) {
      this.loadRoom(p.rx, p.ry - 1, p.x, 490);
    } else if (p.y + p.h > 540) {
      this.loadRoom(p.rx, p.ry + 1, p.x, 18);
    }
  }

  checkInteractables(interactPressed) {
    const p = this.player;
    const room = this.currentRoom;
    const prompt = document.getElementById("prompt-banner");
    let promptText = null;

    // Auto-collectible items
    for (const item of room.items || []) {
      if (this.collectedIds.has(item.id)) continue;
      if (this.rectOverlap(p.x, p.y, p.w, p.h, item.x - 14, item.y - 14, 28, 28)) {
        this.collectedIds.add(item.id);
        SFX.playPickup();
        this.applyPickup(item);
      }
    }

    // Save / Recharge Pod
    if (room.savePod) {
      const sp = room.savePod;
      if (Math.hypot(p.x - sp.x, p.y - sp.y) < 48) {
        promptText = "[E] RECHARGE SUIT & SAVE SIGNAL";
        if (interactPressed) {
          p.hp = p.maxHp;
          p.battery = 100;
          this.saveToLocal();
          SFX.playSave();
          this.openLog(null, "RECHARGE POD // SIGNAL SAVED", `SECTOR: ${room.biome}`,
            "Suit integrity restored to 100%. Visor battery recharged. Expedition progress saved to local memory.");
        }
      }
    }

    // Story Terminal Logs
    for (const term of room.terminals || []) {
      if (Math.hypot(p.x - term.x, p.y - term.y) < 46) {
        promptText = `[E] ACCESS ${term.label || "DATA TERMINAL"}`;
        if (interactPressed) {
          SFX.playPickup();
          this.openLog(term.logId);
        }
      }
    }

    // Auxiliary Power Breaker Puzzle
    if (room.breaker && !this.breakerFixed) {
      const br = room.breaker;
      if (Math.hypot(p.x - br.x, p.y - br.y) < 48) {
        promptText = "[E] REROUTE AUXILIARY POWER BREAKER";
        if (interactPressed) {
          this.breakerFixed = true;
          SFX.playSave();
          this.openLog(null, "AUXILIARY POWER RESTORED", "REACTOR & BIO-LAB BULKHEADS UNLOCKED",
            "Emergency grid rerouted. Blast doors in the lower decks are now powered and accessible.");
        }
      }
    }

    // Locked Security Doors
    for (const door of room.doors || []) {
      if (Math.hypot(p.x - door.x, p.y - door.y) < 44) {
        if (p.upgrades.clearance >= door.level) {
          // Unlock door tiles in grid
          const tx = Math.floor(door.x / 32);
          const ty = Math.floor(door.y / 32);
          for (let dy = -1; dy <= 1; dy++) {
            if (room.tiles[ty + dy] && room.tiles[ty + dy][tx] === String(door.level)) {
              room.tiles[ty + dy][tx] = ".";
            }
          }
        } else {
          promptText = `LOCKED // REQUIRES CLEARANCE LV.${door.level}`;
        }
      }
    }

    if (promptText) {
      prompt.textContent = promptText;
      prompt.classList.remove("hidden");
    } else {
      prompt.classList.add("hidden");
    }
  }

  applyPickup(item) {
    const p = this.player;
    if (item.type === "ENERGY_TANK") {
      p.maxHp += 25;
      p.hp = p.maxHp;
      this.openLog(null, "ENERGY TANK ACQUIRED", "MAX SUIT INTEGRITY +25",
        `Suit structural capacity expanded to ${p.maxHp} HP and fully repaired.`);
    } else if (item.type === "PLASMA_UP") {
      p.plasmaLevel++;
      this.openLog(null, "PLASMA OVERCHARGER", `PLASMA CUTTER UPGRADED TO LV.${p.plasmaLevel}`,
        "Beam output, projectile mass, and cycling speed permanently increased.");
    } else if (item.type === "KEYCARD") {
      p.upgrades.clearance = Math.max(p.upgrades.clearance, item.level);
      this.openLog(null, `SECURITY KEYCARD LV.${item.level}`, "SECURITY CLEARANCE UPDATED",
        `You can now bypass Level ${item.level} encrypted bulkheads across the USCSS Acheron.`);
    } else if (item.type === "THERMAL") {
      p.upgrades.thermal = true;
      this.openLog(null, "THERMAL SHIELDING", "EXTREME HEAT PROTECTION ONLINE",
        "Your suit now resists ambient reactor heat and molten plasma conduits.");
    } else if (item.type === "VOID_ARMOR") {
      p.upgrades.voidArmor = true;
      this.openLog(null, "CHITIN-WEAVE VOID ARMOR", "DAMAGE REDUCTION +35%",
        "Reinforced hull plating mitigates incoming alien acid and physical trauma.");
    } else if (item.type === "RADAR_BOOST") {
      p.upgrades.radarBoost = true;
      this.openLog(null, "DEEP-SCAN MOTION MODULE", "TRACKER RANGE DOUBLED",
        "Detects dormant hostiles and cloaked stalkers through reinforced bulkheads.");
    }
  }

  damagePlayer(amount) {
    const p = this.player;
    if (p.invuln > 0 || p.dashTimer > 0) return;
    const mult = p.upgrades.voidArmor ? 0.65 : 1.0;
    p.hp = Math.max(0, p.hp - amount * mult);
    p.invuln = 0.85;
    SFX.playHurt();
    for (let i = 0; i < 10; i++) {
      this.spawnParticle(p.x + p.w / 2, p.y + p.h / 2, "#ff2a4b", 0.35);
    }
  }

  updateMotionTracker() {
    const key = `${this.player.rx},${this.player.ry}`;
    const enemies = (this.roomEnemies[key] || []).filter((e) => e.hp > 0);
    const maxRange = this.player.upgrades.radarBoost ? 650 : 380;
    let nearest = Infinity;

    for (const en of enemies) {
      const d = Math.hypot(en.x - this.player.x, en.y - this.player.y);
      if (d < nearest) nearest = d;
    }
    if (this.activeBoss && this.activeBoss.hp > 0) {
      nearest = Math.min(nearest, Math.hypot(this.activeBoss.x - this.player.x, this.activeBoss.y - this.player.y));
    }

    const box = document.getElementById("radar-box");
    const distEl = document.getElementById("radar-dist");
    if (nearest < maxRange) {
      const meters = Math.max(1, Math.round(nearest / 24));
      box.classList.add("danger");
      distEl.textContent = `SIGNAL: ${meters}M`;
      SFX.pingTimer -= 0.016;
      if (SFX.pingTimer <= 0) {
        const ratio = 1 - nearest / maxRange;
        SFX.playRadarPing(ratio);
        SFX.pingTimer = Math.max(0.22, 1.1 - ratio * 0.85);
      }
    } else {
      box.classList.remove("danger");
      distEl.textContent = "CLEAR";
    }
  }

  updateHUD() {
    const p = this.player;
    const hpPct = Math.max(0, (p.hp / p.maxHp) * 100);
    document.getElementById("hp-fill").style.width = `${hpPct}%`;
    document.getElementById("hp-text").textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    document.querySelector(".hp-bar").classList.toggle("low", hpPct <= 30);

    document.getElementById("bat-fill").style.width = `${p.battery}%`;
    document.getElementById("bat-text").textContent = `${Math.round(p.battery)}%`;

    const wEl = document.getElementById("weapon-display");
    if (p.weapon === "CRYO") {
      wEl.textContent = "CRYO-BLASTER [SUB-ZERO]";
      wEl.style.color = "#38f2ff";
    } else {
      wEl.textContent = `PLASMA CUTTER [LV.${p.plasmaLevel}]`;
      wEl.style.color = "#4dff7c";
    }

    document.getElementById("gear-dash").classList.toggle("locked", !p.upgrades.dash);
    document.getElementById("gear-cryo").classList.toggle("locked", !p.upgrades.cryo);
    document.getElementById("gear-thrust").classList.toggle("locked", !p.upgrades.thrust);
    document.getElementById("gear-mag").classList.toggle("locked", !p.upgrades.mag);
    document.getElementById("gear-key").textContent = `CLEARANCE: LV.${p.upgrades.clearance}`;

    const itemPct = Math.min(100, Math.round((this.collectedIds.size / 22) * 100));
    const mapPct = Math.min(100, Math.round((this.visitedRooms.size / Object.keys(SHIP_WORLD).length) * 100));
    document.getElementById("completion-stat").textContent = `ITEMS: ${itemPct}% | MAP: ${mapPct}%`;
  }

  render() {
    const ctx = this.ctx;
    const room = this.currentRoom;
    const p = this.player;

    // 1. Background & External Space Horror Tendrils
    ctx.fillStyle = room.bgColor || "#050911";
    ctx.fillRect(0, 0, 960, 540);
    this.renderBackgroundHorror(ctx, room);

    // 2. Render Room Tiles
    const T = 32;
    for (let y = 0; y < room.tiles.length; y++) {
      for (let x = 0; x < room.tiles[y].length; x++) {
        const tile = room.tiles[y][x];
        if (!tile || tile === ".") continue;
        drawTile(ctx, tile, x * T, y * T, T, room.biome, this.act);
      }
    }

    // 3. Render Save Pods, Terminals, Breakers & Pickups
    if (room.savePod) {
      drawSavePod(ctx, room.savePod.x, room.savePod.y, this.playtime);
    }
    for (const term of room.terminals || []) {
      drawTerminal(ctx, term.x, term.y, this.readLogs.has(term.logId));
    }
    if (room.breaker) {
      drawBreaker(ctx, room.breaker.x, room.breaker.y, this.breakerFixed);
    }
    for (const item of room.items || []) {
      if (!this.collectedIds.has(item.id)) {
        drawPickup(ctx, item.x, item.y, item.type, this.playtime);
      }
    }

    // 4. Render Enemies & Boss
    const key = `${p.rx},${p.ry}`;
    for (const en of this.roomEnemies[key] || []) {
      if (en.hp > 0) drawEnemy(ctx, en, this.playtime);
    }
    if (this.activeBoss && this.activeBoss.hp > 0) {
      drawBoss(ctx, this.activeBoss, this.playtime);
    }

    // 5. Render Player (Vance)
    if (p.invuln <= 0 || Math.floor(p.invuln * 20) % 2 === 0) {
      drawPlayer(ctx, p);
    }

    // 6. Render Projectiles & Particles
    for (const proj of this.roomProjectiles) {
      ctx.fillStyle = proj.fromPlayer ? (proj.isCryo ? "#38f2ff" : "#4dff7c") : "#ff2a4b";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }

    // 7. Horror Darkness & Visor Flashlight Cone
    if (room.dark || this.act === 3) {
      this.renderDarknessAndFlashlight(ctx, room, p);
    }
  }

  renderBackgroundHorror(ctx, room) {
    // Viewport windows showing outer space and encroaching crimson tendrils
    ctx.fillStyle = "#020408";
    ctx.fillRect(140, 90, 220, 140);
    ctx.fillRect(600, 90, 220, 140);
    ctx.strokeStyle = "#1c3142";
    ctx.lineWidth = 3;
    ctx.strokeRect(140, 90, 220, 140);
    ctx.strokeRect(600, 90, 220, 140);

    // Stars
    ctx.fillStyle = "#8ab4d0";
    for (let i = 0; i < 18; i++) {
      const sx = 150 + ((i * 73) % 200);
      const sy = 100 + ((i * 41) % 120);
      ctx.fillRect(sx, sy, 2, 2);
      ctx.fillRect(sx + 460, sy, 2, 2);
    }

    // Pulsing outer alien tendrils growing across windows by Act
    const pulse = Math.sin(this.playtime * 2.5) * 6;
    ctx.strokeStyle = this.act === 1 ? "#6e1122" : this.act === 2 ? "#a81832" : "#e6193c";
    ctx.lineWidth = this.act * 5;
    for (let w = 0; w < 2; w++) {
      const ox = w === 0 ? 140 : 600;
      ctx.beginPath();
      ctx.moveTo(ox, 230);
      ctx.bezierCurveTo(ox + 60, 170 + pulse, ox + 130, 140 - pulse, ox + 220, 95);
      ctx.stroke();
      if (this.act >= 2) {
        ctx.beginPath();
        ctx.moveTo(ox + 220, 230);
        ctx.bezierCurveTo(ox + 150, 160 - pulse, ox + 80, 130 + pulse, ox, 105);
        ctx.stroke();
      }
    }
  }

  renderDarknessAndFlashlight(ctx, room, p) {
    const lctx = this.lightCtx;
    lctx.globalCompositeOperation = "source-over";
    lctx.fillStyle = room.dark ? "rgba(2, 4, 7, 0.94)" : "rgba(6, 2, 4, 0.58)";
    lctx.fillRect(0, 0, 960, 540);

    lctx.globalCompositeOperation = "destination-out";

    // Ambient suit glow around player
    const px = p.x + p.w / 2;
    const py = p.y + p.h * 0.4;
    const aura = lctx.createRadialGradient(px, py, 10, px, py, 75);
    aura.addColorStop(0, "rgba(0,0,0,1)");
    aura.addColorStop(1, "rgba(0,0,0,0)");
    lctx.fillStyle = aura;
    lctx.beginPath();
    lctx.arc(px, py, 75, 0, Math.PI * 2);
    lctx.fill();

    // Directional Visor Flashlight Cone
    if (p.flashlightOn && p.battery > 0) {
      const angle = p.aimY !== 0 ? (p.aimY < 0 ? -Math.PI / 2 : Math.PI / 2) : p.dir === 1 ? 0 : Math.PI;
      const spread = 0.44;
      const len = 390;

      const grad = lctx.createRadialGradient(px, py, 12, px, py, len);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.75, "rgba(0,0,0,0.85)");
      grad.addColorStop(1, "rgba(0,0,0,0)");

      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.moveTo(px, py);
      lctx.arc(px, py, len, angle - spread, angle + spread);
      lctx.closePath();
      lctx.fill();
    }

    ctx.drawImage(this.lightCanvas, 0, 0);
  }

  renderFullMap() {
    const mctx = this.mapCtx;
    mctx.fillStyle = "#03060a";
    mctx.fillRect(0, 0, 760, 380);

    const biomeColors = {
      "CRYO-DECK": "#5cc8ff",
      "HYDROPONICS": "#4dff7c",
      "REACTOR CORE": "#ff8c33",
      "EXTERIOR HULL": "#b8c7d9",
      "SUB-LEVEL BIO-LABS": "#ff2a4b"
    };

    const cellW = 48;
    const cellH = 30;
    const offsetX = 110;
    const offsetY = 45;

    for (const key of this.visitedRooms) {
      const room = SHIP_WORLD[key];
      if (!room) continue;
      const [rx, ry] = key.split(",").map(Number);
      const sx = offsetX + rx * cellW;
      const sy = offsetY + ry * cellH;

      mctx.fillStyle = biomeColors[room.biome] || "#38f2ff";
      mctx.fillRect(sx + 2, sy + 2, cellW - 4, cellH - 4);

      if (room.savePod) {
        mctx.fillStyle = "#ffe64d";
        mctx.fillRect(sx + cellW / 2 - 4, sy + cellH / 2 - 4, 8, 8);
      }

      if (rx === this.player.rx && ry === this.player.ry) {
        mctx.strokeStyle = "#ffffff";
        mctx.lineWidth = 2;
        mctx.strokeRect(sx + 1, sy + 1, cellW - 2, cellH - 2);
      }
    }
  }

  spawnParticle(x, y, color, life) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 140,
      vy: (Math.random() - 0.5) * 140,
      color,
      life
    });
  }

  rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  formatEscape(sec) {
    const s = Math.max(0, sec);
    const m = Math.floor(s / 60);
    const rem = (s % 60).toFixed(2);
    return `${String(m).padStart(2, "0")}:${rem.padStart(5, "0")}`;
  }

  triggerGameOver(title, body) {
    this.state = "END";
    document.getElementById("end-title").textContent = title;
    document.getElementById("end-body").textContent = body;
    document.getElementById("end-modal").classList.remove("hidden");
  }

  triggerVictory() {
    this.state = "END";
    this.escapeActive = false;
    document.getElementById("escape-hud").classList.add("hidden");
    const itemPct = Math.min(100, Math.round((this.collectedIds.size / 22) * 100));
    const mapPct = Math.min(100, Math.round((this.visitedRooms.size / Object.keys(SHIP_WORLD).length) * 100));
    document.getElementById("end-title").textContent = "ESCAPE SHUTTLE LAUNCHED";
    document.getElementById("end-body").textContent =
      `You escaped the USCSS Acheron moments before the core detonated, severing the alien organism's path to Earth.\n\n` +
      `FINAL PLAYTIME: ${this.formatTime(this.playtime)}\n` +
      `ITEM COMPLETION: ${itemPct}%\n` +
      `MAP EXPLORED: ${mapPct}%\n` +
      `CREW LOGS RECOVERED: ${this.readLogs.size} / 20`;
    document.getElementById("end-modal").classList.remove("hidden");
  }

  serializeSave() {
    return {
      act: this.act,
      playtime: this.playtime,
      breakerFixed: this.breakerFixed,
      visitedRooms: Array.from(this.visitedRooms),
      collectedIds: Array.from(this.collectedIds),
      readLogs: Array.from(this.readLogs),
      defeatedBosses: Array.from(this.defeatedBosses),
      player: this.player
    };
  }

  applySaveData(data) {
    this.act = data.act || 1;
    this.playtime = data.playtime || 0;
    this.breakerFixed = !!data.breakerFixed;
    this.visitedRooms = new Set(data.visitedRooms || ["0,0"]);
    this.collectedIds = new Set(data.collectedIds || []);
    this.readLogs = new Set(data.readLogs || []);
    this.defeatedBosses = new Set(data.defeatedBosses || []);
    Object.assign(this.player, data.player);
    document.getElementById("alarm-overlay").classList.toggle("active", this.act >= 2);
    this.loadRoom(this.player.rx, this.player.ry, this.player.x, this.player.y);
  }

  saveToLocal() {
    localStorage.setItem("derelict_sector_9_save", JSON.stringify(this.serializeSave()));
    this.checkSavedSignal();
  }

  loadFromLocal() {
    const raw = localStorage.getItem("derelict_sector_9_save");
    if (!raw) return false;
    try {
      this.applySaveData(JSON.parse(raw));
      return true;
    } catch {
      return false;
    }
  }

  checkSavedSignal() {
    const hasSave = !!localStorage.getItem("derelict_sector_9_save");
    document.getElementById("btn-continue").disabled = !hasSave;
  }

  exportSaveFile() {
    const blob = new Blob([JSON.stringify(this.serializeSave(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sector9-save-act${this.act}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importSaveFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        SFX.init();
        this.applySaveData(data);
        this.saveToLocal();
        this.state = "PLAYING";
        document.getElementById("title-screen").classList.add("hidden");
      } catch {
        alert("Invalid save file.");
      }
    };
    reader.readAsText(file);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.GAME = new DerelictEngine();
});
