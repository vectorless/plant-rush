import { SPECIES, speciesById, DEFAULT_UNLOCKED } from './plants.js';

export const STARTING_COINS    = 50;
export const STARTING_GEMS     = 0;
export const COIN_FLOOR        = 5;
export const DAILY_GEMS        = 10;
export const TICK_MS           = 100;
export const WATER_BUFF        = 2.0;
export const MAX_OFFLINE_MS    = 24 * 60 * 60 * 1000;
export const MAX_DT_MS         = 5_000;

export const STARTING_PLOTS    = 3;
export const MAX_PLOTS         = 6;
export const PLOT_COSTS        = [0, 0, 0, 120, 400, 1200]; // index = plotCount before purchase

// Upgrade tracks. Index 0 = base (owned by default).
export const UPGRADES = {
  water: {
    name: 'Watering Can',
    icon: '💧',
    desc: 'Each watering lasts longer.',
    tiers: [
      { label: 'Tin Can',     durationMs: 15_000, cost: 0 },
      { label: 'Copper Can',  durationMs: 25_000, cost: 80 },
      { label: 'Silver Can',  durationMs: 40_000, cost: 300 },
      { label: 'Golden Can',  durationMs: 60_000, cost: 900 },
    ],
  },
  growth: {
    name: 'Growth Tonic',
    icon: '🌿',
    desc: 'All plants grow faster.',
    tiers: [
      { label: 'None',        speedMult: 1.00, cost: 0 },
      { label: 'Compost',     speedMult: 1.20, cost: 100 },
      { label: 'Liquid Feed', speedMult: 1.50, cost: 400 },
      { label: 'Bio-Boost',   speedMult: 2.00, cost: 1500 },
    ],
  },
  harvest: {
    name: 'Fertilizer',
    icon: '🌾',
    desc: 'Harvests sell for more coins.',
    tiers: [
      { label: 'None',        valueMult: 1.00, cost: 0 },
      { label: 'Bone Meal',   valueMult: 1.25, cost: 120 },
      { label: 'Worm Cast',   valueMult: 1.60, cost: 500 },
      { label: 'Mycorrhiza',  valueMult: 2.20, cost: 1800 },
    ],
  },
};

export const state = {
  coins: STARTING_COINS,
  gems: STARTING_GEMS,
  lastTick: Date.now(),
  lastDailyClaim: null, // 'YYYY-MM-DD' local date
  plotCount: STARTING_PLOTS,
  plots: makeEmptyPlots(STARTING_PLOTS),
  unlockedSpecies: [...DEFAULT_UNLOCKED],
  upgrades: { water: 0, growth: 0, harvest: 0 },
};

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dailyEligible() {
  return state.lastDailyClaim !== todayKey();
}

export function claimDaily() {
  if (!dailyEligible()) return 0;
  state.gems += DAILY_GEMS;
  state.lastDailyClaim = todayKey();
  return DAILY_GEMS;
}

function makeEmptyPlots(n) {
  return Array.from({ length: n }, () => null);
}

export function plotState(plot) {
  if (!plot || !plot.species) return 'empty';
  if (plot.growthProgress >= 1) return 'mature';
  return 'growing';
}

export function waterDurationMs() {
  return UPGRADES.water.tiers[state.upgrades.water].durationMs;
}
export function growthSpeedMult() {
  return UPGRADES.growth.tiers[state.upgrades.growth].speedMult;
}
export function harvestValueMult() {
  return UPGRADES.harvest.tiers[state.upgrades.harvest].valueMult;
}

// Anti-soft-lock: ensure player can always afford the cheapest seed.
export function topUpCoins() {
  if (state.coins < COIN_FLOOR) state.coins = COIN_FLOOR;
}

export function plantSeed(plotIdx, speciesId) {
  if (plotIdx < 0 || plotIdx >= state.plotCount) return false;
  if (state.plots[plotIdx]) return false;
  const sp = speciesById(speciesId);
  if (!sp) return false;
  if (!state.unlockedSpecies.includes(speciesId)) return false;
  if (state.coins < sp.seedCost) return false;
  state.coins -= sp.seedCost;
  const now = Date.now();
  state.plots[plotIdx] = {
    species: speciesId,
    growthProgress: 0,
    wateredUntil: now + waterDurationMs(),
    plantedAt: now,
  };
  return true;
}

