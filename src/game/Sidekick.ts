import type { GameSprites } from './sprites.js';

export class Sidekick {
  x: number;
  y: number;
  private sprites: GameSprites;
  private facing = 1;
  private animTimer = 0;
  private animFrame = 0;
  private history: { x: number; y: number }[] = [];
  private readonly FOLLOW_DELAY = 15;

  constructor(x: number, y: number, sprites: GameSprites) {
    this.x = x;
    this.y = y;
    this.sprites = sprites;
    for (let i = 0; i < this.FOLLOW_DELAY; i++) {
      this.history.push({ x, y });
    }
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.history.push({ x: playerX - 16, y: playerY });
    if (this.history.length > this.FOLLOW_DELAY) {
      const target = this.history.shift()!;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      if (Math.abs(dx) > 1) this.facing = dx > 0 ? 1 : -1;
      this.x += dx * 6 * dt;
      this.y += dy * 6 * dt;
    }
    this.animTimer += dt;
    if (this.animTimer > 0.15) { this.animTimer = 0; this.animFrame++; }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const moving = this.history.length > 0 && Math.abs(this.history[this.history.length - 1].x - this.x) > 2;
    const frames = moving
      ? (this.facing > 0 ? this.sprites.sidekickRun : this.sprites.sidekickRunLeft)
      : (this.facing > 0 ? this.sprites.sidekickIdle : this.sprites.sidekickIdleLeft);
    ctx.drawImage(frames[this.animFrame % frames.length], Math.round(this.x), Math.round(this.y - 5));
  }
}
