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
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">📋</div>
      <h1 className="text-2xl font-bold">No plans yet</h1>
      <p className="max-w-sm text-sm text-muted">A plan holds groups (like “Flights” or “Things to do”), and groups hold your items.</p>
      <button
        type="button"
        onClick={start}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
      >
        <Plus size={16} /> Create your first plan
      </button>
    </div>
  )
}
