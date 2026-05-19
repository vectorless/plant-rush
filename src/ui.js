import {
  state, plantSeed, buyPlot, buyUpgrade, unlockSpecies, nextPlotCost,
  MAX_PLOTS, UPGRADES, DAILY_GEMS, SKINS,
  waterDurationMs, growthSpeedMult, harvestValueMult,
  dailyEligible, claimDaily, buySkin,
  hangingPotCost, buyHangingPot, isHangingPotPending, cancelHangingPotPlacement,
  plantInHanging, tradeGemForCoins, GEM_TO_COINS,
  redeemCode,
  SHIELD_COST, buyShieldPending, isShieldPending, cancelShieldPlacement,
  SPRINKLERS, SPRINKLER_INTERVAL_MS, buySprinkler, isSprinklerPending,
  cancelSprinklerPlacement, getPendingSprinklerType,
  RECIPES, brewPotion, startPotionTargeting, cancelPotionTargeting, isPotionPending,
} from './state.js';
import { SPECIES, speciesById, MYTHIC_IDS, RARITY_COLORS } from './plants.js';
import { relayout, setPhotoModeVisual, setEditModeVisual, setDecorPreview } from './renderer.js';
import { getPhotos, deletePhoto } from './gallery.js';

const coinValueEl  = document.getElementById('coinValue');
const gemValueEl   = document.getElementById('gemValue');
const shopBtn      = document.getElementById('shopBtn');
const photoBtn     = document.getElementById('photoBtn');
const galleryBtn   = document.getElementById('galleryBtn');
const dailyBtn     = document.getElementById('dailyBtn');
const editBtn      = document.getElementById('editBtn');
const photoBanner  = document.getElementById('photoBanner');
const editBanner   = document.getElementById('editBanner');
const hangBanner   = document.getElementById('hangBanner');
const shieldBanner = document.getElementById('shieldBanner');
const sprinklerBanner = document.getElementById('sprinklerBanner');
const potionBanner    = document.getElementById('potionBanner');
const potionsBtn      = document.getElementById('potionsBtn');
const editToolbar  = document.getElementById('editToolbar');
const editDoneBtn  = document.getElementById('editDoneBtn');
const backdrop     = document.getElementById('modalBackdrop');
const toastsEl     = document.getElementById('toasts');

let photoMode = false;
export function isPhotoMode() { return photoMode; }
export function setPhotoMode(on) {
  photoMode = !!on;
  if (photoMode && editMode) setEditMode(false);
  setPhotoModeVisual(photoMode);
  document.body.classList.toggle('photo-mode', photoMode);
  photoBanner.classList.toggle('hidden', !photoMode);
}

// ─── EDIT MODE ─────────────────────────────────────────────────────────────
let editMode = false;
let editTool = 'move';
let editMoveSrc = -1;
export function isEditMode() { return editMode; }
export function getEditTool() { return editTool; }
export function getEditMoveSrc() { return editMoveSrc; }
export function setEditMoveSrc(v) {
  editMoveSrc = (typeof v === 'number') ? v : -1;
  setEditModeVisual(editMode ? editTool : null, editMoveSrc);
}
export function setEditMode(on) {
  editMode = !!on;
  if (editMode && photoMode) setPhotoMode(false);
  if (!editMode) editMoveSrc = -1;
  setEditModeVisual(editMode ? editTool : null, editMoveSrc);
  document.body.classList.toggle('edit-mode', editMode);
  editBanner.classList.toggle('hidden', !editMode);
  editToolbar.classList.toggle('hidden', !editMode);
  if (editMode) refreshEditToolbar();
}
export function setEditTool(tool) {
  if (tool === 'pot' && !state.unlockedSkins.includes('pot')) {
    showToast('Buy the Pot skin in SHOP first');
    return;
  }
  editTool = tool;
  editMoveSrc = -1;
  setDecorPreview(null);
  setEditModeVisual(editTool, editMoveSrc);
  refreshEditToolbar();
}
// ─── HANGING POT PLACEMENT ─────────────────────────────────────────────────
export function refreshHangBanner() {
  hangBanner.classList.toggle('hidden', !isHangingPotPending());
}
export function cancelHangingPlacement() {
  if (cancelHangingPotPlacement()) {
    showToast('Refunded');
    refreshCoins();
    refreshHangBanner();
  }
}
export function onHangingAttached() {
  showToast('Pot hung');
  refreshHangBanner();
}

