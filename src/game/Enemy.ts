import type { GameSprites } from './sprites.js';
import type { Level } from './Level.js';

const TILE = 16;

export class Enemy {
  x: number;
  y: number;
  width = 14;
  height = 14;
  alive = true;
  deathTimer = 0;
  readonly type: 'can' | 'box' | 'bag';
  private vx: number;
  private animTimer = 0;
  private animFrame = 0;
  private frames: HTMLCanvasElement[];
  private barcodeFrame: HTMLCanvasElement;

  constructor(x: number, y: number, type: 'can' | 'box' | 'bag', sprites: GameSprites) {
    this.x = x * TILE + 1;
    this.y = y * TILE + 1;
    this.type = type;
    this.vx = (type === 'can' ? 40 : type === 'box' ? 25 : 30) * (Math.random() > 0.5 ? 1 : -1);
    this.frames = type === 'can' ? sprites.itemCan : type === 'box' ? sprites.itemBox : sprites.itemBag;
    this.barcodeFrame = sprites.barcode;
  }

  get hitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(dt: number, level: Level): void {
    if (!this.alive) {
      this.deathTimer -= dt;
      return;
    }
    this.x += this.vx * dt;
    this.animTimer += dt;
    if (this.animTimer > 0.2) { this.animTimer = 0; this.animFrame++; }

    const col = this.vx > 0
      ? Math.floor((this.x + this.width) / TILE)
      : Math.floor(this.x / TILE);
    const row = Math.floor((this.y + this.height / 2) / TILE);
    if (level.isSolid(col, row)) {
      this.vx *= -1;
      this.x += this.vx * dt * 2;
    }

    const footCol = this.vx > 0
      ? Math.floor((this.x + this.width) / TILE)
      : Math.floor(this.x / TILE);
    const belowRow = Math.floor((this.y + this.height + 2) / TILE);
    if (!level.isSolid(footCol, belowRow) && !level.isOneWay(footCol, belowRow)) {
      this.vx *= -1;
    }
  }

  kill(): void {
    this.alive = false;
    this.deathTimer = 0.5; // Slightly longer for the barcode to be visible
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) {
      if (this.deathTimer > 0) {
        ctx.globalAlpha = this.deathTimer / 0.5;
        ctx.save();
        ctx.translate(this.x + 8, this.y + 8);

        // Float up slowly
        const floatUp = (0.5 - this.deathTimer) * 20;
        ctx.translate(0, -floatUp);

        ctx.scale(1 + (0.5 - this.deathTimer) * 0.5, 1 + (0.5 - this.deathTimer) * 0.5);

        // Draw item frame during death
        const frame = this.frames[this.animFrame % this.frames.length];
        ctx.drawImage(frame, -8, -8);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      return;
    }

    // Draw barcode when alive
    // Add slight bobbing using animFrame
    const yOff = (this.animFrame % 2 === 0) ? -1 : 0;
    ctx.drawImage(this.barcodeFrame, Math.round(this.x - 1), Math.round(this.y - 1 + yOff));
  }
}
