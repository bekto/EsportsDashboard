# LoL Esports Dashboard

Static dashboard of upcoming/live League of Legends esports matches: a HOT section with the best matches of the next 7 days plus one section per active league. Times are shown in your local timezone. Data comes straight from the lolesports API in the browser and is cached in `localStorage`.

Features:

- **HOT** — best matches of the next 7 days, with a featured spotlight card.
- **Watch links** — live matches link straight to their Twitch/YouTube stream (from `getLive`); other matches link to the league on lolesports.
- **Following + search** — press `/` to search teams, leagues or stages, or toggle ★ Following to see only your favorite teams (across every league, upcoming and recent).
- **Spoiler-free mode** — hides winners and series scores on completed/live matches until you hover (⚙ Settings).
- **Per-league standings** — an approximate table built from each team's season record.
- **Settings** — favorite teams (boosted in HOT), show/hide and reorder leagues, spoiler-free mode. Stored in this browser.
- **Resilience** — responses are validated, a render error boundary catches UI crashes, and the deployed build ships a last-known-good snapshot shown on a cold start.

```sh
npm i
npm run dev        # dev server
npm test           # unit tests (src/logic.test.ts)
npm run lint       # oxlint
npm run build      # static build → dist/
npm run snapshot   # write public/schedule.json (last-known-good data)
```

Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`. The workflow refreshes `public/schedule.json` before building (best-effort) so the site always has a fallback dataset.

See `PLAN.md` for the phase 1 design and ranking rules, and `PLAN-phase2.md` for phase 2.
