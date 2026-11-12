// Enemy AI & 5 Multi-Phase Sector Bosses for DERELICT: SECTOR 9

class Enemy {
  constructor(data) {
    this.type = data.type || "drone";
    this.x = data.x;
    this.y = data.y;
    this.w = 28;
    this.h = 28;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.hp = 30;
    this.maxHp = 30;
    this.damage = 12;
    this.frozenTimer = 0;
    this.hurtTimer = 0;
    this.aiTimer = Math.random() * 120;
    this.dormant = false;
    this.dead = false;
    this.setupStats();
  }

  setupStats() {
    switch (this.type) {
      case "drone":
        this.w = 28;
        this.h = 24;
        this.hp = this.maxHp = 28;
        this.damage = 10;
        break;
      case "turret":
        this.w = 26;
        this.h = 26;
        this.hp = this.maxHp = 45;
        this.damage = 14;
        break;
      case "crawler":
        this.w = 30;
        this.h = 24;
        this.hp = this.maxHp = 40;
        this.damage = 15;
        break;
      case "mutant":
        this.w = 26;
        this.h = 44;
        this.hp = this.maxHp = 65;
        this.damage = 20;
        this.dormant = true;
        break;
      case "stalker_mob":
        this.w = 32;
        this.h = 48;
        this.hp = this.maxHp = 95;
        this.damage = 26;
        break;
    }
  }

  takeDamage(amount, isCryo = false) {
    if (this.dead) return;
    this.dormant = false;
    this.hp -= amount;
    this.hurtTimer = 8;
    if (isCryo) {
      this.frozenTimer = 180;
    }
    SFX.playHit();
    if (this.hp <= 0) {
      this.dead = true;
    }
  }

  update(player, room, projectiles) {
    if (this.dead) return;
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.frozenTimer > 0) {
      this.frozenTimer--;
      return;
    }

    this.aiTimer++;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
    const dist = Math.hypot(dx, dy);

