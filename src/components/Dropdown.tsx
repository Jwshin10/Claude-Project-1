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
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={cn('flex items-center justify-center rounded-md text-muted hover:bg-hover hover:text-text', buttonClassName ?? 'size-7')}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-1 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-lg',
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
      className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover', danger ? 'text-danger' : 'text-text')}
    >
      {children}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />
}
