const HEADER_PATH = 'header.html';
const PLACEHOLDER_SELECTOR = '#site-header';
const SELECTORS = {
  wave: '.wave',
  suffix: '.xp-suffix'
};

const WIDTH = 420;
const STEP = 4;

const PULSE_AMP = 1.56;
const PULSE_WAVELENGTH = 0.06;

const EVENT_DURATION = 4.0;

const baseYs = [34, 52, 70, 88, 106];

const waveConfig = [
  { speed: 2.2, phase: 0.0, direction: 1 },
  { speed: 1.58, phase: 1.2, direction: -1 },
  { speed: 1.94, phase: 2.4, direction: 1 },
  { speed: 1.41, phase: 3.1, direction: -1 },
  { speed: 1.76, phase: 4.0, direction: 1 }
];

const eventConfig = {
  eventAmp: 6,
  eventWavelength: 0.06,
  eventSpeed: 4.05,
  eventPhase: 0.0
};

const suffixWords = ['LORATION', 'ERIENCE', 'ANSION', 'RESSION', 'ERTISE', 'OSURE'];

let paths = [];
let originalDs = [];
let baselineSamples = [];
let baselineSvg = null;

let time = 0;

// ===== EVENT SYSTEM =====
let activeEvents = [];
let clickLocked = false;

// ===== SUFFIX =====
let suffixState = {
  index: 0,
  transitioning: false,
  intervalId: null,
  timeoutId: null
};

// ===== HELPERS =====
function getElement(selector) {
  return document.querySelector(selector);
}

function getElements(selector) {
  return Array.from(document.querySelectorAll(selector));
}

// ===== BASE PULSE =====
function pulse(x, t, cfg) {
  const amplitude =
    PULSE_AMP * (0.9 + 0.4 * Math.sin(t * 0.33 + cfg.phase * 0.5));

  return Math.sin(x * PULSE_WAVELENGTH * cfg.direction + t * cfg.speed + cfg.phase) * amplitude;
}

// ===== SMOOTHSTEP =====
function smoothstep(x) {
  return x * x * (3 - 2 * x);
}

// ===== EVENT CREATION =====
function createEvent(waveCount) {
  const r = Math.random();

  let waveTargets;

  if (r < 0.65) {
    waveTargets = "all";
  } else if (r < 0.85) {
    waveTargets = "two";
  } else {
    waveTargets = "one";
  }

  let pickedWave = null;

  if (waveTargets === "one") {
    pickedWave = Math.floor(Math.random() * waveCount);
  }

  // --- amplitude scaling ---
  let ampScale;
  if (waveTargets === "two") ampScale = 1.3;
  else if (waveTargets === "one") ampScale = 1.5;
  else ampScale = 1.0;

  // --- frequency regime ---
  const highSpeedMode = Math.random() < 0.1;

  const speedBase = highSpeedMode ? 1.5 : 1.0;
  const ampBase = highSpeedMode ? 0.8 : 1.0;

  // --- per-wave randomness ---
  const directionMap = [];
  const speedMap = [];
  const ampMap = [];

  for (let i = 0; i < waveCount; i++) {
    // direction: -1 or +1
    directionMap[i] = Math.random() < 0.5 ? -1 : 1;

    // speed scaling 50% - 150%
    speedMap[i] = speedBase * (0.7 + 0.7 * Math.random());

    // amplitude scaling 50% - 150%
    ampMap[i] = ampBase * (0.7 + 0.7 * Math.random());
  }

  return {
    start: time,
    duration: 1.5,
    waveTargets,
    _pickedWave: pickedWave,
    ampScale,
    speedBase,
    directionMap,
    speedMap,
    ampMap
  };
}

// ===== AMPLITUDE ENVELOPE =====
function eventAmplitudeEnvelope(event) {
  const t = time - event.start;

  const inPhase = Math.min(t / 1.0, 1);
  const outPhase = Math.min((event.duration - t) / 1.0, 1);

  return smoothstep(Math.min(inPhase, outPhase));
}

