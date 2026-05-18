import { state, plotState, applyWater, harvest,
  movePlant, addDecor, removeDecor, togglePot,
  isHangingPotPending, attachHangingPot, removeHangingPot,
  waterHanging, harvestHanging } from './state.js';
import { hitTest, hitTestDecor, hitTestHanging, spawnWaterEffect, snapshotPlant, cssToFrac, setDecorPreview } from './renderer.js';
import { openSeedPicker, openHangingSeedPicker, showToast, refreshCoins,
  isPhotoMode, setPhotoMode,
  isEditMode, getEditTool, getEditMoveSrc, setEditMoveSrc,
  onHangingAttached, refreshHangBanner } from './ui.js';
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

    if (isEditMode()) {
      handleEditClick(x, y);
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
    const gained = harvestHanging(hpId);
    if (gained > 0) {
      showToast(`+${gained}`);
      refreshCoins();
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
    const gained = harvest(idx);
    if (gained > 0) {
      showToast(`+${gained}`);
      refreshCoins();
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
