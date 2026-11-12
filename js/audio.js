// Web Audio API Retro Chiptune & Horror Synth Engine
class HorrorAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.droneOsc = null;
    this.droneGain = null;
    this.currentAct = 1;
    this.pingTimer = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.startAmbientDrone();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startAmbientDrone() {
    if (!this.ctx || this.droneOsc) return;
    this.droneOsc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    this.droneGain = this.ctx.createGain();

    this.droneOsc.type = "sawtooth";
    subOsc.type = "triangle";
    this.droneOsc.frequency.value = 46;
    subOsc.frequency.value = 23;

    filter.type = "lowpass";
    filter.frequency.value = 110;
    this.droneGain.gain.value = 0.045;

    this.droneOsc.connect(filter);
    subOsc.connect(filter);
    filter.connect(this.droneGain);
    this.droneGain.connect(this.ctx.destination);

    this.droneOsc.start();
    subOsc.start();
    this.subOsc = subOsc;
    this.filter = filter;
  }

  setActAtmosphere(act) {
    this.currentAct = act;
    if (!this.ctx || !this.droneOsc) return;
    if (act === 1) {
      this.droneOsc.frequency.setTargetAtTime(48, this.ctx.currentTime, 0.5);
      this.filter.frequency.setTargetAtTime(110, this.ctx.currentTime, 0.5);
    } else if (act === 2) {
      this.droneOsc.frequency.setTargetAtTime(41.2, this.ctx.currentTime, 0.5);
      this.filter.frequency.setTargetAtTime(155, this.ctx.currentTime, 0.5);
    } else {
      this.droneOsc.frequency.setTargetAtTime(34.6, this.ctx.currentTime, 0.5);
      this.filter.frequency.setTargetAtTime(210, this.ctx.currentTime, 0.5);
    }
  }

  playTone(freq, endFreq, duration, type = "square", vol = 0.1) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playShoot(isCryo = false) {
    if (isCryo) {
      this.playTone(980, 320, 0.14, "triangle", 0.12);
    } else {
      this.playTone(680, 140, 0.11, "sawtooth", 0.09);
    }
  }

  playJump() {
    this.playTone(170, 420, 0.14, "square", 0.07);
  }

  playDash() {
    this.playTone(520, 90, 0.18, "sawtooth", 0.11);
  }

  playHit() {
    this.playTone(140, 55, 0.12, "square", 0.11);
  }

  playHurt() {
    this.playTone(190, 42, 0.28, "sawtooth", 0.18);
  }

  playPickup() {
    this.playTone(440, 660, 0.12, "triangle", 0.12);
    setTimeout(() => this.playTone(660, 880, 0.22, "triangle", 0.12), 110);
  }

  playSave() {
   .forEach((f, i) => {
      setTimeout(() => this.playTone(f, f, 0.16, "triangle", 0.1), i * 85);
    });
  }

  playRadarPing(dangerRatio) {
    const pitch = 950 + dangerRatio * 450;
    this.playTone(pitch, pitch * 0.95, 0.06, "sine", 0.04 + dangerRatio * 0.05);
  }

  playBossRoar() {
    this.playTone(110, 32, 0.75, "sawtooth", 0.22);
  }
}

const SFX = new HorrorAudio();
