import { useState } from 'react'
import type { Section } from '../logic'
import { MatchList, StarIcon } from './MatchCard'

// Shared grid so the standings header and rows align: rank · team · W-L · win%
const STANDINGS_COLS = 'grid grid-cols-[1.25rem_minmax(0,1fr)_auto_auto] items-center gap-x-2.5'
const rankTone = (i: number) =>
  i === 0 ? 'text-amber-300' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-500'

export default function LeagueSection({
  section,
  now,
  favorites = [],
  watchUrls = {},
  spoilerFree = false,
}: {
  section: Section
  now: number
  favorites?: readonly string[]
  watchUrls?: Record<string, string>
  spoilerFree?: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const [recentOpen, setRecentOpen] = useState(false)
  const [standingsOpen, setStandingsOpen] = useState(false)
  const visible = showAll ? section.upcoming : section.upcoming.slice(0, 6)
  const live = section.upcoming.some((e) => e.state === 'inProgress')

  return (
    <section
      id={`league-${section.slug}`}
      className="scroll-mt-28 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-700/80"
    >
      <div className="mb-3 flex items-center gap-2">
        {section.image && (
          <img
            src={section.image}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className="h-6 w-6 object-contain"
          />
        )}
        <h2 className="truncate font-semibold text-zinc-100">{section.name}</h2>
        {live && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 motion-safe:animate-pulse" />
        )}
        <span className="truncate text-xs text-zinc-500">{section.region}</span>
        <span className="ml-auto shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 tabular-nums">
          {section.upcoming.length}
        </span>
      </div>

      {visible.length > 0 ? (
        <MatchList
          events={visible}
          now={now}
          favorites={favorites}
          watchUrls={watchUrls}
          spoilerFree={spoilerFree}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-800 py-4 text-center text-sm text-zinc-500">
          No upcoming matches
        </p>
      )}

      {section.upcoming.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-2 w-full rounded-lg py-1.5 text-xs font-medium text-sky-400 transition-colors hover:bg-zinc-800/60 hover:text-sky-300"
        >
          {showAll ? 'Show less' : `Show all (${section.upcoming.length})`}
        </button>
      )}

      {section.recent.length > 0 && (
        <div className="mt-3 border-t border-zinc-800 pt-2">
          <button
            type="button"
            onClick={() => setRecentOpen((v) => !v)}
            aria-expanded={recentOpen}
            className="flex w-full items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-3.5 w-3.5 transition-transform ${recentOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            Recent results
            <span className="ml-auto font-normal text-zinc-600 tabular-nums">{section.recent.length}</span>
          </button>
          {recentOpen && (
            <div className="mt-2">
              <MatchList
                events={section.recent}
                now={now}
                favorites={favorites}
                watchUrls={watchUrls}
                spoilerFree={spoilerFree}
              />
            </div>
          )}
        </div>
      )}

      {section.standings.length > 1 && (
        <div className="mt-3 border-t border-zinc-800 pt-2">
          <button
            type="button"
            onClick={() => setStandingsOpen((v) => !v)}
            aria-expanded={standingsOpen}
            className="flex w-full items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-3.5 w-3.5 transition-transform ${standingsOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            Standings
            <span className="ml-auto font-normal text-zinc-600 tabular-nums">
              {section.standings.length}
            </span>
          </button>
          {standingsOpen && (
            <div className="mt-2">
              <div
                className={`${STANDINGS_COLS} border-b border-zinc-800 pb-1 text-[10px] font-semibold tracking-wide text-zinc-600 uppercase`}
              >
                <span className="text-right">#</span>
                <span>Team</span>
                <span>W-L</span>
                <span className="text-right">Win%</span>
              </div>
              <ol className="mt-0.5 flex flex-col">
                {section.standings.slice(0, 10).map((s, i) => {
                  const pct = Math.round(s.winrate * 100)
                  const fav = favorites.includes(s.code)
                  return (
                    <li key={s.code} className={`${STANDINGS_COLS} py-1`}>
                      <span className={`text-right text-[11px] font-semibold tabular-nums ${rankTone(i)}`}>
                        {i + 1}
                      </span>
                      <span className="min-w-0" title={s.name}>
                        <span className="flex items-center gap-1.5">
                          {s.image ? (
                            <img
                              src={s.image}
                              alt=""
                              loading="lazy"
                              className="h-4 w-4 shrink-0 object-contain"
                            />
                          ) : (
                            <span className="h-4 w-4 shrink-0 rounded bg-zinc-800" />
                          )}
                          <span
                            className={`truncate text-xs font-medium ${fav ? 'text-amber-300' : 'text-zinc-200'}`}
                          >
                            {s.code}
                          </span>
                          {fav && <StarIcon className="h-2.5 w-2.5 shrink-0 text-amber-400" />}
                        </span>
                        <span
                          className="mt-1 block h-1 overflow-hidden rounded-full bg-zinc-800"
                          aria-hidden="true"
                        >
                          <span
                            className={`block h-full rounded-full ${fav ? 'bg-amber-500/70' : 'bg-sky-500/70'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                      </span>
                      <span className="text-[11px] text-zinc-400 tabular-nums">
                        {s.wins}-{s.losses}
                      </span>
                      <span className="w-9 text-right text-[11px] font-semibold text-zinc-300 tabular-nums">
                        {pct}%
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
