// Vercel serverless functie: GET /api/recept?url=<receptpagina>
// Haalt de pagina op en geeft de schema.org-Recipe terug die vrijwel elke receptsite (BBC Good Food, Allerhande, …)
// in een <script type="application/ld+json"> zet: naam, aantal personen, ingrediëntregels, afbeelding.
// De browser kan dit niet zelf (CORS), daarom deze kleine tussenstap. Alleen voor eigen gebruik; de bronlink blijft bewaard.
//
// Beveiliging (een functie die URLs ophaalt is een klassiek doelwit, "SSRF"):
//  - alleen http/https, standaardpoorten;
//  - het adres (ook na elke doorverwijzing) mag niet naar een intern/privé IP-adres wijzen;
//  - maximaal 3 doorverwijzingen, 8 s, 3 MB; alleen de geparste velden gaan terug, nooit de pagina zelf.
const dns = require('node:dns').promises;
const net = require('node:net');

function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return privateIp(v.slice(7));
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
}

async function safeUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('Geen geldige link'); }
  if (!/^https?:$/.test(u.protocol)) throw new Error('Alleen http(s)-links');
  if (u.port && !['80', '443'].includes(u.port)) throw new Error('Ongebruikelijke poort');
  const addrs = await dns.lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some(a => privateIp(a.address))) throw new Error('Dit adres is niet toegestaan');
  return u;
}

async function fetchPage(raw) {
  let url = await safeUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(8000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; boodschappen-receptimport/1.0)', accept: 'text/html' } });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) { url = await safeUrl(new URL(res.headers.get('location'), url).href); continue; }
    if (!res.ok) throw new Error(`De site gaf ${res.status}`);
    const reader = res.body.getReader(); let size = 0; const parts = [];
    for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 3e6) throw new Error('Pagina te groot'); parts.push(value); }
    return { html: Buffer.concat(parts.map(p => Buffer.from(p))).toString('utf8'), url: url.href };
  }
  throw new Error('Te veel doorverwijzingen');
}

// Zoek in alle JSON-LD-blokken naar een object met @type Recipe (ook in @graph of in een lijst).
function findRecipe(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const isRecipe = o => o && (o['@type'] === 'Recipe' || (Array.isArray(o['@type']) && o['@type'].includes('Recipe')));
  const walk = o => { if (!o || typeof o !== 'object') return null; if (isRecipe(o)) return o;
    for (const v of Array.isArray(o) ? o : [o['@graph'], o.mainEntity].filter(Boolean)) { const hit = Array.isArray(v) ? v.map(walk).find(Boolean) : walk(v); if (hit) return hit; } return null; };
  for (const b of blocks) { try { const hit = walk(JSON.parse(b.trim())); if (hit) return hit; } catch { /* kapot blok overslaan */ } }
  return null;
}
const text = v => String(Array.isArray(v) ? v[0] : (v && typeof v === 'object' ? v.url || v['@id'] || '' : v || '')).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();

module.exports = async (req, res) => {
  try {
    const page = await fetchPage(String(req.query.url || ''));
    const r = findRecipe(page.html);
    if (!r) return res.status(422).json({ error: 'Op deze pagina staat geen herkenbaar recept.' });
    const yieldTxt = text(r.recipeYield), persons = parseInt((yieldTxt.match(/\d+/) || [])[0], 10) || 4;
    res.setHeader('cache-control', 's-maxage=86400');
    res.status(200).json({ name: text(r.name).slice(0, 120), persons: Math.min(persons, 30), ingredients: (r.recipeIngredient || []).map(text).filter(Boolean).slice(0, 60),
      image: text(r.image), url: page.url });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Ophalen mislukt' });
  }
};
module.exports.findRecipe = findRecipe; module.exports.privateIp = privateIp; // voor tests
