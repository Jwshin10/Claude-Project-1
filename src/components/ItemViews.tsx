import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { Item } from '../db/types'
import { cn } from '../lib/cn'
import { ItemMeta, StatusCheckbox } from './ItemBits'

interface Props {
  item: Item
  onOpen: (id: string) => void
  /** Rendered inside the DragOverlay: not sortable, slightly lifted. */
  overlay?: boolean
}

function useSortableItem(id: string, disabled: boolean) {
  const sortable = useSortable({ id, disabled })
  const style: CSSProperties = { transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }
  return { ...sortable, style }
}

// The title is a real button so keyboard users can open the item; stop its keys
// from reaching the row, where Space/Enter start a keyboard drag instead.
function TitleButton({ item, onOpen, className }: Props & { className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(item.id)
      }}
      onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
      className={cn('min-w-0 text-left break-words outline-none focus-visible:underline', item.status === 'done' && 'text-faint line-through', className)}
    >
      {item.title}
    </button>
  )
}

export function ItemRow({ item, onOpen, overlay = false }: Props) {
  const { setNodeRef, attributes, listeners, style, isDragging } = useSortableItem(item.id, overlay)
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => onOpen(item.id)}
      className={cn(
        'flex cursor-pointer touch-manipulation items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-hover',
        isDragging && 'opacity-30',
        overlay && 'cursor-grabbing bg-surface shadow-lg ring-1 ring-border',
      )}
    >
      <div className="pt-0.5">
        <StatusCheckbox item={item} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <TitleButton item={item} onOpen={onOpen} className="text-sm leading-6" />
        <ItemMeta item={item} className="shrink-0 sm:justify-end" />
      </div>
    </div>
  )
}

export function ItemCard({ item, onOpen, overlay = false }: Props) {
  const { setNodeRef, attributes, listeners, style, isDragging } = useSortableItem(item.id, overlay)
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => onOpen(item.id)}
      className={cn(
        'flex cursor-pointer touch-manipulation flex-col gap-2 rounded-lg border border-border bg-surface p-2.5 shadow-sm hover:border-faint',
        isDragging && 'opacity-30',
        overlay && 'rotate-1 cursor-grabbing shadow-xl',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="pt-0.5">
          <StatusCheckbox item={item} size={16} />
        </div>
        <TitleButton item={item} onOpen={onOpen} className="flex-1 text-sm leading-5" />
      </div>
      <ItemMeta item={item} />
    </div>
  )
}
