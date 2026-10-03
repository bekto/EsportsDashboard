const API = 'https://esports-api.lolesports.com/persisted/gw'
// Public key used by lolesports.com itself. If it starts returning 403, copy the current one from their page source.
const KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'
const MAX_PAGES = 5

export type DisplayStatus = 'force_selected' | 'selected' | 'not_selected' | 'hidden'
export type MatchState = 'unstarted' | 'inProgress' | 'completed'

export interface League {
  id: string
  slug: string
  name: string
  region: string
  image: string
  priority: number
  displayPriority: { position: number; status: DisplayStatus }
}

export interface Team {
  name: string
  code: string
  image: string
  result: { outcome: 'win' | 'loss' | null; gameWins: number } | null
  record: { wins: number; losses: number } | null
}

export interface ScheduleEvent {
  startTime: string // ISO UTC
  state: MatchState
  type: 'match'
  blockName: string
  league: { name: string; slug: string }
  match: {
    id: string
    flags: string[]
    teams: Team[]
    strategy: { type: string; count: number }
  }
}

export const https = (url: string) => url.replace(/^http:/, 'https:')

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ hl: 'en-US', ...params })
  const res = await fetch(`${API}/${path}?${qs}`, { headers: { 'x-api-key': KEY } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return (await res.json()) as T
}

export async function fetchLeagues(): Promise<League[]> {
  const body = await get<{ data: { leagues: League[] } }>('getLeagues')
  return body.data.leagues.map((l) => ({ ...l, image: https(l.image) }))
}

type RawEvent = Omit<ScheduleEvent, 'type'> & { type: string }
type SchedulePage = {
  data: { schedule: { pages: { older: string | null; newer: string | null }; events: RawEvent[] } }
}

export async function fetchSchedule(): Promise<ScheduleEvent[]> {
  const events: ScheduleEvent[] = []
  const seen = new Set<string>()
  let token: string | null = null
  for (let i = 0; i < MAX_PAGES; i++) {
    const page: SchedulePage = await get<SchedulePage>('getSchedule', token ? { pageToken: token } : {})
    for (const e of page.data.schedule.events) {
      if (e.type !== 'match' || !e.match || seen.has(e.match.id)) continue
      seen.add(e.match.id)
      const teams = e.match.teams.map((t) => ({ ...t, image: https(t.image) }))
      events.push({ ...e, type: 'match', match: { ...e.match, teams } })
    }
    token = page.data.schedule.pages.newer
    if (!token) break
  }
  return events
}
