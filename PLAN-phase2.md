# LoL Esports Dashboard — Phase 2

Phase 2 scope, agreed with the user. Excluded on purpose: notifications, calendar/.ics,
PWA/offline install, timezone override, and new unit tests.

## Goals

1. **Watch links** — live cards link to the real Twitch/YouTube stream via `getLive`.
2. **Following + search** — a top-level filter bar: search teams/leagues, and a ★ Following
   toggle showing only favorite-team matches.
3. **Spoiler-free mode** — hide winners/series scores on completed and live cards.
4. **Scrollspy** — highlight the active league in the header quick-nav.
5. **Standings** — per-league table derived from the `team.record` fields we already fetch.
6. **Robustness/technical** — API response validation, error boundary, snapshot fallback,
   dead-code cleanup, stable refresh interval, pagination warning.
7. **Accessibility & polish** — skip link, `aria-live`, always-visible external-link hint,
   league deep links, `<noscript>`, image alt text.

## Key API facts (probed 2026-10-07)

- `getLive?hl=en-US` → `data.schedule.events[]`, each `{ type, league:{slug,name,image}, streams:[{parameter, locale, provider, offset}] }`.
  Provider is e.g. `twitch`; stream URL is derived per provider. Match live schedule events
  by `league.slug`.
- `getSchedule` → still the data source. Completed matches carry `flags: ["isSpoiler"]`.
- lolesports deep link for a league: `https://lolesports.com/schedule?leagues={slug}`
  (confirmed format). No verified per-match URL, so non-live cards link to the league-filtered schedule.
- `getStandings` needs a `tournamentId` and is heavy; **not used** — standings come from the
  `team.record` we already have (works offline).

## Design decisions

- **Watch link preference**: English stream first, else Twitch, else first stream; fall back to
  `https://lolesports.com/live/{slug}` when no stream is found.
- **Snapshot fallback**: a `scripts/snapshot.mjs` writes `public/schedule.json`
  (`{fetchedAt, leagues, events}`) and runs in the deploy workflow (continue-on-error) before
  build, so the deployed site always ships a last-known-good dataset. On a cold start with no
  cache the app shows the snapshot instantly, then refreshes from the live API. The file is
  gitignored and generated, not committed.
- **Prefs**: add `spoilerFree: boolean` to `lolDash.prefs.v1`; `readPrefs` tolerates older
  payloads (defaults `false`).
- **Cache**: add `live: LiveEvent[]` to `lolDash.data.v1`; `readCache` tolerates older payloads
  (defaults `[]`) so no forced refetch.
- **Standings ranking**: best record per team (most games played), sorted by win rate then wins;
  only teams with ≥1 game; top 10 shown.
- **Prop threading** continues the existing explicit style (`favorites`, `spoilerFree`,
  `watchUrls` passed down), rather than introducing a context.
- **Pre-render**: evaluated and skipped. The shell would still be empty (data is client-fetched),
  so `<noscript>` covers the no-JS case instead.

## Commit plan (one commit per big change, no push until all done)

1. `Harden API layer` — runtime validation of responses, page-cap warning, remove dead `_nowMs`
   param from `hotScore` (+ update existing tests to compile).
2. `Stabilize schedule refresh interval` — read latest data via ref, stable interval identity.
3. `Add error boundary and noscript fallback`.
4. `Add snapshot fallback` — script + deploy step + cold-start hydration.
5. `Link live matches to their stream` — `getLive`, stream URL mapping, watch URLs.
6. `Add Following filter and match search`.
7. `Add spoiler-free mode`.
8. `Add scrollspy to the league nav`.
9. `Add per-league standings from season records`.
10. `Accessibility and polish` — skip link, aria-live announcer, visible external-link hint,
    league deep links, alt text.
11. `Document phase 2` — README updates.

## Verification

- `npm run build` (tsc strict + vite) and `npm test` green after every commit.
- `npm run lint` clean.
- Manual: `npm run dev` → live stream link (when a league is live), search, following toggle,
  spoiler-free toggle, standings, scrollspy highlight.
- `node scripts/snapshot.mjs` writes `public/schedule.json`; `npm run build && npm run preview` →
  deleting localStorage still renders from the snapshot before the network responds.

## Files

- Changed: `src/api.ts`, `src/logic.ts`, `src/logic.test.ts`, `src/useSchedule.ts`,
  `src/usePrefs.ts`, `src/App.tsx`, `src/components/*.tsx`, `src/time.ts` (if needed),
  `index.html`, `README.md`, `.gitignore`, `.github/workflows/deploy.yml`, `package.json`.
- New: `scripts/snapshot.mjs`, `src/components/ErrorBoundary.tsx`,
  `src/components/FilterBar.tsx`, `src/useActiveSection.ts`.
