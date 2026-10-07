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

// --- Response parsing ------------------------------------------------------
// The lolesports API is unofficial and unversioned, so validate what we read
// instead of blindly casting. Envelope failures throw; individually malformed
// events are skipped so one bad row can't blank the whole dashboard.

const DISPLAY_STATUSES: ReadonlySet<string> = new Set([
  'force_selected',
  'selected',
  'not_selected',
  'hidden',
])
const MATCH_STATES: ReadonlySet<string> = new Set(['unstarted', 'inProgress', 'completed'])

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function fail(what: string): never {
  throw new Error(`Unexpected API response: ${what}`)
}

function parseLeague(v: unknown): League | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.slug) || !isStr(v.name)) return null
  const dp = v.displayPriority
  if (!isObj(dp) || !isNum(dp.position) || !isStr(dp.status) || !DISPLAY_STATUSES.has(dp.status)) {
    return null
  }
  return {
    id: v.id,
    slug: v.slug,
    name: v.name,
    region: isStr(v.region) ? v.region : '',
    image: isStr(v.image) ? https(v.image) : '',
    priority: isNum(v.priority) ? v.priority : 0,
    displayPriority: { position: dp.position, status: dp.status as DisplayStatus },
  }
}

function parseRecord(v: unknown): { wins: number; losses: number } | null {
  if (isObj(v) && isNum(v.wins) && isNum(v.losses)) return { wins: v.wins, losses: v.losses }
  return null
}

function parseResult(v: unknown): { outcome: 'win' | 'loss' | null; gameWins: number } | null {
  if (!isObj(v) || !isNum(v.gameWins)) return null
  const outcome = v.outcome === 'win' || v.outcome === 'loss' ? v.outcome : null
  return { outcome, gameWins: v.gameWins }
}

function parseTeam(v: unknown): Team | null {
  if (!isObj(v) || !isStr(v.code) || !isStr(v.name)) return null
  return {
    name: v.name,
    code: v.code,
    image: isStr(v.image) ? https(v.image) : '',
    result: parseResult(v.result),
    record: parseRecord(v.record),
  }
}

function parseEvent(v: unknown): ScheduleEvent | null {
  if (!isObj(v) || v.type !== 'match' || !isStr(v.state) || !MATCH_STATES.has(v.state)) return null
  if (!isStr(v.startTime) || !isObj(v.league) || !isStr(v.league.slug)) return null
  const match = v.match
  if (!isObj(match) || !isStr(match.id) || !Array.isArray(match.teams) || !isObj(match.strategy)) {
    return null
  }
  const teams = match.teams.map(parseTeam)
  if (teams.some((t) => t === null)) return null
  return {
    startTime: v.startTime,
    state: v.state as MatchState,
    type: 'match',
    blockName: isStr(v.blockName) ? v.blockName : '',
    league: { name: isStr(v.league.name) ? v.league.name : '', slug: v.league.slug },
    match: {
      id: match.id,
      flags: Array.isArray(match.flags) ? match.flags.filter(isStr) : [],
      teams: teams as Team[],
      strategy: {
        type: isStr(match.strategy.type) ? match.strategy.type : 'bestOf',
        count: isNum(match.strategy.count) ? match.strategy.count : 1,
      },
    },
  }
}

