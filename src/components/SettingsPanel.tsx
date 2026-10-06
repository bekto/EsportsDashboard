import { useEffect, useMemo, useRef, useState } from 'react'
import type { Prefs } from '../logic'
import { StarIcon } from './MatchCard'

interface TeamOption {
  code: string
  name: string
  image: string
}

interface Props {
  open: boolean
  onClose: () => void
  all: { slug: string; name: string; image: string | null }[]
  teams: TeamOption[]
  prefs: Prefs
  visibleOrder: string[]
  hide: (slug: string) => void
  unhide: (slug: string) => void
  move: (slug: string, dir: -1 | 1, visibleOrder: string[]) => void
  toggleFavorite: (code: string) => void
  reset: () => void
}

export default function SettingsPanel({
  open,
  onClose,
  all,
  teams,
  prefs,
  visibleOrder,
  hide,
  unhide,
  move,
  toggleFavorite,
  reset,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // All teams in the current schedule, plus any favorited code that has since dropped out,
  // so favorites can always be reviewed and removed.
  const teamOptions = useMemo(() => {
    const byCode = new Map(teams.map((t) => [t.code, t]))
    for (const code of prefs.favorites) {
      if (!byCode.has(code)) byCode.set(code, { code, name: code, image: '' })
    }
    return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [teams, prefs.favorites])

  const q = query.trim().toLowerCase()
  const filteredTeams = q
    ? teamOptions.filter(
        (t) => t.code.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
      )
    : teamOptions

  const visible: Props['all'] = []
  for (const slug of visibleOrder) {
    const league = all.find((l) => l.slug === slug)
    if (league) visible.push(league)
  }
  const hidden = all.filter((l) => prefs.hidden.includes(l.slug))

  const rowClass = 'flex w-full items-center gap-2 px-4 py-2'

  const leagueRow = (league: Props['all'][number], isHidden: boolean) => {
    const idx = visibleOrder.indexOf(league.slug)
    return (
      <div key={league.slug} className={rowClass}>
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="checkbox"
            checked={!isHidden}
            onChange={() => (isHidden ? unhide(league.slug) : hide(league.slug))}
            className="h-4 w-4 accent-sky-500"
            aria-label={`Show ${league.name}`}
          />
          {league.image && (
            <img
              src={league.image}
              alt=""
              loading="lazy"
              onError={(e) => (e.currentTarget.style.display = 'none')}
              className="h-5 w-5 object-contain"
            />
          )}
          <span className="truncate text-sm">{league.name}</span>
        </label>
        <button
          type="button"
          disabled={isHidden || idx <= 0}
          onClick={() => move(league.slug, -1, visibleOrder)}
          aria-label={`Move ${league.name} up`}
          className="rounded border border-zinc-700 px-2 text-sm disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={isHidden || idx < 0 || idx >= visible.length - 1}
          onClick={() => move(league.slug, 1, visibleOrder)}
          aria-label={`Move ${league.name} down`}
          className="rounded border border-zinc-700 px-2 text-sm disabled:opacity-30"
        >
          ↓
        </button>
      </div>
    )
  }

  const teamRow = (team: TeamOption) => {
    const fav = prefs.favorites.includes(team.code)
    return (
      <button
        key={team.code}
        type="button"
        onClick={() => toggleFavorite(team.code)}
        aria-pressed={fav}
        title={fav ? `Remove ${team.name} from favorites` : `Add ${team.name} to favorites`}
        className={`flex w-full items-center gap-2 px-4 py-1.5 text-left transition-colors hover:bg-zinc-900 ${
          fav ? 'text-amber-300' : 'text-zinc-300'
        }`}
      >
        <StarIcon
          filled={fav}
          className={`h-4 w-4 shrink-0 ${fav ? 'text-amber-400' : 'text-zinc-600'}`}
        />
        {team.image ? (
          <img
            src={team.image}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className="h-5 w-5 shrink-0 object-contain"
          />
        ) : (
          <span className="h-5 w-5 shrink-0 rounded bg-zinc-800" />
        )}
        <span className="shrink-0 text-sm font-semibold">{team.code}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">
          {team.name === team.code ? '' : team.name}
        </span>
      </button>
    )
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="settings-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-y-0 right-0 m-0 ml-auto h-full max-h-none w-full max-w-sm border-l border-zinc-800 bg-zinc-950 p-0 text-zinc-100 shadow-xl backdrop:bg-black/60 open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 id="settings-title" className="font-semibold">
          Settings
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="rounded-md border border-zinc-700 px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <h3 className="flex items-center gap-2 px-4 pt-1 pb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          <StarIcon className="h-3.5 w-3.5 text-amber-400" />
          Favorite teams
          {prefs.favorites.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300 tabular-nums">
              {prefs.favorites.length}
            </span>
          )}
        </h3>
        <p className="px-4 pb-2 text-xs text-zinc-600">
          Favorites are shown with a ★ and get a boost in HOT matches.
        </p>
        <div className="px-4 pb-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams…"
            aria-label="Search teams"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        </div>
        {teamOptions.length === 0 ? (
          <p className="px-4 pb-2 text-sm text-zinc-500">No teams in the current schedule</p>
        ) : filteredTeams.length === 0 ? (
          <p className="px-4 pb-2 text-sm text-zinc-500">No teams match “{query.trim()}”</p>
        ) : (
          filteredTeams.map(teamRow)
        )}

        <h3 className="px-4 pt-4 pb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Leagues
        </h3>
        {all.length === 0 && <p className="px-4 text-sm text-zinc-500">No leagues</p>}
        {visible.length > 0 && (
          <>
            <h4 className="px-4 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase">
              Shown
            </h4>
            <p className="px-4 pb-1 text-xs text-zinc-600">Order is saved in this browser</p>
            {visible.map((league) => leagueRow(league, false))}
          </>
        )}
        {hidden.length > 0 && (
          <h4 className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase">
            Hidden
          </h4>
        )}
        {hidden.map((league) => leagueRow(league, true))}
      </div>

      <div className="border-t border-zinc-800 p-4">
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-md border border-zinc-700 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Reset
        </button>
      </div>
    </dialog>
  )
}
