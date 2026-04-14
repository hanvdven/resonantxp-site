# Resonant XP — Site Backlog

Items marked [user] require action from Han.

---

## In progress / active branch
- `claude/fix-field-notes-issues-JcrfS` — field notes interaction rewrite, geography, identity fixes, site completion

---

## Immediate (finish the site)

- [x] **Contact form** — Formspree endpoint live (`xdaynqov`)
- [x] **Hero animation speed** — halved all delays; "Come in." now visible at ~6.5s
- [x] **GDPR** — consent note under submit button + /privacy page (Belgian law compliant)
- [x] **Contact form mailto fallback** — `lab@resonantxp.com` below the form
- [x] **Font loading** — moved Google Fonts from `@import` in CSS to `<link rel="preconnect">` in each page `<head>`
- [x] **Clean URLs** — `vercel.json` with `"cleanUrls": true` added
- [x] **Page title homepage** — "Resonant XP | Experience design for leadership teams"
- [x] **Custom 404 page** — branded 404.html with poetic text, link back to home
- [x] **Favicon** — updated to 5-wave logo (exact header paths, dark background)
- [x] **Sitemap.xml** — deferred; submit to Google Search Console once live on resonantxp.com

---

## Business / growth

- [ ] **LinkedIn link** — add Han's LinkedIn profile URL to footer on all pages. [user: provide URL]
- [ ] **Plausible analytics** — add `<script defer data-domain="resonantxp.com" src="https://plausible.io/js/script.js"></script>` to all pages. Free plan, GDPR-compliant. [user: sign up at plausible.io]
- [ ] **Field Notes email subscription** — small email form at top of Field Notes page. Buttondown.email: free tier, no bloat.

---

## Design / UX

- [ ] **Mobile nav** — 5 links + separator wraps awkwardly on small screens. Consider condensed layout or hamburger.
- [ ] **Field Notes tag filter** — simple filter by theme (leadership / AI / design / communication) as pool grows.
- [ ] **Scroll indicator on home** — subtle cue after "Come in." appears to invite scrolling.

---

## Field Notes — content backlog

- [ ] **Famous use cases as field notes** — translate well-known organisational or design cases into the field note format (provocation + reflection). Lego AFOL case is a starting example. Others: Nokia/iPhone, Kodak/digital, Xerox PARC, Gore-Tex culture.
- [ ] **Fact-check Lego note specifics** — the adult fan market claim is accurate in principle; verify exact revenue share or growth figures before citing numbers publicly.
- [ ] **More spontaneous decisions material** — explore Kahneman System 1/2 framing, studies on unplanned purchase decisions, pre-meeting corridor effect.
- [ ] **Field Notes tag filter** — see Design/UX above.

---

## Technical

- [ ] **Sitemap.xml** — list all pages, submit to Google Search Console once live on `resonantxp.com`.
- [ ] **OG tags** — og:title, og:description, og:image on all pages. Required for LinkedIn link previews.

---

## Content (user)

- [ ] **LinkedIn URL** — provide URL to add to footer.
- [ ] **Real references** — replace placeholder "From practice" entries with real (anonymised) cases when ready.
- [ ] **Collaborators** — Ralf Wetzel and Charlotte De Metsenaere (Zeggedis) pending permission to add back.
- [ ] **XP experience specifics** — add concrete details to XP-01/02/03: duration, group size, what the room looks like.
- [ ] **Social proof / quote** — even one anonymised quote from a past participant would strengthen the Experiences page.

---

## Longer term (spec vision)

- [ ] Field Notes with thematic card connections ("related fragments") — graph navigation
- [ ] Framework page as interactive oscillation (not static text)
- [ ] State that persists between visits ("you've been here before")
- [ ] Phase system from specifications.md: arrival → destabilisation → involvement → disorientation
- [ ] Choice cards, narrative threads, rupture events (full specifications.md implementation)
