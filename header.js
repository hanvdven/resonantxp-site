/*
 1. CORE DECISION
    We keep the SVG markup untouched.
    The header is a shared static anchor and the motion is a separate overlay layer.

 2. TWO-LAYER MOTION MODEL
    - Layer A: continuous breathing pulse wave
    - Layer B: episodic event pulses

 3. ANIMATION TYPES
    - base: the existing SVG path identity
    - pulse: slow, permanent, low-amplitude breathing
    - event: transient 4s motion bursts on top of the pulse layer
*/

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

const suffixWords = [ 'LORATION', 'ERIENCE','ANSION', 'RESSION','ERTISE','OSURE',];

let paths = [];
let originalDs = [];
let baselineSamples = [];
let baselineSvg = null;
let time = 0;
let eventStart = 0;
let eventTimeoutId = null;
let nextEventTimeoutId = null;
let suffixState = {
  index: 0,
  transitioning: false,
  intervalId: null,
  timeoutId: null
};
const state = {
  pulse: true,
  event: false,
  eventVariant: 'all',
  eventWaveIndex: null
};

function getElement(selector) {
  return document.querySelector(selector);
}

function getElements(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function pulse(x, t, cfg) {
  const amplitude =
    PULSE_AMP * (0.9 + 0.4 * Math.sin(t * 0.33 + cfg.phase * 0.5));

  return (
    Math.sin(x * PULSE_WAVELENGTH * cfg.direction + t * cfg.speed + cfg.phase) * amplitude
  );
}

function eventEnvelope(elapsed) {
  const ratio = Math.min(elapsed / EVENT_DURATION, 1);
  return Math.sin(ratio * Math.PI);
}

function eventPulse(x, t, cfg, index) {
  if (!state.event) return 0;
  if (state.eventVariant === 'single' && index !== state.eventWaveIndex) return 0;

  const elapsed = t - eventStart;
  if (elapsed >= EVENT_DURATION) {
    return 0;
  }

  const speed =
    state.eventVariant === 'single' && index === state.eventWaveIndex
      ? eventConfig.eventSpeed * 1.8
      : eventConfig.eventSpeed;

  const amplitude =
    state.eventVariant === 'single' && index === state.eventWaveIndex
      ? eventConfig.eventAmp * 1.3
      : eventConfig.eventAmp;

  return (
    Math.sin(
      x * eventConfig.eventWavelength * cfg.direction - t * speed + cfg.phase + eventConfig.eventPhase
    ) * amplitude * eventEnvelope(elapsed)
  );
}

function endEvent() {
  state.event = false;
  state.eventWaveIndex = null;
  scheduleNextEvent();
}

function scheduleNextEvent() {
  clearTimeout(nextEventTimeoutId);
  nextEventTimeoutId = setTimeout(triggerEvent, 8000 + Math.random() * 4000);
}

function triggerEvent() {
  eventStart = time;
  state.event = true;
  state.eventVariant = Math.random() < 0.5 ? 'all' : 'single';
  state.eventWaveIndex =
    state.eventVariant === 'single' ? Math.floor(Math.random() * paths.length) : null;

  clearTimeout(eventTimeoutId);
  eventTimeoutId = setTimeout(endEvent, EVENT_DURATION * 1000);
}

function getBaselineY(index, x) {
  const samples = baselineSamples[index];
  if (!samples?.length) {
    return baseYs[index];
  }

  let left = 0;
  let right = samples.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (samples[mid].x < x) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  if (left === 0) {
    return samples[0].y;
  }

  const prev = samples[left - 1];
  const next = samples[left];
  const range = next.x - prev.x;
  return range === 0 ? prev.y : prev.y + ((x - prev.x) / range) * (next.y - prev.y);
}

function buildPath(index, t) {
  if (!state.pulse && !state.event) {
    return originalDs[index] || '';
  }

  const cfg = waveConfig[index];
  const segments = [];

  for (let x = 0; x <= WIDTH; x += STEP) {
    const baseY = getBaselineY(index, x);
    const y = baseY + pulse(x, t, cfg) + eventPulse(x, t, cfg, index);
    segments.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  return segments.join(' ');
}

function buildContributionPath(index, t, includePulse, includeEvent) {
  const cfg = waveConfig[index];
  const segments = [];

  for (let x = 0; x <= WIDTH; x += STEP) {
    const baseY = getBaselineY(index, x);
    let y = baseY;
    if (includePulse) {
      y += pulse(x, t, cfg);
    }
    if (includeEvent) {
      y += eventPulse(x, t, cfg, index);
    }
    segments.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  return segments.join(' ');
}

function updateSuffix() {
  const suffix = getElement(SELECTORS.suffix);
  if (!suffix) return;

  suffix.textContent = suffixWords[suffixState.index];
  suffix.dataset.next = suffixWords[(suffixState.index + 1) % suffixWords.length];
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

function animate() {
  time += 0.016;

  paths.forEach((path, index) => {
    path.setAttribute('d', buildPath(index, time));
  });

  requestAnimationFrame(animate);
}

function samplePath(path) {
  const length = path.getTotalLength();
  const sampleCount = Math.ceil(WIDTH / STEP) * 2;

  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const point = path.getPointAtLength((index / sampleCount) * length);
    return { x: point.x, y: point.y };
  });
}

function createBaselineSampler() {
  if (baselineSvg) return;

  baselineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  baselineSvg.setAttribute('width', '0');
  baselineSvg.setAttribute('height', '0');
  baselineSvg.style.position = 'absolute';
  baselineSvg.style.width = '0';
  baselineSvg.style.height = '0';
  baselineSvg.style.overflow = 'hidden';
  baselineSvg.style.pointerEvents = 'none';
  baselineSvg.style.visibility = 'hidden';
  document.body.appendChild(baselineSvg);
}

function setupWaveAnimation() {
  paths = getElements(SELECTORS.wave);
  if (!paths.length) return;

  originalDs = paths.map((path) => path.getAttribute('d'));
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
  scheduleNextEvent();
  animate();
}

function attachLogoEvents() {
  const logoFrame = getElement('.logo-frame');
  if (!logoFrame) return;

  logoFrame.style.cursor = 'pointer';
  logoFrame.addEventListener('click', triggerEvent);
}

const HEADER_FALLBACK = `
<header class="site-header">
  <div class="container header-inner">
    <div class="brand-block">
      <div class="brand-visual">
        <div class="logo-frame">
          <svg class="logo-svg" viewBox="0 0 420 120" aria-hidden="true">
            <g class="waves">
              <path class="wave wave-1" d="M0 34 C35 22 70 46 105 34 S175 22 210 34 S280 22 315 34 S385 22 420 34" />
              <path class="wave wave-2" d="M0 52 C35 42 70 58 105 52 S175 42 210 52 S280 42 315 52 S385 42 420 52" />
              <path class="wave wave-3" d="M0 70 C35 60 70 80 105 70 S175 60 210 70 S280 60 315 70 S385 60 420 70" />
              <path class="wave wave-4" d="M0 88 C35 76 70 96 105 88 S175 76 210 88 S280 76 315 88 S385 76 420 88" />
              <path class="wave wave-5" d="M0 106 C35 92 70 112 105 106 S175 92 210 106 S280 92 315 106 S385 92 420 106" />
            </g>
            <g class="note-group">
              <circle class="note note-1" cx="78" cy="76" r="3" />
              <circle class="note note-2" cx="170" cy="68" r="3" />
              <circle class="note note-3" cx="260" cy="82" r="3" />
              <circle class="note note-4" cx="330" cy="60" r="3" />
            </g>
          </svg>
        </div>
        <div class="brand-name">RESONANT</div>
      </div>
      <div class="brand-energy">
        <div class="xp-logo" aria-label="E-XP wordmark">
          <span class="xp-prefix">E</span>
          <span class="xp-core">XP</span>
          <span class="xp-suffix enter">ERIENCE</span>
        </div>
      </div>
    </div>
    <nav class="nav-links">
      <a href="index.html">Home</a>
      <a href="experiences.html">Experiences</a>
      <a href="field-notes.html">Field Notes</a>
      <a href="xp-framework.html">Framework</a>
      <a href="contact.html">Contact</a>
    </nav>
  </div>
</header>
`;

function insertHeader() {
  const placeholder = getElement(PLACEHOLDER_SELECTOR);
  if (!placeholder) return;

  fetch(HEADER_PATH)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Header fetch failed: ${response.status}`);
      }
      return response.text();
    })
    .then((html) => {
      placeholder.innerHTML = html;
      setupWaveAnimation();
    })
    .catch((error) => {
      console.warn('Header load failed, using inline fallback:', error);
      placeholder.innerHTML = HEADER_FALLBACK;
      setupWaveAnimation();
    });
}

insertHeader();
