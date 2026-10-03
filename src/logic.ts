import type { DisplayStatus, League, ScheduleEvent } from './api'

export const HOT_MIN_SCORE = 30
export const HOT_LIMIT = 8
export const HOT_WINDOW_MS = 7 * 24 * 3600_000

export interface Prefs {
  hidden: string[]
  order: string[]
}

export interface Section {
  slug: string
  name: string
  region: string
  image: string | null
  upcoming: ScheduleEvent[]
  recent: ScheduleEvent[]
}

const HOT_LEAGUES: Record<string, number> = {
  worlds: 50,
  msi: 50,
  first_stand: 50,
  ewc_lol: 50,
  lck: 35,
  lpl: 35,
  lec: 25,
  lcs: 25,
  lcp: 25,
  'cblol-brazil': 25,
}

const BRACKET_WORDS = ['semifinal', 'quarterfinal', 'playoff', 'knockout', 'bracket']

const STATUS_RANK: Record<DisplayStatus, number> = {
  force_selected: 0,
  selected: 1,
  not_selected: 2,
  hidden: 3,
}

export function sortUpcoming(events: ScheduleEvent[]): ScheduleEvent[] {
  const live: ScheduleEvent[] = []
  const upcoming: ScheduleEvent[] = []
  for (const e of events) {
    if (e.state === 'inProgress') live.push(e)
    else if (e.state === 'unstarted') upcoming.push(e)
  }
  upcoming.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
  return [...live, ...upcoming]
}

export function recentResults(events: ScheduleEvent[], n = 5): ScheduleEvent[] {
  return events
    .filter((e) => e.state === 'completed')
    .sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime))
    .slice(0, n)
}

export function hotScore(e: ScheduleEvent, _nowMs: number): number {
  const block = e.blockName.toLowerCase()
  let score = HOT_LEAGUES[e.league.slug] ?? 0
  if (BRACKET_WORDS.some((w) => block.includes(w))) score += 15
  else if (block.includes('final')) score += 25
  const count = e.match.strategy.count
  if (count === 5) score += 10
  else if (count === 3) score += 5
  if (e.match.teams.some((t) => t.code === 'TBD')) score -= 20
  const [a, b] = e.match.teams
  if (
    a?.record &&
    b?.record &&
    a.record.wins + a.record.losses >= 1 &&
    b.record.wins + b.record.losses >= 1 &&
    Math.abs(
      a.record.wins / (a.record.wins + a.record.losses) -
        b.record.wins / (b.record.wins + b.record.losses),
    ) <= 0.15
  ) {
    score += 10
  }
  if (e.state === 'inProgress') score += 15
  return score
}

export function hotMatches(events: ScheduleEvent[], nowMs: number): ScheduleEvent[] {
  const deadline = nowMs + HOT_WINDOW_MS
  const picked = events
    .filter(
      (e) =>
        e.state === 'inProgress' ||
        (e.state === 'unstarted' && Date.parse(e.startTime) <= deadline),
    )
    .map((e) => ({ e, score: hotScore(e, nowMs) }))
    .filter((x) => x.score >= HOT_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, HOT_LIMIT)
    .map((x) => x.e)
  return sortUpcoming(picked)
}

type Group = { slug: string; name: string; events: ScheduleEvent[] }
type Rank = { rank: number; position: number; known: boolean }

function groupBySlug(events: ScheduleEvent[]): Map<string, Group> {
  const groups = new Map<string, Group>()
  for (const e of events) {
    const g = groups.get(e.league.slug)
    if (g) g.events.push(e)
    else groups.set(e.league.slug, { slug: e.league.slug, name: e.league.name, events: [e] })
  }
  return groups
}

function rankOf(slug: string, leagues: Map<string, League>): Rank {
  const l = leagues.get(slug)
  return l
    ? { rank: STATUS_RANK[l.displayPriority.status], position: l.displayPriority.position, known: true }
    : { rank: STATUS_RANK.hidden, position: 0, known: false }
}

const byDefaultRank = (a: Rank, b: Rank) =>
  Number(b.known) - Number(a.known) || a.rank - b.rank || a.position - b.position

export function leagueSections(leagues: League[], events: ScheduleEvent[], prefs: Prefs): Section[] {
  const groups = groupBySlug(events)
  const leagueBySlug = new Map(leagues.map((l) => [l.slug, l]))
  const hidden = new Set(prefs.hidden)
  const visible = [...groups.keys()].filter(
    (slug) => !hidden.has(slug) && groups.get(slug)!.events.some((e) => e.state !== 'completed'),
  )
  const ordered = prefs.order.filter((slug, i) => visible.includes(slug) && prefs.order.indexOf(slug) === i)
  const rest = visible
    .filter((slug) => !ordered.includes(slug))
    .sort((a, b) => byDefaultRank(rankOf(a, leagueBySlug), rankOf(b, leagueBySlug)))

  return [...ordered, ...rest].map((slug) => {
    const g = groups.get(slug)!
    const l = leagueBySlug.get(slug)
    return {
      slug,
      name: l?.name ?? g.name,
      region: l?.region ?? '',
      image: l?.image ?? null,
      upcoming: sortUpcoming(g.events),
      recent: recentResults(g.events),
    }
  })
}

export function allLeagueSlugsWithEvents(
  leagues: League[],
  events: ScheduleEvent[],
): { slug: string; name: string; image: string | null }[] {
  const groups = groupBySlug(events)
  const leagueBySlug = new Map(leagues.map((l) => [l.slug, l]))
  return [...groups.keys()]
    .sort((a, b) => byDefaultRank(rankOf(a, leagueBySlug), rankOf(b, leagueBySlug)))
    .map((slug) => {
      const l = leagueBySlug.get(slug)
      return { slug, name: l?.name ?? groups.get(slug)!.name, image: l?.image ?? null }
    })
}
