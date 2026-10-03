import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { deleteItem, moveItem, updateItem } from '../db/actions'
import { db } from '../db/db'
import type { Group, Item, Priority, Status } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { toISODate } from '../lib/dates'
import { newId } from '../lib/id'
import { PRIORITY_LABEL } from '../lib/priority'
import { tabStyle } from '../lib/tab'
import { InlineInput } from './InlineInput'
import { TickBox } from './ItemBits'
import { Segmented } from './Segmented'

const STATUSES: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'doing', label: 'In progress' },
  { value: 'done', label: 'Done' },
]
const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high']
const PRIORITY_ACTIVE: Record<Priority, string> = { none: 'text-ink', low: 'text-ink', medium: 'text-warn', high: 'text-danger' }

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
        'm-auto w-[calc(100%-2rem)] max-w-[34rem] overflow-visible rounded-2xl border border-rule-strong bg-card p-0 text-ink shadow-paper',
        'max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0',
      )}
    >
      {item && <ItemEditor item={item} groups={groups} onClose={() => ref.current?.close()} />}
    </dialog>
  )
}

function ItemEditor({ item, groups, onClose }: { item: Item; groups: Group[]; onClose: () => void }) {
  const save = (patch: Partial<Item>) => updateItem(item.id, patch)
  const group = groups.find((g) => g.id === item.groupId)

  const remove = async () => {
    if (await confirmAction({ title: `Delete "${item.title}"?` })) {
      onClose()
      void deleteItem(item.id)
    }
  }

  return (
    <div className="flex max-h-[85dvh] flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 sm:px-7" style={group && tabStyle(group)}>
        <label className="relative flex items-center rounded-md bg-[var(--tab-soft)] text-[13px] font-medium">
          <span className="sr-only">Group</span>
          <select
            value={item.groupId}
            onChange={(e) => moveItem(item.id, e.target.value, null)}
            className="appearance-none rounded-md bg-transparent py-1 pr-7 pl-2.5 text-ink outline-none"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2 text-ink-2" aria-hidden />
        </label>
        <div className="flex items-center gap-0.5">
          <IconButton label="Delete item" onClick={remove} className="hover:text-danger">
            <Trash2 size={17} />
          </IconButton>
          <IconButton label="Close" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto px-5 pt-3 pb-7 sm:px-7">
        <InlineInput
          value={item.title}
          onCommit={(title) => save({ title })}
          wrap
          aria-label="Title"
          placeholder="Untitled"
          className={cn('font-display text-[1.6rem] leading-tight', item.status === 'done' && 'text-ink-2')}
        />

        <dl className="grid grid-cols-[6.5rem_1fr] items-center border-t border-rule text-sm [&>*]:min-h-12 [&>*]:border-b [&>*]:border-rule [&>dd]:flex [&>dd]:items-center [&>dt]:flex [&>dt]:items-center [&>dt]:text-ink-2">
          <dt>Status</dt>
          <dd>
            <Segmented size="sm" label="Status" options={STATUSES} value={item.status} onChange={(status) => save({ status })} />
          </dd>

          <dt>Priority</dt>
          <dd>
            <Segmented
              size="sm"
              label="Priority"
              options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p], className: PRIORITY_ACTIVE[p] }))}
              value={item.priority}
              onChange={(priority) => save({ priority })}
            />
          </dd>

          <dt>Due</dt>
          <dd className="flex-wrap gap-x-3 gap-y-1 py-2">
            <input
              type="date"
              aria-label="Due date"
              value={item.dueDate ?? ''}
              onChange={(e) => save({ dueDate: e.target.value || null })}
              className="rounded-md border border-rule-strong bg-transparent px-2 py-1 text-sm outline-none focus:border-accent"
            />
            {item.dueDate ? (
              <TextButton onClick={() => save({ dueDate: null })}>Clear</TextButton>
            ) : (
              <>
                <TextButton onClick={() => save({ dueDate: toISODate() })}>Today</TextButton>
                <TextButton onClick={() => save({ dueDate: toISODate(new Date(Date.now() + 86_400_000)) })}>Tomorrow</TextButton>
              </>
            )}
          </dd>

          <dt>Tags</dt>
          <dd className="py-2">
            <TagEditor tags={item.tags} onChange={(tags) => save({ tags })} />
          </dd>
        </dl>

        <Checklist item={item} />

        <section className="flex flex-col gap-1">
          <h3 className="font-display text-base">Notes</h3>
          <InlineInput
            value={item.notes}
            onCommit={(notes) => save({ notes })}
            multiline
            allowEmpty
            placeholder="Write anything: links, details, ideas"
            aria-label="Notes"
            className="lined min-h-[7rem] text-[15px]"
          />
        </section>
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
      className={cn('flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-hover hover:text-ink', className)}
    >
      {children}
    </button>
  )
}

function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-[13px] text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-accent hover:decoration-accent">
      {children}
    </button>
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
    <div className="flex flex-1 flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-full bg-tint py-0.5 pr-1 pl-2.5 text-[13px]">
          #{tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="flex size-4 items-center justify-center rounded-full text-ink-3 hover:bg-hover hover:text-ink"
          >
            <X size={11} />
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
        placeholder={tags.length ? '' : 'Add a tag'}
        aria-label="Add tag"
        className="min-w-20 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-ink-3"
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
    <section className="flex flex-col gap-1.5">
      <h3 className="flex items-baseline justify-between font-display text-base">
        Steps
        {list.length > 0 && (
          <span className="font-sans text-[13px] text-ink-2 tabular-nums">
            {done} of {list.length}
          </span>
        )}
      </h3>
      <ul className="flex flex-col">
        {list.map((entry) => (
          <li key={entry.id} className="group/step flex min-h-10 items-center gap-3 border-b border-rule">
            <TickBox
              size={16}
              checked={entry.done}
              label={`Done: ${entry.text}`}
              onToggle={() => save(list.map((c) => (c.id === entry.id ? { ...c, done: !c.done } : c)))}
            />
            <InlineInput
              value={entry.text}
              onCommit={(value) => save(list.map((c) => (c.id === entry.id ? { ...c, text: value } : c)))}
              aria-label="Step"
              className={cn('flex-1 text-[15px]', entry.done && 'text-ink-3')}
            />
            <button
              type="button"
              aria-label={`Remove ${entry.text}`}
              onClick={() => save(list.filter((c) => c.id !== entry.id))}
              className="flex size-7 items-center justify-center rounded-md text-ink-3 opacity-0 group-hover/step:opacity-100 hover:text-danger focus:opacity-100 max-sm:opacity-100"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <label className="flex min-h-10 items-center gap-3 text-ink-3 focus-within:text-accent">
        <Plus size={16} aria-hidden />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
          onBlur={add}
          placeholder="Add a step"
          aria-label="Add a step"
          className="flex-1 bg-transparent text-[15px] text-ink caret-accent outline-none placeholder:text-ink-3"
        />
      </label>
    </section>
  )
}
