import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLeagues, fetchSchedule } from './api'
import type { League, ScheduleEvent } from './api'

const KEY = 'lolDash.data.v1'
const TTL_MS = 5 * 60_000
const FAST_MS = 60_000
const SLOW_MS = 5 * 60_000
const SOON_MS = 15 * 60_000

type Cache = { fetchedAt: number; leagues: League[]; events: ScheduleEvent[] }

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Cache
    if (typeof c?.fetchedAt !== 'number' || !Array.isArray(c.leagues) || !Array.isArray(c.events)) return null
    return c
  } catch {
    return null
  }
}

export function useSchedule() {
  const [data, setData] = useState<Cache | null>(readCache)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      const [leagues, events] = await Promise.all([fetchLeagues(), fetchSchedule()])
      const next = { fetchedAt: Date.now(), leagues, events }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* quota / private mode: keep serving from memory */
      }
      setData(next)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [])

  // initial load / stale-cache fetch
  useEffect(() => {
    const c = dataRef.current
    if (!c || Date.now() - c.fetchedAt > TTL_MS) void refresh()
  }, [refresh])

  // cadence: 60s while anything is live or starts soon, else 5min
  useEffect(() => {
    if (!data) return
    const hot = data.events.some(
      (e) => e.state === 'inProgress' || (e.state === 'unstarted' && Date.parse(e.startTime) - Date.now() <= SOON_MS),
    )
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, hot ? FAST_MS : SLOW_MS)
    return () => clearInterval(id)
  }, [data, refresh])

  // refetch on tab return if stale
  useEffect(() => {
    const onVisible = () => {
      const c = dataRef.current
      if (document.visibilityState === 'visible' && (!c || Date.now() - c.fetchedAt > TTL_MS)) void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  return {
    leagues: data?.leagues ?? [],
    events: data?.events ?? [],
    fetchedAt: data?.fetchedAt ?? null,
    loading,
    error,
    refresh,
  }
}
