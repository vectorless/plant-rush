import { state, STARTING_COINS, STARTING_GEMS, STARTING_PLOTS, MAX_PLOTS, UPGRADES, SKINS, DECOR_TYPES, SPRINKLERS, SPRINKLER_INTERVAL_MS, RECIPES } from './state.js';
import { SPECIES, speciesById, DEFAULT_UNLOCKED } from './plants.js';

const KEY = 'plant_rush:v1';

export function loadState() {
  const raw = localStorage.getItem(KEY);
  if (!raw) { resetDefaults(); return; }
  try {
    const data = JSON.parse(raw);
    state.coins = Number.isFinite(data.coins) ? data.coins : STARTING_COINS;
    state.gems  = Number.isFinite(data.gems)  ? data.gems  : STARTING_GEMS;
    state.lastTick = Number.isFinite(data.lastTick) ? data.lastTick : Date.now();
    state.lastDailyClaim = typeof data.lastDailyClaim === 'string' ? data.lastDailyClaim : null;
    state.plotCount = clampInt(data.plotCount, STARTING_PLOTS, MAX_PLOTS, STARTING_PLOTS);
    state.plots = mergePlots(data.plots, state.plotCount);
    state.unlockedSpecies = mergeUnlocked(data.unlockedSpecies);
    state.upgrades = mergeUpgrades(data.upgrades);
    state.unlockedSkins = mergeSkins(data.unlockedSkins);
    state.potPlots = mergePotPlots(data.potPlots, state.plotCount);
    state.decor = mergeDecor(data.decor);
    state.hangingPots = mergeHangingPots(data.hangingPots, state.decor);
    state.shieldedPlots = mergeShielded(data.shieldedPlots, state.plotCount);
    state.sprinklers = mergeSprinklers(data.sprinklers);
    state.inventory = mergeInventory(data.inventory);
    state.potions = mergePotions(data.potions);
    state.gildedPlots = mergeShielded(data.gildedPlots, state.plotCount);
  } catch (e) {
    resetDefaults();
  }
}

function mergeInventory(a) {
  const out = {};
  if (!a || typeof a !== 'object') return out;
  for (const [sid, n] of Object.entries(a)) {
    if (typeof sid !== 'string' || !speciesById(sid)) continue;
    if (!Number.isFinite(n) || n <= 0) continue;
    out[sid] = Math.floor(n);
  }
  return out;
}

function mergePotions(a) {
  if (!Array.isArray(a)) return [];
  const allowed = new Set(RECIPES.map(r => r.id));
  return a.filter(p => p && typeof p === 'object'
      && typeof p.id === 'string'
      && typeof p.recipeId === 'string'
      && allowed.has(p.recipeId))
    .map(p => ({ id: p.id, recipeId: p.recipeId }));
}

function mergeSprinklers(a) {
  if (!Array.isArray(a)) return [];
  const now = Date.now();
  const out = [];
  for (const s of a) {
    if (!s || typeof s !== 'object') continue;
    const cfg = SPRINKLERS[s.type];
    if (!cfg) continue;
    if (!Number.isFinite(s.xFrac)) continue;
    const placedAt = Number.isFinite(s.placedAt) ? s.placedAt : now;
    const expiresAt = Number.isFinite(s.expiresAt) ? s.expiresAt : placedAt + cfg.lifetimeMs;
    if (now >= expiresAt) continue; // already worn out while offline
    out.push({
      id: typeof s.id === 'string' ? s.id : `spr_${Math.random().toString(36).slice(2, 9)}`,
      type: s.type,
      xFrac: Math.max(0, Math.min(1, s.xFrac)),
      // Spread the first watering window so reloading doesn't dump all sprinklers at once.
      nextWaterAt: Number.isFinite(s.nextWaterAt) ? s.nextWaterAt : now + SPRINKLER_INTERVAL_MS,
      placedAt,
      expiresAt,
    });
    if (out.length >= 1) break; // enforce the one-at-a-time rule on legacy saves too
  }
  return out;
}

