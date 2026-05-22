import { SPECIES, speciesById, DEFAULT_UNLOCKED } from './plants.js';

export const STARTING_COINS    = 50;
export const STARTING_GEMS     = 0;
export const STARTING_XP       = 0;

// XP awarded per harvest, by species rarity.
export const XP_BY_RARITY = {
  common:    10,
  uncommon:  20,
  rare:      30,
  legendary: 35,
  mythic:    100,
};
export function xpForSpecies(sp) {
  if (!sp) return 0;
  return XP_BY_RARITY[sp.rarity] || 0;
}

// XP required to advance from level N → N+1. After the listed base
// thresholds the cost keeps doubling.
//   1→2: 50, 2→3: 100, 3→4: 200, 4→5: 400, 5→6: 800, 6→7: 1000,
//   7→8: 2000, 8→9: 4000, 9→10: 8000, …
const XP_LEVEL_BASE = [50, 100, 200, 400, 800, 1000];
export function xpToReachLevel(level) {
  // XP required to go from (level-1) up to (level).
  if (level <= 1) return 0;
  const i = level - 2;
  if (i < XP_LEVEL_BASE.length) return XP_LEVEL_BASE[i];
  const last = XP_LEVEL_BASE[XP_LEVEL_BASE.length - 1]; // 1000
  return last * Math.pow(2, i - (XP_LEVEL_BASE.length - 1));
}
export function levelFromXp(xp) {
  let level = 1;
  let cum = 0;
  while (level < 200) {
    const need = xpToReachLevel(level + 1);
    if (xp < cum + need) return { level, cumAtLevel: cum, xpForNext: need };
    cum += need;
    level += 1;
  }
  return { level, cumAtLevel: cum, xpForNext: xpToReachLevel(level + 1) };
}
// Each level-up grants ONE pick worth +10% (growth speed or harvest income).
export const LEVEL_BONUS_PCT = 0.10;
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

// ─── BUGS & SHIELDS ────────────────────────────────────────────────────────
export const SHIELD_COST            = 50;     // coins per plot

// ─── POTIONS ───────────────────────────────────────────────────────────────
// Recipes match on the COUNT of ingredients of each rarity in the brewing pot.
// Order doesn't matter; exact-match only (no extras).
export const RECIPES = [
  {
    id: 'growth',  name: 'Splash of Growth', color: '#5cb05c',
    ingredients: { common: 2 },
    desc: '+30% growth on the chosen plant.',
  },
  {
    id: 'bugoff', name: 'Bug Repellent', color: '#8ce888',
    ingredients: { uncommon: 2 },
    desc: 'Permanently keeps bugs off the chosen plot.',
  },
  {
    id: 'gilded', name: 'Gilded Touch', color: '#ffd24a',
    ingredients: { rare: 1 },
    desc: 'Next harvest from the chosen plot pays double.',
  },
];

export function findRecipe(potIngredients) {
  // potIngredients = { common: n, uncommon: n, ... }
  outer:
  for (const r of RECIPES) {
    const want = r.ingredients;
    const wantRarities = Object.keys(want);
    const haveRarities = Object.keys(potIngredients).filter(k => potIngredients[k] > 0);
    if (wantRarities.length !== haveRarities.length) continue;
    for (const k of wantRarities) {
      if (potIngredients[k] !== want[k]) continue outer;
    }
    return r;
  }
  return null;
}

