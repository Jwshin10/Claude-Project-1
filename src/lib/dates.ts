const pad = (n: number) => String(n).padStart(2, '0')

/** Today's local date as YYYY-MM-DD. */
export function toISODate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parses YYYY-MM-DD as a local date (new Date('2026-10-03') would be UTC midnight). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later'

export function describeDue(iso: string, now: Date = new Date()): { label: string; tone: DueTone } {
  const due = parseISODate(iso)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (days === 0) return { label: 'Today', tone: 'today' }
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' }
  if (days === -1) return { label: 'Yesterday', tone: 'overdue' }
  if (days > 1 && days < 7) return { label: due.toLocaleDateString(undefined, { weekday: 'short' }), tone: 'soon' }

  const label = due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(due.getFullYear() !== today.getFullYear() && { year: 'numeric' }),
  })
  return { label, tone: days < 0 ? 'overdue' : 'later' }
}
