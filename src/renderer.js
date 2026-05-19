import { state, plotState, isPlotShielded, BUG_WARNING_MS, SPRINKLER_INTERVAL_MS, SPRINKLERS } from './state.js';
import { speciesById } from './plants.js';

const SOIL_Y_FRAC = 0.62;  // soil line as fraction of canvas CSS height
const PLOT_W = 130;
const PLOT_MARGIN = 30;

const canvas = document.getElementById('scene');
const mainCtx = canvas.getContext('2d');
let ctx = mainCtx; // swap-able so plant snapshots can render to an offscreen canvas

let cssW = 0, cssH = 0, dpr = 1;
let plotRects = []; // [{x, y, w, h, soilX, soilY, idx}] — y/h covers from below soil up to the top of canvas (so plant region included for hit-test)
const effects = []; // transient FX (water splashes, etc.)

export function initRenderer() {
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
}

function resize() {
  dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  cssW = Math.max(320, rect.width);
  cssH = Math.max(240, rect.height);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  recomputeLayout();
}

// Render a single plant on its own canvas. Used by the photo feature.
// Returns a data URL of the snapshot.
export function snapshotPlant(species, plot) {
  const w = 240, h = 340;
  const snap = document.createElement('canvas');
  snap.width = w; snap.height = h;
  const off = snap.getContext('2d');
  const prevCtx = ctx;
  ctx = off;
  try {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, '#9ed8ff');
    sky.addColorStop(1, '#dff2ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // One soft hill
    ctx.fillStyle = '#7cb47a';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.bezierCurveTo(w * 0.3, h * 0.55, w * 0.7, h * 0.75, w, h * 0.65);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // Soil
    const soilY = h * 0.82;
    ctx.fillStyle = '#5cb05c';
    ctx.fillRect(0, soilY - 6, w, 8);
    const soil = ctx.createLinearGradient(0, soilY, 0, h);
    soil.addColorStop(0, '#6a4424');
    soil.addColorStop(1, '#3a200c');
    ctx.fillStyle = soil;
    ctx.fillRect(0, soilY + 2, w, h - soilY);

    // Plot dish
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(w / 2, soilY + 2, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plant centered. Use a synthetic plot record so drawPlant centers naturally.
    const fakeR = { soilX: w / 2, soilY, idx: 0, x: 0, y: 0, w, h };
    drawPlant(species, plot, fakeR, 0, 0);

    // Caption: species name + growth %
    const pct = Math.round(plot.growthProgress * 100);
    const caption = `${species.name} · ${pct}%`;
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const padX = 10, ch = 22;
    const cw = Math.ceil(ctx.measureText(caption).width) + padX * 2;
    const cx = w / 2 - cw / 2;
    const cy = h - 22;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    roundRect(cx, cy - ch / 2, cw, ch, ch / 2);
    ctx.fill();
    ctx.fillStyle = '#f0f6ec';
    ctx.fillText(caption, w / 2, cy + 1);

    return snap.toDataURL('image/png');
  } finally {
    ctx = prevCtx;
  }
}

let photoModeOn = false;
export function setPhotoModeVisual(on) { photoModeOn = !!on; }

let editTool = null;
let editSrcPlot = -1;
let decorPreview = null; // {type, x, y} in CSS px, or null
export function setEditModeVisual(tool, srcPlot = -1) {
  editTool = tool || null;
  editSrcPlot = (typeof srcPlot === 'number') ? srcPlot : -1;
  if (!editTool) decorPreview = null;
}
export function setDecorPreview(type, x, y) {
  if (!type || x == null || y == null) { decorPreview = null; return; }
  decorPreview = { type, x, y };
}

// Real ground-plane perspective: a point at screen-y position projects so that
// projected_size ∝ (y - horizon). Things at the horizon are infinitely far →
// vanishingly small; things near the bottom are close → large. We clamp the
// minimum so very-distant items remain just barely visible and clickable.
const DECOR_HORIZON_FRAC = 0.40; // matches the hill tops
const DECOR_SCALE_PER_FRAC = 9.0;
const DECOR_MIN_SCALE = 0.50;
const DECOR_MAX_SCALE = 5.0;        // safety cap so a tree never eats the screen
const DECOR_DIRT_BOOST = 2.0;       // 2× bonus when touching the dirt
export function decorScaleAtY(yFrac) {
  let s = Math.max(DECOR_MIN_SCALE, (yFrac - DECOR_HORIZON_FRAC) * DECOR_SCALE_PER_FRAC);
  if (yFrac >= SOIL_Y_FRAC) s *= DECOR_DIRT_BOOST;
  return Math.min(DECOR_MAX_SCALE, s);
}

export function cssToFrac(x, y) {
  if (cssW <= 0 || cssH <= 0) return { xFrac: 0.5, yFrac: 0.5 };
  return { xFrac: x / cssW, yFrac: y / cssH };
}

export function getCanvasCSSSize() { return { w: cssW, h: cssH }; }

function recomputeLayout() {
  plotRects = [];
  const n = state.plotCount;
  if (n <= 0) return;
  const soilY = cssH * SOIL_Y_FRAC;
  const totalW = n * PLOT_W + (n - 1) * PLOT_MARGIN;
  const startX = (cssW - totalW) / 2;
  for (let i = 0; i < n; i++) {
    const x = startX + i * (PLOT_W + PLOT_MARGIN);
    plotRects.push({
      idx: i,
      x, y: 0,
      w: PLOT_W, h: cssH,
      soilX: x + PLOT_W / 2,
      soilY,
    });
  }
}

export function getPlotRects() { return plotRects; }

export function relayout() { recomputeLayout(); }

export function spawnWaterEffect(plotIdx) {
  effects.push({
    type: 'water',
    plotIdx,
    start: performance.now(),
    duration: 1100,
  });
}

// Hit-test: return plot idx or -1
export function hitTest(cssX, cssY) {
  for (const r of plotRects) {
    if (cssX >= r.x && cssX <= r.x + r.w) {
      // generous vertical range: from a bit above the soil line down to the bottom,
      // plus the whole plant column above for growing/mature plants. Potted plots
      // extend further down so the rim/pot body is still clickable.
      const extra = state.potPlots.includes(r.idx) ? GROUND_POT.h : 0;
      if (cssY >= 0 && cssY <= r.soilY + 60 + extra) return r.idx;
    }
  }
  return -1;
}

function decorBounds(item) {
  const x = item.xFrac * cssW;
  const y = item.yFrac * cssH;
  const s = decorScaleAtY(item.yFrac);
  let bx, by, bw, bh;
  if      (item.type === 'tree')  { bw = 60 * s; bh = 80 * s; bx = x - bw / 2; by = y - bh; }
  else if (item.type === 'bush')  { bw = 52 * s; bh = 26 * s; bx = x - bw / 2; by = y - bh; }
  else if (item.type === 'house') { bw = 72 * s; bh = 70 * s; bx = x - bw / 2; by = y - bh; }
  else if (item.type === 'fence') { bw = 56 * s; bh = 30 * s; bx = x - bw / 2; by = y - bh; }
  else if (item.type === 'rock')  { bw = 48 * s; bh = 22 * s; bx = x - bw / 2; by = y - bh; }
  else                            { bw = 24 * s; bh = 24 * s; bx = x - bw / 2; by = y - bh / 2; }
  // Guarantee a clickable hit area even when the item renders very small.
  const MIN = 18;
  if (bw < MIN) { bx -= (MIN - bw) / 2; bw = MIN; }
  if (bh < MIN) { by -= (MIN - bh) / 2; bh = MIN; }
  return { x: bx, y: by, w: bw, h: bh };
}

export function hitTestDecor(cssX, cssY) {
  // Topmost first (most recently added).
  for (let i = state.decor.length - 1; i >= 0; i--) {
    const d = state.decor[i];
    const b = decorBounds(d);
    if (cssX >= b.x && cssX <= b.x + b.w && cssY >= b.y && cssY <= b.y + b.h) return d.id;
  }
  return null;
}

// Anchor offset (in unscaled pixels) from the decor item's foot position
// (cx, by) — i.e. where a hanging pot will hang.
function hangingAnchor(type) {
  if (type === 'tree')  return { x: 14, y: -34 };  // at the bottom of the canopy
  if (type === 'house') return { x: -22, y: -52 }; // under an eave
  if (type === 'bush')  return { x: 0,  y: -22 };
  if (type === 'fence') return { x: 0,  y: -30 };
  if (type === 'rock')  return { x: 0,  y: -18 };
  return { x: 0, y: -20 };
}

function hangingPotPos(hp) {
  const dec = state.decor.find(d => d.id === hp.decorId);
  if (!dec) return null;
  const dx = dec.xFrac * cssW;
  const dy = dec.yFrac * cssH;
  const scale = decorScaleAtY(dec.yFrac);
  const a = hangingAnchor(dec.type);
  return {
    decX: dx, decY: dy, scale,
    x: dx + a.x * scale,
    y: dy + a.y * scale,
  };
}

export function hitTestHanging(cssX, cssY) {
  for (let i = state.hangingPots.length - 1; i >= 0; i--) {
    const hp = state.hangingPots[i];
    const pos = hangingPotPos(hp);
    if (!pos) continue;
    // Match drawHangingPotItem: s uses the same 0.6 floor so the hit area
    // tracks the actual rendered pot rather than the raw perspective scale.
    const s = Math.max(0.6, pos.scale) * HANGING_POT_VIS_SCALE;
    const ropeLen = 36 * s;
    const potH = 20 * s;
    const py = pos.y + ropeLen; // top of pot rim, same as the draw fn
    const halfW = Math.max(16, 22 * s + 8);
    const above = Math.max(34, 80 * s + 14); // covers plant rising above pot
    const below = Math.max(20, potH + 30 * s + 6); // covers pot + affordance/bar
    if (cssX >= pos.x - halfW && cssX <= pos.x + halfW
        && cssY >= py - above && cssY <= py + below) {
      return hp.id;
    }
  }
  return null;
}

export function render(nowMs) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, cssH * 0.7);
  sky.addColorStop(0, '#9ed8ff');
  sky.addColorStop(1, '#dff2ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cssW, cssH);

  drawHills();
  drawSoil();
  drawDecor();
  drawPlotBases();
  drawPots();
  drawPlants(nowMs);
  drawEffects(nowMs);
  drawAffordances(nowMs);
  drawProgressBars(nowMs);
  drawThirstAlerts(nowMs);
  drawSprinklers(nowMs);
  drawShields(nowMs);
  drawBugWarning(nowMs);
  drawBugs(nowMs);
  drawHangingPots(nowMs);
  drawPlantNames(nowMs);
  drawEditOverlay(nowMs);
  drawDecorPreview();
}

