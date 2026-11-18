'use strict';
/* =========================================================
   Dobbelen (Farkle, zoals in Kingdom Come): de spelregels, los van de pagina.
   Pure functies, zodat ze te testen zijn (node feestje-dobbel.test.js).

   Puntentelling (zoals uitgelegd op /feestje):
   - een 1 is 100, een 5 is 50
   - drie gelijke: 100 × de waarde, drie enen 1000; elke extra gelijke steen verdubbelt
   - 1-2-3-4-5 is 500, 2-3-4-5-6 is 750, 1 t/m 6 is 1500
   ========================================================= */
const Dobbel = (() => {
  const DRIE = v => v === 1 ? 1000 : v * 100;

  /* De hoogste score waarbij ÁLLE gegeven stenen meetellen; null als dat niet kan
     (een gekozen steen die niets oplevert, maakt de keuze ongeldig). */
  function score(stenen) {
    const n = [0, 0, 0, 0, 0, 0, 0];
    for (const s of stenen) n[s]++;
    const memo = new Map();
    function best(c) {                       // c: aantallen per waarde 1..6
      const key = c.join('');
      if (memo.has(key)) return memo.get(key);
      if (c.every(x => x === 0)) return 0;
      let top = -Infinity;
      const probeer = (punten, zonder) => { const r = best(zonder); if (r > -Infinity) top = Math.max(top, punten + r); };
      const min = (vals) => { const d = c.slice(); for (const v of vals) d[v]--; return d; };
      const heeft = vals => vals.every(v => c[v] > 0);
      if (heeft([1, 2, 3, 4, 5, 6])) probeer(1500, min([1, 2, 3, 4, 5, 6]));
      if (heeft([1, 2, 3, 4, 5])) probeer(500, min([1, 2, 3, 4, 5]));
      if (heeft([2, 3, 4, 5, 6])) probeer(750, min([2, 3, 4, 5, 6]));
      for (let v = 1; v <= 6; v++) for (let k = 3; k <= c[v]; k++) { const d = c.slice(); d[v] -= k; probeer(DRIE(v) * 2 ** (k - 3), d); }
      if (c[1]) probeer(100, min([1]));
      if (c[5]) probeer(50, min([5]));
      memo.set(key, top);
      return top;
    }
    const r = stenen.length ? best(n) : -Infinity;
    return r === -Infinity ? null : r;
  }

  /* Levert deze worp iets op? (zo niet: "Farkle", de punten van de beurt zijn weg) */
  const scoort = worp => worp.some(s => s === 1 || s === 5) || [1, 2, 3, 4, 5, 6].some(v => worp.filter(s => s === v).length >= 3)
    || [2, 3, 4, 5].every(v => worp.includes(v)) && (worp.includes(1) || worp.includes(6));

  /* De beste keuze uit een worp: de deelverzameling met de hoogste geldige score.
     Bij gelijke score houdt Hans liever stenen over om mee verder te gooien. */
  function besteKeuze(worp) {
    let beste = null;
    const n = worp.length;
    for (let m = 1; m < 1 << n; m++) {
      const idx = []; for (let i = 0; i < n; i++) if (m & 1 << i) idx.push(i);
      const sc = score(idx.map(i => worp[i]));
      if (sc == null) continue;
      if (!beste || sc > beste.score || (sc === beste.score && idx.length < beste.idx.length)) beste = { idx, score: sc };
    }
    return beste;
  }

  /* Hans' gok: stoppen of doorgooien, met zoveel punten in de beurt en zoveel stenen over. */
  function hansStopt(rondePunten, over, stand, doel) {
    if (stand + rondePunten >= doel) return true;
    if (over === 0) return false;                        // alle zes opzij: hij gooit opnieuw met zes
    if (over <= 2) return rondePunten >= 250;
    if (over === 3) return rondePunten >= 400;
    return rondePunten >= 650;
  }

  return { score, scoort, besteKeuze, hansStopt };
})();
if (typeof module !== 'undefined') module.exports = Dobbel;
