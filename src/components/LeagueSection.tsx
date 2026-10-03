import { useState } from 'react'
import type { Section } from '../logic'
import { MatchList } from './MatchCard'

export default function LeagueSection({ section, now }: { section: Section; now: number }) {
  const [showAll, setShowAll] = useState(false)
  const [recentOpen, setRecentOpen] = useState(false)
  const visible = showAll ? section.upcoming : section.upcoming.slice(0, 6)

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-3 flex items-center gap-2">
        {section.image && (
          <img src={section.image} alt="" loading="lazy" className="h-6 w-6 object-contain" />
        )}
        <h2 className="truncate font-semibold text-zinc-100">{section.name}</h2>
        <span className="truncate text-xs text-zinc-500">{section.region}</span>
      </div>

      {visible.length > 0 ? (
        <MatchList events={visible} now={now} />
      ) : (
        <p className="text-sm text-zinc-500">No upcoming matches</p>
      )}

      {section.upcoming.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs font-medium text-sky-400 hover:text-sky-300"
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
            <span className={`transition-transform ${recentOpen ? 'rotate-90' : ''}`}>▶</span>
            Recent results
          </button>
          {recentOpen && (
            <div className="mt-2">
              <MatchList events={section.recent} now={now} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
