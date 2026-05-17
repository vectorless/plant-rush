export const RARITIES = ['common', 'uncommon', 'rare', 'legendary', 'mythic'];

export const RARITY_COLORS = {
  common:    '#9aa0a6',
  uncommon:  '#6cc36c',
  rare:      '#4a9be8',
  legendary: '#e8b048',
  mythic:    '#c886ff',
};

export const MYTHIC_GROW_MS = 20 * 60 * 1000;

export const SPECIES = [
  {
    id: 'dandelion', name: 'Dandelion', rarity: 'common',
    seedCost: 5, harvestValue: 12, growMs: 25_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1031,
    stem:   { heightPx: 70,  thicknessPx: 3, color: '#5a8a3a', curve: 'straight', curveAmp: 2 },
    leaves: [
      { stemFrac: 0.10, side: 'left',  lengthPx: 26, color: '#6cb05c', shape: 'jagged', appearAt: 0.15, unfurlSpan: 0.15 },
      { stemFrac: 0.10, side: 'right', lengthPx: 26, color: '#6cb05c', shape: 'jagged', appearAt: 0.20, unfurlSpan: 0.15 },
      { stemFrac: 0.20, side: 'left',  lengthPx: 22, color: '#6cb05c', shape: 'jagged', appearAt: 0.30, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.75, shape: 'puff', sizePx: 26, color: '#ffd24a', centerColor: '#ffb022', petals: 0 },
  },
  {
    id: 'clover', name: 'Clover', rarity: 'common',
    seedCost: 8, harvestValue: 22, growMs: 35_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 2273,
    stem:   { heightPx: 55, thicknessPx: 3, color: '#3a8b3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.30, side: 'left',  lengthPx: 20, color: '#5cb85c', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.20 },
      { stemFrac: 0.55, side: 'right', lengthPx: 22, color: '#5cb85c', shape: 'oval', appearAt: 0.40, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.80, shape: 'cluster', sizePx: 22, color: '#f4f0e6', centerColor: '#dccfa0', petals: 9 },
  },
  {
    id: 'daisy', name: 'Daisy', rarity: 'common',
    seedCost: 12, harvestValue: 32, growMs: 50_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 3119,
    stem:   { heightPx: 85, thicknessPx: 3, color: '#4a7a3a', curve: 'wobble', curveAmp: 5 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 20, color: '#5ca84a', shape: 'oval', appearAt: 0.25, unfurlSpan: 0.20 },
      { stemFrac: 0.40, side: 'right', lengthPx: 22, color: '#5ca84a', shape: 'oval', appearAt: 0.35, unfurlSpan: 0.20 },
      { stemFrac: 0.60, side: 'left',  lengthPx: 18, color: '#5ca84a', shape: 'oval', appearAt: 0.50, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 30, color: '#f4f0e6', centerColor: '#f0c040', petals: 12 },
  },
  {
    id: 'tulip', name: 'Tulip', rarity: 'uncommon',
    seedCost: 25, harvestValue: 80, growMs: 75_000,
    unlockedByDefault: false, unlockCost: 60, seedRng: 4201,
    stem:   { heightPx: 95, thicknessPx: 4, color: '#3a7a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.15, side: 'left',  lengthPx: 36, color: '#4a8a3a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.20, side: 'right', lengthPx: 32, color: '#4a8a3a', shape: 'blade', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 28, color: '#e8487a', centerColor: '#b8285a', petals: 5 },
  },
  {
    id: 'sunflower', name: 'Sunflower', rarity: 'uncommon',
    seedCost: 40, harvestValue: 130, growMs: 110_000,
    unlockedByDefault: false, unlockCost: 120, seedRng: 4711,
    stem:   { heightPx: 140, thicknessPx: 5, color: '#4a7a2a', curve: 'wobble', curveAmp: 6 },
    leaves: [
      { stemFrac: 0.25, side: 'left',  lengthPx: 30, color: '#5a9a3a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.15 },
      { stemFrac: 0.40, side: 'right', lengthPx: 34, color: '#5a9a3a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.15 },
      { stemFrac: 0.55, side: 'left',  lengthPx: 28, color: '#5a9a3a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.15 },
      { stemFrac: 0.70, side: 'right', lengthPx: 24, color: '#5a9a3a', shape: 'oval', appearAt: 0.55, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.80, shape: 'petals', sizePx: 44, color: '#ffd224', centerColor: '#6a3a18', petals: 16 },
  },
  {
    id: 'lavender', name: 'Lavender', rarity: 'rare',
    seedCost: 90, harvestValue: 280, growMs: 150_000,
    unlockedByDefault: false, unlockCost: 280, seedRng: 5641,
    stem:   { heightPx: 115, thicknessPx: 3, color: '#5a7a4a', curve: 'wobble', curveAmp: 3 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 22, color: '#6a9a5a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.30, side: 'right', lengthPx: 22, color: '#6a9a5a', shape: 'blade', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.70, shape: 'spike', sizePx: 38, color: '#a878d8', centerColor: '#6a4090', petals: 0 },
  },
  {
    id: 'rose', name: 'Rose', rarity: 'rare',
    seedCost: 160, harvestValue: 520, growMs: 220_000,
    unlockedByDefault: false, unlockCost: 500, seedRng: 6803,
    stem:   { heightPx: 130, thicknessPx: 5, color: '#3a5a2a', curve: 'gnarled', curveAmp: 7 },
    leaves: [
      { stemFrac: 0.25, side: 'left',  lengthPx: 24, color: '#4a7a3a', shape: 'oval', appearAt: 0.25, unfurlSpan: 0.15 },
      { stemFrac: 0.35, side: 'right', lengthPx: 24, color: '#4a7a3a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.15 },
      { stemFrac: 0.55, side: 'left',  lengthPx: 22, color: '#4a7a3a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.15 },
      { stemFrac: 0.65, side: 'right', lengthPx: 22, color: '#4a7a3a', shape: 'oval', appearAt: 0.50, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.80, shape: 'cup', sizePx: 34, color: '#d8285a', centerColor: '#882040', petals: 8 },
  },
  {
    id: 'starblossom', name: 'Starblossom', rarity: 'legendary',
    seedCost: 400, harvestValue: 1400, growMs: 320_000,
    unlockedByDefault: false, unlockCost: 1200, seedRng: 8429,
    stem:   { heightPx: 160, thicknessPx: 5, color: '#4a6a8a', curve: 'wobble', curveAmp: 8 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 30, color: '#6c9ec0', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.15 },
      { stemFrac: 0.35, side: 'right', lengthPx: 32, color: '#6c9ec0', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.15 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 28, color: '#6c9ec0', shape: 'oval', appearAt: 0.40, unfurlSpan: 0.15 },
      { stemFrac: 0.70, side: 'right', lengthPx: 26, color: '#6c9ec0', shape: 'oval', appearAt: 0.55, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.75, shape: 'petals', sizePx: 48, color: '#d8a8ff', centerColor: '#ffe78a', petals: 8 },
  },

  // ─── added in batch 2 ───────────────────────────────────────────────────
  {
    id: 'poppy', name: 'Poppy', rarity: 'common',
    seedCost: 14, harvestValue: 38, growMs: 55_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1487,
    stem:   { heightPx: 80, thicknessPx: 3, color: '#5a8a3a', curve: 'wobble', curveAmp: 6 },
    leaves: [
      { stemFrac: 0.15, side: 'left',  lengthPx: 22, color: '#6cb05c', shape: 'jagged', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.30, side: 'right', lengthPx: 22, color: '#6cb05c', shape: 'jagged', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 28, color: '#e83a3a', centerColor: '#2a1a08', petals: 4 },
  },
  {
    id: 'bluebell', name: 'Bluebell', rarity: 'uncommon',
    seedCost: 30, harvestValue: 95, growMs: 80_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 4877,
    stem:   { heightPx: 90, thicknessPx: 3, color: '#3a6a3a', curve: 'wobble', curveAmp: 5 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 28, color: '#4a8a3a', shape: 'blade', appearAt: 0.22, unfurlSpan: 0.20 },
      { stemFrac: 0.28, side: 'right', lengthPx: 26, color: '#4a8a3a', shape: 'blade', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.72, shape: 'spike', sizePx: 32, color: '#6c8ad8', centerColor: '#3a4880', petals: 0 },
  },
  {
    id: 'foxglove', name: 'Foxglove', rarity: 'uncommon',
    seedCost: 55, harvestValue: 170, growMs: 95_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 5023,
    stem:   { heightPx: 130, thicknessPx: 4, color: '#3a6a2a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.10, side: 'left',  lengthPx: 34, color: '#4a8a3a', shape: 'oval', appearAt: 0.18, unfurlSpan: 0.20 },
      { stemFrac: 0.18, side: 'right', lengthPx: 32, color: '#4a8a3a', shape: 'oval', appearAt: 0.25, unfurlSpan: 0.20 },
      { stemFrac: 0.28, side: 'left',  lengthPx: 28, color: '#4a8a3a', shape: 'oval', appearAt: 0.32, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.65, shape: 'spike', sizePx: 46, color: '#d878b8', centerColor: '#783868', petals: 0 },
  },
  {
    id: 'orchid', name: 'Orchid', rarity: 'rare',
    seedCost: 120, harvestValue: 380, growMs: 180_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 6149,
    stem:   { heightPx: 110, thicknessPx: 4, color: '#4a7a4a', curve: 'gnarled', curveAmp: 5 },
    leaves: [
      { stemFrac: 0.15, side: 'left',  lengthPx: 36, color: '#5a8a5a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.22, side: 'right', lengthPx: 34, color: '#5a8a5a', shape: 'blade', appearAt: 0.28, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 36, color: '#f0a8e8', centerColor: '#a04898', petals: 5 },
  },
  {
    id: 'peony', name: 'Peony', rarity: 'rare',
    seedCost: 200, harvestValue: 680, growMs: 240_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 7211,
    stem:   { heightPx: 105, thicknessPx: 5, color: '#3a5a2a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 30, color: '#4a7a3a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.35, side: 'right', lengthPx: 32, color: '#4a7a3a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.20 },
      { stemFrac: 0.55, side: 'left',  lengthPx: 28, color: '#4a7a3a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cluster', sizePx: 42, color: '#ffb8d4', centerColor: '#d878a8', petals: 11 },
  },
  {
    id: 'moonflower', name: 'Moonflower', rarity: 'legendary',
    seedCost: 550, harvestValue: 1900, growMs: 360_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 8231,
    stem:   { heightPx: 145, thicknessPx: 4, color: '#3a5a4a', curve: 'wobble', curveAmp: 7 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 32, color: '#4a7a6a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.18 },
      { stemFrac: 0.30, side: 'right', lengthPx: 34, color: '#4a7a6a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 28, color: '#4a7a6a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 50, color: '#f4f0ff', centerColor: '#c0d8ff', petals: 10 },
  },
  {
    id: 'firelily', name: 'Firelily', rarity: 'legendary',
    seedCost: 800, harvestValue: 2800, growMs: 420_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 9173,
    stem:   { heightPx: 135, thicknessPx: 5, color: '#5a3a1a', curve: 'gnarled', curveAmp: 8 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 36, color: '#7a4a2a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.18 },
      { stemFrac: 0.30, side: 'right', lengthPx: 34, color: '#7a4a2a', shape: 'blade', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 30, color: '#7a4a2a', shape: 'blade', appearAt: 0.45, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 44, color: '#ff7822', centerColor: '#ffd224', petals: 6 },
  },
  {
    id: 'voidbloom', name: 'Voidbloom', rarity: 'mythic',
    seedCost: 2500, harvestValue: 8500, growMs: MYTHIC_GROW_MS,
    unlockedByDefault: false, unlockCost: 40, seedRng: 10243, // gem cost
    stem:   { heightPx: 160, thicknessPx: 5, color: '#2a1a4a', curve: 'gnarled', curveAmp: 9 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 34, color: '#3a2a6a', shape: 'oval', appearAt: 0.18, unfurlSpan: 0.15 },
      { stemFrac: 0.30, side: 'right', lengthPx: 36, color: '#3a2a6a', shape: 'oval', appearAt: 0.26, unfurlSpan: 0.15 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 30, color: '#3a2a6a', shape: 'oval', appearAt: 0.38, unfurlSpan: 0.15 },
      { stemFrac: 0.70, side: 'right', lengthPx: 28, color: '#3a2a6a', shape: 'oval', appearAt: 0.55, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.75, shape: 'petals', sizePx: 54, color: '#7a3aff', centerColor: '#48f0ff', petals: 12 },
  },
  {
    id: 'starforge', name: 'Starforge', rarity: 'mythic',
    seedCost: 4000, harvestValue: 14000, growMs: MYTHIC_GROW_MS,
    unlockedByDefault: false, unlockCost: 120, seedRng: 11471, // gem cost
    stem:   { heightPx: 170, thicknessPx: 6, color: '#6a3a1a', curve: 'gnarled', curveAmp: 10 },
    leaves: [
      { stemFrac: 0.15, side: 'left',  lengthPx: 38, color: '#a8682a', shape: 'blade', appearAt: 0.18, unfurlSpan: 0.15 },
      { stemFrac: 0.28, side: 'right', lengthPx: 40, color: '#a8682a', shape: 'blade', appearAt: 0.26, unfurlSpan: 0.15 },
      { stemFrac: 0.45, side: 'left',  lengthPx: 34, color: '#a8682a', shape: 'blade', appearAt: 0.38, unfurlSpan: 0.15 },
      { stemFrac: 0.65, side: 'right', lengthPx: 30, color: '#a8682a', shape: 'blade', appearAt: 0.55, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.72, shape: 'petals', sizePx: 58, color: '#ffb820', centerColor: '#ff3838', petals: 18 },
  },
  {
    id: 'eternalrose', name: 'Eternal Rose', rarity: 'mythic',
    seedCost: 6500, harvestValue: 24000, growMs: MYTHIC_GROW_MS,
    unlockedByDefault: false, unlockCost: 300, seedRng: 12821, // gem cost
    stem:   { heightPx: 155, thicknessPx: 5, color: '#3a0a1a', curve: 'gnarled', curveAmp: 9 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 32, color: '#5a2a3a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.15 },
      { stemFrac: 0.32, side: 'right', lengthPx: 32, color: '#5a2a3a', shape: 'oval', appearAt: 0.28, unfurlSpan: 0.15 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 28, color: '#5a2a3a', shape: 'oval', appearAt: 0.40, unfurlSpan: 0.15 },
      { stemFrac: 0.65, side: 'right', lengthPx: 26, color: '#5a2a3a', shape: 'oval', appearAt: 0.50, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.75, shape: 'cup', sizePx: 52, color: '#c00040', centerColor: '#ffe7a8', petals: 8 },
  },
];

const BY_ID = new Map(SPECIES.map(s => [s.id, s]));
export const speciesById = (id) => BY_ID.get(id);

// Everything non-mythic starts unlocked. Mythics must be purchased with gems.
export const DEFAULT_UNLOCKED = SPECIES.filter(s => s.rarity !== 'mythic').map(s => s.id);
export const MYTHIC_IDS = SPECIES.filter(s => s.rarity === 'mythic').map(s => s.id);