// ─── BUG SPRAY PLACEMENT ───────────────────────────────────────────────────
export function refreshShieldBanner() {
  if (shieldBanner) shieldBanner.classList.toggle('hidden', !isShieldPending());
}
export function cancelShieldPlace() {
  if (cancelShieldPlacement()) {
    showToast('Refunded');
    refreshCoins();
    refreshShieldBanner();
  }
}
export function onShieldAttached() {
  showToast('Bug spray applied');
  refreshShieldBanner();
}

// ─── SPRINKLER PLACEMENT ───────────────────────────────────────────────────
export function refreshSprinklerBanner() {
  if (sprinklerBanner) sprinklerBanner.classList.toggle('hidden', !isSprinklerPending());
}
export function cancelSprinklerPlace() {
  if (cancelSprinklerPlacement()) {
    showToast('Refunded');
    refreshCoins();
    refreshSprinklerBanner();
  }
}
export function onSprinklerPlaced() {
  showToast('Sprinkler placed');
  refreshSprinklerBanner();
}

// ─── POTION TARGETING ──────────────────────────────────────────────────────
export function refreshPotionBanner() {
  if (potionBanner) potionBanner.classList.toggle('hidden', !isPotionPending());
}
export function cancelPotionTarget() {
  if (cancelPotionTargeting()) {
    refreshPotionBanner();
  }
}
export function onPotionApplied(name) {
  showToast(`${name} applied`);
  refreshPotionBanner();
  refreshCoins();
}

function refreshEditToolbar() {
  const buttons = editToolbar.querySelectorAll('button.tool');
  for (const b of buttons) {
    const t = b.dataset.tool;
    b.classList.toggle('active', t === editTool);
    if (t === 'pot') b.disabled = !state.unlockedSkins.includes('pot');
  }
}

export function initUI() {
  shopBtn.addEventListener('click', () => {
    if (photoMode) setPhotoMode(false);
    if (editMode) setEditMode(false);
    openShop();
  });
  photoBtn.addEventListener('click', () => {
    closeModal();
    if (editMode) setEditMode(false);
    setPhotoMode(!photoMode);
  });
  galleryBtn.addEventListener('click', () => {
    if (photoMode) setPhotoMode(false);
    if (editMode) setEditMode(false);
    openGallery();
  });
  dailyBtn.addEventListener('click', () => {
    if (photoMode) setPhotoMode(false);
    if (editMode) setEditMode(false);
    openDaily();
  });
  editBtn.addEventListener('click', () => {
    closeModal();
    if (photoMode) setPhotoMode(false);
    setEditMode(!editMode);
  });
  if (potionsBtn) {
    potionsBtn.addEventListener('click', () => {
      if (photoMode) setPhotoMode(false);
      if (editMode) setEditMode(false);
      openPotions();
    });
  }
  editDoneBtn.addEventListener('click', () => setEditMode(false));
  editToolbar.querySelectorAll('button.tool').forEach(b => {
    b.addEventListener('click', () => setEditTool(b.dataset.tool));
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isHangingPotPending()) cancelHangingPlacement();
      if (isShieldPending()) cancelShieldPlace();
      if (isSprinklerPending()) cancelSprinklerPlace();
      if (isPotionPending()) cancelPotionTarget();
      if (photoMode) setPhotoMode(false);
      if (editMode) setEditMode(false);
      closeModal();
      closeLightbox();
      return;
    }
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Don't hijack typing in inputs (the redeem modal itself, for example).
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!backdrop.classList.contains('hidden')) return; // a modal is already open
      e.preventDefault();
      openRedeem();
    }
  });
  refreshCoins();
  refreshGems();
  refreshDailyBtn();
}

export function refreshCoins() {
  coinValueEl.textContent = Math.floor(state.coins);
}

export function refreshGems() {
  gemValueEl.textContent = Math.floor(state.gems);
}

export function refreshDailyBtn() {
  dailyBtn.classList.toggle('ready', dailyEligible());
}

