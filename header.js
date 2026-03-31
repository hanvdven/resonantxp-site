/*
 1. CORE DECISION
    We keep the SVG markup untouched.
    The header is a shared static anchor and the motion is a separate overlay layer.

 2. TWO-LAYER MOTION MODEL
    - Layer A: continuous breathing pulse wave (this implementation)
    - Layer B: episodic event pulses (later, additive)

 3. ANIMATION TYPES
    - base: the existing SVG path identity
    - pulse: slow, permanent, low-amplitude breathing
    - event: transient 1-2s motion bursts on top of the pulse layer
*/

const HEADER_PATH = 'header.html';
const WIDTH = 420;
const STEP = 4;
const PULSE_AMP = 1.3; // half the current breathing amplitude
const PULSE_WAVELENGTH = 0.06;
const EVENT_DURATION = 2.0;

const baseYs = [34, 52, 70, 88, 106];
const waveConfig = [
  { speed: 0.75, phase: 0.0, direction: 1 },
  { speed: 0.54, phase: 1.2, direction: -1 },
  { speed: 0.66, phase: 2.4, direction: 1 },
  { speed: 0.48, phase: 3.1, direction: -1 },
  { speed: 0.60, phase: 4.0, direction: 1 }
];

const eventConfig = {
  eventAmp: 6,
  eventWavelength: 0.08,
  eventSpeed: 3.6,
  eventPhase: 0.0
};

let paths = [];
let originalDs = [];
let time = 0;
const state = {
  base: true,
  pulse: true,
  event: false
};
const suffixWords = ['EXPERIENCE', 'EXPLORE', 'EXPAND', 'EXPERTISE'];
const suffixState = {
  index: 0,
  transitioning: false,
  intervalId: null,
  transitionTimeout: null
};
let eventStart = 0;
let currentMode = 'pulse';

function pulse(x, t, cfg) {
  if (!state.pulse) return 0;
  return Math.sin(x * PULSE_WAVELENGTH * cfg.direction + t * cfg.speed + cfg.phase) * PULSE_AMP;
}

function eventEnvelope(elapsed) {
  const ratio = Math.min(elapsed / EVENT_DURATION, 1);
  return Math.sin(ratio * Math.PI);
}

function eventPulse(x, t) {
  if (!state.event) return 0;
  const elapsed = t - eventStart;
  if (elapsed >= EVENT_DURATION) {
    state.event = false;
    return 0;
  }

  const envelope = eventEnvelope(elapsed);
  return (
    Math.sin(x * eventConfig.eventWavelength - t * eventConfig.eventSpeed + eventConfig.eventPhase) *
    eventConfig.eventAmp *
    envelope
  );
}

function eventWeight(elapsed) {
  const ratio = Math.min(elapsed / EVENT_DURATION, 1);
  return ratio * ratio * (3 - 2 * ratio);
}

function buildPath(i, t) {
  if (!state.pulse && !state.event) {
    return originalDs[i] || '';
  }

  let d = '';
  const cfg = waveConfig[i];
  const elapsed = t - eventStart;
  const weight = state.event ? eventWeight(elapsed) : 0;

  for (let x = 0; x <= WIDTH; x += STEP) {
    const baseY = baseYs[i];
    const y = baseY + pulse(x, t, cfg) * (1 - weight) + eventPulse(x, t);
    d += x === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  return d;
}

function updateSuffix() {
  const suffix = document.querySelector('.xp-suffix');
  if (!suffix) return;

  suffix.textContent = suffixWords[suffixState.index];
  suffix.classList.toggle('enter', !suffixState.transitioning);
  suffix.classList.toggle('exit', suffixState.transitioning);
}

function cycleSuffix() {
  suffixState.transitioning = true;
  updateSuffix();

  clearTimeout(suffixState.transitionTimeout);
  suffixState.transitionTimeout = setTimeout(() => {
    suffixState.index = (suffixState.index + 1) % suffixWords.length;
    suffixState.transitioning = false;
    updateSuffix();
  }, 400);
}

function setupSuffixCycle() {
  updateSuffix();
  suffixState.intervalId = setInterval(cycleSuffix, 3000);
}

function updateControlUI() {
  const typeButtons = document.querySelectorAll('.control-type');
  typeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.type === currentMode);
  });

  const toggle = document.querySelector('.control-toggle');
  if (toggle) {
    toggle.textContent = state.pulse ? 'Pause Pulse' : 'Play Pulse';
  }
}

function setMode(mode) {
  currentMode = mode;
  state.base = true;
  state.pulse = mode === 'pulse' || mode === 'event';
  state.event = mode === 'event';
  updateControlUI();
}

function triggerEvent() {
  state.event = true;
  eventStart = time;
  setMode('event');
}

function togglePulse() {
  state.pulse = !state.pulse;
  if (!state.pulse) {
    state.event = false;
    currentMode = 'base';
  } else if (state.event) {
    currentMode = 'event';
  } else {
    currentMode = 'pulse';
  }
  updateControlUI();
}

function animate() {
  time += 0.016;

  paths.forEach((p, i) => {
    p.setAttribute('d', buildPath(i, time));
  });

  requestAnimationFrame(animate);
}

function setupWaveAnimation() {
  paths = Array.from(document.querySelectorAll('.wave'));
  if (!paths.length) return;

  originalDs = paths.map((p) => p.getAttribute('d'));
  setupControls();
  setupSuffixCycle();
  animate();
}

function setupControls() {
  const typeButtons = document.querySelectorAll('.control-type');
  typeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.type;
      if (type === 'event') {
        triggerEvent();
      } else {
        setMode(type);
      }
    });
  });

  const toggle = document.querySelector('.control-toggle');
  if (toggle) {
    toggle.addEventListener('click', togglePulse);
  }

  updateControlUI();
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
        <div class="xp-logo" aria-label="XP with suffix">
          <span class="xp-core">XP</span>
          <span class="xp-suffix enter">EXPERIENCE</span>
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
    <div class="header-controls">
      <div class="header-control-group">
        <button class="control-btn control-type active" data-type="pulse" type="button">Pulse</button>
        <button class="control-btn control-type" data-type="base" type="button">Base</button>
        <button class="control-btn control-type" data-type="event" type="button">Event</button>
      </div>
      <button class="control-btn control-toggle" data-action="togglePulse" type="button">Pause Pulse</button>
    </div>
  </div>
</header>
`;

function insertHeader() {
  const placeholder = document.querySelector('#site-header');
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
