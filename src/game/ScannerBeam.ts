import type { GameSprites } from './sprites.js';
import type { ParticleSystem } from './Particles.js';

export class ScannerBeam {
  x: number;
  y: number;
  width = 12;
  height = 4;
  active = true;
  private vx: number;
  private life = 0.5;
  private sprite: HTMLCanvasElement;
  private particles: ParticleSystem;

  constructor(x: number, y: number, facing: number, sprites: GameSprites, particles: ParticleSystem) {
    this.x = x;
    this.y = y;
    this.vx = facing * 300;
    this.sprite = facing > 0 ? sprites.scannerBeam : sprites.scannerBeamLeft;
    this.particles = particles;
  }

  get hitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(dt: number): void {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
    this.particles.trail(this.x + (this.vx > 0 ? 0 : this.width), this.y + 2, '#FF5252');
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#FF1744';
    ctx.fillRect(this.x - 1, this.y - 2, this.width + 2, this.height + 4);
    ctx.globalAlpha = 1;
    ctx.drawImage(this.sprite, Math.round(this.x), Math.round(this.y));
  }
}
