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

const suffixWords = ['LORATION', 'ERIENCE', 'ANSION', 'RESSION', 'ERTISE', 'OSURE'];

let paths = [], baselineSamples = [], baselineSvg = null, time = 0;
let activeEvents = [], clickLocked = false;
let suffixState = { index: 0, transitioning: false, intervalId: null, timeoutId: null };

function getElement(sel) { return document.querySelector(sel); }
function getElements(sel) { return Array.from(document.querySelectorAll(sel)); }
function smoothstep(x) { return x * x * (3 - 2 * x); }
function randRange(a, b) { return a + Math.random() * (b - a); }

function pulse(x, t, cfg) {
  const amp = PULSE_AMP * (0.9 + 0.4 * Math.sin(t * 0.33 + cfg.phase * 0.5));
  return Math.sin(x * PULSE_WAVELENGTH * cfg.direction + t * cfg.speed + cfg.phase) * amp;
}

function eventEnvelope(ev) {
  const t = time - ev.start;
  const dur = ev.forcedEndAt !== null ? ev.forcedEndAt - ev.start : ev.duration;
  return smoothstep(Math.min(Math.min(t / FADE_IN, 1), Math.min((dur - t) / FADE_OUT, 1)));
}

function globalDamping() {
  if (!activeEvents.length) return 1.0;
  let m = 0;
  for (const ev of activeEvents) { const e = eventEnvelope(ev); if (e > m) m = e; }
  return 1.0 - m * 0.2;
}

function createEvent(waveCount, forceHigh = false) {
  const r = Math.random();
  const waveTargets = r < 0.65 ? 'all' : r < 0.85 ? 'two' : 'one';
  const pickedWave  = waveTargets === 'one' ? Math.floor(Math.random() * waveCount) : null;
  const ampScale    = waveTargets === 'two' ? 1.3 : waveTargets === 'one' ? 1.5 : 1.0;
  const highSpeedMode = forceHigh || Math.random() < 0.15;
  const speedBase   = highSpeedMode ? BASE_SPEED * HIGH_SPEED_MULT : BASE_SPEED;
  const ampBase     = highSpeedMode ? HIGH_AMP_MULT : BASE_AMP;
  const duration    = highSpeedMode ? DURATION_HIGH : randRange(DURATION_NORM_MIN, DURATION_NORM_MAX);
  const directionMap = [], speedMap = [], ampMap = [];
  for (let i = 0; i < waveCount; i++) {
    directionMap[i] = Math.random() < 0.5 ? -1 : 1;
    speedMap[i]     = speedBase * (0.7 + 0.7 * Math.random());
    ampMap[i]       = ampBase   * (0.7 + 0.7 * Math.random());
  }
  return { start: time, duration, forcedEndAt: null, waveTargets, _pickedWave: pickedWave,
    ampScale, highSpeedMode, directionMap, speedMap, ampMap };
}

function forceEndActiveEvents() {
  for (const ev of activeEvents) {
    const elapsed = time - ev.start;
    const dur = ev.forcedEndAt !== null ? ev.forcedEndAt - ev.start : ev.duration;
    if (elapsed < dur - FADE_OUT && ev.forcedEndAt === null) ev.forcedEndAt = time + FADE_OUT;
  }
}

function isEventDone(ev) {
  return ev.forcedEndAt !== null ? time > ev.forcedEndAt : time - ev.start > ev.duration;
}

function singleEventPulse(x, t, cfg, idx, ev) {
  const elapsed = time - ev.start;
  const endTime = ev.forcedEndAt ?? (ev.start + ev.duration);
  if (elapsed < 0 || time > endTime) return 0;
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

function triggerEvent(auto = false) {
  if (!auto && clickLocked) return;
  if (!auto) { clickLocked = true; setTimeout(() => clickLocked = false, 500); }
  forceEndActiveEvents();
  activeEvents.push(createEvent(paths.length));
}

function scheduleNext() {
  setTimeout(() => { triggerEvent(true); scheduleNext(); }, randRange(AUTO_MIN, AUTO_MAX) * 1000);
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

function buildPath(index, t) {
  const cfg = waveConfig[index], segs = [], damp = globalDamping();
  for (let x = 0; x <= WIDTH; x += STEP) {
    const y = getBaselineY(index, x) + pulse(x, t, cfg) * damp + allEventsPulse(x, t, cfg, index);
    segs.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  return segs.join(' ');
}

function animate() {
  time += 0.016;
  activeEvents = activeEvents.filter(ev => !isEventDone(ev));
  paths.forEach((path, i) => path.setAttribute('d', buildPath(i, time)));
  requestAnimationFrame(animate);
}

function samplePath(path) {
  const length = path.getTotalLength(), sc = Math.ceil(WIDTH / STEP) * 2;
  return Array.from({length: sc+1}, (_, i) => {
    const p = path.getPointAtLength(i / sc * length); return { x: p.x, y: p.y };
  });
}

function createBaselineSampler() {
  if (baselineSvg) return;
  baselineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  baselineSvg.style.cssText = 'width:0;height:0;position:absolute;visibility:hidden';
  document.body.appendChild(baselineSvg);
}

function updateSuffix() {
  const suffix = getElement(SELECTORS.suffix);
  if (!suffix) return;
  suffix.textContent = suffixWords[suffixState.index];
  suffix.classList.toggle('enter', !suffixState.transitioning);
  suffix.classList.toggle('exit',   suffixState.transitioning);
}

function cycleSuffix() {
  suffixState.transitioning = true;
  updateSuffix();
  clearTimeout(suffixState.timeoutId);
  suffixState.timeoutId = setTimeout(() => {
    suffixState.index = (suffixState.index + 1) % suffixWords.length;
    suffixState.transitioning = false;
    updateSuffix();
  }, 400);
}

function setupSuffixCycle() {
  updateSuffix();
  suffixState.intervalId = setInterval(cycleSuffix, 3000);
}

function attachLogoEvents() {
  const logoFrame = getElement('.logo-frame');
  if (!logoFrame) return;
  logoFrame.style.cursor = 'pointer';
  logoFrame.addEventListener('click', () => triggerEvent(false));
}

function setupWaveAnimation() {
  paths = getElements(SELECTORS.wave);
  if (!paths.length) return;
  createBaselineSampler();
  baselineSamples = paths.map(path => {
    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clone.setAttribute('d', path.getAttribute('d'));
    baselineSvg.appendChild(clone);
    const samples = samplePath(clone);
    baselineSvg.removeChild(clone);
    return samples;
  });
  setupSuffixCycle();
  attachLogoEvents();
  setTimeout(() => { triggerEvent(true); scheduleNext(); }, 2000);
  animate();
}

function insertHeader() {
  const placeholder = getElement(PLACEHOLDER_SELECTOR);
  if (!placeholder) return;
  fetch(HEADER_PATH)
    .then(r => r.text())
    .then(html => { placeholder.innerHTML = html; setupWaveAnimation(); })
    .catch(() => console.warn('Header load failed'));
}

insertHeader();