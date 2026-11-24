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
const MEER_STUKKEN = { poes: 'Benji, de slapende poes', kattenoog: 'Kattenoog', solsleutel: 'Solsleutel', zon: 'Zon', schelp: 'Jakobsschelp', hoorn: 'Jachthoorn', boom: 'Boom', lelie: 'Lelie', toren: 'Toren', sleutel: 'Sleutel', hart: 'Hart', ruit: 'Ruit', bol: 'Bezant', pijl: 'Pijl', leeuw: 'Leeuw', adelaar: 'Adelaar', dubbeladelaar: 'Dubbele adelaar', michiel: 'Sint-Michiel', iris: 'Iris' };
const ALLE_STUKKEN = { ...CHARGES, ...MEER_STUKKEN };   // alle stukken: de wapenmaker op /feestje, het beheer en het tv-scherm
const SHIELD = 'M10,10 H190 V112 C190,176 142,212 100,234 C58,212 10,176 10,112 Z';
// de riddernaam: titel + voornaam + "van" + geboortestad, bv. "Jonker Han van Leuven" (beheer én uitnodiging)
const TITELS = ['Heer', 'Vrouwe', 'Ridder', 'Jonker', 'Jonkvrouw', 'Broeder', 'Zuster', 'Meester', 'Ritmeester', 'Burggraaf', 'Burggravin',
  'Baljuw', 'Hofdame', 'Schildknaap', 'Kanselier', 'Pelgrim'];
