import type { ScheduleEvent } from '../api'
import { MatchList } from './MatchCard'

export default function HotSection({ events, now }: { events: ScheduleEvent[]; now: number }) {
  return (
    <section className="rounded-xl border border-orange-500/60 bg-gradient-to-br from-orange-950/40 to-zinc-900/40 p-4">
      <h2 className="mb-3 text-lg font-bold text-orange-300">🔥 HOT matches</h2>
      {events.length > 0 ? (
        <MatchList events={events} now={now} showLeague />
      ) : (
        <p className="text-sm text-zinc-400">No hot matches in the next 7 days</p>
      )}
    </section>
  )
}
