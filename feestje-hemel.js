'use strict';
/* Kleuren, zon en maan (eenvoudige astronomie, nauwkeurig op ~1 minuut) en de hemelkleur.
   Gedeeld door /feestje en /feestje-tv. Gebruikt CONFIG.lat/lon uit feestje-config.js. */
/* ---------- kleuren ---------- */
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => v + (hex2rgb(b)[i] - v) * t));

/* =========================================================
   ZON & MAAN — eenvoudige astronomie (nauwkeurig op ~1 minuut)
   ========================================================= */
function sunElevation(date, lat = CONFIG.lat, lon = CONFIG.lon) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 864e5 - 10957.5;            // dagen sinds J2000.0
  const g = (357.529 + 0.98560028 * d) * rad;            // middelbare anomalie
  const q = 280.459 + 0.98564736 * d;                    // middelbare lengte
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;             // scheefstand ecliptica
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const ha = (gmst * 15 + lon) * rad - ra;               // uurhoek
  const la = lat * rad;
  return Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha)) / rad;
}
const dayStart = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const atHours = (day, h) => new Date(dayStart(day).getTime() + h * 3600e3);
const localHours = d => d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
// afronden naar beneden (een klok springt pas op de volle minuut); +1e-6 tegen afrondingsfouten (16.5 * 60)
const fmtH = h => { h = ((h % 24) + 24) % 24; const m = Math.floor(h * 60 + 1e-6) % 1440, p = n => String(n).padStart(2, '0'); return p(Math.floor(m / 60)) + ':' + p(m % 60); };

function sunTimes(day) { // per minuut zoeken waar de zon door de horizon gaat (-0,833° = met lichtbreking)
  let rise = null, set = null, prev = sunElevation(atHours(day, 0));
  for (let m = 1; m <= 1440; m++) {
    const el = sunElevation(atHours(day, m / 60));
    if (prev < -0.833 && el >= -0.833) rise = m / 60;
    if (prev >= -0.833 && el < -0.833) set = m / 60;
    prev = el;
  }
  return { rise, set };
}
const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const moonPhase = date => ((((date - NEW_MOON) / 864e5) % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC; // 0 nieuw, .5 vol

/* hemelkleur bij een zonshoogte: [boven, horizon] — iets gedempt, filmisch */
const SKY = [
  [-18, '#05070f', '#0b0f1e'],
  [-12, '#070a18', '#131a30'],
  [-7,  '#0e1430', '#272a4e'],
  [-3,  '#1b2448', '#5a3a52'],
  [0,   '#28375f', '#a85a3a'],
  [3,   '#32507c', '#c98a4e'],
  [8,   '#3a5e86', '#9fb3be'],
  [25,  '#3b6390', '#a3b9c4'],
  [90,  '#355d8a', '#9ab2c0'],
];
function skyAt(el) {
  if (el <= SKY[0][0]) return [SKY[0][1], SKY[0][2]];
  for (let i = 1; i < SKY.length; i++) {
    if (el <= SKY[i][0]) {
      const [e0, t0, b0] = SKY[i - 1], [e1, t1, b1] = SKY[i];
      const t = (el - e0) / (e1 - e0);
      return [mix(t0, t1, t), mix(b0, b1, t)];
    }
  }
  return [SKY.at(-1)[1], SKY.at(-1)[2]];
}
