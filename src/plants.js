export const RARITIES = ['common', 'uncommon', 'rare', 'legendary', 'mythic'];

export const RARITY_COLORS = {
  common:    '#9aa0a6',
  uncommon:  '#6cc36c',
  rare:      '#4a9be8',
  legendary: '#e8b048',
  mythic:    '#c886ff',
};

export const MYTHIC_GROW_MS = 20 * 60 * 1000;

// All plants harvest at 1.2× their seed cost. Ordered common → mythic, and by
// seed cost within each rarity.
export const SPECIES = [
  // ─── COMMON ───────────────────────────────────────────────────────────────
  {
    id: 'dandelion', name: 'Dandelion', rarity: 'common',
    seedCost: 5, harvestValue: 6, growMs: 25_000,
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
    id: 'buttercup', name: 'Buttercup', rarity: 'common',
    seedCost: 6, harvestValue: 7, growMs: 28_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1217,
    stem:   { heightPx: 60, thicknessPx: 3, color: '#4a8a3a', curve: 'wobble', curveAmp: 3 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 22, color: '#6cb05c', shape: 'oval', appearAt: 0.25, unfurlSpan: 0.18 },
      { stemFrac: 0.35, side: 'right', lengthPx: 20, color: '#6cb05c', shape: 'oval', appearAt: 0.35, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 22, color: '#ffe04a', centerColor: '#f0a020', petals: 5 },
  },
  {
    id: 'clover', name: 'Clover', rarity: 'common',
    seedCost: 8, harvestValue: 10, growMs: 35_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 2273,
    stem:   { heightPx: 55, thicknessPx: 3, color: '#3a8b3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.30, side: 'left',  lengthPx: 20, color: '#5cb85c', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.20 },
      { stemFrac: 0.55, side: 'right', lengthPx: 22, color: '#5cb85c', shape: 'oval', appearAt: 0.40, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.80, shape: 'cluster', sizePx: 22, color: '#f4f0e6', centerColor: '#dccfa0', petals: 9 },
  },
  {
    id: 'violet', name: 'Violet', rarity: 'common',
    seedCost: 10, harvestValue: 12, growMs: 40_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1759,
    stem:   { heightPx: 50, thicknessPx: 3, color: '#3a6a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 24, color: '#5ca84a', shape: 'oval', appearAt: 0.25, unfurlSpan: 0.20 },
      { stemFrac: 0.30, side: 'right', lengthPx: 24, color: '#5ca84a', shape: 'oval', appearAt: 0.35, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 22, color: '#9858d8', centerColor: '#f0d048', petals: 5 },
  },
  {
    id: 'pansy', name: 'Pansy', rarity: 'common',
    seedCost: 11, harvestValue: 13, growMs: 42_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1583,
    stem:   { heightPx: 50, thicknessPx: 3, color: '#3a6a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 22, color: '#5ca84a', shape: 'oval', appearAt: 0.25, unfurlSpan: 0.20 },
      { stemFrac: 0.35, side: 'right', lengthPx: 22, color: '#5ca84a', shape: 'oval', appearAt: 0.35, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 24, color: '#7848d0', centerColor: '#ffe040', petals: 5 },
  },
  {
    id: 'daisy', name: 'Daisy', rarity: 'common',
    seedCost: 12, harvestValue: 14, growMs: 50_000,
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
    id: 'forgetmenot', name: 'Forget-me-not', rarity: 'common',
    seedCost: 13, harvestValue: 16, growMs: 48_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1693,
    stem:   { heightPx: 60, thicknessPx: 3, color: '#3a8a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 22, color: '#5cb05c', shape: 'oval', appearAt: 0.25, unfurlSpan: 0.20 },
      { stemFrac: 0.40, side: 'right', lengthPx: 22, color: '#5cb05c', shape: 'oval', appearAt: 0.35, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cluster', sizePx: 22, color: '#78a8e8', centerColor: '#ffe040', petals: 7 },
  },
  {
    id: 'poppy', name: 'Poppy', rarity: 'common',
    seedCost: 14, harvestValue: 17, growMs: 55_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1487,
    stem:   { heightPx: 80, thicknessPx: 3, color: '#5a8a3a', curve: 'wobble', curveAmp: 6 },
    leaves: [
      { stemFrac: 0.15, side: 'left',  lengthPx: 22, color: '#6cb05c', shape: 'jagged', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.30, side: 'right', lengthPx: 22, color: '#6cb05c', shape: 'jagged', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 28, color: '#e83a3a', centerColor: '#2a1a08', petals: 4 },
  },
  {
    id: 'crocus', name: 'Crocus', rarity: 'common',
    seedCost: 16, harvestValue: 19, growMs: 60_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1907,
    stem:   { heightPx: 55, thicknessPx: 3, color: '#4a7a3a', curve: 'straight', curveAmp: 2 },
    leaves: [
      { stemFrac: 0.10, side: 'left',  lengthPx: 32, color: '#5a9a3a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.15, side: 'right', lengthPx: 30, color: '#5a9a3a', shape: 'blade', appearAt: 0.28, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.75, shape: 'cup', sizePx: 24, color: '#b888e8', centerColor: '#ffc850', petals: 6 },
  },
  {
    id: 'primrose', name: 'Primrose', rarity: 'common',
    seedCost: 17, harvestValue: 20, growMs: 62_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 1973,
    stem:   { heightPx: 55, thicknessPx: 3, color: '#3a7a3a', curve: 'straight', curveAmp: 2 },
    leaves: [
      { stemFrac: 0.10, side: 'left',  lengthPx: 30, color: '#4a8a3a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.15, side: 'right', lengthPx: 30, color: '#4a8a3a', shape: 'oval', appearAt: 0.28, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 24, color: '#ffe070', centerColor: '#ff9020', petals: 5 },
  },
  {
    id: 'snowdrop', name: 'Snowdrop', rarity: 'common',
    seedCost: 18, harvestValue: 22, growMs: 65_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 2089,
    stem:   { heightPx: 70, thicknessPx: 3, color: '#3a8a4a', curve: 'wobble', curveAmp: 3 },
    leaves: [
      { stemFrac: 0.12, side: 'left',  lengthPx: 34, color: '#4a9a5a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.18, side: 'right', lengthPx: 32, color: '#4a9a5a', shape: 'blade', appearAt: 0.28, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 22, color: '#f8fcfa', centerColor: '#a8d8a0', petals: 6 },
  },
  {
    id: 'marigold', name: 'Marigold', rarity: 'common',
    seedCost: 20, harvestValue: 24, growMs: 70_000,
    unlockedByDefault: true, unlockCost: 0, seedRng: 2459,
    stem:   { heightPx: 75, thicknessPx: 3, color: '#5a8a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 22, color: '#6cb05c', shape: 'jagged', appearAt: 0.22, unfurlSpan: 0.18 },
      { stemFrac: 0.35, side: 'right', lengthPx: 22, color: '#6cb05c', shape: 'jagged', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 20, color: '#6cb05c', shape: 'jagged', appearAt: 0.42, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'cluster', sizePx: 28, color: '#ff8c2a', centerColor: '#b04818', petals: 12 },
  },

  // ─── UNCOMMON ─────────────────────────────────────────────────────────────
  {
    id: 'tulip', name: 'Tulip', rarity: 'uncommon',
    seedCost: 25, harvestValue: 30, growMs: 75_000,
    unlockedByDefault: false, unlockCost: 60, seedRng: 4201,
    stem:   { heightPx: 95, thicknessPx: 4, color: '#3a7a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.15, side: 'left',  lengthPx: 36, color: '#4a8a3a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.20, side: 'right', lengthPx: 32, color: '#4a8a3a', shape: 'blade', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 28, color: '#e8487a', centerColor: '#b8285a', petals: 5 },
  },
  {
    id: 'carnation', name: 'Carnation', rarity: 'uncommon',
    seedCost: 28, harvestValue: 34, growMs: 78_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 4361,
    stem:   { heightPx: 100, thicknessPx: 4, color: '#3a7a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.15, side: 'left',  lengthPx: 32, color: '#4a8a3a', shape: 'blade', appearAt: 0.18, unfurlSpan: 0.20 },
      { stemFrac: 0.25, side: 'right', lengthPx: 30, color: '#4a8a3a', shape: 'blade', appearAt: 0.26, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cluster', sizePx: 30, color: '#f078a8', centerColor: '#a04060', petals: 11 },
  },
  {
    id: 'bluebell', name: 'Bluebell', rarity: 'uncommon',
    seedCost: 30, harvestValue: 36, growMs: 80_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 4877,
    stem:   { heightPx: 90, thicknessPx: 3, color: '#3a6a3a', curve: 'wobble', curveAmp: 5 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 28, color: '#4a8a3a', shape: 'blade', appearAt: 0.22, unfurlSpan: 0.20 },
      { stemFrac: 0.28, side: 'right', lengthPx: 26, color: '#4a8a3a', shape: 'blade', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.72, shape: 'spike', sizePx: 32, color: '#6c8ad8', centerColor: '#3a4880', petals: 0 },
  },
  {
    id: 'iris', name: 'Iris', rarity: 'uncommon',
    seedCost: 35, harvestValue: 42, growMs: 85_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 5347,
    stem:   { heightPx: 105, thicknessPx: 4, color: '#3a6a4a', curve: 'straight', curveAmp: 2 },
    leaves: [
      { stemFrac: 0.10, side: 'left',  lengthPx: 42, color: '#4a8a5a', shape: 'blade', appearAt: 0.18, unfurlSpan: 0.20 },
      { stemFrac: 0.14, side: 'right', lengthPx: 40, color: '#4a8a5a', shape: 'blade', appearAt: 0.26, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.75, shape: 'petals', sizePx: 32, color: '#7a58d0', centerColor: '#ffd050', petals: 6 },
  },
  {
    id: 'valleylily', name: 'Valley Lily', rarity: 'uncommon',
    seedCost: 38, harvestValue: 46, growMs: 88_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 5189,
    stem:   { heightPx: 95, thicknessPx: 3, color: '#3a7a3a', curve: 'wobble', curveAmp: 3 },
    leaves: [
      { stemFrac: 0.12, side: 'left',  lengthPx: 42, color: '#4a8a3a', shape: 'blade', appearAt: 0.18, unfurlSpan: 0.20 },
      { stemFrac: 0.18, side: 'right', lengthPx: 40, color: '#4a8a3a', shape: 'blade', appearAt: 0.26, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.72, shape: 'spike', sizePx: 30, color: '#f8fcfa', centerColor: '#c8d8c0', petals: 0 },
  },
  {
    id: 'sunflower', name: 'Sunflower', rarity: 'uncommon',
    seedCost: 40, harvestValue: 48, growMs: 110_000,
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
    id: 'daffodil', name: 'Daffodil', rarity: 'uncommon',
    seedCost: 45, harvestValue: 54, growMs: 90_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 5563,
    stem:   { heightPx: 110, thicknessPx: 4, color: '#3a7a3a', curve: 'wobble', curveAmp: 3 },
    leaves: [
      { stemFrac: 0.10, side: 'left',  lengthPx: 44, color: '#4a8a3a', shape: 'blade', appearAt: 0.18, unfurlSpan: 0.20 },
      { stemFrac: 0.16, side: 'right', lengthPx: 42, color: '#4a8a3a', shape: 'blade', appearAt: 0.26, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 30, color: '#ffd83a', centerColor: '#ff8a18', petals: 6 },
  },
  {
    id: 'hyacinth', name: 'Hyacinth', rarity: 'uncommon',
    seedCost: 50, harvestValue: 60, growMs: 100_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 5821,
    stem:   { heightPx: 90, thicknessPx: 4, color: '#3a6a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.10, side: 'left',  lengthPx: 38, color: '#4a8a3a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.16, side: 'right', lengthPx: 36, color: '#4a8a3a', shape: 'blade', appearAt: 0.28, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.70, shape: 'spike', sizePx: 40, color: '#c878e8', centerColor: '#6840a8', petals: 0 },
  },
  {
    id: 'foxglove', name: 'Foxglove', rarity: 'uncommon',
    seedCost: 55, harvestValue: 66, growMs: 95_000,
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
    id: 'pinkthrift', name: 'Pinkthrift', rarity: 'uncommon',
    seedCost: 60, harvestValue: 72, growMs: 108_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 5917,
    stem:   { heightPx: 95, thicknessPx: 3, color: '#4a7a3a', curve: 'straight', curveAmp: 2 },
    leaves: [
      { stemFrac: 0.08, side: 'left',  lengthPx: 36, color: '#5a9a4a', shape: 'blade', appearAt: 0.18, unfurlSpan: 0.20 },
      { stemFrac: 0.12, side: 'right', lengthPx: 34, color: '#5a9a4a', shape: 'blade', appearAt: 0.26, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'cluster', sizePx: 26, color: '#f898c0', centerColor: '#c0407a', petals: 13 },
  },
  {
    id: 'snapdragon', name: 'Snapdragon', rarity: 'uncommon',
    seedCost: 65, harvestValue: 78, growMs: 115_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 6037,
    stem:   { heightPx: 120, thicknessPx: 4, color: '#3a6a3a', curve: 'wobble', curveAmp: 5 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 28, color: '#4a8a3a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.18 },
      { stemFrac: 0.30, side: 'right', lengthPx: 28, color: '#4a8a3a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.45, side: 'left',  lengthPx: 24, color: '#4a8a3a', shape: 'oval', appearAt: 0.42, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.68, shape: 'spike', sizePx: 42, color: '#f078a8', centerColor: '#a84878', petals: 0 },
  },
  {
    id: 'anemone', name: 'Anemone', rarity: 'uncommon',
    seedCost: 75, harvestValue: 90, growMs: 120_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 6259,
    stem:   { heightPx: 100, thicknessPx: 4, color: '#4a7a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 28, color: '#5ca84a', shape: 'jagged', appearAt: 0.22, unfurlSpan: 0.20 },
      { stemFrac: 0.32, side: 'right', lengthPx: 28, color: '#5ca84a', shape: 'jagged', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.75, shape: 'petals', sizePx: 34, color: '#f0f0f0', centerColor: '#3a1a1a', petals: 7 },
  },

  // ─── RARE ─────────────────────────────────────────────────────────────────
  {
    id: 'lavender', name: 'Lavender', rarity: 'rare',
    seedCost: 90, harvestValue: 108, growMs: 150_000,
    unlockedByDefault: false, unlockCost: 280, seedRng: 5641,
    stem:   { heightPx: 115, thicknessPx: 3, color: '#5a7a4a', curve: 'wobble', curveAmp: 3 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 22, color: '#6a9a5a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.30, side: 'right', lengthPx: 22, color: '#6a9a5a', shape: 'blade', appearAt: 0.30, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.70, shape: 'spike', sizePx: 38, color: '#a878d8', centerColor: '#6a4090', petals: 0 },
  },
  {
    id: 'camellia', name: 'Camellia', rarity: 'rare',
    seedCost: 100, harvestValue: 120, growMs: 160_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 6271,
    stem:   { heightPx: 130, thicknessPx: 5, color: '#3a5a2a', curve: 'gnarled', curveAmp: 6 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 32, color: '#3a6a3a', shape: 'oval', appearAt: 0.22, unfurlSpan: 0.18 },
      { stemFrac: 0.35, side: 'right', lengthPx: 32, color: '#3a6a3a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.55, side: 'left',  lengthPx: 28, color: '#3a6a3a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 38, color: '#f86890', centerColor: '#ffd870', petals: 8 },
  },
  {
    id: 'orchid', name: 'Orchid', rarity: 'rare',
    seedCost: 120, harvestValue: 144, growMs: 180_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 6149,
    stem:   { heightPx: 110, thicknessPx: 4, color: '#4a7a4a', curve: 'gnarled', curveAmp: 5 },
    leaves: [
      { stemFrac: 0.15, side: 'left',  lengthPx: 36, color: '#5a8a5a', shape: 'blade', appearAt: 0.20, unfurlSpan: 0.20 },
      { stemFrac: 0.22, side: 'right', lengthPx: 34, color: '#5a8a5a', shape: 'blade', appearAt: 0.28, unfurlSpan: 0.20 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 36, color: '#f0a8e8', centerColor: '#a04898', petals: 5 },
  },
  {
    id: 'hibiscus', name: 'Hibiscus', rarity: 'rare',
    seedCost: 140, harvestValue: 168, growMs: 170_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 6481,
    stem:   { heightPx: 125, thicknessPx: 5, color: '#3a6a3a', curve: 'gnarled', curveAmp: 6 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 30, color: '#4a8a3a', shape: 'oval', appearAt: 0.22, unfurlSpan: 0.18 },
      { stemFrac: 0.32, side: 'right', lengthPx: 30, color: '#4a8a3a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 26, color: '#4a8a3a', shape: 'oval', appearAt: 0.42, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 40, color: '#f04040', centerColor: '#ffe080', petals: 5 },
  },
  {
    id: 'rose', name: 'Rose', rarity: 'rare',
    seedCost: 160, harvestValue: 192, growMs: 220_000,
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
    id: 'magnolia', name: 'Magnolia', rarity: 'rare',
    seedCost: 180, harvestValue: 216, growMs: 200_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 6917,
    stem:   { heightPx: 140, thicknessPx: 6, color: '#4a3a2a', curve: 'gnarled', curveAmp: 7 },
    leaves: [
      { stemFrac: 0.25, side: 'left',  lengthPx: 32, color: '#3a6a3a', shape: 'oval', appearAt: 0.22, unfurlSpan: 0.18 },
      { stemFrac: 0.40, side: 'right', lengthPx: 32, color: '#3a6a3a', shape: 'oval', appearAt: 0.32, unfurlSpan: 0.18 },
      { stemFrac: 0.55, side: 'left',  lengthPx: 28, color: '#3a6a3a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'cup', sizePx: 44, color: '#fce8e8', centerColor: '#d8a8b8', petals: 8 },
  },
  {
    id: 'peony', name: 'Peony', rarity: 'rare',
    seedCost: 200, harvestValue: 240, growMs: 240_000,
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
    id: 'gardenia', name: 'Gardenia', rarity: 'rare',
    seedCost: 230, harvestValue: 276, growMs: 260_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 7459,
    stem:   { heightPx: 115, thicknessPx: 5, color: '#3a5a3a', curve: 'wobble', curveAmp: 4 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 32, color: '#4a7a4a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.18 },
      { stemFrac: 0.35, side: 'right', lengthPx: 32, color: '#4a7a4a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.55, side: 'left',  lengthPx: 28, color: '#4a7a4a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'cluster', sizePx: 36, color: '#fafafa', centerColor: '#e0d8a8', petals: 10 },
  },
  {
    id: 'hydrangea', name: 'Hydrangea', rarity: 'rare',
    seedCost: 250, harvestValue: 300, growMs: 280_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 7619,
    stem:   { heightPx: 120, thicknessPx: 5, color: '#3a5a3a', curve: 'gnarled', curveAmp: 5 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 36, color: '#4a7a4a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.18 },
      { stemFrac: 0.35, side: 'right', lengthPx: 36, color: '#4a7a4a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 32, color: '#4a7a4a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.75, shape: 'cluster', sizePx: 48, color: '#8898e8', centerColor: '#5868c8', petals: 14 },
  },

  // ─── LEGENDARY ────────────────────────────────────────────────────────────
  {
    id: 'starblossom', name: 'Starblossom', rarity: 'legendary',
    seedCost: 400, harvestValue: 480, growMs: 320_000,
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
  {
    id: 'moonflower', name: 'Moonflower', rarity: 'legendary',
    seedCost: 550, harvestValue: 660, growMs: 360_000,
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
    id: 'ghostbloom', name: 'Ghostbloom', rarity: 'legendary',
    seedCost: 700, harvestValue: 840, growMs: 400_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 8807,
    stem:   { heightPx: 150, thicknessPx: 4, color: '#5a7a7a', curve: 'wobble', curveAmp: 7 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 32, color: '#7a9a9a', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.18 },
      { stemFrac: 0.32, side: 'right', lengthPx: 34, color: '#7a9a9a', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 28, color: '#7a9a9a', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 48, color: '#e8f8f8', centerColor: '#a8c8d8', petals: 8 },
  },
  {
    id: 'firelily', name: 'Firelily', rarity: 'legendary',
    seedCost: 800, harvestValue: 960, growMs: 420_000,
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
    id: 'phoenixbloom', name: 'Phoenixbloom', rarity: 'legendary',
    seedCost: 1100, harvestValue: 1320, growMs: 480_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 9587,
    stem:   { heightPx: 150, thicknessPx: 5, color: '#7a2a1a', curve: 'gnarled', curveAmp: 9 },
    leaves: [
      { stemFrac: 0.20, side: 'left',  lengthPx: 36, color: '#a8482a', shape: 'jagged', appearAt: 0.20, unfurlSpan: 0.18 },
      { stemFrac: 0.32, side: 'right', lengthPx: 38, color: '#a8482a', shape: 'jagged', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 32, color: '#a8482a', shape: 'jagged', appearAt: 0.42, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.75, shape: 'petals', sizePx: 52, color: '#ff5818', centerColor: '#ffe040', petals: 14 },
  },
  {
    id: 'glasspetal', name: 'Glasspetal', rarity: 'legendary',
    seedCost: 1500, harvestValue: 1800, growMs: 540_000,
    unlockedByDefault: false, unlockCost: 0, seedRng: 9941,
    stem:   { heightPx: 165, thicknessPx: 4, color: '#5a7a8a', curve: 'wobble', curveAmp: 7 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 32, color: '#7a9eb0', shape: 'oval', appearAt: 0.20, unfurlSpan: 0.18 },
      { stemFrac: 0.32, side: 'right', lengthPx: 34, color: '#7a9eb0', shape: 'oval', appearAt: 0.30, unfurlSpan: 0.18 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 28, color: '#7a9eb0', shape: 'oval', appearAt: 0.45, unfurlSpan: 0.18 },
    ],
    bloom: { appearAt: 0.78, shape: 'petals', sizePx: 50, color: '#d8f8ff', centerColor: '#88c8e8', petals: 9 },
  },

  // ─── MYTHIC ───────────────────────────────────────────────────────────────
  {
    id: 'voidbloom', name: 'Voidbloom', rarity: 'mythic',
    seedCost: 2500, harvestValue: 3000, growMs: MYTHIC_GROW_MS,
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
    id: 'crystalwisp', name: 'Crystalwisp', rarity: 'mythic',
    seedCost: 3500, harvestValue: 4200, growMs: MYTHIC_GROW_MS,
    unlockedByDefault: false, unlockCost: 80, seedRng: 11357, // gem cost
    stem:   { heightPx: 165, thicknessPx: 4, color: '#3a5a7a', curve: 'wobble', curveAmp: 8 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 30, color: '#5a8aa8', shape: 'blade', appearAt: 0.18, unfurlSpan: 0.15 },
      { stemFrac: 0.32, side: 'right', lengthPx: 32, color: '#5a8aa8', shape: 'blade', appearAt: 0.28, unfurlSpan: 0.15 },
      { stemFrac: 0.50, side: 'left',  lengthPx: 26, color: '#5a8aa8', shape: 'blade', appearAt: 0.42, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.75, shape: 'cluster', sizePx: 50, color: '#a8e8ff', centerColor: '#ffffff', petals: 9 },
  },
  {
    id: 'dragonfire', name: 'Dragonfire', rarity: 'mythic',
    seedCost: 5000, harvestValue: 6000, growMs: MYTHIC_GROW_MS,
    unlockedByDefault: false, unlockCost: 180, seedRng: 12089, // gem cost
    stem:   { heightPx: 170, thicknessPx: 6, color: '#4a1a0a', curve: 'gnarled', curveAmp: 10 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 38, color: '#8a3a1a', shape: 'jagged', appearAt: 0.20, unfurlSpan: 0.15 },
      { stemFrac: 0.30, side: 'right', lengthPx: 40, color: '#8a3a1a', shape: 'jagged', appearAt: 0.28, unfurlSpan: 0.15 },
      { stemFrac: 0.48, side: 'left',  lengthPx: 34, color: '#8a3a1a', shape: 'jagged', appearAt: 0.40, unfurlSpan: 0.15 },
      { stemFrac: 0.65, side: 'right', lengthPx: 30, color: '#8a3a1a', shape: 'jagged', appearAt: 0.55, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.72, shape: 'petals', sizePx: 58, color: '#ff3a18', centerColor: '#ffd800', petals: 16 },
  },
  {
    id: 'eternalrose', name: 'Eternal Rose', rarity: 'mythic',
    seedCost: 6500, harvestValue: 7800, growMs: MYTHIC_GROW_MS,
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
  {
    id: 'sunshatter', name: 'Sunshatter', rarity: 'mythic',
    seedCost: 8000, harvestValue: 9600, growMs: MYTHIC_GROW_MS,
    unlockedByDefault: false, unlockCost: 400, seedRng: 13569, // gem cost
    stem:   { heightPx: 175, thicknessPx: 6, color: '#5a3a0a', curve: 'gnarled', curveAmp: 11 },
    leaves: [
      { stemFrac: 0.18, side: 'left',  lengthPx: 40, color: '#a06820', shape: 'jagged', appearAt: 0.18, unfurlSpan: 0.15 },
      { stemFrac: 0.30, side: 'right', lengthPx: 42, color: '#a06820', shape: 'jagged', appearAt: 0.28, unfurlSpan: 0.15 },
      { stemFrac: 0.48, side: 'left',  lengthPx: 36, color: '#a06820', shape: 'jagged', appearAt: 0.40, unfurlSpan: 0.15 },
      { stemFrac: 0.65, side: 'right', lengthPx: 32, color: '#a06820', shape: 'jagged', appearAt: 0.55, unfurlSpan: 0.15 },
    ],
    bloom: { appearAt: 0.70, shape: 'puff', sizePx: 64, color: '#ffd820', centerColor: '#ff7818', petals: 0 },
  },
];

const BY_ID = new Map(SPECIES.map(s => [s.id, s]));
export const speciesById = (id) => BY_ID.get(id);

// Everything non-mythic starts unlocked. Mythics must be purchased with gems.
export const DEFAULT_UNLOCKED = SPECIES.filter(s => s.rarity !== 'mythic').map(s => s.id);
export const MYTHIC_IDS = SPECIES.filter(s => s.rarity === 'mythic').map(s => s.id);
