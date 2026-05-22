import { state, STARTING_COINS, STARTING_GEMS, STARTING_PLOTS, MAX_PLOTS, UPGRADES, SKINS, DECOR_TYPES, SPRINKLERS, SPRINKLER_INTERVAL_MS, RECIPES, DEFAULT_GARDENS, makeGarden, levelFromXp } from './state.js';
import { SPECIES, speciesById, DEFAULT_UNLOCKED } from './plants.js';

const KEY = 'plant_rush:v1';

export function loadState() {
  const raw = localStorage.getItem(KEY);
  if (!raw) { resetDefaults(); return; }
  try {
    const data = JSON.parse(raw);
    state.coins = Number.isFinite(data.coins) ? data.coins : STARTING_COINS;
    state.gems  = Number.isFinite(data.gems)  ? data.gems  : STARTING_GEMS;
    state.xp    = Number.isFinite(data.xp)    ? Math.max(0, data.xp) : 0;
    state.growthBonusLevels = Number.isFinite(data.growthBonusLevels) ? Math.max(0, Math.floor(data.growthBonusLevels)) : 0;
    state.incomeBonusLevels = Number.isFinite(data.incomeBonusLevels) ? Math.max(0, Math.floor(data.incomeBonusLevels)) : 0;
    // Derive level from XP, then reconcile any saved pending picks. If the
    // computed level is higher than (saved level + saved pending), enqueue the
    // gap — protects against losing a level-up if save shape ever drifts.
    const { level: derived } = levelFromXp(state.xp);
    const savedLevel = Number.isFinite(data.level) ? Math.max(1, Math.floor(data.level)) : 1;
    const savedPending = Number.isFinite(data.pendingLevelUps) ? Math.max(0, Math.floor(data.pendingLevelUps)) : 0;
    state.level = Math.max(derived, savedLevel);
    const spent = state.growthBonusLevels + state.incomeBonusLevels;
    const owed = Math.max(0, state.level - 1 - spent);
    state.pendingLevelUps = Math.max(savedPending, owed);
    state.lastTick = Number.isFinite(data.lastTick) ? data.lastTick : Date.now();
    state.lastDailyClaim = typeof data.lastDailyClaim === 'string' ? data.lastDailyClaim : null;
    state.unlockedSpecies = mergeUnlocked(data.unlockedSpecies);
    state.upgrades = mergeUpgrades(data.upgrades);
    state.unlockedSkins = mergeSkins(data.unlockedSkins);
    state.inventory = mergeInventory(data.inventory);
    state.potions = mergePotions(data.potions);
    // Gardens: new saves use data.gardens, old saves keep flat fields.
    state.gardens = mergeGardens(data);
    state.unlockedGardens = mergeUnlockedGardens(data, state.gardens);
    state.activeGardenId = typeof data.activeGardenId === 'string'
      && state.unlockedGardens.includes(data.activeGardenId)
        ? data.activeGardenId
        : 'home';
    state.redeemedCodes = Array.isArray(data.redeemedCodes)
      ? data.redeemedCodes.filter(c => typeof c === 'string')
      : [];
    state.playerName = typeof data.playerName === 'string' && data.playerName.trim()
      ? data.playerName.trim().slice(0, 20)
      : 'You';
  } catch (e) {
    resetDefaults();
  }
}

function mergeUnlockedGardens(data, gardens) {
  const gardenIds = new Set(gardens.map(g => g.id));
  // Explicit list wins.
  if (Array.isArray(data.unlockedGardens)) {
    const out = new Set(['home']);
    for (const id of data.unlockedGardens) {
      if (typeof id === 'string' && gardenIds.has(id)) out.add(id);
    }
    return [...out];
  }
  // Older save: grandfather in any garden that already has player content,
  // otherwise lock everything except home.
  const out = new Set(['home']);
  for (const g of gardens) {
    if (g.id === 'home') continue;
    const hasContent = (g.plots && g.plots.some(p => p && p.species))
      || (g.decor && g.decor.length > 0)
      || (g.sprinklers && g.sprinklers.length > 0);
    if (hasContent) out.add(g.id);
  }
  return [...out];
}

