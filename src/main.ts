import { Input } from './engine/Input.js';
import { Camera } from './engine/Camera.js';
import { GameAudio } from './engine/Audio.js';
import { Renderer } from './engine/Renderer.js';
import { createAllSprites } from './game/sprites.js';
import { Level } from './game/Level.js';
import { Player } from './game/Player.js';
import { Sidekick } from './game/Sidekick.js';
import { Enemy } from './game/Enemy.js';
import { ScannerBeam } from './game/ScannerBeam.js';
import { ParticleSystem } from './game/Particles.js';
import { HUD } from './game/HUD.js';

// ─── Constants ──────────────────────────────────────────────────
const W = 384;
const H = 216;

// ─── Collision Helper ───────────────────────────────────────────
interface Rect { x: number; y: number; width: number; height: number; }
function overlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

// ─── Game State ─────────────────────────────────────────────────
type State = 'title' | 'playing' | 'gameover' | 'victory';

const renderer = new Renderer('canvas1', W, H);
const input = new Input();
const audio = new GameAudio();
const sprites = createAllSprites();

let state: State = 'title';
let titleTimer = 0;
let level: Level;
let camera: Camera;
let player: Player;
let sidekick: Sidekick;
let enemies: Enemy[];
let beams: ScannerBeam[];
let particles: ParticleSystem;
let hud: HUD;

function initGame(): void {
  level = new Level(sprites);
  camera = new Camera(W, H, level.widthPx, level.heightPx);
  player = new Player(48, 160, sprites);
  sidekick = new Sidekick(32, 160, sprites);
  particles = new ParticleSystem();
  hud = new HUD(sprites);
  beams = [];

  enemies = level.enemySpawns.map(s => new Enemy(s.x, s.y, s.type, sprites));

  state = 'playing';
}

// ─── Update ─────────────────────────────────────────────────────

function update(dt: number): void {
  switch (state) {
    case 'title':
      titleTimer += dt;
      if (input.start) initGame();
      break;
    case 'playing':
      updatePlaying(dt);
      break;
    case 'gameover':
    case 'victory':
      if (input.start) { state = 'title'; titleTimer = 0; }
      break;
  }
}

function updatePlaying(dt: number): void {
  // Player
  const fired = player.update(dt, input, level, audio);
  if (fired) {
    beams.push(new ScannerBeam(
      player.scanOriginX,
      player.scanOriginY,
      player.facing,
      sprites,
      particles,
    ));
  }

  // Sidekick
  sidekick.update(dt, player.x, player.y);

  // Enemies
  for (const enemy of enemies) {
    enemy.update(dt, level);
  }

  // Beams
  for (const beam of beams) {
    beam.update(dt);
  }

  // Beam → Enemy collisions
  for (const b of beams) {
    if (!b.active) continue;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (overlap(b.hitbox, enemy.hitbox)) {
        enemy.kill();
        b.active = false;
        player.score += 100;
        camera.shake(3, 0.15);
        audio.hit();
        particles.burst(enemy.x + 8, enemy.y + 8, 12, enemy.type === 'apple' ? '#F44336' : '#FF8F00');
      }
    }
  }

  // Player → Enemy collisions
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (overlap(player.hitbox, enemy.hitbox)) {
      // Stomp from above?
      if (player.vy > 0 && player.y + 14 < enemy.y + 6) {
        enemy.kill();
        player.bounce();
        player.score += 200;
        camera.shake(2, 0.1);
        audio.hit();
        particles.burst(enemy.x + 8, enemy.y, 8, '#FF9800');
      } else {
        player.hurt(audio);
        camera.shake(4, 0.2);
      }
    }
  }

  // Cleanup
  beams = beams.filter(b => b.active);
  enemies = enemies.filter(e => e.alive || e.deathTimer > 0);

  // Camera
  camera.follow(player.x, player.y, player.facing * 24);
  camera.update(dt);

  // Particles
  particles.update(dt);

  // Game over
  if (player.lives <= 0) state = 'gameover';

  // Victory (reach checkout area at the end)
  if (player.x > level.widthPx - 100) {
    state = 'victory';
    audio.victory();
  }
}

// ─── Render ─────────────────────────────────────────────────────

function render(): void {
  const ctx = renderer.ctx;
  renderer.clear();

  switch (state) {
    case 'title': renderTitle(ctx); break;
    case 'playing': renderPlaying(ctx); break;
    case 'gameover': renderGameOver(ctx); break;
    case 'victory': renderVictory(ctx); break;
  }

  renderer.applyCRT();
}