// ─── SPRINKLERS ────────────────────────────────────────────────────────────
// Auto-water the N plots nearest the sprinkler every 10 s. Sprinklers wear
// out after lifetimeMs and only one may be placed at a time.
export const SPRINKLER_INTERVAL_MS  = 10_000;
export const SPRINKLERS = {
  bad:  { id: 'bad',  name: 'Tin Sprinkler',   range: 2, cost: 180, lifetimeMs:  5 * 60 * 1000 },
  good: { id: 'good', name: 'Brass Sprinkler', range: 6, cost: 700, lifetimeMs: 30 * 60 * 1000 },
};
// Bugs are spawn-then-eat; players tap to flick them off before they ruin growth.
export const BUG_SPAWN_BASE_MS      = 22_000; // average gap between spawns at 1 plot
export const BUG_SPAWN_VAR_MS       = 12_000; // random extra delay
export const BUG_EAT_PER_SEC        = 0.02;   // growth lost per second of munching
export const BUG_WARNING_MS         = 3_000;  // heads-up window before a bug appears
// Bugs only target plots that already have a growing or mature plant.

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

// ─── GARDENS (multi-screen) ────────────────────────────────────────────────
// Each garden is an independent screen with its own plots, decor, sprinklers,
// etc. Coins, gems, inventory, potions, and upgrades are shared across all
// gardens. Bugs are global to the active garden only (cleared on switch).
export const DEFAULT_GARDENS = [
  { id: 'home',      name: 'Home Garden', cost: 0,    desc: 'Your starter patch.' },
  { id: 'meadow',    name: 'Meadow',      cost: 600,  desc: 'Open green field with room to grow.' },
  { id: 'cliffside', name: 'Cliffside',   cost: 2500, desc: 'Windswept ledge for your best crops.' },
];

export const PER_GARDEN_FIELDS = [
  'plots', 'plotCount', 'decor', 'potPlots',
  'hangingPots', 'shieldedPlots', 'gildedPlots', 'sprinklers',
];

export function makeGarden(id, name) {
  return {
    id, name,
    plots: makeEmptyPlots(STARTING_PLOTS),
    plotCount: STARTING_PLOTS,
    decor: [],
    potPlots: [],
    hangingPots: [],
    shieldedPlots: [],
    gildedPlots: [],
    sprinklers: [],
  };
}

export const state = {
  coins: STARTING_COINS,
  gems: STARTING_GEMS,
  xp: STARTING_XP,
  level: 1,
  growthBonusLevels: 0, // count of level-ups spent on growth speed (+10% each)
  incomeBonusLevels: 0, // count of level-ups spent on harvest income (+10% each)
  pendingLevelUps: 0,   // unconsumed level-up choices waiting for player pick
  lastTick: Date.now(),
  lastDailyClaim: null, // 'YYYY-MM-DD' local date
  unlockedSpecies: [...DEFAULT_UNLOCKED],
  upgrades: { water: 0, growth: 0, harvest: 0 },
  unlockedSkins: [],    // ['pot']
  bugs: [],             // [{id, plotIdx, ...}] — transient, cleared on garden switch
  bugWarning: null,     // null | {plotIdx, spawnAt}
  inventory: {},        // { [speciesId]: count } — shared across gardens
  potions: [],          // [{id, recipeId}] — shared across gardens
  gardens: DEFAULT_GARDENS.map(g => makeGarden(g.id, g.name)),
  activeGardenId: 'home',
  unlockedGardens: ['home'],
  redeemedCodes: [],    // codes flagged once-only that have already been used
  playerName: 'You',    // display name on the (fake) leaderboard
};

export function activeGarden() {
  return state.gardens.find(g => g.id === state.activeGardenId) || state.gardens[0];
}

// Forward per-garden field reads/writes to the active garden so existing call
// sites (state.plots, state.plotCount, ...) continue to work unchanged.
for (const field of PER_GARDEN_FIELDS) {
  Object.defineProperty(state, field, {
    get() { return activeGarden()[field]; },
    set(v) { activeGarden()[field] = v; },
    configurable: true,
    enumerable: true,
  });
}

export function switchGarden(id) {
  const g = state.gardens.find(g => g.id === id);
  if (!g) return false;
  if (!isGardenUnlocked(id)) return false;
  if (state.activeGardenId === id) return false;
  state.activeGardenId = id;
  // Bugs target plot indices in the just-left garden; wipe them.
  state.bugs = [];
  state.bugWarning = null;
  return true;
}