export function openRedeem() {
  openModal((modal) => {
    const h = document.createElement('h2');
    h.textContent = 'REDEEM CODE';
    modal.appendChild(h);
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = 'Got a code? Enter it below. (Hint: press R any time.)';
    modal.appendChild(sub);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:8px; align-items:center; margin: 6px 0 4px;';
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = 'enter code';
    input.style.cssText = `
      flex: 1; padding: 9px 12px; border-radius: 3px;
      background: #0e160f; color: var(--ink); border: 1px solid #4a5a4c;
      font-family: inherit; font-size: 14px; letter-spacing: 1px;`;
    const btn = document.createElement('button');
    btn.textContent = 'REDEEM';
    btn.style.cssText = `background: #2e3e34; color: var(--ink);
      padding: 9px 18px; border: 1px solid #8aa890;
      letter-spacing: 3px; font-size: 12px; border-radius: 3px; cursor: pointer;`;
    row.appendChild(input);
    row.appendChild(btn);
    modal.appendChild(row);

    const msg = document.createElement('div');
    msg.style.cssText = 'min-height: 22px; margin-top: 8px; font-size: 13px; letter-spacing: 1px;';
    modal.appendChild(msg);

    const submit = () => {
      const res = redeemCode(input.value);
      if (res.ok) {
        msg.style.color = '#a8e8a0';
        msg.textContent = `✓ ${res.message}`;
        refreshCoins();
        refreshGems();
        showToast(res.message);
        input.value = '';
        setTimeout(closeModal, 600);
      } else {
        msg.style.color = '#e88a8a';
        msg.textContent = `✗ ${res.reason}`;
      }
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    setTimeout(() => input.focus(), 30);
  });
}

export function openDaily() {
  openModal((modal) => {
    const h = document.createElement('h2');
    h.textContent = 'DAILY REWARD';
    modal.appendChild(h);

    const eligible = dailyEligible();
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = eligible
      ? `Claim your ${DAILY_GEMS} gems for today.`
      : 'You have already claimed today. Come back tomorrow.';
    modal.appendChild(sub);

    const box = document.createElement('div');
    box.style.cssText = 'text-align:center; padding: 22px 8px;';
    box.innerHTML = `<div style="font-size: 56px; line-height: 1;">💎</div>
      <div style="font-size: 28px; letter-spacing: 4px; color: #c0a8ff; margin-top: 8px;">+${DAILY_GEMS}</div>`;
    modal.appendChild(box);

    const btn = document.createElement('button');
    btn.style.cssText = `display: block; margin: 6px auto 0;
      background: #2a2440; color: #f0e8ff; padding: 10px 26px;
      border: 1px solid ${eligible ? '#a888ff' : '#4a4060'};
      letter-spacing: 4px; font-size: 14px; border-radius: 2px;
      cursor: ${eligible ? 'pointer' : 'not-allowed'};
      opacity: ${eligible ? '1' : '0.4'};`;
    btn.textContent = eligible ? 'CLAIM' : 'CLAIMED';
    btn.disabled = !eligible;
    btn.addEventListener('click', () => {
      const got = claimDaily();
      if (got > 0) {
        refreshGems();
        refreshDailyBtn();
        showToast(`💎 +${got} gems`);
      }
      closeModal();
    });
    modal.appendChild(btn);
  });
}

export function showToast(text) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  toastsEl.appendChild(t);
  setTimeout(() => t.remove(), 1700);
}

function closeModal() {
  backdrop.classList.add('hidden');
  backdrop.innerHTML = '';
}

function openModal(buildContent) {
  backdrop.innerHTML = '';
  const modal = document.createElement('div');
  modal.className = 'modal';
  const close = document.createElement('button');
  close.className = 'modal-close';
  close.textContent = '×';
  close.addEventListener('click', closeModal);
  modal.appendChild(close);
  buildContent(modal);
  backdrop.appendChild(modal);
  backdrop.classList.remove('hidden');
}

export function openSeedPicker(plotIdx) {
  openModal((modal) => {
    const h = document.createElement('h2');
    h.textContent = 'PLANT A SEED';
    modal.appendChild(h);
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = `Plot ${plotIdx + 1}`;
    modal.appendChild(sub);
    const unlocked = SPECIES.filter(sp => state.unlockedSpecies.includes(sp.id));
    for (const sp of unlocked) {
      modal.appendChild(buildSeedRow(sp, plotIdx));
    }
    const lockedMythics = MYTHIC_IDS.filter(id => !state.unlockedSpecies.includes(id));
    if (lockedMythics.length > 0) {
      const hint = document.createElement('p');
      hint.className = 'sub';
      hint.style.marginTop = '14px';
      hint.textContent = '💎 Unlock mythic seeds in the SHOP.';
      modal.appendChild(hint);
    }
  });
}

