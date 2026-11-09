# Agent Instructions — resonantxp-site

Instructions from Han (the owner) for every AI agent working in this repository.

## Merging

- **Ask Han before merging.** (The earlier exception for `boodschappen.html`, Han 2026-11-02, moved with the app to
  `hanvdven/boodschappen`.) This does not extend to other repositories (e.g. `music-melody-trainer`, which has its
  own UAT process).

## Deploy

Static site, no build step. `main` deploys via GitHub Pages (`.github/workflows/deploy.yml`) and Vercel
(`vercel.json`, `cleanUrls`: `about.html` is served at `/about`).

## boodschappen — moved out

The shopping-list app lives in its own repo since 2026-11-09: `hanvdven/boodschappen`, served at
`boodschappen.resonantxp.com`. `vercel.json` here only redirects `/boodschappen` there (308). Do not add app files back.
