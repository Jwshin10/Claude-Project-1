import { List } from 'lucide-react'
import { colorVar, type ColorName } from '../db/types'
import { cn } from '../lib/cn'

/** A plan's icon: a list symbol on a circle in the plan's colour, as in Reminders. */
export function PlanIcon({ color, size = 28, className }: { color: ColorName; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center rounded-full text-white', className)}
      style={{ background: colorVar(color), width: size, height: size }}
    >
      <List size={Math.round(size * 0.55)} strokeWidth={2.6} />
    </span>
  )
}
