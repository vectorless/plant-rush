import { state, STARTING_COINS, STARTING_GEMS, STARTING_PLOTS, MAX_PLOTS, UPGRADES } from './state.js';
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
  } catch (e) {
    resetDefaults();
  }
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
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}
