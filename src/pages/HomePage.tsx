import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { createPlan } from '../db/actions'
import { db } from '../db/db'

export function HomePage() {
  const first = useLiveQuery(async () => (await db.plans.orderBy('position').first()) ?? null)
  const navigate = useNavigate()

  if (first === undefined) return null
  if (first) return <Navigate to={`/plan/${first.id}`} replace />

  const start = async () => {
    const id = await createPlan()
    navigate(`/plan/${id}`, { state: { focusTitle: true } })
  }

  return (
    <div className="mx-auto flex h-full max-w-[30rem] flex-col justify-center gap-5 px-6 py-12">
      <h1 className="font-display text-[2.2rem] leading-tight">A blank page.</h1>
      <p className="text-ink-2">
        Start a plan for whatever is on your mind: a trip, a move, a project, this week. Split it into groups like
        <span className="text-ink"> Flights</span> or <span className="text-ink">Things to do</span>, then add items to each.
      </p>
      <button
        type="button"
        onClick={start}
        className="flex h-10 w-fit items-center gap-2 rounded-lg bg-accent px-4 text-[15px] font-semibold text-accent-ink hover:brightness-110"
      >
        <Plus size={17} /> Start a plan
      </button>
    </div>
  )
}
