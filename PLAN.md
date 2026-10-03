# LoL Esports Dashboard — Phase 1

## Context
Greenfield (`/home/bekto/Dev/EsportsDashboard` contains only this `PLAN.md`, not a git repo). Build a static LoL esports dashboard: one HOT section (best upcoming/live matches) + one section per league with activity. Matches sorted by time-until-start, times shown in the viewer's local timezone. Data cached locally so reloads are instant; hosted free on GitHub Pages with fresh data fetched from the browser.

Verified facts (probed, re-confirmed 2026-10-03):
- API base `https://esports-api.lolesports.com/persisted/gw`, header `x-api-key: 0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z` (public key used by lolesports.com). Responses carry `access-control-allow-origin: *` and `access-control-allow-headers: Content-Type,X-Api-Key` → browser can call directly from GitHub Pages; no backend.
- `GET /getLeagues?hl=en-US` → `data.leagues[]`: `{id, slug, name, region, image, priority, displayPriority:{position:number, status:"force_selected"|"selected"|"not_selected"|"hidden"}}` (50 leagues).
- `GET /getSchedule?hl=en-US[&pageToken=…]` → `data.schedule.{pages:{older:string|null, newer:string|null}, events[]}`. Default page ≈ 40 most recent completed + 40 next unstarted, all leagues. Following `pages.newer` until `null` returns all remaining future events (1 extra page observed, 51 events).
- Event: `{startTime: ISO-UTC, state: "unstarted"|"inProgress"|"completed", type: "match"|"show", blockName: string, league:{name, slug}, match:{id, flags:string[], teams:[{name, code, image, result:{outcome:"win"|"loss"|null, gameWins:number}|null, record:{wins, losses}|null}], strategy:{type:"bestOf", count:number}}}`. TBD teams have `code: "TBD"`. Schedule events only carry league `slug`, join to getLeagues by slug.
- Observed `blockName` values: `Finals`, `Knockouts`, `Playoffs`, `Regional Qualifier`, `Swiss`.
- Image URLs are sometimes `http://static.lolesports.com/...`; `https://` variant serves 200.
- Toolchain: node v24.21.0, npm 11.19.0.

## Approach

### 1. Scaffold
- The project dir is not empty (`PLAN.md`), so do NOT run create-vite in place (its "Remove existing files" prompt would delete the plan). Scaffold in a temp dir and copy in without overwriting:
  ```sh
  rm -rf /tmp/lol-scaffold
  npm create vite@latest /tmp/lol-scaffold -- --template react-ts
  cp -rn /tmp/lol-scaffold/. .
  rm -rf /tmp/lol-scaffold
  npm i
  npm i -D tailwindcss @tailwindcss/vite vitest
  ```
- `vite.config.ts`: plugins `react()`, `tailwindcss()`; `base: './'` (relative assets → works under any GitHub Pages repo path; app has no router).
- `src/index.css`: replace content with `@import "tailwindcss";`. Delete Vite demo assets/`App.css`. Dark theme by default (`bg-zinc-950 text-zinc-100` on body).
- `git init` (`.gitignore` comes from the template).
- package.json scripts: keep `dev`, `build`, `preview`; add `"test": "vitest run"`.

### 2. API + types — `src/api.ts`
- Types `League`, `ScheduleEvent`, `Team`, `MatchState` mirroring the shapes above (only fields listed). Drop events with `type !== "match"` on ingest.
- `const API = "https://esports-api.lolesports.com/persisted/gw"`, `const KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"`.
- `fetchLeagues(): Promise<League[]>` and `fetchSchedule(): Promise<ScheduleEvent[]>`: plain `fetch` with `x-api-key` header; schedule fetches default page then loops `pageToken=pages.newer` until null (hard cap 5 pages to avoid infinite loop). Non-2xx → throw `Error(\`API ${status}\`)`.
- `https(url)`: `url.replace(/^http:/, "https:")`; apply to league/team images at ingest.

