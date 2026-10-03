import { cn } from '../lib/cn'

interface Props<T extends string> {
  label: string
  options: { value: T; label: string; className?: string }[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export function Segmented<T extends string>({ label, options, value, onChange, size = 'md' }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-fit flex-wrap rounded-lg bg-tint p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md font-medium transition-colors',
            size === 'sm' ? 'px-2.5 py-[3px] text-[13px]' : 'px-3.5 py-1 text-[13.5px]',
            value === o.value ? cn('bg-card shadow-paper', o.className ?? 'text-ink') : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
