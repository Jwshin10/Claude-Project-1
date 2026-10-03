import { Outlet } from 'react-router-dom'
import { useIsCompact } from '../lib/useMediaQuery'
import { ConfirmHost } from './ConfirmHost'
import { PlanList } from './PlanList'

export function Layout() {
  const compact = useIsCompact()
  return (
    <div className="flex h-full">
      {!compact && (
        <aside className="w-[18rem] shrink-0 border-r border-separator bg-sidebar">
          <PlanList variant="sidebar" />
        </aside>
      )}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ConfirmHost />
    </div>
  )
}
