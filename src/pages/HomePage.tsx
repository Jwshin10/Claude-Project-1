import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PlanList } from '../components/PlanList'
import { createPlan } from '../db/actions'
import { db } from '../db/db'
import { useIsCompact } from '../lib/useMediaQuery'

export function HomePage() {
  const compact = useIsCompact()
  const first = useLiveQuery(async () => (await db.plans.orderBy('position').first()) ?? null)
  const navigate = useNavigate()

  // On phones the plan list is the first screen, as in Reminders.
  if (compact) return <PlanList variant="screen" />
  if (first === undefined) return null
  if (first) return <Navigate to={`/plan/${first.id}`} replace />

  const start = async () => {
    const id = await createPlan()
    navigate(`/plan/${id}`, { state: { focusTitle: true } })
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-title-2 font-bold">No Plans</h1>
      <p className="max-w-[22rem] text-subhead text-label-2">Make a plan for a trip, a project or your week, then split it into groups.</p>
      <button
        type="button"
        onClick={start}
        className="mt-4 flex h-[38px] items-center gap-1.5 rounded-full bg-tint px-5 text-body font-semibold text-on-tint hover:brightness-110"
      >
        <Plus size={18} strokeWidth={2.4} /> New Plan
      </button>
    </div>
  )
}
