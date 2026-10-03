import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '../lib/cn'
import { ConfirmHost } from './ConfirmHost'
import { Logo } from './Logo'
import { Sidebar } from './Sidebar'

export function Layout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-full">
      {navOpen && <div className="fixed inset-0 z-30 bg-[rgba(18,23,38,0.42)] md:hidden" onClick={() => setNavOpen(false)} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[16.5rem] shrink-0 bg-desk transition-transform duration-200 md:static md:translate-x-0',
          navOpen ? 'translate-x-0 shadow-paper' : '-translate-x-full',
        )}
      >
        <Sidebar onNavigate={() => setNavOpen(false)} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-rule bg-paper px-3 py-2 md:hidden">
          <button
            type="button"
            aria-label="Open plans"
            onClick={() => setNavOpen(true)}
            className="flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-hover"
          >
            <Menu size={19} />
          </button>
          <Logo className="size-6" />
          <span className="font-display text-lg">Planvoice</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ConfirmHost />
    </div>
  )
}
