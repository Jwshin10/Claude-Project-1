import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Settings } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { createPlan } from '../db/actions'
import { db } from '../db/db'
import { cn } from '../lib/cn'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-sm', isActive ? 'bg-hover font-medium text-text' : 'text-muted hover:bg-hover hover:text-text')

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const plans = useLiveQuery(() => db.plans.orderBy('position').toArray())
  const navigate = useNavigate()

  const newPlan = async () => {
    const id = await createPlan()
    onNavigate()
    navigate(`/plan/${id}`, { state: { focusTitle: true } })
  }

  return (
    <nav className="flex h-full flex-col gap-4 p-3" aria-label="Plans">
      <div className="flex items-center gap-2 px-2 pt-1">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-6" />
        <span className="font-semibold">Planvoice</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-medium text-faint">Plans</span>
          <button
            type="button"
            onClick={newPlan}
            aria-label="New plan"
            className="flex size-6 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-text"
          >
            <Plus size={16} />
          </button>
        </div>
        <ul className="flex flex-col gap-0.5">
          {plans?.map((plan) => (
            <li key={plan.id}>
              <NavLink to={`/plan/${plan.id}`} onClick={onNavigate} className={linkClass}>
                <span className="w-5 text-center">{plan.icon}</span>
                <span className="truncate">{plan.title || 'Untitled plan'}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={newPlan}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-faint hover:bg-hover hover:text-muted"
        >
          <Plus size={16} className="mx-0.5" /> New plan
        </button>
      </div>

      <NavLink to="/settings" onClick={onNavigate} className={linkClass}>
        <Settings size={16} className="mx-0.5" /> Settings &amp; backup
      </NavLink>
    </nav>
  )
}
