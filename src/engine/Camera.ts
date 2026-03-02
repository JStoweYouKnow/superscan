export class Camera {
  x = 0;
  y = 0;
  readonly width: number;
  readonly height: number;
  worldWidth: number;
  worldHeight: number;
  private targetX = 0;
  private targetY = 0;
  private shakeOffX = 0;
  private shakeOffY = 0;
  private shakeTimer = 0;
  private shakeForce = 0;

  constructor(width: number, height: number, worldWidth: number, worldHeight: number) {
    this.width = width;
    this.height = height;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  follow(x: number, y: number, lookaheadX = 0): void {
    this.targetX = x - this.width / 2 + lookaheadX;
    this.targetY = y - this.height / 2 + 16;
  }

  shake(intensity: number, duration: number): void {
    this.shakeForce = intensity;
    this.shakeTimer = duration;
  }

  update(dt: number): void {
    this.x += (this.targetX - this.x) * 6 * dt;
    this.y += (this.targetY - this.y) * 8 * dt;
    this.x = Math.max(0, Math.min(this.worldWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(this.worldHeight - this.height, this.y));

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.shakeOffX = (Math.random() - 0.5) * 2 * this.shakeForce;
      this.shakeOffY = (Math.random() - 0.5) * 2 * this.shakeForce;
    } else {
      this.shakeOffX = 0;
      this.shakeOffY = 0;
    }
  }

  get scrollX(): number { return Math.round(this.x + this.shakeOffX); }
  get scrollY(): number { return Math.round(this.y + this.shakeOffY); }
}
