import { useEffect } from 'react'
import type { Prefs } from '../logic'

interface Props {
  open: boolean
  onClose: () => void
  all: { slug: string; name: string; image: string | null }[]
  prefs: Prefs
  visibleOrder: string[]
  hide: (slug: string) => void
  unhide: (slug: string) => void
  move: (slug: string, dir: -1 | 1, visibleOrder: string[]) => void
  reset: () => void
}

export default function SettingsPanel({
  open,
  onClose,
  all,
  prefs,
  visibleOrder,
  hide,
  unhide,
  move,
  reset,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const visible: Props['all'] = []
  for (const slug of visibleOrder) {
    const league = all.find((l) => l.slug === slug)
    if (league) visible.push(league)
  }
  const hidden = all.filter((l) => prefs.hidden.includes(l.slug))

  const rowClass = 'flex w-full items-center gap-2 px-4 py-2'

  return (
    <div className="fixed inset-0 z-30">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="absolute top-0 right-0 flex h-full w-full max-w-sm flex-col border-l border-zinc-800 bg-zinc-950 shadow-xl"
        aria-label="League settings"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold">Leagues</h2>
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
          {all.length === 0 && <p className="px-4 text-sm text-zinc-500">No leagues</p>}
          {[...visible, ...hidden].map((league) => {
            const isHidden = prefs.hidden.includes(league.slug)
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
                    <img src={league.image} alt="" loading="lazy" className="h-5 w-5 object-contain" />
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
          })}
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
      </aside>
    </div>
  )
}