### 3. Cache + refresh — `src/useSchedule.ts`
- localStorage key `lolDash.data.v1` storing `{fetchedAt:number, leagues:League[], events:ScheduleEvent[]}`. Wrap parse in try/catch; corrupt/missing → treat as empty.
- Hook `useSchedule(): {leagues, events, fetchedAt, loading, error, refresh}`:
  - On mount: hydrate from cache immediately (instant render). If cache missing or `Date.now() - fetchedAt > 5 min` → fetch both endpoints in parallel, write cache, set state.
  - Interval refresh: every 60 s if any event is `inProgress` or starts within 15 min, else every 5 min. Skip when `document.visibilityState !== "visible"`; on `visibilitychange` → visible, refresh if stale (>5 min).
  - Fetch error: keep cached data, set `error` string; UI shows small banner "Couldn't refresh — showing data from {relative time}" with Retry button calling `refresh()`. No cache + error → full-page error with Retry.
  - Header shows "Updated {x} min ago" + manual refresh button.
- `useNow(intervalMs = 30_000)` hook returning `Date.now()` tick for countdowns, in `src/time.ts`.

### 4. Pure logic — `src/logic.ts` (no React; unit-tested)
- `sortUpcoming(events)`: `inProgress` first, then `unstarted` by `startTime` ascending.
- `recentResults(events, n = 5)`: `completed`, by `startTime` descending, first n.
- `hotScore(e, nowMs): number`:
  - League: `worlds|msi|first_stand|ewc_lol` +50; `lck|lpl` +35; `lec|lcs|lcp|cblol-brazil` +25; else 0.
  - Stage (`blockName.toLowerCase()`): contains `semifinal|quarterfinal|playoff|knockout|bracket` +15; else contains `final` +25 (check the first list before `final`).
  - `strategy.count === 5` +10; `=== 3` +5.
  - Any team `code === "TBD"` −20.
  - Both teams have `record` with ≥1 game and |winrate diff| ≤ 0.15 → +10.
  - `state === "inProgress"` +15.
- `hotMatches(events, nowMs)`: candidates = `inProgress` or `unstarted` with start ≤ now + 7 days; keep `hotScore ≥ 30`; take top 8 by score; return them re-sorted with `sortUpcoming` (section is time-ordered, score only selects).
- `leagueSections(leagues, events, prefs)`: group events by `league.slug`; include leagues with ≥1 live/upcoming event and not in `prefs.hidden`; order = `prefs.order` slugs first (in that order), then remaining by status rank (`force_selected` 0, `selected` 1, `not_selected` 2, `hidden` 3) then `displayPriority.position`. Events whose slug has no league entry → synthesize section from `event.league.name`, ranked last.
- HOT thresholds (score ≥ 30, top 8, 7-day window) are named constants at top of `logic.ts`.