// ===== EVENT PULSE (MULTI EVENT ADDITIVE SYSTEM) =====
function eventPulse(x, t, cfg, index) {
  let sum = 0;


  for (const event of activeEvents) {
    const elapsed = time - event.start;
    if (elapsed < 0 || elapsed > event.duration) continue;

    // --- wave selection logic ---
    if (event.waveTargets === "one" && index !== event._pickedWave) continue;
    if (event.waveTargets === "two" && index > 1) continue;

    const ampEnv = eventAmplitudeEnvelope(event);

    // --- direction per wave ---
    const speed = event.speedMap[index] ?? eventConfig.eventSpeed;
    const amp = event.ampMap[index] ?? 1;
    const dir = event.directionMap[index] ?? 1;

    const finalAmp =
      amp *
      event.ampScale *
      ampEnv;

    sum += Math.sin(
      x * eventConfig.eventWavelength * dir -
      t * speed +
      cfg.phase +
      eventConfig.eventPhase
    ) * finalAmp;
  }

  return sum;
}

// ===== EVENT TRIGGER =====
function triggerEvent() {
  if (clickLocked) return;

  clickLocked = true;
  setTimeout(() => (clickLocked = false), 500);

  const event = createEvent(paths.length);

  activeEvents.push(event);

  if (activeEvents.length > 3) {
    activeEvents.shift();
  }
}

// ===== BASELINE =====
function getBaselineY(index, x) {
  const samples = baselineSamples[index];
  if (!samples?.length) return baseYs[index];

  let left = 0;
  let right = samples.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (samples[mid].x < x) left = mid + 1;
    else right = mid;
  }

  if (left === 0) return samples[0].y;

  const prev = samples[left - 1];
  const next = samples[left];
  const range = next.x - prev.x;

  return range === 0
    ? prev.y
    : prev.y + ((x - prev.x) / range) * (next.y - prev.y);
}

// ===== PATH =====
function buildPath(index, t) {
  const cfg = waveConfig[index];
  const segments = [];

  for (let x = 0; x <= WIDTH; x += STEP) {
    const baseY = getBaselineY(index, x);

    const y =
      baseY +
      pulse(x, t, cfg) +
      eventPulse(x, t, cfg, index);

    segments.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  return segments.join(' ');
}

// ===== ANIMATION LOOP =====
function animate() {
  time += 0.016;

  activeEvents = activeEvents.filter(
    (e) => time - e.start < e.duration
  );

  paths.forEach((path, index) => {
    path.setAttribute('d', buildPath(index, time));
  });

  requestAnimationFrame(animate);
}

// ===== SAMPLING =====
function samplePath(path) {
  const length = path.getTotalLength();
  const sampleCount = Math.ceil(WIDTH / STEP) * 2;

  return Array.from({ length: sampleCount + 1 }, (_, i) => {
    const p = path.getPointAtLength((i / sampleCount) * length);
    return { x: p.x, y: p.y };
  });
}

function createBaselineSampler() {
  if (baselineSvg) return;

  baselineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  baselineSvg.style.width = '0';
  baselineSvg.style.height = '0';
  baselineSvg.style.position = 'absolute';
  baselineSvg.style.visibility = 'hidden';
  document.body.appendChild(baselineSvg);
}

// ===== SUFFIX =====
function updateSuffix() {
  const suffix = getElement(SELECTORS.suffix);
  if (!suffix) return;

  suffix.textContent = suffixWords[suffixState.index];
  suffix.dataset.next =
    suffixWords[(suffixState.index + 1) % suffixWords.length];

  suffix.classList.toggle('enter', !suffixState.transitioning);
  suffix.classList.toggle('exit', suffixState.transitioning);
}

function cycleSuffix() {
  const suffix = getElement(SELECTORS.suffix);
  if (!suffix) return;

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

// ===== INIT =====
function attachLogoEvents() {
  const logoFrame = getElement('.logo-frame');
  if (!logoFrame) return;

  logoFrame.style.cursor = 'pointer';
  logoFrame.addEventListener('click', triggerEvent);
}

function setupWaveAnimation() {
  paths = getElements(SELECTORS.wave);
  if (!paths.length) return;

  originalDs = paths.map((p) => p.getAttribute('d'));

  createBaselineSampler();

  baselineSamples = paths.map((path) => {
    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clone.setAttribute('d', path.getAttribute('d'));
    baselineSvg.appendChild(clone);

    const samples = samplePath(clone);

    baselineSvg.removeChild(clone);
    return samples;
  });

  setupSuffixCycle();
  attachLogoEvents();
  animate();
}

// ===== HEADER =====
function insertHeader() {
  const placeholder = getElement(PLACEHOLDER_SELECTOR);
  if (!placeholder) return;

  fetch(HEADER_PATH)
    .then((r) => r.text())
    .then((html) => {
      placeholder.innerHTML = html;
      setupWaveAnimation();
    })
    .catch(() => console.warn('Header load failed'));
}

insertHeader();