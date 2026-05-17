import { state, plotState } from './state.js';
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
      // plus the whole plant column above for growing/mature plants.
      if (cssY >= 0 && cssY <= r.soilY + 60) return r.idx;
    }
  }
  return -1;
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
  drawPlotBases();
  drawPlants(nowMs);
  drawEffects(nowMs);
  drawAffordances(nowMs);
  drawProgressBars(nowMs);
  drawThirstAlerts(nowMs);
  drawPlantNames(nowMs);
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

function drawProgressBars(nowMs) {
  const W = 70, H = 6;
  ctx.save();
  for (let i = 0; i < state.plotCount; i++) {
    const plot = state.plots[i];
    if (!plot || !plot.species || plot.growthProgress >= 1) continue;
    const r = plotRects[i];
    const x = r.soilX - W / 2;
    const y = r.soilY + 48;
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
  }
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
    // Darker dug patch on the soil line.
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(r.soilX, r.soilY + 2, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();

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
    let y = r.soilY + 28 + bob;
    if (st !== 'empty') {
      // Show under the plot instead of above growing plant (avoids overlap with bloom).
      y = r.soilY + 28 + bob;
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
