import { useLiveQuery } from 'dexie-react-hooks'
import { Eye, EyeOff, Kanban, List, MoreHorizontal, Trash2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BoardView } from '../components/BoardView'
import { Dropdown, MenuItem } from '../components/Dropdown'
import { InlineInput } from '../components/InlineInput'
import { ItemDialog } from '../components/ItemDialog'
import { ListView } from '../components/ListView'
import { deletePlan, updatePlan } from '../db/actions'
import { db } from '../db/db'
import type { Plan, ViewMode } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'

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
  const totals = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of allItems ?? []) counts.set(item.groupId, (counts.get(item.groupId) ?? 0) + 1)
    return counts
  }, [allItems])

  if (plan === null) return <p className="p-12 text-muted">This plan doesn’t exist any more.</p>
  if (!plan || !groups || !items) return null

  const doneCount = (allItems ?? []).filter((i) => i.status === 'done').length
  const viewProps = { planId, groups, items, totals, onOpen: openItem }

  return (
    <div className="flex min-h-full flex-col pb-16">
      <div className={cn('w-full px-4 pt-8 pb-6 md:px-12 md:pt-14', plan.view === 'list' && 'mx-auto max-w-3xl')}>
        <PlanHeader key={plan.id} plan={plan} doneCount={doneCount} />
      </div>
      {plan.view === 'board' ? (
        <BoardView {...viewProps} />
      ) : (
        <div className="mx-auto w-full max-w-3xl px-4 md:px-12">
          <ListView {...viewProps} />
        </div>
      )}
      {openItemId && <ItemDialog key={openItemId} itemId={openItemId} groups={groups} onClose={closeItem} />}
    </div>
  )
}

function PlanHeader({ plan, doneCount }: { plan: Plan; doneCount: number }) {
  const navigate = useNavigate()
  const location = useLocation()
  const focusTitle = (location.state as { focusTitle?: boolean } | null)?.focusTitle ?? false

  const remove = async () => {
    if (!(await confirmAction({ title: `Delete "${plan.title || 'Untitled plan'}"?`, message: 'All of its groups and items will be deleted too.' }))) return
    await deletePlan(plan.id)
    navigate('/', { replace: true })
  }

  return (
    <header className="flex flex-col gap-3">
      <Dropdown label={<span className="text-5xl leading-none">{plan.icon}</span>} ariaLabel="Change icon" align="left" buttonClassName="size-16">
        {(close) => (
          <div className="grid grid-cols-6 gap-1 p-1">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                aria-label={`Use ${icon}`}
                onClick={() => {
                  void updatePlan(plan.id, { icon })
                  close()
                }}
                className="flex size-9 items-center justify-center rounded-md text-xl hover:bg-hover"
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <InlineInput
        value={plan.title}
        onCommit={(title) => updatePlan(plan.id, { title })}
        autoFocus={focusTitle}
        placeholder="Untitled plan"
        aria-label="Plan title"
        className="text-3xl font-bold tracking-tight md:text-4xl"
      />
      <InlineInput
        value={plan.description}
        onCommit={(description) => updatePlan(plan.id, { description })}
        allowEmpty
        multiline
        placeholder="Add a description…"
        aria-label="Plan description"
        className="text-sm text-muted"
      />

      <div className="flex items-center gap-2 border-b border-border pb-2">
        <ViewSwitch value={plan.view} onChange={(view) => updatePlan(plan.id, { view })} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => updatePlan(plan.id, { hideDone: !plan.hideDone })}
          aria-pressed={plan.hideDone}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:bg-hover hover:text-text"
        >
          {plan.hideDone ? <EyeOff size={14} /> : <Eye size={14} />}
          {plan.hideDone ? `${doneCount} done hidden` : 'Hide done'}
        </button>
        <Dropdown label={<MoreHorizontal size={16} />} ariaLabel="Plan options">
          {(close) => (
            <MenuItem
              danger
              onClick={() => {
                close()
                void remove()
              }}
            >
              <Trash2 size={14} /> Delete plan
            </MenuItem>
          )}
        </Dropdown>
      </div>
    </header>
  )
}

function ViewSwitch({ value, onChange }: { value: ViewMode; onChange: (view: ViewMode) => void }) {
  const options = [
    { value: 'list' as const, label: 'List', icon: <List size={14} /> },
    { value: 'board' as const, label: 'Board', icon: <Kanban size={14} /> },
  ]
  return (
    <div role="tablist" aria-label="View" className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-sm',
            value === o.value ? 'bg-hover font-medium text-text' : 'text-muted hover:bg-hover hover:text-text',
          )}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  )
}
