import { state, levelFromXp, xpToReachLevel } from './state.js';

const KEY = 'plant_rush:leaderboard:v1';
const MAX_DRIFT_MS = 24 * 60 * 60 * 1000;

const NAMES = [
  'MossyPanda', 'DaisyKing', 'BloomBoss', 'SporeNinja', 'PetalPirate',
  'RootRascal', 'FernFiend', 'TulipTitan', 'SunflowerSam', 'CloverQueen',
  'CactusCarl', 'BambooBenny', 'WillowWisp', 'IvyImp', 'LotusLord',
  'MapleMage', 'PoppyPunk', 'OrchidOracle', 'JadeJester', 'PinePixie',
  'FrostFern', 'EmberRose', 'DewDrop', 'MintMaven', 'SageSorcerer',
  'AzaleaAce', 'VioletVixen', 'BasilBaron', 'ThistleThief', 'CoralBloom',
];

function pickWeightedLevel(rand) {
  // Most bots cluster around 5-15, long tail to ~40 so there's always
  // someone above the player to chase.
  const r = rand();
  if (r < 0.05) return 1 + Math.floor(rand() * 3);          // 1-3   (5%)
  if (r < 0.55) return 4 + Math.floor(rand() * 12);         // 4-15  (50%)
  if (r < 0.85) return 16 + Math.floor(rand() * 10);        // 16-25 (30%)
  if (r < 0.97) return 26 + Math.floor(rand() * 9);         // 26-34 (12%)
  return 35 + Math.floor(rand() * 6);                       // 35-40 (3%)
}

function seedBots(now) {
  const rand = Math.random;
  const bots = NAMES.map(name => {
    const level = pickWeightedLevel(rand);
    const into = xpToReachLevel(level + 1);
    const cum = sumToLevel(level);
    const xp = Math.floor(cum + rand() * into);
    return {
      name,
      xp,
      passiveXpRate: 5 + Math.floor(rand() * 36), // 5-40 XP/hour
    };
  });
  return { bots, lastTick: now };
}

function sumToLevel(level) {
  let sum = 0;
  for (let l = 2; l <= level; l++) sum += xpToReachLevel(l);
  return sum;
}

function load(now) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.bots) || data.bots.length === 0) return null;
    const bots = data.bots
      .filter(b => b && typeof b.name === 'string' && Number.isFinite(b.xp))
      .map(b => ({
        name: b.name,
        xp: Math.max(0, Math.floor(b.xp)),
        passiveXpRate: Number.isFinite(b.passiveXpRate) ? b.passiveXpRate : 10,
      }));
    if (bots.length === 0) return null;
    return { bots, lastTick: Number.isFinite(data.lastTick) ? data.lastTick : now };
  } catch (e) {
    return null;
  }
}

function save(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (e) {
    // ignore quota errors
  }
}

function applyDrift(store, now) {
  const elapsed = Math.min(MAX_DRIFT_MS, now - store.lastTick);
  if (elapsed <= 0) { store.lastTick = now; return; }
  const hours = elapsed / (60 * 60 * 1000);
  for (const b of store.bots) {
    b.xp = Math.max(0, Math.floor(b.xp + b.passiveXpRate * hours));
  }
  store.lastTick = now;
}

function ensureStore() {
  const now = Date.now();
  let store = load(now);
  if (!store) {
    store = seedBots(now);
  } else {
    applyDrift(store, now);
  }
  save(store);
  return store;
}

export function leaderboardEntries() {
  const store = ensureStore();
  const youXp = Math.max(0, Math.floor(state.xp || 0));
  const youLevel = (levelFromXp(youXp)).level;
  // Bots are always strictly below the player, but keep their relative spread
  // so the list still has variety — scale linearly into [0, youXp - 1] when
  // the top bot would otherwise outrank you.
  const cap = Math.max(0, youXp - 1);
  const maxBotXp = store.bots.reduce((m, b) => Math.max(m, b.xp), 0);
  const scale = (maxBotXp > cap && maxBotXp > 0) ? (cap / maxBotXp) : 1;
  const rows = store.bots.map(b => {
    const xp = Math.max(0, Math.min(cap, Math.floor(b.xp * scale)));
    const { level } = levelFromXp(xp);
    return { name: b.name, level, xp, you: false };
  });
  rows.push({
    name: state.playerName || 'You',
    level: youLevel,
    xp: youXp,
    you: true,
  });
  // YOU wins ties (sorts first) — covers the youXp=0 case where every bot is also 0.
  rows.sort((a, b) => (b.level - a.level) || (b.xp - a.xp) || ((b.you ? 1 : 0) - (a.you ? 1 : 0)));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function setPlayerName(name) {
  const trimmed = String(name || '').trim().slice(0, 20);
  if (!trimmed) return false;
  state.playerName = trimmed;
  return true;
}

export function resetLeaderboard() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}
