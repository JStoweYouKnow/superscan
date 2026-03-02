import type { GameSprites } from './sprites.js';
import type { Input } from '../engine/Input.js';
import type { Level } from './Level.js';
import type { GameAudio } from '../engine/Audio.js';

const TILE = 16;
const GRAVITY = 620;
const JUMP_VEL = -230;
const JUMP_CUT = 0.4;
const RUN_SPEED = 120;
const ACCEL = 800;
const FRICTION = 600;
const COYOTE_TIME = 0.08;
const JUMP_BUFFER = 0.1;
const HURT_INVINCIBLE = 1.5;
const SCAN_COOLDOWN = 0.4;

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  width = 12;
  height = 14;
  facing = 1;
  grounded = false;
  health = 3;
  lives = 3;
  score = 0;

  private sprites: GameSprites;
  private coyoteTimer = 0;
  private jumpBuffer = 0;
  private hurtTimer = 0;
  private scanTimer = 0;
  private animTimer = 0;
  private animFrame = 0;
  private scanRequested = false;
  private hasDoubleJumped = false;
  private state: 'idle' | 'run' | 'jump' | 'scan' = 'idle';
  private startX: number;
  private startY: number;
  private scaleX = 1;
  private scaleY = 1;

  constructor(x: number, y: number, sprites: GameSprites) {
    this.x = x;
    this.y = y;
    this.sprites = sprites;
    this.startX = x;
    this.startY = y;
  }

  get hitbox() {
    return { x: this.x + 2, y: this.y + 1, width: this.width, height: this.height };
  }

  update(dt: number, input: Input, level: Level, audio: GameAudio): boolean {
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.scanTimer = Math.max(0, this.scanTimer - dt);
    this.animTimer += dt;

    let targetVx = 0;
    if (input.left) { targetVx = -RUN_SPEED; this.facing = -1; }
    if (input.right) { targetVx = RUN_SPEED; this.facing = 1; }

    if (targetVx !== 0) {
      this.vx += Math.sign(targetVx) * ACCEL * dt;
      if (Math.abs(this.vx) > RUN_SPEED) this.vx = Math.sign(this.vx) * RUN_SPEED;
    } else {
      if (Math.abs(this.vx) < FRICTION * dt) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * FRICTION * dt;
    }

    if (input.jump) this.jumpBuffer = JUMP_BUFFER;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    if (this.grounded) {
      this.coyoteTimer = COYOTE_TIME;
      this.hasDoubleJumped = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.vy = JUMP_VEL;
      this.jumpBuffer = 0;
      this.coyoteTimer = 0;
      this.grounded = false;
      audio.jump();
      this.scaleX = 0.8;
      this.scaleY = 1.2;
    } else if (this.jumpBuffer > 0 && !this.grounded && !this.hasDoubleJumped && this.coyoteTimer <= 0) {
      // Double jump
      this.vy = JUMP_VEL * 0.85;
      this.jumpBuffer = 0;
      this.hasDoubleJumped = true;
      audio.jump();
      this.scaleX = 0.75;
      this.scaleY = 1.25;
    }

    if (!input.jumpHeld && this.vy < 0) {
      this.vy *= JUMP_CUT;
    }

    this.vy += GRAVITY * dt;
    if (this.vy > 400) this.vy = 400;

    this.grounded = false;
    this.moveX(dt, level);
    this.moveY(dt, level);

    for (const coin of level.coins) {
      if (coin.collected) continue;
      const dx = (this.x + 8) - (coin.x + 4);
      const dy = (this.y + 8) - (coin.y + 4);
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        coin.collected = true;
        this.score += 50;
        audio.coin();
      }
    }

    this.scanRequested = false;
    if (input.attack && this.scanTimer <= 0) {
      this.scanTimer = SCAN_COOLDOWN;
      this.scanRequested = true;
      audio.scan();
    }

    if (this.scanRequested) this.state = 'scan';
    else if (!this.grounded) this.state = 'jump';
    else if (Math.abs(this.vx) > 10) this.state = 'run';
    else this.state = 'idle';

    if (this.animTimer > 0.18) {
      this.animTimer = 0;
      this.animFrame++;
    }

    this.scaleX += (1 - this.scaleX) * 10 * dt;
    this.scaleY += (1 - this.scaleY) * 10 * dt;

    if (this.y > level.heightPx + 32) {
      this.die(audio);
    }

    return this.scanRequested;
  }

  private moveX(dt: number, level: Level): void {
    this.x += this.vx * dt;
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.width) / TILE);
    const top = Math.floor((this.y + 1) / TILE);
    const bottom = Math.floor((this.y + this.height) / TILE);

    for (let r = top; r <= bottom; r++) {
      if (this.vx > 0 && level.isSolid(right, r)) {
        this.x = right * TILE - this.width - 1;
        this.vx = 0;
      }
      if (this.vx < 0 && level.isSolid(left, r)) {
        this.x = (left + 1) * TILE;
        this.vx = 0;
      }
    }
  }

  private moveY(dt: number, level: Level): void {
    this.y += this.vy * dt;
    const left = Math.floor((this.x + 1) / TILE);
    const right = Math.floor((this.x + this.width - 1) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.height) / TILE);

    for (let c = left; c <= right; c++) {
      if (this.vy > 0) {
        if (level.isSolid(c, bottom)) {
          this.y = bottom * TILE - this.height - 1;
          this.vy = 0;
          this.grounded = true;
          if (this.scaleY > 1.05) { this.scaleX = 1.2; this.scaleY = 0.8; }
        } else if (level.isOneWay(c, bottom)) {
          const platTop = bottom * TILE;
          const prevBottom = this.y + this.height - this.vy * dt;
          if (prevBottom <= platTop + 2) {
            this.y = platTop - this.height - 1;
            this.vy = 0;
            this.grounded = true;
          }
        }
      }
      if (this.vy < 0 && level.isSolid(c, top)) {
        this.y = (top + 1) * TILE;
        this.vy = 0;
      }
    }
  }

  bounce(): void {
    this.vy = JUMP_VEL * 0.7;
    this.scaleX = 0.7;
    this.scaleY = 1.3;
  }

  hurt(audio: GameAudio): void {
    if (this.hurtTimer > 0) return;
    this.health--;
    this.hurtTimer = HURT_INVINCIBLE;
    this.vx = -this.facing * 100;
    this.vy = -150;
    audio.playerHurt();
    if (this.health <= 0) {
      this.die(audio);
    }
  }

  private die(audio: GameAudio): void {
    this.lives--;
    if (this.lives > 0) {
      this.x = this.startX;
      this.y = this.startY;
      this.vx = 0;
      this.vy = 0;
      this.health = 3;
      this.hurtTimer = HURT_INVINCIBLE;
      this.hasDoubleJumped = false;
    }
    audio.playerHurt();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.hurtTimer > 0 && Math.floor(this.hurtTimer * 10) % 2 === 0) return;

    let sprite: HTMLCanvasElement;
    switch (this.state) {
      case 'run': {
        const frames = this.facing > 0 ? this.sprites.playerRun : this.sprites.playerRunLeft;
        sprite = frames[this.animFrame % frames.length];
        break;
      }
      case 'jump':
        sprite = this.facing > 0 ? this.sprites.playerJump : this.sprites.playerJumpLeft;
        break;
      case 'scan':
        sprite = this.facing > 0 ? this.sprites.playerScan : this.sprites.playerScanLeft;
        break;
      default: {
        const frames = this.facing > 0 ? this.sprites.playerIdle : this.sprites.playerIdleLeft;
        sprite = frames[this.animFrame % frames.length];
      }
    }

    ctx.save();
    const cx = this.x + 8;
    // The player sprite is 16x20, hitbox height is 14. 
    // Anchor the bottom of the sprite to the bottom of the hitbox.
    const cy = this.y + this.height - sprite.height / 2;
    ctx.translate(cx, cy);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    ctx.restore();
  }

  get scanOriginX(): number {
    return this.facing > 0 ? this.x + this.width + 2 : this.x - 14;
  }

  get scanOriginY(): number {
    return this.y + 4;
  }
}
