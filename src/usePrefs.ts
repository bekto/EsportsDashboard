import { useCallback, useEffect, useState } from 'react'
import type { Prefs } from './logic'

const KEY = 'lolDash.prefs.v1'
const DEFAULT_PREFS: Prefs = { hidden: [], order: [] }

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Prefs
    if (!Array.isArray(p?.hidden) || !Array.isArray(p?.order)) return DEFAULT_PREFS
    return { hidden: p.hidden, order: p.order }
  } catch {
    return DEFAULT_PREFS
  }
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      /* ignore: private mode */
    }
  }, [prefs])

  const hide = useCallback((slug: string) => {
    setPrefs((p) => ({ hidden: p.hidden.includes(slug) ? p.hidden : [...p.hidden, slug], order: p.order.filter((s) => s !== slug) }))
  }, [])

  const unhide = useCallback((slug: string) => {
    setPrefs((p) => ({
      hidden: p.hidden.filter((s) => s !== slug),
      order: p.order.length && !p.order.includes(slug) ? [...p.order, slug] : p.order,
    }))
  }, [])

  const move = useCallback((slug: string, dir: -1 | 1, visibleOrder: string[]) => {
    setPrefs((p) => {
      const order = [...visibleOrder]
      const i = order.indexOf(slug)
      const j = i + dir
      if (i < 0 || j < 0 || j >= order.length) return p
      ;[order[i], order[j]] = [order[j], order[i]]
      return { ...p, order }
    })
  }, [])

  const reset = useCallback(() => setPrefs(DEFAULT_PREFS), [])

  return { prefs, hide, unhide, move, reset }
}
