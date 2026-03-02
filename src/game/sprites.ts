const T = 16;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

function flipH(src: HTMLCanvasElement): HTMLCanvasElement {
  const [c, ctx] = canvas(src.width, src.height);
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

const SKIN = '#D4985A', SKIN_S = '#B07840', HAIR = '#111111', W = '#F0F0F0', EYE = '#111';
const JACKET = '#9E9E9E', JACKET_D = '#757575', JACKET_H = '#BDBDBD', SHIRT = '#E53935';
const JEANS = '#7BA0B0', JEANS_D = '#5A8090', JEANS_DD = '#4A6A78', BOOT = '#2A2A2A';
const SCAN_L = '#F44336', SCAN_G = '#37474F', SCAN_GL = '#CFD8DC';
const SHOE_W = '#FAFAFA';

const FL_A = '#EAEAEA', FL_B = '#D6D6D6';
const SH_M = '#CFD8DC', SH_D = '#B0BEC5', SH_B = '#90A4AE';
const FR_B = '#E3F2FD', FR_F = '#90CAF9';
const WL = '#F5F5F5', WL_D = '#E0E0E0';
const CK_T = '#8D6E63', CK_B = '#5D4037';
const CL = '#CFD8DC';
const CN_G = '#FFD54F', CN_D = '#F9A825';

const PH = 20; // Player sprite height (taller for better proportions)

function drawPlayer(ctx: CanvasRenderingContext2D, frame: number): void {
  // Large round afro hair
  ctx.fillStyle = HAIR;
  ctx.fillRect(3, 1, 10, 2);  // top
  ctx.fillRect(2, 0, 12, 1);  // very top
  ctx.fillRect(1, 2, 14, 3);  // wide middle
  ctx.fillRect(2, 5, 12, 2);  // lower hair
  ctx.fillRect(1, 4, 1, 2);   // left edge
  ctx.fillRect(14, 4, 1, 2);  // right edge

  // Ears (poking out of hair)
  ctx.fillStyle = SKIN_S; ctx.fillRect(2, 5, 1, 2); ctx.fillRect(13, 5, 1, 2);

  // Face - brown skin
  ctx.fillStyle = SKIN; ctx.fillRect(4, 4, 8, 4);
  ctx.fillStyle = SKIN_S; ctx.fillRect(3, 5, 1, 3); ctx.fillRect(12, 5, 1, 3);

  // Eyebrows
  ctx.fillStyle = HAIR; ctx.fillRect(5, 4, 2, 1); ctx.fillRect(9, 4, 2, 1);

  // Eyes
  ctx.fillStyle = W; ctx.fillRect(5, 5, 2, 2); ctx.fillRect(9, 5, 2, 2);
  ctx.fillStyle = EYE; ctx.fillRect(6, 5, 1, 2); ctx.fillRect(10, 5, 1, 2);

  // Thick dark beard
  ctx.fillStyle = HAIR;
  ctx.fillRect(4, 7, 8, 2);   // main beard
  ctx.fillRect(3, 7, 1, 2);   // left beard edge
  ctx.fillRect(12, 7, 1, 2);  // right beard edge
  ctx.fillRect(5, 6, 6, 1);   // upper beard/mustache
  ctx.fillStyle = SKIN; ctx.fillRect(7, 6, 2, 1); // mouth gap

  // Neck
  ctx.fillStyle = SKIN_S; ctx.fillRect(6, 9, 4, 1);

  // Grey jacket - open, showing red shirt
  ctx.fillStyle = JACKET_D; ctx.fillRect(2, 10, 12, 5);  // jacket base
  ctx.fillStyle = JACKET; ctx.fillRect(3, 10, 4, 5);     // left jacket panel
  ctx.fillStyle = JACKET; ctx.fillRect(9, 10, 4, 5);     // right jacket panel
  ctx.fillStyle = JACKET_H; ctx.fillRect(4, 10, 2, 4);   // left highlight
  ctx.fillStyle = JACKET_H; ctx.fillRect(10, 10, 2, 4);  // right highlight
  ctx.fillStyle = SHIRT; ctx.fillRect(6, 10, 4, 5);      // red shirt visible in center
  ctx.fillStyle = '#C62828'; ctx.fillRect(6, 10, 4, 1);  // shirt collar shadow

  // Sleeves and hands
  if (frame === 0 || frame === 1) { // idle
    ctx.fillStyle = JACKET; ctx.fillRect(1, 11, 2, 3);   // left sleeve
    ctx.fillStyle = JACKET_D; ctx.fillRect(1, 11, 1, 3); // left sleeve shadow
    ctx.fillStyle = JACKET; ctx.fillRect(13, 11, 2, 3);  // right sleeve
    ctx.fillStyle = JACKET_H; ctx.fillRect(14, 11, 1, 2);// right sleeve highlight
    ctx.fillStyle = SKIN; ctx.fillRect(1, 14, 2, 2); ctx.fillRect(13, 14, 2, 2); // hands
    ctx.fillStyle = SKIN_S; ctx.fillRect(1, 15, 1, 1); ctx.fillRect(14, 15, 1, 1); // finger shadow
  } else { // running
    ctx.fillStyle = JACKET; ctx.fillRect(2, 10, 2, 3);
    ctx.fillStyle = JACKET; ctx.fillRect(12, 10, 2, 3);
    ctx.fillStyle = SKIN; ctx.fillRect(2, 13, 2, 1); ctx.fillRect(12, 13, 2, 1);
  }

  // Light blue jeans
  ctx.fillStyle = JEANS; ctx.fillRect(4, 15, 8, 2);       // main jeans
  ctx.fillStyle = JEANS_D; ctx.fillRect(4, 15, 1, 2);     // left shadow
  ctx.fillStyle = JEANS_D; ctx.fillRect(11, 15, 1, 2);    // right shadow
  ctx.fillStyle = JEANS_DD; ctx.fillRect(7, 15, 2, 2);    // center crease

  // Boots
  ctx.fillStyle = BOOT;
  const offsets = [[4, 9], [5, 9], [3, 10], [4, 10]];
  const [a, b] = offsets[frame % 4];
  ctx.fillRect(a, 17, 3, 3); ctx.fillRect(b, 17, 3, 3);
  // Boot highlight
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(a, 17, 3, 1); ctx.fillRect(b, 17, 3, 1);
}

function mkPlayerIdle(): HTMLCanvasElement[] {
  return [0, 1].map(f => {
    const [c, x] = canvas(T, PH);
    drawPlayer(x, 0);
    if (f === 1) { x.fillStyle = '#C62828'; x.fillRect(7, 12, 2, 1); } // subtle breathing anim
    return c;
  });
}
function mkPlayerRun(): HTMLCanvasElement[] {
  return [0, 1, 2, 3].map(f => { const [c, x] = canvas(T, PH); drawPlayer(x, f); return c; });
}
function mkPlayerJump(): HTMLCanvasElement {
  const [c, x] = canvas(T, PH); drawPlayer(x, 0);
  x.clearRect(0, 17, 16, 3); x.fillStyle = BOOT;
  x.fillRect(5, 16, 3, 2); x.fillRect(8, 16, 3, 2); return c;
}
function mkPlayerScan(): HTMLCanvasElement {
  const [c, x] = canvas(T + 8, PH); drawPlayer(x, 0);
  // Extend arm out to the right
  x.fillStyle = JACKET; x.fillRect(13, 11, 2, 2);    // reaching sleeve
  x.fillStyle = JACKET_H; x.fillRect(14, 11, 1, 1);  // sleeve highlight
  x.fillStyle = SKIN; x.fillRect(15, 11, 3, 1);      // arm reaching out

  // Handheld Barcode Scanner
  x.fillStyle = SCAN_G; x.fillRect(17, 10, 4, 3);    // Scanner body
  x.fillStyle = SCAN_GL; x.fillRect(17, 10, 3, 1);   // Scanner highlight
  x.fillStyle = '#212121'; x.fillRect(18, 13, 2, 2);  // Scanner handle

  x.fillStyle = SCAN_L; x.fillRect(21, 10, 1, 3);    // Red laser emission point
  x.fillStyle = 'rgba(255,50,50,0.4)'; x.fillRect(22, 9, 3, 5); // Laser beam effect
  return c;
}

function drawSidekick(ctx: CanvasRenderingContext2D, frame: number): void {
  const SK_SKIN = '#C08040', SK_SKIN_D = '#9A6530';
  const SK_HAIR = '#1A1010';
  const DRESS_BASE = '#F0A878', DRESS_PINK = '#D81B80', DRESS_YELLOW = '#FFE040', DRESS_CYAN = '#00D4E8';
  const SK_LIPS = '#C06080';

  // Voluminous dark hair
  ctx.fillStyle = SK_HAIR;
  ctx.fillRect(3, 0, 10, 2);   // top
  ctx.fillRect(2, 1, 12, 2);   // upper
  ctx.fillRect(1, 2, 14, 4);   // wide middle
  ctx.fillRect(2, 6, 12, 2);   // lower hair
  ctx.fillRect(1, 5, 1, 2);    // left edge
  ctx.fillRect(14, 5, 1, 2);   // right edge

  // Face - darker brown skin
  ctx.fillStyle = SK_SKIN; ctx.fillRect(4, 4, 8, 4);
  ctx.fillStyle = SK_SKIN_D; ctx.fillRect(3, 5, 1, 3); ctx.fillRect(12, 5, 1, 3);

  // Eyebrows
  ctx.fillStyle = SK_HAIR; ctx.fillRect(5, 4, 2, 1); ctx.fillRect(9, 4, 2, 1);

  // Eyes
  ctx.fillStyle = '#F5F0E8'; ctx.fillRect(5, 5, 2, 2); ctx.fillRect(9, 5, 2, 2);
  ctx.fillStyle = '#222'; ctx.fillRect(6, 5, 1, 2); ctx.fillRect(10, 5, 1, 2);

  // Lips/mouth
  ctx.fillStyle = SK_LIPS; ctx.fillRect(7, 7, 2, 1);

  // Neck
  ctx.fillStyle = SK_SKIN_D; ctx.fillRect(6, 8, 4, 1);

  // Colorful patterned dress - peach base
  ctx.fillStyle = DRESS_BASE;
  ctx.fillRect(3, 9, 10, 8);   // main dress body

  // Dress pattern - pink/magenta accents
  ctx.fillStyle = DRESS_PINK;
  ctx.fillRect(4, 10, 1, 1); ctx.fillRect(7, 9, 1, 1); ctx.fillRect(11, 10, 1, 1);
  ctx.fillRect(5, 12, 1, 1); ctx.fillRect(9, 11, 1, 1); ctx.fillRect(3, 13, 1, 1);
  ctx.fillRect(7, 13, 2, 1); ctx.fillRect(11, 14, 1, 1); ctx.fillRect(5, 15, 1, 1);
  ctx.fillRect(9, 15, 1, 1); ctx.fillRect(4, 16, 1, 1); ctx.fillRect(10, 16, 1, 1);
  ctx.fillRect(12, 12, 1, 1); ctx.fillRect(6, 14, 1, 1);

  // Dress pattern - yellow accents
  ctx.fillStyle = DRESS_YELLOW;
  ctx.fillRect(6, 10, 1, 1); ctx.fillRect(10, 9, 1, 1); ctx.fillRect(4, 11, 1, 1);
  ctx.fillRect(8, 11, 1, 1); ctx.fillRect(12, 11, 1, 1); ctx.fillRect(6, 13, 1, 1);
  ctx.fillRect(10, 13, 1, 1); ctx.fillRect(3, 15, 1, 1); ctx.fillRect(8, 15, 1, 1);
  ctx.fillRect(11, 16, 1, 1); ctx.fillRect(5, 14, 1, 1);

  // Dress pattern - cyan accents
  ctx.fillStyle = DRESS_CYAN;
  ctx.fillRect(5, 9, 1, 1); ctx.fillRect(9, 10, 1, 1); ctx.fillRect(3, 11, 1, 1);
  ctx.fillRect(7, 11, 1, 1); ctx.fillRect(11, 12, 1, 1); ctx.fillRect(4, 14, 1, 1);
  ctx.fillRect(8, 14, 1, 1); ctx.fillRect(12, 15, 1, 1); ctx.fillRect(6, 16, 1, 1);
  ctx.fillRect(10, 15, 1, 1); ctx.fillRect(3, 16, 1, 1);

  // Sleeves and hands
  if (frame === 0 || frame === 1) { // idle
    ctx.fillStyle = DRESS_BASE; ctx.fillRect(1, 10, 2, 3);  // left sleeve
    ctx.fillStyle = DRESS_PINK; ctx.fillRect(1, 11, 1, 1);  // pattern on sleeve
    ctx.fillStyle = DRESS_CYAN; ctx.fillRect(2, 10, 1, 1);
    ctx.fillStyle = DRESS_BASE; ctx.fillRect(13, 10, 2, 3); // right sleeve
    ctx.fillStyle = DRESS_YELLOW; ctx.fillRect(14, 11, 1, 1);
    ctx.fillStyle = DRESS_PINK; ctx.fillRect(13, 10, 1, 1);
    ctx.fillStyle = SK_SKIN; ctx.fillRect(1, 13, 2, 2); ctx.fillRect(13, 13, 2, 2); // hands
    ctx.fillStyle = SK_SKIN_D; ctx.fillRect(1, 14, 1, 1); ctx.fillRect(14, 14, 1, 1);
  } else { // running
    ctx.fillStyle = DRESS_BASE; ctx.fillRect(2, 10, 2, 2);
    ctx.fillStyle = DRESS_PINK; ctx.fillRect(2, 10, 1, 1);
    ctx.fillStyle = DRESS_BASE; ctx.fillRect(12, 10, 2, 2);
    ctx.fillStyle = DRESS_CYAN; ctx.fillRect(13, 10, 1, 1);
    ctx.fillStyle = SK_SKIN; ctx.fillRect(2, 12, 2, 1); ctx.fillRect(12, 12, 2, 1);
  }

  // Legs
  ctx.fillStyle = SK_SKIN;
  if (frame === 0 || frame === 1) {
    ctx.fillRect(5, 17, 2, 1); ctx.fillRect(9, 17, 2, 1);
  } else {
    const o = frame === 2 ? 1 : 0;
    ctx.fillRect(5 + o, 17, 2, 1); ctx.fillRect(9 - o, 17, 2, 1);
  }

  // White sneakers
  ctx.fillStyle = SHOE_W;
  if (frame === 0 || frame === 1) {
    ctx.fillRect(4, 18, 3, 2); ctx.fillRect(9, 18, 3, 2);
  } else {
    const o = frame === 2 ? 1 : 0;
    ctx.fillRect(4 + o, 18, 3, 2); ctx.fillRect(9 - o, 18, 3, 2);
  }
  // Shoe soles
  ctx.fillStyle = '#333';
  if (frame === 0 || frame === 1) {
    ctx.fillRect(4, 19, 3, 1); ctx.fillRect(9, 19, 3, 1);
  } else {
    const o = frame === 2 ? 1 : 0;
    ctx.fillRect(4 + o, 19, 3, 1); ctx.fillRect(9 - o, 19, 1, 1);
  }
}

function mkSidekickIdle(): HTMLCanvasElement[] {
  return [0, 1].map(f => { const [c, x] = canvas(T, PH); drawSidekick(x, f); return c; });
}
function mkSidekickRun(): HTMLCanvasElement[] {
  return [0, 1, 2, 3].map(f => { const [c, x] = canvas(T, PH); drawSidekick(x, f); return c; });
}



function mkCan(): HTMLCanvasElement[] { // Tomato Soup
  return [0, 1].map(f => {
    const [c, x] = canvas(T, T);
    const yOff = f === 1 ? -1 : 0;

    // Body
    x.fillStyle = '#D32F2F'; // Red top half
    x.fillRect(4, 3 + yOff, 8, 5);
    x.fillStyle = '#F5F5F5'; // White bottom half
    x.fillRect(4, 8 + yOff, 8, 5);

    // Tomato graphic
    x.fillStyle = '#4CAF50'; // Leaves
    x.fillRect(6, 7 + yOff, 4, 1);
    x.fillStyle = '#B71C1C'; // Tomato
    x.beginPath(); x.ellipse(8, 9 + yOff, 2, 2, 0, 0, Math.PI * 2); x.fill();

    // Metallic rims
    x.fillStyle = '#9E9E9E';
    x.fillRect(4, 2 + yOff, 8, 1);
    x.fillRect(4, 13 + yOff, 8, 1);

    // Highlights
    x.fillStyle = 'rgba(255,255,255,0.3)';
    x.fillRect(5, 3 + yOff, 1, 10);
    return c;
  });
}

function mkBox(): HTMLCanvasElement[] { // Glem's Cereal
  return [0, 1].map(f => {
    const [c, x] = canvas(T, T);
    const yOff = f === 1 ? -1 : 0;

    // Box outline
    x.fillStyle = '#111';
    x.fillRect(2, 1 + yOff, 12, 14);

    // Yellow top half
    x.fillStyle = '#FDD835';
    x.fillRect(3, 2 + yOff, 10, 6);

    // Light blue bottom half
    x.fillStyle = '#4FC3F7';
    x.fillRect(3, 8 + yOff, 10, 6);

    // Orange/yellow side spine (left edge depth)
    x.fillStyle = '#FFA726';
    x.fillRect(3, 2 + yOff, 2, 12);
    x.fillStyle = '#81D4FA';
    x.fillRect(3, 8 + yOff, 1, 6);

    // "Glem's" text area - red/orange on yellow
    x.fillStyle = '#E64A19';
    x.fillRect(6, 4 + yOff, 6, 2);
    x.fillStyle = '#FFF';
    x.fillRect(6, 4 + yOff, 6, 1); // text highlight
    x.fillStyle = '#E64A19';
    x.fillRect(7, 4 + yOff, 1, 1); x.fillRect(9, 4 + yOff, 1, 1); x.fillRect(11, 4 + yOff, 1, 1);
    x.fillRect(6, 5 + yOff, 5, 1);

    // Cereal bowl
    x.fillStyle = '#FFF';
    x.beginPath(); x.ellipse(9, 11 + yOff, 4, 3, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#E0E0E0';
    x.beginPath(); x.ellipse(9, 11 + yOff, 3, 2, 0, 0, Math.PI * 2); x.fill();

    // Cereal pieces inside bowl
    x.fillStyle = '#D4A056';
    x.fillRect(7, 10 + yOff, 2, 1); x.fillRect(9, 10 + yOff, 2, 1);
    x.fillRect(6, 11 + yOff, 2, 1); x.fillRect(10, 11 + yOff, 2, 1);
    x.fillRect(8, 11 + yOff, 1, 1);
    x.fillStyle = '#C08A3E';
    x.fillRect(8, 10 + yOff, 1, 1); x.fillRect(7, 11 + yOff, 1, 1);
    x.fillRect(10, 10 + yOff, 1, 1); x.fillRect(9, 12 + yOff, 1, 1);

    // Right edge depth
    x.fillStyle = '#F9A825';
    x.fillRect(12, 2 + yOff, 1, 6);
    x.fillStyle = '#0288D1';
    x.fillRect(12, 8 + yOff, 1, 6);
    return c;
  });
}

function mkBag(): HTMLCanvasElement[] { // Classic Chips
  return [0, 1].map(f => {
    const [c, x] = canvas(T, T + 4);
    const yOff = f === 1 ? -1 : 0;

    // Dynamic crumpled bag shape
    x.fillStyle = '#F57C00'; // Base Orange
    x.beginPath();
    x.moveTo(4, 2 + yOff);
    x.lineTo(12, 2 + yOff);
    x.lineTo(13, 8 + yOff);
    x.lineTo(12, 14 + yOff);
    x.lineTo(4, 14 + yOff);
    x.lineTo(3, 8 + yOff);
    x.fill();

    // Yellow stripes
    x.fillStyle = '#FFB300';
    x.fillRect(4, 4 + yOff, 8, 2);
    x.fillRect(4, 11 + yOff, 8, 2);

    // Dark brown/burgundy center area
    x.fillStyle = '#5D4037';
    x.fillRect(4, 6 + yOff, 8, 4);

    // White text "CLASSIC CHIPS"
    x.fillStyle = '#FFF';
    x.fillRect(5, 7 + yOff, 6, 1);
    x.fillRect(5, 8 + yOff, 6, 1);

    // Top and bottom seals
    x.fillStyle = '#5D4037';
    x.fillRect(4, 1 + yOff, 8, 2);
    x.fillRect(4, 14 + yOff, 8, 2);

    // Seal crimps
    x.fillStyle = '#3E2723';
    x.fillRect(5, 1 + yOff, 1, 2); x.fillRect(7, 1 + yOff, 1, 2); x.fillRect(9, 1 + yOff, 1, 2);
    x.fillRect(5, 14 + yOff, 1, 2); x.fillRect(7, 14 + yOff, 1, 2); x.fillRect(9, 14 + yOff, 1, 2);

    // Light reflection
    x.fillStyle = 'rgba(255,255,255,0.4)';
    x.fillRect(5, 3 + yOff, 1, 10);
    return c;
  });
}

function mkFloor(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  x.fillStyle = FL_A; x.fillRect(0, 0, T, T);
  x.fillStyle = FL_B; x.fillRect(0, 0, 8, 8); x.fillRect(8, 8, 8, 8);
  x.fillStyle = 'rgba(0,0,0,0.05)'; x.fillRect(0, 0, T, 1); x.fillRect(0, 0, 1, T);
  return c;
}
function mkShelf(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  x.fillStyle = SH_M; x.fillRect(0, 0, T, T);
  x.fillStyle = SH_D; x.fillRect(0, 0, T, 2); x.fillRect(0, 14, T, 2);
  x.fillStyle = SH_B; x.fillRect(0, 0, 2, T); x.fillRect(14, 0, 2, T);
  const cols = ['#FBC02D', '#F57C00', '#D32F2F', '#8D6E63', '#1976D2', '#FFCA28'];
  for (let i = 0; i < 4; i++) {
    const px = 2 + i * 3;
    const col = cols[i % cols.length];
    x.fillStyle = col;
    x.fillRect(px, 3, 3, 10);
    x.fillStyle = 'rgba(255,255,255,0.3)';
    x.fillRect(px + 1, 3, 1, 10);
  }
  return c;
}
function mkShelfTop(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  x.fillStyle = SH_M; x.fillRect(0, 0, T, 4);
  x.fillStyle = SH_D; x.fillRect(0, 0, T, 1);
  x.fillStyle = SH_B; x.fillRect(0, 3, T, 1);
  x.fillStyle = 'rgba(0,0,0,0.1)'; x.fillRect(0, 4, T, 2);
  return c;
}
function mkFridge(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  x.fillStyle = FR_B; x.fillRect(0, 0, T, T);
  x.fillStyle = FR_F; x.fillRect(0, 0, T, 2); x.fillRect(0, 14, T, 2); x.fillRect(0, 0, 2, T); x.fillRect(14, 0, 2, T);
  x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(3, 3, 4, 10);
  x.fillStyle = '#81D4FA'; x.fillRect(8, 4, 3, 5); x.fillRect(8, 10, 3, 3);
  x.fillStyle = '#A5D6A7'; x.fillRect(11, 4, 2, 5);
  return c;
}
function mkCheckout(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  x.fillStyle = CK_B; x.fillRect(0, 0, T, T);
  x.fillStyle = CK_T; x.fillRect(0, 0, T, 4);
  x.fillStyle = '#212121'; x.fillRect(1, 1, 14, 2);
  x.fillStyle = '#424242'; x.fillRect(3, 1, 2, 2); x.fillRect(7, 1, 2, 2); x.fillRect(11, 1, 2, 2);
  return c;
}
function mkWall(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  x.fillStyle = WL; x.fillRect(0, 0, T, T);
  x.fillStyle = WL_D; x.fillRect(0, 14, T, 2); x.fillRect(14, 0, 2, T);
  return c;
}
function mkCeiling(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  x.fillStyle = CL; x.fillRect(0, 0, T, T);
  x.fillStyle = '#B0BEC5'; x.fillRect(0, 14, T, 2);
  x.fillStyle = '#FFF9C4'; x.fillRect(4, 12, 8, 4);
  x.fillStyle = '#FFF176'; x.fillRect(6, 14, 4, 2);
  return c;
}
function mkCoin(): HTMLCanvasElement[] {
  return [8, 6, 3, 6].map(w => {
    const [c, x] = canvas(T, T);
    const px = (T - w) / 2;
    x.fillStyle = CN_G; x.fillRect(px, 3, w, 10); x.fillRect(px + 1, 2, Math.max(w - 2, 1), 12);
    x.fillStyle = CN_D; x.fillRect(px, 3, w, 1); x.fillRect(px, 12, w, 1);
    if (w > 4) { x.fillStyle = '#FFF8E1'; x.fillRect(px + 1, 4, 2, 4); x.fillStyle = CN_D; x.fillRect(Math.floor(px + w / 2), 5, 1, 6); }
    return c;
  });
}
function mkBeam(): HTMLCanvasElement {
  const [c, x] = canvas(12, 4);
  x.fillStyle = '#FF1744'; x.fillRect(0, 1, 12, 2);
  x.fillStyle = '#FF8A80'; x.fillRect(0, 1, 12, 1);
  x.fillStyle = 'rgba(255,23,68,0.3)'; x.fillRect(0, 0, 12, 1); x.fillRect(0, 3, 12, 1);
  return c;
}
function mkHeart(full: boolean): HTMLCanvasElement {
  const [c, x] = canvas(9, 8);
  const col = full ? '#F44336' : '#424242';
  x.fillStyle = col;
  x.fillRect(1, 0, 3, 1); x.fillRect(5, 0, 3, 1);
  x.fillRect(0, 1, 9, 4); x.fillRect(1, 5, 7, 1); x.fillRect(2, 6, 5, 1); x.fillRect(3, 7, 3, 1);
  x.fillStyle = full ? '#EF9A9A' : '#616161'; x.fillRect(1, 1, 2, 2);
  return c;
}

function mkBarcode(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  // Cyan/blue background with glow
  x.fillStyle = '#00E5FF'; x.fillRect(0, 0, T, T);
  x.fillStyle = '#40F0FF'; x.fillRect(1, 1, 14, 14);
  // Dark teal/black bars
  x.fillStyle = '#003840';
  x.fillRect(2, 2, 1, 12);
  x.fillRect(4, 2, 2, 12);
  x.fillRect(7, 2, 1, 12);
  x.fillRect(9, 2, 2, 12);
  x.fillRect(12, 2, 1, 12);
  x.fillRect(14, 2, 1, 12);
  // Black accent bars (thinner, overlaid)
  x.fillStyle = '#001518';
  x.fillRect(2, 4, 1, 3); x.fillRect(2, 9, 1, 3);
  x.fillRect(4, 4, 2, 3); x.fillRect(4, 9, 2, 3);
  x.fillRect(7, 4, 1, 3); x.fillRect(7, 9, 1, 3);
  x.fillRect(9, 4, 2, 3); x.fillRect(9, 9, 2, 3);
  x.fillRect(12, 4, 1, 3); x.fillRect(12, 9, 1, 3);
  x.fillRect(14, 3, 1, 4);
  // Corner highlights
  x.fillStyle = '#60D0FF';
  x.fillRect(0, 0, 1, 1); x.fillRect(15, 0, 1, 1);
  x.fillRect(0, 15, 1, 1); x.fillRect(15, 15, 1, 1);
  return c;
}

function mkExitDoor(): HTMLCanvasElement {
  const [c, x] = canvas(T, T);
  x.fillStyle = '#CFD8DC'; // Metallic frame
  x.fillRect(0, 0, T, T);
  x.fillStyle = '#1A237E'; // Dark glass
  x.fillRect(2, 2, 12, 14);
  x.fillStyle = '#E3F2FD'; // Glass reflection
  x.fillRect(3, 3, 2, 13);
  x.fillRect(6, 3, 1, 13);
  x.fillStyle = '#FFEB3B'; // Glowing Exit Sign on Top
  x.fillRect(4, 4, 8, 2);
  x.fillStyle = '#F44336'; // Red text "EXIT" abstract
  x.fillRect(5, 4, 1, 2); x.fillRect(7, 4, 1, 2); x.fillRect(9, 4, 1, 2); x.fillRect(11, 4, 1, 2);
  return c;
}

export interface GameSprites {
  playerIdle: HTMLCanvasElement[]; playerIdleLeft: HTMLCanvasElement[];
  playerRun: HTMLCanvasElement[]; playerRunLeft: HTMLCanvasElement[];
  playerJump: HTMLCanvasElement; playerJumpLeft: HTMLCanvasElement;
  playerScan: HTMLCanvasElement; playerScanLeft: HTMLCanvasElement;
  sidekickIdle: HTMLCanvasElement[]; sidekickIdleLeft: HTMLCanvasElement[];
  sidekickRun: HTMLCanvasElement[]; sidekickRunLeft: HTMLCanvasElement[];
  itemCan: HTMLCanvasElement[]; itemBox: HTMLCanvasElement[]; itemBag: HTMLCanvasElement[];
  floor: HTMLCanvasElement; shelf: HTMLCanvasElement; shelfTop: HTMLCanvasElement;
  fridge: HTMLCanvasElement; checkout: HTMLCanvasElement;
  wall: HTMLCanvasElement; ceiling: HTMLCanvasElement;
  coin: HTMLCanvasElement[]; scannerBeam: HTMLCanvasElement; scannerBeamLeft: HTMLCanvasElement;
  heartFull: HTMLCanvasElement; heartEmpty: HTMLCanvasElement;
  barcode: HTMLCanvasElement;
  exitDoor: HTMLCanvasElement;
}

export function createAllSprites(): GameSprites {
  const pi = mkPlayerIdle(), pr = mkPlayerRun(), pj = mkPlayerJump(), ps = mkPlayerScan();
  const si = mkSidekickIdle(), sr = mkSidekickRun();
  const beam = mkBeam();
  return {
    playerIdle: pi, playerIdleLeft: pi.map(flipH),
    playerRun: pr, playerRunLeft: pr.map(flipH),
    playerJump: pj, playerJumpLeft: flipH(pj),
    playerScan: ps, playerScanLeft: flipH(ps),
    sidekickIdle: si, sidekickIdleLeft: si.map(flipH),
    sidekickRun: sr, sidekickRunLeft: sr.map(flipH),
    itemCan: mkCan(), itemBox: mkBox(), itemBag: mkBag(),
    floor: mkFloor(), shelf: mkShelf(), shelfTop: mkShelfTop(),
    fridge: mkFridge(), checkout: mkCheckout(), wall: mkWall(), ceiling: mkCeiling(),
    coin: mkCoin(), scannerBeam: beam, scannerBeamLeft: flipH(beam),
    heartFull: mkHeart(true), heartEmpty: mkHeart(false),
    barcode: mkBarcode(),
    exitDoor: mkExitDoor(),
  };
}
