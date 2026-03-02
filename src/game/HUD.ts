import type { GameSprites } from './sprites.js';

export class HUD {
  private sprites: GameSprites;

  constructor(sprites: GameSprites) {
    this.sprites = sprites;
  }

  render(ctx: CanvasRenderingContext2D, score: number, health: number, lives: number): void {
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Drop shadow
    ctx.fillStyle = '#000';
    ctx.fillText('SCORE', 9, 7);
    ctx.fillText(String(score).padStart(6, '0'), 9, 19);
    ctx.fillText('x' + lives, 131, 19);

    // Foreground Text
    ctx.fillStyle = '#FFF';
    ctx.fillText('SCORE', 8, 6);
    ctx.fillStyle = '#FFD54F';
    ctx.fillText(String(score).padStart(6, '0'), 8, 18);

    for (let i = 0; i < 3; i++) {
      const heart = i < health ? this.sprites.heartFull : this.sprites.heartEmpty;
      ctx.drawImage(heart, 130 + i * 12, 6);
    }

    ctx.fillStyle = '#FFF';
    ctx.fillText('x' + lives, 130, 18);
  }
}