function mergeGardens(data) {
  // New-style: data.gardens is an array of full garden records.
  if (Array.isArray(data.gardens) && data.gardens.length > 0) {
    const seen = new Set();
    const out = [];
    for (const g of data.gardens) {
      if (!g || typeof g !== 'object') continue;
      if (typeof g.id !== 'string' || seen.has(g.id)) continue;
      seen.add(g.id);
      const plotCount = clampInt(g.plotCount, STARTING_PLOTS, MAX_PLOTS, STARTING_PLOTS);
      const decor = mergeDecor(g.decor);
      out.push({
        id: g.id,
        name: typeof g.name === 'string' ? g.name : g.id,
        plotCount,
        plots: mergePlots(g.plots, plotCount),
        decor,
        potPlots: mergePotPlots(g.potPlots, plotCount),
        hangingPots: mergeHangingPots(g.hangingPots, decor),
        shieldedPlots: mergeShielded(g.shieldedPlots, plotCount),
        gildedPlots: mergeShielded(g.gildedPlots, plotCount),
        sprinklers: mergeSprinklers(g.sprinklers),
      });
    }
    // Ensure each default garden id exists (so menu options remain stable).
    for (const def of DEFAULT_GARDENS) {
      if (!seen.has(def.id)) out.push(makeGarden(def.id, def.name));
    }
    return out;
  }
  // Old-style: migrate the flat top-level fields into the 'home' garden,
  // then add empty defaults for the other gardens.
  const plotCount = clampInt(data.plotCount, STARTING_PLOTS, MAX_PLOTS, STARTING_PLOTS);
  const decor = mergeDecor(data.decor);
  const home = {
    id: 'home', name: 'Home Garden',
    plotCount,
    plots: mergePlots(data.plots, plotCount),
    decor,
    potPlots: mergePotPlots(data.potPlots, plotCount),
    hangingPots: mergeHangingPots(data.hangingPots, decor),
    shieldedPlots: mergeShielded(data.shieldedPlots, plotCount),
    gildedPlots: mergeShielded(data.gildedPlots, plotCount),
    sprinklers: mergeSprinklers(data.sprinklers),
  };
  const rest = DEFAULT_GARDENS.filter(g => g.id !== 'home').map(g => makeGarden(g.id, g.name));
  return [home, ...rest];
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
  state.xp    = 0;
  state.level = 1;
  state.growthBonusLevels = 0;
  state.incomeBonusLevels = 0;
  state.pendingLevelUps = 0;
  state.lastTick = Date.now();
  state.lastDailyClaim = null;
  state.unlockedSpecies = [...DEFAULT_UNLOCKED];
  state.upgrades = { water: 0, growth: 0, harvest: 0 };
  state.unlockedSkins = [];
  state.inventory = {};
  state.potions = [];
  state.gardens = DEFAULT_GARDENS.map(g => makeGarden(g.id, g.name));
  state.activeGardenId = state.gardens[0].id;
  state.unlockedGardens = ['home'];
  state.redeemedCodes = [];
  state.playerName = 'You';
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
    xp: state.xp,
    level: state.level,
    growthBonusLevels: state.growthBonusLevels,
    incomeBonusLevels: state.incomeBonusLevels,
    pendingLevelUps: state.pendingLevelUps,
    lastTick: state.lastTick,
    lastDailyClaim: state.lastDailyClaim,
    unlockedSpecies: state.unlockedSpecies,
    upgrades: state.upgrades,
    unlockedSkins: state.unlockedSkins,
    inventory: state.inventory,
    potions: state.potions,
    activeGardenId: state.activeGardenId,
    unlockedGardens: state.unlockedGardens,
    redeemedCodes: state.redeemedCodes,
    playerName: state.playerName,
    gardens: state.gardens.map(g => ({
      id: g.id, name: g.name,
      plotCount: g.plotCount,
      plots: g.plots,
      decor: g.decor,
      potPlots: g.potPlots,
      hangingPots: g.hangingPots,
      shieldedPlots: g.shieldedPlots,
      gildedPlots: g.gildedPlots,
      sprinklers: g.sprinklers,
    })),
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}
