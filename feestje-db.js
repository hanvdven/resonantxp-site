'use strict';
/* =========================================================
   De tussenstand: gegevenslaag voor /feestje-tv en /feestje-beheer.

   Met SUPABASE ingevuld: alles via de REST-API van Supabase (PostgREST).
     - lezen: één aanroep, rpc/stand, geeft { ridders, spelen, punten }
     - schrijven: alleen via functies die de pincode controleren (zie feestje-supabase.sql)
   Zonder SUPABASE: demomodus. De stand staat dan in localStorage van dit toestel
   (pincode 1403); tabbladen op hetzelfde toestel houden elkaar bij via BroadcastChannel.

   De url en de publishable/anon-sleutel mogen publiek zijn: ze staan altijd in de website.
   De bescherming zit in Row Level Security: anonieme bezoekers mogen alleen lezen,
   en schrijven kan enkel via de functies met pincode.
   ========================================================= */
const SUPABASE = {
  url: 'https://qwjeqrzvprvldnswlgjp.supabase.co',   // het resonantxp-project (gedeeld met o.a. de boodschappen; alles van het feest heet fj_…)
  key: 'sb_publishable_tgCJqsC9_uWBXfnNpvGWQA_VPAWqOHA',   // publishable key: hoort publiek te zijn, de bescherming zit in RLS + pincode
};

