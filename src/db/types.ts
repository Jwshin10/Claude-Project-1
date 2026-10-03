export type Status = 'todo' | 'doing' | 'done'
export type Priority = 'none' | 'low' | 'medium' | 'high'
export type ViewMode = 'list' | 'board'

// Apple system colours, defined per appearance in index.css. Keys are stored
// in the database, so never rename them.
export const COLOR_NAMES = ['blue', 'orange', 'green', 'purple', 'pink', 'red', 'yellow', 'gray'] as const
export type ColorName = (typeof COLOR_NAMES)[number]
export const COLOR_LABEL: Record<ColorName, string> = {
  blue: 'Blue',
  orange: 'Orange',
  green: 'Green',
  purple: 'Purple',
  pink: 'Pink',
  red: 'Red',
  yellow: 'Yellow',
  gray: 'Gray',
}
/** CSS value for a colour name, e.g. var(--c-blue). */
export const colorVar = (name: ColorName) => `var(--c-${name})`

export interface Plan {
  id: string
  title: string
  color: ColorName
  /** Kept for older backups; no longer shown. */
  icon: string
  description: string
  view: ViewMode
  hideDone: boolean
  position: number
  createdAt: number
  updatedAt: number
}

/** A category inside a plan, e.g. "Flights" or "Things to do". */
export interface Group {
  id: string
  planId: string
  name: string
  color: ColorName
  position: number
  createdAt: number
}

export interface ChecklistEntry {
  id: string
  text: string
  done: boolean
}

export interface Item {
  id: string
  planId: string
  groupId: string
  title: string
  notes: string
  status: Status
  priority: Priority
  /** Local calendar date as YYYY-MM-DD, or null when there is no due date. */
  dueDate: string | null
  tags: string[]
  checklist: ChecklistEntry[]
  position: number
  createdAt: number
  updatedAt: number
}

/** Fields a caller may set when creating or editing an item. */
export type ItemFields = Pick<Item, 'title' | 'notes' | 'status' | 'priority' | 'dueDate' | 'tags' | 'checklist'>
