export class GameAudio {
  private ctx: AudioContext | null = null;
  private muzakGain: GainNode | null = null;
  private muzakPlaying = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private playTone(type: OscillatorType, freqStart: number, freqEnd: number, duration: number, volume = 0.12): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  jump(): void { this.playTone('square', 250, 580, 0.12, 0.1); }
  scan(): void { this.playTone('sawtooth', 900, 200, 0.2, 0.08); }

  hit(): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  coin(): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(988, ctx.currentTime);
    osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  playerHurt(): void { this.playTone('square', 300, 80, 0.35, 0.12); }

  victory(): void {
    const ctx = this.getCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.2);
    });
  }

  startMuzak(): void {
    if (this.muzakPlaying) return;
    this.muzakPlaying = true;

    const ctx = this.getCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.muzakGain = masterGain;

    // Grocery-store style: soft I-IV-V-I in C major, sine waves for smooth elevator music
    const chords: number[][] = [
      [131, 165, 196],     // C major (C3, E3, G3)
      [175, 220, 262],     // F major (F3, A3, C4)
      [196, 247, 294],     // G major (G3, B3, D4)
      [131, 165, 196],     // C major
    ];
    const chordDuration = 2.8;
    const fadeIn = 0.4;
    const fadeOut = 0.5;

    const scheduleChord = (startTime: number, chordIndex: number) => {
      const freqs = chords[chordIndex];
      for (const freq of freqs) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + fadeIn);
        gain.gain.setValueAtTime(0.2, startTime + chordDuration - fadeOut);
        gain.gain.linearRampToValueAtTime(0.001, startTime + chordDuration);
        osc.connect(gain).connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + chordDuration);
      }
    };

    const loop = () => {
      if (!this.muzakPlaying) return;
      const t = this.getCtx().currentTime;
      for (let i = 0; i < 4; i++) scheduleChord(t + i * chordDuration, i);
      setTimeout(loop, 4 * chordDuration * 1000);
    };
    loop();
  }

  stopMuzak(): void {
    this.muzakPlaying = false;
    if (this.muzakGain && this.ctx) {
      this.muzakGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1);
    }
  }
}
