import { ago, timeZone } from '../time'

export interface NavItem {
  href: string
  label: string
  image: string | null
  live: boolean
}

interface Props {
  fetchedAt: number | null
  now: number
  loading: boolean
  liveCount: number
  nav: NavItem[]
  active: string | null
  onRefresh: () => void
  onSettings: () => void
}

export default function Header({
  fetchedAt,
  now,
  loading,
  liveCount,
  nav,
  active,
  onRefresh,
  onSettings,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
        <h1 className="flex shrink-0 items-center gap-1.5 text-lg font-bold tracking-tight">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-400" fill="currentColor" aria-hidden="true">
            <path d="M12 2c.5 3.5-1.5 4.6-2.7 6.2C7.9 10.1 7 11.6 7 14a5 5 0 0 0 10 0c0-1.6-.6-3-1.5-4.4-.4.9-1 1.5-1.8 1.7.5-2.9-1-6.9-1.7-9.3Z" />
          </svg>
          LoL Esports
        </h1>
        <span className="min-w-0 truncate text-xs text-zinc-500">{timeZone}</span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {liveCount > 0 && (
            <a
              href="#hot"
              className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse" />
              {liveCount} live
            </a>
          )}
          <span className="hidden text-xs text-zinc-400 sm:inline">
            {fetchedAt ? `Updated ${ago(fetchedAt, now)}` : 'Not updated yet'}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh data"
            className="rounded-md border border-zinc-700 p-1.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 ${loading ? 'motion-safe:animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onSettings}
            aria-label="League settings"
            className="rounded-md border border-zinc-700 p-1.5 text-zinc-300 hover:bg-zinc-800"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
        </div>
      </div>
      {nav.length > 0 && (
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.href === `#${active}` ? 'true' : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                item.href === `#${active}`
                  ? 'border-sky-500/60 bg-sky-500/10 text-sky-200'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                  className="h-4 w-4 object-contain"
                />
              )}
              <span className="whitespace-nowrap">{item.label}</span>
              {item.live && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
