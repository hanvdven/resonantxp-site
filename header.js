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
 
// ===== MORPH CONSTANTEN =====
const MORPH_WORDS   = ['EXPERIENCE','EXPOSURE','EXPLORATION','EXPANSION','EXPRESSION','EXPERTISE'];
const TOTAL_W       = 420;
const XP_LEFT       = 48;
const FADE_OUT_DUR  = 1000;
const FADE_IN_DUR   = 1500;
const OVERLAP       = 600;
const STAGGER       = 100;
 
// ===== WAVE STATE =====
let wavePaths       = [];
let baselineSamples = [];
let baselineSvg     = null;
let waveTime        = 0;
let activeEvents    = [];
let clickLocked     = false;
 
// ===== MORPH STATE =====
let prefixSlots  = [];
let suffixSlots  = [];
let morphWordIdx = 0;
 
// ===== FLOAT STATE =====
let morphFloatT    = 0;
let morphFloatLast = null;
 
const floatStates = new Map();
function getFloatState(id) {
  if (!floatStates.has(id)) floatStates.set(id, {
    phaseY: Math.random() * Math.PI * 2,
    speedY: 1.1 + Math.random() * 0.8,
    ampY:   (1.0 + Math.random()) * 0.4,
    phaseX: Math.random() * Math.PI * 2,
    speedX: 0.65 + Math.random() * 0.5,
    ampX:   (0.6 + Math.random() * 0.7) * 0.4,
  });
  return floatStates.get(id);
}
 
const globalFloat = {
  phaseY: Math.random() * Math.PI * 2,
  speedY: 0.55 + Math.random() * 0.25,
  ampY:   1.0 + Math.random(),
  phaseX: Math.random() * Math.PI * 2,
  speedX: 0.32 + Math.random() * 0.18,
  ampX:   0.6 + Math.random() * 0.7,
};
 
// ===== HELPERS =====
function smoothstep(x) { return x * x * (3 - 2 * x); }
function randRange(a, b) { return a + Math.random() * (b - a); }
function getEl(sel) { return document.querySelector(sel); }
function getEls(sel) { return Array.from(document.querySelectorAll(sel)); }
 
// ===== MORPH: FADE HELPER =====
function fadeLayer(layer, toVisible, duration) {
  if (toVisible) {
    layer.style.opacity = '0';
    layer.style.filter  = 'blur(6px)';
  }
  void layer.offsetWidth; // force reflow — kritisch
  const ease = `${duration}ms cubic-bezier(0.4,0,0.2,1)`;
  layer.style.transition = `opacity ${ease}, filter ${ease}`;
  layer.style.opacity = toVisible ? '1' : '0';
  layer.style.filter  = toVisible ? 'blur(0px)' : 'blur(6px)';
}
 
// ===== MORPH: SLOTS BOUWEN =====
function buildSlots(container, text, availableW, idPrefix, visible) {
  container.innerHTML = '';
  if (!text.length) return [];
  const slotW = availableW / text.length;
  return text.split('').map((ch, i) => {
    const slot = document.createElement('div');
    slot.className    = 'xp-letter-slot';
    slot.style.width  = slotW + 'px';
    slot.dataset.id   = idPrefix + i;
 
    const a = document.createElement('span'); a.className = 'xp-letter-layer';
    const b = document.createElement('span'); b.className = 'xp-letter-layer';
    a.textContent   = ch;
    a.style.opacity = visible ? '1' : '0';
    a.style.filter  = visible ? 'blur(0px)' : 'blur(6px)';
    b.textContent   = '';
    b.style.opacity = '0';
    b.style.filter  = 'blur(6px)';
 
    slot.appendChild(a);
    slot.appendChild(b);
    container.appendChild(slot);
    return slot;
  });
}
 
function splitMorphWord(w) {
  const i = w.indexOf('XP');
  return i === -1
    ? { prefix: w, suffix: '' }
    : { prefix: w.slice(0, i), suffix: w.slice(i + 2) };
}
 
