import { useMemo, useState } from 'react'
import { allLeagueSlugsWithEvents, hotMatches, leagueSections } from './logic'
import { usePrefs } from './usePrefs'
import { useSchedule } from './useSchedule'
import { ago, useNow } from './time'
import Header from './components/Header'
import HotSection from './components/HotSection'
import LeagueSection from './components/LeagueSection'
import SettingsPanel from './components/SettingsPanel'

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 motion-safe:animate-pulse">
      <div className="h-3 w-1/3 rounded bg-zinc-800" />
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="h-6 rounded bg-zinc-800/70" />
        <div className="h-5 w-16 rounded bg-zinc-800" />
        <div className="h-6 rounded bg-zinc-800/70" />
      </div>
    </div>
  )
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-zinc-600 px-3 py-1 text-sm hover:bg-zinc-800"
    >
      Retry
    </button>
  )
}

export default function App() {
  const { leagues, events, fetchedAt, loading, error, refresh } = useSchedule()
  const { prefs, hide, unhide, move, reset } = usePrefs()
  const now = useNow()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const hot = useMemo(() => hotMatches(events, now), [events, now])
  const sections = useMemo(() => leagueSections(leagues, events, prefs), [leagues, events, prefs])
  const allLeagues = useMemo(() => allLeagueSlugsWithEvents(leagues, events), [leagues, events])
  const visibleOrder = sections.map((s) => s.slug)
  const liveCount = events.filter((e) => e.state === 'inProgress').length
  const nav = useMemo(
    () =>
      sections.length === 0
        ? []
        : [
            {
              href: '#hot',
              label: 'HOT',
              image: null as string | null,
              live: hot.some((e) => e.state === 'inProgress'),
            },
            ...sections.map((s) => ({
              href: `#league-${s.slug}`,
              label: s.name,
              image: s.image,
              live: s.upcoming.some((e) => e.state === 'inProgress'),
            })),
          ],
    [sections, hot],
  )

  const noData = events.length === 0 && leagues.length === 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        fetchedAt={fetchedAt}
        now={now}
        loading={loading}
        liveCount={liveCount}
        nav={nav}
        onRefresh={refresh}
        onSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 py-4">
        {error && !noData && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-700 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
            <span className="min-w-0 truncate">
              Couldn&apos;t refresh — showing data from{' '}
              {fetchedAt ? ago(fetchedAt, now) : 'an earlier session'}
            </span>
            <span className="ml-auto shrink-0">
              <RetryButton onClick={refresh} />
            </span>
          </div>
        )}

        {error && noData ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-semibold">Couldn&apos;t load match data</p>
            <p className="text-sm text-zinc-400">{error}</p>
            <RetryButton onClick={refresh} />
          </div>
        ) : loading && events.length === 0 ? (
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <HotSection events={hot} now={now} />
            {sections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sections.map((section) => (
                  <LeagueSection key={section.slug} section={section} now={now} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-zinc-400">
                📅 No upcoming matches
              </p>
            )}
          </div>
        )}
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        all={allLeagues}
        prefs={prefs}
        visibleOrder={visibleOrder}
        hide={hide}
        unhide={unhide}
        move={move}
        reset={reset}
      />
    </div>
  )
}
