import { useLiveQuery } from 'dexie-react-hooks'
import { Eye, EyeOff, MoreHorizontal, Trash2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BoardView } from '../components/BoardView'
import { countByGroup } from '../components/counts'
import { Dropdown, MenuItem } from '../components/Dropdown'
import { InlineInput } from '../components/InlineInput'
import { ItemDialog } from '../components/ItemDialog'
import { ListView } from '../components/ListView'
import { Segmented } from '../components/Segmented'
import { deletePlan, updatePlan } from '../db/actions'
import { db } from '../db/db'
import type { Item, Plan } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { describeDue } from '../lib/dates'

const ICONS = ['📋', '✈️', '🏠', '💼', '🎯', '📚', '💪', '🍳', '🎉', '💰', '🛒', '🌱', '🧳', '🎨', '🧠', '❤️', '🚗', '🎓', '🗓️', '⭐', '🔥', '🏖️', '🎵', '👋']

export function PlanPage() {
  const { planId = '' } = useParams()
  const plan = useLiveQuery(async () => (await db.plans.get(planId)) ?? null, [planId])
  const groups = useLiveQuery(() => db.groups.where('planId').equals(planId).sortBy('position'), [planId])
  const allItems = useLiveQuery(() => db.items.where('planId').equals(planId).toArray(), [planId])

  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const openItemId = params.get('item')
  // Opening an item adds a history entry, so the browser/phone back button closes it.
  const openItem = useCallback((id: string) => setParams({ item: id }, { state: { openedItem: true } }), [setParams])
  const openedHere = (location.state as { openedItem?: boolean } | null)?.openedItem ?? false
  const closeItem = useCallback(() => {
    if (openedHere) navigate(-1)
    else setParams({}, { replace: true })
  }, [openedHere, navigate, setParams])

  const hideDone = plan?.hideDone ?? false
  // Memoised so the drag-and-drop state can tell when a fresh query result arrives.
  const items = useMemo(() => (hideDone ? allItems?.filter((i) => i.status !== 'done') : allItems), [allItems, hideDone])
  const counts = useMemo(() => countByGroup(allItems ?? []), [allItems])

  if (plan === null) return <p className="p-14 text-ink-2">This plan has been deleted.</p>
  if (!plan || !groups || !items || !allItems) return null

  const viewProps = { planId, groups, items, counts, onOpen: openItem }

  return (
    <div className="flex min-h-full flex-col pb-20">
      <div className={cn('w-full px-4 pt-9 pb-7 md:px-14 md:pt-16', plan.view === 'list' && 'mx-auto max-w-[48rem]')}>
        <PlanHeader key={plan.id} plan={plan} items={allItems} />
      </div>
      {plan.view === 'board' ? (
        <BoardView {...viewProps} />
      ) : (
        <div className="mx-auto w-full max-w-[48rem] px-4 md:px-14">
          <ListView {...viewProps} />
        </div>
      )}
      {openItemId && <ItemDialog key={openItemId} itemId={openItemId} groups={groups} onClose={closeItem} />}
    </div>
  )
}

function PlanHeader({ plan, items }: { plan: Plan; items: Item[] }) {
  const navigate = useNavigate()
  const location = useLocation()
  const focusTitle = (location.state as { focusTitle?: boolean } | null)?.focusTitle ?? false

  const remove = async () => {
    const ok = await confirmAction({
      title: `Delete "${plan.title || 'Untitled plan'}"?`,
      message: 'All of its groups and items will be deleted too.',
    })
    if (!ok) return
    await deletePlan(plan.id)
    navigate('/', { replace: true })
  }

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <Dropdown
          label={<span className="text-[28px] leading-none">{plan.icon}</span>}
          ariaLabel="Change sticker"
          align="left"
          buttonClassName="mt-1 size-14 shrink-0 -rotate-3 rounded-xl border border-rule-strong bg-card shadow-paper hover:rotate-0 transition-transform"
        >
          {(close) => (
            <div className="grid grid-cols-6 gap-1">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  aria-label={`Use ${icon}`}
                  onClick={() => {
                    void updatePlan(plan.id, { icon })
                    close()
                  }}
                  className={cn('flex size-9 items-center justify-center rounded-md text-xl hover:bg-hover', icon === plan.icon && 'bg-tint')}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </Dropdown>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <InlineInput
            value={plan.title}
            onCommit={(title) => updatePlan(plan.id, { title })}
            autoFocus={focusTitle}
            wrap
            placeholder="Untitled plan"
            aria-label="Plan title"
            className="font-display text-[2.1rem] leading-[1.15] md:text-[2.6rem]"
          />
          <InlineInput
            value={plan.description}
            onCommit={(description) => updatePlan(plan.id, { description })}
            allowEmpty
            multiline
            placeholder="Add a note about this plan"
            aria-label="Plan description"
            className="text-ink-2"
          />
        </div>
      </div>

      <Progress items={items} />

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="View"
          value={plan.view}
          onChange={(view) => updatePlan(plan.id, { view })}
          options={[
            { value: 'list', label: 'List' },
            { value: 'board', label: 'Board' },
          ]}
        />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => updatePlan(plan.id, { hideDone: !plan.hideDone })}
          aria-pressed={plan.hideDone}
          className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13.5px] text-ink-2 hover:bg-hover hover:text-ink"
        >
          {plan.hideDone ? <EyeOff size={15} /> : <Eye size={15} />}
          {plan.hideDone ? 'Show done' : 'Hide done'}
        </button>
        <Dropdown label={<MoreHorizontal size={18} />} ariaLabel="Plan options">
          {(close) => (
            <MenuItem
              danger
              onClick={() => {
                close()
                void remove()
              }}
            >
              <Trash2 size={15} /> Delete plan
            </MenuItem>
          )}
        </Dropdown>
      </div>
    </header>
  )
}

/** "4 of 12 done", a progress line, and what's due next. */
function Progress({ items }: { items: Item[] }) {
  if (items.length === 0) return null
  const done = items.filter((i) => i.status === 'done').length
  const next = items
    .filter((i) => i.status !== 'done' && i.dueDate)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0]
  const due = next?.dueDate ? describeDue(next.dueDate) : null

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-ink-2 tabular-nums">
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 w-28 overflow-hidden rounded-full bg-rule"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={done}
          aria-label="Items done"
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
        <span>
          {done} of {items.length} done
        </span>
      </div>
      {next && due && (
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0">Next up</span>
          <span className="min-w-0 truncate text-ink">{next.title}</span>
          <span className={cn('shrink-0', due.tone === 'today' && 'highlighter', due.tone === 'overdue' && 'text-danger')}>
            {due.tone === 'overdue' ? `${due.label}, overdue` : due.label}
          </span>
        </span>
      )}
    </div>
  )
}
