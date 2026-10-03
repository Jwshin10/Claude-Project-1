import { CornerDownRight, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { toggleItemDone } from '../db/actions'
import type { Item, Priority } from '../db/types'
import { cn } from '../lib/cn'
import { describeDue } from '../lib/dates'
import { PRIORITY_LABEL } from '../lib/priority'

interface TickBoxProps {
  checked: boolean
  onToggle: () => void
  label: string
  /** Bullet-journal slash for a started task. */
  started?: boolean
  size?: number
}

/** A box ticked by hand: the tick overshoots the box and is drawn when you check it. */
export function TickBox({ checked, onToggle, label, started, size = 18 }: TickBoxProps) {
  const [justTicked, setJustTicked] = useState(false)
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        setJustTicked(!checked)
        onToggle()
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        'relative shrink-0 rounded-[5px] border-[1.5px] transition-colors',
        checked ? 'border-ink-3/70' : started ? 'border-warn' : 'border-ink-3 hover:border-accent',
      )}
      style={{ width: size, height: size }}
    >
      {checked && (
        <svg viewBox="0 0 24 24" aria-hidden className={cn('absolute -top-[35%] -right-[30%] size-[150%] text-accent', justTicked && 'tick-animate')}>
          <path
            className="tick-path"
            pathLength={1}
            d="M4.5 12.8c1.6 1.2 3.1 2.9 4.4 4.9 2.4-5.2 6-9.6 10.6-13.2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {started && !checked && (
        <svg viewBox="0 0 16 16" aria-hidden className="absolute inset-0 size-full text-warn">
          <path d="M4 12 12 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

/** An item's status box. "In progress" shows as a slash; ticking it marks the item done. */
export function StatusCheckbox({ item, size = 18 }: { item: Item; size?: number }) {
  const done = item.status === 'done'
  return (
    <TickBox
      checked={done}
      started={item.status === 'doing'}
      onToggle={() => void toggleItemDone(item)}
      label={done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
      size={size}
    />
  )
}

const PRIORITY_MARK: Record<Priority, string> = { none: '', low: '!', medium: '!!', high: '!!!' }
const PRIORITY_TONE: Record<Priority, string> = { none: '', low: 'text-ink-3', medium: 'text-warn', high: 'text-danger' }

export function PriorityMark({ priority }: { priority: Priority }) {
  if (priority === 'none') return null
  return (
    <span className={cn('font-bold tracking-[0.08em]', PRIORITY_TONE[priority])} title={`${PRIORITY_LABEL[priority]} priority`}>
      <span aria-hidden>{PRIORITY_MARK[priority]}</span>
      <span className="sr-only">{PRIORITY_LABEL[priority]} priority</span>
    </span>
  )
}

const DUE_TONE = { overdue: 'text-danger', today: 'highlighter text-ink', soon: 'text-ink', later: 'text-ink-2' }

/** What sits beside an item: progress, due date, priority, checklist, tags. */
export function ItemMeta({ item, className }: { item: Item; className?: string }) {
  const done = item.status === 'done'
  const due = item.dueDate ? describeDue(item.dueDate) : null
  const checked = item.checklist.filter((c) => c.done).length
  const hasAny = due || item.priority !== 'none' || item.checklist.length > 0 || item.notes || item.tags.length > 0 || item.status === 'doing'
  if (!hasAny) return null

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[13px] text-ink-2 tabular-nums', done && 'opacity-60', className)}>
      {item.status === 'doing' && <span className="text-warn">In progress</span>}
      {due && (
        <span className={done ? 'text-ink-3' : DUE_TONE[due.tone]}>
          {due.tone === 'overdue' && !done ? `${due.label}, overdue` : due.label}
        </span>
      )}
      {!done && <PriorityMark priority={item.priority} />}
      {item.checklist.length > 0 && (
        <span className={cn('inline-flex items-center gap-1 self-center', checked === item.checklist.length && 'text-ok')}>
          <ListChecks size={13} aria-hidden /> {checked}/{item.checklist.length}
        </span>
      )}
      {item.notes && (
        <span className="inline-flex self-center" title="Has notes">
          <CornerDownRight size={13} aria-hidden />
          <span className="sr-only">Has notes</span>
        </span>
      )}
      {item.tags.map((tag) => (
        <span key={tag} className="text-ink-2">
          #{tag}
        </span>
      ))}
    </div>
  )
}
