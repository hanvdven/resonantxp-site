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
const PULSE_AMP = 1.8; // ~10% of the visual wave amplitude
const PULSE_WAVELENGTH = 0.06;
const EVENT_DURATION = 2.0;

const baseYs = [34, 52, 70, 88, 106];
const waveConfig = [
  { speed: 0.25, phase: 0.0, direction: 1 },
  { speed: 0.18, phase: 1.2, direction: -1 },
  { speed: 0.22, phase: 2.4, direction: 1 },
  { speed: 0.16, phase: 3.1, direction: -1 },
  { speed: 0.20, phase: 4.0, direction: 1 }
];

const eventConfig = {
  eventAmp: 6,
  eventWavelength: 0.08,
  eventSpeed: 1.2,
  eventPhase: 0.0
};

let paths = [];
let time = 0;
const state = {
  base: true,
  pulse: true,
  event: false
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

  setupControls();
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

function insertHeader() {
  const placeholder = document.querySelector('#site-header');
  if (!placeholder) return;

  fetch(HEADER_PATH)
    .then((response) => response.text())
    .then((html) => {
      placeholder.innerHTML = html;
      setupWaveAnimation();
    })
    .catch((error) => {
      console.error('Header load failed:', error);
    });
}

insertHeader();
