import { useLiveQuery } from 'dexie-react-hooks'
import { Calendar, CircleDot, Flag, FolderOpen, Plus, Tag, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { deleteItem, moveItem, updateItem } from '../db/actions'
import { db } from '../db/db'
import type { Group, Item, Priority, Status } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { newId } from '../lib/id'
import { PRIORITY_CLASS, PRIORITY_LABEL } from '../lib/priority'
import { InlineInput } from './InlineInput'

const STATUSES: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'doing', label: 'In progress' },
  { value: 'done', label: 'Done' },
]
const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high']

export function ItemDialog({ itemId, groups, onClose }: { itemId: string; groups: Group[]; onClose: () => void }) {
  const item = useLiveQuery(async () => (await db.items.get(itemId)) ?? null, [itemId])
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (item === null) onClose() // deleted, or a stale link
  }, [item, onClose])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-label={item?.title ?? 'Item'}
      className={cn(
        'm-auto w-full max-w-xl rounded-xl border border-border bg-surface p-0 text-text shadow-2xl',
        'max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:border-0',
      )}
    >
      {item && <ItemEditor item={item} groups={groups} onClose={() => ref.current?.close()} />}
    </dialog>
  )
}

function ItemEditor({ item, groups, onClose }: { item: Item; groups: Group[]; onClose: () => void }) {
  const save = (patch: Partial<Item>) => updateItem(item.id, patch)

  const remove = async () => {
    if (await confirmAction({ title: `Delete "${item.title}"?` })) {
      onClose()
      void deleteItem(item.id)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <FolderOpen size={14} />
          <span className="sr-only">Group</span>
          <select
            value={item.groupId}
            onChange={(e) => moveItem(item.id, e.target.value, null)}
            className="rounded-md bg-transparent py-1 pr-1 text-xs text-muted outline-none hover:bg-hover"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <IconButton label="Delete item" onClick={remove} className="hover:text-danger">
            <Trash2 size={16} />
          </IconButton>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
      </div>

      <InlineInput
        value={item.title}
        onCommit={(title) => save({ title })}
        multiline
        aria-label="Title"
        placeholder="Untitled"
        className="text-xl font-semibold leading-snug"
      />

      <div className="grid grid-cols-[7.5rem_1fr] items-center gap-x-3 gap-y-3 text-sm">
        <PropLabel icon={<CircleDot size={14} />}>Status</PropLabel>
        <Segmented
          label="Status"
          options={STATUSES}
          value={item.status}
          onChange={(status) => save({ status })}
        />

        <PropLabel icon={<Flag size={14} />}>Priority</PropLabel>
        <Segmented
          label="Priority"
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p], className: PRIORITY_CLASS[p] }))}
          value={item.priority}
          onChange={(priority) => save({ priority })}
        />

        <PropLabel icon={<Calendar size={14} />}>Due date</PropLabel>
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Due date"
            value={item.dueDate ?? ''}
            onChange={(e) => save({ dueDate: e.target.value || null })}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-sm outline-none focus:border-accent"
          />
          {item.dueDate && (
            <button type="button" onClick={() => save({ dueDate: null })} className="text-xs text-muted hover:text-text">
              Clear
            </button>
          )}
        </div>

        <PropLabel icon={<Tag size={14} />}>Tags</PropLabel>
        <TagEditor tags={item.tags} onChange={(tags) => save({ tags })} />
      </div>

      <Checklist item={item} />

      <div className="flex flex-col gap-1.5">
        <h3 className="text-xs font-medium text-muted">Notes</h3>
        <InlineInput
          key={item.id}
          value={item.notes}
          onCommit={(notes) => save({ notes })}
          multiline
          allowEmpty
          placeholder="Add notes…"
          aria-label="Notes"
          className="min-h-24 rounded-md border border-border px-3 py-2 text-sm leading-relaxed focus:border-accent"
        />
      </div>
    </div>
  )
}

function IconButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn('flex size-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-text', className)}
    >
      {children}
    </button>
  )
}

function PropLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-muted">
      {icon} {children}
    </span>
  )
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string; className?: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-fit flex-wrap rounded-lg bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium',
            value === o.value ? cn('bg-surface shadow-sm', o.className ?? 'text-text') : 'text-muted hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState('')

  const add = () => {
    const tag = text.trim().replace(/^#/, '').toLowerCase()
    setText('')
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded bg-surface-2 py-0.5 pr-1 pl-2 text-xs">
          #{tag}
          <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-faint hover:text-text">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ',') && !e.nativeEvent.isComposing) {
            e.preventDefault()
            add()
          } else if (e.key === 'Backspace' && !text && tags.length) {
            onChange(tags.slice(0, -1))
          }
        }}
        onBlur={add}
        placeholder={tags.length ? '' : 'Add a tag…'}
        aria-label="Add tag"
        className="min-w-20 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-faint"
      />
    </div>
  )
}

function Checklist({ item }: { item: Item }) {
  const [text, setText] = useState('')
  const list = item.checklist
  const save = (checklist: Item['checklist']) => updateItem(item.id, { checklist })
  const done = list.filter((c) => c.done).length

  const add = () => {
    const value = text.trim()
    setText('')
    if (value) void save([...list, { id: newId(), text: value, done: false }])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="flex items-center justify-between text-xs font-medium text-muted">
        Checklist
        {list.length > 0 && (
          <span className="tabular-nums">
            {done}/{list.length}
          </span>
        )}
      </h3>
      {list.length > 0 && (
        <div className="h-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-ok transition-all" style={{ width: `${(done / list.length) * 100}%` }} />
        </div>
      )}
      <ul className="flex flex-col">
        {list.map((entry) => (
          <li key={entry.id} className="group/check flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-hover">
            <input
              type="checkbox"
              checked={entry.done}
              aria-label={`Done: ${entry.text}`}
              onChange={() => save(list.map((c) => (c.id === entry.id ? { ...c, done: !c.done } : c)))}
              className="size-4 accent-[var(--accent)]"
            />
            <InlineInput
              value={entry.text}
              onCommit={(value) => save(list.map((c) => (c.id === entry.id ? { ...c, text: value } : c)))}
              aria-label="Checklist entry"
              className={cn('flex-1 text-sm', entry.done && 'text-faint line-through')}
            />
            <button
              type="button"
              aria-label={`Remove ${entry.text}`}
              onClick={() => save(list.filter((c) => c.id !== entry.id))}
              className="text-faint opacity-0 group-hover/check:opacity-100 hover:text-danger focus:opacity-100 max-sm:opacity-100"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 px-1">
        <Plus size={16} className="text-faint" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
          onBlur={add}
          placeholder="Add a step…"
          aria-label="Add checklist step"
          className="flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-faint"
        />
      </div>
    </div>
  )
}
