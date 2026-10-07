// Fetches leagues + the full schedule and writes public/schedule.json.
// The deploy workflow runs this before `vite build`, so the deployed site always
// ships a last-known-good dataset that the app shows on a cold start while the
// live API request is still in flight (or fails).
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://esports-api.lolesports.com/persisted/gw'
const KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'
const MAX_PAGES = 5

const https = (url) => String(url ?? '').replace(/^http:/, 'https:')

async function get(path, params = {}) {
  const qs = new URLSearchParams({ hl: 'en-US', ...params })
  const res = await fetch(`${API}/${path}?${qs}`, { headers: { 'x-api-key': KEY } })
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`)
  return res.json()
}

async function main() {
  const leaguesBody = await get('getLeagues')
  const leagues = leaguesBody.data.leagues.map((l) => ({ ...l, image: https(l.image) }))

  const events = []
  const seen = new Set()
  let token = null
  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await get('getSchedule', token ? { pageToken: token } : {})
    for (const e of page.data.schedule.events) {
      if (e.type !== 'match' || !e.match || seen.has(e.match.id)) continue
      seen.add(e.match.id)
      events.push({
        ...e,
        type: 'match',
        match: { ...e.match, teams: e.match.teams.map((t) => ({ ...t, image: https(t.image) })) },
      })
    }
    token = page.data.schedule.pages.newer
    if (!token) break
  }

  const dir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')
  await mkdir(dir, { recursive: true })
  await writeFile(resolve(dir, 'schedule.json'), JSON.stringify({ fetchedAt: Date.now(), leagues, events }))
  console.log(`snapshot: wrote ${leagues.length} leagues, ${events.length} events`)
}

main().catch((e) => {
  console.error('snapshot failed:', e.message)
  process.exit(1)
})
