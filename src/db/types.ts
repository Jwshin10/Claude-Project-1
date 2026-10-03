export type Status = 'todo' | 'doing' | 'done'
export type Priority = 'none' | 'low' | 'medium' | 'high'
export type ViewMode = 'list' | 'board'

export const GROUP_COLORS = {
  gray: '#8a8a85',
  blue: '#3b82f6',
  green: '#3fa66b',
  orange: '#e0823d',
  purple: '#8b5cf6',
  pink: '#d9568f',
  yellow: '#d4a72c',
  red: '#e5534b',
} as const

export type GroupColor = keyof typeof GROUP_COLORS
export const GROUP_COLOR_NAMES = Object.keys(GROUP_COLORS) as GroupColor[]

export interface Plan {
  id: string
  title: string
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
  color: GroupColor
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