function renderParallax(ctx: CanvasRenderingContext2D): void {
  // Back wall color (warm off-white to match the image)
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(0, 0, level.widthPx, level.heightPx);

  const bgOffset = camera.scrollX * 0.2;

  // Background blurred/distant shelves
  ctx.fillStyle = '#CFD8DC'; // Shelf back
  ctx.fillRect(0, 40, level.widthPx, 100);

  // Draw some distant colored boxes
  const boxCols = ['#FFE082', '#FFB74D', '#EF9A9A', '#BCAAA4', '#90CAF9'];
  const maxShelves = Math.ceil(level.widthPx / 60) + 1;
  for (let s = 0; s < maxShelves; s++) {
    const lx = s * 60 - (bgOffset % 60);
    ctx.fillStyle = '#B0BEC5'; // shelf support
    ctx.fillRect(lx, 40, 4, 100);
    for (let h = 0; h < 3; h++) {
      const shY = 50 + h * 30; // Shelf height
      ctx.fillStyle = '#B0BEC5'; // shelf base
      ctx.fillRect(lx + 4, shY, 56, 3);

      // Draw 3-4 boxes per shelf
      for (let b = 0; b < 4; b++) {
        const bx = lx + 8 + b * 12;
        const col = boxCols[(s + h + b) % boxCols.length];
        ctx.fillStyle = col;
        ctx.fillRect(bx, shY - 20, 10, 20);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(bx, shY - 20, 2, 20); // highlight
      }
    }
  }

  // Perspective floor and reflection
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(0, 140, level.widthPx, level.heightPx - 140);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(0, 140, level.widthPx, 40);

  // Parallax ceiling lights (bright fluorescent lights)
  const lightOffset = camera.scrollX * 0.3;
  ctx.fillStyle = '#FFFDE7'; // warm brilliant white
  const maxLights = Math.ceil(level.widthPx / 80) + 1;
  for (let i = 0; i < maxLights; i++) {
    const lx = i * 80 - (lightOffset % 80);
    ctx.fillRect(lx, 4, 40, 12); // Long rectangular ceiling lights
    ctx.fillStyle = 'rgba(255,253,231,0.2)';
    ctx.fillRect(lx - 10, 16, 60, 80); // Beam of light downwards
    ctx.fillStyle = '#FFFDE7';

    // Hanging Aisle Category Signs (every other light or so)
    if (i % 2 === 0) {
      ctx.fillStyle = '#424242'; // Hanging wires
      ctx.fillRect(lx + 12, 16, 1, 15);
      ctx.fillRect(lx + 27, 16, 1, 15);
      ctx.fillStyle = '#1565C0'; // Blue sign base
      ctx.fillRect(lx + 8, 30, 24, 12);
      ctx.fillStyle = '#FFCA28'; // Yellow text line
      ctx.fillRect(lx + 10, 32, 20, 2);
      ctx.fillStyle = '#FFFFFF'; // White text
      ctx.fillRect(lx + 10, 36, 14, 2);
      ctx.fillRect(lx + 10, 39, 10, 2);
    }
  }

  // Vignette/Shadow at the top edges
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, 0, level.widthPx, 10);
}

function renderPlaying(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(-camera.scrollX, -camera.scrollY);

  renderParallax(ctx);
  level.render(ctx, camera);

  for (const enemy of enemies) enemy.render(ctx);
  for (const beam of beams) beam.render(ctx);
  sidekick.render(ctx);
  player.render(ctx);
  particles.render(ctx);

  ctx.restore();

  // HUD (screen-space)
  hud.render(ctx, player.score, player.health, player.lives);
}

function renderTitle(ctx: CanvasRenderingContext2D): void {
  // Animated background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  // Decorative shelves
  for (let i = 0; i < 8; i++) {
    ctx.drawImage(sprites.shelf, 48 * i, H - 64);
    ctx.drawImage(sprites.shelf, 48 * i, H - 48);
    ctx.drawImage(sprites.floor, 48 * i, H - 32);
    ctx.drawImage(sprites.floor, 48 * i, H - 16);
  }

  // Title
  ctx.fillStyle = '#4CAF50';
  ctx.font = '20px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Super Scan', W / 2, 50);

  ctx.fillStyle = '#FFF';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText('Supermarket Showdown', W / 2, 78);

  // Characters
  ctx.drawImage(sprites.playerIdle[Math.floor(titleTimer * 3) % 2], W / 2 - 20, 100);
  ctx.drawImage(sprites.sidekickIdle[Math.floor(titleTimer * 3) % 2], W / 2 + 4, 100);

  // Blinking prompt
  if (Math.floor(titleTimer * 2) % 2 === 0) {
    ctx.fillStyle = '#FFD54F';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('PRESS ENTER TO START', W / 2, 145);
  }

  // Controls
  ctx.fillStyle = '#90A4AE';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('ARROWS/WASD: Move & Jump', W / 2, 170);
  ctx.fillText('Z/X/SHIFT: Scanner Attack', W / 2, 182);
}

function renderGameOver(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#F44336';
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
  ctx.fillStyle = '#FFF';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText(`SCORE: ${player.score}`, W / 2, H / 2 + 10);
  ctx.fillStyle = '#90A4AE';
  ctx.fillText('PRESS ENTER TO RETRY', W / 2, H / 2 + 35);
}

function renderVictory(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#4CAF50';
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LEVEL CLEAR!', W / 2, H / 2 - 30);
  ctx.fillStyle = '#FFD54F';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`SCORE: ${player.score}`, W / 2, H / 2 + 5);
  ctx.fillStyle = '#FFF';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText('All groceries scanned!', W / 2, H / 2 + 25);
  ctx.fillStyle = '#90A4AE';
  ctx.fillText('PRESS ENTER', W / 2, H / 2 + 50);
}

// ─── Game Loop ──────────────────────────────────────────────────

let lastTime = 0;

function gameLoop(time: number): void {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  update(dt);
  render();
  input.endFrame();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(gameLoop);
});