function positionSides() {
  const core = getEl('#xp-core');
  const xpW  = core ? core.getBoundingClientRect().width : 90;
  const preAv = XP_LEFT;
  const sufAv = TOTAL_W - XP_LEFT - xpW;
  const preEl = getEl('#xp-prefix');
  const sufEl = getEl('#xp-suffix');
  if (!preEl || !sufEl) return { preAv, sufAv };
 
  core.style.left = XP_LEFT + 'px';
 
  preEl.style.left           = '0px';
  preEl.style.width          = preAv + 'px';
  preEl.style.justifyContent = 'flex-end';
 
  sufEl.style.left  = (XP_LEFT + xpW) + 'px';
  sufEl.style.width = sufAv + 'px';
 
  return { preAv, sufAv };
}
 
function rebuildMorphSlots(wordIdx) {
  const { preAv, sufAv } = positionSides();
  const { prefix, suffix } = splitMorphWord(MORPH_WORDS[wordIdx]);
  prefixSlots = buildSlots(getEl('#xp-prefix'), prefix, preAv, 'pre', true);
  suffixSlots = buildSlots(getEl('#xp-suffix'), suffix, sufAv, 'suf', true);
}
 
// ===== MORPH: TRANSITIE =====
function morphToWord(newIdx) {
  const { prefix: np, suffix: ns } = splitMorphWord(MORPH_WORDS[newIdx]);
  const { preAv, sufAv } = positionSides();

  const allOld = [...prefixSlots, ...suffixSlots];

  // fade out oude letters, verwijder na afloop
  allOld.forEach((slot, i) => {
    const layers = slot.querySelectorAll('.xp-letter-layer');
    const active = parseFloat(layers[0].style.opacity ?? '1') > 0.5
      ? layers[0] : layers[1];
    setTimeout(() => {
      fadeLayer(active, false, FADE_OUT_DUR);
      setTimeout(() => slot.remove(), FADE_OUT_DUR + 100);
    }, i * STAGGER + Math.random() * 30);
  });

  // nieuwe slots als absolute overlay op dezelfde positie
  prefixSlots = buildSlotsOverlay(getEl('#xp-prefix'), np, preAv, 'pre');
  suffixSlots = buildSlotsOverlay(getEl('#xp-suffix'), ns, sufAv, 'suf');

  // fade in nieuwe letters tegelijk met fade-out
  [...prefixSlots, ...suffixSlots].forEach((slot, i) => {
    const layer = slot.querySelectorAll('.xp-letter-layer')[0];
    setTimeout(
      () => fadeLayer(layer, true, FADE_IN_DUR),
      i * STAGGER + Math.random() * 40
    );
  });

  morphWordIdx = newIdx;
}

// nieuwe slots als absolute overlay — ze nemen geen ruimte in de flex-flow
function buildSlotsOverlay(container, text, availableW, idPrefix) {
  if (!text.length) return [];
  const slotW = availableW / text.length;
  return text.split('').map((ch, i) => {
    const slot = document.createElement('div');
    slot.className      = 'xp-letter-slot';
    slot.style.width    = slotW + 'px';
    slot.style.position = 'absolute';
    slot.style.left     = (i * slotW) + 'px';
    slot.style.top      = '0';
    slot.style.height   = '100%';
    slot.dataset.id     = idPrefix + i;

    const a = document.createElement('span'); a.className = 'xp-letter-layer';
    const b = document.createElement('span'); b.className = 'xp-letter-layer';
    a.textContent   = ch;
    a.style.opacity = '0';
    a.style.filter  = 'blur(6px)';
    b.textContent   = '';
    b.style.opacity = '0';
    b.style.filter  = 'blur(6px)';

    slot.appendChild(a);
    slot.appendChild(b);
    container.appendChild(slot);
    return slot;
  });
}
 
