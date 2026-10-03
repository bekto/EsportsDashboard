import { useEffect, useRef } from 'react'
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
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const visible: Props['all'] = []
  for (const slug of visibleOrder) {
    const league = all.find((l) => l.slug === slug)
    if (league) visible.push(league)
  }
  const hidden = all.filter((l) => prefs.hidden.includes(l.slug))

  const rowClass = 'flex w-full items-center gap-2 px-4 py-2'

  const row = (league: Props['all'][number], isHidden: boolean) => {
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
          Leagues
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
        {all.length === 0 && <p className="px-4 text-sm text-zinc-500">No leagues</p>}
        {visible.length > 0 && (
          <>
            <h3 className="px-4 pt-1 pb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Shown
            </h3>
            <p className="px-4 pb-1 text-xs text-zinc-600">Order is saved in this browser</p>
            {visible.map((league) => row(league, false))}
          </>
        )}
        {hidden.length > 0 && (
          <h3 className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Hidden
          </h3>
        )}
        {hidden.map((league) => row(league, true))}
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
