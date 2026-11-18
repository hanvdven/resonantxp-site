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
const MEER_STUKKEN = { lelie: 'Lelie', toren: 'Toren', sleutel: 'Sleutel', hart: 'Hart', ruit: 'Ruit', bol: 'Bezant', pijl: 'Pijl', leeuw: 'Leeuw', adelaar: 'Adelaar', dubbeladelaar: 'Dubbele adelaar', michiel: 'Sint-Michiel', iris: 'Iris' };
const ALLE_STUKKEN = { ...CHARGES, ...MEER_STUKKEN };   // voor het beheer en het tv-scherm (de wapenmaker op /feestje houdt het bij CHARGES)
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
    // de leeuw, klimmend (rechtop, naar links gewend), getekend als ledematen met een donkere omlijning
    case 'leeuw': {
      const ink = '#2a1f16', rood = '#b8402e';
      const lijn = (d, w) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w + 3.5}" stroke-linecap="round" stroke-linejoin="round"/>`;
      const verf = (d, w) => `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
      const poten = [['M-6,-12 L-22,-16 L-30,-30', 7], ['M-4,-4 L-20,2 L-32,-6', 7], ['M8,16 L10,32 L20,44', 8], ['M4,18 L-8,28 L-20,26', 8]];
      const staart = 'M12,18 C30,16 36,-4 28,-20 C25,-26 28,-32 33,-30';
      const klauw = (x, y) => `<path d="M${x},${y} l-5,-3 M${x},${y} l-6,1 M${x},${y} l-3,-6" stroke="${rood}" stroke-width="1.8" stroke-linecap="round"/>`;
      let manen = ''; for (let i = 0; i < 14; i++) { const a = i / 14 * 2 * Math.PI, r = i % 2 ? 11 : 17; manen += `${(-12 + r * Math.cos(a)).toFixed(1)},${(-22 + r * Math.sin(a)).toFixed(1)} `; }
      const romp = '<ellipse cx="3" cy="4" rx="11" ry="21" transform="rotate(-24 3 4)"/>';
      return `<g transform="scale(1.05)">${poten.map(([d, w]) => lijn(d, w)).join('')}${lijn(staart, 4)}
        <g fill="${ink}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round">${romp}<polygon points="${manen}"/></g>
        ${poten.map(([d, w]) => verf(d, w)).join('')}${verf(staart, 4)}<circle cx="34" cy="-31" r="5" fill="${fill}" stroke="${ink}" stroke-width="1.8"/>
        <g fill="${fill}">${romp}<polygon points="${manen}"/></g>
        <path d="M-20,-30 C-30,-30 -36,-26 -34,-20 L-24,-20 L-30,-16 L-20,-14 Z" fill="${fill}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M-33,-19 L-42,-17 L-35,-14 Z" fill="${rood}"/><circle cx="-21" cy="-25" r="1.8" fill="${ink}"/>
        ${klauw(-30, -30)}${klauw(-32, -6)}${klauw(20, 44)}${klauw(-20, 26)}</g>`;
    }
    // de adelaar; dubbel = met twee koppen (keizerlijk)
    case 'adelaar': case 'dubbeladelaar': {
      const ink = '#2a1f16';
      const vleugel = 'M-6,-14 C-18,-26 -38,-32 -52,-28 L-46,-21 L-54,-15 L-46,-11 L-52,-3 L-42,-1 L-46,7 L-32,5 C-20,3 -12,0 -6,-2 Z';
      const kop = (sx) => `<g transform="scale(${sx},1)"><path d="M-3,-18 C-6,-26 -10,-31 -14,-34" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M-3,-18 C-6,-26 -10,-31 -14,-34" fill="none" stroke="${fill}" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="-16" cy="-37" r="7" fill="${fill}" stroke="${ink}" stroke-width="2"/><path d="M-22,-39 L-31,-36 L-22,-33 Z" fill="#c99a3a" stroke="${ink}" stroke-width="1.5"/>
        <path d="M-24,-34 l-4,3" stroke="#b8402e" stroke-width="2"/><circle cx="-17" cy="-39" r="1.6" fill="#f1e6cf"/></g>`;
      return `<g ${st}><path d="${vleugel}"/><path d="${vleugel}" transform="scale(-1,1)"/></g>
        ${ch === 'dubbeladelaar' ? kop(1) + kop(-1) : `<g transform="translate(14,0)">${kop(1)}</g>`}
        <g ${st}><ellipse cx="0" cy="2" rx="10" ry="22"/><path d="M-8,20 L-16,42 L-4,36 L0,44 L4,36 L16,42 L8,20 Z"/></g>
        <path d="M-6,16 L-16,28 l-4,0 M-16,28 l-2,4 M6,16 L16,28 l4,0 M16,28 l2,4" fill="none" stroke="#c99a3a" stroke-width="3" stroke-linecap="round"/>`;
    }
    // Sint-Michiel die de duivel verslaat (Brussel)
    case 'michiel': return `<g stroke="#2a1f16" stroke-width="2" stroke-linejoin="round">
      <path fill="${fill}" d="M-8,-22 C-24,-30 -42,-24 -50,-8 C-40,-12 -30,-10 -24,-6 C-34,-4 -40,4 -44,12 C-30,4 -18,-2 -8,-6 Z"/>
      <path fill="${fill}" d="M8,-22 C24,-30 42,-24 50,-8 C40,-12 30,-10 24,-6 C34,-4 40,4 44,12 C30,4 18,-2 8,-6 Z"/>
      <path fill="#1c1814" d="M-42,40 C-34,30 -20,30 -10,34 C0,38 12,36 22,30 C28,24 34,22 40,26 L44,20 L46,30 C44,40 34,46 20,46 L-30,48 C-38,48 -44,46 -42,40 Z"/>
      <path fill="${fill}" d="M-10,-24 L10,-24 L12,4 L8,8 L6,32 L-2,32 L-1,10 L-4,32 L-10,32 L-8,8 L-12,4 Z"/>
      <circle fill="${fill}" cx="0" cy="-32" r="7"/><ellipse fill="${fill}" cx="12" cy="-4" rx="9" ry="12"/>
      <path d="M-14,-56 L8,40" stroke="${fill}" stroke-width="3.5"/><path d="M-20,-52 L-8,-56 M-15,-61 L-13,-50" stroke="${fill}" stroke-width="3"/></g>`;
    // de iris van het Brussels Hoofdstedelijk Gewest (wit omrand)
    case 'iris': {
      const d = 'M-2,-8 C-14,-32 -30,-66 -24,-84 C-18,-90 -10,-82 -6,-68 C-2,-52 0,-28 -2,-8 Z M2,-8 C0,-36 4,-72 16,-86 C24,-92 30,-82 26,-66 C22,-46 12,-24 2,-8 Z M6,-6 C18,-28 34,-58 46,-66 C54,-70 58,-60 50,-48 C38,-30 22,-16 6,-6 Z M0,-4 C-20,-16 -50,-20 -70,-8 C-82,0 -78,14 -66,12 C-50,8 -30,0 -2,4 Z M10,-2 C36,-14 64,-16 82,-6 C92,2 86,14 74,10 C56,4 34,2 12,8 Z M4,4 C-6,28 -14,54 -8,78 C-4,88 6,84 4,74 C0,56 8,34 20,20 C28,12 40,12 42,22 C44,32 34,34 32,28 C38,40 52,34 50,20 C46,4 22,0 4,4 Z';
      return `<g transform="translate(0,4) scale(.56)"><path d="${d}" fill="#fff" stroke="#fff" stroke-width="12" stroke-linejoin="round"/><path d="${d}" fill="${fill}"/></g>`;
    }
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

