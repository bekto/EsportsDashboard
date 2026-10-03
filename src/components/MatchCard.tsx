import { Fragment } from 'react'
import type { ScheduleEvent, Team } from '../api'
import { countdown, dayLabel, formatLocal, formatTime } from '../time'

function TeamRow({ team, completed }: { team: Team; completed: boolean }) {
  const won = completed && team.result?.outcome === 'win'
  return (
    <div className="flex items-center gap-2">
      {team.image ? (
        <img
          src={team.image}
          alt={team.name}
          loading="lazy"
          className="h-6 w-6 shrink-0 object-contain"
        />
      ) : (
        <span className="h-6 w-6 shrink-0 rounded bg-zinc-800" />
      )}
      <span className="min-w-0">
        <span
          className={`block truncate text-sm ${
            completed && !won ? 'text-zinc-400' : 'font-semibold text-zinc-100'
          } ${won ? 'text-white' : ''}`}
        >
          {team.code}
        </span>
        {team.record && (
          <span className="block text-[10px] text-zinc-500">
            {team.record.wins}-{team.record.losses}
          </span>
        )}
      </span>
      {completed && (
        <span
          className={`ml-auto text-sm tabular-nums ${
            won ? 'font-bold text-white' : 'text-zinc-400'
          }`}
        >
          {team.result?.gameWins ?? 0}
        </span>
      )}
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

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`block rounded-lg border bg-zinc-900 p-3 transition-colors hover:bg-zinc-800 ${
        live ? 'border-red-500/60' : 'border-zinc-800'
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
        {showLeague && <span className="truncate text-zinc-300">{event.league.name}</span>}
        <span className="shrink-0 font-medium text-zinc-300">Bo{event.match.strategy.count}</span>
        {event.blockName && <span className="truncate">{event.blockName}</span>}
        <span className="ml-auto shrink-0 whitespace-nowrap">
          {live ? (
            <span className="inline-flex items-center gap-1 font-semibold text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
          ) : completed ? (
            formatLocal(startMs)
          ) : (
            <>
              {formatTime(startMs)} · {countdown(startMs, now)}
            </>
          )}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {event.match.teams.map((t, i) => (
          <TeamRow key={i} team={t} completed={completed} />
        ))}
      </div>
    </a>
  )
}

export function MatchList({
  events,
  now,
  showLeague = false,
}: {
  events: ScheduleEvent[]
  now: number
  showLeague?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      {events.map((event, i) => {
        const startMs = Date.parse(event.startTime)
        const newDay = i === 0 || new Date(startMs).toDateString() !== new Date(events[i - 1].startTime).toDateString()
        const divider = newDay ? dayLabel(startMs, now) : null
        return (
          <Fragment key={event.match.id}>
            {divider && (
              <div className="mt-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
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
