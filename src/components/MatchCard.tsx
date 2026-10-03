import { Fragment, useState } from 'react'
import type { ScheduleEvent, Team } from '../api'
import { countdown, dayLabel, formatLocal, formatTime } from '../time'

function TeamLogo({ team }: { team: Team }) {
  const [failed, setFailed] = useState(false)
  if (!team.image || team.code === 'TBD' || failed) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
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
      className="h-7 w-7 shrink-0 object-contain"
    />
  )
}

function TeamSide({
  team,
  completed,
  won,
  mirrored,
}: {
  team: Team
  completed: boolean
  won: boolean
  mirrored: boolean
}) {
  const codeClass = completed
    ? won
      ? 'font-bold text-white'
      : 'text-zinc-500'
    : 'font-semibold text-zinc-100'
  return (
    <div className={`flex min-w-0 items-center gap-2 ${mirrored ? 'justify-end' : ''}`}>
      {!mirrored && <TeamLogo team={team} />}
      <span className={`min-w-0 ${mirrored ? 'text-right' : ''}`}>
        <span className={`block truncate text-sm ${codeClass}`}>{team.code}</span>
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

export default function MatchCard({
  event,
  now,
  showLeague = false,
}: {
  event: ScheduleEvent
  now: number
  showLeague?: boolean
}) {
  const live = event.state === 'inProgress'
  const completed = event.state === 'completed'
  const startMs = new Date(event.startTime).getTime()
  const href = live
    ? `https://lolesports.com/live/${event.league.slug}`
    : 'https://lolesports.com/schedule'
  const [a, b] = event.match.teams
  const aWon = a?.result?.outcome === 'win'
  const bWon = b?.result?.outcome === 'win'
  const soon = startMs - now < 3600_000

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={`${a?.name ?? 'TBD'} vs ${b?.name ?? 'TBD'} · ${formatLocal(startMs)}`}
      className={`block rounded-lg border bg-zinc-900 p-3 transition-colors hover:bg-zinc-800 ${
        live ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
        {showLeague && <span className="truncate text-zinc-300">{event.league.name}</span>}
        <span className="shrink-0 font-medium text-zinc-300">Bo{event.match.strategy.count}</span>
        {event.blockName && <span className="truncate">{event.blockName}</span>}
        {completed && (
          <span className="ml-auto shrink-0 tabular-nums whitespace-nowrap">{formatTime(startMs)}</span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {a && <TeamSide team={a} completed={completed} won={aWon} mirrored={false} />}
        <div className="w-20 text-center">
          {live ? (
            <span className="flex flex-col items-center">
              <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse" />
                LIVE
              </span>
              {a?.result && b?.result && (
                <span className="text-xs font-semibold text-zinc-300 tabular-nums">
                  {a.result.gameWins} – {b.result.gameWins}
                </span>
              )}
            </span>
          ) : completed ? (
            <span className="text-lg font-bold tabular-nums">
              <span className={aWon ? 'text-white' : 'text-zinc-500'}>
                {a?.result?.gameWins ?? 0}
              </span>
              <span className="mx-1 text-zinc-600">–</span>
              <span className={bWon ? 'text-white' : 'text-zinc-500'}>
                {b?.result?.gameWins ?? 0}
              </span>
            </span>
          ) : (
            <span className="flex flex-col items-center">
              <span className="text-sm font-bold text-zinc-200 tabular-nums">
                {formatTime(startMs)}
              </span>
              <span className={`text-[10px] ${soon ? 'text-amber-400' : 'text-zinc-500'}`}>
                {countdown(startMs, now)}
              </span>
            </span>
          )}
        </div>
        {b && <TeamSide team={b} completed={completed} won={bWon} mirrored />}
      </div>
    </a>
  )
}

export function MatchList({
  events,
  now,
  showLeague = false,
  columns = 1,
}: {
  events: ScheduleEvent[]
  now: number
  showLeague?: boolean
  columns?: 1 | 2
}) {
  return (
    <div className={columns === 2 ? 'grid grid-cols-1 gap-2 lg:grid-cols-2' : 'flex flex-col gap-2'}>
      {events.map((event, i) => {
        const startMs = Date.parse(event.startTime)
        const newDay =
          i === 0 ||
          new Date(startMs).toDateString() !== new Date(events[i - 1].startTime).toDateString()
        const divider = newDay ? dayLabel(startMs, now) : null
        return (
          <Fragment key={event.match.id}>
            {divider && (
              <div className="col-span-full mt-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                {divider}
              </div>
            )}
            <MatchCard event={event} now={now} showLeague={showLeague} />
          </Fragment>
        )
      })}
    </div>
  )
}
