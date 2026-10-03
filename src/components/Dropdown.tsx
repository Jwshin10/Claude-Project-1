import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'

interface Props {
  label: ReactNode
  ariaLabel: string
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  buttonClassName?: string
}

/** A pull-down menu in the Apple style: material background, label first, symbol last. */
export function Dropdown({ label, ariaLabel, children, align = 'right', buttonClassName }: Props) {
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
        className={cn('flex items-center justify-center rounded-full text-tint transition-colors hover:bg-fill-3', open && 'bg-fill-3', buttonClassName ?? 'size-8')}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={cn('material absolute top-full z-50 mt-1.5 min-w-[16rem] rounded-[13px] p-[5px] shadow-float', align === 'right' ? 'right-0' : 'left-0')}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ onClick, children, icon, destructive }: { onClick: () => void; children: ReactNode; icon?: ReactNode; destructive?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex h-9 w-full items-center justify-between gap-6 rounded-[8px] px-2.5 text-left text-body hover:bg-fill-3',
        destructive ? 'text-red' : 'text-label',
      )}
    >
      <span>{children}</span>
      {icon && <span className="flex shrink-0 opacity-90">{icon}</span>}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="mx-2.5 my-[5px] h-px bg-separator" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2.5 pt-1.5 pb-1 text-footnote text-label-2">{children}</p>
}