const riddernaam = (titel, voor, stad) => [titel, voor.trim(), stad.trim() ? 'van ' + stad.trim() : ''].filter(Boolean).join(' ');
// omgekeerd: "Jonker Han van Leuven" → { titel: 'Jonker', voor: 'Han', stad: 'Leuven' } (titel leeg als hij niet in de lijst staat)
function naamDelen(naam) {
  let rest = String(naam || '').trim(), titel = '';
  const t = TITELS.find(x => rest.startsWith(x + ' ')); if (t) { titel = t; rest = rest.slice(t.length + 1); }
  const i = rest.lastIndexOf(' van ');
  return i > 0 ? { titel, voor: rest.slice(0, i), stad: rest.slice(i + 5) } : { titel, voor: rest, stad: '' };
}

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
    // meer stukken (MEER_STUKKEN)
    // Benji, de slapende poes, overgetrokken van een foto: de omtrek uit de foto geknipt (GrabCut op de turquoise deken,
    // gladgemaakt en vereenvoudigd), de gevouwen oortjes, dichte oogjes, het lichte snuitje en de staart erop afgelezen
    case 'poes': {
      const ink = '#2a1f16', licht = '#f1e6cf';
      return `<g transform="translate(0,-6) scale(1.3)" stroke="${ink}" stroke-linejoin="round" stroke-linecap="round">
        <path d="M-57.4,4.2 C-58.1,6.3 -56.9,6.4 -56.9,7.8 C-56.8,9.3 -57.3,10.7 -57.2,12.7 C-57,14.7 -56.3,18.3 -55.9,20 C-55.5,21.7 -55.3,22 -54.8,22.8 C-54.4,23.6 -53.9,24.3 -53.3,24.9 C-52.7,25.5 -52.6,26 -51.1,26.6 C-49.6,27.3 -49.1,27.9 -44.2,28.6 C-39.2,29.3 -28,30.5 -21.3,30.8 C-14.7,31.1 -10.6,30.6 -4.3,30.3 C2,30 12.7,29.5 16.6,29.2 C20.5,28.8 17.9,28.9 19,28.3 C20.1,27.7 21.7,25.5 23.2,25.4 C24.7,25.2 25.9,26.9 28.2,27.4 C30.4,27.8 33.1,28.3 36.7,28 C40.3,27.7 46.6,26 49.7,25.6 C52.8,25.2 54.2,25.8 55.4,25.7 C56.6,25.6 56.3,25.4 56.7,25.1 C57,24.8 57.6,25.1 57.4,23.8 C57.1,22.5 55.5,19.1 55.1,17.2 C54.7,15.3 54.7,13.9 55,12.5 C55.2,11.2 56.6,10.2 56.6,9.3 C56.6,8.3 55.4,7.7 55.2,6.7 C54.9,5.8 55.3,5.1 55,3.4 C54.7,1.8 54.2,-1.3 53.6,-3.1 C52.9,-4.9 52.3,-5.9 51.3,-7.3 C50.2,-8.6 48.2,-10.4 47.2,-11.3 C46.1,-12.2 46.2,-12.1 44.9,-12.5 C43.7,-13 42.4,-13.8 39.6,-14.2 C36.8,-14.6 31.2,-14.7 27.9,-15.1 C24.7,-15.5 22.2,-16.1 20.3,-16.7 C18.3,-17.2 17.8,-17.9 16.4,-18.2 C14.9,-18.5 13,-18.2 11.4,-18.5 C9.7,-18.8 8.9,-19.5 6.4,-20.1 C3.8,-20.7 -0.6,-21.5 -4,-22 C-7.5,-22.4 -11.2,-22.7 -14.3,-22.9 C-17.3,-23 -19.4,-23.3 -22.3,-22.9 C-25.2,-22.4 -29.2,-21.3 -31.7,-20.3 C-34.2,-19.3 -35.4,-17.9 -37.4,-16.9 C-39.3,-15.8 -42,-14.8 -43.4,-14 C-44.9,-13.3 -44.3,-13.8 -45.9,-12.2 C-47.4,-10.7 -50.9,-7.7 -52.8,-5 C-54.7,-2.3 -56.7,2 -57.4,4.2 Z" fill="${fill}" stroke-width="2.5"/>
        <path d="M-55.8,18.1 C-55.3,19.1 -54.7,22.6 -52.7,24.1 C-50.8,25.7 -48.1,26.7 -44.2,27.5 C-40.2,28.2 -34.2,28.2 -28.9,28.4 C-23.6,28.7 -17.9,29.2 -12.3,29.1 C-6.8,29.1 -0.6,28.8 4.3,28.2 C9.1,27.5 13.8,26.2 16.7,25.4 C19.7,24.5 20.8,23.8 22,23 C23.2,22.2 23.6,21 23.9,20.5" fill="none" stroke="${ink}" stroke-width="7" opacity=".22"/>
        <path d="M-55.8,18.1 C-55.3,19.1 -54.7,22.6 -52.7,24.1 C-50.8,25.7 -48.1,26.7 -44.2,27.5 C-40.2,28.2 -34.2,28.2 -28.9,28.4 C-23.6,28.7 -17.9,29.2 -12.3,29.1 C-6.8,29.1 -0.6,28.8 4.3,28.2 C9.1,27.5 13.8,26.2 16.7,25.4 C19.7,24.5 20.8,23.8 22,23 C23.2,22.2 23.6,21 23.9,20.5" fill="none" stroke-width="1.6"/>
        <path d="M-15.1,11.1 C-13.2,10.8 -7.6,9 -4,9.2 C-0.4,9.4 3.7,10.8 6.4,12.5 C9,14.2 11.1,18.3 12,19.4" fill="none" stroke-width="1.4" opacity=".55"/>
        <path d="M25.5,3.9 C25.4,3.2 25,0.7 25.3,-0.5 C25.7,-1.7 26.7,-2.6 27.5,-3.1 C28.4,-3.6 29.7,-3.7 30.6,-3.5 C31.5,-3.4 32.5,-2.9 32.9,-2.2 C33.4,-1.5 33.4,-0.3 33.1,0.6 C32.8,1.5 32,2.6 31.1,3.2 C30.3,3.9 29,4.2 28.1,4.3 C27.2,4.5 25.9,4 25.5,3.9 Z" fill="${fill}" stroke-width="1.8"/><path d="M25.5,3.9 C25.4,3.2 25,0.7 25.3,-0.5 C25.7,-1.7 26.7,-2.6 27.5,-3.1 C28.4,-3.6 29.7,-3.7 30.6,-3.5 C31.5,-3.4 32.5,-2.9 32.9,-2.2 C33.4,-1.5 33.4,-0.3 33.1,0.6 C32.8,1.5 32,2.6 31.1,3.2 C30.3,3.9 29,4.2 28.1,4.3 C27.2,4.5 25.9,4 25.5,3.9 Z" fill="${ink}" opacity=".28" stroke="none"/><path d="M27,3.8 C27.3,3.6 28,2.8 28.7,2.4 C29.3,2.1 30.1,1.9 30.7,1.7 C31.4,1.5 32.2,1.1 32.5,1" fill="none" stroke="${licht}" stroke-width="1.4"/>
        <path d="M51.1,10.3 C51.2,9.9 51.4,8.7 51.9,8.1 C52.4,7.5 53.2,7 53.8,6.8 C54.5,6.7 55.2,6.7 55.8,7 C56.4,7.3 57.1,8 57.3,8.6 C57.5,9.3 57.4,10.5 56.9,11 C56.4,11.5 55.1,11.8 54.1,11.7 C53.2,11.6 51.6,10.5 51.1,10.3 Z" fill="${fill}" stroke-width="1.8"/><path d="M51.1,10.3 C51.2,9.9 51.4,8.7 51.9,8.1 C52.4,7.5 53.2,7 53.8,6.8 C54.5,6.7 55.2,6.7 55.8,7 C56.4,7.3 57.1,8 57.3,8.6 C57.5,9.3 57.4,10.5 56.9,11 C56.4,11.5 55.1,11.8 54.1,11.7 C53.2,11.6 51.6,10.5 51.1,10.3 Z" fill="${ink}" opacity=".28" stroke="none"/><path d="M52.3,7.9 C52.6,7.8 53.2,7.2 53.7,7.1 C54.2,7 54.8,7.1 55.2,7.3 C55.6,7.4 56,7.8 56.2,7.9" fill="none" stroke="${licht}" stroke-width="1.2"/>
        <path d="M28.2,18.6 C28.4,18.7 28.8,19 29.1,19.3 C29.3,19.6 29.8,20.2 29.9,20.4 M35.6,23 C35.8,23.1 36.3,23.4 36.7,23.4 C37.1,23.5 37.7,23.3 37.9,23.3" fill="none" stroke-width="1.8"/>
        <path d="M53,22.8 C53.2,22.5 53.8,21.4 54.4,21.1 C55,20.8 56.2,20.6 56.9,20.8 C57.6,21.1 58.4,21.9 58.7,22.6 C58.9,23.3 58.8,24.5 58.4,25.1 C58,25.7 57.1,26.1 56.3,26.1 C55.6,26.1 54.4,25.8 53.8,25.2 C53.3,24.7 53.2,23.2 53,22.8 Z" fill="${licht}" stroke-width="1.3"/><path d="M51.6,25 C51.9,25.1 52.5,25.7 53,25.9 C53.6,26.2 54.6,26.3 55,26.4" fill="none" stroke-width="1.2"/>
        <path d="M23.7,23.6 C23,22.8 20.9,20.6 19.8,19.2 C18.6,17.7 17.3,15.5 16.7,14.7 M24.5,23.2 C23.9,22.4 22.1,20 21.2,18.5 C20.2,17 19.1,14.9 18.7,14.2 M25.3,24.3 C24.8,23.8 23.2,22.4 22,21.6 C20.9,20.9 19,20.3 18.4,20" fill="none" stroke-width=".8" opacity=".75"/>
        <path d="M34,-22 h6 l-6,6 h6 M42,-32 h4.5 l-4.5,4.5 h4.5" fill="none" stroke-width="1.8"/></g>`;
    }
    // het kattenoog: Benji's oog, overgetrokken van een close-up. De iris vult de hele opening (zoals bij een kat),
    // de schaduw van het bovenste ooglid, een grote ronde pupil (hij keek in de lens) en de lichtvlekken uit de foto
    case 'kattenoog': {
      const ink = '#2a1f16';
      return `<g stroke="${ink}" stroke-linejoin="round" stroke-linecap="round">
        <path d="M-52.6,-25 C-48,-27.3 -34.8,-36.1 -25,-38.8 C-15.2,-41.5 -4.2,-41.9 6.3,-41.3 C16.7,-40.7 29.1,-38.4 37.5,-35 C46,-31.7 53.7,-23.6 56.9,-21.3" fill="none" stroke-width="2.2"/>
        <path d="M-56.3,0.9 C-55.5,-3.6 -53.4,-10.8 -49.4,-15.6 C-45.5,-20.4 -39.7,-25 -32.5,-27.8 C-25.3,-30.7 -14.9,-32.3 -6.3,-32.5 C2.4,-32.8 11.8,-31.4 19.4,-29.4 C27,-27.4 33.9,-24.3 39.4,-20.6 C44.9,-17 49.8,-11.9 52.6,-7.5 C55.3,-3.1 56.3,1.3 55.7,5.6 C55.1,10 52.8,14.8 48.8,18.5 C44.8,22.1 39,25.2 31.9,27.5 C24.8,29.9 15.1,32.1 6.3,32.5 C-2.6,33 -13,31.8 -21.3,30 C-29.5,28.3 -37.6,24.9 -43.2,21.9 C-48.7,18.9 -52.2,15.4 -54.4,11.9 C-56.6,8.4 -57.1,5.5 -56.3,0.9 Z" fill="${fill}" stroke="none"/>
        <path d="M30.1,-6.3 L51.1,-6.3 M29.7,-1.6 L50.3,-0.7 M28.3,3 L47.9,4.7 M26,7.3 L44.1,9.7 M22.9,11.1 L38.9,14.3 M19,14.4 L32.5,18.3 M14.6,17.2 L25.1,21.5 M9.7,19.1 L16.8,23.8 M4.5,20.4 L8.1,25.3 M-0.9,20.8 L-0.9,25.7 M-6.3,20.4 L-10,25.3 M-11.6,19.1 L-18.7,23.8 M-16.5,17.2 L-26.9,21.5 M-20.9,14.4 L-34.4,18.3 M-24.8,11.1 L-40.8,14.3 M-27.9,7.3 L-46,9.7 M-30.1,3 L-49.8,4.7 M-31.6,-1.6 L-52.1,-0.7 M-32,-6.3 L-52.9,-6.3 M-31.6,-11 L-52.1,-11.8 M-30.1,-15.5 L-49.8,-17.2 M-27.9,-19.8 L-46,-22.3 M-24.8,-23.6 L-40.8,-26.8 M-20.9,-27 L-34.4,-30.8 M-16.5,-29.7 L-26.9,-34 M-11.6,-31.7 L-18.7,-36.3 M-6.3,-32.9 L-10,-37.8 M-0.9,-33.3 L-0.9,-38.3 M4.5,-32.9 L8.1,-37.8 M9.7,-31.7 L16.8,-36.3 M14.6,-29.7 L25.1,-34 M19,-27 L32.5,-30.8 M22.9,-23.6 L38.9,-26.8 M26,-19.8 L44.1,-22.3 M28.3,-15.5 L47.9,-17.2 M29.7,-11 L50.3,-11.8" fill="none" stroke-width="1" opacity=".3"/>
        <path d="M-54.4,2.5 C-54.6,1.1 -51.9,-9 -48.2,-13.8 C-44.4,-18.6 -38.9,-23.5 -31.9,-26.3 C-24.9,-29.1 -14.8,-30.5 -6.3,-30.7 C2.3,-30.9 11.9,-29.5 19.4,-27.5 C26.9,-25.6 33.5,-22.6 38.8,-19.1 C44.1,-15.5 51.5,-7.8 51.3,-6.3 C51.1,-4.7 43,-8.4 37.5,-10 C32.1,-11.6 26.1,-14.3 18.8,-15.6 C11.5,-17 2.1,-18.5 -6.3,-18.1 C-14.6,-17.8 -24.5,-15.9 -31.3,-13.8 C-38.1,-11.7 -43.1,-8.3 -46.9,-5.6 C-50.8,-2.9 -54.2,3.9 -54.4,2.5 Z" fill="${ink}" stroke="none" opacity=".38"/>
        <ellipse cx="-0.9" cy="-4.5" rx="28.8" ry="23" fill="${ink}" stroke="none"/>
        <ellipse cx="-28.2" cy="-15.6" rx="5.5" ry="9.5" transform="rotate(-12 -28.2 -15.6)" fill="#fff" stroke="none" opacity=".92"/>
        <path d="M22.5,-13.1 C22.8,-14.6 28.4,-19.2 30.7,-20 C33,-20.9 36.6,-19.6 36.3,-18.1 C36,-16.7 31.1,-12.1 28.8,-11.3 C26.5,-10.4 22.2,-11.7 22.5,-13.1 Z" fill="#fff" stroke="none" opacity=".55"/><circle cx="-3.1" cy="-21" r="1.3" fill="#fff" stroke="none" opacity=".85"/><circle cx="14.4" cy="-14.7" r="1.3" fill="#fff" stroke="none" opacity=".85"/><circle cx="43.2" cy="-17.8" r="1.3" fill="#fff" stroke="none" opacity=".85"/>
        <path d="M-56.3,0.9 C-55.5,-3.6 -53.4,-10.8 -49.4,-15.6 C-45.5,-20.4 -39.7,-25 -32.5,-27.8 C-25.3,-30.7 -14.9,-32.3 -6.3,-32.5 C2.4,-32.8 11.8,-31.4 19.4,-29.4 C27,-27.4 33.9,-24.3 39.4,-20.6 C44.9,-17 49.8,-11.9 52.6,-7.5 C55.3,-3.1 56.3,1.3 55.7,5.6 C55.1,10 52.8,14.8 48.8,18.5 C44.8,22.1 39,25.2 31.9,27.5 C24.8,29.9 15.1,32.1 6.3,32.5 C-2.6,33 -13,31.8 -21.3,30 C-29.5,28.3 -37.6,24.9 -43.2,21.9 C-48.7,18.9 -52.2,15.4 -54.4,11.9 C-56.6,8.4 -57.1,5.5 -56.3,0.9 Z" fill="none" stroke-width="4"/></g>`;
    }
    // de solsleutel (G-sleutel): één lijn, in de kleur van het stuk met een donkere omlijning
    case 'solsleutel': {
      const ink = '#2a1f16';
      const d = 'M2,16 C-6,16 -8,6 0,3 C12,0 19,12 13,24 C7,35 -14,35 -20,22 C-26,8 -14,-8 -1,-19 C10,-28 17,-40 13,-50 C9,-58 -1,-55 -3,-44 L5,46 C5,55 -5,58 -10,52';
      return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${d}" fill="none" stroke="${fill}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="-9" cy="47" r="7" fill="${fill}" stroke="${ink}" stroke-width="2.5"/>`;
    }
    case 'zon': {
      let p = '';
      for (let i = 0; i < 32; i++) { const rr = i % 2 ? 30 : 50, a = -Math.PI / 2 + i * Math.PI / 16; p += `${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)} `; }
      return `<g ${st}><polygon points="${p}"/><circle r="26"/></g>
        <g fill="none" stroke="#2a1f16" stroke-width="2" stroke-linecap="round"><path d="M-12,-6 q4,-4 8,0 M4,-6 q4,-4 8,0 M-9,10 q9,7 18,0"/></g>`;
    }
    // de Jakobsschelp van de pelgrims
    case 'schelp': {
      let ribben = '';
      for (let i = 1; i < 8; i++) { const a = Math.PI + i * Math.PI / 8, x = (44 * Math.cos(a)).toFixed(1), y = (-6 + 40 * Math.sin(a)).toFixed(1); ribben += `M0,36 L${x},${y} `; }
      return `<g ${st}><path d="M-14,36 L-24,48 H24 L14,36 Z"/><path d="M0,40 C-40,36 -52,-8 -38,-34 C-22,-54 22,-54 38,-34 C52,-8 40,36 0,40 Z"/>
        <path d="${ribben}" fill="none" stroke-width="2"/></g>`;
    }
    case 'hoorn': return `<g ${st} transform="scale(1.22)"><path d="M-30,-14 C-20,-44 22,-44 30,-16" fill="none" stroke-width="4"/>
      <path d="M-44,-6 C-38,30 26,34 36,-4 L50,-20 L46,6 L32,0 C20,22 -28,20 -32,-8 Z"/><rect x="-52" y="-12" width="10" height="10" rx="2"/>
      <path d="M-14,14 l4,-14 M10,14 l-2,-14" fill="none" stroke-width="2"/></g>`;
    case 'boom': return `<g ${st}><path d="M-7,48 L-5,8 H5 L7,48 L16,52 H-16 Z"/>
      <path d="M0,-52 C14,-52 22,-42 22,-34 C36,-34 44,-20 38,-8 C46,4 36,20 22,16 C16,26 -16,26 -22,16 C-36,20 -46,4 -38,-8 C-44,-20 -36,-34 -22,-34 C-22,-42 -14,-52 0,-52 Z"/>
      <path d="M-14,-18 q6,-8 12,0 M6,-4 q6,-8 12,0 M-22,4 q6,-8 12,0" fill="none" stroke-width="2"/></g>`;
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

