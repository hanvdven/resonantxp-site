# Resonant XP — Backlog

## ✅ Done

- `xp-framework.html`: 6-panel horizontal side-scroll, Explore/Expand oscillating, random questions, wraps

---

## experiences.html

**New concept: theatre playbill**

- Replace current panel system (moved to `xp-framework.html`) with a playbill / theatre programme
- Dark background, white/light typography, classical layout
- Each XP listed as a production: XP number, title, short description, *what emerges* line
- CTA to contact at the bottom

---

## field-notes.html

**Card background color**
- Current card color is a grey-ish tone; re-achieve that same color using `opacity: 0` (transparent) so the wave background shows through

**Text size**
- Text in cards is too large and doesn't fit; reduce to fit the card format

**Card interaction (currently broken)**
- Click a card → remove 1–3 other cards; turn the clicked card over
- Click any card (including a turned-over one) → remove all turned-over cards; replace all missing cards so there are always 5 visible

**Footer dark mode**
- The field-notes footer should be dark mode, consistent with the rest of the page

---

## index.html (home)

**Blur column behind hero text**
- Add a horizontal/vertical column with a backdrop blur behind the hero text lines
- Prevents animated wave lines from interfering with readability

---

## Bugs

**`/field-notes/asdf` → unstyled 404**
- URL path containing `field-notes/` sub-path triggers something that breaks normal 404 styling
- Likely the `field-notes` segment in the path overrides routing/styling logic

---

## 404 page

**Redesign**
- Remove the slowly-revealed text (reuse from other pages feels generic)
- Replace with a very large blue inky "404" filling the screen
- Subline: "you're not supposed to be here"
- Top navigation lets the user go back — no other CTA needed
