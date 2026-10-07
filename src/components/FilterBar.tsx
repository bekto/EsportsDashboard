import { useEffect, useRef } from 'react'
import { StarIcon } from './MatchCard'

interface Props {
  query: string
  onQuery: (value: string) => void
  followingOnly: boolean
  onFollowing: (value: boolean) => void
  onClear: () => void
  count: number
}

/** Search + Following toggle shown above the board. "/" focuses the search box. */
export default function FilterBar({
  query,
  onQuery,
  followingOnly,
  onFollowing,
  onClear,
  count,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const active = query.trim().length > 0 || followingOnly

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[14rem] flex-1">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search teams or leagues…  ( / )"
          aria-label="Search matches"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-1.5 pr-3 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => onFollowing(!followingOnly)}
        aria-pressed={followingOnly}
        title="Show only matches with favorite teams"
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
          followingOnly
            ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
            : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
        }`}
      >
        <StarIcon filled={followingOnly} className="h-4 w-4" />
        Following
      </button>

      {active && (
        <>
          <span className="text-xs text-zinc-500 tabular-nums" role="status" aria-live="polite">
            {count} {count === 1 ? 'match' : 'matches'}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Clear
          </button>
        </>
      )}
    </div>
  )
}