function buildSeedRow(sp, plotIdx) {
  const row = document.createElement('div');
  row.className = 'row';
  row.dataset.rarity = sp.rarity;
  const harvestNow = Math.round(sp.harvestValue * harvestValueMult());
  const growSecs = (sp.growMs / 1000 / growthSpeedMult()).toFixed(0);
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:${sp.bloom?.color || sp.stem.color}"></div>
      <div>
        <div class="name">${sp.name}</div>
        <div class="meta">${sp.rarity.toUpperCase()} · ${growSecs}s · +${harvestNow}c</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = `${sp.seedCost}c`;
  const btn = document.createElement('button');
  btn.textContent = 'PLANT';
  btn.disabled = state.coins < sp.seedCost;
  btn.addEventListener('click', () => {
    if (plantSeed(plotIdx, sp.id)) {
      refreshCoins();
      closeModal();
    }
  });
  right.appendChild(price);
  right.appendChild(btn);
  row.appendChild(right);
  return row;
}

export function openShop() {
  openModal((modal) => {
    const h = document.createElement('h2');
    h.textContent = 'SHOP';
    modal.appendChild(h);
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = 'Upgrade your tools and expand your garden.';
    modal.appendChild(sub);

    const t1 = document.createElement('div');
    t1.className = 'section-title';
    t1.textContent = 'UPGRADES';
    modal.appendChild(t1);

    modal.appendChild(buildUpgradeRow('water'));
    modal.appendChild(buildUpgradeRow('growth'));
    modal.appendChild(buildUpgradeRow('harvest'));

    const t2 = document.createElement('div');
    t2.className = 'section-title';
    t2.textContent = 'GARDEN';
    modal.appendChild(t2);
    modal.appendChild(buildPlotRow());
    modal.appendChild(buildHangingPotRow());
    modal.appendChild(buildShieldRow());
    modal.appendChild(buildSprinklerRow('bad'));
    modal.appendChild(buildSprinklerRow('good'));

    const tEx = document.createElement('div');
    tEx.className = 'section-title';
    tEx.textContent = 'EXCHANGE';
    modal.appendChild(tEx);
    modal.appendChild(buildGemTradeRow());

    const t3 = document.createElement('div');
    t3.className = 'section-title';
    t3.textContent = 'COSMETICS';
    modal.appendChild(t3);
    for (const id of Object.keys(SKINS)) modal.appendChild(buildSkinRow(id));

    const t4 = document.createElement('div');
    t4.className = 'section-title';
    t4.textContent = 'MYTHIC SEEDS';
    modal.appendChild(t4);
    const mythics = SPECIES.filter(sp => sp.rarity === 'mythic');
    for (const sp of mythics) {
      modal.appendChild(buildMythicRow(sp));
    }
  });
}

function buildGemTradeRow() {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:#3a2a5a; border-color:#c0a8ff; box-shadow:0 0 10px rgba(168,168,255,0.4); display:flex; align-items:center; justify-content:center; font-size:14px;">💎</div>
      <div>
        <div class="name">Trade 1 💎 → ${GEM_TO_COINS}c</div>
        <div class="meta">Convert gems into coins · You have ${Math.floor(state.gems)} 💎</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  const price = document.createElement('span');
  price.className = 'price';
  price.style.color = '#c0a8ff';
  price.textContent = '1 💎';
  const btn = document.createElement('button');
  btn.textContent = 'TRADE';
  btn.disabled = state.gems < 1;
  btn.addEventListener('click', () => {
    const got = tradeGemForCoins();
    if (got > 0) {
      refreshCoins();
      refreshGems();
      showToast(`+${got}c`);
      openShop(); // refresh so balances + disabled state update
    }
  });
  right.appendChild(price);
  right.appendChild(btn);
  row.appendChild(right);
  return row;
}

function buildSkinRow(skinId) {
  const sk = SKINS[skinId];
  const owned = state.unlockedSkins.includes(skinId);
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:#b85a28; border-color:#8a3818;"></div>
      <div>
        <div class="name">${sk.name}</div>
        <div class="meta">${sk.desc} ${owned ? '· Toggle plots in EDIT mode.' : ''}</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  if (owned) {
    const tag = document.createElement('span');
    tag.style.cssText = 'color:#a8e8a0; letter-spacing:3px; font-size:12px;';
    tag.textContent = 'OWNED';
    right.appendChild(tag);
  } else {
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `${sk.cost}c`;
    const btn = document.createElement('button');
    btn.textContent = 'BUY';
    btn.disabled = state.coins < sk.cost;
    btn.addEventListener('click', () => {
      if (buySkin(skinId)) {
        refreshCoins();
        showToast(`Unlocked ${sk.name}`);
        openShop();
      }
    });
    right.appendChild(price);
    right.appendChild(btn);
  }
  row.appendChild(right);
  return row;
}

