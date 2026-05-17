import { state, plotState, applyWater, harvest } from './state.js';
import { hitTest, spawnWaterEffect, snapshotPlant } from './renderer.js';
import { openSeedPicker, showToast, refreshCoins, isPhotoMode, setPhotoMode } from './ui.js';
import { speciesById } from './plants.js';
import { addPhoto } from './gallery.js';

const canvas = document.getElementById('scene');

export function initInput() {
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const idx = hitTest(x, y);
    if (idx < 0) return;
    if (isPhotoMode()) {
      handlePhoto(idx);
    } else {
      handlePlotClick(idx);
    }
  });
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
