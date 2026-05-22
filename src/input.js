import { state, plotState, applyWater, harvest,
  movePlant, addDecor, removeDecor, togglePot,
  isHangingPotPending, attachHangingPot, removeHangingPot,
  waterHanging, harvestHanging,
  isShieldPending, attachShield, killBug,
  isSprinklerPending, placeSprinkler, removeSprinkler,
  isPotionPending, getPendingPotionRecipe, applyPendingPotionToPlot } from './state.js';
import { hitTest, hitTestDecor, hitTestHanging, hitTestBug, hitTestSprinkler, spawnWaterEffect, spawnSprayEffect, spawnPotionEffect, snapshotPlant, cssToFrac, setDecorPreview } from './renderer.js';
import { openSeedPicker, openHangingSeedPicker, showToast, refreshCoins, refreshXp,
  maybeShowLevelUpModal,
  isPhotoMode, setPhotoMode,
  isEditMode, getEditTool, getEditMoveSrc, setEditMoveSrc,
  onHangingAttached, refreshHangBanner, onShieldAttached, onSprinklerPlaced,
  onPotionApplied } from './ui.js';
import { speciesById } from './plants.js';
import { addPhoto } from './gallery.js';

const canvas = document.getElementById('scene');
const DECOR_TOOLS = new Set(['tree', 'bush', 'house', 'fence', 'rock']);

export function initInput() {
  canvas.addEventListener('mousemove', (ev) => {
    if (!isEditMode()) { setDecorPreview(null); return; }
    const tool = getEditTool();
    if (!DECOR_TOOLS.has(tool)) { setDecorPreview(null); return; }
    const rect = canvas.getBoundingClientRect();
    setDecorPreview(tool, ev.clientX - rect.left, ev.clientY - rect.top);
  });
  canvas.addEventListener('mouseleave', () => setDecorPreview(null));

  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    if (isHangingPotPending()) {
      const decorId = hitTestDecor(x, y);
      if (decorId) {
        if (attachHangingPot(decorId)) {
          onHangingAttached();
        } else {
          showToast('That decor already has a pot');
        }
      } else {
        showToast('Click a tree, bush, house, fence, or rock');
      }
      return;
    }

    if (isSprinklerPending()) {
      const { xFrac } = cssToFrac(x, y);
      if (placeSprinkler(xFrac)) onSprinklerPlaced();
      return;
    }

    if (isPotionPending()) {
      const idx = hitTest(x, y);
      if (idx < 0) { showToast('Click a plot to use the potion'); return; }
      const recipe = getPendingPotionRecipe();
      const used = applyPendingPotionToPlot(idx);
      if (used && recipe) {
        spawnPotionEffect(idx, recipe.color);
        onPotionApplied(recipe.name);
      } else {
        showToast("That plot won't accept this potion");
      }
      return;
    }

    if (isShieldPending()) {
      const idx = hitTest(x, y);
      if (idx >= 0) {
        if (attachShield(idx)) {
          spawnSprayEffect(idx);
          onShieldAttached();
        } else {
          showToast('That plot is already sprayed');
        }
      } else {
        showToast('Click a plant plot to spray it');
      }
      return;
    }

    if (isEditMode()) {
      handleEditClick(x, y);
      return;
    }

    // Bugs are tiny and overlap plants — check them first.
    const bugId = hitTestBug(x, y);
    if (bugId) {
      if (killBug(bugId)) showToast('Bug off!');
      return;
    }

    // Tap the sprinkler to pick it up (no refund).
    const sprId = hitTestSprinkler(x, y);
    if (sprId) {
      if (removeSprinkler(sprId)) showToast('Sprinkler removed');
      return;
    }

    // Hanging pots are smaller targets; check them before the broad plot rects.
    const hpId = hitTestHanging(x, y);
    if (hpId) {
      if (isPhotoMode()) {
        showToast('Tap a ground plant to photograph');
      } else {
        handleHangingClick(hpId);
      }
      return;
    }

    const idx = hitTest(x, y);
    if (idx < 0) return;
    if (isPhotoMode()) {
      handlePhoto(idx);
    } else {
      handlePlotClick(idx);
    }
  });
}

function handleHangingClick(hpId) {
  const hp = state.hangingPots.find(h => h.id === hpId);
  if (!hp) return;
  const st = plotState(hp.plot);
  if (st === 'empty') {
    openHangingSeedPicker(hpId);
  } else if (st === 'growing') {
    waterHanging(hpId);
  } else if (st === 'mature') {
    const { coins, xp, levelUps } = harvestHanging(hpId);
    if (coins > 0) {
      showToast(xp > 0 ? `+${coins}c · +${xp} XP` : `+${coins}c`);
      refreshCoins();
      refreshXp();
      if (levelUps > 0) maybeShowLevelUpModal();
    }
  }
}

function handlePhoto(idx) {
  const plot = state.plots[idx];
  if (!plot || !plot.species) {
    showToast('No plant to photograph');
    return;
  }
  const sp = speciesById(plot.species);
  if (!sp) return;
  const dataUrl = snapshotPlant(sp, plot);
  const photo = addPhoto({
    dataUrl,
    speciesId: sp.id,
    speciesName: sp.name,
    growth: plot.growthProgress,
  });
  if (photo) {
    showToast('📷 Photo saved');
  } else {
    showToast('Gallery full');
  }
  setPhotoMode(false);
}

function handlePlotClick(idx) {
  const plot = state.plots[idx];
  const st = plotState(plot);
  if (st === 'empty') {
    openSeedPicker(idx);
  } else if (st === 'growing') {
    if (applyWater(idx)) {
      spawnWaterEffect(idx);
    }
  } else if (st === 'mature') {
    const { coins, xp, levelUps } = harvest(idx);
    if (coins > 0) {
      showToast(xp > 0 ? `+${coins}c · +${xp} XP` : `+${coins}c`);
      refreshCoins();
      refreshXp();
      if (levelUps > 0) maybeShowLevelUpModal();
    }
  }
}

function handleEditClick(x, y) {
  const tool = getEditTool();
  const plotIdx = hitTest(x, y);

  if (tool === 'move') {
    if (plotIdx < 0) {
      if (getEditMoveSrc() >= 0) setEditMoveSrc(-1);
      return;
    }
    const src = getEditMoveSrc();
    if (src < 0) {
      // Selecting source — must have a plant.
      if (!state.plots[plotIdx]) {
        showToast('Pick a plant first');
        return;
      }
      setEditMoveSrc(plotIdx);
      return;
    }
    if (movePlant(src, plotIdx)) {
      showToast('Moved');
    }
    setEditMoveSrc(-1);
    return;
  }

  if (tool === 'pot') {
    if (plotIdx < 0) return;
    if (togglePot(plotIdx)) {
      const has = state.potPlots.includes(plotIdx);
      showToast(has ? 'Pot added' : 'Pot removed');
    }
    return;
  }

  if (tool === 'delete') {
    // Smaller hanging-pot targets take priority over decor underneath them.
    const hpId = hitTestHanging(x, y);
    if (hpId) {
      removeHangingPot(hpId);
      showToast('Hanging pot removed');
      return;
    }
    const id = hitTestDecor(x, y);
    if (id != null) {
      removeDecor(id);
      showToast('Removed');
    }
    return;
  }

  if (DECOR_TOOLS.has(tool)) {
    const { xFrac, yFrac } = cssToFrac(x, y);
    addDecor(tool, xFrac, yFrac);
  }
}
