# Resonant XP — Backlog

## ✅ Done

- `xp-framework.html`: 6-panel horizontal side-scroll, Explore/Expand oscillating, random questions, wraps
- `experiences.html`: herschreven als theatre playbill (licht thema)
- `contact.html`: RESONA, dynamische tijds-SD, intro beats, nieuwe scriptflow, BLACKOUT
- `field-notes.html`: footer dark mode

---

## field-notes.html

**Card background color**
- Huidig: `rgba(255,255,255,0.06)` — vervangen door volledig transparant zodat de golven erdoorheen schijnen

**Text size**
- Tekst in kaarten te groot; verkleinen zodat het past

**Card interaction (currently broken)**
- Click een kaart → verwijder 1–3 andere kaarten; draai de aangeklikte kaart om
- Click een andere kaart (of dezelfde) → verwijder alle omgedraaide kaarten; vervang alle missende kaarten zodat er altijd 5 zichtbaar zijn

---

## index.html (home)

**Blur column behind hero text**
- Voeg een kolom met backdrop blur toe achter de hero-tekst
- Voorkomt dat de animatielijnen de leesbaarheid storen

---

## Bugs

**`/field-notes/asdf` → unstyled 404**
- URL-pad met `field-notes/` als sub-pad breekt de normale 404-styling
- Waarschijnlijk overschrijft het `field-notes`-segment de routing/styling logica

---

## 404 page

**Redesign**
- Verwijder de langzaam-onthullende tekst (voelt generiek)
- Vervang door een heel grote blauwe inkblot "404" die het scherm vult
- Subline: "you're not supposed to be here"
- Navigatie bovenaan laat de gebruiker teruggaan — geen andere CTA nodig
