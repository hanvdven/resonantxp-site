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
const MEER_STUKKEN = { lelie: 'Lelie', toren: 'Toren', sleutel: 'Sleutel', hart: 'Hart', ruit: 'Ruit', bol: 'Bezant', pijl: 'Pijl' };
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
    // meer stukken (voor de wapenkunde op het tv-scherm; niet in de wapenmaker, zie MEER_STUKKEN)
    case 'lelie': return `<g ${st}><path d="M0,-52 C15,-32 15,-10 0,8 C-15,-10 -15,-32 0,-52 Z"/><path d="M-6,2 C-30,-6 -46,-26 -34,-42 C-22,-50 -14,-36 -13,-24 C-11,-12 -8,-4 -6,2 Z"/><path d="M6,2 C30,-6 46,-26 34,-42 C22,-50 14,-36 13,-24 C11,-12 8,-4 6,2 Z"/><path d="M-4,14 C-10,30 -22,40 -32,46 C-16,48 -6,42 0,32 C6,42 16,48 32,46 C22,40 10,30 4,14 Z"/><rect x="-26" y="4" width="52" height="10" rx="2"/></g>`;
    case 'toren': return `<g ${st}><path d="M-30,48 V-26 H-36 V-48 H-22 V-38 H-7 V-48 H7 V-38 H22 V-48 H36 V-26 H30 V48 Z"/><path d="M-10,48 V26 A10,10 0 0 1 10,26 V48 Z" fill="#2a1f16"/><rect x="-5" y="-14" width="10" height="16" rx="5" fill="#2a1f16"/></g>`;
    case 'sleutel': return `<g ${st}><path fill-rule="evenodd" d="M-17,-32 a17,17 0 1,0 34,0 a17,17 0 1,0 -34,0 Z M-8,-32 a8,8 0 1,1 16,0 a8,8 0 1,1 -16,0 Z"/><path d="M-5,-15 H5 V48 H-5 Z M5,26 H22 V34 H5 Z M5,39 H17 V47 H5 Z"/></g>`;
    case 'hart': return `<path d="M0,42 C-52,6 -42,-38 -16,-38 C-6,-38 0,-30 0,-22 C0,-30 6,-38 16,-38 C42,-38 52,6 0,42 Z" ${st}/>`;
    case 'ruit': return `<path d="M0,-50 L32,0 L0,50 L-32,0 Z" ${st}/>`;
    case 'bol': return `<circle r="32" ${st}/>`;
    case 'pijl': return `<g ${st}><path d="M-4,-28 H4 V40 H-4 Z"/><path d="M0,-54 L13,-26 H-13 Z"/><path d="M-4,30 L-15,48 V36 L-4,20 Z M4,30 L15,48 V36 L4,20 Z"/></g>`;
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

