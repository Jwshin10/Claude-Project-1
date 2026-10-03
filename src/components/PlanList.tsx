import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, CircleX, Plus, Settings } from 'lucide-react'
import { NavLink, useMatch, useNavigate } from 'react-router-dom'
import { createPlan, deletePlan } from '../db/actions'
import { db } from '../db/db'
import type { Plan } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { PlanIcon } from './PlanIcon'

/**
 * Every plan, with its open-item count and a delete button. On wide screens
 * this is the sidebar; on phones it is the app's first screen, as in Reminders.
 */
export function PlanList({ variant }: { variant: 'sidebar' | 'screen' }) {
  const plans = useLiveQuery(() => db.plans.orderBy('position').toArray())
  const counts = useLiveQuery(async () => {
    const counts = new Map<string, { open: number; total: number }>()
    await db.items.each((item) => {
      const c = counts.get(item.planId) ?? { open: 0, total: 0 }
      c.total += 1
      if (item.status !== 'done') c.open += 1
      counts.set(item.planId, c)
    })
    return counts
  })
  const navigate = useNavigate()
  const openPlanId = useMatch('/plan/:planId')?.params.planId
  const screen = variant === 'screen'

  const newPlan = async () => {
    const id = await createPlan()
    navigate(`/plan/${id}`, { state: { focusTitle: true } })
  }

  const removePlan = async (plan: Plan) => {
    const total = counts?.get(plan.id)?.total ?? 0
    const ok = await confirmAction({
      title: `Delete “${plan.title || 'New Plan'}”?`,
      message: total > 0 ? `This deletes the plan and its ${total} item${total === 1 ? '' : 's'}. You can’t undo this.` : 'You can’t undo this.',
      confirmLabel: 'Delete',
    })
    if (!ok) return
    await deletePlan(plan.id)
    if (plan.id === openPlanId) navigate('/', { replace: true })
  }

  const rows = plans?.map((plan) => {
    const open = counts?.get(plan.id)?.open ?? 0
    return (
      <li key={plan.id} className={cn('group/plan relative flex items-center', screen && 'pl-4 before:absolute before:top-0 before:right-0 before:left-[3.75rem] before:h-px before:bg-separator first:before:hidden')}>
        <NavLink
          to={`/plan/${plan.id}`}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-1 items-center gap-3',
              screen ? 'min-h-[52px]' : 'h-10 rounded-[10px] pr-[3.75rem] pl-2.5',
              !screen && (isActive ? 'bg-fill-3' : 'hover:bg-fill-4'),
            )
          }
        >
          <PlanIcon color={plan.color} size={screen ? 30 : 26} />
          <span className={cn('min-w-0 flex-1 truncate', screen ? 'text-body' : 'text-callout font-medium')}>{plan.title || 'New Plan'}</span>
        </NavLink>
        <div className={cn('pointer-events-none flex h-full items-center gap-1', screen ? 'absolute inset-y-0 right-0 left-[3.75rem] justify-end pr-3' : 'absolute right-1.5')}>
          <span className="text-callout text-label-2 tabular-nums">{open > 0 ? open : ''}</span>
          <button
            type="button"
            onClick={() => void removePlan(plan)}
            aria-label={`Delete ${plan.title || 'New Plan'}`}
            title="Delete Plan"
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full text-label-3 transition-colors hover:text-red"
          >
            <CircleX size={17} />
          </button>
          {screen && <ChevronRight size={18} className="text-label-3" aria-hidden />}
        </div>
      </li>
    )
  })

  if (screen) {
    return (
      <div className="min-h-full bg-grouped pb-12">
        <div className="material sticky top-0 z-20 flex h-[52px] items-center justify-end px-3">
          <button type="button" onClick={newPlan} aria-label="New Plan" title="New Plan" className="flex size-11 items-center justify-center text-tint">
            <Plus size={24} />
          </button>
        </div>
        <div className="flex flex-col gap-7 px-4">
          <h1 className="font-display text-large-title font-bold tracking-[-0.02em]">Plans</h1>
          <ul className="overflow-hidden rounded-[12px] bg-elevated">{rows}</ul>
          <ul className="overflow-hidden rounded-[12px] bg-elevated">
            <li className="pl-4">
              <NavLink to="/settings" className="flex min-h-[52px] items-center gap-3 pr-3">
                <span className="flex size-[30px] items-center justify-center rounded-full bg-[var(--c-gray)] text-white" aria-hidden>
                  <Settings size={17} />
                </span>
                <span className="flex-1 text-body">Settings &amp; Backup</span>
                <ChevronRight size={18} className="text-label-3" aria-hidden />
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <nav className="flex h-full flex-col gap-1 px-2.5 pt-4 pb-3" aria-label="Plans">
      <div className="flex items-center justify-between pr-1 pl-2.5">
        <h2 className="text-footnote font-semibold text-label-2">My Plans</h2>
        <button
          type="button"
          onClick={newPlan}
          aria-label="New Plan"
          title="New Plan"
          className="flex size-7 items-center justify-center rounded-full text-label-2 hover:bg-fill-3 hover:text-label"
        >
          <Plus size={17} />
        </button>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">{rows}</ul>
      <div className="flex flex-col gap-0.5 border-t border-separator pt-2">
        <button
          type="button"
          onClick={newPlan}
          className="flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-callout font-medium text-tint hover:bg-fill-4"
        >
          <Plus size={18} /> New Plan
        </button>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn('flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-callout font-medium', isActive ? 'bg-fill-3' : 'text-label-2 hover:bg-fill-4')
          }
        >
          <Settings size={17} /> Settings &amp; Backup
        </NavLink>
      </div>
    </nav>
  )
}
