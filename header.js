const HEADER_PATH = 'header.html';
const PLACEHOLDER_SELECTOR = '#site-header';
const SELECTORS = { wave: '.wave', suffix: '.xp-suffix' };

const WIDTH = 420;
const STEP = 4;
const PULSE_AMP = 2.0;
const PULSE_WAVELENGTH = 0.06;
const FADE_IN  = 0.5;
const FADE_OUT = 1.0;

const BASE_SPEED = 4.0;  // 4.16
const BASE_AMP   = 4.0;  // 5.04
const HIGH_SPEED_MULT = 8;
const HIGH_AMP_MULT   = 0.5;

const DURATION_HIGH     = 4.0;
const DURATION_NORM_MIN = 3.0;
const DURATION_NORM_MAX = 6.0;
const AUTO_MIN = 6.0;
const AUTO_MAX = 10.0;

const baseYs = [34, 52, 70, 88, 106];
const waveConfig = [
  { speed: 2.2,  phase: 0.0, direction:  1 },
  { speed: 1.58, phase: 1.2, direction: -1 },
  { speed: 1.94, phase: 2.4, direction:  1 },
  { speed: 1.41, phase: 3.1, direction: -1 },
  { speed: 1.76, phase: 4.0, direction:  1 }
];
const eventConfig = { eventWavelength: 0.06, eventPhase: 0.0 };

// ===== WORD LIST =====
const suffixWords = ['EXPERIENCE','EXPOSURE','EXPLORATION','EXPANSION','EXPRESSION','EXPERTISE'];
const XP_LEFT = 28;   // px van links waar XP verankerd is
const TOTAL_W = 420;  // breedte van het blok

// ===== STATE =====
let wavePaths = [], baselineSamples = [], baselineSvg = null, waveTime = 0;
let activeEvents = [], clickLocked = false;
let prefixSlots = [], suffixSlots = [], currentWordIdx = 0;
let floatTime = 0, floatLastTs = null;

// ===== HELPERS =====
function smoothstep(x) { return x * x * (3 - 2 * x); }
function randRange(a, b) { return a + Math.random() * (b - a); }
function getEl(sel) { return document.querySelector(sel); }
function getEls(sel) { return Array.from(document.querySelectorAll(sel)); }

// ===== FLOAT STATES =====
const floatStates = new Map();
function getFloatState(id) {
  if (!floatStates.has(id)) floatStates.set(id, {
    phaseY: Math.random()*Math.PI*2, speedY: 1.1+Math.random()*0.8,  ampY: (1.0+Math.random()*1.0)*0.4,
    phaseX: Math.random()*Math.PI*2, speedX: 0.65+Math.random()*0.5, ampX: (0.6+Math.random()*0.7)*0.4,
  });
  return floatStates.get(id);
}
const globalFloat = {
  phaseY: Math.random()*Math.PI*2, speedY: 0.55+Math.random()*0.25, ampY: 1.0+Math.random()*1.0,
  phaseX: Math.random()*Math.PI*2, speedX: 0.32+Math.random()*0.18, ampX: 0.6+Math.random()*0.7,
};

// ===== LETTER MORPH =====
function crossfadeTo(slot, newChar, duration = 2100) {
  const layers = slot.querySelectorAll('.xp-letter-layer');
  const a = layers[0], b = layers[1];
  const active   = parseFloat(a.style.opacity ?? '1') > 0.5 ? a : b;
  const inactive = active === a ? b : a;
  inactive.textContent = newChar || '';
  inactive.style.transition = 'none';
  inactive.style.opacity = '0';
  inactive.style.filter  = 'blur(6px)';
  void inactive.offsetWidth;
  const ease = `${duration}ms cubic-bezier(0.4,0,0.2,1)`;
  inactive.style.transition = `opacity ${ease}, filter ${ease}`;
  active.style.transition   = `opacity ${ease}, filter ${ease}`;
  inactive.style.opacity = newChar ? '1' : '0';
  inactive.style.filter  = 'blur(0px)';
  active.style.opacity   = '0';
  active.style.filter    = 'blur(5px)';
}

function buildSlots(container, text, availableW, idPrefix) {
  container.innerHTML = '';
  if (!text.length) return [];
  const slotW = availableW / text.length;
  return text.split('').map((ch, i) => {
    const slot = document.createElement('div');
    slot.className = 'xp-letter-slot';
    slot.style.width  = slotW + 'px';
    slot.style.height = '5rem';
    slot.dataset.id   = idPrefix + i;
    const a = document.createElement('span'); a.className = 'xp-letter-layer';
    const b = document.createElement('span'); b.className = 'xp-letter-layer';
    a.textContent = ch; a.style.opacity = '1'; a.style.filter = 'blur(0px)';
    b.style.opacity = '0'; b.style.filter = 'blur(6px)';
    slot.appendChild(a); slot.appendChild(b);
    container.appendChild(slot);
    return slot;
  });
}

function splitWord(w) {
  const i = w.indexOf('XP');
  return i === -1 ? { prefix: w, suffix: '' } : { prefix: w.slice(0, i), suffix: w.slice(i + 2) };
}

