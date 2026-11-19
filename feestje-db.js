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
      ['Heer Jindřich van Skalitz', W('azure', 'or', 'pale', 'ster', 'or')],
      ['Jonker Hans van Rataje', W('gules', 'argent', 'fess', 'kroon', 'or')],
      ['Vrouwe Theresa van Skalice', W('vert', 'or', 'bend', 'roos', 'argent')],
      ['Broeder Godwin van Sázava', W('sable', 'argent', 'plain', 'beker', 'or')],
      ['Ritmeester Bernard van Trosky', W('or', 'gules', 'chevron', 'zwaard', 'sable')],
      ['Meester Janosh van Kuttenberg', W('purpure', 'or', 'quarterly', 'maan', 'argent')],
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
  // demo van de eigen ridders (zoals fj_ridder_*): pincode en sessies in de demo-opslag, zonder hash (alleen dit toestel)
  function demoZelf(change) {
    const d = demoGet(); d.geheim = d.geheim || {}; d.sessies = d.sessies || {};
    const out = change(d);
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
    bc?.postMessage('veranderd');
    return out;
  }
  function demoCheck(d, naam, eigen) {
    naam = String(naam || '').trim();
    if (naam.length < 3 || naam.length > 60) throw new Error('Kies een naam van 3 tot 60 tekens.');
    if (d.ridders.some(r => r.naam.toLowerCase() === naam.toLowerCase() && r.id !== eigen)) throw new Error('Die naam is al genomen. Kies een andere titel of stad.');
    return naam;
  }
  const demoSessie = (d, id) => { const s = [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join(''); d.sessies[s] = id; return s; };
  const zesCijfers = pin => { if (!/^[0-9]{6}$/.test(String(pin || ''))) throw new Error('De pincode moet uit 6 cijfers bestaan.'); };
  const demoPin = pin => { if (String(pin) !== DEMO_PIN) throw new Error('Verkeerde pincode'); };
  // normaliseren zoals fj_norm in de database: kleine letters, zonder accenten, spaties en leestekens
  const norm = t => String(t ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/^(de|het|een|n|t|the|a|an|der|die|das|ein|eine|le|la|les|l|un|une)[^a-z0-9]+/, '').replace(/[^a-z0-9]/g, '');
  // soort 'meer': hoeveel verschillende juiste antwoorden zitten er in "topaas|robijn|ruby"? (zoals fj_quiz_meer)
  const meerGoed = (v, tekst) => { const w = String(tekst ?? '').split('|').map(norm).filter(Boolean); return v.juist.filter(vs => vs.some(g => w.includes(norm(g)))).length; };
  // het juiste antwoord om te tonen: keuze → nummer, woord → het eerste goede woord, getal → het getal
  const toonJuist = v => v ? (v.soort === 'woord' ? v.juist[0] : v.soort === 'meer' ? v.juist.map(x => x[0]) : v.juist) : null;
  // de quiz in demomodus: dezelfde regels als de functies in de database (zie fj_quiz_* in feestje-supabase.sql)
  const Quiz = (() => {
    const QK = 'feestje.demo.quiz';
    const lees = () => { try { return JSON.parse(localStorage.getItem(QK)) || null; } catch { return null; } };
    const leeg = () => ({ vragen: typeof QUIZ_VRAGEN !== 'undefined' ? QUIZ_VRAGEN : [], nr: 0, fase: 'uit', geopend: null, antwoorden: [] });
    const get = () => lees() || leeg();
    const put = q => { try { localStorage.setItem(QK, JSON.stringify(q)); } catch {} bc?.postMessage('quiz'); };
    const soort = v => v?.soort || 'keuze';
    function stand(q) {
      const som = new Map(); q.antwoorden.forEach(a => som.set(a.ridder_id, (som.get(a.ridder_id) || 0) + a.punten));
      return [...som].map(([ridder_id, punten]) => ({ ridder_id, punten })).sort((a, b) => b.punten - a.punten);
    }
    // de klok, zoals fj_quiz_klok: na de bedenktijd van de vraag (standaard 30 s) vanzelf de uitslag
    const bedenktijd = v => v?.tijd || 30;
    function naarStand(q) {
      const d = demoGet(), spel = d.spelen.find(x => x.naam === 'Quiz');
      if (!spel) return;
      d.punten = d.punten.filter(x => x.spel_id !== spel.id).concat(stand(q).map(({ ridder_id, punten }) => ({ ridder_id, spel_id: spel.id, punten })));
      try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} bc?.postMessage('veranderd');
    }
    const aanwezig = q => Object.keys(q.spelers || {}).filter(id => Date.now() - q.spelers[id] < 15000).map(Number);   // gsm de laatste 15 s gezien
    function klok() {
      const q = get(), v = q.vragen[q.nr - 1];
      if (!(q.fase === 'open' || q.fase === 'dicht') || !q.geopend) return;
      const hier = q.antwoorden.filter(a => a.nr === q.nr), iedereen = hier.length && aanwezig(q).every(id => hier.some(a => a.ridder_id === id));
      if (Date.now() - q.geopend >= bedenktijd(v) * 1000 || iedereen) { q.fase = 'uitslag'; put(q); naarStand(q); }
    }
    function toestand(meester, ridder) {
      if (ridder) { const q = get(); q.spelers = { ...(q.spelers || {}), [ridder]: Date.now() }; put(q); }
      klok();
      const q = get(), v = q.vragen[q.nr - 1], hier = q.antwoorden.filter(a => a.nr === q.nr), zie = q.fase !== 'uit' || meester;
      const t = { fase: q.fase, nr: q.nr, totaal: q.vragen.length, ronde: v?.ronde || null, rondes: q.vragen.map(w => w.ronde || ''),
        soort: zie && v ? soort(v) : null, vraag: zie ? v?.vraag : null,
        afbeelding: zie ? v?.afbeelding || null : null, antwoorden: zie ? v?.antwoorden || null : null, tijd: bedenktijd(v),
        verstreken: q.geopend ? (Date.now() - q.geopend) / 1000 : null, aantal: hier.length, ridders: demoGet().ridders.length, spelers: aanwezig(q).length, aanwezig: aanwezig(q).sort((x, y) => x - y),
        van: q.fase === 'open' || q.fase === 'dicht' ? hier.map(a => a.ridder_id) : null,
        juist: q.fase === 'uitslag' || meester ? toonJuist(v && { ...v, soort: soort(v) }) : null,
        uitslag: q.fase === 'uitslag' ? hier.slice().sort((a, b) => b.punten - a.punten).map(({ ridder_id, keuze, waarde, punten, tijd }) => ({ ridder_id, keuze, waarde, punten, sec: tijd && q.geopend ? Math.floor((tijd - q.geopend) / 1000) : null })) : null,
        stand: q.fase === 'uitslag' || q.fase === 'stand' || (q.fase === 'uit' && q.nr > 0) ? stand(q) : null };
      if (meester) {
        t.antwoorden_van = hier.map(a => a.ridder_id);
        t.alle = hier.map(({ ridder_id, keuze, waarde, punten, oordeel, tijd }) => ({ ridder_id, keuze, waarde, punten, oordeel: oordeel ?? null, sec: q.geopend && tijd ? Math.round((tijd - q.geopend) / 100) / 10 : null }));
        const w = q.vragen[(q.fase === 'uit' && !q.nr) ? 0 : q.nr];
        t.volgende = w ? { nr: q.vragen.indexOf(w) + 1, ronde: w.ronde || null, soort: soort(w), tijd: bedenktijd(w), vraag: w.vraag, afbeelding: w.afbeelding || null, antwoorden: w.antwoorden || null, juist: toonJuist({ ...w, soort: soort(w) }) } : null;
      }
      return t;
    }
    function antwoord(ridder, keuze, tekst) {
      klok();
      const q = get(); if (q.fase !== 'open') return false;
      if (q.antwoorden.some(a => a.nr === q.nr && a.ridder_id === ridder)) return false;
      if (!demoGet().ridders.some(r => r.id === ridder)) return false;
      const v = q.vragen[q.nr - 1], s = soort(v), snel = Math.max(0, 30 - Math.floor((Date.now() - q.geopend) / 1000));
      let punten = 0;
      if (s === 'keuze') { if (!(keuze >= 0 && keuze <= 3)) return false; if (keuze === v.juist) punten = 100 + snel; }
      else if (s === 'woord') { if (!norm(tekst)) return false; if (v.juist.some(g => norm(g) === norm(tekst))) punten = 100 + snel; }
      else if (s === 'meer') { if (!norm(String(tekst ?? '').replace(/\|/g, ''))) return false; punten = 50 * meerGoed(v, tekst); }
      else {   // schatting: (100 + snelheid) · max(0, 1 − |ln(g / a)|), zoals in fj_quiz_antwoord
        if (!/^\s*-?\d+([.,]\d+)?\s*$/.test(tekst || '')) return false;
        const g = parseFloat(String(tekst).trim().replace(',', '.')), a = +v.juist;
        if (g > 0 && a > 0) punten = Math.round((100 + snel) * Math.max(0, 1 - Math.abs(Math.log(g / a))));
      }
      q.antwoorden.push({ nr: q.nr, ridder_id: ridder, keuze: s === 'keuze' ? keuze : null, waarde: s === 'keuze' ? null : String(tekst).trim().slice(0, 200), punten, tijd: Date.now() });
      put(q); klok(); return true;
    }
    function stap(actie) {
      klok();
      const q = get(), v = q.vragen[q.nr - 1];
      if (actie === 'start' && q.vragen.length) Object.assign(q, { nr: 0, fase: 'intro', geopend: null });   // eerst het beginscherm
      else if (actie === 'open' && q.fase === 'wacht') Object.assign(q, { fase: 'open', geopend: Date.now() });
      else if (actie === 'sluit' && q.fase === 'open') q.fase = 'dicht';
      else if (actie === 'toon' && (q.fase === 'open' || q.fase === 'dicht')) {
        q.fase = 'uitslag'; put(q); naarStand(q);
      } else if (actie === 'volgende') {
        const w = q.vragen[q.nr];   // de volgende vraag
        if (q.fase === 'uitslag' && w && v?.ronde && w.ronde !== v.ronde) q.fase = 'stand';   // einde van een ronde: eerst de tussenstand
        else if (q.nr < q.vragen.length) Object.assign(q, { nr: q.nr + 1, fase: 'wacht', geopend: null }); else q.fase = 'uit';
      }
      else if (actie === 'stop') q.fase = 'uit';
      else if (actie === 'reset') Object.assign(q, { nr: 0, fase: 'uit', geopend: null, antwoorden: [] });
      put(q);
    }
    function laad(vragen) { put(Object.assign(leeg(), { vragen })); return vragen.length; }
    // de quizmaster beoordeelt (zoals fj_quiz_keur): 1 = goed, 0.5 = half, 0 = fout, null = automatisch
    function keur(ridder, oordeel) {
      const q = get(), v = q.vragen[q.nr - 1], s = soort(v), a = q.antwoorden.find(x => x.nr === q.nr && x.ridder_id === ridder);
      if (!a || s === 'getal') return;
      const snel = Math.max(0, 30 - Math.floor(((a.tijd || q.geopend) - q.geopend) / 1000));
      const auto = s === 'keuze' ? (a.keuze === v.juist ? 100 + snel : 0) : s === 'woord' ? (v.juist.some(g => norm(g) === norm(a.waarde)) ? 100 + snel : 0) : 50 * meerGoed(v, a.waarde);
      const max = s === 'meer' ? 50 * v.juist.length : 100 + snel;
      a.oordeel = oordeel; a.punten = oordeel == null ? auto : Math.round(max * oordeel);
      if (q.fase === 'uitslag' || q.fase === 'stand') {
        const d = demoGet(), spel = d.spelen.find(x => x.naam === 'Quiz');
        if (spel) { d.punten = d.punten.filter(x => x.spel_id !== spel.id).concat(stand(q).map(({ ridder_id, punten }) => ({ ridder_id, spel_id: spel.id, punten }))); try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} bc?.postMessage('veranderd'); }
      }
      put(q);
    }
    return { toestand, antwoord, stap, laad, keur };
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
    /* eigen ridders: inschrijven met een pincode, aanmelden, zelf aanpassen (zie fj_ridder_* in feestje-supabase.sql).
       De sessiesleutel blijft op het toestel; de pincode zelf wordt nergens bewaard. */
    ridderMaak: async (naam, wapen, pin) => live ? rpc('fj_ridder_maak', { p_naam: naam, p_wapen: wapen, p_pin: pin })
      : demoZelf(d => { zesCijfers(pin); naam = demoCheck(d, naam, null); const id = nextId(d.ridders);
          d.ridders.push({ id, naam, wapen: wapen || {}, aangemeld: new Date().toISOString(), pin: true }); d.geheim[id] = { pin: String(pin), mislukt: 0 };
          return { id, sessie: demoSessie(d, id) }; }),
    ridderLogin: async (id, pin) => {
      const uit = live ? await rpc('fj_ridder_login', { p_ridder: id, p_pin: pin }) : demoZelf(d => {
        const g = d.geheim[id];
        if (!g) return { fout: 'Deze ridder heeft (nog) geen pincode. Vraag de heraut.' };
        if (g.tot > Date.now()) return { fout: 'Te veel foute pogingen. Probeer het over een kwartier opnieuw, of vraag de heraut.' };
        if (g.pin !== String(pin)) { if (++g.mislukt >= 5) { g.mislukt = 0; g.tot = Date.now() + 15 * 60e3; } return { fout: 'Dat is niet de juiste pincode.' }; }
        g.mislukt = 0; g.tot = 0; return { id, sessie: demoSessie(d, id) };
      });
      if (uit?.fout) throw new Error(uit.fout);   // de database geeft een fout als antwoord terug (zie fj_ridder_login)
      return uit;
    },
    ridderIk: async sessie => live ? rpc('fj_ridder_ik', { p_sessie: sessie })
      : (() => { const d = demoGet(), id = d.sessies?.[sessie], r = d.ridders.find(x => x.id === id); return r ? { id: r.id, naam: r.naam, wapen: r.wapen } : null; })(),
    ridderZelf: async (sessie, naam, wapen) => live ? rpc('fj_ridder_zelf', { p_sessie: sessie, p_naam: naam, p_wapen: wapen })
      : demoZelf(d => { const id = d.sessies[sessie], r = d.ridders.find(x => x.id === id);
          if (!r) throw new Error('U bent afgemeld. Meld u opnieuw aan met uw pincode.');
          r.naam = demoCheck(d, naam, id); r.wapen = wapen || r.wapen; return { id, naam: r.naam, wapen: r.wapen }; }),
    ridderUit: async sessie => live ? rpc('fj_ridder_uit', { p_sessie: sessie }) : demoZelf(d => { delete d.sessies[sessie]; }),
    ridderNieuwePin: async (pin, id, nieuw) => live ? rpc('fj_ridder_nieuwe_pin', { p_pin: pin, p_ridder: id, p_nieuw: nieuw })
      : (demoPin(pin), zesCijfers(nieuw), demoZelf(d => { d.geheim[id] = { pin: String(nieuw), mislukt: 0 };
          const r = d.ridders.find(x => x.id === id); if (r) r.pin = true;
          for (const [k, v] of Object.entries(d.sessies)) if (v === id) delete d.sessies[k]; })),

    wijzigPin: async (oud, nieuw) => {
      if (String(nieuw).length < 6) throw new Error('De nieuwe pincode moet minstens 6 tekens hebben');
      if (live) return rpc('fj_wijzig_pin', { p_oud: oud, p_nieuw: nieuw });
      throw new Error('In de demo blijft de pincode 1403');
    },
    voegSpel: async (pin, naam) => live
      ? rpc('fj_voeg_spel', { p_pin: pin, p_naam: naam })
      : demoDo(pin, d => { const id = nextId(d.spelen); d.spelen.push({ id, naam, volgorde: id }); return id; }),
    demoReset: () => { try { localStorage.removeItem(KEY); } catch {} bc?.postMessage('veranderd'); },

    /* ---------- Spotify koppelen via de gsm (zie fj_spotify_* in feestje-supabase.sql): de gsm zet de token onder een
       geheime code, de tv haalt hem één keer op. Demo: via localStorage (werkt dan alleen op één toestel). ---------- */
    spotifyZet: async (id, token) => live ? rpc('fj_spotify_zet', { p_id: id, p_token: token })
      : (localStorage.setItem('feestje.demo.spotify.' + id, token), true),
    spotifyHaal: async id => {
      if (live) return rpc('fj_spotify_haal', { p_id: id });
      const k = 'feestje.demo.spotify.' + id, t = localStorage.getItem(k); localStorage.removeItem(k); return t;
    },

    /* ---------- de quiz (zie fj_quiz_* in feestje-supabase.sql; de demo doet hetzelfde in localStorage) ---------- */
    // ridder: de gsm van een speler meldt zich mee (wie meespeelt; zie fj_quiz_spelers)
    quizToestand: async ridder => live ? rpc('fj_quiz_toestand', ridder ? { p_ridder: ridder } : {}) : Quiz.toestand(false, ridder),
    quizMeester: async pin => live ? rpc('fj_quiz_meester', { p_pin: pin }) : (demoPin(pin), Quiz.toestand(true)),
    // keuze: 0–3 bij een keuzevraag, anders null; tekst: het woord of het getal, anders null
    quizAntwoord: async (ridder, keuze, tekst = null) => live ? rpc('fj_quiz_antwoord', { p_ridder: ridder, p_keuze: keuze, p_tekst: tekst }) : Quiz.antwoord(ridder, keuze, tekst),
    // de vragen zoals de database ze wil (soort ingevuld; de database normaliseert de woorden zelf bij het vergelijken)
    quizVoorbereid: vragen => vragen.map(v => ({ ronde: v.ronde || null, soort: v.soort || 'keuze', vraag: v.vraag, afbeelding: v.afbeelding || null, antwoorden: v.antwoorden || null, tijd: v.tijd || 30, juist: v.juist })),
    norm,
    quizStap: async (pin, actie) => live ? rpc('fj_quiz_stap', { p_pin: pin, p_actie: actie }) : (demoPin(pin), Quiz.stap(actie), Quiz.toestand(true)),
    quizKeur: async (pin, ridder, oordeel) => live ? rpc('fj_quiz_keur', { p_pin: pin, p_ridder: ridder, p_oordeel: oordeel }) : (demoPin(pin), Quiz.keur(ridder, oordeel), Quiz.toestand(true)),
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

/* Rondes: uit de lijst rondenamen (één per vraag, in volgorde) en het vraagnummer: de hoeveelste ronde, de naam,
   de hoeveelste vraag binnen die ronde en hoeveel vragen ze telt. Zonder rondes: null. */
function rondeInfo(rondes, nr) {
  if (!rondes?.length || !nr || !rondes[nr - 1]) return null;
  let r = 0, start = 0;
  for (let i = 0; i < nr; i++) if (i === 0 || rondes[i] !== rondes[i - 1]) { r++; start = i; }
  let eind = start; while (eind + 1 < rondes.length && rondes[eind + 1] === rondes[start]) eind++;
  let aantal = 0; rondes.forEach((x, i) => { if (i === 0 || x !== rondes[i - 1]) aantal++; });
  return { nr: r, naam: rondes[nr - 1], inRonde: nr - start, rondeTotaal: eind - start + 1, aantal, laatste: nr - 1 === eind };
}