function buildMythicRow(sp) {
  const owned = state.unlockedSpecies.includes(sp.id);
  const row = document.createElement('div');
  row.className = 'row';
  row.dataset.rarity = sp.rarity;
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:${sp.bloom?.color || sp.stem.color}"></div>
      <div>
        <div class="name">${sp.name}</div>
        <div class="meta">MYTHIC · 20 min grow · seed ${sp.seedCost}c · harvest +${sp.harvestValue}c</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  if (owned) {
    const tag = document.createElement('span');
    tag.style.cssText = 'color:#c886ff; letter-spacing:3px; font-size:12px;';
    tag.textContent = 'UNLOCKED';
    right.appendChild(tag);
  } else {
    const price = document.createElement('span');
    price.className = 'price';
    price.style.color = '#c0a8ff';
    price.textContent = `💎 ${sp.unlockCost}`;
    const btn = document.createElement('button');
    btn.textContent = 'UNLOCK';
    btn.disabled = state.gems < sp.unlockCost;
    btn.addEventListener('click', () => {
      if (unlockSpecies(sp.id)) {
        refreshGems();
        openShop();
      }
    });
    right.appendChild(price);
    right.appendChild(btn);
  }
  row.appendChild(right);
  return row;
}

function upgradeEffect(kind, tier) {
  if (kind === 'water')   return `${(tier.durationMs / 1000).toFixed(0)}s per watering`;
  if (kind === 'growth')  return `×${tier.speedMult.toFixed(2)} growth speed`;
  if (kind === 'harvest') return `×${tier.valueMult.toFixed(2)} harvest value`;
  return '';
}

function buildUpgradeRow(kind) {
  const track = UPGRADES[kind];
  const cur = state.upgrades[kind];
  const curTier = track.tiers[cur];
  const next = track.tiers[cur + 1] || null;
  const atMax = !next;

  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:#2c3a30; display:flex; align-items:center; justify-content:center; font-size:18px; border-color:#6c8870;">${track.icon}</div>
      <div>
        <div class="name">${track.name} — ${curTier.label}</div>
        <div class="meta">${atMax
          ? `MAXED · ${upgradeEffect(kind, curTier)}`
          : `Now: ${upgradeEffect(kind, curTier)} · Next: ${upgradeEffect(kind, next)}`}</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  if (!atMax) {
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `${next.cost}c`;
    const btn = document.createElement('button');
    btn.textContent = 'BUY';
    btn.disabled = state.coins < next.cost;
    btn.addEventListener('click', () => {
      if (buyUpgrade(kind)) {
        refreshCoins();
        openShop();
      }
    });
    right.appendChild(price);
    right.appendChild(btn);
  }
  row.appendChild(right);
  return row;
}

