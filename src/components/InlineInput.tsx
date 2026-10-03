import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn'

interface Props {
  value: string
  onCommit: (value: string) => void
  placeholder?: string
  className?: string
  /** When false (the default), clearing the field reverts to the previous value. */
  allowEmpty?: boolean
  multiline?: boolean
  /** Focus and select the text on mount, so typing replaces it. */
  autoFocus?: boolean
  'aria-label'?: string
}

/**
 * A borderless, always-editable text field (Notion style). Edits are kept
 * locally and saved on blur, Enter (single-line), or unmount.
 */
export function InlineInput({ value, onCommit, placeholder, className, allowEmpty, multiline, autoFocus, ...rest }: Props) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    // The stored value changed underneath us (another view, an import, ...).
    setSynced(value)
    setDraft(value)
  }

  const commit = (text: string) => {
    const next = multiline ? text.trimEnd() : text.trim()
    if (!next && !allowEmpty) {
      setDraft(value)
      return
    }
    if (next !== value) onCommit(next)
  }

  // Save pending edits if the component unmounts mid-edit (e.g. a dialog closes).
  const pending = useRef({ draft, value, commit })
  useEffect(() => {
    pending.current = { draft, value, commit }
  })
  useEffect(
    () => () => {
      const p = pending.current
      if (p.draft !== p.value) p.commit(p.draft)
    },
    [],
  )

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setDraft(value)
      e.currentTarget.blur()
      e.preventDefault()
      e.stopPropagation()
    } else if (e.key === 'Enter' && !multiline && !e.nativeEvent.isComposing) {
      e.currentTarget.blur()
    }
  }

  const shared = {
    value: draft,
    placeholder,
    autoFocus,
    onFocus: autoFocus ? (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => e.currentTarget.select() : undefined,
    'aria-label': rest['aria-label'] ?? placeholder,
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
    onBlur: () => commit(draft),
    onKeyDown,
    className: cn('w-full bg-transparent outline-none placeholder:text-faint', className),
  }
  return multiline ? <textarea rows={1} {...shared} className={cn(shared.className, 'resize-none [field-sizing:content]')} /> : <input {...shared} />
}
