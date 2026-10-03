import type { ScheduleEvent, Team } from '../api'
import { countdown, dayLabel, formatLocal, formatTime } from '../time'
import { ExternalIcon, MatchList, TeamLogo } from './MatchCard'

function SpotlightTeam({ team }: { team: Team }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <TeamLogo team={team} size="h-12 w-12 text-sm sm:h-16 sm:w-16" />
      <span className="text-lg font-bold sm:text-2xl">{team.code}</span>
      <span className="w-full truncate text-xs text-zinc-400">{team.name}</span>
      {team.record && (
        <span className="text-[11px] text-zinc-500 tabular-nums">
          {team.record.wins}-{team.record.losses}
        </span>
      )}
    </div>
  )
}

// The top HOT pick (live first, else soonest) gets a large featured card.
function Spotlight({ event, now }: { event: ScheduleEvent; now: number }) {
  const live = event.state === 'inProgress'
  const startMs = Date.parse(event.startTime)
  const [a, b] = event.match.teams
  return (
    <a
      href={live ? `https://lolesports.com/live/${event.league.slug}` : 'https://lolesports.com/schedule'}
      target="_blank"
      rel="noreferrer"
      title={`${a?.name ?? 'TBD'} vs ${b?.name ?? 'TBD'} · ${formatLocal(startMs)}`}
      className={`group mb-4 block rounded-xl border bg-zinc-900/80 p-4 transition-colors hover:bg-zinc-900 sm:p-6 ${
        live ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-orange-500/30 hover:border-orange-500/50'
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-semibold tracking-wider uppercase ${
            live ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-300'
          }`}
        >
          {live ? 'Live now' : 'Up next'}
        </span>
        <span className="truncate text-zinc-300">{event.league.name}</span>
        <span className="shrink-0 font-medium text-zinc-300">Bo{event.match.strategy.count}</span>
        {event.blockName && <span className="hidden truncate sm:inline">{event.blockName}</span>}
        <span className="ml-auto flex shrink-0 items-center gap-1 text-zinc-500 transition-colors group-hover:text-zinc-200">
          {live ? 'Watch' : 'Schedule'}
          <ExternalIcon />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
        {a && <SpotlightTeam team={a} />}
        <div className="flex flex-col items-center text-center">
          {live ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" />
                LIVE
              </span>
              {a?.result && b?.result && (
                <span className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                  {a.result.gameWins}
                  <span className="mx-2 text-zinc-600">–</span>
                  {b.result.gameWins}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                {dayLabel(startMs, now)}
              </span>
              <span className="text-2xl font-bold tabular-nums sm:text-4xl">{formatTime(startMs)}</span>
              <span
                className={`mt-1 text-sm ${startMs - now < 3600_000 ? 'font-semibold text-amber-400' : 'text-zinc-400'}`}
              >
                {countdown(startMs, now)}
              </span>
            </>
          )}
        </div>
        {b && <SpotlightTeam team={b} />}
      </div>
    </a>
  )
}

export default function HotSection({ events, now }: { events: ScheduleEvent[]; now: number }) {
  const [first, ...rest] = events
  return (
    <section
      id="hot"
      className="scroll-mt-28 rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-950/50 via-zinc-900/40 to-zinc-900/40 p-4 shadow-lg shadow-orange-950/20"
    >
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-orange-300">
        🔥 HOT matches
        <span className="text-xs font-normal text-zinc-500">best of the next 7 days</span>
      </h2>
      {first ? (
        <>
          <Spotlight event={first} now={now} />
          {rest.length > 0 && <MatchList events={rest} now={now} showLeague grid />}
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-800 py-4 text-center text-sm text-zinc-500">
          No hot matches in the next 7 days
        </p>
      )}
    </section>
  )
}
