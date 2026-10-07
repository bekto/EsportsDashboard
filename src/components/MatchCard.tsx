import { Fragment, useState } from 'react'
import type { ScheduleEvent, Team } from '../api'
import { countdown, dayLabel, formatLocal, formatTime } from '../time'

export function TeamLogo({ team, size = 'h-7 w-7 text-[10px]' }: { team: Team; size?: string }) {
  const [failed, setFailed] = useState(false)
  if (!team.image || team.code === 'TBD' || failed) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-md bg-zinc-800 font-bold text-zinc-400 ${size}`}>
        {team.code === 'TBD' ? '?' : team.code.slice(0, 3)}
      </span>
    )
  }
  return (
    <img
      src={team.image}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${size}`}
    />
  )
}

export function ExternalIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

export function StarIcon({
  className = '',
  filled = true,
}: {
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.1-6.47-4.69-4.58 6.49-.94L12 2.5Z" />
    </svg>
  )
}

function TeamSide({
  team,
  completed,
  won,
  mirrored,
  favorite,
  spoilerFree,
}: {
  team: Team
  completed: boolean
  won: boolean
  mirrored: boolean
  favorite: boolean
  spoilerFree: boolean
}) {
  const codeClass = completed
    ? spoilerFree
      ? 'text-zinc-300'
      : won
        ? 'font-bold text-white'
        : 'text-zinc-500'
    : 'font-semibold text-zinc-100'
  return (
    <div className={`flex min-w-0 items-center gap-2 ${mirrored ? 'justify-end' : ''}`}>
      {!mirrored && <TeamLogo team={team} />}
      <span className={`min-w-0 ${mirrored ? 'text-right' : ''}`}>
        <span className={`block truncate text-sm ${codeClass}`}>
          {team.code}
          {favorite && (
            <StarIcon className="ml-1 inline-block h-3 w-3 align-text-top text-amber-400" />
          )}
        </span>
        {team.record && (
          <span className="block text-[10px] text-zinc-500">
            {team.record.wins}-{team.record.losses}
          </span>
        )}
      </span>
      {mirrored && <TeamLogo team={team} />}
    </div>
  )
}

export function CompletedScore({
  a,
  b,
  spoilerFree = false,
}: {
  a?: Team
  b?: Team
  spoilerFree?: boolean
}) {
  const aWon = a?.result?.outcome === 'win'
  const bWon = b?.result?.outcome === 'win'
  const tone = (won: boolean) => (spoilerFree ? 'text-zinc-300' : won ? 'text-white' : 'text-zinc-500')
  return (
    <span className="text-lg font-bold tabular-nums">
      <span className={tone(Boolean(aWon))}>{a?.result?.gameWins ?? 0}</span>
      <span className="mx-1 text-zinc-600">–</span>
      <span className={tone(Boolean(bWon))}>{b?.result?.gameWins ?? 0}</span>
    </span>
  )
}

