import { state } from './state.js';

const KEY = 'plant_rush:tutorial:v1';

const STEPS = [
  {
    title: 'Welcome to your garden',
    body: 'Tap an empty plot — the small brown patches along the soil line — to plant a seed.',
    hint: '↓ click a plot to plant',
    auto: true, // advance when something gets planted
  },
  {
    title: 'Watch it grow',
    body: 'The blue/green bar above each plant shows growth progress. The bar is BLUE while watered (2× growth), GREEN once the water runs out. Tap a growing plant to water it again — a "!💧" alert appears when it gets thirsty.',
    cta: 'GOT IT',
  },
  {
    title: 'Harvest when ready',
    body: 'A mature plant glows yellow and gently bobs. Tap it to sell it for coins. Faster crops earn less, slower crops earn more.',
    hint: '↓ tap a glowing mature plant',
    auto: true, // advance when a harvest happens
  },
  {
    title: 'Watch out for bugs',
    body: '🐞 Ladybugs only land on THIRSTY plants — keep the water bar blue and they stay away. If one does land, a ⚠ BUG warning flashes 3 seconds early; tap the bug to flick it off. In SHOP you can buy 🧪 Bug Spray for 50c — pick one plot, the next harvest there is bug-proof.',
    cta: 'GOT IT',
  },
  {
    title: 'You\'re all set',
    body: 'SHOP — buy upgrades, plots, hanging pots, shields, and mythic seeds (with gems). DAILY — claim 10 💎 every day. PHOTO + GALLERY — snap your favorites. Press R to redeem codes. Happy gardening!',
    cta: 'FINISH',
  },
];

let step = -1;
let overlay = null;
let prevPlanted = 0;

export function initTutorial() {
  if (localStorage.getItem(KEY) === 'done') return;
  step = 0;
  prevPlanted = countPlanted();
  render();
}

function countPlanted() {
  return state.plots.filter(p => p && p.species).length;
}

export function tutorialTick() {
  if (step < 0 || step >= STEPS.length) return;
  const s = STEPS[step];
  if (!s.auto) return;
  const planted = countPlanted();
  if (step === 0 && planted > prevPlanted) {
    prevPlanted = planted;
    advance();
    return;
  }
  if (step === 2 && planted < prevPlanted) {
    prevPlanted = planted;
    advance();
    return;
  }
  prevPlanted = planted;
}

function advance() {
  step += 1;
  if (step >= STEPS.length) { finish(); return; }
  render();
}

function finish() {
  step = STEPS.length;
  if (overlay) { overlay.remove(); overlay = null; }
  localStorage.setItem(KEY, 'done');
}

function render() {
  if (overlay) overlay.remove();
  const s = STEPS[step];
  overlay = document.createElement('div');
  overlay.id = 'tutorial';
  overlay.innerHTML = `
    <div class="tut-box">
      <div class="tut-head">
        <span class="tut-step">STEP ${step + 1} / ${STEPS.length}</span>
        <button class="tut-skip" type="button">SKIP</button>
      </div>
      <div class="tut-title"></div>
      <div class="tut-body"></div>
      <div class="tut-actions"></div>
    </div>
  `;
  overlay.querySelector('.tut-title').textContent = s.title;
  overlay.querySelector('.tut-body').textContent = s.body;
  overlay.querySelector('.tut-skip').addEventListener('click', finish);

  const actions = overlay.querySelector('.tut-actions');
  if (s.cta) {
    const btn = document.createElement('button');
    btn.className = 'tut-next';
    btn.type = 'button';
    btn.textContent = s.cta;
    btn.addEventListener('click', advance);
    actions.appendChild(btn);
  } else if (s.hint) {
    const hint = document.createElement('div');
    hint.className = 'tut-hint';
    hint.textContent = s.hint;
    actions.appendChild(hint);
  }
  document.body.appendChild(overlay);
}