export function getGardens() { return state.gardens; }
export function getActiveGardenId() { return state.activeGardenId; }
export function isGardenUnlocked(id) { return state.unlockedGardens.includes(id); }
export function gardenCost(id) {
  const def = DEFAULT_GARDENS.find(d => d.id === id);
  return def ? def.cost : 0;
}
export function buyGarden(id) {
  if (isGardenUnlocked(id)) return false;
  const cost = gardenCost(id);
  if (state.coins < cost) return false;
  state.coins -= cost;
  state.unlockedGardens.push(id);
  return true;
}

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
  'gem me pls': {
    rewardText: '+10 gems',
    once: true,
    check: () => true,
    apply: () => { state.gems += 10; },
  },
  'xp me pls': {
    rewardText: '+250 XP',
    once: true,
    check: () => true,
    apply: () => { gainXp(250); },
  },
};

export function redeemCode(input) {
  const key = String(input || '').trim().toLowerCase();
  if (!key) return { ok: false, reason: 'Enter a code' };
  const code = REDEEM_CODES[key];
  if (!code) return { ok: false, reason: 'Invalid code' };
  if (code.once && (state.redeemedCodes || []).includes(key)) {
    return { ok: false, reason: 'Already redeemed.' };
  }
  if (!code.check()) return { ok: false, reason: code.rejectReason };
  code.apply();
  if (code.once) {
    if (!Array.isArray(state.redeemedCodes)) state.redeemedCodes = [];
    state.redeemedCodes.push(key);
  }
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
  return UPGRADES.growth.tiers[state.upgrades.growth].speedMult
    * (1 + LEVEL_BONUS_PCT * (state.growthBonusLevels || 0));
}
export function harvestValueMult() {
  return UPGRADES.harvest.tiers[state.upgrades.harvest].valueMult
    * (1 + LEVEL_BONUS_PCT * (state.incomeBonusLevels || 0));
}

// Award XP and bump the level counter, queueing any unspent level-ups.
// Returns the number of level-ups that just triggered (0 if none).
export function gainXp(amount) {
  if (!amount || amount <= 0) return 0;
  state.xp = (state.xp || 0) + amount;
  const prev = state.level || 1;
  const { level: next } = levelFromXp(state.xp);
  if (next > prev) {
    const ups = next - prev;
    state.level = next;
    state.pendingLevelUps = (state.pendingLevelUps || 0) + ups;
    return ups;
  }
  return 0;
}

// Player picks growth or income on each level-up. Returns true if applied.
export function spendLevelUp(choice) {
  if ((state.pendingLevelUps || 0) <= 0) return false;
  if (choice === 'growth') state.growthBonusLevels = (state.growthBonusLevels || 0) + 1;
  else if (choice === 'income') state.incomeBonusLevels = (state.incomeBonusLevels || 0) + 1;
  else return false;
  state.pendingLevelUps -= 1;
  return true;
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
  if (!plot || !plot.species || plot.growthProgress < 1) return { coins: 0, xp: 0 };
  const sp = speciesById(plot.species);
  let value = Math.round(sp.harvestValue * harvestValueMult());
  const gildedIdx = state.gildedPlots.indexOf(plotIdx);
  if (gildedIdx >= 0) {
    value *= 2;
    state.gildedPlots.splice(gildedIdx, 1);
  }
  state.coins += value;
  const xp = xpForSpecies(sp);
  const levelUps = gainXp(xp);
  state.inventory[sp.id] = (state.inventory[sp.id] || 0) + 1;
  state.plots[plotIdx] = null;
  // Bug spray protects ONE plant — it's consumed when the plant is harvested.
  const shieldIdx = state.shieldedPlots.indexOf(plotIdx);
  if (shieldIdx >= 0) state.shieldedPlots.splice(shieldIdx, 1);
  return { coins: value, xp, levelUps };
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
  if (!hp || !hp.plot || hp.plot.growthProgress < 1) return { coins: 0, xp: 0 };
  const sp = speciesById(hp.plot.species);
  const value = Math.round(sp.harvestValue * harvestValueMult());
  state.coins += value;
  const xp = xpForSpecies(sp);
  const levelUps = gainXp(xp);
  state.inventory[sp.id] = (state.inventory[sp.id] || 0) + 1;
  hp.plot = null;
  return { coins: value, xp, levelUps };
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
  // Plants on inactive gardens grow too, so the player isn't punished for visiting one screen.
  for (const g of state.gardens) {
    for (const plot of g.plots) advancePlot(plot, now, dt, speed);
    for (const hp of g.hangingPots) advancePlot(hp.plot, now, dt, speed);
  }
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
  for (const g of state.gardens) {
    for (const plot of g.plots) catchupPlot(plot, start, now, speed);
    for (const hp of g.hangingPots) catchupPlot(hp.plot, start, now, speed);
  }
  state.lastTick = now;
}

