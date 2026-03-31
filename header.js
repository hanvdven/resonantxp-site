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

const baseYs = [34, 52, 70, 88, 106];
const waveConfig = [
  { speed: 0.25, phase: 0.0, direction: 1 },
  { speed: 0.18, phase: 1.2, direction: -1 },
  { speed: 0.22, phase: 2.4, direction: 1 },
  { speed: 0.16, phase: 3.1, direction: -1 },
  { speed: 0.20, phase: 4.0, direction: 1 }
];

let paths = [];
let time = 0;

function pulse(x, t, cfg) {
  return Math.sin(x * PULSE_WAVELENGTH * cfg.direction + t * cfg.speed + cfg.phase) * PULSE_AMP;
}

function eventPulse(x, t, cfg) {
  // Stub for future event pulses.
  // This will be additive on top of the continuous pulse layer.
  // Example: return Math.sin(x * cfg.eventWavelength - t * cfg.eventSpeed + cfg.eventPhase) * cfg.eventAmp;
  return 0;
}

function buildPath(i, t) {
  let d = '';
  const cfg = waveConfig[i];

  for (let x = 0; x <= WIDTH; x += STEP) {
    const baseY = baseYs[i];
    const y = baseY + pulse(x, t, cfg) + eventPulse(x, t, cfg);
    d += x === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  return d;
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

  animate();
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
