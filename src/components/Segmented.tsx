import { cn } from '../lib/cn'

interface Props<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** An Apple segmented control: equal-width segments, the selected one raised. */
export function Segmented<T extends string>({ label, options, value, onChange, className }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('grid auto-cols-fr grid-flow-col rounded-[9px] bg-fill-3 p-[2px]', className)}>
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-7 rounded-[7px] px-3 text-footnote whitespace-nowrap transition-[background-color,box-shadow] duration-150',
              selected ? 'bg-[var(--selected-segment)] font-semibold shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]' : 'font-medium text-label hover:bg-fill-4',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
