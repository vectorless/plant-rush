import { SPECIES, speciesById, DEFAULT_UNLOCKED } from './plants.js';

export const STARTING_COINS    = 50;
export const STARTING_GEMS     = 0;
export const COIN_FLOOR        = 5;
export const DAILY_GEMS        = 10;
export const GEM_TO_COINS      = 10; // 1 💎 = 10c
export const TICK_MS           = 100;
export const WATER_BUFF        = 2.0;
export const MAX_OFFLINE_MS    = 24 * 60 * 60 * 1000;
export const MAX_DT_MS         = 5_000;

export const STARTING_PLOTS    = 3;
export const MAX_PLOTS         = 6;
export const PLOT_COSTS        = [0, 0, 0, 120, 400, 1200]; // index = plotCount before purchase

// Cosmetic skins (one-time coin unlocks).
export const SKINS = {
  pot: { id: 'pot', name: 'Plant Pot', desc: 'Terracotta pot under any plot you choose.', cost: 200 },
};
export const DECOR_TYPES = ['tree', 'bush', 'house', 'fence', 'rock'];

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
  decor: [],            // [{id, type, xFrac, yFrac}]
  potPlots: [],         // plot indices that show a pot
  unlockedSkins: [],    // ['pot']
  hangingPots: [],      // [{id, decorId, plot: null | plotShape}]
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

// Promo codes. Each code has a check (preconditions) and apply (mutate state).
// Codes are case-insensitive and trimmed.
export const REDEEM_CODES = {
  'coin me pls': {
    rewardText: '+50 coins',
    check: () => state.coins < 150,
    rejectReason: 'Only works when you have under 150 coins.',
    apply: () => { state.coins += 50; },
  },
};

export function redeemCode(input) {
  const key = String(input || '').trim().toLowerCase();
  if (!key) return { ok: false, reason: 'Enter a code' };
  const code = REDEEM_CODES[key];
  if (!code) return { ok: false, reason: 'Invalid code' };
  if (!code.check()) return { ok: false, reason: code.rejectReason };
  code.apply();
  return { ok: true, message: code.rewardText };
}

