import { Plus } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'

interface Props {
  label: string
  placeholder: string
  onAdd: (text: string) => void
  className?: string
}

/** "+ Add …" button that turns into an input; Enter adds and keeps it open for the next entry. */
export function QuickAdd({ label, placeholder, onAdd, className }: Props) {
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
        className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-faint hover:bg-hover hover:text-muted', className)}
      >
        <Plus size={16} /> {label}
      </button>
    )
  }

  return (
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
      className={cn('w-full rounded-md border border-accent bg-surface px-2 py-1.5 text-sm outline-none', className)}
    />
  )
}
