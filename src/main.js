import { state, advanceGrowth, applyOfflineCatchup, topUpCoins, tickBugs, tickSprinklers, TICK_MS } from './state.js';
import { loadState, saveState } from './store.js';
import { loadGallery } from './gallery.js';
import { initRenderer, render, spawnWaterEffect } from './renderer.js';
import { initInput } from './input.js';
import { initUI, refreshCoins, openDaily, refreshDailyBtn, maybeShowLevelUpModal } from './ui.js';
import { dailyEligible } from './state.js';
import { initTutorial, tutorialTick } from './tutorial.js';

loadState();
loadGallery();
applyOfflineCatchup();
topUpCoins();
saveState();

initRenderer();
initUI();
initInput();
refreshCoins();
refreshDailyBtn();
initTutorial();

// Auto-prompt the daily reward on load if eligible (matches plant_cars UX).
if (dailyEligible()) {
  // Slight delay so the canvas renders first.
  setTimeout(openDaily, 350);
}

// If a previous session ended mid-level-up, finish picking now.
if ((state.pendingLevelUps || 0) > 0) {
  setTimeout(maybeShowLevelUpModal, dailyEligible() ? 900 : 400);
}

// State tick: deterministic 100ms steps. Updates growth and refreshes coin HUD
// when balances change (only on harvest, but cheap to refresh each tick).
let lastCoinDisplay = -1;
setInterval(() => {
  advanceGrowth();
  const watered = tickSprinklers();
  for (const i of watered) spawnWaterEffect(i);
  tickBugs();
  topUpCoins();
  if (state.coins !== lastCoinDisplay) {
    refreshCoins();
    lastCoinDisplay = state.coins;
  }
  tutorialTick();
}, TICK_MS);

// Render loop: pure draw, no state mutation.
function frame(t) {
  render(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Autosave every 5s + on tab hide / unload.
setInterval(saveState, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveState();
});
window.addEventListener('beforeunload', saveState);
