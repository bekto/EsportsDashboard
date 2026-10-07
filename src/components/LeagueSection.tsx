import { useState } from 'react'
import type { Section } from '../logic'
import { MatchList } from './MatchCard'

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
            <ol className="mt-2 flex flex-col gap-0.5 text-xs">
              {section.standings.slice(0, 10).map((s, i) => (
                <li key={s.code} className="flex items-center gap-2">
                  <span className="w-4 shrink-0 text-right text-zinc-500 tabular-nums">{i + 1}</span>
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
                  <span className="min-w-0 flex-1 truncate text-zinc-300">{s.code}</span>
                  <span className="shrink-0 text-zinc-500 tabular-nums">
                    {s.wins}-{s.losses}
                  </span>
                  <span className="w-9 shrink-0 text-right text-zinc-400 tabular-nums">
                    {Math.round(s.winrate * 100)}%
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}
