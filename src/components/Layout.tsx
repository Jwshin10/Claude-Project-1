import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '../lib/cn'
import { ConfirmHost } from './ConfirmHost'
import { Sidebar } from './Sidebar'

export function Layout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-full">
      {navOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setNavOpen(false)} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border bg-sidebar transition-transform md:static md:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onNavigate={() => setNavOpen(false)} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
            className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-hover"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold">Planvoice</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ConfirmHost />
    </div>
  )
}