export function tradeGemForCoins() {
  if (state.gems < 1) return 0;
  state.gems -= 1;
  state.coins += GEM_TO_COINS;
  return GEM_TO_COINS;
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

// ─── HANGING POTS ──────────────────────────────────────────────────────────

export const HANGING_POT_MULTIPLIER = 1.20; // 20 % more than a fresh plot

let pendingHangingPot = false; // not persisted; waiting for a click on a decor item

export function hangingPotCost() {
  const base = nextPlotCost() ?? PLOT_COSTS[PLOT_COSTS.length - 1];
  return Math.round(base * HANGING_POT_MULTIPLIER);
}

export function isHangingPotPending() { return pendingHangingPot; }

export function buyHangingPot() {
  if (pendingHangingPot) return false;
  const cost = hangingPotCost();
  if (state.coins < cost) return false;
  state.coins -= cost;
  pendingHangingPot = true;
  return true;
}

export function cancelHangingPotPlacement() {
  if (!pendingHangingPot) return false;
  pendingHangingPot = false;
  state.coins += hangingPotCost();
  return true;
}

export function attachHangingPot(decorId) {
  if (!pendingHangingPot) return null;
  if (!state.decor.find(d => d.id === decorId)) return null;
  if (state.hangingPots.find(h => h.decorId === decorId)) return null;
  const id = `hp_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`;
  state.hangingPots.push({ id, decorId, plot: null });
  pendingHangingPot = false;
  return id;
}

export function removeHangingPot(id) {
  const i = state.hangingPots.findIndex(h => h.id === id);
  if (i < 0) return false;
  state.hangingPots.splice(i, 1);
  return true;
}

function findHanging(id) { return state.hangingPots.find(h => h.id === id); }

export function plantInHanging(id, speciesId) {
  const hp = findHanging(id);
  if (!hp || hp.plot) return false;
  const sp = speciesById(speciesId);
  if (!sp) return false;
  if (!state.unlockedSpecies.includes(speciesId)) return false;
  if (state.coins < sp.seedCost) return false;
  state.coins -= sp.seedCost;
  const now = Date.now();
  hp.plot = {
    species: speciesId,
    growthProgress: 0,
    wateredUntil: now + waterDurationMs(),
    plantedAt: now,
  };
  return true;
}

export function waterHanging(id, now = Date.now()) {
  const hp = findHanging(id);
  if (!hp || !hp.plot) return false;
  if (hp.plot.growthProgress >= 1) return false;
  hp.plot.wateredUntil = Math.max(hp.plot.wateredUntil, now) + waterDurationMs();
  return true;
}

export function harvestHanging(id) {
  const hp = findHanging(id);
  if (!hp || !hp.plot || hp.plot.growthProgress < 1) return 0;
  const sp = speciesById(hp.plot.species);
  const value = Math.round(sp.harvestValue * harvestValueMult());
  state.coins += value;
  hp.plot = null;
  return value;
}

// ─── EDIT-MODE MUTATORS ────────────────────────────────────────────────────

// Swap two plots' contents. Either slot may be empty.
export function movePlant(srcIdx, dstIdx) {
  if (srcIdx === dstIdx) return false;
  if (srcIdx < 0 || srcIdx >= state.plotCount) return false;
  if (dstIdx < 0 || dstIdx >= state.plotCount) return false;
  const a = state.plots[srcIdx];
  const b = state.plots[dstIdx];
  if (!a && !b) return false;
  state.plots[srcIdx] = b;
  state.plots[dstIdx] = a;
  return true;
}

export function addDecor(type, xFrac, yFrac) {
  if (!type) return null;
  const id = `d_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`;
  state.decor.push({ id, type, xFrac, yFrac });
  return id;
}

export function removeDecor(id) {
  const i = state.decor.findIndex(d => d.id === id);
  if (i < 0) return false;
  state.decor.splice(i, 1);
  // Drop any hanging pot attached to the removed decor.
  state.hangingPots = state.hangingPots.filter(h => h.decorId !== id);
  return true;
}

export function togglePot(plotIdx) {
  if (!state.unlockedSkins.includes('pot')) return false;
  if (plotIdx < 0 || plotIdx >= state.plotCount) return false;
  const i = state.potPlots.indexOf(plotIdx);
  if (i >= 0) state.potPlots.splice(i, 1);
  else state.potPlots.push(plotIdx);
  return true;
}

export function buySkin(skinId) {
  const sk = SKINS[skinId];
  if (!sk) return false;
  if (state.unlockedSkins.includes(skinId)) return false;
  if (state.coins < sk.cost) return false;
  state.coins -= sk.cost;
  state.unlockedSkins.push(skinId);
  return true;
}

function advancePlot(plot, now, dt, speed) {
  if (!plot || !plot.species || plot.growthProgress >= 1) return;
  const sp = speciesById(plot.species);
  if (!sp) return;
  const buff = now < plot.wateredUntil ? WATER_BUFF : 1;
  plot.growthProgress = Math.min(1, plot.growthProgress + (dt / sp.growMs) * buff * speed);
}

export function advanceGrowth(now = Date.now()) {
  const dt = Math.min(now - state.lastTick, MAX_DT_MS);
  if (dt <= 0) { state.lastTick = now; return; }
  const speed = growthSpeedMult();
  for (const plot of state.plots) advancePlot(plot, now, dt, speed);
  for (const hp of state.hangingPots) advancePlot(hp.plot, now, dt, speed);
  state.lastTick = now;
}

// Offline catch-up. Water buff applies only during the portion of offline
// time when wateredUntil was still in the future.
// Note: uses CURRENT growth speed mult — i.e. it does not try to reconstruct
// past upgrade history. In v1 upgrades only go up, so this slightly favours
// the player on plants that were planted before a recent tonic upgrade,
// which is fine.
function catchupPlot(plot, start, now, speed) {
  if (!plot || !plot.species || plot.growthProgress >= 1) return;
  const sp = speciesById(plot.species);
  if (!sp) return;
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

export function applyOfflineCatchup(now = Date.now()) {
  const elapsed = Math.min(now - state.lastTick, MAX_OFFLINE_MS);
  if (elapsed <= 0) { state.lastTick = now; return; }
  const start = state.lastTick;
  const speed = growthSpeedMult();
  for (const plot of state.plots) catchupPlot(plot, start, now, speed);
  for (const hp of state.hangingPots) catchupPlot(hp.plot, start, now, speed);
  state.lastTick = now;
}
