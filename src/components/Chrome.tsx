import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'

/** The bar at the top of a screen. It floats over content with a material background. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('material sticky top-0 z-20 flex h-[52px] items-center gap-2 border-b border-separator px-3 md:px-6', className)}>{children}</div>
  )
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="-ml-1.5 flex h-11 items-center gap-0.5 pr-2 text-body text-tint">
      <ChevronLeft size={26} strokeWidth={2.3} className="-mr-0.5" />
      {children}
    </Link>
  )
}

/** An inset grouped section: optional header, rounded rows, optional footer. */
export function GroupedSection({ header, footer, children }: { header?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      {header && <h2 className="px-4 text-footnote text-label-2">{header}</h2>}
      <div className="overflow-hidden rounded-[12px] bg-elevated">{children}</div>
      {footer && <p className="px-4 text-footnote text-label-2">{footer}</p>}
    </section>
  )
}

/** A row in a grouped section; separators are inset from the leading edge. */
export function GroupedRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('ml-4 flex min-h-11 items-center gap-3 pr-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-separator', className)}>{children}</div>
}
