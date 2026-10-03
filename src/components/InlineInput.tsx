import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn'

interface Props {
  value: string
  onCommit: (value: string) => void
  placeholder?: string
  className?: string
  /** When false (the default), clearing the field reverts to the previous value. */
  allowEmpty?: boolean
  multiline?: boolean
  /** Wraps like a textarea but stays one line: Enter saves, newlines are dropped. */
  wrap?: boolean
  /** Focus and select the text on mount, so typing replaces it. */
  autoFocus?: boolean
  style?: CSSProperties
  'aria-label'?: string
}

/**
 * A borderless, always-editable text field. Edits are kept
 * locally and saved on blur, Enter (single-line), or unmount.
 */
export function InlineInput({ value, onCommit, placeholder, className, allowEmpty, multiline, wrap, autoFocus, style, ...rest }: Props) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    // The stored value changed underneath us (another view, an import, ...).
    setSynced(value)
    setDraft(value)
  }

  const commit = (text: string) => {
    const next = multiline && !wrap ? text.trimEnd() : text.trim()
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
    } else if (e.key === 'Enter' && (!multiline || wrap) && !e.nativeEvent.isComposing) {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const shared = {
    value: draft,
    placeholder,
    autoFocus,
    style,
    onFocus: autoFocus ? (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => e.currentTarget.select() : undefined,
    'aria-label': rest['aria-label'] ?? placeholder,
    onChange: (e: { target: { value: string } }) => setDraft(wrap ? e.target.value.replace(/\n/g, ' ') : e.target.value),
    onBlur: () => commit(draft),
    onKeyDown,
    className: cn('w-full bg-transparent outline-none placeholder:text-label-3', className),
  }
  return multiline || wrap ? <textarea rows={1} {...shared} className={cn(shared.className, 'shrink-0 resize-none [field-sizing:content]')} /> : <input {...shared} />
}
