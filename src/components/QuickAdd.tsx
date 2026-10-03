import { Plus } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'

interface Props {
  label: string
  placeholder: string
  onAdd: (text: string) => void
  /** line: an empty ruled line in the list; card: under a board column; tab: a new divider. */
  variant?: 'line' | 'card' | 'tab'
}

/** "Add …" that turns into a field; Enter adds and keeps it open for the next entry. */
export function QuickAdd({ label, placeholder, onAdd, variant = 'line' }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const submit = () => {
    const value = text.trim()
    if (value) onAdd(value)
    setText('')
  }

  const shell = {
    line: 'grid min-h-11 grid-cols-[2.5rem_1fr] items-center',
    card: 'flex min-h-10 items-center gap-2 rounded-md px-2.5',
    tab: 'flex h-9 w-fit items-center gap-2 rounded-t-lg border border-b-0 border-dashed border-rule-strong px-3',
  }[variant]

  const plus = <Plus size={variant === 'line' ? 17 : 15} className={cn(variant === 'line' && 'justify-self-center')} aria-hidden />

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(shell, 'w-full text-left text-ink-3 transition-colors hover:text-accent', variant === 'tab' && 'w-fit')}
      >
        {plus}
        <span className={cn(variant === 'line' && 'pl-3.5')}>{label}</span>
      </button>
    )
  }

  return (
    <label className={cn(shell, 'w-full text-accent', variant === 'line' && 'border-b border-accent/50', variant === 'card' && 'bg-card shadow-paper')}>
      {plus}
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
        className={cn('min-w-0 flex-1 bg-transparent text-ink caret-accent outline-none placeholder:text-ink-3', variant === 'line' && 'pl-3.5')}
      />
    </label>
  )
}
