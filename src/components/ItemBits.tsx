import { ListChecks } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { toggleItemDone } from '../db/actions'
import type { Item, Priority } from '../db/types'
import { cn } from '../lib/cn'
import { describeDue } from '../lib/dates'
import { PRIORITY_LABEL } from '../lib/priority'

interface CheckCircleProps {
  checked: boolean
  onToggle: () => void
  label: string
  /** Half-filled: started but not finished. */
  started?: boolean
  size?: number
  /** CSS colour for the ring and fill; defaults to the tint colour. */
  color?: string
}

/** The round completion button from Reminders: an empty ring, filled in the group's colour when done. */
export function CheckCircle({ checked, onToggle, label, started, size = 22, color = 'var(--tint)' }: CheckCircleProps) {
  const [justChecked, setJustChecked] = useState(false)
  const inner = size - 8
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        setJustChecked(!checked)
        onToggle()
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors',
        !checked && !started && 'border-label-3 hover:border-[var(--ring)]',
      )}
      style={{ width: size, height: size, '--ring': color, ...((checked || started) && { borderColor: color }) } as CSSProperties}
    >
      {checked && <span className={cn('rounded-full', justChecked && 'anim-pop')} style={{ width: inner, height: inner, background: color }} />}
      {started && !checked && (
        <span className="rounded-full" style={{ width: inner, height: inner, background: `conic-gradient(${color} 0 50%, transparent 0)` }} />
      )}
    </button>
  )
}

export function StatusCircle({ item, color, size }: { item: Item; color: string; size?: number }) {
  const done = item.status === 'done'
  return (
    <CheckCircle
      checked={done}
      started={item.status === 'doing'}
      onToggle={() => void toggleItemDone(item)}
      label={done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
      color={color}
      size={size}
    />
  )
}

const PRIORITY_MARK: Record<Priority, string> = { none: '', low: '!', medium: '!!', high: '!!!' }

/** Reminders-style priority marks, set before the title. */
export function PriorityMark({ priority, color }: { priority: Priority; color: string }) {
  if (priority === 'none') return null
  return (
    <span className="mr-1.5 font-semibold" style={{ color }} title={`${PRIORITY_LABEL[priority]} priority`}>
      <span aria-hidden>{PRIORITY_MARK[priority]}</span>
      <span className="sr-only">{PRIORITY_LABEL[priority]} priority, </span>
    </span>
  )
}

/** The secondary lines under an item: its notes, then status, date, steps and tags. */
export function ItemDetails({ item, className, showNotes = true }: { item: Item; className?: string; showNotes?: boolean }) {
  const done = item.status === 'done'
  const due = item.dueDate ? describeDue(item.dueDate) : null
  const checked = item.checklist.filter((c) => c.done).length
  const notes = showNotes ? item.notes.split('\n').find((line) => line.trim()) : undefined
  const hasMeta = due || item.checklist.length > 0 || item.tags.length > 0 || item.status === 'doing'
  if (!notes && !hasMeta) return null

  return (
    <div className={cn('flex min-w-0 flex-col text-subhead text-label-2', className)}>
      {notes && <p className="truncate">{notes}</p>}
      {hasMeta && (
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 tabular-nums">
          {item.status === 'doing' && <span className="text-orange">In Progress</span>}
          {due && <span className={cn(!done && due.tone === 'overdue' && 'text-red')}>{due.label}</span>}
          {item.checklist.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListChecks size={13} aria-hidden />
              {checked} of {item.checklist.length}
            </span>
          )}
          {item.tags.map((tag) => (
            <span key={tag} className="text-tint">
              #{tag}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