// ===== MORPH: FLOAT LOOP =====
function morphFloatLoop(ts) {
  if (morphFloatLast !== null) morphFloatT += (ts - morphFloatLast) * 0.001;
  morphFloatLast = ts;
 
  const gY = Math.sin(morphFloatT * globalFloat.speedY + globalFloat.phaseY) * globalFloat.ampY;
  const gX = Math.sin(morphFloatT * globalFloat.speedX + globalFloat.phaseX) * globalFloat.ampX;
  const gt = `translateZ(0) translate(${gX}px, calc(-50% + ${gY}px))`;
 
  const preEl = getEl('#xp-prefix');
  const sufEl = getEl('#xp-suffix');
  if (preEl) preEl.style.transform = gt;
  if (sufEl) sufEl.style.transform = gt;
 
  [...prefixSlots, ...suffixSlots].forEach(slot => {
    const fs = getFloatState(slot.dataset.id);
    const y  = Math.sin(morphFloatT * fs.speedY + fs.phaseY) * fs.ampY;
    const x  = Math.sin(morphFloatT * fs.speedX + fs.phaseX) * fs.ampX;
    slot.style.transform = `translateZ(0) translate(${x}px, ${y}px)`;
  });
 
  requestAnimationFrame(morphFloatLoop);
}
 
// ===== WAVE ENGINE =====
function wavePulse(x, t, cfg) {
  const amp = PULSE_AMP * (0.9 + 0.4 * Math.sin(t * 0.33 + cfg.phase * 0.5));
  return Math.sin(x * PULSE_WAVELENGTH * cfg.direction + t * cfg.speed + cfg.phase) * amp;
}
 
function eventEnvelope(ev) {
  const t   = waveTime - ev.start;
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
  return Math.sin(
    x * eventConfig.eventWavelength * ev.directionMap[idx]
    - t * ev.speedMap[idx]
    + cfg.phase
    + eventConfig.eventPhase
  ) * ev.ampMap[idx] * eventEnvelope(ev);
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
  const prev = s[l - 1], next = s[l], range = next.x - prev.x;
  return range === 0 ? prev.y : prev.y + ((x - prev.x) / range) * (next.y - prev.y);
}
 
function buildWavePath(index, t) {
  const cfg  = waveConfig[index];
  const damp = globalDamping();
  const segs = [];
  for (let x = 0; x <= WIDTH; x += STEP) {
    const y = getBaselineY(index, x)
      + wavePulse(x, t, cfg) * damp
      + allEventsPulse(x, t, cfg, index);
    segs.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  return segs.join(' ');
}
 
function waveAnimate() {
  waveTime += 0.016;
  activeEvents = activeEvents.filter(ev =>
    ev.forcedEndAt !== null
      ? waveTime <= ev.forcedEndAt
      : waveTime - ev.start <= ev.duration
  );
  wavePaths.forEach((p, i) => p.setAttribute('d', buildWavePath(i, waveTime)));
  requestAnimationFrame(waveAnimate);
}
 
function samplePath(path) {
  const length = path.getTotalLength();
  const sc     = Math.ceil(WIDTH / STEP) * 2;
  return Array.from({ length: sc + 1 }, (_, i) => {
    const p = path.getPointAtLength(i / sc * length);
    return { x: p.x, y: p.y };
  });
}
 
function createEvent(waveCount) {
  const r           = Math.random();
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
  return {
    start: waveTime, duration, forcedEndAt: null,
    waveTargets, _pickedWave: pickedWave, ampScale, highSpeed,
    directionMap: dM, speedMap: sM, ampMap: aM
  };
}
 
function forceEndActiveEvents() {
  for (const ev of activeEvents) {
    const elapsed = waveTime - ev.start;
    const dur     = ev.forcedEndAt !== null ? ev.forcedEndAt - ev.start : ev.duration;
    if (elapsed < dur - FADE_OUT && ev.forcedEndAt === null) {
      ev.forcedEndAt = waveTime + FADE_OUT;
    }
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
  // waves
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
 
  const logoFrame = getEl('.logo-frame');
  if (logoFrame) logoFrame.addEventListener('click', () => triggerEvent(false));
 
  setTimeout(() => { triggerEvent(true); scheduleNext(); }, 2000);
  waveAnimate();
 
  // letter morph — twee rAF frames wachten zodat fonts geladen zijn
  requestAnimationFrame(() => requestAnimationFrame(() => {
    rebuildMorphSlots(0);
    requestAnimationFrame(morphFloatLoop);
    let morphIdx = 1;
    setInterval(() => {
      morphToWord(morphIdx % MORPH_WORDS.length);
      morphIdx++;
    }, 6000);
  }));
}
 
function insertHeader() {
  const placeholder = getEl(PLACEHOLDER_SELECTOR);
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