// ─── SHIELDS ───────────────────────────────────────────────────────────────

let pendingShield = false; // bought but not yet attached to a plot

export function isShieldPending() { return pendingShield; }

export function buyShieldPending() {
  if (pendingShield) return false;
  if (state.coins < SHIELD_COST) return false;
  state.coins -= SHIELD_COST;
  pendingShield = true;
  return true;
}

export function cancelShieldPlacement() {
  if (!pendingShield) return false;
  pendingShield = false;
  state.coins += SHIELD_COST;
  return true;
}

export function attachShield(plotIdx) {
  if (!pendingShield) return false;
  if (plotIdx < 0 || plotIdx >= state.plotCount) return false;
  if (state.shieldedPlots.includes(plotIdx)) return false;
  state.shieldedPlots.push(plotIdx);
  // Bugs already on this plot are knocked off when the shield goes up.
  state.bugs = state.bugs.filter(b => b.plotIdx !== plotIdx);
  pendingShield = false;
  return true;
}

export function isPlotShielded(plotIdx) {
  return state.shieldedPlots.includes(plotIdx);
}

// ─── BUGS ──────────────────────────────────────────────────────────────────

function randomBugDelay() {
  const plots = state.plotCount || 1;
  // More plots → bugs come a little faster.
  return BUG_SPAWN_BASE_MS / Math.sqrt(plots) + Math.random() * BUG_SPAWN_VAR_MS;
}

function isPlotEligibleForBug(i, now = Date.now()) {
  if (i < 0 || i >= state.plotCount) return false;
  if (isPlotShielded(i)) return false;
  if (state.bugs.some(b => b.plotIdx === i)) return false; // one bug per plot
  const p = state.plots[i];
  if (!p || !p.species) return false;
  if (p.growthProgress <= 0) return false;
  // Bugs only swarm thirsty plants — keep the can full to keep them away.
  if (now < p.wateredUntil) return false;
  return true;
}

function pickBugTarget(now = Date.now()) {
  const out = [];
  for (let i = 0; i < state.plotCount; i++) {
    if (isPlotEligibleForBug(i, now)) out.push(i);
  }
  if (out.length === 0) return null;
  return out[Math.floor(Math.random() * out.length)];
}

function spawnBugOnPlot(plotIdx, now) {
  state.bugs.push({
    id: `bug_${now.toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`,
    plotIdx,
    sideSign: Math.random() < 0.5 ? -1 : 1, // which side of the stem it sits on
    stemFrac: 0.3 + Math.random() * 0.4,    // height along the stem (0..1)
    angle: Math.random() * Math.PI * 2,     // for leg wiggle phase
    spawnedAt: now,
  });
}

