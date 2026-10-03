import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronsUpDown, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { deleteItem, moveItem, updateItem } from '../db/actions'
import { db } from '../db/db'
import { colorVar, type Group, type Item, type Priority, type Status } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { toISODate } from '../lib/dates'
import { newId } from '../lib/id'
import { PRIORITY_LABEL } from '../lib/priority'
import { GroupedRow, GroupedSection } from './Chrome'
import { InlineInput } from './InlineInput'
import { CheckCircle } from './ItemBits'
import { Segmented } from './Segmented'
import { Toggle } from './Toggle'

const STATUSES: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'doing', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]
const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high']

/** Item details, presented as a sheet. Changes save as you make them. */
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
      aria-labelledby="details-title"
      className={cn(
        'sheet anim-sheet m-auto w-[calc(100%-2rem)] max-w-[33rem] overflow-hidden rounded-[18px] bg-grouped p-0 text-label shadow-float',
        'max-md:mt-auto max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none',
      )}
    >
      {item && <Details item={item} groups={groups} onClose={() => ref.current?.close()} />}
    </dialog>
  )
}

function Details({ item, groups, onClose }: { item: Item; groups: Group[]; onClose: () => void }) {
  const save = (patch: Partial<Item>) => updateItem(item.id, patch)
  const color = colorVar(groups.find((g) => g.id === item.groupId)?.color ?? 'blue')

  const remove = async () => {
    if (await confirmAction({ title: `Delete “${item.title}”?`, message: 'You can’t undo this.', confirmLabel: 'Delete' })) {
      onClose()
      void deleteItem(item.id)
    }
  }

  return (
    <div className="flex max-h-[85dvh] flex-col max-md:max-h-[94dvh]">
      <div className="mx-auto mt-[5px] h-[5px] w-9 rounded-full bg-label-3 md:hidden" aria-hidden />
      <div className="grid h-[52px] shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4">
        <span />
        <h2 id="details-title" className="text-headline font-semibold">
          Details
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="flex size-[30px] items-center justify-center justify-self-end rounded-full bg-fill-3 text-label-2 hover:bg-fill-2"
        >
          <X size={16} strokeWidth={2.6} />
        </button>
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto px-4 pt-1 pb-8">
        <GroupedSection>
          <div className="px-4 pt-3 pb-2">
            <InlineInput value={item.title} onCommit={(title) => save({ title })} wrap aria-label="Title" placeholder="Title" className="text-body font-semibold" />
          </div>
          <div className="ml-4 border-t border-separator pt-2 pr-4 pb-3">
            <InlineInput
              value={item.notes}
              onCommit={(notes) => save({ notes })}
              multiline
              allowEmpty
              placeholder="Notes"
              aria-label="Notes"
              className="min-h-[4.5rem] text-subhead text-label-2"
            />
          </div>
        </GroupedSection>

        <GroupedSection>
          <GroupedRow className="flex-wrap justify-between py-2">
            <span>Status</span>
            <Segmented label="Status" className="max-md:w-full" options={STATUSES} value={item.status} onChange={(status) => save({ status })} />
          </GroupedRow>
          <GroupedRow className="justify-between">
            <span>Priority</span>
            <PopUp label="Priority" value={item.priority} onChange={(priority) => save({ priority: priority as Priority })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </PopUp>
          </GroupedRow>
          <GroupedRow className="justify-between">
            <span className="flex flex-col">
              Date
              {item.dueDate && <span className="text-footnote text-tint">{formatLong(item.dueDate)}</span>}
            </span>
            <Toggle label="Date" checked={!!item.dueDate} onChange={(on) => save({ dueDate: on ? toISODate() : null })} />
          </GroupedRow>
          {item.dueDate && (
            <GroupedRow className="justify-end py-1.5">
              <input
                type="date"
                aria-label="Due date"
                value={item.dueDate}
                onChange={(e) => save({ dueDate: e.target.value || null })}
                className="h-[34px] rounded-[8px] bg-fill-3 px-2.5 text-body text-tint outline-none"
              />
            </GroupedRow>
          )}
          <GroupedRow className="justify-between">
            <span>Group</span>
            <PopUp label="Group" value={item.groupId} onChange={(groupId) => moveItem(item.id, groupId, null)}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </PopUp>
          </GroupedRow>
        </GroupedSection>

        <GroupedSection header="Tags">
          <TagEditor tags={item.tags} onChange={(tags) => save({ tags })} />
        </GroupedSection>

        <Steps item={item} color={color} />

        <GroupedSection>
          <button type="button" onClick={remove} className="h-11 w-full text-center text-body text-red hover:bg-fill-4">
            Delete Item
          </button>
        </GroupedSection>
      </div>
    </div>
  )
}

function formatLong(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

/** A pop-up button: shows the current choice, opens the system menu. */
function PopUp({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="relative flex items-center text-label-2">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 max-w-48 appearance-none truncate bg-transparent pr-6 text-right text-body outline-none">
        {children}
      </select>
      <ChevronsUpDown size={15} className="pointer-events-none absolute right-0" aria-hidden />
    </label>
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
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 px-4 py-2">
      {tags.map((tag) => (
        <span key={tag} className="flex h-7 items-center gap-1 rounded-full bg-fill-3 pr-1 pl-3 text-subhead">
          #{tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="flex size-5 items-center justify-center rounded-full text-label-2 hover:bg-fill-2"
          >
            <X size={12} strokeWidth={2.6} />
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
        placeholder="Add Tag"
        aria-label="Add Tag"
        className="h-7 min-w-24 flex-1 bg-transparent text-body outline-none"
      />
    </div>
  )
}

function Steps({ item, color }: { item: Item; color: string }) {
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
    <GroupedSection header={list.length > 0 ? `Steps · ${done} of ${list.length} Done` : 'Steps'}>
      {list.map((entry) => (
        <GroupedRow key={entry.id} className="group/step gap-3">
          <CheckCircle
            size={20}
            color={color}
            checked={entry.done}
            label={`Done: ${entry.text}`}
            onToggle={() => save(list.map((c) => (c.id === entry.id ? { ...c, done: !c.done } : c)))}
          />
          <InlineInput
            value={entry.text}
            onCommit={(value) => save(list.map((c) => (c.id === entry.id ? { ...c, text: value } : c)))}
            aria-label="Step"
            className={cn('flex-1 text-body', entry.done && 'text-label-2')}
          />
          <button
            type="button"
            aria-label={`Remove ${entry.text}`}
            onClick={() => save(list.filter((c) => c.id !== entry.id))}
            className="flex size-7 items-center justify-center rounded-full text-label-3 opacity-0 group-hover/step:opacity-100 hover:text-red focus:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <X size={15} />
          </button>
        </GroupedRow>
      ))}
      <GroupedRow className="gap-3">
        <Plus size={20} className="text-tint" aria-hidden />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
          onBlur={add}
          placeholder="Add Step"
          aria-label="Add Step"
          className="h-11 flex-1 bg-transparent text-body caret-tint outline-none"
        />
      </GroupedRow>
    </GroupedSection>
  )
}
