# Agent Instructions — resonantxp-site

Instructions from Han (the owner) for every AI agent working in this repository.

## Merging

- **`boodschappen.html`: merge directly to `main`** (Han 2026-11-02). Changes that touch only
  `boodschappen.html` may be merged by the agent without asking, once its own checks pass. Still work via
  a PR (Vercel builds a preview per PR and it leaves a trail), then merge it yourself.
- **Everything else in this repo: ask Han before merging.** The rule above does not extend to other
  files, and not to other repositories (e.g. `music-melody-trainer`, which has its own UAT process).

## Deploy

Static site, no build step. `main` deploys via GitHub Pages (`.github/workflows/deploy.yml`) and Vercel
(`vercel.json`, `cleanUrls`), so `boodschappen.html` is served at `/boodschappen`.

## boodschappen.html — shopping lists

A self-contained page (inline CSS + JS, no dependencies). Deliberately NOT wired into the site's
`style.css`/`header.js`/`nav.js`, and `noindex`: it is a personal tool, not part of the XP site.

- **Storage:** `localStorage` key `boodschappen.v1`, per browser only (no server, no sync).
  Export/import JSON is the backup. The data has a version field `v`; when adding fields, extend
  `migrate()` so it only fills in what is missing and never overwrites existing data.
- **Core idea:** recipe ingredients are never copied onto a list. `rowsFor(list)` derives them on every
  render from (recipe × servings) and merges equal (name, unit) pairs, so scaling and recipe edits stay
  correct. Ticking off a recipe ingredient lives in `list.done[key]`; loose items are in `list.items`.
- **Open Food Facts** (nutrition + allergens) is fetched live from the browser. It is blocked from the
  Claude Code sandbox (proxy 403), so test it with a mocked response (Playwright `page.route`) and say so.
- **Allergens:** missing data must show as "niet gecontroleerd", never as safe. Do not add any wording
  that suggests something is allergen-free.
- **Overview view:** the lines between ingredients and recipes are an SVG drawn by `drawLines()` after
  every render from measured DOM positions; call it after any layout change.
- Test at phone width (390px) and check `document.documentElement.scrollWidth` stays 390.