function mergeShielded(a, n) {
  if (!Array.isArray(a)) return [];
  const seen = new Set();
  const out = [];
  for (const v of a) {
    if (Number.isInteger(v) && v >= 0 && v < n && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function mergeUnlocked(u) {
  // Start with everything that's unlocked by default; merge in any
  // previously-purchased mythics, dropping unknown ids.
  const set = new Set(DEFAULT_UNLOCKED);
  if (Array.isArray(u)) {
    for (const id of u) {
      if (typeof id === 'string' && speciesById(id)) set.add(id);
    }
  }
  return [...set];
}

function mergeUpgrades(u) {
  const out = { water: 0, growth: 0, harvest: 0 };
  if (!u || typeof u !== 'object') return out;
  for (const kind of Object.keys(out)) {
    const maxIdx = UPGRADES[kind].tiers.length - 1;
    out[kind] = clampInt(u[kind], 0, maxIdx, 0);
  }
  return out;
}

function clampInt(v, min, max, fallback) {
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(v)));
}

function mergePlots(p, n) {
  const out = Array.from({ length: n }, () => null);
  if (!Array.isArray(p)) return out;
  for (let i = 0; i < n; i++) {
    const plot = p[i];
    if (plot && typeof plot === 'object'
        && typeof plot.species === 'string'
        && speciesById(plot.species)
        && Number.isFinite(plot.growthProgress)) {
      out[i] = {
        species: plot.species,
        growthProgress: Math.max(0, Math.min(1, plot.growthProgress)),
        wateredUntil: Number.isFinite(plot.wateredUntil) ? plot.wateredUntil : 0,
        plantedAt: Number.isFinite(plot.plantedAt) ? plot.plantedAt : Date.now(),
      };
    }
  }
  return out;
}

function resetDefaults() {
  state.coins = STARTING_COINS;
  state.gems  = STARTING_GEMS;
  state.lastTick = Date.now();
  state.lastDailyClaim = null;
  state.plotCount = STARTING_PLOTS;
  state.plots = Array.from({ length: STARTING_PLOTS }, () => null);
  state.unlockedSpecies = [...DEFAULT_UNLOCKED];
  state.upgrades = { water: 0, growth: 0, harvest: 0 };
  state.unlockedSkins = [];
  state.potPlots = [];
  state.decor = [];
  state.hangingPots = [];
  state.shieldedPlots = [];
  state.sprinklers = [];
  state.inventory = {};
  state.potions = [];
  state.gildedPlots = [];
}

function mergeHangingPots(a, decor) {
  if (!Array.isArray(a)) return [];
  const ids = new Set(decor.map(d => d.id));
  const out = [];
  const seenDecor = new Set();
  for (const h of a) {
    if (!h || typeof h !== 'object') continue;
    if (typeof h.id !== 'string' || typeof h.decorId !== 'string') continue;
    if (!ids.has(h.decorId) || seenDecor.has(h.decorId)) continue;
    seenDecor.add(h.decorId);
    let plot = null;
    if (h.plot && typeof h.plot === 'object'
        && typeof h.plot.species === 'string'
        && speciesById(h.plot.species)
        && Number.isFinite(h.plot.growthProgress)) {
      plot = {
        species: h.plot.species,
        growthProgress: Math.max(0, Math.min(1, h.plot.growthProgress)),
        wateredUntil: Number.isFinite(h.plot.wateredUntil) ? h.plot.wateredUntil : 0,
        plantedAt: Number.isFinite(h.plot.plantedAt) ? h.plot.plantedAt : Date.now(),
      };
    }
    out.push({ id: h.id, decorId: h.decorId, plot });
  }
  return out;
}

function mergeSkins(a) {
  if (!Array.isArray(a)) return [];
  return a.filter(s => typeof s === 'string' && SKINS[s]);
}

function mergePotPlots(a, n) {
  if (!Array.isArray(a)) return [];
  const seen = new Set();
  const out = [];
  for (const v of a) {
    if (Number.isInteger(v) && v >= 0 && v < n && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function mergeDecor(a) {
  if (!Array.isArray(a)) return [];
  const allowed = new Set(DECOR_TYPES);
  return a.filter(d => d && typeof d === 'object'
      && typeof d.type === 'string' && allowed.has(d.type)
      && Number.isFinite(d.xFrac) && Number.isFinite(d.yFrac))
    .map(d => ({
      id: typeof d.id === 'string' ? d.id : `d_${Math.random().toString(36).slice(2, 9)}`,
      type: d.type,
      xFrac: Math.max(0, Math.min(1, d.xFrac)),
      yFrac: Math.max(0, Math.min(1, d.yFrac)),
    }));
}

export function saveState() {
  const data = {
    coins: state.coins,
    gems: state.gems,
    lastTick: state.lastTick,
    lastDailyClaim: state.lastDailyClaim,
    plotCount: state.plotCount,
    plots: state.plots,
    unlockedSpecies: state.unlockedSpecies,
    upgrades: state.upgrades,
    unlockedSkins: state.unlockedSkins,
    potPlots: state.potPlots,
    decor: state.decor,
    hangingPots: state.hangingPots,
    shieldedPlots: state.shieldedPlots,
    sprinklers: state.sprinklers,
    inventory: state.inventory,
    potions: state.potions,
    gildedPlots: state.gildedPlots,
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}