export default function MatchCard({
  event,
  now,
  showLeague = false,
  showDay = false,
  favorites = [],
  watchUrls = {},
  spoilerFree = false,
}: {
  event: ScheduleEvent
  now: number
  showLeague?: boolean
  /** Day label inside the card, for lists that have no day dividers */
  showDay?: boolean
  favorites?: readonly string[]
  /** league slug → direct stream URL for currently live broadcasts */
  watchUrls?: Record<string, string>
  /** Hide winners and series scores on completed/live cards */
  spoilerFree?: boolean
}) {
  const live = event.state === 'inProgress'
  const completed = event.state === 'completed'
  const startMs = new Date(event.startTime).getTime()
  const href = live
    ? watchUrls[event.league.slug] ?? `https://lolesports.com/live/${event.league.slug}`
    : `https://lolesports.com/schedule?leagues=${event.league.slug}`
  const [a, b] = event.match.teams
  const aWon = a?.result?.outcome === 'win'
  const bWon = b?.result?.outcome === 'win'
  const soon = startMs - now < 3600_000
  const isFav = (team: Team) => favorites.includes(team.code)
  const linkProps = {
    href,
    target: '_blank',
    rel: 'noreferrer',
    title: `${a?.name ?? 'TBD'} vs ${b?.name ?? 'TBD'} · ${formatLocal(startMs)}`,
  }

  // Both teams undecided: nothing to compare, so a slim row instead of a full card
  if (!live && !completed && event.match.teams.every((t) => t.code === 'TBD')) {
    return (
      <a
        {...linkProps}
        className="group flex items-center gap-2 rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
      >
        {showLeague && <span className="truncate text-zinc-300">{event.league.name}</span>}
        <span className="shrink-0 font-medium text-zinc-400">Bo{event.match.strategy.count}</span>
        {event.blockName && <span className="truncate">{event.blockName}</span>}
        <span className="shrink-0 text-zinc-600">TBD vs TBD</span>
        <span className="ml-auto shrink-0 whitespace-nowrap tabular-nums">
          {showDay && <span className="uppercase">{dayLabel(startMs, now)} </span>}
          <span className="font-semibold text-zinc-300">{formatTime(startMs)}</span>
          <span className={soon ? ' text-amber-400' : ''}> · {countdown(startMs, now)}</span>
        </span>
      </a>
    )
  }

  return (
    <a
      {...linkProps}
      className={`group block rounded-lg border bg-zinc-900 p-3 transition-colors hover:bg-zinc-800/80 ${
        live ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
        {showLeague && <span className="truncate text-zinc-300">{event.league.name}</span>}
        <span className="shrink-0 font-medium text-zinc-300">Bo{event.match.strategy.count}</span>
        {event.blockName && <span className="truncate">{event.blockName}</span>}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap tabular-nums">
          {completed && formatTime(startMs)}
          <ExternalIcon className="text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {a && (
          <TeamSide
            team={a}
            completed={completed}
            won={aWon}
            mirrored={false}
            favorite={isFav(a)}
            spoilerFree={spoilerFree}
          />
        )}
        <div className="w-20 text-center">
          {live ? (
            <span className="flex flex-col items-center">
              <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse" />
                LIVE
              </span>
              {!spoilerFree && a?.result && b?.result && (
                <span className="text-xs font-semibold text-zinc-300 tabular-nums">
                  {a.result.gameWins} – {b.result.gameWins}
                </span>
              )}
            </span>
          ) : completed ? (
            spoilerFree ? (
              <span
                className="text-sm font-semibold text-zinc-400"
                title="Hover to reveal the score"
              >
                <span className="group-hover:hidden">Final</span>
                <span className="hidden group-hover:inline">
                  <CompletedScore a={a} b={b} spoilerFree />
                </span>
              </span>
            ) : (
              <CompletedScore a={a} b={b} />
            )
          ) : (
            <span className="flex flex-col items-center">
              {showDay && (
                <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap text-zinc-500 uppercase">
                  {dayLabel(startMs, now)}
                </span>
              )}
              <span className="text-sm font-bold text-zinc-200 tabular-nums">
                {formatTime(startMs)}
              </span>
              <span className={`text-[10px] ${soon ? 'text-amber-400' : 'text-zinc-500'}`}>
                {countdown(startMs, now)}
              </span>
            </span>
          )}
        </div>
        {b && (
          <TeamSide
            team={b}
            completed={completed}
            won={bWon}
            mirrored
            favorite={isFav(b)}
            spoilerFree={spoilerFree}
          />
        )}
      </div>
    </a>
  )
}

export function MatchList({
  events,
  now,
  showLeague = false,
  grid = false,
  favorites = [],
  watchUrls = {},
  spoilerFree = false,
}: {
  events: ScheduleEvent[]
  now: number
  showLeague?: boolean
  /** 2-column grid on lg; day dividers would break the rows, so each card shows its own day */
  grid?: boolean
  favorites?: readonly string[]
  watchUrls?: Record<string, string>
  spoilerFree?: boolean
}) {
  if (grid) {
    return (
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {events.map((event) => (
          <MatchCard
            key={event.match.id}
            event={event}
            now={now}
            showLeague={showLeague}
            showDay
            favorites={favorites}
            watchUrls={watchUrls}
            spoilerFree={spoilerFree}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {events.map((event, i) => {
        const startMs = Date.parse(event.startTime)
        const newDay =
          i === 0 ||
          new Date(startMs).toDateString() !== new Date(events[i - 1].startTime).toDateString()
        return (
          <Fragment key={event.match.id}>
            {newDay && (
              <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                {dayLabel(startMs, now)}
                <span className="h-px flex-1 bg-zinc-800" />
              </div>
            )}
            <MatchCard
              event={event}
              now={now}
              showLeague={showLeague}
              favorites={favorites}
              watchUrls={watchUrls}
              spoilerFree={spoilerFree}
            />
          </Fragment>
        )
      })}
    </div>
  )
}
