import type { Priority } from '../db/types'

export const PRIORITY_LABEL: Record<Priority, string> = { none: 'None', low: 'Low', medium: 'Medium', high: 'High' }
export const PRIORITY_CLASS: Record<Priority, string> = { none: 'text-faint', low: 'text-accent', medium: 'text-warn', high: 'text-danger' }
