import { AlignLeft, Calendar, CheckCircle2, CircleDot, Circle, Flag, ListChecks } from 'lucide-react'
import { toggleItemDone } from '../db/actions'
import type { Item } from '../db/types'
import { cn } from '../lib/cn'
import { describeDue } from '../lib/dates'
import { PRIORITY_CLASS, PRIORITY_LABEL } from '../lib/priority'

export function StatusCheckbox({ item, size = 18 }: { item: Item; size?: number }) {
  const done = item.status === 'done'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? 'Mark as not done' : 'Mark as done'}
      onClick={(e) => {
        e.stopPropagation()
        void toggleItemDone(item)
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className="flex shrink-0 items-center justify-center rounded-full text-faint hover:text-accent"
    >
      {done ? (
        <CheckCircle2 size={size} className="text-accent" />
      ) : item.status === 'doing' ? (
        <CircleDot size={size} className="text-warn" />
      ) : (
        <Circle size={size} />
      )}
    </button>
  )
}

const DUE_TONE_CLASS = { overdue: 'text-danger', today: 'text-warn', soon: 'text-text', later: 'text-muted' }

/** Small badges shown under or beside an item: due date, priority, checklist, notes, tags. */
export function ItemMeta({ item, className }: { item: Item; className?: string }) {
  const done = item.status === 'done'
  const due = item.dueDate ? describeDue(item.dueDate) : null
  const checked = item.checklist.filter((c) => c.done).length
  const hasAny = due || item.priority !== 'none' || item.checklist.length > 0 || item.notes || item.tags.length > 0 || item.status === 'doing'
  if (!hasAny) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted', className)}>
      {item.status === 'doing' && <span className="rounded bg-warn/15 px-1.5 py-0.5 font-medium text-warn">In progress</span>}
      {due && (
        <span className={cn('flex items-center gap-1', done ? 'text-faint' : DUE_TONE_CLASS[due.tone])}>
          <Calendar size={12} /> {due.label}
        </span>
      )}
      {item.priority !== 'none' && (
        <span className={cn('flex items-center gap-1', PRIORITY_CLASS[item.priority])} title={`${PRIORITY_LABEL[item.priority]} priority`}>
          <Flag size={12} /> {PRIORITY_LABEL[item.priority]}
        </span>
      )}
      {item.checklist.length > 0 && (
        <span className={cn('flex items-center gap-1', checked === item.checklist.length && 'text-ok')}>
          <ListChecks size={12} /> {checked}/{item.checklist.length}
        </span>
      )}
      {item.notes && <AlignLeft size={12} aria-label="Has notes" />}
      {item.tags.map((tag) => (
        <span key={tag} className="rounded bg-surface-2 px-1.5 py-0.5 text-muted">
          #{tag}
        </span>
      ))}
    </div>
  )
}
