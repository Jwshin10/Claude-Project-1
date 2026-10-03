import { describe, expect, it } from 'vitest'
import { describeDue, parseISODate, toISODate } from './dates'

const now = new Date(2026, 9, 3, 15, 30) // Sat Oct 3 2026, mid-afternoon

describe('dates', () => {
  it('round-trips local dates', () => {
    expect(toISODate(now)).toBe('2026-10-03')
    expect(toISODate(parseISODate('2026-01-09'))).toBe('2026-01-09')
  })

  it('describes due dates relative to today', () => {
    expect(describeDue('2026-10-03', now)).toEqual({ label: 'Today', tone: 'today' })
    expect(describeDue('2026-10-04', now)).toEqual({ label: 'Tomorrow', tone: 'soon' })
    expect(describeDue('2026-10-02', now)).toEqual({ label: 'Yesterday', tone: 'overdue' })
    expect(describeDue('2026-10-07', now).tone).toBe('soon')
    expect(describeDue('2026-09-20', now).tone).toBe('overdue')
    expect(describeDue('2026-11-20', now).tone).toBe('later')
    expect(describeDue('2027-01-05', now).label).toContain('2027')
  })
})