function getXpWidth() {
  const core = getEl('#xp-core');
  return core ? core.getBoundingClientRect().width : 90;
}

function rebuildSlots(wordIdx) {
  const xpW    = getXpWidth();
  const preAv  = XP_LEFT;
  const sufAv  = TOTAL_W - XP_LEFT - xpW;
  const sufEl  = getEl('#xp-suffix');
  const preEl  = getEl('#xp-prefix');
  if (!sufEl || !preEl) return;
  sufEl.style.left  = (XP_LEFT + xpW) + 'px';
  preEl.style.left  = '0px';
  preEl.style.width = preAv + 'px';
  const { prefix, suffix } = splitWord(suffixWords[wordIdx]);
  prefixSlots = buildSlots(preEl, prefix, preAv, 'pre');
  suffixSlots = buildSlots(sufEl, suffix, sufAv, 'suf');
}

function morphToWord(newIdx) {
  const { prefix: np, suffix: ns } = splitWord(suffixWords[newIdx]);
  const xpW   = getXpWidth();
  const preAv = XP_LEFT;
  const sufAv = TOTAL_W - XP_LEFT - xpW;
  const preEl = getEl('#xp-prefix');
  const sufEl = getEl('#xp-suffix');

  if (np.length !== prefixSlots.length) {
    prefixSlots = buildSlots(preEl, np, preAv, 'pre');
  } else {
    const sw = preAv / np.length;
    prefixSlots.forEach((slot, i) => {
      slot.style.width = sw + 'px';
      setTimeout(() => crossfadeTo(slot, np[i] ?? ''), i * 45 + Math.random() * 55);
    });
  }

  if (ns.length !== suffixSlots.length) {
    const oldSlots = [...suffixSlots];
    oldSlots.forEach((slot, i) => setTimeout(() => crossfadeTo(slot, ''), i * 30));
    setTimeout(() => { suffixSlots = buildSlots(sufEl, ns, sufAv, 'suf'); }, 500);
  } else {
    const sw = sufAv / ns.length;
    suffixSlots.forEach((slot, i) => {
      slot.style.width = sw + 'px';
      setTimeout(() => crossfadeTo(slot, ns[i] ?? ''), i * 45 + Math.random() * 55);
    });
  }
  currentWordIdx = newIdx;
}

// ===== FLOAT LOOP =====
function floatLoop(ts) {
  if (floatLastTs !== null) floatTime += (ts - floatLastTs) * 0.001;
  floatLastTs = ts;

  const gY = Math.sin(floatTime * globalFloat.speedY + globalFloat.phaseY) * globalFloat.ampY;
  const gX = Math.sin(floatTime * globalFloat.speedX + globalFloat.phaseX) * globalFloat.ampX;
  const gt = `translateZ(0) translate(${gX}px, calc(-50% + ${gY}px))`;

  const preEl = getEl('#xp-prefix');
  const sufEl = getEl('#xp-suffix');
  if (preEl) preEl.style.transform = gt;
  if (sufEl) sufEl.style.transform = gt;

  [...prefixSlots, ...suffixSlots].forEach(slot => {
    const fs = getFloatState(slot.dataset.id);
    const y  = Math.sin(floatTime * fs.speedY + fs.phaseY) * fs.ampY;
    const x  = Math.sin(floatTime * fs.speedX + fs.phaseX) * fs.ampX;
    slot.style.transform = `translateZ(0) translate(${x}px, ${y}px)`;
  });

  requestAnimationFrame(floatLoop);
}

// ===== WAVE ENGINE =====
function wavePulse(x, t, cfg) {
  const amp = PULSE_AMP * (0.9 + 0.4 * Math.sin(t * 0.33 + cfg.phase * 0.5));
  return Math.sin(x * PULSE_WAVELENGTH * cfg.direction + t * cfg.speed + cfg.phase) * amp;
}

function eventEnvelope(ev) {
  const t = waveTime - ev.start;
  const dur = ev.forcedEndAt !== null ? ev.forcedEndAt - ev.start : ev.duration;
  return smoothstep(Math.min(Math.min(t / FADE_IN, 1), Math.min((dur - t) / FADE_OUT, 1)));
}

function globalDamping() {
  if (!activeEvents.length) return 1.0;
  let m = 0;
  for (const ev of activeEvents) { const e = eventEnvelope(ev); if (e > m) m = e; }
  return 1.0 - m * 0.2;
}

function singleEventPulse(x, t, cfg, idx, ev) {
  const elapsed = waveTime - ev.start;
  const endTime = ev.forcedEndAt ?? (ev.start + ev.duration);
  if (elapsed < 0 || waveTime > endTime) return 0;
  if (ev.waveTargets === 'one' && idx !== ev._pickedWave) return 0;
  if (ev.waveTargets === 'two' && idx > 1) return 0;
  return Math.sin(x * eventConfig.eventWavelength * ev.directionMap[idx]
    - t * ev.speedMap[idx] + cfg.phase + eventConfig.eventPhase)
    * ev.ampMap[idx] * eventEnvelope(ev);
}

function allEventsPulse(x, t, cfg, idx) {
  let s = 0;
  for (const ev of activeEvents) s += singleEventPulse(x, t, cfg, idx, ev);
  return s;
}