const Db = (() => {
  const live = !!(SUPABASE.url && SUPABASE.key);

  /* ---------- Supabase ---------- */
  const headers = () => {
    const h = { apikey: SUPABASE.key, 'Content-Type': 'application/json' };
    if (SUPABASE.key.startsWith('eyJ')) h.Authorization = 'Bearer ' + SUPABASE.key; // oude anon key is een JWT
    return h;
  };
  async function rpc(fn, args = {}) {
    const r = await fetch(`${SUPABASE.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(args), cache: 'no-store' });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || `Supabase antwoordde ${r.status}`);
    }
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }

  /* ---------- demo ---------- */
  const KEY = 'feestje.demo.stand', DEMO_PIN = '1403';
  const bc = 'BroadcastChannel' in self ? new BroadcastChannel('feestje-stand') : null;
  const W = (t1, t2, div, ch, c) => ({ t1, t2, div, ch, c });
  function demoSeed() {
    const ridders = [
      ['Heer Jindřich van Skalice', W('azure', 'or', 'pale', 'ster', 'or')],
      ['Hans Capon van Rataje', W('gules', 'argent', 'fess', 'kroon', 'or')],
      ['Vrouwe Theresa van de Molen', W('vert', 'or', 'bend', 'roos', 'argent')],
      ['Broeder Godwin', W('sable', 'argent', 'plain', 'beker', 'or')],
      ['Ritmeester Bernard', W('or', 'gules', 'chevron', 'zwaard', 'sable')],
      ['Janosh Pfefferkorn', W('purpure', 'or', 'quarterly', 'maan', 'argent')],
    ].map(([naam, wapen], i) => ({ id: i + 1, naam, wapen }));
    const spelen = ['Wapen', 'Kostuum', 'Zwaard', 'Boog', 'Dobbelen', 'Proeverij', 'Quiz'].map((naam, i) => ({ id: i + 1, naam, volgorde: i + 1 }));
    const P = [[1, 1, 7], [1, 2, 8], [1, 3, 5], [1, 4, 9], [2, 2, 6], [2, 3, 9], [2, 5, 12], [3, 1, 9], [3, 2, 9], [3, 4, 7], [4, 2, 4], [4, 6, 8], [4, 7, 10], [5, 3, 10], [5, 4, 6], [6, 1, 5], [6, 2, 7], [6, 5, 8]];
    return { ridders, spelen, punten: P.map(([ridder_id, spel_id, punten]) => ({ ridder_id, spel_id, punten })) };
  }
  const demoGet = () => { try { return JSON.parse(localStorage.getItem(KEY)) || demoSeed(); } catch { return demoSeed(); } };
  function demoDo(pin, change) {
    if (String(pin) !== DEMO_PIN) throw new Error('Verkeerde pincode');
    const d = demoGet(); const out = change(d);
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
    bc?.postMessage('veranderd');
    return out;
  }
  const nextId = list => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  const demoPin = pin => { if (String(pin) !== DEMO_PIN) throw new Error('Verkeerde pincode'); };
  // de quiz in demomodus: dezelfde regels als de functies in de database
  const Quiz = (() => {
    const QK = 'feestje.demo.quiz';
    const lees = () => { try { return JSON.parse(localStorage.getItem(QK)) || null; } catch { return null; } };
    const leeg = () => ({ vragen: typeof QUIZ_VRAGEN !== 'undefined' ? QUIZ_VRAGEN : [], nr: 0, fase: 'uit', geopend: null, antwoorden: [] });
    const get = () => lees() || leeg();
    const put = q => { try { localStorage.setItem(QK, JSON.stringify(q)); } catch {} bc?.postMessage('quiz'); };
    function toestand(meester) {
      const q = get(), v = q.vragen[q.nr - 1], hier = q.antwoorden.filter(a => a.nr === q.nr);
      const t = { fase: q.fase, nr: q.nr, totaal: q.vragen.length, vraag: q.fase !== 'uit' ? v?.vraag : null, antwoorden: q.fase !== 'uit' ? v?.antwoorden : null,
        verstreken: q.geopend ? (Date.now() - q.geopend) / 1000 : null, aantal: hier.length, ridders: demoGet().ridders.length,
        juist: q.fase === 'uitslag' || meester ? v?.juist : null,
        uitslag: q.fase === 'uitslag' ? hier.slice().sort((a, b) => b.punten - a.punten).map(({ ridder_id, keuze, punten }) => ({ ridder_id, keuze, punten })) : null };
      if (meester) t.antwoorden_van = hier.map(a => a.ridder_id);
      return t;
    }
    function antwoord(ridder, keuze) {
      const q = get(); if (q.fase !== 'open') return false;
      if (q.antwoorden.some(a => a.nr === q.nr && a.ridder_id === ridder)) return false;
      const sec = (Date.now() - q.geopend) / 1000, goed = keuze === q.vragen[q.nr - 1].juist;
      q.antwoorden.push({ nr: q.nr, ridder_id: ridder, keuze, punten: goed ? 100 + Math.max(0, 30 - Math.floor(sec)) : 0 }); put(q); return true;
    }
    function stap(actie) {
      const q = get();
      if (actie === 'start') Object.assign(q, { nr: 1, fase: 'wacht', geopend: null });
      else if (actie === 'open' && q.fase === 'wacht') Object.assign(q, { fase: 'open', geopend: Date.now() });
      else if (actie === 'sluit' && q.fase === 'open') q.fase = 'dicht';
      else if (actie === 'toon' && (q.fase === 'open' || q.fase === 'dicht')) {
        q.fase = 'uitslag';
        const d = demoGet(), spel = d.spelen.find(x => x.naam === 'Quiz');
        if (spel) {
          const som = new Map(); q.antwoorden.forEach(a => som.set(a.ridder_id, (som.get(a.ridder_id) || 0) + a.punten));
          d.punten = d.punten.filter(x => x.spel_id !== spel.id).concat([...som].map(([ridder_id, punten]) => ({ ridder_id, spel_id: spel.id, punten })));
          try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} bc?.postMessage('veranderd');
        }
      } else if (actie === 'volgende') { if (q.nr < q.vragen.length) Object.assign(q, { nr: q.nr + 1, fase: 'wacht', geopend: null }); else q.fase = 'uit'; }
      else if (actie === 'stop') q.fase = 'uit';
      else if (actie === 'reset') Object.assign(q, { nr: 0, fase: 'uit', geopend: null, antwoorden: [] });
      put(q);
    }
    function laad(vragen) { put(Object.assign(leeg(), { vragen })); return vragen.length; }
    return { toestand, antwoord, stap, laad };
  })();

  /* ---------- publieke API ---------- */
  return {
    live,
    demoPin: live ? null : DEMO_PIN,
    stand: async () => live ? rpc('fj_stand') : demoGet(),
    pinOk: async pin => live ? rpc('fj_pin_ok', { p_pin: pin }) : String(pin) === DEMO_PIN,
    zetPunten: async (pin, ridder, spel, punten) => live
      ? rpc('fj_zet_punten', { p_pin: pin, p_ridder: ridder, p_spel: spel, p_punten: punten })
      : demoDo(pin, d => {
          const x = d.punten.find(p => p.ridder_id === ridder && p.spel_id === spel);
          if (x) x.punten = punten; else d.punten.push({ ridder_id: ridder, spel_id: spel, punten });
        }),
    voegRidder: async (pin, naam, wapen) => live
      ? rpc('fj_voeg_ridder', { p_pin: pin, p_naam: naam, p_wapen: wapen })
      : demoDo(pin, d => { const id = nextId(d.ridders); d.ridders.push({ id, naam, wapen }); return id; }),
    wijzigRidder: async (pin, id, naam, wapen) => live
      ? rpc('fj_wijzig_ridder', { p_pin: pin, p_id: id, p_naam: naam, p_wapen: wapen })
      : demoDo(pin, d => { const r = d.ridders.find(r => r.id === id); if (r) { r.naam = naam; r.wapen = wapen; } }),
    verwijderRidder: async (pin, id) => live
      ? rpc('fj_verwijder_ridder', { p_pin: pin, p_id: id })
      : demoDo(pin, d => { d.ridders = d.ridders.filter(r => r.id !== id); d.punten = d.punten.filter(p => p.ridder_id !== id); }),
    wijzigPin: async (oud, nieuw) => {
      if (String(nieuw).length < 6) throw new Error('De nieuwe pincode moet minstens 6 tekens hebben');
      if (live) return rpc('fj_wijzig_pin', { p_oud: oud, p_nieuw: nieuw });
      throw new Error('In de demo blijft de pincode 1403');
    },
    voegSpel: async (pin, naam) => live
      ? rpc('fj_voeg_spel', { p_pin: pin, p_naam: naam })
      : demoDo(pin, d => { const id = nextId(d.spelen); d.spelen.push({ id, naam, volgorde: id }); return id; }),
    demoReset: () => { try { localStorage.removeItem(KEY); } catch {} bc?.postMessage('veranderd'); },

    /* ---------- de quiz (zie fj_quiz_* in feestje-supabase.sql; de demo doet hetzelfde in localStorage) ---------- */
    quizToestand: async () => live ? rpc('fj_quiz_toestand') : Quiz.toestand(false),
    quizMeester: async pin => live ? rpc('fj_quiz_meester', { p_pin: pin }) : (demoPin(pin), Quiz.toestand(true)),
    quizAntwoord: async (ridder, keuze) => live ? rpc('fj_quiz_antwoord', { p_ridder: ridder, p_keuze: keuze }) : Quiz.antwoord(ridder, keuze),
    quizStap: async (pin, actie) => live ? rpc('fj_quiz_stap', { p_pin: pin, p_actie: actie }) : (demoPin(pin), Quiz.stap(actie), Quiz.toestand(true)),
    quizLaad: async (pin, vragen) => live ? rpc('fj_quiz_laad', { p_pin: pin, p_vragen: vragen }) : (demoPin(pin), Quiz.laad(vragen)),

    /* Volg de stand: roept cb(stand) aan bij elke wijziging. Supabase: elke `ms` opvragen
       (eenvoudiger en robuuster op een Chromecast dan een websocket). Demo: direct via BroadcastChannel.
       cb krijgt ook fouten door: cb(null, fout). Geeft een functie terug om te stoppen. */
    volg(cb, ms = 4000) {
      let last = '', timer = null, stopped = false;
      const tick = async () => {
        try {
          const s = await this.stand(), j = JSON.stringify(s);
          if (j !== last) { last = j; cb(s, null); }
        } catch (e) { cb(null, e); }
        if (!stopped) timer = setTimeout(tick, live ? ms : 15000);
      };
      const nudge = () => { clearTimeout(timer); tick(); };
      bc?.addEventListener('message', nudge);
      addEventListener('storage', e => { if (e.key === KEY) nudge(); });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) nudge(); });
      tick();
      return () => { stopped = true; clearTimeout(timer); bc?.removeEventListener('message', nudge); };
    },
  };
})();

/* Hulpje: totaal per ridder en de ranglijst (hoogste eerst; bij gelijke stand op naam). */
function ranglijst(stand) {
  const tot = new Map(stand.ridders.map(r => [r.id, 0]));
  const per = new Map();
  for (const p of stand.punten) {
    if (!tot.has(p.ridder_id)) continue;
    tot.set(p.ridder_id, tot.get(p.ridder_id) + p.punten);
    per.set(p.ridder_id + ':' + p.spel_id, p.punten);
  }
  const rows = stand.ridders.map(r => ({ ...r, totaal: tot.get(r.id), per: id => per.get(r.id + ':' + id) }));
  rows.sort((a, b) => b.totaal - a.totaal || a.naam.localeCompare(b.naam, 'nl'));
  let plaats = 0, vorige = null;
  rows.forEach((r, i) => { if (r.totaal !== vorige) { plaats = i + 1; vorige = r.totaal; } r.plaats = plaats; });
  return rows;
}
