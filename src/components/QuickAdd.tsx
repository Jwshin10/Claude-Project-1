import { Plus } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'

interface Props {
  label: string
  placeholder: string
  onAdd: (text: string) => void
  /** row: a list row with an empty circle; card: under a board column; button: a plain tinted action. */
  variant?: 'row' | 'card' | 'button'
}

/** Add something by typing: Return adds and keeps the field open for the next one. */
export function QuickAdd({ label, placeholder, onAdd, variant = 'row' }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const submit = () => {
    const value = text.trim()
    if (value) onAdd(value)
    setText('')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center text-label-2 transition-colors hover:text-tint',
          variant === 'row' && 'h-11 w-full gap-3 pl-1',
          variant === 'card' && 'h-10 w-full gap-2.5 rounded-[12px] px-3 text-callout hover:bg-fill-4',
          variant === 'button' && 'h-9 gap-1.5 rounded-full px-1 font-medium text-tint',
        )}
      >
        <span className={cn('flex items-center justify-center', variant === 'row' && 'size-[22px]', variant === 'card' && 'size-5')}>
          <Plus size={variant === 'row' ? 20 : 17} strokeWidth={2.2} />
        </span>
        {label}
      </button>
    )
  }

  return (
    <label className={cn('flex items-center', variant === 'row' && 'gap-3 pl-1', variant === 'card' && 'gap-2.5 rounded-[12px] bg-elevated px-3 shadow-card', variant === 'button' && 'gap-2')}>
      <span
        className={cn('shrink-0 rounded-full border-[1.5px] border-label-3', variant === 'card' ? 'size-5' : 'size-[22px]', variant === 'button' && 'hidden')}
        aria-hidden
      />
      <input
        autoFocus
        value={text}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
          if (e.key === 'Escape') {
            setText('')
            setOpen(false)
          }
        }}
        onBlur={() => {
          submit()
          setOpen(false)
        }}
        className={cn(
          'min-w-0 flex-1 bg-transparent caret-tint outline-none',
          variant === 'row' && 'h-11 border-b border-separator text-body',
          variant === 'card' && 'h-10 text-callout',
          variant === 'button' && 'h-9 rounded-[10px] bg-fill-4 px-3 text-body',
        )}
      />
    </label>
  )
}