### 5. Time display — `src/time.ts`
- Local time via `Intl.DateTimeFormat(undefined, {weekday:"short", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"})` (browser timezone automatically). Show timezone once in header: `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- `countdown(startMs, nowMs)`: `<1h` → `in 42m`; `<24h` → `in 5h 12m`; else `in 3d 4h`; past start and unstarted → `starting soon`. `inProgress` renders red pulsing `LIVE` badge instead.
- Day dividers inside a section when date changes (`Today`, `Tomorrow`, else formatted date) — local dates.

### 6. UI — `src/App.tsx` + `src/components/*`
- Layout: sticky header (title, timezone, updated-ago, refresh, settings gear). Body: HOT section full-width at top, then league sections in responsive grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`).
- `MatchCard`: team logos + codes, `Bo{count}`, blockName, local start time, countdown/LIVE badge, `record` W-L under team code. Completed: score `gameWins` with winner bold. Live card links to `https://lolesports.com/live/{league.slug}` (`target="_blank"`); others link to `https://lolesports.com/schedule`.
- `LeagueSection`: header with league image + name + region; list upcoming (`sortUpcoming`), show first 6 with "Show all (N)" expander; collapsible "Recent results" (`recentResults`, collapsed by default).
- HOT section: same cards, flame accent styling; if empty → "No hot matches in the next 7 days".
- Skeleton cards while `loading` and no cache. Empty state if no sections: "No upcoming matches".
- `SettingsPanel` (slide-over): list all leagues that have any events (sections + hidden), each row: checkbox show/hide, ↑/↓ buttons to reorder, "Reset" button. Use buttons, not drag-and-drop (no extra dependency).
- Prefs in localStorage key `lolDash.prefs.v1`: `{hidden: string[] /*slugs*/, order: string[] /*slugs*/}`; `src/usePrefs.ts` hook, try/catch parse, default `{hidden:[], order:[]}`.
  - Reorder (↑/↓) writes the full current visible order into `order`.
  - Hide: add slug to `hidden`, remove it from `order`.
  - Unhide: remove slug from `hidden`, append it to the end of `order` (only if `order` is non-empty; if empty, it falls back to default ranking).
  - Reset: `{hidden:[], order:[]}`.

### 7. Deploy — `.github/workflows/deploy.yml`
- Trigger: `push` to `main` + `workflow_dispatch`. Jobs: `actions/checkout@v4` → `actions/setup-node@v4` (node 22, cache npm) → `npm ci` → `npm test` → `npm run build` → `actions/upload-pages-artifact@v3` (path `dist`) → `actions/deploy-pages@v4`. Permissions `pages: write`, `id-token: write`, `contents: read`; concurrency group `pages`.
- No cron/data job: data is fetched live by clients.

## Critical files & anchors
- `src/logic.ts` — all sorting/grouping/HOT rules; only place ranking lives.
- `src/useSchedule.ts` — cache key, TTL, refresh cadence, error fallback.
- `src/api.ts` — pagination loop over `pages.newer`, image https rewrite.
- `src/usePrefs.ts` — hide/unhide/reorder rules for `order`.
- `vite.config.ts` — `base: './'` required for Pages subpath.

## Verification
1. After step 1: `PLAN.md` still exists; `npm run dev` serves the Vite page.
2. `npm test` — `src/logic.test.ts` covering: `sortUpcoming` puts inProgress before earlier-unstarted; `hotScore` ordering (Worlds Final Bo5 > LCK regular Bo3 > NACL Bo1; TBD penalty; "Semifinals" scores +15 not +25); `hotMatches` excludes events >7 days out and returns time-sorted; `leagueSections` honors `prefs.order` then displayPriority and drops hidden/no-upcoming leagues; `countdown` boundaries (59m, 1h, 23h59m, 25h).
3. `npm run dev`, open browser: HOT + league sections render with real data; DevTools Network shows `getLeagues` + `getSchedule` (+ newer page) with 200s.
4. Reload page → content appears instantly from cache, no network call within 5 min (Network tab). Set `fetchedAt` in `localStorage['lolDash.data.v1']` to 0 → reload triggers fetch.
5. Timezone: DevTools → Sensors → Location override (e.g. Tokyo) → times and header timezone change; ordering unchanged.
6. DevTools offline + stale cache → banner "Couldn't refresh…", cached cards still shown; clear storage + offline → full-page error with Retry.
7. Settings: hide LEC, move CBLOL to top, reload → persists. Unhide LEC → appears last; reload → still last.
8. `npm run build && npm run preview` → works from built assets (relative base).

## Assumptions & contingencies
- Unofficial API/key: if key starts returning 403, replace `KEY` with the one in lolesports.com page source (single constant). If CORS ever disappears, fallback is a GitHub Action cron writing `public/schedule.json` — not built now.
- User creates GitHub repo, pushes, and sets Settings → Pages → Source = "GitHub Actions".
- Recent results limited to the ~40 completed events the default schedule page returns (all leagues combined); leagues may show fewer than 5 results. Acceptable for phase 1.
- "Lower Bracket Final" scores +15 (bracket match wins over final). Acceptable for phase 1.
