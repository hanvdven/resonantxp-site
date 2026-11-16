'use strict';
/* Heraldiek: kleuren, delingen, stukken en het tekenen van een wapenschild (SVG).
   Gedeeld door /feestje (wapenmaker), /feestje-tv (tussenstand) en /feestje-beheer. */
const TINCT = {
  or:      ['Goud',   '#c99a3a', 1],
  argent:  ['Zilver', '#efe8d8', 1],
  gules:   ['Rood',   '#a2302a', 0],
  azure:   ['Blauw',  '#3b5a87', 0],
  vert:    ['Groen',  '#4a6b3c', 0],
  sable:   ['Zwart',  '#2a2420', 0],
  purpure: ['Purper', '#6b4a78', 0],
};
const DIVS = { plain: 'Effen', pale: 'Gedeeld', fess: 'Doorsneden', bend: 'Geschuind', quarterly: 'Gevierendeeld', chevron: 'Keper' };
const CHARGES = { none: 'Geen', ster: 'Ster', kruis: 'Kruis', maan: 'Maan', zwaard: 'Zwaard', kroon: 'Kroon', roos: 'Roos', beker: 'Beker' };
const PLACES = ['Skalice', 'Rataje', 'Talmberk', 'Sázava', 'Úžice', 'Ledečko', 'Mrchojedy', 'Samopše', 'Kutná Hora', 'Pirkštejn', 'Sedlec', 'Zbořený Kostelec', 'Malešov', 'Rataje nad Sázavou'];
const SHIELD = 'M10,10 H190 V112 C190,176 142,212 100,234 C58,212 10,176 10,112 Z';

function chargeMarkup(ch, fill) {
  const st = `fill="${fill}" stroke="#2a1f16" stroke-width="2.5" stroke-linejoin="round"`;
  switch (ch) {
    case 'ster': {
      let p = '';
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 16 : 40, a = -Math.PI / 2 + i * Math.PI / 5; p += `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)} `; }
      return `<polygon points="${p}" ${st}/>`;
    }
    case 'kruis': return `<path d="M-11,-48 H11 V-11 H48 V11 H11 V48 H-11 V11 H-48 V-11 H-11 Z" ${st}/>`;
    case 'maan': return `<path d="M-36,-14 A38,38 0 1 0 36,-14 A40,40 0 0 1 -36,-14 Z" ${st}/>`;
    case 'zwaard': return `<g ${st}><path d="M-6,-54 L0,-64 L6,-54 V22 H-6 Z"/><rect x="-26" y="22" width="52" height="8" rx="2"/><rect x="-4" y="30" width="8" height="18"/><circle cy="54" r="7"/></g>`;
    case 'kroon': return `<g ${st}><path d="M-42,18 V-22 L-21,0 L0,-34 L21,0 L42,-22 V18 Z"/><rect x="-42" y="18" width="84" height="13"/><circle cx="-42" cy="-26" r="5"/><circle cx="0" cy="-38" r="5"/><circle cx="42" cy="-26" r="5"/></g>`;
    case 'roos': {
      let c = '';
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c += `<circle cx="${(22 * Math.cos(a)).toFixed(1)}" cy="${(22 * Math.sin(a)).toFixed(1)}" r="17"/>`; }
      return `<g ${st}>${c}</g><circle r="11" fill="#c99a3a" stroke="#2a1f16" stroke-width="2.5"/>`;
    }
    case 'beker': return `<path d="M-30,-44 H30 C30,-6 14,4 5,8 V30 H20 V42 H-20 V30 H-5 V8 C-14,4 -30,-6 -30,-44 Z" ${st}/>`;
    default: return '';
  }
}
// rough = met eigen "handgetekend"-filter (ook nodig in de losse PNG-export, waar #inky niet bestaat)
function shieldMarkup(s, uid, withBanner, title, rough) {
  const t1 = TINCT[s.t1][1], t2 = TINCT[s.t2][1], c = TINCT[s.c][1];
  const div = {
    plain: '',
    pale: `<rect x="100" y="0" width="100" height="240" fill="${t2}"/>`,
    fess: `<rect x="0" y="112" width="200" height="130" fill="${t2}"/>`,
    bend: `<polygon points="0,0 0,240 200,240 200,226" fill="${t2}"/>`,
    quarterly: `<rect x="100" y="0" width="100" height="112" fill="${t2}"/><rect x="0" y="112" width="100" height="130" fill="${t2}"/>`,
    chevron: `<polygon points="0,182 100,78 200,182 200,228 100,124 0,228" fill="${t2}"/>`,
  }[s.div];
  const fil = rough ? `filter="url(#rf-${uid})"` : '';
  let out = `<defs><clipPath id="cp-${uid}"><path d="${SHIELD}"/></clipPath>
    <linearGradient id="sh-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#3a2410" stop-opacity=".22"/></linearGradient>
    ${rough ? `<filter id="rf-${uid}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>` : ''}</defs>
    <g ${fil}><g clip-path="url(#cp-${uid})"><rect width="200" height="240" fill="${t1}"/>${div}
    <g transform="translate(100,112)">${chargeMarkup(s.ch, c)}</g>
    <rect width="200" height="240" fill="url(#sh-${uid})"/></g>
    <path d="${SHIELD}" fill="none" stroke="#2a1f16" stroke-width="5" stroke-linejoin="round"/></g>`;
  if (withBanner) {
    const size = title.length > 26 ? 10 : title.length > 20 ? 12 : 14;
    out += `<g ${fil}><path d="M4,254 H196 L186,268 L196,282 H4 L14,268 Z" fill="#f1e3c2" stroke="#2a1f16" stroke-width="2" stroke-linejoin="round"/></g>
      <text x="100" y="269" text-anchor="middle" dominant-baseline="central" font-family="Grenze, Georgia, serif" font-weight="700" font-size="${size}" fill="#2a1f16">${title.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))}</text>`;
  }
  return out;
}

