import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Settings, X } from 'lucide-react'
import { NavLink, useMatch, useNavigate } from 'react-router-dom'
import { createPlan, deletePlan } from '../db/actions'
import { db } from '../db/db'
import type { Plan } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { Logo } from './Logo'

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
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

  const removePlan = async (plan: Plan) => {
    const total = counts?.get(plan.id)?.total ?? 0
    const ok = await confirmAction({
      title: `Delete "${plan.title || 'Untitled plan'}"?`,
      message: total > 0 ? `Its ${total} item${total === 1 ? '' : 's'} and all of its groups will be deleted too. This can't be undone.` : "This can't be undone.",
      confirmLabel: 'Delete plan',
    })
    if (!ok) return
    await deletePlan(plan.id)
    if (plan.id === openPlanId) navigate('/', { replace: true })
  }

  const newPlan = async () => {
    const id = await createPlan()
    onNavigate()
    navigate(`/plan/${id}`, { state: { focusTitle: true } })
  }

  return (
    <nav className="flex h-full flex-col gap-6 px-3 pt-5 pb-3" aria-label="Plans">
      <div className="flex items-center gap-2.5 px-2.5">
        <Logo className="size-7" />
        <span className="font-display text-[21px] leading-none">Planvoice</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2.5 pb-1.5">
          <h2 className="text-[13px] font-semibold text-ink-2">Your plans</h2>
          <button
            type="button"
            onClick={newPlan}
            aria-label="New plan"
            title="New plan"
            className="flex size-7 items-center justify-center rounded-md text-ink-2 hover:bg-hover hover:text-ink"
          >
            <Plus size={17} />
          </button>
        </div>
        <ul className="flex flex-col gap-px">
          {plans?.map((plan) => {
            const open = counts?.get(plan.id)?.open ?? 0
            return (
              <li key={plan.id} className="group/plan flex items-center rounded-md hover:bg-hover">
                <NavLink
                  to={`/plan/${plan.id}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn('flex min-w-0 flex-1 items-center gap-2.5 py-[7px] pl-2.5 text-[14.5px]', isActive ? 'font-semibold text-ink' : 'text-ink-2 hover:text-ink')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="w-5 text-center text-[15px]" aria-hidden>
                        {plan.icon || '📋'}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <span className={cn(isActive && 'highlighter')}>{plan.title || 'Untitled plan'}</span>
                      </span>
                      {open > 0 && (
                        <span className="text-xs font-normal text-ink-3 tabular-nums" title={`${open} not done`}>
                          {open}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
                <button
                  type="button"
                  onClick={() => void removePlan(plan)}
                  aria-label={`Delete ${plan.title || 'Untitled plan'}`}
                  title="Delete plan"
                  className="mx-1 flex size-6 shrink-0 items-center justify-center rounded text-ink-3 transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <X size={14} />
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={newPlan}
          className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[14.5px] text-ink-3 hover:bg-hover hover:text-accent"
        >
          <Plus size={16} className="mx-0.5" /> New plan
        </button>
      </div>

      <NavLink
        to="/settings"
        onClick={onNavigate}
        className={({ isActive }) =>
          cn('flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[14.5px]', isActive ? 'font-semibold text-ink' : 'text-ink-2 hover:bg-hover hover:text-ink')
        }
      >
        <Settings size={16} className="mx-0.5" /> Settings &amp; backup
      </NavLink>
    </nav>
  )
}
