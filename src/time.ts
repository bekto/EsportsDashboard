import { useEffect, useState } from 'react'

export const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const localFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function formatLocal(ms: number): string {
  return localFmt.format(ms)
}

export function formatTime(ms: number): string {
  return timeFmt.format(ms)
}

export function countdown(startMs: number, nowMs: number): string {
  const diff = startMs - nowMs
  if (diff < 60_000) return 'starting soon'
  if (diff < 3600_000) return `in ${Math.floor(diff / 60_000)}m`
  if (diff < 24 * 3600_000) {
    return `in ${Math.floor(diff / 3600_000)}h ${Math.floor((diff % 3600_000) / 60_000)}m`
  }
  return `in ${Math.floor(diff / 86400_000)}d ${Math.floor((diff % 86400_000) / 3600_000)}h`
}

export function dayLabel(ms: number, nowMs: number): string {
  const day = (t: number) => {
    const d = new Date(t)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  const delta = Math.round((day(ms) - day(nowMs)) / 86400_000)
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Tomorrow'
  if (delta === -1) return 'Yesterday'
  return dateFmt.format(ms)
}

export function ago(ms: number, nowMs: number): string {
  const diff = nowMs - ms
  if (diff < 60_000) return 'just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 24 * 3600_000) return `${Math.floor(diff / 3600_000)}h ago`
  return `${Math.floor(diff / 86400_000)}d ago`
}
