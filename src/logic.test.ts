import { describe, expect, it } from 'vitest'
import type { DisplayStatus, League, MatchState, ScheduleEvent, Team } from './api'
import {
  HOT_LIMIT,
  allLeagueSlugsWithEvents,
  hotMatches,
  hotScore,
  leagueSections,
  recentResults,
  sortUpcoming,
} from './logic'
import { ago, countdown, dayLabel } from './time'

const NOW = Date.parse('2026-10-03T12:00:00Z')
const iso = (hours: number) => new Date(NOW + hours * 3600_000).toISOString()

let seq = 0

function team(code: string, wins = 0, losses = 0): Team {
  return { name: code, code, image: '', result: null, record: { wins, losses } }
}

function event(
  o: {
    id?: string
    slug?: string
    name?: string
    state?: MatchState
    start?: string
    block?: string
    count?: number
    teams?: Team[]
  } = {},
): ScheduleEvent {
  return {
    startTime: o.start ?? iso(1),
    state: o.state ?? 'unstarted',
    type: 'match',
    blockName: o.block ?? 'Regular Season',
    league: { name: o.name ?? 'NACL', slug: o.slug ?? 'nacl' },
    match: {
      id: o.id ?? `e${++seq}`,
      flags: [],
      teams: o.teams ?? [team('AAA'), team('BBB')],
      strategy: { type: 'bestOf', count: o.count ?? 1 },
    },
  }
}

function league(slug: string, name: string, status: DisplayStatus, position: number): League {
  return {
    id: slug,
    slug,
    name,
    region: 'X',
    image: `https://img/${slug}`,
    priority: 0,
    displayPriority: { position, status },
  }
}

const ids = (events: ScheduleEvent[]) => events.map((e) => e.match.id)

describe('sortUpcoming', () => {
  it('puts inProgress first even when it starts later, then unstarted by time', () => {
    const later = event({ id: 'later', start: iso(3) })
    const live = event({ id: 'live', state: 'inProgress', start: iso(5) })
    const sooner = event({ id: 'sooner', start: iso(1) })
    expect(ids(sortUpcoming([later, live, sooner]))).toEqual(['live', 'sooner', 'later'])
  })
})

describe('recentResults', () => {
  it('returns latest completed first, capped at n', () => {
    const evs = Array.from({ length: 7 }, (_, i) =>
      event({ id: `c${i}`, state: 'completed', start: iso(-i - 1) }),
    )
    expect(ids(recentResults(evs))).toEqual(['c0', 'c1', 'c2', 'c3', 'c4'])
    expect(ids(recentResults(evs, 2))).toEqual(['c0', 'c1'])
  })
})

describe('hotScore', () => {
  it('ranks Worlds Final Bo5 > LCK regular Bo3 > NACL Bo1', () => {
    const worldsFinal = event({ slug: 'worlds', block: 'Finals', count: 5 })
    const lckBo3 = event({ slug: 'lck', block: 'Regular Season', count: 3 })
    const naclBo1 = event({ slug: 'nacl', block: 'Regular Season', count: 1 })
    expect(hotScore(worldsFinal, NOW)).toBe(85)
    expect(hotScore(lckBo3, NOW)).toBe(40)
    expect(hotScore(naclBo1, NOW)).toBe(0)
    expect(hotScore(worldsFinal, NOW)).toBeGreaterThan(hotScore(lckBo3, NOW))
    expect(hotScore(lckBo3, NOW)).toBeGreaterThan(hotScore(naclBo1, NOW))
  })

  it('penalizes TBD teams by 20', () => {
    const full = event({ slug: 'worlds', block: 'Finals', count: 5 })
    const tbd = event({ slug: 'worlds', block: 'Finals', count: 5, teams: [team('TBD'), team('BBB')] })
    expect(hotScore(tbd, NOW)).toBe(hotScore(full, NOW) - 20)
  })

  it('scores "Semifinals" as bracket (+15), never the +25 final bonus', () => {
    const semi = event({ slug: 'worlds', block: 'Semifinals', count: 5 })
    const finals = event({ slug: 'worlds', block: 'Finals', count: 5 })
    expect(hotScore(semi, NOW)).toBe(75)
    expect(hotScore(finals, NOW) - hotScore(semi, NOW)).toBe(10)
    expect(hotScore(event({ block: 'Lower Bracket Final' }), NOW)).toBe(15)
  })

  it('adds the form bonus only for close winrates with games played', () => {
    expect(hotScore(event({ teams: [team('A', 10, 5), team('B', 9, 6)] }), NOW)).toBe(10)
    expect(hotScore(event({ teams: [team('A', 10, 0), team('B', 0, 10)] }), NOW)).toBe(0)
    expect(hotScore(event({ teams: [team('A'), team('B')] }), NOW)).toBe(0)
  })

  it('adds 15 for inProgress', () => {
    const e = event({ slug: 'lck', block: 'Regular Season', count: 3 })
    expect(hotScore({ ...e, state: 'inProgress' }, NOW)).toBe(55)
  })
})

