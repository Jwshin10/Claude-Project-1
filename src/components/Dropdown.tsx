import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'

interface Props {
  label: ReactNode
  ariaLabel: string
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  buttonClassName?: string
  menuClassName?: string
}

export function Dropdown({ label, ariaLabel, children, align = 'right', buttonClassName, menuClassName }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={cn('flex items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink', buttonClassName ?? 'size-8')}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-1.5 min-w-48 rounded-[10px] border border-rule-strong bg-card p-1.5 shadow-paper',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-hover', danger ? 'text-danger' : 'text-ink')}
    >
      {children}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="mx-1 my-1.5 h-px bg-rule" />
}
