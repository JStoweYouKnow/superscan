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
import { Leaderboard } from './game/Leaderboard.js';

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
const leaderboard = new Leaderboard();
let victoryPhase: 'enter_name' | 'show_board' = 'enter_name';
let playerInitials = '';
let nameBlinkTimer = 0;
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
  audio.startMuzak();
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
      if (input.start) { state = 'title'; titleTimer = 0; }
      break;
    case 'victory':
      nameBlinkTimer += dt;
      if (victoryPhase === 'enter_name') {
        updateNameEntry();
      } else {
        if (input.start) { state = 'title'; titleTimer = 0; }
      }
      break;
  }
}

function updateNameEntry(): void {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const letter of letters) {
    if (input.keyJustPressed(letter) && playerInitials.length < 3) {
      playerInitials += letter;
    }
  }
  if (input.keyJustPressed('Backspace') && playerInitials.length > 0) {
    playerInitials = playerInitials.slice(0, -1);
  }
  if (input.start && playerInitials.length > 0) {
    leaderboard.addScore(playerInitials, player.score);
    victoryPhase = 'show_board';
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
        particles.burst(enemy.x + 8, enemy.y + 8, 12, enemy.type === 'can' ? '#F44336' : '#FF8F00');
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
  if (player.lives <= 0) {
    state = 'gameover';
    audio.stopMuzak();
  }

  // Victory (reach checkout area at the end)
  if (player.x > level.widthPx - 100) {
    state = 'victory';
    victoryPhase = 'enter_name';
    playerInitials = '';
    nameBlinkTimer = 0;
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

  // Controls - dark backdrop for legibility
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(W / 2 - 130, 160, 260, 30);
  ctx.fillStyle = '#E0E0E0';
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
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.fillStyle = '#4CAF50';
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.fillText('LEVEL CLEAR!', W / 2, 22);

  ctx.fillStyle = '#FFD54F';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText(`SCORE: ${player.score}`, W / 2, 40);

  if (victoryPhase === 'enter_name') {
    // Name entry
    ctx.fillStyle = '#FFF';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('ENTER YOUR INITIALS', W / 2, 68);

    // Draw the 3 letter slots
    const slotW = 20, gap = 6;
    const startX = W / 2 - (slotW * 3 + gap * 2) / 2;
    for (let i = 0; i < 3; i++) {
      const sx = startX + i * (slotW + gap);
      // Slot background
      ctx.fillStyle = i < playerInitials.length ? '#2E7D32' : '#1a1a2e';
      ctx.fillRect(sx, 78, slotW, 24);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, 78, slotW, 24);
      // Letter
      ctx.fillStyle = '#FFF';
      ctx.font = '12px "Press Start 2P", monospace';
      if (i < playerInitials.length) {
        ctx.fillText(playerInitials[i], sx + slotW / 2, 91);
      } else if (i === playerInitials.length && Math.floor(nameBlinkTimer * 3) % 2 === 0) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillText('_', sx + slotW / 2, 91);
      }
    }

    ctx.fillStyle = '#90A4AE';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('TYPE A-Z, BACKSPACE TO DELETE', W / 2, 115);
    if (playerInitials.length > 0) {
      ctx.fillStyle = Math.floor(nameBlinkTimer * 2) % 2 === 0 ? '#FFD54F' : '#90A4AE';
      ctx.fillText('PRESS ENTER TO SUBMIT', W / 2, 128);
    }
  } else {
    // Show leaderboard
    ctx.fillStyle = '#FFD54F';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillText('HIGH SCORES', W / 2, 65);

    const scores = leaderboard.getScores();
    const tableY = 82;

    // Header
    ctx.fillStyle = '#90A4AE';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RANK', W / 2 - 80, tableY);
    ctx.fillText('NAME', W / 2 - 30, tableY);
    ctx.textAlign = 'right';
    ctx.fillText('SCORE', W / 2 + 80, tableY);

    // Divider
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(W / 2 - 85, tableY + 6, 170, 1);

    // Entries
    for (let i = 0; i < 5; i++) {
      const ey = tableY + 16 + i * 16;
      const entry = scores[i];

      ctx.textAlign = 'left';
      if (entry) {
        const isNew = entry.name === playerInitials.toUpperCase().slice(0, 3) && entry.score === player.score;
        ctx.fillStyle = isNew ? '#FFD54F' : '#FFF';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText(`${i + 1}.`, W / 2 - 80, ey);
        ctx.fillText(entry.name, W / 2 - 30, ey);
        ctx.textAlign = 'right';
        ctx.fillText(String(entry.score).padStart(6, '0'), W / 2 + 80, ey);
      } else {
        ctx.fillStyle = '#424242';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText(`${i + 1}.`, W / 2 - 80, ey);
        ctx.fillText('---', W / 2 - 30, ey);
        ctx.textAlign = 'right';
        ctx.fillText('------', W / 2 + 80, ey);
      }
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#90A4AE';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('PRESS ENTER TO CONTINUE', W / 2, 195);
  }
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