describe('hotMatches', () => {
  it('keeps only score >= 30 inside the 7-day window, re-sorted by time', () => {
    const live = event({ id: 'live', slug: 'worlds', state: 'inProgress', block: 'Playoffs', count: 5 })
    const soon = event({ id: 'soon', slug: 'lck', start: iso(48), count: 3 })
    const far = event({ id: 'far', slug: 'worlds', block: 'Finals', count: 5, start: iso(8 * 24) })
    const cold = event({ id: 'cold', slug: 'nacl', start: iso(24), count: 1 })
    expect(ids(hotMatches([far, cold, soon, live], NOW))).toEqual(['live', 'soon'])
  })

  it('caps the selection at HOT_LIMIT', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      event({ id: `m${i}`, slug: 'worlds', block: 'Playoffs', count: 5, start: iso(i + 1) }),
    )
    expect(hotMatches(many, NOW)).toHaveLength(HOT_LIMIT)
  })
})

describe('leagueSections', () => {
  const leagues = [
    league('worlds', 'Worlds', 'force_selected', 1),
    league('lck', 'LCK', 'not_selected', 1),
    league('lec', 'LEC', 'selected', 5),
    league('nacl', 'NACL', 'selected', 7),
    league('cblol-brazil', 'CBLOL', 'selected', 3),
  ]
  const events = [
    event({ slug: 'worlds', start: iso(2) }),
    event({ slug: 'lck', start: iso(1) }),
    event({ slug: 'lec', start: iso(3) }),
    event({ slug: 'nacl', start: iso(4) }),
    event({ slug: 'cblol-brazil', state: 'completed', start: iso(-24) }),
  ]

  it('honors prefs.order first, then default ranking; drops hidden and completed-only leagues', () => {
    const sections = leagueSections(leagues, events, { hidden: ['lck'], order: ['lec'] })
    expect(sections.map((s) => s.slug)).toEqual(['lec', 'worlds', 'nacl'])
    expect(sections[1].upcoming.map((e) => e.startTime)).toEqual([iso(2)])
    expect(sections[1].recent).toEqual([])
  })

  it('falls back to displayPriority status rank then position', () => {
    const sections = leagueSections(leagues, events, { hidden: [], order: [] })
    expect(sections.map((s) => s.slug)).toEqual(['worlds', 'lec', 'nacl', 'lck'])
  })

  it('synthesizes unknown leagues from the event, ranked last', () => {
    const sections = leagueSections(leagues, [...events, event({ slug: 'mystery', name: 'Mystery Cup' })], {
      hidden: [],
      order: [],
    })
    expect(sections.map((s) => s.slug)).toEqual(['worlds', 'lec', 'nacl', 'lck', 'mystery'])
    expect(sections[4]).toMatchObject({ name: 'Mystery Cup', region: '', image: null })
  })
})

describe('allLeagueSlugsWithEvents', () => {
  it('includes completed-only leagues, ignoring prefs, in default rank order', () => {
    const leagues = [
      league('worlds', 'Worlds', 'force_selected', 1),
      league('nacl', 'NACL', 'selected', 7),
      league('cblol-brazil', 'CBLOL', 'not_selected', 3),
    ]
    const events = [
      event({ slug: 'nacl' }),
      event({ slug: 'cblol-brazil', state: 'completed' }),
      event({ slug: 'mystery', name: 'Mystery Cup' }),
    ]
    expect(allLeagueSlugsWithEvents(leagues, events)).toEqual([
      { slug: 'nacl', name: 'NACL', image: 'https://img/nacl' },
      { slug: 'cblol-brazil', name: 'CBLOL', image: 'https://img/cblol-brazil' },
      { slug: 'mystery', name: 'Mystery Cup', image: null },
    ])
  })
})

describe('countdown', () => {
  it('formats the hour/day boundaries', () => {
    expect(countdown(NOW + 59 * 60_000, NOW)).toBe('in 59m')
    expect(countdown(NOW + 60 * 60_000, NOW)).toBe('in 1h 0m')
    expect(countdown(NOW + 23 * 3600_000 + 59 * 60_000, NOW)).toBe('in 23h 59m')
    expect(countdown(NOW + 25 * 3600_000, NOW)).toBe('in 1d 1h')
  })

  it('reports starting soon when past or under a minute away', () => {
    expect(countdown(NOW - 1, NOW)).toBe('starting soon')
    expect(countdown(NOW + 30_000, NOW)).toBe('starting soon')
  })
})

describe('dayLabel / ago', () => {
  const dayStart = (() => {
    const d = new Date(NOW)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  })()

  it('labels local calendar days', () => {
    expect(dayLabel(dayStart + 3600_000, dayStart)).toBe('Today')
    expect(dayLabel(dayStart + 25 * 3600_000, dayStart)).toBe('Tomorrow')
    expect(dayLabel(dayStart + 3 * 86400_000, dayStart)).toMatch(/\w{3}.*\d/)
  })

  it('formats relative age', () => {
    expect(ago(NOW - 30_000, NOW)).toBe('just now')
    expect(ago(NOW - 5 * 60_000, NOW)).toBe('5m ago')
    expect(ago(NOW - 90 * 60_000, NOW)).toBe('1h ago')
    expect(ago(NOW - 3 * 86400_000, NOW)).toBe('3d ago')
  })
})