    if (this.type === "drone") {
      this.vx = Math.cos(this.aiTimer * 0.03) * 1.8;
      this.vy = Math.sin(this.aiTimer * 0.05) * 1.1;
      this.dir = this.vx >= 0 ? 1 : -1;
      this.moveAndCollide(room, false);
    } else if (this.type === "turret") {
      this.dir = dx >= 0 ? 1 : -1;
      if (dist < 420 && this.aiTimer % 110 === 0) {
        const ang = Math.atan2(dy, dx);
        projectiles.push({
          x: this.x + this.w / 2,
          y: this.y + this.h / 2,
          vx: Math.cos(ang) * 4.5,
          vy: Math.sin(ang) * 4.5,
          fromPlayer: false,
          damage: this.damage,
          color: "#ff5533",
          life: 140
        });
      }
    } else if (this.type === "crawler") {
      this.vx = this.dir * 1.6;
      this.vy += 0.45;
      const hitWall = this.moveAndCollide(room, true);
      if (hitWall) this.dir *= -1;
      if (dist < 320 && this.aiTimer % 130 === 0) {
        projectiles.push({
          x: this.x + this.w / 2,
          y: this.y + 8,
          vx: this.dir * 3.5,
          vy: -3.2,
          gravity: 0.14,
          fromPlayer: false,
          damage: this.damage,
          color: "#66ff66",
          life: 140
        });
      }
    } else if (this.type === "mutant") {
      if (this.dormant) {
        if (dist < 170) {
          this.dormant = false;
          SFX.playBossRoar();
        }
        return;
      }
      this.dir = dx >= 0 ? 1 : -1;
      this.vx = this.dir * (dist < 280 ? 2.9 : 1.3);
      this.vy += 0.48;
      if (this.onGround && dist < 220 && this.aiTimer % 75 === 0) {
        this.vy = -8.2;
      }
      this.moveAndCollide(room, true);
    } else if (this.type === "stalker_mob") {
      this.dir = dx >= 0 ? 1 : -1;
      this.vx = this.dir * (dist < 350 ? 3.5 : 1.6);
      this.vy += 0.45;
      if (this.onGround && Math.abs(dy) > 40 && this.aiTimer % 55 === 0) {
        this.vy = -9.5;
      }
      this.moveAndCollide(room, true);
    }
  }

  moveAndCollide(room, useGravity) {
    let hitWall = false;
    this.x += this.vx;
    if (room.collidesRect(this.x, this.y, this.w, this.h)) {
      this.x -= this.vx;
      hitWall = true;
    }
    this.y += this.vy;
    this.onGround = false;
    if (room.collidesRect(this.x, this.y, this.w, this.h)) {
      if (this.vy > 0) this.onGround = true;
      this.y -= this.vy;
      this.vy = 0;
    }
    return hitWall;
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    if (this.hurtTimer > 0 && this.hurtTimer % 2 === 0) {
      ctx.filter = "brightness(2.5)";
    } else if (this.frozenTimer > 0) {
      ctx.filter = "hue-rotate(150deg) brightness(1.4)";
    }

    if (this.type === "mutant" && this.dormant) {
      ctx.fillStyle = "#5c1b28";
      ctx.fillRect(this.x, this.y + this.h - 14, this.w + 10, 14);
      ctx.fillStyle = "#ff2a4b";
      ctx.fillRect(this.x + 8, this.y + this.h - 10, 4, 4);
      ctx.restore();
      return;
    }

    const spr = typeof Sprites !== "undefined" ? Sprites.getEnemy(this.type) : null;
    if (spr) {
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      ctx.scale(this.dir, 1);
      ctx.drawImage(spr, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = this.type === "drone" ? "#38f2ff" : "#ff2a4b";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    ctx.restore();
  }
}

class Boss {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = 96;
    this.h = 110;
    this.vx = 0;
    this.vy = 0;
    this.dir = -1;
    this.timer = 0;
    this.hurtTimer = 0;
    this.frozenTimer = 0;
    this.dead = false;
    this.phase = 1;
    this.setupBoss();
  }

  setupBoss() {
    const configs = {
      root_maw: {
        name: "THE ROOT-MAW // HULL BREACHER",
        hp: 360,
        w: 110,
        h: 130,
        reward: "dash",
        nextAct: 2,
        logId: "boss_root_maw"
      },
      cauterizer: {
        name: "CAUTERIZER-09 // ASSIMILATED MECH",
        hp: 520,
        w: 100,
        h: 96,
        reward: "cryo",
        nextAct: 0,
        logId: "boss_cauterizer"
      },
      leviathan: {
        name: "VOID-LEECH LEVIATHAN // EXTERIOR PARASITE",
        hp: 680,
        w: 130,
        h: 90,
        reward: "thrust",
        nextAct: 3,
        logId: "boss_leviathan"
      },
      stalker: {
        name: "PATIENT ZERO // THE STALKER",
        hp: 760,
        w: 54,
        h: 82,
        reward: "mag",
        nextAct: 0,
        logId: "boss_stalker"
      },
      amalgam: {
        name: "THE ACHERON AMALGAM // M.O.T.H.E.R.-9 CORE",
        hp: 1100,
        w: 150,
        h: 150,
        reward: "escape",
        nextAct: 0,
        logId: "boss_amalgam"
      }
    };
    const cfg = configs[this.id] || configs.root_maw;
    this.name = cfg.name;
    this.hp = this.maxHp = cfg.hp;
    this.w = cfg.w;
    this.h = cfg.h;
    this.reward = cfg.reward;
    this.nextAct = cfg.nextAct;
    this.logId = cfg.logId;
  }

  takeDamage(amount, isCryo = false) {
    if (this.dead) return;
    this.hp -= amount;
    this.hurtTimer = 6;
    if (isCryo) this.frozenTimer = 45;
    SFX.playHit();
    if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      SFX.playBossRoar();
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      SFX.playBossRoar();
    }
  }

  update(player, room, projectiles) {
    if (this.dead) return;
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.frozenTimer > 0) this.frozenTimer--;
    const speedMult = (this.frozenTimer > 0 ? 0.5 : 1) * (this.phase === 2 ? 1.35 : 1);
    this.timer += speedMult;

    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = px - cx;
    const dy = py - cy;
    this.dir = dx >= 0 ? 1 : -1;

    const tick = Math.floor(this.timer);

    if (this.id === "root_maw") {
      // Stationary biomech plant with spore volleys and sweeping vines
      this.y += Math.sin(this.timer * 0.04) * 0.6;
      if (tick % 85 === 0) {
        for (let i = -2; i <= 2; i++) {
          const ang = Math.atan2(dy, dx) + i * 0.22;
          projectiles.push({
            x: cx,
            y: cy,
            vx: Math.cos(ang) * 4.2,
            vy: Math.sin(ang) * 4.2,
            fromPlayer: false,
            damage: 16,
            color: "#7dff4d",
            life: 160
          });
        }
      }
      if (this.phase === 2 && tick % 140 === 0) {
        projectiles.push({
          x: 80,
          y: 455,
          vx: 6.2,
          vy: 0,
          fromPlayer: false,
          damage: 22,
          color: "#ff2a4b",
          life: 160
        });
      }
    } else if (this.id === "cauterizer") {
      // Spider-mech that charges and fires plasma arcs
      if (tick % 160 < 95) {
        this.vx = this.dir * 2.8 * speedMult;
      } else {
        this.vx = 0;
        if (tick % 18 === 0) {
          const ang = Math.atan2(dy, dx);
          projectiles.push({
            x: cx,
            y: cy - 10,
            vx: Math.cos(ang) * 5.6,
            vy: Math.sin(ang) * 5.6,
            fromPlayer: false,
            damage: 18,
            color: "#ff9922",
            life: 130
          });
        }
      }
      this.vy += 0.5;
      this.applyPhysics(room);
    } else if (this.id === "leviathan") {
      // Zero-G space parasite undulating across the hull
      this.x += Math.cos(this.timer * 0.025) * 3.2 * speedMult;
      this.y += Math.sin(this.timer * 0.045) * 2.4 * speedMult;
      this.x = Math.max(90, Math.min(740, this.x));
      this.y = Math.max(70, Math.min(340, this.y));
      if (tick % 65 === 0) {
        const ang = Math.atan2(dy, dx);
        projectiles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * 5.2,
          vy: Math.sin(ang) * 5.2,
          fromPlayer: false,
          damage: 20,
          color: "#38f2ff",
          life: 160
        });
      }
    } else if (this.id === "stalker") {
      // Fast horror hunter that leaps and lunges in the dark
      this.vx = this.dir * 4.1 * speedMult;
      this.vy += 0.48;
      if (this.onGround && tick % 65 === 0) {
        this.vy = -11.2;
      }
      this.applyPhysics(room);
      if (tick % 90 === 0) {
        const ang = Math.atan2(dy, dx);
        projectiles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * 6.0,
          vy: Math.sin(ang) * 6.0,
          fromPlayer: false,
          damage: 22,
          color: "#ff2a4b",
          life: 120
        });
      }
    } else if (this.id === "amalgam") {
      // Final biomech core boss
      this.y += Math.sin(this.timer * 0.03) * 0.9;
      if (tick % 55 === 0) {
        const count = this.phase === 2 ? 7 : 4;
        for (let i = 0; i < count; i++) {
          const spread = ((i / (count - 1)) - 0.5) * 1.3;
          const ang = Math.atan2(dy, dx) + spread;
          projectiles.push({
            x: cx,
            y: cy,
            vx: Math.cos(ang) * 5.0,
            vy: Math.sin(ang) * 5.0,
            fromPlayer: false,
            damage: 22,
            color: i % 2 === 0 ? "#ff2a4b" : "#38f2ff",
            life: 180
          });
        }
      }
    }
  }

  applyPhysics(room) {
    this.x += this.vx;
    if (room.collidesRect(this.x, this.y, this.w, this.h)) {
      this.x -= this.vx;
    }
    this.y += this.vy;
    this.onGround = false;
    if (room.collidesRect(this.x, this.y, this.w, this.h)) {
      if (this.vy > 0) this.onGround = true;
      this.y -= this.vy;
      this.vy = 0;
    }
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    if (this.hurtTimer > 0 && this.hurtTimer % 2 === 0) {
      ctx.filter = "brightness(2.5)";
    } else if (this.frozenTimer > 0) {
      ctx.filter = "hue-rotate(150deg) brightness(1.3)";
    }

    // Pulsing outer biomass tendrils
    const pulse = Math.sin(this.timer * 0.1) * 6;
    ctx.fillStyle = "#4d0b1a";
    ctx.fillRect(this.x - 8 - pulse / 2, this.y - 6, this.w + 16 + pulse, this.h + 12);

    // Armored chassis
    ctx.fillStyle = this.id === "cauterizer" ? "#b87414" : "#22303c";
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // Glowing alien core eye
    ctx.fillStyle = this.phase === 2 ? "#ff2a4b" : "#ffb833";
    const eyeW = Math.max(18, this.w * 0.34);
    const eyeH = Math.max(18, this.h * 0.28);
    ctx.fillRect(
      this.x + this.w / 2 - eyeW / 2 + this.dir * 8,
      this.y + this.h * 0.28,
      eyeW,
      eyeH
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      this.x + this.w / 2 - 4 + this.dir * 10,
      this.y + this.h * 0.28 + eyeH / 2 - 4,
      8,
      8
    );
    ctx.restore();
  }
}