export function openGallery() {
  openModal((modal) => {
    const h = document.createElement('h2');
    h.textContent = 'GALLERY';
    modal.appendChild(h);
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = 'Photographs of your plants.';
    modal.appendChild(sub);

    const photos = getPhotos();
    if (photos.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'gallery-empty';
      empty.textContent = 'No photos yet. Press 📷 PHOTO, then click a plant.';
      modal.appendChild(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    for (const p of photos) grid.appendChild(buildPhotoCard(p));
    modal.appendChild(grid);
  });
}

function buildPhotoCard(p) {
  const sp = speciesById(p.speciesId);
  const card = document.createElement('div');
  card.className = 'photo-card';

  const img = document.createElement('img');
  img.src = p.dataUrl;
  img.alt = p.speciesName || (sp && sp.name) || 'plant';
  img.addEventListener('click', () => openLightbox(p.dataUrl));
  card.appendChild(img);

  const name = document.createElement('div');
  name.className = 'pname';
  name.textContent = p.speciesName || (sp && sp.name) || 'Plant';
  card.appendChild(name);

  const meta = document.createElement('div');
  meta.className = 'pmeta';
  const date = new Date(p.takenAt);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const growthPct = Math.round((p.growth || 0) * 100);
  meta.textContent = `${growthPct}% · ${dateStr}`;
  card.appendChild(meta);

  const row = document.createElement('div');
  row.className = 'prow';
  const del = document.createElement('button');
  del.textContent = 'DELETE';
  del.addEventListener('click', () => {
    deletePhoto(p.id);
    openGallery();
  });
  row.appendChild(del);
  card.appendChild(row);

  return card;
}

function openLightbox(dataUrl) {
  closeLightbox();
  const box = document.createElement('div');
  box.id = 'lightbox';
  const img = document.createElement('img');
  img.src = dataUrl;
  box.appendChild(img);
  box.addEventListener('click', closeLightbox);
  document.body.appendChild(box);
}

function closeLightbox() {
  const box = document.getElementById('lightbox');
  if (box) box.remove();
}

function buildSprinklerRow(type) {
  const cfg = SPRINKLERS[type];
  const row = document.createElement('div');
  row.className = 'row';
  const isGood = type === 'good';
  const swatchBg = isGood ? '#c0a060' : '#7a7a7a';
  const swatchBorder = isGood ? '#ffd870' : '#cfcfcf';
  const everyS = Math.round(SPRINKLER_INTERVAL_MS / 1000);
  const lifeMin = Math.round(cfg.lifetimeMs / 60_000);
  // Status: any existing sprinkler? show remaining lifetime if it's THIS type.
  const existing = state.sprinklers[0];
  const sameType = existing && existing.type === type;
  let metaSuffix = `Lasts ${lifeMin} min`;
  if (sameType) {
    const remainMs = Math.max(0, (existing.expiresAt || 0) - Date.now());
    const remainMin = Math.ceil(remainMs / 60_000);
    metaSuffix = `PLACED · ${remainMin} min left — tap it in the garden to remove`;
  } else if (existing) {
    metaSuffix = `Lasts ${lifeMin} min · remove the other sprinkler first`;
  }
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:${swatchBg}; border-color:${swatchBorder}; display:flex; align-items:center; justify-content:center; font-size:14px;">💧</div>
      <div>
        <div class="name">${cfg.name}</div>
        <div class="meta">Waters ${cfg.range} nearest plants every ${everyS}s · ${metaSuffix}</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = `${cfg.cost}c`;
  const btn = document.createElement('button');
  btn.textContent = 'BUY';
  btn.disabled = state.coins < cfg.cost || !!existing;
  btn.addEventListener('click', () => {
    if (buySprinkler(type)) {
      refreshCoins();
      refreshSprinklerBanner();
      closeModal();
    }
  });
  right.appendChild(price);
  right.appendChild(btn);
  row.appendChild(right);
  return row;
}

function buildShieldRow() {
  const row = document.createElement('div');
  row.className = 'row';
  const sprayed = state.shieldedPlots.length;
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:#1a3a1c; border-color:#8ce888; color:#cfffd0; display:flex; align-items:center; justify-content:center; font-size:14px;">🧪</div>
      <div>
        <div class="name">+1 Bug Spray</div>
        <div class="meta">One-shot: protects the next harvest on the plot you choose. · ${sprayed} active</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = `${SHIELD_COST}c`;
  const btn = document.createElement('button');
  btn.textContent = 'BUY';
  btn.disabled = state.coins < SHIELD_COST;
  btn.addEventListener('click', () => {
    if (buyShieldPending()) {
      refreshCoins();
      refreshShieldBanner();
      closeModal();
    }
  });
  right.appendChild(price);
  right.appendChild(btn);
  row.appendChild(right);
  return row;
}

function buildHangingPotRow() {
  const cost = hangingPotCost();
  const row = document.createElement('div');
  row.className = 'row';
  const count = state.hangingPots.length;
  const hasDecor = state.decor.length > 0;
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:#b85a28; border-color:#8a3818;"></div>
      <div>
        <div class="name">+1 Hanging Pot</div>
        <div class="meta">Hang on a tree, bush, house, fence, or rock. 20% more than a new plot. · ${count} hung${hasDecor ? '' : ' · place decor first'}</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = `${cost}c`;
  const btn = document.createElement('button');
  btn.textContent = 'BUY';
  btn.disabled = state.coins < cost || !hasDecor;
  btn.addEventListener('click', () => {
    if (buyHangingPot()) {
      refreshCoins();
      refreshHangBanner();
      closeModal();
    }
  });
  right.appendChild(price);
  right.appendChild(btn);
  row.appendChild(right);
  return row;
}

export function openHangingSeedPicker(hpId) {
  openModal((modal) => {
    const h = document.createElement('h2');
    h.textContent = 'PLANT A SEED';
    modal.appendChild(h);
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = 'Hanging Pot';
    modal.appendChild(sub);
    const unlocked = SPECIES.filter(sp => state.unlockedSpecies.includes(sp.id));
    for (const sp of unlocked) {
      modal.appendChild(buildHangingSeedRow(sp, hpId));
    }
    const lockedMythics = MYTHIC_IDS.filter(id => !state.unlockedSpecies.includes(id));
    if (lockedMythics.length > 0) {
      const hint = document.createElement('p');
      hint.className = 'sub';
      hint.style.marginTop = '14px';
      hint.textContent = '💎 Unlock mythic seeds in the SHOP.';
      modal.appendChild(hint);
    }
  });
}

function buildHangingSeedRow(sp, hpId) {
  const row = document.createElement('div');
  row.className = 'row';
  row.dataset.rarity = sp.rarity;
  const harvestNow = Math.round(sp.harvestValue * harvestValueMult());
  const growSecs = (sp.growMs / 1000 / growthSpeedMult()).toFixed(0);
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:${sp.bloom?.color || sp.stem.color}"></div>
      <div>
        <div class="name">${sp.name}</div>
        <div class="meta">${sp.rarity.toUpperCase()} · ${growSecs}s · +${harvestNow}c</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = `${sp.seedCost}c`;
  const btn = document.createElement('button');
  btn.textContent = 'PLANT';
  btn.disabled = state.coins < sp.seedCost;
  btn.addEventListener('click', () => {
    if (plantInHanging(hpId, sp.id)) {
      refreshCoins();
      closeModal();
    }
  });
  right.appendChild(price);
  right.appendChild(btn);
  row.appendChild(right);
  return row;
}

// ─── POTION CRAFTING MODAL ─────────────────────────────────────────────────

// Local pot state: { [speciesId]: count }. Reset each time the modal opens.
let brewPot = {};

export function openPotions() {
  brewPot = {};
  renderPotionsModal();
}

function renderPotionsModal() {
  openModal((modal) => {
    const h = document.createElement('h2');
    h.textContent = 'POTIONS';
    modal.appendChild(h);
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = 'Drop ingredients into the pot, BREW, then choose a plant.';
    modal.appendChild(sub);

    // Brewed potions in storage
    if (state.potions.length > 0) {
      const t = document.createElement('div');
      t.className = 'section-title';
      t.textContent = 'BREWED POTIONS';
      modal.appendChild(t);
      for (const p of state.potions) {
        modal.appendChild(buildPotionRow(p));
      }
    }

    // Inventory
    const t1 = document.createElement('div');
    t1.className = 'section-title';
    t1.textContent = 'INVENTORY (harvested plants)';
    modal.appendChild(t1);
    const invGrid = document.createElement('div');
    invGrid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; margin: 4px 0 10px;';
    const entries = Object.entries(state.inventory).sort();
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'opacity:0.65; font-size:12px; padding:6px;';
      empty.textContent = 'No plants yet — harvest some to fill your inventory.';
      modal.appendChild(empty);
    } else {
      for (const [sid, count] of entries) {
        invGrid.appendChild(buildInventoryCell(sid, count));
      }
      modal.appendChild(invGrid);
    }

    // The pot
    const t2 = document.createElement('div');
    t2.className = 'section-title';
    t2.textContent = 'BREWING POT';
    modal.appendChild(t2);
    modal.appendChild(buildBrewingPot());

    // Recipes hint
    const t3 = document.createElement('div');
    t3.className = 'section-title';
    t3.textContent = 'RECIPES';
    modal.appendChild(t3);
    for (const r of RECIPES) {
      modal.appendChild(buildRecipeHint(r));
    }
  });
}

function buildInventoryCell(sid, count) {
  const sp = speciesById(sid);
  const color = sp ? (sp.bloom?.color || sp.stem.color) : '#666';
  const rarityColor = sp ? (RARITY_COLORS[sp.rarity] || '#888') : '#888';
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.style.cssText = `display:flex; align-items:center; gap:6px;
    background:#0f160f; border:1px solid ${rarityColor}; border-radius:4px;
    padding:6px 8px; cursor:pointer; color:var(--ink);`;
  cell.innerHTML = `
    <span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${color}; border:1px solid #000;"></span>
    <span style="flex:1; text-align:left; font-size:12px; letter-spacing:1px;">${sp ? sp.name : sid}</span>
    <span style="font-size:12px; color:${rarityColor};">×${count}</span>
  `;
  cell.addEventListener('click', () => {
    const have = state.inventory[sid] || 0;
    const inPot = brewPot[sid] || 0;
    if (inPot >= have) { showToast('No more of those left'); return; }
    brewPot[sid] = inPot + 1;
    renderPotionsModal();
  });
  return cell;
}

function buildBrewingPot() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'border:1px solid #5a6878; border-radius:6px; padding:10px; background:#0e160f;';

  // Ingredient list
  const items = Object.entries(brewPot).filter(([, n]) => n > 0);
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'opacity:0.6; font-size:12px; padding:6px;';
    empty.textContent = 'Empty pot — tap an inventory item to add it.';
    wrap.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;';
    for (const [sid, n] of items) {
      const sp = speciesById(sid);
      const rc = sp ? (RARITY_COLORS[sp.rarity] || '#888') : '#888';
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.style.cssText = `background:#1a261a; border:1px solid ${rc}; color:var(--ink);
        padding:4px 8px; border-radius:3px; cursor:pointer; font-size:12px; letter-spacing:1px;`;
      chip.textContent = `${sp ? sp.name : sid} ×${n} ✕`;
      chip.title = 'Click to remove one';
      chip.addEventListener('click', () => {
        brewPot[sid] = Math.max(0, (brewPot[sid] || 0) - 1);
        if (brewPot[sid] <= 0) delete brewPot[sid];
        renderPotionsModal();
      });
      list.appendChild(chip);
    }
    wrap.appendChild(list);
  }

  const row = document.createElement('div');
  row.style.cssText = 'display:flex; gap:8px; justify-content:flex-end; align-items:center; margin-top:4px;';

  const clear = document.createElement('button');
  clear.textContent = 'EMPTY POT';
  clear.style.cssText = `background:transparent; color:var(--ink);
    border:1px solid #4a5a4c; padding:6px 12px; font-size:11px; letter-spacing:2px; border-radius:3px;`;
  clear.disabled = items.length === 0;
  clear.addEventListener('click', () => { brewPot = {}; renderPotionsModal(); });
  row.appendChild(clear);

  const brew = document.createElement('button');
  brew.textContent = 'BREW';
  brew.style.cssText = `background:#2e3e34; color:var(--ink);
    border:1px solid #8aa890; padding:6px 16px; font-size:12px; letter-spacing:3px; border-radius:3px;`;
  brew.disabled = items.length === 0;
  brew.addEventListener('click', () => {
    const res = brewPotion(brewPot);
    if (res.error) {
      showToast(res.error);
      return;
    }
    brewPot = {};
    const recipe = RECIPES.find(r => r.id === res.recipeId);
    showToast(`Brewed ${recipe ? recipe.name : 'potion'}`);
    renderPotionsModal();
  });
  row.appendChild(brew);
  wrap.appendChild(row);
  return wrap;
}