async function get(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams({ hl: 'en-US', ...params })
  const res = await fetch(`${API}/${path}?${qs}`, { headers: { 'x-api-key': KEY } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function fetchLeagues(): Promise<League[]> {
  const body = await get('getLeagues')
  if (!isObj(body) || !isObj(body.data) || !Array.isArray(body.data.leagues)) {
    fail('getLeagues')
  }
  return body.data.leagues.map(parseLeague).filter((l): l is League => l !== null)
}

export async function fetchSchedule(): Promise<ScheduleEvent[]> {
  const events: ScheduleEvent[] = []
  const seen = new Set<string>()
  let token: string | null = null
  let skipped = 0
  for (let i = 0; i < MAX_PAGES; i++) {
    const body = await get('getSchedule', token ? { pageToken: token } : {})
    if (!isObj(body) || !isObj(body.data) || !isObj(body.data.schedule)) fail('getSchedule')
    const schedule = body.data.schedule
    if (!Array.isArray(schedule.events)) fail('getSchedule.events')
    for (const raw of schedule.events) {
      const event = parseEvent(raw)
      if (!event) {
        skipped++
        continue
      }
      if (seen.has(event.match.id)) continue
      seen.add(event.match.id)
      events.push(event)
    }
    const pages = schedule.pages
    token = isObj(pages) && isStr(pages.newer) ? pages.newer : null
    if (!token) break
    if (i === MAX_PAGES - 1) {
      // More future events exist than we fetched: surface it instead of silently truncating.
      console.warn(`lolesports: schedule truncated at ${MAX_PAGES} pages`)
    }
  }
  if (skipped > 0) console.warn(`lolesports: skipped ${skipped} malformed schedule event(s)`)
  return events
}

export interface ScheduleData {
  fetchedAt: number
  leagues: League[]
  events: ScheduleEvent[]
}

export interface LiveStream {
  parameter: string
  locale: string
  provider: string
}

export interface LiveEvent {
  league: { slug: string }
  streams: LiveStream[]
}

function parseStream(v: unknown): LiveStream | null {
  if (!isObj(v) || !isStr(v.parameter) || !isStr(v.provider)) return null
  return { parameter: v.parameter, provider: v.provider, locale: isStr(v.locale) ? v.locale : '' }
}

/**
 * Currently live broadcasts, used only to build "watch" links. Supplementary,
 * so any failure degrades to an empty list rather than failing a refresh.
 */
export async function fetchLive(): Promise<LiveEvent[]> {
  try {
    const body = await get('getLive')
    if (!isObj(body) || !isObj(body.data) || !isObj(body.data.schedule)) return []
    const raw = body.data.schedule.events
    if (!Array.isArray(raw)) return []
    const out: LiveEvent[] = []
    for (const e of raw) {
      if (!isObj(e) || !isObj(e.league) || !isStr(e.league.slug)) continue
      const streams = Array.isArray(e.streams)
        ? e.streams.map(parseStream).filter((s): s is LiveStream => s !== null)
        : []
      if (streams.length > 0) out.push({ league: { slug: e.league.slug }, streams })
    }
    return out
  } catch {
    return []
  }
}

const PROVIDER_URLS: Record<string, (channel: string) => string> = {
  twitch: (c) => `https://www.twitch.tv/${c}`,
  youtube: (c) => `https://www.youtube.com/${c}`,
  afreeca: (c) => `https://play.afreecatv.com/${c}`,
  afreecatv: (c) => `https://play.afreecatv.com/${c}`,
}

/** A watchable URL for a stream, or null when the provider isn't recognized. */
export function streamUrl(stream: LiveStream): string | null {
  const make = PROVIDER_URLS[stream.provider.toLowerCase()]
  return make ? make(encodeURIComponent(stream.parameter)) : null
}

/** Prefer an English broadcast, then Twitch, then whatever is available. */
export function pickStream(streams: LiveStream[]): LiveStream | null {
  if (streams.length === 0) return null
  return (
    streams.find((s) => s.locale.toLowerCase().startsWith('en')) ??
    streams.find((s) => s.provider.toLowerCase() === 'twitch') ??
    streams[0]
  )
}

/**
 * Last-known-good dataset baked into the build (see scripts/snapshot.mjs).
 * Best-effort: returns null when absent or malformed, so callers can ignore it.
 */
export async function fetchSnapshot(): Promise<ScheduleData | null> {
  try {
    const url = new URL('schedule.json', document.baseURI)
    const res = await fetch(url)
    if (!res.ok) return null
    const body: unknown = await res.json()
    if (!isObj(body) || !Array.isArray(body.leagues) || !Array.isArray(body.events)) return null
    const leagues = body.leagues.map(parseLeague).filter((l): l is League => l !== null)
    const events = body.events.map(parseEvent).filter((e): e is ScheduleEvent => e !== null)
    if (leagues.length === 0 || events.length === 0) return null
    return { fetchedAt: isNum(body.fetchedAt) ? body.fetchedAt : 0, leagues, events }
  } catch {
    return null
  }
}