export function tickBugs(now = Date.now(), dt = TICK_MS) {
  // Schedule a target + arrival time as soon as a slot is free, so the warning
  // indicator has time to show 3 s before the bug actually appears.
  if (!state.bugWarning) {
    const target = pickBugTarget(now);
    if (target !== null) {
      state.bugWarning = { plotIdx: target, spawnAt: now + randomBugDelay() };
    }
  } else if (!isPlotEligibleForBug(state.bugWarning.plotIdx, now)) {
    // Target became invalid (shielded, harvested, watered, etc.) — drop the warning.
    state.bugWarning = null;
  } else if (now >= state.bugWarning.spawnAt) {
    spawnBugOnPlot(state.bugWarning.plotIdx, now);
    state.bugWarning = null;
  }

  // Each bug chews growth — but only on dehydrated plants. Watering buys a reprieve
  // (the bug stays put, just doesn't munch) so you can still tap to flick it off.
  const lossPerTick = BUG_EAT_PER_SEC * (dt / 1000);
  for (const bug of state.bugs) {
    const plot = state.plots[bug.plotIdx];
    if (!plot || !plot.species) continue;
    if (now < plot.wateredUntil) continue;
    plot.growthProgress = Math.max(0, plot.growthProgress - lossPerTick);
  }
  // Bugs whose plot was emptied (harvested, etc.) disappear.
  state.bugs = state.bugs.filter(b => {
    const p = state.plots[b.plotIdx];
    return p && p.species;
  });
}

export function killBug(bugId) {
  const i = state.bugs.findIndex(b => b.id === bugId);
  if (i < 0) return false;
  state.bugs.splice(i, 1);
  return true;
}

// ─── SPRINKLER PLACEMENT + TICK ────────────────────────────────────────────

let pendingSprinklerType = null; // 'bad' | 'good' | null

export function isSprinklerPending() { return pendingSprinklerType !== null; }
export function getPendingSprinklerType() { return pendingSprinklerType; }

export function buySprinkler(type) {
  if (pendingSprinklerType) return false;
  if (state.sprinklers.length > 0) return false; // one sprinkler at a time
  const cfg = SPRINKLERS[type];
  if (!cfg) return false;
  if (state.coins < cfg.cost) return false;
  state.coins -= cfg.cost;
  pendingSprinklerType = type;
  return true;
}

export function cancelSprinklerPlacement() {
  if (!pendingSprinklerType) return false;
  const cfg = SPRINKLERS[pendingSprinklerType];
  state.coins += cfg.cost;
  pendingSprinklerType = null;
  return true;
}

export function placeSprinkler(xFrac, now = Date.now()) {
  if (!pendingSprinklerType) return false;
  if (state.sprinklers.length > 0) return false; // belt-and-braces: one at a time
  const type = pendingSprinklerType;
  const cfg = SPRINKLERS[type];
  const id = `spr_${now.toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`;
  state.sprinklers.push({
    id, type,
    xFrac: Math.max(0.02, Math.min(0.98, xFrac)),
    nextWaterAt: now + SPRINKLER_INTERVAL_MS,
    placedAt: now,
    expiresAt: now + cfg.lifetimeMs,
  });
  pendingSprinklerType = null;
  return true;
}

export function removeSprinkler(id) {
  const i = state.sprinklers.findIndex(s => s.id === id);
  if (i < 0) return false;
  state.sprinklers.splice(i, 1);
  return true;
}

function nearestPlots(xFrac, range) {
  const n = state.plotCount;
  if (n === 0) return [];
  const ranked = [];
  for (let i = 0; i < n; i++) {
    const pf = (i + 0.5) / n; // approximation of plot center, evenly spaced
    ranked.push({ i, d: Math.abs(pf - xFrac) });
  }
  ranked.sort((a, b) => a.d - b.d);
  return ranked.slice(0, Math.min(range, n)).map(r => r.i);
}

// ─── POTION CRAFTING + APPLICATION ─────────────────────────────────────────

function recipeById(id) { return RECIPES.find(r => r.id === id) || null; }