function buildPotionRow(potion) {
  const recipe = RECIPES.find(r => r.id === potion.recipeId);
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:${recipe ? recipe.color : '#888'}; display:flex; align-items:center; justify-content:center; font-size:14px;">🧪</div>
      <div>
        <div class="name">${recipe ? recipe.name : 'Unknown potion'}</div>
        <div class="meta">${recipe ? recipe.desc : ''}</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  const btn = document.createElement('button');
  btn.textContent = 'USE';
  btn.addEventListener('click', () => {
    if (startPotionTargeting(potion.id)) {
      refreshPotionBanner();
      closeModal();
    }
  });
  right.appendChild(btn);
  row.appendChild(right);
  return row;
}

function buildRecipeHint(r) {
  const row = document.createElement('div');
  row.className = 'row';
  const parts = Object.entries(r.ingredients)
    .map(([k, n]) => `${n}× ${k}`).join(' + ');
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:${r.color};"></div>
      <div>
        <div class="name">${r.name}</div>
        <div class="meta">${parts} · ${r.desc}</div>
      </div>
    </div>
  `;
  return row;
}

function buildPlotRow() {
  const row = document.createElement('div');
  row.className = 'row';
  const cost = nextPlotCost();
  const atMax = cost == null;
  row.innerHTML = `
    <div class="left">
      <div class="swatch" style="background:#5a3a1a"></div>
      <div>
        <div class="name">${atMax ? 'Garden full' : '+1 Plot'}</div>
        <div class="meta">${state.plotCount} / ${MAX_PLOTS} plots</div>
      </div>
    </div>
  `;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  if (!atMax) {
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `${cost}c`;
    const btn = document.createElement('button');
    btn.textContent = 'BUY';
    btn.disabled = state.coins < cost;
    btn.addEventListener('click', () => {
      if (buyPlot()) {
        refreshCoins();
        relayout();
        openShop();
      }
    });
    right.appendChild(price);
    right.appendChild(btn);
  }
  row.appendChild(right);
  return row;
}
