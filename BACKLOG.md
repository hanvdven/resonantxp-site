# Resonant XP — Site Backlog

Items marked [user] require action from Han.

---

## In progress / active branch
- `claude/fix-field-notes-issues-JcrfS` — field notes interaction rewrite, geography, identity fixes

---

## Immediate (finish the site)

- [ ] **Contact form** — replace `YOUR_FORMSPREE_ID` in contact.html [user: sign up at formspree.io → new form → copy ID]
- [ ] **Hero animation speed** — "Come in." button appears at ~11s, too slow. Halve delays or pull button outside animated scene.
- [ ] **Open Graph tags** — og:title, og:description, og:image on all pages. Required for LinkedIn link previews.
- [ ] **Contact form mailto fallback** — add `<a href="mailto:contact@resonantxp.com">` fallback below the form for until Formspree is live.
- [ ] **GDPR** — one-line consent note under submit button + minimal /privacy page (Belgian legal requirement for contact form).

---

## Business / growth

- [ ] **LinkedIn link** — add Han's LinkedIn profile URL to footer on all pages.
- [ ] **Plausible analytics** — add `<script defer data-domain="resonantxp.com" src="https://plausible.io/js/script.js"></script>` to all pages. Free plan, GDPR-compliant. [user: sign up at plausible.io]
- [ ] **Field Notes email subscription** — small email form at top of Field Notes page ("get a new field note every two weeks"). Buttondown.email is simplest: free tier, plain-text emails, no bloat.

---

## Design / UX

- [ ] **Favicon** — update to better match the 5-wave logo. Use the unmodified 5-line SVG wave pattern from the header.
- [ ] **Mobile nav** — 5 links + separator wraps awkwardly on small screens. Consider condensed layout or hamburger.
- [ ] **Field Notes tag filter** — simple filter by theme (leadership / AI / design / communication) as pool grows.
- [ ] **Scroll indicator on home** — subtle cue after "Come in." appears to invite scrolling.

---

## Technical

- [ ] **Font loading** — move Google Fonts from `@import` in CSS to `<link rel="preconnect">` + `<link rel="stylesheet">` in `<head>`. Faster first paint.
- [ ] **Clean URLs** — add `vercel.json` with `"cleanUrls": true` so `/experiences` works instead of `/experiences.html`.
- [ ] **Page title improvement** — home title is just "Resonant XP". Add tagline: "Resonant XP | Experience design for leadership teams".
- [ ] **Custom 404 page** — branded 404.html, link back to home.
- [ ] **Sitemap.xml** — list all pages, submit to Google Search Console.

---

## Content (user)

- [ ] **Formspree ID** — replace `YOUR_FORMSPREE_ID` in contact.html once signed up.
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