// Brew a potion from a map of {speciesId: count} ingredients.
// Returns the brewed potion record or { error: '...' } on failure.
export function brewPotion(ingredientsBySpecies) {
  const byRarity = {};
  let any = false;
  for (const [sid, n] of Object.entries(ingredientsBySpecies)) {
    if (!Number.isInteger(n) || n <= 0) continue;
    const sp = speciesById(sid);
    if (!sp) return { error: 'Unknown ingredient' };
    if ((state.inventory[sid] || 0) < n) return { error: `Not enough ${sp.name}` };
    byRarity[sp.rarity] = (byRarity[sp.rarity] || 0) + n;
    any = true;
  }
  if (!any) return { error: 'Empty pot' };
  const recipe = findRecipe(byRarity);
  if (!recipe) return { error: 'No recipe matches' };
  // Consume ingredients.
  for (const [sid, n] of Object.entries(ingredientsBySpecies)) {
    state.inventory[sid] -= n;
    if (state.inventory[sid] <= 0) delete state.inventory[sid];
  }
  const id = `pot_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`;
  const potion = { id, recipeId: recipe.id };
  state.potions.push(potion);
  return potion;
}

let pendingPotionId = null;

export function isPotionPending() { return pendingPotionId !== null; }
export function getPendingPotionId() { return pendingPotionId; }
export function getPendingPotionRecipe() {
  if (!pendingPotionId) return null;
  const p = state.potions.find(p => p.id === pendingPotionId);
  return p ? recipeById(p.recipeId) : null;
}
export function startPotionTargeting(potionId) {
  if (!state.potions.find(p => p.id === potionId)) return false;
  pendingPotionId = potionId;
  return true;
}
export function cancelPotionTargeting() {
  if (!pendingPotionId) return false;
  pendingPotionId = null;
  return true;
}

// Apply the currently-pending potion to plotIdx. Returns the recipe id on
// success, null on failure (e.g. potion doesn't make sense for the plot).
export function applyPendingPotionToPlot(plotIdx, now = Date.now()) {
  if (!pendingPotionId) return null;
  const i = state.potions.findIndex(p => p.id === pendingPotionId);
  if (i < 0) { pendingPotionId = null; return null; }
  const potion = state.potions[i];
  const recipe = recipeById(potion.recipeId);
  const plot = state.plots[plotIdx];
  if (!recipe) { pendingPotionId = null; return null; }

  if (recipe.id === 'growth') {
    if (!plot || !plot.species || plot.growthProgress >= 1) return null;
    plot.growthProgress = Math.min(1, plot.growthProgress + 0.30);
  } else if (recipe.id === 'bugoff') {
    if (plotIdx < 0 || plotIdx >= state.plotCount) return null;
    if (!state.shieldedPlots.includes(plotIdx)) state.shieldedPlots.push(plotIdx);
    // Also knock off any bugs currently on the plot.
    state.bugs = state.bugs.filter(b => b.plotIdx !== plotIdx);
  } else if (recipe.id === 'gilded') {
    if (!plot || !plot.species) return null;
    if (!state.gildedPlots.includes(plotIdx)) state.gildedPlots.push(plotIdx);
  } else {
    return null;
  }
  state.potions.splice(i, 1);
  pendingPotionId = null;
  return recipe.id;
}

// Returns the list of plot indices watered this tick, so the renderer can
// spawn visual splashes on each affected plot.
export function tickSprinklers(now = Date.now()) {
  const watered = [];
  // Expire used-up sprinklers first so they don't fire on their last tick.
  state.sprinklers = state.sprinklers.filter(s => !s.expiresAt || now < s.expiresAt);
  for (const s of state.sprinklers) {
    if (now < s.nextWaterAt) continue;
    const cfg = SPRINKLERS[s.type];
    if (!cfg) continue;
    for (const i of nearestPlots(s.xFrac, cfg.range)) {
      if (applyWater(i, now)) watered.push(i);
    }
    s.nextWaterAt = now + SPRINKLER_INTERVAL_MS;
  }
  return watered;
}