// ─── SPRINKLERS ────────────────────────────────────────────────────────────

function drawSprinklers(nowMs) {
  const soilY = cssH * SOIL_Y_FRAC;
  const now = Date.now();
  for (const s of state.sprinklers) {
    const cfg = SPRINKLERS[s.type];
    if (!cfg) continue;
    const x = s.xFrac * cssW;
    const remaining = Math.max(0, s.nextWaterAt - now);
    const cycleT = 1 - remaining / SPRINKLER_INTERVAL_MS;
    drawSprinklerSprite(x, soilY, cfg, cycleT, nowMs);

    // Lifetime bar above the sprinkler (drains left → right).
    const total = cfg.lifetimeMs;
    const lifeLeft = Math.max(0, (s.expiresAt || 0) - now);
    const lifeFrac = total > 0 ? Math.max(0, Math.min(1, lifeLeft / total)) : 0;
    const barW = 28, barH = 3;
    const bx = x - barW / 2, by = soilY - 32;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = cfg.id === 'good' ? '#ffd870' : '#a8d8ff';
    ctx.fillRect(bx, by, barW * lifeFrac, barH);
    ctx.restore();
  }
}

// Tap-to-remove hit area covers the sprinkler base + head.
export function hitTestSprinkler(cssX, cssY) {
  const soilY = cssH * SOIL_Y_FRAC;
  for (let i = state.sprinklers.length - 1; i >= 0; i--) {
    const s = state.sprinklers[i];
    const x = s.xFrac * cssW;
    if (cssX >= x - 12 && cssX <= x + 12 && cssY >= soilY - 28 && cssY <= soilY + 8) {
      return s.id;
    }
  }
  return null;
}