export function applyWater(plotIdx, now = Date.now()) {
  const plot = state.plots[plotIdx];
  if (!plot || !plot.species) return false;
  if (plot.growthProgress >= 1) return false;
  plot.wateredUntil = Math.max(plot.wateredUntil, now) + waterDurationMs();
  return true;
}

export function harvest(plotIdx) {
  const plot = state.plots[plotIdx];
  if (!plot || !plot.species || plot.growthProgress < 1) return 0;
  const sp = speciesById(plot.species);
  const value = Math.round(sp.harvestValue * harvestValueMult());
  state.coins += value;
  state.plots[plotIdx] = null;
  return value;
}

// Mythic seed unlock — paid in GEMS, not coins.
export function unlockSpecies(speciesId) {
  const sp = speciesById(speciesId);
  if (!sp) return false;
  if (state.unlockedSpecies.includes(speciesId)) return false;
  if (sp.rarity !== 'mythic') return false; // only mythics need purchase
  if (state.gems < sp.unlockCost) return false;
  state.gems -= sp.unlockCost;
  state.unlockedSpecies.push(speciesId);
  return true;
}

export function buyUpgrade(kind) {
  const track = UPGRADES[kind];
  if (!track) return false;
  const cur = state.upgrades[kind];
  const next = cur + 1;
  if (next >= track.tiers.length) return false;
  const cost = track.tiers[next].cost;
  if (state.coins < cost) return false;
  state.coins -= cost;
  state.upgrades[kind] = next;
  return true;
}

export function nextPlotCost() {
  if (state.plotCount >= MAX_PLOTS) return null;
  return PLOT_COSTS[state.plotCount];
}

export function buyPlot() {
  const cost = nextPlotCost();
  if (cost == null) return false;
  if (state.coins < cost) return false;
  state.coins -= cost;
  state.plotCount += 1;
  state.plots.push(null);
  return true;
}

export function advanceGrowth(now = Date.now()) {
  const dt = Math.min(now - state.lastTick, MAX_DT_MS);
  if (dt <= 0) { state.lastTick = now; return; }
  const speed = growthSpeedMult();
  for (const plot of state.plots) {
    if (!plot || !plot.species || plot.growthProgress >= 1) continue;
    const sp = speciesById(plot.species);
    if (!sp) continue;
    const buff = now < plot.wateredUntil ? WATER_BUFF : 1;
    plot.growthProgress = Math.min(1, plot.growthProgress + (dt / sp.growMs) * buff * speed);
  }
  state.lastTick = now;
}

// Offline catch-up. Water buff applies only during the portion of offline
// time when wateredUntil was still in the future.
// Note: uses CURRENT growth speed mult — i.e. it does not try to reconstruct
// past upgrade history. In v1 upgrades only go up, so this slightly favours
// the player on plants that were planted before a recent tonic upgrade,
// which is fine.
export function applyOfflineCatchup(now = Date.now()) {
  const elapsed = Math.min(now - state.lastTick, MAX_OFFLINE_MS);
  if (elapsed <= 0) { state.lastTick = now; return; }
  const start = state.lastTick;
  const speed = growthSpeedMult();
  for (const plot of state.plots) {
    if (!plot || !plot.species || plot.growthProgress >= 1) continue;
    const sp = speciesById(plot.species);
    if (!sp) continue;
    const buffedEnd = Math.min(plot.wateredUntil, now);
    const buffedMs = Math.max(0, buffedEnd - start);
    if (buffedMs > 0) {
      plot.growthProgress = Math.min(1,
        plot.growthProgress + (buffedMs / sp.growMs) * WATER_BUFF * speed);
    }
    if (plot.growthProgress < 1) {
      const baseStart = Math.max(start, plot.wateredUntil);
      const baseMs = Math.max(0, now - baseStart);
      if (baseMs > 0) {
        plot.growthProgress = Math.min(1,
          plot.growthProgress + (baseMs / sp.growMs) * speed);
      }
    }
    if (plot.wateredUntil <= now) plot.wateredUntil = 0;
  }
  state.lastTick = now;
}