function getBaselineY(index, x) {
  const s = baselineSamples[index];
  if (!s?.length) return baseYs[index];
  let l = 0, r = s.length - 1;
  while (l < r) { const m = (l + r) >> 1; s[m].x < x ? l = m + 1 : r = m; }
  if (l === 0) return s[0].y;
  const prev = s[l-1], next = s[l], range = next.x - prev.x;
  return range === 0 ? prev.y : prev.y + ((x - prev.x) / range) * (next.y - prev.y);
}

function buildWavePath(index, t) {
  const cfg = waveConfig[index], segs = [], damp = globalDamping();
  for (let x = 0; x <= WIDTH; x += STEP) {
    const y = getBaselineY(index, x) + wavePulse(x, t, cfg) * damp + allEventsPulse(x, t, cfg, index);
    segs.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  return segs.join(' ');
}

function waveAnimate() {
  waveTime += 0.016;
  activeEvents = activeEvents.filter(ev =>
    ev.forcedEndAt !== null ? waveTime <= ev.forcedEndAt : waveTime - ev.start <= ev.duration);
  wavePaths.forEach((p, i) => p.setAttribute('d', buildWavePath(i, waveTime)));
  requestAnimationFrame(waveAnimate);
}

function samplePath(path) {
  const length = path.getTotalLength(), sc = Math.ceil(WIDTH / STEP) * 2;
  return Array.from({ length: sc + 1 }, (_, i) => {
    const p = path.getPointAtLength(i / sc * length); return { x: p.x, y: p.y };
  });
}

function createEvent(waveCount) {
  const r = Math.random();
  const waveTargets = r < 0.65 ? 'all' : r < 0.85 ? 'two' : 'one';
  const pickedWave  = waveTargets === 'one' ? Math.floor(Math.random() * waveCount) : null;
  const ampScale    = waveTargets === 'two' ? 1.3 : waveTargets === 'one' ? 1.5 : 1.0;
  const highSpeed   = Math.random() < 0.1;
  const speedBase   = highSpeed ? BASE_SPEED * HIGH_SPEED_MULT : BASE_SPEED;
  const ampBase     = highSpeed ? HIGH_AMP_MULT : BASE_AMP;
  const duration    = highSpeed ? DURATION_HIGH : randRange(DURATION_NORM_MIN, DURATION_NORM_MAX);
  const dM = [], sM = [], aM = [];
  for (let i = 0; i < waveCount; i++) {
    dM[i] = Math.random() < 0.5 ? -1 : 1;
    sM[i] = speedBase * (0.7 + 0.7 * Math.random());
    aM[i] = ampBase   * (0.7 + 0.7 * Math.random());
  }
  return { start: waveTime, duration, forcedEndAt: null, waveTargets,
    _pickedWave: pickedWave, ampScale, highSpeed, directionMap: dM, speedMap: sM, ampMap: aM };
}

function forceEndActiveEvents() {
  for (const ev of activeEvents) {
    const elapsed = waveTime - ev.start;
    const dur = ev.forcedEndAt !== null ? ev.forcedEndAt - ev.start : ev.duration;
    if (elapsed < dur - FADE_OUT && ev.forcedEndAt === null) ev.forcedEndAt = waveTime + FADE_OUT;
  }
}

function triggerEvent(auto = false) {
  if (!auto && clickLocked) return;
  if (!auto) { clickLocked = true; setTimeout(() => clickLocked = false, 500); }
  forceEndActiveEvents();
  activeEvents.push(createEvent(wavePaths.length));
}

function scheduleNext() {
  setTimeout(() => { triggerEvent(true); scheduleNext(); }, randRange(AUTO_MIN, AUTO_MAX) * 1000);
}

// ===== INIT =====
function setupHeader() {
  wavePaths = getEls('.wave');
  if (!wavePaths.length) return;

  baselineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  baselineSvg.style.cssText = 'width:0;height:0;position:absolute;visibility:hidden';
  document.body.appendChild(baselineSvg);

  baselineSamples = wavePaths.map(path => {
    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clone.setAttribute('d', path.getAttribute('d'));
    baselineSvg.appendChild(clone);
    const s = samplePath(clone);
    baselineSvg.removeChild(clone);
    return s;
  });

  getEl('.logo-frame')?.addEventListener('click', () => triggerEvent(false));
  setTimeout(() => { triggerEvent(true); scheduleNext(); }, 2000);
  waveAnimate();

  // XP letter morph
  rebuildSlots(0);
  requestAnimationFrame(floatLoop);

  let wordIdx = 1;
  setInterval(() => { morphToWord(wordIdx % suffixWords.length); wordIdx++; }, 5000);
}

function insertHeader() {
  const placeholder = document.querySelector(PLACEHOLDER_SELECTOR);
  if (!placeholder) return;
  fetch(HEADER_PATH)
    .then(r => r.text())
    .then(html => {
      placeholder.innerHTML = html;
      requestAnimationFrame(() => requestAnimationFrame(setupHeader));
    })
    .catch(() => console.warn('Header load failed'));
}

insertHeader();