function drawSprinklerSprite(x, y, cfg, cycleT, nowMs) {
  const isGood = cfg.id === 'good';
  ctx.save();
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Base
  ctx.fillStyle = isGood ? '#c0a060' : '#7a7a7a';
  ctx.strokeStyle = '#2a2018';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(x - 6, y - 6, 12, 8);
  ctx.fill();
  ctx.stroke();
  // Stem
  ctx.fillStyle = isGood ? '#a88840' : '#5a5a5a';
  ctx.fillRect(x - 2, y - 18, 4, 12);
  // Head — small pivoting cross
  const spin = nowMs / 600 + (isGood ? 0.5 : 0);
  ctx.save();
  ctx.translate(x, y - 20);
  ctx.rotate(spin);
  ctx.fillStyle = isGood ? '#ffd870' : '#c0c0c0';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a2018';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
  ctx.moveTo(0, -3); ctx.lineTo(0, 3);
  ctx.stroke();
  ctx.restore();
  // Spray puff that ramps as we approach the next watering tick
  if (cycleT > 0.85) {
    const puff = (cycleT - 0.85) / 0.15;
    ctx.fillStyle = `rgba(120, 200, 255, ${0.45 * puff})`;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(x + i * 6, y - 24 - puff * 4, 2 + puff * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ─── BUGS & SHIELDS ────────────────────────────────────────────────────────

// Where the bug sits in screen px, based on its host plant's current stem.
function bugPos(bug) {
  const r = plotRects[bug.plotIdx];
  if (!r) return null;
  const plot = state.plots[bug.plotIdx];
  if (!plot || !plot.species) return null;
  const sp = speciesById(plot.species);
  if (!sp) return null;
  const eg = easeOutQuad(plot.growthProgress);
  const stemH = sp.stem.heightPx * eg;
  // Bug clings beside the stem at stemFrac height; offset out by 10px so it's tappable.
  const y = r.soilY - stemH * bug.stemFrac;
  const x = r.soilX + bug.sideSign * (sp.stem.thicknessPx * 0.5 + 10);
  return { x, y };
}

export function hitTestBug(cssX, cssY) {
  for (let i = state.bugs.length - 1; i >= 0; i--) {
    const b = state.bugs[i];
    const pos = bugPos(b);
    if (!pos) continue;
    const dx = cssX - pos.x;
    const dy = cssY - pos.y;
    // Comfortable click target — 18px radius covers the ~12px bug body plus legs.
    if (dx * dx + dy * dy <= 18 * 18) return b.id;
  }
  return null;
}

function drawBugWarning(nowMs) {
  const w = state.bugWarning;
  if (!w) return;
  const remaining = w.spawnAt - Date.now();
  if (remaining > BUG_WARNING_MS) return; // not in the warning window yet
  const r = plotRects[w.plotIdx];
  if (!r) return;
  // Position above the plant.
  const plot = state.plots[w.plotIdx];
  const sp = plot && plot.species ? speciesById(plot.species) : null;
  const stemH = sp ? sp.stem.heightPx * easeOutQuad(plot.growthProgress) : 0;
  const baseY = r.soilY - Math.max(60, stemH + 28);
  // Pulse intensity ramps up as spawn nears.
  const t = Math.max(0, Math.min(1, 1 - remaining / BUG_WARNING_MS));
  const pulse = 0.6 + 0.4 * Math.sin(nowMs / 90);
  const cy = baseY + Math.sin(nowMs / 180) * 3;
  const cx = r.soilX;
  ctx.save();
  // Pill background, color shifts orange→red as t→1
  const red   = Math.round(180 + t * 60);
  const green = Math.round(120 - t * 80);
  ctx.fillStyle = `rgba(${red}, ${green}, 40, ${0.55 + 0.35 * pulse})`;
  ctx.strokeStyle = `rgba(255, 230, 160, ${0.7 + 0.3 * pulse})`;
  ctx.lineWidth = 1;
  const pad = 8, h = 22;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = '⚠ BUG';
  const w0 = Math.ceil(ctx.measureText(label).width) + pad * 2;
  roundRect(cx - w0 / 2, cy - h / 2, w0, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff4d8';
  ctx.fillText(label, cx, cy + 1);
  ctx.restore();
}

function drawBugs(nowMs) {
  for (const b of state.bugs) {
    const pos = bugPos(b);
    if (!pos) continue;
    drawBugSprite(pos.x, pos.y, b.sideSign, b.angle + nowMs / 200);
  }
}

function drawBugSprite(x, y, sideSign, phase) {
  ctx.save();
  ctx.translate(x, y);
  // Body
  ctx.fillStyle = '#3a1c12';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ladybug back
  ctx.fillStyle = '#c8341c';
  ctx.beginPath();
  ctx.ellipse(0, -1, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Spots
  ctx.fillStyle = '#2a1408';
  for (const [sx, sy] of [[-3, -2], [3, -1], [-1, 1], [2, 2]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Head
  ctx.fillStyle = '#1a0e08';
  ctx.beginPath();
  ctx.ellipse(sideSign * 5, 0, 2.5, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs (wiggle)
  ctx.strokeStyle = '#1a0e08';
  ctx.lineWidth = 1;
  const wig = Math.sin(phase) * 1.4;
  for (let i = 0; i < 3; i++) {
    const lx = -4 + i * 4;
    ctx.beginPath();
    ctx.moveTo(lx, 2);
    ctx.lineTo(lx - 2, 6 + wig * ((i % 2) ? -1 : 1));
    ctx.moveTo(lx, -2);
    ctx.lineTo(lx - 2, -6 - wig * ((i % 2) ? -1 : 1));
    ctx.stroke();
  }
  ctx.restore();
}

function drawShields(nowMs) {
  ctx.save();
  for (const idx of state.shieldedPlots) {
    const r = plotRects[idx];
    if (!r) continue;
    // Hovering spray-can badge above the plot.
    const bob = Math.sin(nowMs / 700 + idx) * 2;
    const cx = r.soilX + 38;
    const cy = r.soilY - 30 + bob;
    // Can body
    ctx.fillStyle = '#2a6a30';
    ctx.strokeStyle = '#8ce888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(cx - 5, cy - 4, 10, 12);
    ctx.fill();
    ctx.stroke();
    // Nozzle/cap
    ctx.fillStyle = '#8ce888';
    ctx.beginPath();
    ctx.rect(cx - 3, cy - 8, 6, 4);
    ctx.fill();
    // Spray puff coming out the top
    const puff = 0.5 + 0.5 * Math.sin(nowMs / 240 + idx);
    ctx.fillStyle = `rgba(168, 232, 160, ${0.5 + 0.4 * puff})`;
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 2 + puff * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ─── BUG SPRAY PARTICLES ───────────────────────────────────────────────────

export function spawnSprayEffect(plotIdx) {
  // 18 little green specks puffing upward and outward from the plant base.
  const N = 18;
  const particles = [];
  for (let i = 0; i < N; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 60 + Math.random() * 80;
    particles.push({
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 900 + Math.random() * 400,
      size: 2 + Math.random() * 2,
      hue: 100 + Math.random() * 30, // greens
    });
  }
  effects.push({
    type: 'spray',
    plotIdx,
    start: performance.now(),
    duration: 1300,
    particles,
  });
}

function drawSprayEffect(e, age) {
  const r = plotRects[e.plotIdx];
  if (!r) return;
  const t = age / 1000; // seconds since start
  ctx.save();
  for (const p of e.particles) {
    if (age > p.life) continue;
    const lifeT = age / p.life;
    // Decel + slight gravity so puff drifts up then settles.
    const drag = Math.exp(-2.0 * t);
    const x = r.soilX + p.vx * t * drag;
    const y = r.soilY - 10 + p.vy * t * drag + 90 * lifeT * lifeT;
    const alpha = 0.9 * (1 - lifeT);
    const size = p.size * (1 + lifeT * 0.6);
    ctx.fillStyle = `hsla(${p.hue}, 75%, 55%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHangingPots(nowMs) {
  for (const hp of state.hangingPots) {
    const pos = hangingPotPos(hp);
    if (!pos) continue;
    drawHangingPotItem(hp, pos, nowMs);
  }
}

// Hanging planters render 5× smaller than the underlying decor perspective scale.
const HANGING_POT_VIS_SCALE = 0.2;

function drawHangingPotItem(hp, pos, nowMs) {
  const s = Math.max(0.6, pos.scale) * HANGING_POT_VIS_SCALE;
  ctx.save();
  // Pot (smaller terracotta). Hangs below the anchor (bottom of leaves) by ropeLen.
  const topW = 32 * s, botW = 22 * s, h = 20 * s;
  const ropeLen = 36 * s;
  const py = pos.y + ropeLen; // top of pot rim
  // Ropes from the canopy anchor down to the pot rim corners
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x - topW / 2, py);
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x + topW / 2, py);
  ctx.stroke();
  ctx.fillStyle = '#b85a28';
  ctx.beginPath();
  ctx.moveTo(pos.x - topW / 2, py);
  ctx.lineTo(pos.x + topW / 2, py);
  ctx.lineTo(pos.x + botW / 2, py + h);
  ctx.lineTo(pos.x - botW / 2, py + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a3818';
  ctx.fillRect(pos.x - topW / 2 - 2 * s, py - 4 * s, topW + 4 * s, 5 * s);

  // Plant (drawn into a temporary transform). Scale plant down to ~0.55× of normal.
  if (hp.plot && hp.plot.species) {
    const sp = speciesById(hp.plot.species);
    if (sp) {
      const plantScale = 0.55 * s;
      ctx.save();
      ctx.translate(pos.x, py);
      ctx.scale(plantScale, plantScale);
      drawPlant(sp, hp.plot, { soilX: 0, soilY: 0, idx: 9000 + state.hangingPots.indexOf(hp) }, nowMs, 9000 + state.hangingPots.indexOf(hp));
      ctx.restore();
    }
  }

  // Affordance / progress
  const st = plotState(hp.plot);
  let glyph = '+';
  let color = 'rgba(255,255,255,0.85)';
  if (st === 'growing') { glyph = '💧'; color = 'rgba(255,255,255,0.65)'; }
  else if (st === 'mature') { glyph = '★'; color = '#ffe78a'; }
  const bob = st === 'mature' ? Math.sin(nowMs / 400 + (state.hangingPots.indexOf(hp))) * 2 : 0;
  ctx.font = `${Math.round(14 * Math.max(0.8, s))}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(pos.x, py + h + 12 * s + bob, 11 * Math.max(0.8, s), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(glyph, pos.x, py + h + 12 * s + bob + 1);

  // Mini progress bar while growing
  if (hp.plot && hp.plot.species && hp.plot.growthProgress < 1) {
    const W = 40 * s, H = 4 * s;
    const x = pos.x - W / 2;
    const y = py + h + 26 * s;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, W, H);
    const watered = nowMs < hp.plot.wateredUntil;
    ctx.fillStyle = watered ? '#a8e0ff' : '#a8e08a';
    ctx.fillRect(x, y, W * hp.plot.growthProgress, H);
  }
  ctx.restore();
}

function drawDecor() {
  const items = [...state.decor].sort((a, b) => a.yFrac - b.yFrac);
  for (const item of items) {
    const x = item.xFrac * cssW;
    const y = item.yFrac * cssH;
    drawDecorItem(item.type, x, y, decorScaleAtY(item.yFrac), 1);
  }
}

function drawDecorPreview() {
  if (!decorPreview) return;
  const yFrac = decorPreview.y / Math.max(1, cssH);
  drawDecorItem(decorPreview.type, decorPreview.x, decorPreview.y, decorScaleAtY(yFrac), 0.5);
  // Ground spot to anchor the preview.
  ctx.save();
  ctx.strokeStyle = 'rgba(168, 168, 255, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.ellipse(decorPreview.x, decorPreview.y, 8, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDecorItem(type, x, y, scale, alpha) {
  ctx.save();
  if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (type === 'tree')  drawTree(0, 0);
  else if (type === 'bush')  drawBush(0, 0);
  else if (type === 'house') drawHouse(0, 0);
  else if (type === 'fence') drawFence(0, 0);
  else if (type === 'rock')  drawRock(0, 0);
  ctx.restore();
}

function drawTree(cx, by) {
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, by, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // trunk
  ctx.fillStyle = '#6a4424';
  ctx.fillRect(cx - 5, by - 36, 10, 36);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 5, by - 36, 10, 36);
  // canopy
  ctx.fillStyle = '#3a7a3a';
  ctx.beginPath(); ctx.arc(cx, by - 52, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a8a4a';
  ctx.beginPath(); ctx.arc(cx - 14, by - 46, 16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 14, by - 46, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5ca84a';
  ctx.beginPath(); ctx.arc(cx - 4, by - 60, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBush(cx, by) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, by, 22, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a7a3a';
  ctx.beginPath(); ctx.ellipse(cx, by - 10, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a8a4a';
  ctx.beginPath(); ctx.ellipse(cx - 10, by - 14, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 10, by - 14, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5cb05c';
  ctx.beginPath(); ctx.ellipse(cx, by - 18, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHouse(cx, by) {
  ctx.save();
  const w = 60, h = 42;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, by, w * 0.55, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // wall
  ctx.fillStyle = '#d8b48c';
  ctx.fillRect(cx - w / 2, by - h, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - w / 2, by - h, w, h);
  // roof
  ctx.fillStyle = '#8a3818';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 4, by - h);
  ctx.lineTo(cx, by - h - 22);
  ctx.lineTo(cx + w / 2 + 4, by - h);
  ctx.closePath();
  ctx.fill();
  // door
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(cx - 7, by - 22, 14, 22);
  ctx.fillStyle = '#ffd84a';
  ctx.fillRect(cx + 4, by - 13, 2, 2);
  // window
  ctx.fillStyle = '#a8d8e8';
  ctx.fillRect(cx + 12, by - h + 8, 14, 14);
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx + 12, by - h + 8, 14, 14);
  ctx.beginPath();
  ctx.moveTo(cx + 19, by - h + 8); ctx.lineTo(cx + 19, by - h + 22);
  ctx.moveTo(cx + 12, by - h + 15); ctx.lineTo(cx + 26, by - h + 15);
  ctx.stroke();
  ctx.restore();
}

function drawFence(cx, by) {
  ctx.save();
  const w = 56;
  ctx.fillStyle = '#b08648';
  // rails
  ctx.fillRect(cx - w / 2, by - 20, w, 3);
  ctx.fillRect(cx - w / 2, by - 8, w, 3);
  // pickets
  const segs = 5;
  for (let i = 0; i < segs; i++) {
    const px = cx - w / 2 + 4 + i * ((w - 8) / (segs - 1));
    ctx.beginPath();
    ctx.moveTo(px - 3, by);
    ctx.lineTo(px - 3, by - 22);
    ctx.lineTo(px, by - 28);
    ctx.lineTo(px + 3, by - 22);
    ctx.lineTo(px + 3, by);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < segs; i++) {
    const px = cx - w / 2 + 4 + i * ((w - 8) / (segs - 1));
    ctx.beginPath();
    ctx.moveTo(px, by);
    ctx.lineTo(px, by - 28);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRock(cx, by) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, by, 22, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#807c78';
  ctx.beginPath();
  ctx.ellipse(cx, by - 8, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8a4a0';
  ctx.beginPath();
  ctx.ellipse(cx - 6, by - 12, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 2, by - 4);
  ctx.lineTo(cx + 12, by - 9);
  ctx.stroke();
  ctx.restore();
}

function drawPots() {
  for (const idx of state.potPlots) {
    const r = plotRects[idx];
    if (!r) continue;
    drawPot(r.soilX, r.soilY);
  }
}

// Ground pot: big terracotta planter that sits on the soil line.
// Hanging pots are drawn separately (smaller scale) and unaffected by these dims.
const GROUND_POT = { topW: 70, botW: 50, h: 42, rimH: 6 };

function drawPot(cx, sy) {
  const { topW, botW, h, rimH } = GROUND_POT;
  ctx.save();
  // Body
  ctx.fillStyle = '#b85a28';
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, sy);
  ctx.lineTo(cx + topW / 2, sy);
  ctx.lineTo(cx + botW / 2, sy + h);
  ctx.lineTo(cx - botW / 2, sy + h);
  ctx.closePath();
  ctx.fill();
  // Rim
  ctx.fillStyle = '#8a3818';
  ctx.fillRect(cx - topW / 2 - 3, sy - rimH, topW + 6, rimH);
  // Subtle shading on the lower-right side
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.moveTo(cx + topW / 2 - 4, sy);
  ctx.lineTo(cx + topW / 2, sy);
  ctx.lineTo(cx + botW / 2, sy + h);
  ctx.lineTo(cx + botW / 2 - 4, sy + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEditOverlay() {
  if (!editTool) return;
  // Dashed ring over selected source plot (move tool only).
  if (editTool === 'move' && editSrcPlot >= 0 && editSrcPlot < plotRects.length) {
    const r = plotRects[editSrcPlot];
    ctx.save();
    ctx.strokeStyle = '#ffcc4a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(r.soilX, r.soilY + 2, 42, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPlantNames(nowMs) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '12px Georgia, serif';
  for (let i = 0; i < state.plotCount; i++) {
    const plot = state.plots[i];
    if (!plot || !plot.species) continue;
    const sp = speciesById(plot.species);
    if (!sp) continue;
    const r = plotRects[i];

    const stemH = sp.stem.heightPx * easeOutQuad(plot.growthProgress);
    const tipY = r.soilY - stemH;
    const bloomR = (sp.bloom?.sizePx || 24) * 0.6;
    const y = tipY - bloomR - 16;

    const label = sp.name;
    const padX = 8, h = 18;
    const w = Math.ceil(ctx.measureText(label).width) + padX * 2;
    const x = r.soilX - w / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    roundRect(x, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = '#f0f6ec';
    ctx.fillText(label, r.soilX, y + 1);
  }
  ctx.restore();
}

function drawThirstAlerts(nowMs) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < state.plotCount; i++) {
    const plot = state.plots[i];
    if (!plot || !plot.species) continue;
    if (plot.growthProgress >= 1) continue;
    if (nowMs < plot.wateredUntil) continue; // currently watered → no alert
    const sp = speciesById(plot.species);
    if (!sp) continue;
    const r = plotRects[i];

    // Anchor next to upper-middle of the (current) plant.
    const stemH = sp.stem.heightPx * easeOutQuad(plot.growthProgress);
    const anchorY = r.soilY - Math.max(40, stemH * 0.7);
    const bob = Math.sin(nowMs / 280 + i) * 2;
    const baseX = r.soilX + 22;
    const y = anchorY + bob;

    // Faint background pill so it reads on any sky color.
    const padX = 6, w = 38, h = 22;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    roundRect(baseX, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 220, 120, 0.65)';
    ctx.lineWidth = 1;
    roundRect(baseX, y - h / 2, w, h, h / 2);
    ctx.stroke();

    // "!" — drawn as a colored glyph for emphasis.
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillStyle = '#ffcc4a';
    ctx.fillText('!', baseX + padX, y + 1);

    // Droplet
    ctx.font = '14px Georgia, serif';
    ctx.fillText('💧', baseX + padX + 10, y + 1);
  }
  ctx.restore();
}

// Shift HUD overlays below the pot when this plot is potted, so the
// progress bar and thirst alerts clear the rim.
function overlayOffset(idx) {
  return state.potPlots.includes(idx) ? GROUND_POT.h + 6 : 0;
}

function drawProgressBars(nowMs) {
  const W = 70, H = 6;
  ctx.save();
  for (let i = 0; i < state.plotCount; i++) {
    const plot = state.plots[i];
    if (!plot || !plot.species || plot.growthProgress >= 1) continue;
    const r = plotRects[i];
    const x = r.soilX - W / 2;
    const y = r.soilY + 48 + overlayOffset(i);
    const watered = nowMs < plot.wateredUntil;

    // Track
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    roundRect(x, y, W, H, H / 2);
    ctx.fill();

    // Fill
    const fillW = Math.max(0, Math.min(1, plot.growthProgress)) * W;
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(x, y, x + W, y);
      if (watered) {
        grad.addColorStop(0, '#6cb4d8');
        grad.addColorStop(1, '#a8e0ff');
      } else {
        grad.addColorStop(0, '#5cb05c');
        grad.addColorStop(1, '#a8e08a');
      }
      ctx.fillStyle = grad;
      roundRect(x, y, fillW, H, H / 2);
      ctx.fill();
    }

    // Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    roundRect(x, y, W, H, H / 2);
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawEffects(nowMs) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    const age = nowMs - e.start;
    if (age >= e.duration) { effects.splice(i, 1); continue; }
    if (e.type === 'water') drawWaterEffect(e, age);
    else if (e.type === 'spray') drawSprayEffect(e, age);
    else if (e.type === 'potion') drawPotionEffect(e, age);
  }
}

// Potion application: colored particles spiraling up + a flash ring.
export function spawnPotionEffect(plotIdx, color) {
  const N = 24;
  const particles = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 50 + Math.random() * 90;
    particles.push({
      angle: a,
      speed,
      rise: 70 + Math.random() * 60,
      life: 1100 + Math.random() * 400,
      size: 2.5 + Math.random() * 2,
    });
  }
  effects.push({
    type: 'potion',
    plotIdx,
    color,
    start: performance.now(),
    duration: 1600,
    particles,
  });
}

function drawPotionEffect(e, age) {
  const r = plotRects[e.plotIdx];
  if (!r) return;
  const t = age / 1000;
  ctx.save();
  // Flash ring
  if (age < 350) {
    const rt = age / 350;
    const radius = 12 + rt * 70;
    const alpha = 0.55 * (1 - rt);
    ctx.strokeStyle = e.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.soilX, r.soilY - 20, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Spiraling particles
  for (const p of e.particles) {
    if (age > p.life) continue;
    const lifeT = age / p.life;
    const radius = p.speed * t * Math.exp(-1.2 * t);
    const swirl = p.angle + t * 3.5;
    const x = r.soilX + Math.cos(swirl) * radius * 0.6;
    const y = r.soilY - 10 - p.rise * lifeT - Math.sin(swirl) * radius * 0.3;
    const alpha = 0.95 * (1 - lifeT);
    const size = p.size * (1 + lifeT * 0.4);
    ctx.fillStyle = e.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWaterEffect(e, age) {
  const r = plotRects[e.plotIdx];
  if (!r) return;
  const t = age / e.duration; // 0..1
  const drops = 6;
  ctx.save();
  for (let i = 0; i < drops; i++) {
    const offX = ((i - (drops - 1) / 2) * 9);
    const delay = i * 0.04;
    // Drop falls during [delay, delay+0.45] of total duration.
    const fallT = (t - delay) / 0.45;
    const startY = r.soilY - 160;
    const endY = r.soilY - 4;
    if (fallT > 0 && fallT < 1) {
      const dy = startY + (endY - startY) * (fallT * fallT); // accelerating
      const x = r.soilX + offX;
      // Trail
      ctx.fillStyle = 'rgba(120, 200, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, dy - 6, 1.2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Drop head
      ctx.fillStyle = 'rgba(140, 215, 255, 0.95)';
      ctx.beginPath();
      ctx.ellipse(x, dy, 2.3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (fallT >= 1) {
      // Splash ring expanding then fading
      const splashT = Math.min(1, (fallT - 1) / 0.6);
      const sr = 5 + splashT * 18;
      const alpha = 0.6 * (1 - splashT);
      ctx.strokeStyle = `rgba(140, 210, 255, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(r.soilX + offX, r.soilY - 1, sr, sr * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHills() {
  const baseY = cssH * 0.52;
  ctx.fillStyle = '#7cb47a';
  ctx.beginPath();
  ctx.moveTo(0, baseY + 40);
  ctx.bezierCurveTo(cssW * 0.25, baseY - 30, cssW * 0.55, baseY + 30, cssW, baseY - 10);
  ctx.lineTo(cssW, cssH);
  ctx.lineTo(0, cssH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#6ea268';
  ctx.beginPath();
  ctx.moveTo(0, baseY + 80);
  ctx.bezierCurveTo(cssW * 0.35, baseY + 20, cssW * 0.7, baseY + 80, cssW, baseY + 30);
  ctx.lineTo(cssW, cssH);
  ctx.lineTo(0, cssH);
  ctx.closePath();
  ctx.fill();
}

function drawSoil() {
  const soilY = cssH * SOIL_Y_FRAC;
  // Grass cap
  ctx.fillStyle = '#5cb05c';
  ctx.fillRect(0, soilY - 6, cssW, 8);
  // Soil
  const soil = ctx.createLinearGradient(0, soilY, 0, cssH);
  soil.addColorStop(0, '#6a4424');
  soil.addColorStop(1, '#3a200c');
  ctx.fillStyle = soil;
  ctx.fillRect(0, soilY + 2, cssW, cssH - soilY);
  // Soil speckles
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 80; i++) {
    const sx = (i * 137.5) % cssW;
    const sy = soilY + 8 + ((i * 53) % (cssH - soilY - 12));
    ctx.fillRect(sx, sy, 2, 2);
  }
}

function drawPlotBases() {
  for (const r of plotRects) {
    const hasPot = state.potPlots.includes(r.idx);
    if (!hasPot) {
      // Darker dug patch on the soil line.
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(r.soilX, r.soilY + 2, 28, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Photo-mode highlight ring above plots with plants.
    if (photoModeOn) {
      const plot = state.plots[r.idx];
      if (plot && plot.species) {
        ctx.strokeStyle = 'rgba(255, 204, 74, 0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.ellipse(r.soilX, r.soilY + 2, 36, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
}

function drawPlants(nowMs) {
  for (let i = 0; i < state.plotCount; i++) {
    const plot = state.plots[i];
    if (!plot || !plot.species) continue;
    const sp = speciesById(plot.species);
    if (!sp) continue;
    const r = plotRects[i];
    drawPlant(sp, plot, r, nowMs, i);
  }
}

function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// Simple seeded RNG → reproducible per-plant variation
function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function drawPlant(sp, plot, r, nowMs, plotIdx) {
  const g = plot.growthProgress;
  const eg = easeOutQuad(g);
  const mature = g >= 1;

  // Tip bob when mature.
  const bob = mature ? Math.sin(nowMs / 600 + plotIdx) * 3 : 0;

  const baseX = r.soilX;
  const baseY = r.soilY;
  const targetHeight = sp.stem.heightPx * eg;
  const tipX = baseX + getCurveOffset(sp, plotIdx, 1.0) * eg;
  const tipY = baseY - targetHeight + bob;

  // Stem: draw as tapered tube via filled polygon along bezier samples.
  const N = 16;
  const left = [], right = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const segY = baseY - targetHeight * t + bob * t;
    const segX = baseX + getCurveOffset(sp, plotIdx, t) * eg;
    const w = sp.stem.thicknessPx * (1 - t * 0.7);
    left.push([segX - w / 2, segY]);
    right.push([segX + w / 2, segY]);
  }
  ctx.fillStyle = sp.stem.color;
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i <= N; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = N; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();

  // Helper to get stem position/angle at a stemFrac (0=base, 1=tip)
  const stemAt = (frac) => {
    const segY = baseY - targetHeight * frac + bob * frac;
    const segX = baseX + getCurveOffset(sp, plotIdx, frac) * eg;
    // angle approximated from a small delta
    const d = 0.02;
    const f2 = Math.min(1, frac + d);
    const segY2 = baseY - targetHeight * f2 + bob * f2;
    const segX2 = baseX + getCurveOffset(sp, plotIdx, f2) * eg;
    const angle = Math.atan2(segY2 - segY, segX2 - segX);
    return { x: segX, y: segY, angle };
  };

  // Leaves
  for (let li = 0; li < sp.leaves.length; li++) {
    const leaf = sp.leaves[li];
    if (g < leaf.appearAt) continue;
    const t = clamp01((g - leaf.appearAt) / leaf.unfurlSpan);
    const scale = easeOutQuad(t);
    const sa = stemAt(leaf.stemFrac);
    drawLeaf(leaf, sa.x, sa.y, sa.angle, scale, plotIdx + li * 7);
  }

  // Bloom
  if (sp.bloom && g >= sp.bloom.appearAt) {
    const t = clamp01((g - sp.bloom.appearAt) / Math.max(0.001, 1 - sp.bloom.appearAt));
    const scale = easeOutBack(t);
    drawBloom(sp.bloom, tipX, tipY, scale, nowMs);
  }

  // Ready glow
  if (mature) {
    ctx.save();
    const glowR = (sp.bloom?.sizePx || 24) * 1.4;
    const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, glowR);
    grad.addColorStop(0, 'rgba(255, 230, 138, 0.4)');
    grad.addColorStop(1, 'rgba(255, 230, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(tipX, tipY, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function getCurveOffset(sp, plotIdx, t) {
  const amp = sp.stem.curveAmp;
  if (sp.stem.curve === 'straight') return 0;
  const seed = sp.seedRng + plotIdx * 31;
  const phase = (seed % 7) * 0.5;
  if (sp.stem.curve === 'wobble') {
    return Math.sin(t * Math.PI * 1.2 + phase) * amp;
  }
  if (sp.stem.curve === 'gnarled') {
    return Math.sin(t * Math.PI * 2.4 + phase) * amp + Math.sin(t * Math.PI * 5 + phase) * amp * 0.4;
  }
  return 0;
}

function drawLeaf(leaf, x, y, stemAngle, scale, seed) {
  if (scale <= 0) return;
  const outward = leaf.side === 'left' ? -1 : 1;
  // Leaf grows perpendicular to stem, leaning slightly upward.
  const angle = stemAngle + outward * (Math.PI / 2 - 0.35);
  const L = leaf.lengthPx * scale;
  const W = L * 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = leaf.color;
  ctx.beginPath();
  if (leaf.shape === 'jagged') {
    // Dandelion-style toothed leaf
    const teeth = 5;
    ctx.moveTo(0, 0);
    for (let i = 0; i <= teeth; i++) {
      const ft = i / teeth;
      const lx = L * ft;
      const lw = W * Math.sin(ft * Math.PI) * (1 - ft * 0.3);
      ctx.lineTo(lx, -lw);
      ctx.lineTo(lx + L / (teeth * 2.5), -lw * 0.6);
    }
    for (let i = teeth; i >= 0; i--) {
      const ft = i / teeth;
      const lx = L * ft;
      const lw = W * Math.sin(ft * Math.PI) * (1 - ft * 0.3);
      ctx.lineTo(lx, lw);
    }
  } else if (leaf.shape === 'blade') {
    // Long narrow blade
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(L * 0.3, -W * 0.5, L, 0);
    ctx.quadraticCurveTo(L * 0.3, W * 0.5, 0, 0);
  } else {
    // 'oval' default
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.2, -W, L * 0.7, -W * 0.8, L, 0);
    ctx.bezierCurveTo(L * 0.7, W * 0.8, L * 0.2, W, 0, 0);
  }
  ctx.closePath();
  ctx.fill();
  // Spine
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(L, 0);
  ctx.stroke();
  ctx.restore();
}

function drawBloom(bloom, x, y, scale, nowMs) {
  if (scale <= 0) return;
  const s = Math.max(0, scale);
  const size = bloom.sizePx * s;
  ctx.save();
  ctx.translate(x, y);

  if (bloom.shape === 'petals') {
    const petals = bloom.petals || 12;
    const r = size * 0.5;
    ctx.fillStyle = bloom.color;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + nowMs / 8000;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(r * 0.6, 0, r * 0.6, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = bloom.centerColor;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (bloom.shape === 'cup') {
    const r = size * 0.5;
    ctx.fillStyle = bloom.color;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.bezierCurveTo(-r, -r * 1.4, r, -r * 1.4, r, 0);
    ctx.bezierCurveTo(r * 0.7, r * 0.4, -r * 0.7, r * 0.4, -r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = bloom.centerColor;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.15, r * 0.4, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (bloom.shape === 'cluster') {
    const r = size * 0.5;
    const dots = bloom.petals || 7;
    ctx.fillStyle = bloom.color;
    for (let i = 0; i < dots; i++) {
      const a = (i / dots) * Math.PI * 2;
      const px = Math.cos(a) * r * 0.5;
      const py = Math.sin(a) * r * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = bloom.centerColor;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
  } else if (bloom.shape === 'puff') {
    const r = size * 0.5;
    ctx.fillStyle = bloom.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bloom.centerColor;
    ctx.lineWidth = 1.4;
    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }
  } else if (bloom.shape === 'spike') {
    // Vertical spike of small florets (lavender)
    const h = size * 1.0;
    const w = size * 0.35;
    const beads = 7;
    ctx.fillStyle = bloom.color;
    for (let i = 0; i < beads; i++) {
      const t = i / (beads - 1);
      const by = -h * t;
      const bw = w * (1 - t * 0.4) * 0.45;
      ctx.beginPath();
      ctx.ellipse(0, by, bw, bw * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = bloom.centerColor;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.5, w * 0.12, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAffordances(nowMs) {
  ctx.save();
  ctx.font = '18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < state.plotCount; i++) {
    const r = plotRects[i];
    const st = plotState(state.plots[i]);
    let glyph = '+';
    let color = 'rgba(255,255,255,0.72)';
    if (st === 'growing') {
      glyph = '💧';
      color = 'rgba(255,255,255,0.55)';
    } else if (st === 'mature') {
      glyph = '★';
      color = '#ffe78a';
    }
    // Place above the soil line, with bob for mature.
    const bob = st === 'mature' ? Math.sin(nowMs / 400 + i) * 2 : 0;
    let y = r.soilY + 28 + overlayOffset(i) + bob;
    if (st !== 'empty') {
      // Show under the plot instead of above growing plant (avoids overlap with bloom).
      y = r.soilY + 28 + overlayOffset(i) + bob;
    }
    // Background pill
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(r.soilX, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(glyph, r.soilX, y + 1);
  }
  ctx.restore();
}
