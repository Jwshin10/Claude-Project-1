import { useLiveQuery } from 'dexie-react-hooks'
import { Ellipsis, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useCallback, useMemo, type CSSProperties } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BoardView } from '../components/BoardView'
import { BackLink, Toolbar } from '../components/Chrome'
import { ColorSwatches } from '../components/ColorSwatches'
import { countByGroup } from '../components/counts'
import { Dropdown, MenuItem, MenuLabel, MenuSeparator } from '../components/Dropdown'
import { InlineInput } from '../components/InlineInput'
import { ItemDialog } from '../components/ItemDialog'
import { ListView } from '../components/ListView'
import { Segmented } from '../components/Segmented'
import { deletePlan, updatePlan } from '../db/actions'
import { db } from '../db/db'
import { colorVar, type Item, type Plan } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { useIsCompact } from '../lib/useMediaQuery'

export function PlanPage() {
  const { planId = '' } = useParams()
  const plan = useLiveQuery(async () => (await db.plans.get(planId)) ?? null, [planId])
  const groups = useLiveQuery(() => db.groups.where('planId').equals(planId).sortBy('position'), [planId])
  const allItems = useLiveQuery(() => db.items.where('planId').equals(planId).toArray(), [planId])
  const compact = useIsCompact()

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

  if (plan === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-title-3 font-semibold">Plan Not Found</p>
        <p className="text-subhead text-label-2">It may have been deleted.</p>
      </div>
    )
  }
  if (!plan || !groups || !items || !allItems) return null

  const board = plan.view === 'board'
  const viewProps = { planId, groups, items, counts, onOpen: openItem }

  return (
    <div className={cn('flex min-h-full flex-col', board ? 'bg-grouped' : 'bg-bg')}>
      <Toolbar>
        {compact && <BackLink to="/">Plans</BackLink>}
        <div className="flex-1" />
        <Segmented
          label="View"
          className="w-40"
          value={plan.view}
          onChange={(view) => updatePlan(plan.id, { view })}
          options={[
            { value: 'list', label: 'List' },
            { value: 'board', label: 'Board' },
          ]}
        />
        <PlanMenu plan={plan} />
      </Toolbar>
      <div className={cn('w-full px-4 pt-5 pb-6 md:px-10 md:pt-8', !board && 'max-w-[54rem]')}>
        <PlanHeader key={plan.id} plan={plan} items={allItems} />
      </div>
      {board ? (
        <BoardView {...viewProps} />
      ) : (
        <div className="w-full max-w-[54rem] px-4 pb-16 md:px-10">
          <ListView {...viewProps} />
        </div>
      )}
      {openItemId && <ItemDialog key={openItemId} itemId={openItemId} groups={groups} onClose={closeItem} />}
    </div>
  )
}

function PlanMenu({ plan }: { plan: Plan }) {
  const navigate = useNavigate()
  const remove = async () => {
    const ok = await confirmAction({
      title: `Delete “${plan.title || 'New Plan'}”?`,
      message: 'This deletes the plan and everything in it. You can’t undo this.',
      confirmLabel: 'Delete',
    })
    if (!ok) return
    await deletePlan(plan.id)
    navigate('/', { replace: true })
  }

  return (
    <Dropdown label={<Ellipsis size={20} />} ariaLabel="Plan Options" buttonClassName="size-9">
      {(close) => (
        <>
          <MenuLabel>Color</MenuLabel>
          <ColorSwatches
            value={plan.color}
            onChange={(color) => {
              void updatePlan(plan.id, { color })
              close()
            }}
          />
          <MenuSeparator />
          <MenuItem
            icon={plan.hideDone ? <Eye size={16} /> : <EyeOff size={16} />}
            onClick={() => {
              close()
              void updatePlan(plan.id, { hideDone: !plan.hideDone })
            }}
          >
            {plan.hideDone ? 'Show Completed' : 'Hide Completed'}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            destructive
            icon={<Trash2 size={16} />}
            onClick={() => {
              close()
              void remove()
            }}
          >
            Delete Plan
          </MenuItem>
        </>
      )}
    </Dropdown>
  )
}

function PlanHeader({ plan, items }: { plan: Plan; items: Item[] }) {
  const location = useLocation()
  const focusTitle = (location.state as { focusTitle?: boolean } | null)?.focusTitle ?? false
  const open = items.filter((i) => i.status !== 'done').length
  const done = items.length - open
  // The plan's colour, nudged toward the text colour so light tints stay readable.
  const ink = { color: `color-mix(in srgb, ${colorVar(plan.color)} 84%, var(--label))` } as CSSProperties

  return (
    <header className="flex flex-col gap-1">
      <div className="flex items-start gap-4">
        <InlineInput
          value={plan.title}
          onCommit={(title) => updatePlan(plan.id, { title })}
          autoFocus={focusTitle}
          wrap
          placeholder="New Plan"
          aria-label="Plan title"
          style={ink}
          className="min-w-0 flex-1 font-display text-large-title font-bold tracking-[-0.022em]"
        />
        <span className="font-display text-large-title font-bold tabular-nums" style={ink} aria-label={`${open} not done`}>
          {open}
        </span>
      </div>
      <InlineInput
        value={plan.description}
        onCommit={(description) => updatePlan(plan.id, { description })}
        allowEmpty
        multiline
        placeholder="Add Notes"
        aria-label="Plan notes"
        className="text-subhead text-label-2"
      />
      {done > 0 && (
        <p className="mt-2 flex items-center gap-3 text-subhead text-label-2 tabular-nums">
          <span>{done} Completed</span>
          <button type="button" onClick={() => updatePlan(plan.id, { hideDone: !plan.hideDone })} className="text-tint hover:opacity-80">
            {plan.hideDone ? 'Show' : 'Hide'}
          </button>
        </p>
      )}
    </header>
  )
}
