# LoL Esports Dashboard

Static dashboard of upcoming/live League of Legends esports matches: a HOT section with the best matches of the next 7 days plus one section per active league. Times are shown in your local timezone. Data comes straight from the lolesports API in the browser and is cached in `localStorage`.

```sh
npm i
npm run dev      # dev server
npm test         # unit tests (src/logic.test.ts)
npm run build    # static build → dist/
```

Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

See `PLAN.md` for the design and ranking rules.
