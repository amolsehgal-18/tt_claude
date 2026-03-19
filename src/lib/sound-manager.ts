/**
 * SoundManager — Web Audio API synthetic sounds.
 * No external audio files needed. All sounds are generated procedurally.
 * Handles iOS autoplay restrictions (audio only triggers after user gesture).
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted = false;

  // ── AudioContext (lazy, resumes on iOS after user gesture) ───────────────
  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
      } catch { return null; }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** Call this once on any user interaction to unlock audio on iOS */
  unlock() {
    const ctx = this.getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  get isMuted() { return this._muted; }
  toggleMute(): boolean { this._muted = !this._muted; return this._muted; }

  // ── Card flip (paper rustle) ─────────────────────────────────────────────
  playCardFlip() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const dur = 0.1;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 700; filt.Q.value = 0.5;
    const gain = ctx.createGain(); gain.gain.value = 0.28;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start();
  }

  // ── Crowd cheer (ascending filtered noise) ───────────────────────────────
  playCrowdCheer() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const dur = 1.8;
    const buf = ctx.createBuffer(2, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.min(t * 10, 1) * Math.exp(-t * 1.0);
        d[i] = (Math.random() * 2 - 1) * env;
      }
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
    filt.frequency.setValueAtTime(500, ctx.currentTime);
    filt.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.7);
    filt.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + dur);
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start();
  }

  // ── Crowd groan (descending filtered noise) ──────────────────────────────
  playCrowdGroan() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const dur = 1.5;
    const buf = ctx.createBuffer(2, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.min(t * 6, 1) * Math.exp(-t * 1.6);
        d[i] = (Math.random() * 2 - 1) * env;
      }
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
    filt.frequency.setValueAtTime(1400, ctx.currentTime);
    filt.frequency.linearRampToValueAtTime(280, ctx.currentTime + 1.5);
    filt.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.32, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start();
  }

  // ── Camera burst (paparazzi clicks) ─────────────────────────────────────
  playCameraFlash() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    for (let i = 0; i < 6; i++) {
      const delay = i * 0.13 + Math.random() * 0.04;
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1800 + Math.random() * 1200;
      g.gain.setValueAtTime(0, ctx.currentTime + delay);
      g.gain.linearRampToValueAtTime(0.09, ctx.currentTime + delay + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.06);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.07);
    }
  }

  // ── Dramatic sacking sting (descending minor chord) ───────────────────────
  playDramaticSting() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const notes = [220, 261.63, 311.13]; // A3, C4, Eb4 — A minor
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq * 0.84, ctx.currentTime + 1.4);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.07 - i * 0.012, ctx.currentTime + 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.9);
    });
  }

  // ── Typewriter key click ─────────────────────────────────────────────────
  playTypewriter() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.035), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.18));
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 1400;
    const gain = ctx.createGain(); gain.gain.value = 0.22;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start();
  }

  // ── Match intro — rising tension arpeggio ────────────────────────────────
  playMatchIntro() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const notes = [130.81, 164.81, 196, 261.63]; // C3 E3 G3 C4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.2;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.13, start + 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(start); osc.stop(start + 1.0);
    });
  }

  // ── Win fanfare (ascending major arpeggio) ───────────────────────────────
  playWinFanfare() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const notes = [261.63, 329.63, 392, 523.25]; // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.14, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(start); osc.stop(start + 0.7);
    });
  }

  // ── Draw sound (neutral resolving chord) ─────────────────────────────────
  playDrawSound() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 220;
    g.gain.setValueAtTime(0.14, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 1.0);
  }

  // ── Board impact — institutional authority (brass stab) ──────────────────
  playBoardImpact(positive: boolean) {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const freqs = positive ? [220, 277.18, 349.23] : [349.23, 261.63, 196];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.07;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.055, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.25);
    });
  }

  // ── Fans impact — crowd swell ──────────────────────────────────────────────
  playFansImpact(positive: boolean) {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    const dur = 0.65;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / ctx.sampleRate;
      const env = positive
        ? Math.min(t * 14, 1) * Math.exp(-t * 3.2)
        : Math.min(t * 5, 1) * Math.exp(-t * 2.0);
      d[i] = (Math.random() * 2 - 1) * env * 0.55;
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
    filt.frequency.setValueAtTime(positive ? 380 : 1100, ctx.currentTime);
    filt.frequency.linearRampToValueAtTime(positive ? 1700 : 260, ctx.currentTime + 0.5);
    filt.Q.value = 0.6;
    const gain = ctx.createGain(); gain.gain.value = positive ? 0.48 : 0.34;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start();
  }

  // ── Squad impact — dressing room (claps or heavy thud) ───────────────────
  playSquadImpact(positive: boolean) {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    if (positive) {
      for (let i = 0; i < 3; i++) {
        const delay = ctx.currentTime + i * 0.11;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.055), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (d.length * 0.12));
        const src = ctx.createBufferSource(); src.buffer = buf;
        const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 900;
        const g = ctx.createGain(); g.gain.value = 0.24;
        src.connect(filt); filt.connect(g); g.connect(ctx.destination);
        src.start(delay);
      }
    } else {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 68;
      osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.28);
      g.gain.setValueAtTime(0.38, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.48);
    }
  }

  // ── Full-time whistle (three sharp blasts) ────────────────────────────────
  playFinalWhistle() {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    [0, 0.22, 0.44].forEach(delay => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2500, ctx.currentTime + delay);
      osc.frequency.linearRampToValueAtTime(2200, ctx.currentTime + delay + 0.16);
      g.gain.setValueAtTime(0, ctx.currentTime + delay);
      g.gain.linearRampToValueAtTime(0.45, ctx.currentTime + delay + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.19);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.22);
    });
  }

  // ── Crowd ambience loop — returns stop() function ─────────────────────────
  startCrowdAmbience(): () => void {
    if (this._muted) return () => {};
    const ctx = this.getCtx(); if (!ctx) return () => {};
    const dur = 5;
    const buf = ctx.createBuffer(2, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b = 0;
      for (let i = 0; i < d.length; i++) {
        b += (Math.random() * 2 - 1) * 0.018;
        b = Math.max(-1, Math.min(1, b));
        const t = i / ctx.sampleRate;
        d[i] = b + Math.sin(t * 4.1 + ch * 1.4) * 0.025 + Math.sin(t * 11.3 + ch * 0.9) * 0.012;
      }
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
    filt.frequency.value = 480; filt.Q.value = 0.35;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 1.2);
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start();
    return () => {
      try {
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        setTimeout(() => { try { src.stop(); } catch { /**/ } }, 700);
      } catch { /**/ }
    };
  }

  // ── VAR decision sound ────────────────────────────────────────────────────
  playVARDecision(success: boolean) {
    if (this._muted) return;
    const ctx = this.getCtx(); if (!ctx) return;
    if (success) {
      [880, 1108, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.16;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.25);
      });
    } else {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = 440;
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.35);
      g.gain.setValueAtTime(0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.55);
    }
  }
}

// Singleton — safe for SSR (returns no-op during server-side rendering)
const noOp = () => {};
const ssrManager = {
  unlock: noOp, playCardFlip: noOp, playCrowdCheer: noOp,
  playCrowdGroan: noOp, playCameraFlash: noOp, playDramaticSting: noOp,
  playTypewriter: noOp, playMatchIntro: noOp, playWinFanfare: noOp,
  playDrawSound: noOp, playBoardImpact: noOp, playFansImpact: noOp,
  playSquadImpact: noOp, playFinalWhistle: noOp, startCrowdAmbience: () => () => {},
  playVARDecision: noOp, toggleMute: () => false, isMuted: false,
} as unknown as SoundManager;

let _instance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (typeof window === 'undefined') return ssrManager;
  if (!_instance) _instance = new SoundManager();
  return _instance;
}
